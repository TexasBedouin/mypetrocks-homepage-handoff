import { describe, it, expect } from 'vitest';
import { layoutShapes, pairsForChoice, parseInches, SIZE_GUIDE } from './homeLayout';
import { CANVAS_SIZES, POSTER_SIZES } from '@/lib/packages';

describe('parseInches', () => {
  it('reads width and height from a size value', () => {
    expect(parseInches('12x18')).toEqual([12, 18]);
    expect(parseInches('24X24')).toEqual([24, 24]);
  });

  it('returns null for values that are not inch sizes', () => {
    expect(parseInches('11oz')).toBeNull();
    expect(parseInches('')).toBeNull();
  });
});

describe('layoutShapes', () => {
  it('draws one shape per sellable canvas and poster size', () => {
    const shapes = layoutShapes();
    expect(shapes).toHaveLength(CANVAS_SIZES.length + POSTER_SIZES.length);
    expect(shapes.filter((s) => s.kind === 'poster')).toHaveLength(POSTER_SIZES.length);
  });

  it('keeps every size at the same scale', () => {
    const shapes = layoutShapes();
    for (const [i, tier] of [...CANVAS_SIZES, ...POSTER_SIZES].entries()) {
      const [w, h] = parseInches(tier.value)!;
      expect(shapes[i].w).toBe(w * SIZE_GUIDE.pxPerInch);
      expect(shapes[i].h).toBe(h * SIZE_GUIDE.pxPerInch);
    }
  });

  it('shows the real checkout price for each size', () => {
    const shapes = layoutShapes();
    expect(shapes[0].price).toBe(`$${CANVAS_SIZES[0].price}`);
    expect(shapes.at(-1)!.label).toMatch(/^Poster /);
  });

  it('fits inside the view without overlapping', () => {
    const shapes = layoutShapes();
    expect(shapes[0].x).toBeGreaterThanOrEqual(0);
    const last = shapes.at(-1)!;
    expect(last.x + last.w).toBeLessThanOrEqual(SIZE_GUIDE.viewW);
    for (let i = 1; i < shapes.length; i += 1) {
      expect(shapes[i].x).toBeGreaterThanOrEqual(shapes[i - 1].x + shapes[i - 1].w);
    }
  });

  it('skips sizes it cannot read instead of drawing them wrong', () => {
    const shapes = layoutShapes(
      [{ size: 'odd', price: 1, value: 'odd', slug: 'canvas-12x12' }],
      [],
    );
    expect(shapes).toEqual([]);
  });
});

describe('pairsForChoice', () => {
  const pairs = [
    { id: 'beans', pet: 'dog' as const },
    { id: 'cheezy', pet: 'cat' as const },
    { id: 'moony', pet: 'cat' as const },
  ];

  it('shows every curated pair for "all" and hides excluded ones', () => {
    expect(pairsForChoice(pairs, 'all').map((p) => p.id)).toEqual(['beans', 'cheezy']);
  });

  it('filters to one kind of pet', () => {
    expect(pairsForChoice(pairs, 'dog').map((p) => p.id)).toEqual(['beans']);
    expect(pairsForChoice(pairs, 'cat').map((p) => p.id)).toEqual(['cheezy']);
    expect(pairsForChoice(pairs, 'other')).toEqual([]);
  });
});
