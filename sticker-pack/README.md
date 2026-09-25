# My Pet Rocks: Free WhatsApp Sticker Pack (handoff for Audos)

A paying customer lands on their downloads page. It automatically makes 9 cartoon stickers of their pet (happy, sad, grumpy, in love...). They can save them and add them to WhatsApp. Everything is free, as a gift for buying.

This folder is the complete, working version that was live on mypet.rocks. It was copied from the real code on 2026-09-25 and matches what was live.

---

## What's in this folder

| File | What it is |
|---|---|
| `CURSOR-PROMPT.md` | Paste this into Audos's Cursor. It tells their AI exactly what to build. |
| `WHATSAPP-GUIDE.md` | The short customer guide for adding stickers to WhatsApp. |
| `code/backend/generate-sticker-sheet.ts` | **The AI step.** Sends the pet photo + the style image + the prompt to the image AI. Full file. |
| `code/backend/fal-webhook-sticker-excerpt.ts` | **The "it's done" step.** When the AI finishes, this saves the image and marks the order complete. Only the sticker parts of a bigger shared file. |
| `code/frontend/StickerGift.tsx` | **The cutter + the screen.** Cuts the 9-sticker sheet into 9 separate stickers and shows them with download buttons. Full file. |
| `code/frontend/WhatsAppStickerGuide.tsx` | The pop-up with the WhatsApp steps. Full file. |
| `code/frontend/downloads-page-wiring-excerpt.tsx` | How the downloads page shows one sticker pack per pet. Excerpt. |
| `code/database/20260612140000_sticker_sheet_gift.sql` | The two database columns the feature needs. |
| `examples/example-full-sheet.png` | What the AI sends back BEFORE cutting: one 2048×2048 image with 9 stickers. |
| `examples/Beans-sticker-*.png` | A real finished set AFTER cutting: 9 stickers at 512×512. Show Audos this so they know what "right" looks like. |
| `assets/sticker-style-reference.png` | The style reference (image 2). One single sticker, cut from the example sheet. See "The style reference image" below. |

---

## How it works, in 4 steps

Think of a photo booth that prints one sheet with 9 small photos on it, and then you cut them apart with scissors.

**1. The customer pays and opens their downloads page.**
The sticker card starts working on its own. No button to press. (`StickerGift.tsx`, the "AUTO-GENERATE on mount" part.)

**2. The AI draws ONE image with all 9 stickers on it.**
The server (`generate-sticker-sheet.ts`) sends three things to Fal.ai, the image AI company. The model is `fal-ai/nano-banana-pro/edit`:
- **Image 1:** the customer's pet photo. This decides *who* is in the stickers.
- **Image 2:** a single cartoon "style reference" picture. This decides *how they're drawn*.
- **The prompt:** "make a 3×3 grid, 9 equal squares, white background, same pet, 9 different expressions, copy only the style of image 2."

Settings: square (1:1), PNG, 2K resolution, 1 image.

Why one image and not 9 separate ones? One AI call is about 9× cheaper and faster. And the pet looks exactly the same in all 9, because they were drawn together.

**3. The AI finishes and tells us.**
Fal.ai sends a webhook (a message saying "done, here's the picture"). The webhook handler downloads the sheet, saves it in our own storage at `sticker-sheets/<orderId>/grid-<time>.png`, and sets the order to `complete`.

The customer's page is listening for that change through a realtime subscription (the page keeps a live line open to the database, so it hears "complete" the instant it happens, without refreshing). The sticker pack then appears by itself.

**4. The customer's browser cuts the sheet into 9 stickers.**
This happens on the customer's phone or computer, not on our server. See the next section.

---

## The cutting, exactly

The code is the `sliceGrid` function in `StickerGift.tsx`. It uses the HTML canvas (a blank drawing board built into every web browser that code can paint pictures onto and then save as an image file).

1. Load the full sheet image.
2. Divide its width by 3 and its height by 3. That gives the size of one square.
3. Go row by row, left to right: top-left first, bottom-right last.
4. For each square, copy that piece onto a fresh 512×512 canvas. **512×512 is the size WhatsApp wants for stickers.**
5. Save each canvas as a PNG.
6. Name them in order: `happy, squirrel, sad, grumpy, love, surprised, unimpressed, curious, hungry`. File names look like `Beans-sticker-happy.png`.

**Why this works:** the prompt tells the AI to make "9 equal square panels, even gutters" and to "center each character with margin so it crops cleanly." So straight cuts at exactly one-third and two-thirds land in the white gaps between stickers.

**Safety nets built in:**
- If cutting fails for any reason, the customer can still download the full sheet. They never get nothing.
- If the result isn't exactly 9 stickers, the cutter stops rather than putting wrong names on wrong pictures.

**What the cutter does NOT do:** it doesn't remove the white background. It doesn't need to, because WhatsApp's sticker maker removes it automatically.

**Important rule:** the order of the 9 expressions in the prompt (`EXPRESSIONS` in `generate-sticker-sheet.ts`) must match the order of the names in the cutter (`STICKER_LABELS` in `StickerGift.tsx`). If someone changes one list and not the other, "happy" will be labeled "sad".

---

## The 9 expressions (exact wording sent to the AI)

1. happy smiling
2. alert wide-eyed "saw a squirrel"
3. very sad holding tears back (no tears showing)
4. grumpy
5. looking up lovingly, with super-glossy sparkling anime eyes with reflections shaped like hearts, butterflies and stars
6. surprised shocked
7. unimpressed deadpan with half-lidded eyes and a flat mouth
8. head tilted, cocking the head curiously with big kawaii eyes
9. hungry drooling

---

## How we got here (the lessons)

- **Style: flat-color adult cartoon.** Bold outlines, flat colors, and a white die-cut border like a real sticker. It started as a "kawaii" anime style and was switched on 2026-06-21. Some old comments and one line of customer text still say "kawaii". Audos can update that text.
- **Use ONE character as the style reference, not a full sticker sheet.** When we gave the AI a whole 3×3 sheet as the style example, it copied the *example dog's body shape* into the customer's pet. A single character image fixed that. It copies only the drawing style.
- **Tell the AI what NOT to copy.** The prompt says "do not copy image 2's breed, colors, or collar." Without that, the reference dog's collar kept showing up.
- **Expression #3 was softened** to "holding tears back (no tears showing)". Real tears looked upsetting.
- **One pack per pet.** A customer with 3 pets gets 3 separate sticker packs, and they all stay. An earlier bug replaced older pets' packs with the newest one. It was fixed by giving each pet its own card, tied to that pet's order.
- **Changing the style needs no code.** The server just reads whatever image sits at the reference address. Swap the image and the style changes.

---

## Safety and reliability (so Audos keeps these)

- **Only paying customers.** The server checks that the person is logged in, owns the order, and the order is paid (`processing` or `complete`).
- **Never charged twice.** If the pack is already made or already being made, the server returns that instead of paying the AI again.
- **Never stuck spinning.** If no answer comes back within 90 seconds, the screen shows "Try again". If anything breaks mid-way, the order is set to `failed` so the retry button appears.
- **A failed pack isn't retried automatically.** It only restarts when the customer taps "Try again", so we don't pay for repeated failures.
- **Phones get one file.** iPhones block many downloads at once. So on phones, "Download" saves the full sheet, and the customer long-presses each sticker to save it. On computers, "Download all 9" saves 9 separate files.

---

## The style reference image

The old code pointed at `.../style-assets/sticker-style/reference.png` in the old Supabase storage. That address no longer works. The server was gone when I tried on 2026-09-25.

So `assets/sticker-style-reference.png` is now the top-left "happy" sticker, cut from `examples/example-full-sheet.png`. It's a single character, in the right style, and 512×512. **Audos must host it at a public web address and put that address in `STICKER_STYLE_REFERENCE_URL`.**

Don't use the full 9-sticker sheet as the reference. That's the lesson above: a full sheet makes the AI copy the example dog's body shape.

**Cutter test on the example sheet (2026-09-25):** all 4 cut lines land in the white gaps (0 dark pixels on them), and none of the 9 stickers is clipped at the edge.

Note: in the example sheet, the "sad" sticker shows tears. The current prompt says "no tears showing", so newer sheets shouldn't.

## Setup Audos needs

- A Fal.ai API key, stored as a secret named `FAL_KEY`. Never put it in the code.
- Two new columns on the orders table: `sticker_sheet_url` and `sticker_sheet_status` (see the `.sql` file).
- A storage place for the finished sheets. It must be publicly readable, or the customer's browser can't load the sheet to cut it.
- Webhook address: Fal.ai must be able to reach the "it's done" handler from the internet.
