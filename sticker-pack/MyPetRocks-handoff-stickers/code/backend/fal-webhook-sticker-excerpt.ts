// EXCERPT from supabase/functions/fal-webhook/index.ts (the sticker parts only).
// The webhook is shared with other features; only these pieces are sticker-specific.

// Handle sticker-sheet completion — store the 3x3 grid on the order.
async function handleStickerSheetCompletion(
  job: ReplicateJob,
  outputUrl: string,
  supabase: SupabaseClient
): Promise<boolean> {
  const orderId = job.order_id || job.input_payload?.order_id;
  if (!orderId) {
    console.error("No order_id for sticker-sheet job");
    return false;
  }

  const storagePath = `sticker-sheets/${orderId}/grid-${Date.now()}.png`;
  const storedUrl = await downloadAndUploadImage(outputUrl, storagePath, supabase);

  if (!storedUrl) {
    await supabase.from("orders").update({ sticker_sheet_status: "failed" }).eq("id", orderId);
    return false;
  }

  const { error } = await supabase
    .from("orders")
    .update({ sticker_sheet_url: storedUrl, sticker_sheet_status: "complete" })
    .eq("id", orderId);

  if (error) {
    console.error("Error updating order sticker sheet:", error);
    // The image stored fine but we couldn't mark the order complete — reset to
    // 'failed' so the order doesn't get stranded at 'generating' (UI would hang).
    await supabase
      .from("orders")
      .update({ sticker_sheet_status: "failed" })
      .eq("id", orderId);
    return false;
  }

  console.log(`Sticker sheet stored for order ${orderId}: ${storedUrl}`);
  return true;
}

// ...inside the webhook handler, after the job is looked up:
    // Classify job type: free gift preview, sticker sheet, make-it-real composite, or paid portrait
    const isStickerSheetJob = job.input_payload?.request_type === 'sticker_sheet';
    const isMakeItRealJob = job.input_payload?.request_type === 'make_it_real';
// ...
      if (isStickerSheetJob) {
        // FREE STICKER-SHEET GIFT JOB
        const success = await handleStickerSheetCompletion(job, outputUrl, supabase);

        await supabase
          .from("replicate_jobs")
          .update({
            status: success ? 'completed' : 'failed',
            output_url: outputUrl,
            webhook_received_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            error_message: success ? null : 'Failed to store sticker sheet',
          })
          .eq("id", job.id);

        return new Response(JSON.stringify({ success }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

// Helper used above:
async function downloadAndUploadImage(
  sourceUrl: string,
  storagePath: string,
  supabase: SupabaseClient,
  opts: { bucket?: string; returnPath?: boolean } = {}
): Promise<string | null> {
  const bucket = opts.bucket ?? 'generated-images';

  // SSRF guard: this URL comes from the (forgeable, verify_jwt=false) webhook
  // body. Block non-https + private/metadata IP literals ALWAYS; the Fal-host
  // allowlist is warn-only until FAL_OUTPUT_ENFORCE=true (so an incomplete list
  // can't drop legitimate downloads — logs surface the real hosts first).
  const enforceOutputHost = Deno.env.get("FAL_OUTPUT_ENFORCE") === "true";
  const verdict = checkFalOutputUrl(sourceUrl, enforceOutputHost);
  // Rollout telemetry (non-blocking): record the guard verdict + host so we can
  // see which output hosts appear before flipping FAL_OUTPUT_ENFORCE.
  await recordFalObservation(supabase, "output_url", verdict.allowed, verdict.reason, urlHostForLog(sourceUrl));
  if (!verdict.allowed) {
    console.error(`[fal-webhook] blocked outputUrl fetch: reason=${verdict.reason} host=${urlHostForLog(sourceUrl)}`);
    return null;
  }
  if (verdict.reason === "host_not_allowlisted_warn") {
    console.warn(`[fal-webhook] outputUrl host not on Fal allowlist (warn-only, set FAL_OUTPUT_ENFORCE=true to block): ${urlHostForLog(sourceUrl)}`);
  }

  try {
    console.log("Downloading from Fal.ai CDN...");
    // redirect: 'manual' closes an SSRF-guard bypass — an allowlisted fal.media
    // URL could 302 to an internal target, which the pre-fetch host check above
    // wouldn't catch. With manual redirects an opaque 3xx comes back as status 0
    // (not ok) so we never follow it; Fal CDN serves files directly (200).
    const response = await fetch(sourceUrl, { redirect: 'manual' });
    if (response.type === 'opaqueredirect' || (response.status >= 300 && response.status < 400)) {
      console.error(`[fal-webhook] blocked outputUrl redirect (SSRF guard): host=${urlHostForLog(sourceUrl)}`);
      return null;
    }
    if (!response.ok) {
      console.error("Failed to download image:", response.status);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    const { error } = await supabase.storage
      .from(bucket)
      .upload(storagePath, bytes, {
        contentType: 'image/png',
        upsert: true,
      });

    if (error) {
      console.error("Storage upload error:", error);
      return null;
    }

    // Private bucket → caller persists the PATH (no public URL exists for it).
    if (opts.returnPath) {
      console.log("Uploaded to private storage path:", storagePath);
      return storagePath;
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(storagePath);

    console.log("Uploaded to storage:", urlData.publicUrl);
    return urlData.publicUrl;
  } catch (err) {
    console.error("Error uploading to storage:", err);
    return null;
  }
}
