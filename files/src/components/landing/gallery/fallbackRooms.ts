import type { GalleryManifestRecord } from '@/types/gallery';

/**
 * Room images stored with the site (public/home/rooms/), used by the homepage
 * gallery when the image storage can't be reached (an outage, or local
 * development). Tagged with the same pet + vibe values the live gallery uses
 * for each style, so the filters keep working.
 */
const room = (
  slug: string,
  style: string,
  pet: GalleryManifestRecord['pet'],
  vibes: string[],
  caption: string,
): GalleryManifestRecord => ({
  file: `/home/rooms/${slug}.webp`,
  style,
  vibes,
  pet,
  subject: '',
  surface: 'framed',
  format: 'wall',
  we_fulfill: true,
  room: '',
  shows_real_pet: false,
  watermark: false,
  caption,
});

export const FALLBACK_RECORDS: GalleryManifestRecord[] = [
  room('kanazawa-gold-leaf', 'Kanazawa Gold Leaf', 'dog', ['Timeless & Classic', 'Japanese & Zen', 'In Loving Memory'], 'A dachshund portrait on gold leaf in a bright room'),
  room('lunar-woodblock', 'Lunar Woodblock', 'cat', ['Timeless & Classic', 'Celestial & Dreamy', 'In Loving Memory'], 'A cat portrait under the moon, above a bed'),
  room('retro-cosmonaut', 'Retro Cosmonaut', 'dog', ['Bold & Playful'], 'An Afghan hound as a retro cosmonaut in a study'),
  room('irezumi-dragon', 'Irezumi Dragon', 'dog', ['Japanese & Zen', 'Bold & Playful', 'Celestial & Dreamy'], 'A puppy portrait with a dragon, framed on a desk'),
  room('mystical-gothic-cat', 'Mystical Gothic', 'cat', ['Timeless & Classic', 'Celestial & Dreamy', 'In Loving Memory'], 'A cat portrait in an ornate frame among candles'),
  room('chinese-literati', 'Chinese Literati', 'other', ['Timeless & Classic', 'Japanese & Zen'], 'Four ink insect portraits on a green study wall'),
  room('mystical-gothic', 'Mystical Gothic', 'dog', ['Timeless & Classic', 'Celestial & Dreamy', 'In Loving Memory'], 'A dog portrait in a gilded frame above a velvet bed'),
  room('neo-tokyo-drifter', 'Neo-Tokyo Drifter', 'other', ['Bold & Playful'], 'A ram in a city-skyline portrait in a music room'),
  room('retro-mecha', 'Retro Mecha', 'dog', ['Bold & Playful'], 'A retro mecha pet print beside robot figures'),
];

/** Local files need no storage lookup: each record's `file` is its URL. */
export const FALLBACK_URLS: Record<string, string> = Object.fromEntries(
  FALLBACK_RECORDS.map((r) => [r.file, r.file]),
);
