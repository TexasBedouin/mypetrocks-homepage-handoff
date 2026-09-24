import { useEffect, useId, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { capture } from '@/lib/analytics';
import type { GalleryManifestRecord } from '@/types/gallery';
import { honestLine, surfaceLabel, isDiy } from './galleryData';
import { LightboxShell } from './LightboxShell';
import type { LightboxItem } from './lightboxTypes';

interface GalleryLightboxProps {
  records: GalleryManifestRecord[];
  urls: Record<string, string>;
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

export function GalleryLightbox({ records, urls, index, onIndexChange, onClose }: GalleryLightboxProps) {
  const navigate = useNavigate();
  const titleId = useId();

  const items = useMemo<LightboxItem[]>(
    // Gallery webps are served as originals, so url == thumb == zoom.
    () => records.map((r) => ({ id: r.file, alt: r.caption || r.style, url: urls[r.file] ?? '' })),
    [records, urls],
  );

  const record = records[index];
  const diy = record ? isDiy(record) : false;
  const surfaces = diy ? (['HD Digital'] as const) : (['Canvas', 'Poster', 'HD Digital'] as const);
  const [surface, setSurface] = useState<string>(surfaces[0]);

  useEffect(() => {
    setSurface(diy ? 'HD Digital' : 'Canvas');
  }, [index, diy]);

  if (!record) return null;

  function startPreview() {
    capture('home_gallery_start_preview', {
      surface: 'home_gallery_lightbox',
      style: record.style,
      pet: record.pet,
      chosen_surface: surface,
    });
    navigate('/create');
  }

  const meta = (
    <>
      <p className="font-display italic uppercase tracking-[0.16em] text-[12.5px] text-primary">
        {record.style} · {record.pet}
      </p>
      <h2 id={titleId} className="font-display text-[27px] font-semibold leading-tight text-[#f1ede4]">
        {record.caption || record.style}
      </h2>

      <div className="flex flex-wrap gap-2">
        {[record.room, record.vibes[0], surfaceLabel(record)].filter(Boolean).map((tag) => (
          <span
            key={String(tag)}
            className="rounded-[14px] border border-[#3a352a] px-3 py-1 text-[12.5px] capitalize text-[#b9b4aa]"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Surface pills (DIY records show digital only — never imply we print them) */}
      <div role="radiogroup" aria-label="Choose a format">
        <p className="mb-2 text-[13px] text-[#8a8680]">Make it yours as…</p>
        <div className="flex flex-wrap gap-2">
          {surfaces.map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={surface === s}
              onClick={() => setSurface(s)}
              className={cn(
                'min-h-[44px] rounded-[14px] border px-4 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                surface === s
                  ? 'border-primary bg-primary/[0.12] text-[#f4e4a6]'
                  : 'border-[#3a352a] text-[#b9b4aa] hover:border-border',
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[12.5px] italic text-[#8a8680]">{honestLine(record)}</p>
      </div>

      <Button variant="warm" size="lg" className="w-full" onClick={startPreview}>
        Start your free preview ›
      </Button>
      <p className="text-center text-[12.5px] text-[#8a8680]">
        Free preview in about 30 seconds · no card · you approve before we print.
      </p>
    </>
  );

  return (
    <LightboxShell
      items={items}
      index={index}
      onIndexChange={onIndexChange}
      onClose={onClose}
      labelledById={titleId}
      meta={meta}
    />
  );
}
