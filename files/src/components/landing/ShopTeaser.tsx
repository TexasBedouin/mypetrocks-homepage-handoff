import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useHasActiveShopProducts } from '@/hooks/useHasActiveShopProducts';

/**
 * Homepage teaser for the ready-made art shop, for visitors with no pet to
 * photograph. Self-gates on active products (renders nothing until the shop
 * has something to sell).
 */
export function ShopTeaser() {
  const hasShop = useHasActiveShopProducts();
  if (!hasShop) return null;

  return (
    <section id="shop" className="scroll-mt-14 bg-background px-5 py-16 md:py-20">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 rounded-2xl border border-border bg-background-dark p-8 md:flex-row md:items-center md:gap-10 md:p-12">
        <img
          src="/home/shop-fox.webp"
          alt="A ready-made print of a fox from the shop"
          loading="lazy"
          className="w-40 shrink-0 rounded-lg shadow-lg md:w-52"
        />
        <div className="flex-1">
          <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-primary">
            Ready-made art
          </p>
          <h2 className="mt-3 font-display text-[clamp(30px,3.6vw,46px)] font-medium leading-tight text-foreground">
            No pet at home right now?
          </h2>
          <p className="mt-3 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Browse ready-made animal art from the same art worlds: llamas, highland cows,
            butterflies and more. Instant high-resolution downloads for $10, no account needed.
          </p>
        </div>
        <Link
          to="/shop"
          className="inline-flex h-14 shrink-0 items-center gap-2 rounded-lg border border-primary px-7 text-base font-semibold text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          Visit the art shop
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
