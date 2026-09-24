import { useQuery } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// `shop_products` isn't in the generated Supabase types yet — same `db` cast as useShopCatalog.
const db = supabase as unknown as SupabaseClient;

/**
 * True once the shop has at least one ACTIVE product. Gates the shop's placement (nav entry,
 * footer link, homepage teaser) so those entries only appear after the founder activates
 * products — the storefront stays hidden until launch.
 *
 * A HEAD `count` query (no rows fetched), cached + deduped via react-query so the Header, Footer,
 * and teaser share a single request. Defaults to `false` (hidden) while loading, and on error
 * in production (in local dev an error shows the shop, see below).
 */
export function useHasActiveShopProducts(): boolean {
  const { data } = useQuery({
    queryKey: ['shop', 'has-active-products'],
    queryFn: async () => {
      const { count, error } = await db
        .from('shop_products')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);
      if (error) {
        console.error('useHasActiveShopProducts: count failed', error);
        // Production stays hidden on error. Local dev often can't reach the
        // database, so show the shop entries there to keep the layout reviewable.
        return import.meta.env.DEV;
      }
      return (count ?? 0) > 0;
    },
    staleTime: 5 * 60 * 1000, // 5 min — this changes rarely (only when the founder (de)activates)
  });
  return data ?? false;
}
