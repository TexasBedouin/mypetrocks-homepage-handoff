import { useEffect, useMemo, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ProtectedImage } from '@/components/ui/protected-image';
import { capture } from '@/lib/analytics';
import { useGalleryManifest } from '@/hooks/useGalleryManifest';
import { useSectionViewEvent } from '@/hooks/useSectionViewEvent';
import type { GalleryManifestRecord, PetFilter, VibeFilter } from '@/types/gallery';
import { GalleryChips } from './GalleryChips';
import { GalleryLightbox } from './GalleryLightbox';
import { Rail } from './Rail';
import { railMeta } from './galleryData';
import { FALLBACK_RECORDS, FALLBACK_URLS } from './fallbackRooms';

// One rail, capped — the lightbox gives access to everything beyond the cap.
const RAIL_CAP = 24;

// If this many tiles fail to load before any succeeds, treat the image storage
// as unreachable and show the local fallback rooms instead of broken tiles.
const FAILS_BEFORE_FALLBACK = 3;

/**
 * The homepage inspiration gallery, refined-dark edition: the same 2-tap
 * filters as before, but ONE scrollable rail instead of three stacked bands.
 * Every tile opens the zoomable lightbox. No attract demo, no floating CTA —
 * the hero owns the ask; this section's job is desire.
 */
export function HomeGalleryRail() {
  const { records: liveRecords, urls: liveUrls, loading, error } = useGalleryManifest();
  const [activePet, setActivePet] = useState<PetFilter>(null);
  const [activeVibe, setActiveVibe] = useState<VibeFilter>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  // Image-storage health, from the tiles' own load/error events.
  const [tileLoads, setTileLoads] = useState(0);
  const [tileFails, setTileFails] = useState(0);
  const sectionRef = useSectionViewEvent<HTMLElement>('home_gallery_viewed', 'home_gallery_viewed');

  // Storage unreachable (error, or the first tiles all failed): switch to the
  // local rooms for good, keeping the same filters and lightbox.
  const [useFallback, setUseFallback] = useState(false);
  useEffect(() => {
    if (loading || useFallback) return;
    if (error || (tileLoads === 0 && tileFails >= FAILS_BEFORE_FALLBACK)) setUseFallback(true);
  }, [loading, error, tileLoads, tileFails, useFallback]);
  const records = useFallback ? FALLBACK_RECORDS : liveRecords;
  const urls = useFallback ? FALLBACK_URLS : liveUrls;

  const flat = useMemo(
    () =>
      records.filter((r) => {
        const petOk = activePet === null || r.pet === activePet;
        const vibeOk = activeVibe === null || r.vibes.includes(activeVibe);
        return petOk && vibeOk;
      }),
    [records, activePet, activeVibe],
  );

  const visible = flat.slice(0, RAIL_CAP);
  const moreCount = flat.length - visible.length;

  function changePet(pet: PetFilter) {
    setActivePet(pet);
    setOpenIndex(null);
  }
  function changeVibe(vibe: VibeFilter) {
    setActiveVibe(vibe);
    setOpenIndex(null);
  }

  function openAt(index: number) {
    const record = flat[index];
    setOpenIndex(index);
    capture('home_gallery_lightbox_opened', { style: record?.style, pet: record?.pet });
  }

  return (
    <section ref={sectionRef} className="bg-background py-16 md:py-24" aria-label="Picture your pet in your favorite room">
      <div className="mx-auto max-w-[1240px] px-[22px]">
        <p className="mb-3 text-[13px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          On a real wall
        </p>
        <h2 className="font-display font-semibold leading-[1.06] text-foreground text-[clamp(32px,4.6vw,52px)]">
          Your world, <em className="text-primary">with your pet in it.</em>
        </h2>
        <p className="mt-3 max-w-[560px] text-base leading-relaxed text-muted-foreground md:text-lg">
          Picture your pet in your favorite room. Real portraits in real rooms, and on scarves, mugs and more. Tap any one to look closer.
        </p>

        <div className="mt-6">
          <GalleryChips
            activePet={activePet}
            onPet={changePet}
            activeVibe={activeVibe}
            onVibe={changeVibe}
          />
        </div>

        <div className="mt-8">
          {loading || (error && !useFallback) ? (
            <div className="flex gap-[18px] overflow-hidden">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square w-[230px] flex-none rounded-md" />
              ))}
            </div>
          ) : flat.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">
              Nothing matches those filters yet. Try clearing one.
            </p>
          ) : (
            <Rail ariaLabel="Pet portraits in real rooms">
              {visible.map((record, i) => (
                <GalleryTile
                  key={record.file}
                  record={record}
                  url={urls[record.file] ?? ''}
                  onOpen={() => openAt(i)}
                  onLoaded={() => setTileLoads((n) => n + 1)}
                  onFailed={() => setTileFails((n) => n + 1)}
                />
              ))}
              {moreCount > 0 && (
                <button
                  type="button"
                  onClick={() => openAt(RAIL_CAP)}
                  aria-label={`See ${moreCount} more portraits`}
                  className="flex w-[150px] flex-none snap-start items-center justify-center self-stretch rounded-md border border-border text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {moreCount} more →
                </button>
              )}
            </Rail>
          )}
        </div>
      </div>

      {openIndex !== null && flat[openIndex] && (
        <GalleryLightbox
          records={flat}
          urls={urls}
          index={openIndex}
          onIndexChange={setOpenIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </section>
  );
}

interface GalleryTileProps {
  record: GalleryManifestRecord;
  url: string;
  onOpen: () => void;
  onLoaded: () => void;
  onFailed: () => void;
}

// Plain tile: edge-to-edge art with a hairline keyline — no gilded frame.
function GalleryTile({ record, url, onOpen, onLoaded, onFailed }: GalleryTileProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${record.style} portrait`}
      className="w-[230px] flex-none snap-start rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background"
    >
      <div className="overflow-hidden rounded-md shadow-[inset_0_0_0_1px_hsl(var(--foreground)/0.08),0_10px_30px_rgba(0,0,0,0.35)] transition-transform duration-500 ease-out hover:scale-[1.03]">
        <ProtectedImage
          src={url}
          alt={record.caption || record.style}
          loading="lazy"
          onLoad={onLoaded}
          onError={onFailed}
          className="aspect-square w-full object-cover"
        />
      </div>
      <p className="mt-2 text-[15px] font-medium text-foreground/90 leading-snug line-clamp-1">
        {record.style}
      </p>
      <p className="mt-0.5 text-[13.5px] text-muted-foreground line-clamp-1">{railMeta(record)}</p>
    </button>
  );
}
