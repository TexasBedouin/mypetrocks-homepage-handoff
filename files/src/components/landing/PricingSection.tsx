import { ArrowRight } from 'lucide-react';
import { useSectionViewEvent } from '@/hooks/useSectionViewEvent';
import { CANVAS_SIZES, PACKAGES, POSTER_SIZES } from '@/lib/packages';
import type { BundleType } from '@/lib/types';
import { SizeGuide } from '@/components/landing/home/SizeGuide';
import { cn } from '@/lib/utils';

// Prices come from PACKAGES / CANVAS_SIZES / POSTER_SIZES, which are
// hand-mirrored from the physical_products rows checkout charges. Update both
// together, or the page will show a different price than checkout.
const priceOf = (type: BundleType) => PACKAGES.find((p) => p.type === type)?.price;
/** "$54.99", or null when the package is missing (the row is then hidden). */
const money = (type: BundleType, prefix = '') => {
  const price = priceOf(type);
  return price === undefined ? null : `${prefix}$${price}`;
};

const canvasSizes = CANVAS_SIZES.map((t) => t.size.replace(/"/g, '')).join(', ');
const posterSize = POSTER_SIZES[0]?.size.replace(/"/g, '') ?? '';

interface PriceRow {
  name: string;
  badge?: string;
  price: string | null;
  body: string;
  cta: string;
  featured: boolean;
}

const ROWS: PriceRow[] = [
  {
    name: 'Canvas print',
    badge: 'Best value',
    price: money('canvas-print', 'from '),
    body: `Gallery canvas plus the 3 HD portraits. Sizes ${canvasSizes} inches. You approve before it prints.`,
    cta: 'See my canvas free',
    featured: true,
  },
  {
    name: 'Poster print',
    price: money('poster-print'),
    body: `Museum-quality ${posterSize} poster plus the 3 HD portraits. You approve before it prints.`,
    cta: 'See my poster free',
    featured: false,
  },
  {
    name: 'Digital only',
    price: money('digital-only'),
    body: '3 HD portraits. Print-ready, no watermarks. Download instantly.',
    cta: 'See my portraits free',
    featured: false,
  },
];

const STICKERS = ['happy', 'love', 'grumpy', 'surprised', 'sad', 'unimpressed'];

interface PricingSectionProps {
  onGetStarted?: () => void;
}

export function PricingSection({ onGetStarted }: PricingSectionProps = {}) {
  const sectionRef = useSectionViewEvent<HTMLElement>('pricing_viewed', 'pricing_viewed');
  const handleClick = () => {
    if (onGetStarted) onGetStarted();
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section ref={sectionRef} id="prices" className="scroll-mt-14 bg-background-dark py-16 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2 className="font-display font-medium text-foreground text-[clamp(34px,4.4vw,64px)]">
            See it free. Then choose.
          </h2>
          <p className="max-w-md text-lg text-muted-foreground">
            Every option includes 3 HD digital portraits and a free WhatsApp sticker pack of your pet.
          </p>
        </div>

        <ul className="mt-10 border-t border-primary">
          {ROWS.filter((row) => row.price !== null).map((row) => (
            <li
              key={row.name}
              className="flex flex-col gap-4 border-b border-border py-7 md:flex-row md:items-center md:gap-10"
            >
              <div className="md:w-60">
                <p className="font-display text-3xl font-semibold text-foreground">{row.name}</p>
                {row.badge && (
                  <p className="mt-1 text-[13px] font-medium uppercase tracking-[0.14em] text-primary">
                    {row.badge}
                  </p>
                )}
              </div>
              <p className="flex-1 text-base leading-relaxed text-muted-foreground md:text-lg">{row.body}</p>
              <p className="font-display text-4xl text-foreground md:w-44 md:text-right">{row.price}</p>
              <button
                type="button"
                onClick={handleClick}
                className={cn(
                  'inline-flex h-14 items-center justify-center gap-2 rounded-lg px-6 text-base font-semibold transition-all md:w-60',
                  row.featured
                    ? 'bg-primary text-primary-foreground hover:brightness-105'
                    : 'border border-border text-foreground hover:border-primary',
                )}
              >
                {row.cta}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>

        {/* Free sticker pack: same copy and art as the old StickerStrip. */}
        <div className="mt-10 flex flex-col gap-6 rounded-xl border border-primary/60 bg-[#1d1a14] p-6 md:flex-row md:items-center md:gap-10 md:p-9">
          <div className="flex-1">
            <p className="font-display text-sm uppercase italic tracking-[0.2em] text-primary">
              A little extra, free with every order
            </p>
            <p className="mt-2 font-display text-3xl text-foreground">
              Every order comes with a free sticker pack.
            </p>
            <p className="mt-2 text-base leading-relaxed text-muted-foreground md:text-lg">
              We turn your pet into nine little WhatsApp stickers. Our gift to you. Drop them in your
              chats and watch your friends melt.
            </p>
          </div>
          <div className="grid grid-cols-6 gap-2 md:gap-3">
            {STICKERS.map((name) => (
              <div key={name} className="aspect-square w-12 overflow-hidden rounded-xl bg-[#f2ece0] md:w-24">
                <img
                  src={`/stickers/${name}.png`}
                  alt={`${name} pet sticker`}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <SizeGuide />
        </div>
      </div>
    </section>
  );
}
