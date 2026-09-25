-- Free WhatsApp sticker-sheet gift for paying customers.
-- One sakura-kawaii 3x3 expression grid is generated per order on demand;
-- the client slices it into 9 individual stickers for download.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS sticker_sheet_url TEXT,
  ADD COLUMN IF NOT EXISTS sticker_sheet_status TEXT;

COMMENT ON COLUMN orders.sticker_sheet_url IS 'Public URL of the generated 3x3 kawaii sticker grid (free gift). NULL until claimed.';
COMMENT ON COLUMN orders.sticker_sheet_status IS 'NULL (not claimed) | generating | complete | failed';
