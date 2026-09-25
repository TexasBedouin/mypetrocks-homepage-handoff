import { createClient } from "npm:@supabase/supabase-js@2";

// Generates a free WhatsApp sticker gift for a PAID order: one sakura-kawaii
// 3x3 grid of the pet showing 9 expressions, in a single fal.ai generation.
// The client slices the grid into 9 individual stickers. Completion is handled
// by fal-webhook (request_type: 'sticker_sheet').

const VERSION = "1.1.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FAL_MODEL = "fal-ai/nano-banana-pro/edit";

// Style reference (image 2): the model copies ONLY its art style, not its subject.
// Public URL in the style-assets bucket so Fal.ai can fetch it. Replace the file at
// this exact path to change the sticker art style — no code change needed.
const STICKER_STYLE_REFERENCE_URL =
  "https://kvkdxegocalshvshtjme.supabase.co/storage/v1/object/public/style-assets/sticker-style/reference.png";

// The 9 expressions, left-to-right, top-to-bottom — must match the slicer order in the UI
// (src/components/downloads/StickerGift.tsx STICKER_LABELS).
const EXPRESSIONS = [
  "happy smiling",
  `alert wide-eyed "saw a squirrel"`,
  "very sad holding tears back (no tears showing)",
  "grumpy",
  "looking up lovingly and the eyes must be super-glossy, sparkling anime eyes with multiple reflections in adorable shapes like hearts, butterflies and stars",
  "surprised shocked",
  "unimpressed deadpan with half-lidded eyes and a flat mouth",
  "head tilted, cocking the head curiously with big eyes like Kawaii",
  "hungry drooling",
];

const STICKER_PROMPT = `Create a single image: a clean 3x3 grid (9 equal square panels, even gutters, white background) of cartoon sticker emojis of the pet in image 1, preserving ITS real fur colors, markings, ear shape and face. Copy ONLY the art style of image 2 (a flat-color adult-cartoon sitcom sticker style — bold even outlines, flat colors, die-cut white sticker border); do not copy image 2's breed, colors, or collar. Each of the 9 panels shows the SAME pet (from image 1) with a DIFFERENT expression, left-to-right top-to-bottom: ${EXPRESSIONS.map((e, i) => `${i + 1}) ${e}`).join(", ")}. Center each character with margin so it crops cleanly. No text, no watermark, no extra objects. Flat solid white background behind the whole grid.`;

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Hoisted so the outer catch can roll an order back out of 'generating' if
  // anything throws after we flipped it (a thrown fetch to fal, an insert that
  // rejects, a malformed json) — otherwise the order would hang there forever.
  // deno-lint-ignore no-explicit-any
  let rollbackClient: any = null;
  let rollbackOrderId: string | null = null;
  let markedGenerating = false;

  try {
    const requestBody = await req.json();
    if (requestBody?.health_check === true) {
      return jsonResponse({ status: "healthy", _version: VERSION });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Not authenticated" }, 401);
    }

    const FAL_KEY = Deno.env.get("FAL_KEY");
    if (!FAL_KEY) {
      return jsonResponse({ error: "AI service not configured" }, 500);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return jsonResponse({ error: "Not authenticated" }, 401);
    }
    const user = userData.user;

    const { orderId } = requestBody;
    if (!orderId) {
      return jsonResponse({ error: "Missing orderId" }, 400);
    }
    rollbackClient = supabase;
    rollbackOrderId = orderId;

    // Load order, verify ownership + paid status
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, user_id, pet_id, status, sticker_sheet_status, sticker_sheet_url")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return jsonResponse({ error: "Order not found" }, 404);
    }
    if (order.user_id !== user.id) {
      return jsonResponse({ error: "Order does not belong to user" }, 403);
    }
    if (order.status !== "processing" && order.status !== "complete") {
      return jsonResponse({ error: "Sticker gift unlocks after purchase", retryable: true }, 409);
    }

    // Idempotency: don't regenerate if already done or in progress
    if (order.sticker_sheet_status === "complete" && order.sticker_sheet_url) {
      return jsonResponse({ alreadyComplete: true, stickerSheetUrl: order.sticker_sheet_url });
    }
    if (order.sticker_sheet_status === "generating") {
      return jsonResponse({ pending: true, alreadyGenerating: true });
    }
    if (!order.pet_id) {
      return jsonResponse({ error: "Order has no pet" }, 400);
    }

    const { data: pet, error: petError } = await supabase
      .from("pets")
      .select("id, original_image_url")
      .eq("id", order.pet_id)
      .single();

    if (petError || !pet) {
      return jsonResponse({ error: "Pet not found" }, 404);
    }
    if (!pet.original_image_url) {
      return jsonResponse({ error: "Pet has no photo" }, 400);
    }

    const inputPayload = {
      prompt: STICKER_PROMPT,
      // image 1 = the pet (subject + likeness); image 2 = the style reference.
      image_urls: [pet.original_image_url, STICKER_STYLE_REFERENCE_URL],
      aspect_ratio: "1:1",
      output_format: "png",
      resolution: "2K",
      num_images: 1,
    };

    // Mark generating up front so the UI can subscribe and dupes are blocked.
    // If THIS write fails we must not continue — otherwise the UI would never
    // see a status to react to.
    const { error: markErr } = await supabase
      .from("orders")
      .update({ sticker_sheet_status: "generating" })
      .eq("id", orderId);
    if (markErr) {
      console.error("Failed to mark order generating:", markErr);
      return jsonResponse({ error: "Could not start generation" }, 500);
    }
    markedGenerating = true;

    const { data: job, error: jobError } = await supabase
      .from("replicate_jobs")
      .insert({
        user_id: user.id,
        order_id: orderId,
        pet_image_url: pet.original_image_url,
        input_payload: { ...inputPayload, request_type: "sticker_sheet", order_id: orderId },
        status: "pending",
      })
      .select()
      .single();

    if (jobError || !job) {
      console.error("Failed to create sticker job:", jobError);
      await supabase.from("orders").update({ sticker_sheet_status: null }).eq("id", orderId);
      return jsonResponse({ error: "Failed to start generation" }, 500);
    }

    const webhookUrl = `${supabaseUrl}/functions/v1/fal-webhook`;
    const falQueueUrl = `https://queue.fal.run/${FAL_MODEL}?fal_webhook=${encodeURIComponent(webhookUrl)}`;

    const response = await fetch(falQueueUrl, {
      method: "POST",
      headers: { "Authorization": `Key ${FAL_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(inputPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Fal.ai API error:", response.status, errorText);
      await supabase.from("replicate_jobs").update({ status: "failed", error_message: `Fal.ai ${response.status}` }).eq("id", job.id);
      await supabase.from("orders").update({ sticker_sheet_status: "failed" }).eq("id", orderId);
      return jsonResponse({ error: "AI service temporarily unavailable" }, 500);
    }

    const queueResponse = await response.json();
    const requestId = queueResponse.request_id;
    if (!requestId) {
      // Without a request_id the webhook can never match this job — fail fast
      // instead of leaving the order stuck in "generating" forever.
      console.error("No request_id in fal response:", JSON.stringify(queueResponse).slice(0, 200));
      await supabase.from("replicate_jobs").update({ status: "failed", error_message: "No request_id from Fal.ai" }).eq("id", job.id);
      await supabase.from("orders").update({ sticker_sheet_status: "failed" }).eq("id", orderId);
      return jsonResponse({ error: "AI service returned invalid response" }, 500);
    }

    await supabase
      .from("replicate_jobs")
      .update({ replicate_prediction_id: requestId, status: "processing", started_at: new Date().toISOString() })
      .eq("id", job.id);

    console.log(`Sticker sheet enqueued for order ${orderId} (fal ${requestId})`);

    return jsonResponse({ pending: true, jobId: job.id });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("generate-sticker-sheet error:", errorMessage);
    // Best-effort rollback: if we'd already flipped the order to 'generating',
    // reset it to 'failed' so the UI shows a retry instead of an endless spinner.
    if (markedGenerating && rollbackClient && rollbackOrderId) {
      const { error: rbErr } = await rollbackClient
        .from("orders")
        .update({ sticker_sheet_status: "failed" })
        .eq("id", rollbackOrderId);
      if (rbErr) console.error("Sticker rollback failed:", rbErr);
    }
    return jsonResponse({ error: "Internal error" }, 500);
  }
});
