# Paste this into Cursor (Audos team)

You are updating the MyPet.Rocks homepage (React + Vite + TypeScript + Tailwind + Supabase). The new design and code were built and tested against an **older copy** of the codebase. Your job is to bring these changes into the **current production codebase** on Audos. Keep anything production already does better. Don't touch checkout, pricing data, auth or the create flow.

## What's in this folder

- `homepage-redesign.patch`: the full change as one git patch (made against the older `main`, commit `1bc0de6`).
- `files/`: the final version of every new or changed file, at its real path.
- `changed-files.txt`: A = added, M = modified, D = deleted.
- `HANDOFF.md`: plain-English background, the section order, image notes and copy rules. Read it.

## Steps

1. **Try the patch first:** `git apply --3way homepage-redesign.patch`. If it applies cleanly, go to step 4.
2. **If it doesn't apply**, rebuild from `files/`:
   - Copy every file marked **A** into place. That's the `src/components/landing/home/` folder, `src/components/landing/gallery/fallbackRooms.ts`, the test files, and all images under `public/home/` (`wall/`, `rooms/`, `testimonials/`, `founder-pets.webp`, `arnolfini-portrait.webp`, `shop-fox.webp`).
   - Copy the modified image `public/likeness/furiosa/after.jpg`.
   - For every code file marked **M**, **merge** the changes into production's version. Don't overwrite blindly; production may have newer fixes in the same file.
   - Delete the files marked **D** only if nothing else in production imports them.
3. **Wire the homepage** (`src/pages/Index.tsx`, landing branch) in this order:
   `WorldsWallHero → FearSection → HomeGalleryRail → StyleGallerySection → GuestTestSection → RecognitionSection → StoriesSection → PricingSection → FounderSection → SignatureSection → ShopTeaser → CTASection → Footer`
   Also bring over the small `useEffect` in `Index.tsx` that scrolls to `location.hash` (it lets header links like `/#prices` work from other pages).
4. **Prices, the most important rule:** every price on the homepage must come from production's own price source (in the old code, `src/lib/packages.ts`: `PACKAGES`, `CANVAS_SIZES`, `POSTER_SIZES`), the same numbers checkout charges. **Never type prices into the page.** Production may charge differently from the old code (for example, canvas from $46 in square, landscape and portrait sizes). If so, the price list, the hero's "Canvas from" line and the `SizeGuide` must show production's numbers. `layoutShapes()` in `homeLayout.ts` draws whatever size tiers it's given.
5. **Keep this behavior:**
   - The hero upload calls the same `onGetStarted(file)` flow and fires the same analytics (`hero_cta_clicked`, `hero_upload_started` in Clarity, and `funnel_hero_upload_started`). Uploads over 24MB are rejected.
   - Reduced-motion visitors get no animation (`motion-reduce:animate-none`). The "Pause the wall" button stops the moving wall (WCAG 2.2.2).
   - **Header:** section links (The 15 worlds, How it works, Prices) on large screens, plus Shop and Sign In. Sections have `scroll-mt-14` so they land under the fixed header. The tagline sits under the logo.
   - **Safety nets:** if styles can't load, the worlds grid shows `CuratedWorldsGrid` (the hand-picked images). If gallery images can't load, the room gallery switches to `fallbackRooms.ts` and its filters still work. No section should ever look empty or broken.
   - `useHasActiveShopProducts` returns `true` on error **only in local dev** (`import.meta.env.DEV`); production behavior is unchanged.
6. **Add the Tailwind animations** from `tailwind.config.ts`: the keyframes `worlds-up`, `worlds-down` and `worlds-left`, plus their `animation` entries.
7. **Run checks:** `npm run build`, `npm test` (includes `homeLayout.test.ts`, `WorldsWallHero.test.tsx` and `PricingSection.test.tsx`), and `npm run lint`. Fix anything new.
8. **Check in a browser** at desktop width (1440px) and phone width (375px):
   - The hero wall scrolls and the pause button works.
   - The Dogs/Cats buttons swap the before/after example, and the heading says "cat" when Cats is selected.
   - The header links jump to the right sections, including from the FAQ page.
   - The room gallery's pet and vibe filters work, and the shop card shows the fox.
   - The testimonial cards show the photos, the round real-pet photos and the 5-star Etsy line.
   - Nothing scrolls sideways on phone, and the prices match checkout.

## Don't

- Don't change checkout, pricing data, auth or the create flow.
- Don't add urgency ("limited time", countdowns) or exclamation points. The brand voice is calm.
- Don't say "3 free previews **a day**." Just "3 free previews."
- Don't show the founder's face. The founder section uses his pets' photo on purpose.
- Don't upload the full-size originals (Amer keeps those separately). The site uses the prepared WebP files in `files/public/home/`.
