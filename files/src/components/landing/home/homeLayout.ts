import { CANVAS_SIZES, POSTER_SIZES, type SizeTier } from '@/lib/packages';
import type { LikenessPair } from '@/types/gallery';

// ---------- Likeness filter (FearSection)

export type PetChoice = 'all' | LikenessPair['pet'];

// Founder-curated: pairs whose likeness is not strong enough to headline.
const EXCLUDED_PAIR_IDS = new Set(['moony']);

/** Pairs to show for a pet choice; "all" keeps every curated pair. */
export function pairsForChoice<T extends Pick<LikenessPair, 'id' | 'pet'>>(
  pairs: T[],
  choice: PetChoice,
): T[] {
  const curated = pairs.filter((p) => !EXCLUDED_PAIR_IDS.has(p.id));
  return choice === 'all' ? curated : curated.filter((p) => p.pet === choice);
}

// ---------- Size guide (SizeGuide)

export const SIZE_GUIDE = {
  pxPerInch: 7,
  sofaInches: 84,
  gap: 34,
  top: 20,
  artBottom: 250, // every piece hangs with its bottom edge on this line
  viewW: 1000,
  viewH: 360,
} as const;

export interface GuideShape {
  label: string;
  price: string;
  kind: 'canvas' | 'poster';
  x: number;
  y: number;
  w: number;
  h: number;
}

/** "12x18" → [12, 18]. Returns null for anything that isn't W x H inches. */
export function parseInches(value: string): [number, number] | null {
  const m = /^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)$/i.exec(value.trim());
  return m ? [Number(m[1]), Number(m[2])] : null;
}

/**
 * Lay out every sellable print size side by side at one scale, centered in the
 * view. Sizes come from the checkout tiers, so the guide can never show a size
 * we don't sell.
 */
export function layoutShapes(
  canvas: SizeTier[] = CANVAS_SIZES,
  poster: SizeTier[] = POSTER_SIZES,
): GuideShape[] {
  const { pxPerInch, gap, top, artBottom, viewW } = SIZE_GUIDE;
  const sized = [
    ...canvas.map((tier) => ({ tier, kind: 'canvas' as const })),
    ...poster.map((tier) => ({ tier, kind: 'poster' as const })),
  ].flatMap((s) => {
    const inches = parseInches(s.tier.value);
    return inches ? [{ ...s, inches }] : [];
  });

  const totalW =
    sized.reduce((sum, s) => sum + s.inches[0] * pxPerInch, 0) + gap * Math.max(sized.length - 1, 0);
  let x = (viewW - totalW) / 2;

  return sized.map(({ tier, kind, inches: [wIn, hIn] }) => {
    const w = wIn * pxPerInch;
    const h = hIn * pxPerInch;
    const size = tier.size.replace(/"/g, '');
    const shape: GuideShape = {
      label: kind === 'poster' ? `Poster ${size}` : size,
      price: `$${tier.price}`,
      kind,
      x,
      y: Math.max(top, artBottom - h),
      w,
      h,
    };
    x += w + gap;
    return shape;
  });
}
