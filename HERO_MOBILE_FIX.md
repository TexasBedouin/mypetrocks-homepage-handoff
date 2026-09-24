# Hero fix: text disappearing on mobile

Paste this whole file into Cursor.

## Most likely causes (check in this order)

1. **The sliding image row is stretching the layout.** On phones, the images slide in one very wide row (`w-max`). If its wrapper loses `overflow-hidden` or `min-w-0`, or the grid has no explicit `grid-cols-1`, that row widens the grid column and pushes the headline off screen. **Fix:** use the code below exactly. The grid has `grid-cols-1`, the text block has `relative z-10 min-w-0`, and the phone row's wrapper has `w-full min-w-0 overflow-hidden md:hidden`.
2. **The Tailwind animations are missing.** Add the `worlds-up`, `worlds-down` and `worlds-left` keyframes and animation entries below to `tailwind.config.ts` (inside `theme.extend`). Without them, classes like `animate-worlds-left` do nothing, and the row may not render as intended.
3. **The fixed header covers the hero.** The homepage wraps the sections in `<div className="pt-14">` to clear the 56px fixed header. If that padding is missing, the top of the hero hides under the header.
4. **Theme colors.** The text uses `text-foreground` (light) on `bg-background` (dark). If production's theme swapped these, the text can become the same color as the background. Check the `--foreground` / `--background` CSS variables.
5. **Every hero image failed to load.** If the `/home/wall/*.webp` images weren't copied, the wall hides itself and the text centers. That's safe, but confirm the images exist in `public/home/wall/`.

## 1. `src/components/landing/home/WorldsWallHero.tsx` (replace the whole file)

```tsx
import { useCallback, useMemo, useState, type CSSProperties } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, ArrowRight, Pause, Play } from 'lucide-react';
import { toast } from 'sonner';
import { clarityEvent } from '@/lib/clarity';
import { capture } from '@/lib/analytics';
import { PACKAGES } from '@/lib/packages';
import { cn } from '@/lib/utils';
import { HERO_WALL_IMAGES, TOTAL_STYLES } from './heroWall';

interface WorldsWallHeroProps {
  onGetStarted: (file?: File) => void;
}

interface WallTile {
  name: string;
  src: string;
}

const MAX_UPLOAD_BYTES = 24 * 1024 * 1024;
const COLUMN_COUNT = 3;
const canvasFrom = PACKAGES.find((p) => p.type === 'canvas-print')?.price;

/** Deal the tiles round-robin into `count` columns so each shows a mix. */
function dealColumns(tiles: WallTile[], count: number): WallTile[][] {
  const columns: WallTile[][] = Array.from({ length: count }, () => []);
  tiles.forEach((tile, i) => columns[i % count].push(tile));
  return columns;
}

/**
 * Landing hero: the fandom headline beside a slow "wall of worlds" showing
 * many styles at once, so a visitor who dislikes one look sees the others
 * without doing anything. The images come from heroWall.ts. Each strip holds
 * its tiles twice and every tile carries its own trailing margin (no flex
 * gap), so the two halves are exactly equal and sliding by half loops with no
 * jump. A labeled button pauses the motion (WCAG 2.2.2); visitors who prefer
 * reduced motion get a still wall. A tile whose image fails to load is
 * dropped rather than shown as a broken box.
 */
export function WorldsWallHero({ onGetStarted }: WorldsWallHeroProps) {
  const [failed, setFailed] = useState<ReadonlySet<string>>(() => new Set());
  const [paused, setPaused] = useState(false);
  const tiles = useMemo<WallTile[]>(
    () =>
      HERO_WALL_IMAGES.filter((img) => !failed.has(img.src)).map((img) => ({
        name: img.style,
        src: img.src,
      })),
    [failed],
  );
  const markFailed = useCallback((src: string) => {
    setFailed((prev) => (prev.has(src) ? prev : new Set(prev).add(src)));
  }, []);
  const columns = useMemo(() => dealColumns(tiles, COLUMN_COUNT), [tiles]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      if (file.size > MAX_UPLOAD_BYTES) {
        toast.error('Image must be less than 24MB');
        return;
      }
      // Earliest committed funnel signal: the visitor handed us a photo.
      const device = window.innerWidth < 768 ? 'mobile' : 'desktop';
      clarityEvent('hero_upload_started');
      capture('funnel_hero_upload_started', { surface: 'hero', device });
      onGetStarted(file);
    },
    [onGetStarted],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1,
  });

  const styleCount = TOTAL_STYLES;

  return (
    <section className="relative overflow-hidden bg-[radial-gradient(ellipse_60%_80%_at_80%_50%,#231f17_0%,hsl(var(--background))_70%)]">
      {/* No wall images (list empty, or every image failed): the copy
          centers on its own instead of leaving an empty right half.
          MOBILE SAFETY: one explicit column (grid-cols-1) and min-w-0 on the
          children, so the very wide sliding image row can never stretch the
          layout and push the headline off screen. */}
      <div
        className={cn(
          'mx-auto grid max-w-7xl grid-cols-1 items-center gap-10',
          tiles.length > 0 && 'md:grid-cols-[minmax(0,540px)_1fr] md:gap-14 md:pl-8',
        )}
      >
        <div
          className={cn(
            'relative z-10 min-w-0 px-5 pt-10 text-center md:py-20',
            tiles.length > 0 ? 'md:px-0 md:text-left' : 'mx-auto max-w-3xl pb-10',
          )}
        >
          <p className="mb-5 text-[13px] font-medium uppercase tracking-[0.18em] text-primary">
            {styleCount} art worlds. One is yours.
          </p>
          <h1 className="font-display font-medium leading-[1.02] text-foreground text-[clamp(40px,5.6vw,76px)]">
            Your pet is your biggest fandom.{' '}
            <em className="text-primary">It's the only one that never got good art.</em>
          </h1>
          <p
            className={cn(
              'mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl',
              tiles.length > 0 && 'md:mx-0',
            )}
          >
            Until now. Pick from {styleCount} art traditions, from Japanese woodblock to 1980s anime
            to Victorian engraving. Your pet steps inside as the hero.
          </p>

          <div
            {...getRootProps({
              // Name the dropzone root: react-dropzone defaults it to
              // role="presentation", which hides the page's main CTA from AT.
              role: 'button',
              'aria-label': "See your pet's portrait free: upload a photo",
              onClick: () => clarityEvent('hero_cta_clicked'),
            })}
            className={cn(
              'mt-8 inline-flex cursor-pointer transition-transform duration-200',
              isDragActive && 'scale-[1.03]',
            )}
          >
            <input {...getInputProps({ 'aria-hidden': true })} />
            <span className="inline-flex h-14 items-center gap-2.5 rounded-lg bg-primary px-8 text-lg font-semibold text-primary-foreground shadow-lg transition-all duration-200 hover:brightness-105">
              <Upload className="h-5 w-5" aria-hidden="true" />
              {isDragActive ? (
                'Drop to start'
              ) : (
                <>
                  <span className="sm:hidden">See your pet free</span>
                  <span className="hidden sm:inline">See your pet's portrait free</span>
                </>
              )}
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </span>
          </div>

          <p className="mt-4 text-[15px] text-muted-foreground">
            <span className="font-medium text-foreground">Ready in about 30 seconds.</span>{' '}
            3 free previews · No card
            {canvasFrom ? ` · Canvas from $${canvasFrom}` : ''}
          </p>
        </div>

        {tiles.length > 0 && (
          <>
            {/* Desktop: three columns drifting up and down. */}
            <div
              aria-hidden="true"
              className="relative hidden h-[min(88vh,900px)] grid-cols-3 gap-4 overflow-hidden md:grid"
              style={{ '--wall-state': paused ? 'paused' : 'running' } as CSSProperties}
            >
              {columns.map((column, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex flex-col [animation-play-state:var(--wall-state)] motion-reduce:animate-none',
                    i % 2 === 0 ? 'animate-worlds-up' : 'animate-worlds-down',
                  )}
                >
                  {[...column, ...column].map((tile, j) => (
                    <WallTileImage key={`${tile.src}-${j}`} tile={tile} eager={j < 2} onError={markFailed} className="mb-4 h-[300px]" />
                  ))}
                </div>
              ))}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-background to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background to-transparent" />
            </div>

            {/* Mobile: one row sliding sideways under the copy. */}
            <div
              aria-hidden="true"
              className="w-full min-w-0 overflow-hidden md:hidden"
              style={{ '--wall-state': paused ? 'paused' : 'running' } as CSSProperties}
            >
              <div className="flex w-max animate-worlds-left [animation-play-state:var(--wall-state)] motion-reduce:animate-none">
                {[...tiles, ...tiles].map((tile, j) => (
                  <WallTileImage key={`${tile.src}-${j}`} tile={tile} eager={j < 3} onError={markFailed} className="mr-3 h-[190px] w-[150px]" />
                ))}
              </div>
            </div>
            <div className="flex justify-center pb-8 md:absolute md:bottom-6 md:right-6 md:pb-0">
              <button
                type="button"
                onClick={() => setPaused((v) => !v)}
                aria-pressed={paused}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-background/85 px-4 text-[15px] text-foreground backdrop-blur hover:border-primary motion-reduce:hidden"
              >
                {paused ? <Play className="h-4 w-4" aria-hidden="true" /> : <Pause className="h-4 w-4" aria-hidden="true" />}
                {paused ? 'Play the wall' : 'Pause the wall'}
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

interface WallTileImageProps {
  tile: WallTile;
  /** Load right away: the first tiles are on screen when the page opens. */
  eager?: boolean;
  onError: (src: string) => void;
  className?: string;
}

function WallTileImage({ tile, eager = false, onError, className }: WallTileImageProps) {
  return (
    <figure className={cn('relative shrink-0 overflow-hidden rounded-lg', className)}>
      <img
        src={tile.src}
        alt=""
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => onError(tile.src)}
        className="h-full w-full object-cover"
      />
      <figcaption className="absolute bottom-2 left-2 rounded-md bg-background/85 px-2.5 py-1 text-[15px] text-foreground">
        {tile.name}
      </figcaption>
    </figure>
  );
}
```

## 2. `src/components/landing/home/heroWall.ts`

```ts
/**
 * The images on the homepage hero's "wall of worlds". Chosen by the founder
 * (one per style), not pulled from the database, so the hero shows only the
 * best work. Originals live outside the repo; these are 640px lossless WebP.
 *
 * TO CHANGE THE WALL:
 * 1. Put the image in public/home/wall/ as WebP, about 640px on the long side
 *    (each tile shows about 300px tall, so 640px is sharp on high-res screens.
 *    Bigger files are NOT better here: the wall moves, and 1200px images made
 *    browsers skip drawing the tiles).
 * 2. Add, remove or reorder lines below. Order = order on the wall.
 * 3. Keep `style` matching the style's name on the site; it is the caption.
 */
export interface WallImage {
  style: string;
  src: string;
}

export const HERO_WALL_IMAGES: WallImage[] = [
  { style: 'Irezumi Dragon', src: '/home/wall/irezumi-dragon.webp' },
  { style: 'Kanazawa Gold Leaf', src: '/home/wall/kanazawa-gold-leaf.webp' },
  { style: 'Retro Cosmonaut', src: '/home/wall/retro-cosmonaut.webp' },
  { style: 'Retro Cosmic Voyager', src: '/home/wall/retro-cosmic-voyager.webp' },
  { style: 'Mystical Gothic', src: '/home/wall/mystical-gothic.webp' },
  { style: 'Silk Scroll', src: '/home/wall/silk-scroll.webp' },
  { style: 'Retro Mecha', src: '/home/wall/retro-mecha.webp' },
  { style: 'Sumi-e Ink Wash', src: '/home/wall/sumi-e-ink-wash.webp' },
  { style: 'Neo-Tokyo Drifter', src: '/home/wall/neo-tokyo-drifter.webp' },
  { style: 'Victorian Engraving', src: '/home/wall/victorian-engraving.webp' },
  { style: 'Imperial Bamboo Forest', src: '/home/wall/imperial-bamboo-forest.webp' },
  { style: 'Lunar Woodblock', src: '/home/wall/lunar-woodblock.webp' },
  { style: 'Dramatic Manga', src: '/home/wall/dramatic-manga.webp' },
  { style: 'Sakura Dream', src: '/home/wall/sakura-dream.webp' },
  { style: 'Chinese Literati', src: '/home/wall/chinese-literati.webp' },
];

/** How many styles the site offers, used in the hero copy. Update when styles are added. */
export const TOTAL_STYLES = 15;
```

## 3. `tailwind.config.ts`: add inside `theme.extend.keyframes`

```ts
				// Worlds-wall hero: each strip holds its tiles twice and each tile
				// has its own trailing margin (no gap), so the halves are equal and
				// sliding by exactly half loops seamlessly.
				'worlds-up': {
					from: { transform: 'translateY(0)' },
					to: { transform: 'translateY(-50%)' }
	```

## and inside `theme.extend.animation`

```ts
				'worlds-up': 'worlds-up 70s linear infinite',
				'worlds-down': 'worlds-down 80s linear infinite',
				'worlds-left': 'worlds-left 90s linear infinite'
```

## 4. How to confirm it's fixed (phone width, 375px)

- The headline "Your pet is your biggest fandom..." is fully visible under the header.
- The gold "See your pet free" button shows, with the sliding row of style images below it.
- The page doesn't scroll sideways (`document.documentElement.scrollWidth` equals the screen width).
