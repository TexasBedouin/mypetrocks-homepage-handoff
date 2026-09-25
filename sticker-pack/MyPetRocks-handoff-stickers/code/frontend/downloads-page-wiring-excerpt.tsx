// EXCERPT from src/lib/post-purchase/state.ts: one sticker card per paid pet.
export const deriveStickerOrders = (
  orders: Order[],
  activeOrderId: string | undefined,
  displayStatus: DisplayStatus,
): Order[] => {
  const seenPet = new Set<string>();
  return orders
    .filter((o) => !o.parent_order_id && !o.refunded_at)
    .filter(
      (o) =>
        o.status === 'processing' ||
        o.status === 'complete' ||
        (o.id === activeOrderId &&
          (displayStatus === 'processing' || displayStatus === 'complete')),
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .filter((o) => {
      const key = o.pet_id ?? o.id;
      if (seenPet.has(key)) return false;
      seenPet.add(key);
      return true;
    });
};

// EXCERPT from src/pages/Downloads.tsx: where the cards are shown.
  // One free WhatsApp sticker pack per paid pet (was a single card keyed to the
  // active order, which hid every other pet's pack). See deriveStickerOrders.
  const stickerOrders = deriveStickerOrders(orders, activeOrder?.id, displayStatus);
// ...
            {/* Free WhatsApp sticker pack — sits BELOW the gallery (design step 8),
                above "Make more". One card per paid pet (stickerOrders), each
                auto-generating on mount and hydrating from its own order row. */}
            {stickerOrders.length > 0 && (
              <div className="mt-12 space-y-8">
                {stickerOrders.map((o) => (
                  <StickerGift
                    key={o.id}
                    orderId={o.id}
                    petName={getPetName(o.pet_id)}
                    initialStatus={o.sticker_sheet_status}
                    initialSheetUrl={o.sticker_sheet_url}
                  />
                ))}
              </div>
            )}
