import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Gift, Loader2, Download, MessageCircle, Sparkles } from 'lucide-react';
import { capture } from '@/lib/analytics';
import { WhatsAppStickerGuide } from './WhatsAppStickerGuide';

type StickerStatus = 'idle' | 'generating' | 'complete' | 'failed';

interface StickerGiftProps {
  orderId: string;
  petName: string;
  /** Current persisted status from the order row, if any. */
  initialStatus: string | null;
  initialSheetUrl: string | null;
}

const STICKER_COUNT = 3; // 3x3 grid

// The 9 expression labels — must match the generation prompt order in
// supabase/functions/generate-sticker-sheet/index.ts
const STICKER_LABELS = [
  'happy', 'squirrel', 'sad',
  'grumpy', 'love', 'surprised',
  'unimpressed', 'curious', 'hungry',
];

/**
 * Slice a loaded 3x3 grid image into 9 square data URLs (left→right, top→bottom).
 * Throws on any failure so the caller falls back to the full-sheet download —
 * a partial array would misalign STICKER_LABELS with the wrong images.
 */
function sliceGrid(img: HTMLImageElement): string[] {
  const cellW = Math.floor(img.naturalWidth / STICKER_COUNT);
  const cellH = Math.floor(img.naturalHeight / STICKER_COUNT);
  const out: string[] = [];

  for (let row = 0; row < STICKER_COUNT; row++) {
    for (let col = 0; col < STICKER_COUNT; col++) {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas 2D context unavailable');
      }
      // Draw the cell scaled into a 512x512 sticker canvas (WhatsApp's preferred size)
      ctx.drawImage(
        img,
        col * cellW, row * cellH, cellW, cellH,
        0, 0, 512, 512,
      );
      out.push(canvas.toDataURL('image/png'));
    }
  }

  if (out.length !== STICKER_COUNT * STICKER_COUNT) {
    throw new Error(`Expected ${STICKER_COUNT * STICKER_COUNT} stickers, got ${out.length}`);
  }
  return out;
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function StickerGift({ orderId, petName, initialStatus, initialSheetUrl }: StickerGiftProps) {
  const isMobile = useIsMobile();
  const [status, setStatus] = useState<StickerStatus>(
    initialStatus === 'complete' ? 'complete'
    : initialStatus === 'generating' ? 'generating'
    : initialStatus === 'failed' ? 'failed'
    : 'idle'
  );
  const [sheetUrl, setSheetUrl] = useState<string | null>(initialSheetUrl);
  const [stickers, setStickers] = useState<string[]>([]);
  // Distinguishes "sheet image failed to load" (show an error) from
  // "sliced fine / not sliced yet" (render the grid). Without this, a CORS/404
  // on the sheet silently rendered 9 broken <img> thumbnails.
  const [sheetLoadFailed, setSheetLoadFailed] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  // Guards against a double auto-invoke from React StrictMode's dev double-mount
  // or a fast re-render. The edge function is also idempotent server-side
  // (returns alreadyGenerating when sticker_sheet_status === 'generating'), so
  // this is defense-in-depth, not the sole protection.
  const autoTriggeredRef = useRef(false);

  // If no terminal realtime event arrives within this window, give the user a
  // way out instead of an infinite spinner (covers a dropped fal job, a webhook
  // that never matched, or an order wedged at 'generating' server-side).
  const GENERATION_TIMEOUT_MS = 90_000;

  // Slice the grid into 9 stickers once we have a sheet URL
  useEffect(() => {
    if (!sheetUrl) return;
    setSheetLoadFailed(false);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        setStickers(sliceGrid(img));
      } catch (err) {
        // Slicing failed but the sheet itself loaded — fall back to the
        // full-sheet download (not an error state).
        console.warn('Sticker slicing failed, falling back to full sheet download:', err);
        setStickers([]);
      }
    };
    img.onerror = () => {
      console.error('Sticker sheet image failed to load:', sheetUrl);
      setStickers([]);
      setSheetLoadFailed(true);
    };
    img.src = sheetUrl;
  }, [sheetUrl]);

  // Subscribe to order updates while generating, with a one-shot catch-up fetch
  // (in case completion landed before the channel went live) and a watchdog
  // timeout so the UI can always recover.
  useEffect(() => {
    if (status !== 'generating') return;

    let settled = false;
    const applyTerminal = (
      next: { sticker_sheet_status: string | null; sticker_sheet_url: string | null },
      announce: boolean,
    ): boolean => {
      if (next.sticker_sheet_status === 'complete' && next.sticker_sheet_url) {
        settled = true;
        setSheetUrl(next.sticker_sheet_url);
        setStatus('complete');
        if (announce) toast.success('Your sticker pack is ready!');
        return true;
      }
      if (next.sticker_sheet_status === 'failed') {
        settled = true;
        setStatus('failed');
        if (announce) toast.error('Sticker generation hiccuped. Give it another try.');
        return true;
      }
      return false;
    };

    const channel = supabase
      .channel(`sticker-${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`,
      }, (payload) => {
        applyTerminal(payload.new as { sticker_sheet_status: string | null; sticker_sheet_url: string | null }, true);
      })
      .subscribe(async (channelStatus) => {
        // Once the channel is live, fetch the current row: catches a completion
        // that fired during the subscribe gap, or an order already-terminal on
        // mount (initialStatus was 'generating').
        if (channelStatus !== 'SUBSCRIBED' || settled) return;
        const { data } = await supabase
          .from('orders')
          .select('sticker_sheet_status, sticker_sheet_url')
          .eq('id', orderId)
          .single();
        if (data) applyTerminal(data, false);
      });

    channelRef.current = channel;

    const watchdog = setTimeout(() => {
      if (!settled) {
        setStatus('failed');
        toast.error('This is taking longer than expected. Tap to try again.');
      }
    }, GENERATION_TIMEOUT_MS);

    return () => {
      clearTimeout(watchdog);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [status, orderId]);

  // Shared invoke used by BOTH the automatic mount trigger and the manual
  // "Try again" button. `auto` distinguishes the two for analytics and so the
  // auto path fails silently (no scary toast on a background attempt) while the
  // manual retry surfaces an error toast.
  const startGeneration = async (auto: boolean) => {
    setStatus('generating');
    try {
      const { data, error } = await supabase.functions.invoke('generate-sticker-sheet', {
        body: { orderId },
      });
      if (error) throw error;
      capture(auto ? 'sticker_pack_auto_started' : 'sticker_pack_claimed', { order_id: orderId });
      if (data?.alreadyComplete && data.stickerSheetUrl) {
        setSheetUrl(data.stickerSheetUrl);
        setStatus('complete');
        return;
      }
      // data.alreadyGenerating OR data.pending → realtime subscription + the
      // post-subscribe catch-up fetch drive this to completion.
    } catch (err) {
      console.error('Sticker generation error:', err);
      // Only nag the user on an explicit retry; a failed background auto-start
      // shouldn't throw a toast at someone who never asked for it. Either way,
      // drop to 'failed' so the visible "Try again" button appears.
      if (!auto) {
        toast.error('Could not start your sticker pack. Please try again.');
      }
      setStatus('failed');
    }
  };

  // Manual retry handler (kept as a thin wrapper so the JSX onClick stays clean).
  const handleClaim = () => startGeneration(false);

  // AUTO-GENERATE on mount: the moment a paid buyer lands on /downloads, kick
  // off the sticker sheet if it has never been started. Only fire when the
  // persisted status is genuinely "not started" — 'generating', 'complete', and
  // 'failed' are handled by their own branches and must NOT be auto-restarted
  // (avoids re-billing a fal job for a 'failed' order without an explicit retry).
  useEffect(() => {
    if (autoTriggeredRef.current) return;
    const notStarted = initialStatus == null || initialStatus === '';
    if (notStarted && status === 'idle') {
      autoTriggeredRef.current = true;
      void startGeneration(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownloadAll = () => {
    // Mobile browsers (especially iOS Safari) block multiple rapid programmatic
    // downloads — only the first would land. Download the single full sheet
    // instead; individual stickers are saved by long-pressing the grid images.
    if (isMobile || stickers.length === 0) {
      if (sheetUrl) {
        downloadDataUrl(sheetUrl, `${petName}-sticker-sheet.png`);
        toast.success('Sticker sheet saved!', {
          description: 'Tip: long-press any sticker above to save it on its own.',
        });
      }
      return;
    }

    stickers.forEach((url, i) => {
      setTimeout(() => downloadDataUrl(url, `${petName}-sticker-${STICKER_LABELS[i] || i + 1}.png`), i * 250);
    });
    toast.success(`Downloading ${stickers.length} stickers...`);
  };

  return (
    <Card className="p-5 border-border bg-background-dark">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Gift className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display text-2xl italic text-foreground flex items-center gap-2">
            Free WhatsApp Sticker Pack
            <Sparkles className="w-4 h-4 text-primary" />
            {status === 'generating' && (
              <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                <Loader2 className="w-3 h-3 animate-spin" />
                Generating…
              </span>
            )}
          </h3>
          <p className="text-sm text-muted-foreground">
            9 kawaii stickers of {petName} — our gift to you. Send them in chats with your friends.
          </p>
        </div>
      </div>

      {status === 'idle' && (
        <Button onClick={handleClaim} className="gradient-warm w-full sm:w-auto">
          <Gift className="w-4 h-4 mr-2" />
          Claim my free sticker pack
        </Button>
      )}

      {status === 'generating' && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground py-2">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          Creating {petName}'s sticker pack... this takes about a minute.
        </div>
      )}

      {status === 'failed' && (
        <Button onClick={handleClaim} variant="outline" className="w-full sm:w-auto">
          <Loader2 className="w-4 h-4 mr-2" />
          Try again
        </Button>
      )}

      {status === 'complete' && sheetUrl && sheetLoadFailed && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground py-2">
          <span>Couldn't load your sticker pack — please refresh the page to try again.</span>
        </div>
      )}

      {status === 'complete' && sheetUrl && !sheetLoadFailed && (
        <div>
          <div className="grid grid-cols-3 gap-2 mb-4 max-w-xs">
            {(stickers.length > 0 ? stickers : Array(9).fill(sheetUrl)).map((url, i) => (
              <div key={i} className="aspect-square rounded-lg overflow-hidden bg-background/60 border border-border/50">
                <img src={url} alt={`${petName} ${STICKER_LABELS[i] || ''} sticker`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          {isMobile && stickers.length > 0 && (
            <p className="text-xs text-muted-foreground mb-3">
              Long-press any sticker to save it to your photos.
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleDownloadAll} className="gradient-warm">
              <Download className="w-4 h-4 mr-2" />
              {isMobile || stickers.length === 0 ? 'Download sticker sheet' : 'Download all 9'}
            </Button>
            <Button onClick={() => setShowGuide(true)} variant="outline">
              <MessageCircle className="w-4 h-4 mr-2" />
              How to add to WhatsApp
            </Button>
          </div>
        </div>
      )}

      <WhatsAppStickerGuide open={showGuide} onClose={() => setShowGuide(false)} />
    </Card>
  );
}
