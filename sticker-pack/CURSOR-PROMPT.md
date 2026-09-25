# Paste this into Cursor (Audos)

---

Rebuild the "Free WhatsApp Sticker Pack" feature for MyPet.Rocks, using the reference code in this folder. The reference code ran in production on a React + Supabase + Fal.ai stack. Keep the behaviour identical, and adapt the plumbing (database calls, storage, auth, realtime) to our current stack. Read `README.md` first. It explains every piece and the reasons behind it.

**What the feature does**
When a customer with a paid order opens their downloads page, generate (automatically, once) a 3×3 sheet of 9 cartoon stickers of their pet in one AI call. Cut it into 9 separate 512×512 PNG stickers in the browser. Show them with download buttons and a "How to add to WhatsApp" pop-up.

**Build these parts (reference file in brackets):**

1. **Database:** add `sticker_sheet_url` (text) and `sticker_sheet_status` (text: null | generating | complete | failed) to orders. [`code/database/20260612140000_sticker_sheet_gift.sql`]

2. **Generate endpoint** [`code/backend/generate-sticker-sheet.ts`]. Keep all of it:
   - Require a logged-in user who owns the order. The order status must be `processing` or `complete`.
   - Don't generate twice: if already complete, return the URL. If generating, return "pending".
   - Set status to `generating` BEFORE calling the AI. On any error afterwards, set it to `failed`.
   - Call Fal.ai model `fal-ai/nano-banana-pro/edit` through its queue, with a webhook. Send `image_urls: [petPhotoUrl, STICKER_STYLE_REFERENCE_URL]`, `aspect_ratio: "1:1"`, `output_format: "png"`, `resolution: "2K"`, `num_images: 1`.
   - Use `STICKER_PROMPT` and the `EXPRESSIONS` list **word for word**.
   - `FAL_KEY` comes from a server secret, never from code.

3. **Style reference image:** host `assets/sticker-style-reference.png` at a public URL and set `STICKER_STYLE_REFERENCE_URL` to it. It must be a SINGLE character, never a full sheet.

4. **Completion webhook** [`code/backend/fal-webhook-sticker-excerpt.ts`]: when Fal.ai calls back for a job with `request_type: "sticker_sheet"`, download the image and store it at `sticker-sheets/<orderId>/grid-<timestamp>.png` in publicly readable storage. Then set `sticker_sheet_url` and `sticker_sheet_status = "complete"`. On any failure, set `failed`. Keep the SSRF guard: don't follow redirects on the download.

5. **Sticker card** [`code/frontend/StickerGift.tsx`]. Keep all of it:
   - Auto-start on first view only when status is empty. Never auto-restart a `failed` one.
   - Listen for the order changing to complete or failed (realtime, or polling every few seconds if we have no realtime). Do one catch-up read right after subscribing.
   - 90-second timeout, then show "Try again".
   - The `sliceGrid` cutter: width÷3 and height÷3. Go left to right, top to bottom. Draw each cell onto a 512×512 canvas and save it as PNG. If you don't get exactly 9, throw, and fall back to downloading the full sheet.
   - Load the sheet with `crossOrigin = "anonymous"`. Storage must send CORS headers, or the canvas can't export.
   - `STICKER_LABELS` order must match `EXPRESSIONS` order.
   - Phones: one "Download sticker sheet" button, plus a "long-press to save" tip. Desktop: "Download all 9", staggered 250 ms apart.

6. **One pack per pet** [`code/frontend/downloads-page-wiring-excerpt.tsx`]: show one sticker card per paid pet (newest paid, non-refunded order per pet). Never let a new pet's pack replace an older pet's pack.

7. **WhatsApp pop-up** [`code/frontend/WhatsAppStickerGuide.tsx`]: same 6 steps and the same fallback note. The text is also in `WHATSAPP-GUIDE.md`.

**Update this customer-facing text:** the card says "9 kawaii stickers". Change it to "9 cartoon stickers". The style is no longer kawaii.

**Done when:**
- A test paid order produces a sheet that looks like `examples/example-full-sheet.png`.
- It cuts into 9 clean stickers like `examples/Beans-sticker-*.png`, with correct names (happy, squirrel, sad, grumpy, love, surprised, unimpressed, curious, hungry).
- Refreshing the page mid-generation doesn't start a second AI job.
- A customer with 2 paid pets sees 2 separate packs.
