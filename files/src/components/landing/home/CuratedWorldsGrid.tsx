import { HERO_WALL_IMAGES } from './heroWall';

interface CuratedWorldsGridProps {
  onTryStyle?: () => void;
}

/**
 * Fallback for the "15 worlds" grid when the styles can't be loaded from the
 * database: shows the founder's hand-picked image for each style (the same
 * ones as the hero wall), so the section is never empty. Each tile starts the
 * free preview, since the per-style gallery needs the database.
 */
export function CuratedWorldsGrid({ onTryStyle }: CuratedWorldsGridProps) {
  return (
    <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
      {HERO_WALL_IMAGES.map((img) => (
        <button
          key={img.src}
          type="button"
          onClick={onTryStyle}
          aria-label={`Try ${img.style} with your pet`}
          className="group relative aspect-square overflow-hidden rounded-sm text-left transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <img
            src={img.src}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 font-display text-xl text-white">
            {img.style}
          </span>
        </button>
      ))}
    </div>
  );
}
