# MyPet.Rocks homepage redesign: handoff

**What this is:** a new homepage built around the brand line *"Your world, with your pet in it."* It was designed and approved by Amer, then built and tested locally on 2026-09-24. Paste `CURSOR_PROMPT.md` into Audos's Cursor to rebuild it on the live site.

**Built on:** local branch `feat/homepage-your-world` in `Downloads\pet-art-prints`, 21 commits on top of the older `main` (`1bc0de6`). Not pushed anywhere.

## Checks it passed (locally)
- A code review found no critical bugs. All 6 issues it raised are fixed: a pause button for the moving wall, accurate preview-time wording, no blank areas when images fail, and readable size labels on tablets.
- 225 automated tests pass, 17 of them new. They cover the hero upload, the funnel analytics, the 24MB limit, the pause button, the prices and the size guide.
- Lint is clean, and no new TypeScript errors were added (9 old errors in unrelated files are unchanged).
- The production build succeeds.
- Checked in a browser at desktop and phone width.
- Later additions (header links, shop card, safety nets, all the real images, the footer) were tested in the browser and by the full test suite, but came after the formal code review. A quick review pass on Audos's side is a good idea.

## The page, top to bottom
1. **Hero:** "Your pet is your biggest fandom. It's the only one that never got good art." A slowly scrolling wall of hand-picked style images, plus the upload button.
2. **The fear:** "Will it actually look like my dog?" A before/after slider with Dogs/Cats buttons, then "The whole system is built around that fear," the 3 steps, and "you get 3 HD portraits, not 1."
3. **"Your world, with your pet in it."** The existing room-photo gallery with its pet and vibe filters, under the new headline.
4. **"In one of these worlds, your dog is a guardian... Which one is theirs?"** The existing style grid.
5. **"Wait... is that her?"** The guest-test photo.
6. **"Your walls say who you are. Your camera roll holds who you love."**
7. **Testimonials:** "Happy customers: Their world, with their pet in it." The chicken shirt, the tongue-out cat, the gold wall, each with its real 5-star Etsy rating.
8. **Prices:** a list, the free sticker pack band, and a to-scale size guide.
9. **Founder:** "They barged into my world. Now they all fit in it."
10. **"The pet was never the subject. It was the signature."** (Van Eyck)
11. **Shop teaser:** "No pet at home right now?"
12. **Final call to action:** "Your gallery wall is missing one piece."

The tagline "Joy only pet parents understand." now sits under the logo in the header.

**Header navigation:** on large screens the header shows The 15 worlds · How it works · Prices · Shop. The links jump to homepage sections, and from other pages they go home and scroll to the section. Phones keep just Shop and Sign In. The shop section is a card: "No pet at home right now?" with a "Visit the art shop" button and a ready-made fox print (`public/home/shop-fox.webp`).

**Safety nets (never an empty or broken section):** if the database or image storage can't be reached, the 15-worlds grid shows the hand-picked style images, and the room gallery shows 9 room images stored with the site (`public/home/rooms/`, tagged in `fallbackRooms.ts`), with the pet and vibe filters still working.

**Footer:** a TikTok link (https://www.tiktok.com/@mypet_rocks) with an icon matching Instagram and Facebook; the "Pet Vision" footer link is removed (the /pet-vision page itself still exists). The FAQ now mentions TikTok. The footer AI line now says "Styles designed by a human in Austin" instead of "Checked by a human" (no human reviews every order anymore).

**Small changes outside the homepage (copy only):** the room-gallery popup (`GalleryLightbox.tsx`), the default SEO description (`SeoDefaults.tsx`) and `public/llms.txt` now say "about 30 seconds" instead of 60. The popup also drops "no account" (a free preview needs a sign-in) and says "no card" instead.

## Hero wall images: done
Amer picked 15 images, one per style. They're in `public/home/wall/` as 640px lossless WebP. The full-size originals are in `originals/hero-wall/`; don't upload those to the site. Amer confirmed all 15 labels.

## Testimonial photos: done
The three story cards now show what we made (the shirt, the portrait, the wall), with a round photo of the real pet on the corner. The images are in `public/home/testimonials/` and the originals in `originals/testimonials/`. The chicken story now correctly says **Retro Cosmic Voyager**; it previously said Retro Cosmonaut.

## Founder photo: done
The founder section shows Amer's two dogs and his cat on the couch (`public/home/founder-pets.webp`), with no face, by his choice. Keep it that way.

## Van Eyck painting: done
The signature section shows Jan van Eyck's *Arnolfini Portrait* (1434, public domain) at `public/home/arnolfini-portrait.webp`, captioned to point at the dog.

**All images are now supplied. No placeholders are left.**

## Open question: canvas prices
The older code charges canvas **$54.99 / $69.99 / $119.99** (square 12, 16 and 24 inch only). Amer's screenshot of the live pricing page showed **canvas from $46**, shipping included, in square, landscape and portrait sizes. The live site on Audos probably has newer pricing. The homepage reads prices from the code's price source, so on Audos it will show whatever production charges. Cursor must not copy the old numbers.

## Copy rules (from the messaging framework)
- Calm, specific, no hype. No exclamation points, no urgency, no "limited time."
- Honest claims only: the free preview takes about 30 seconds; up to 3 free previews (never say "a day", so visitors decide now instead of coming back daily); nothing prints until the buyer chooses; a refund is available any time before printing.
- Never promise zoom or a 4K download before printing. Buyers can see their 3 styles, but the 4K file unlocks after they confirm the print.
- Source of truth for all copy: Notion "MyPet.Rocks Messaging Framework (Clean, v1)".
