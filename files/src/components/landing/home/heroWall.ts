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
