import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Download, MessageCircle, Plus, Image as ImageIcon, Check, Send } from 'lucide-react';

interface WhatsAppStickerGuideProps {
  open: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    icon: Download,
    title: 'Save the stickers to your phone',
    body: 'On your phone, long-press each sticker above and save it to your Photos / Gallery (or tap the download button for the full sheet).',
  },
  {
    icon: MessageCircle,
    title: 'Open WhatsApp and any chat',
    body: 'Open a conversation with anyone (or your own "message yourself" chat to test).',
  },
  {
    icon: Plus,
    title: 'Open the sticker panel, tap Create',
    body: 'Tap the sticker/emoji icon in the message bar, then the "+" or "Create" button to make a new sticker.',
  },
  {
    icon: ImageIcon,
    title: 'Pick a sticker image',
    body: 'Choose one of the saved stickers from your photos. WhatsApp automatically cuts out the background for you.',
  },
  {
    icon: Check,
    title: 'Add it — then repeat',
    body: 'Tap Done/Add to save it to your stickers. Repeat for the other 8. They stay in your sticker tray for any chat.',
  },
  {
    icon: Send,
    title: 'Send your pet to everyone',
    body: `Your stickers now live in WhatsApp. Drop them into any conversation — that's the gift.`,
  },
];

export function WhatsAppStickerGuide({ open, onClose }: WhatsAppStickerGuideProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            Add your stickers to WhatsApp
          </DialogTitle>
          <DialogDescription>
            WhatsApp has a built-in sticker creator — it even removes the background for you. Takes about a minute.
          </DialogDescription>
        </DialogHeader>

        <ol className="space-y-4 mt-2">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <li key={i} className="flex gap-3">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  {i < STEPS.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                </div>
                <div className="pb-1">
                  <p className="font-medium text-sm">
                    <span className="text-muted-foreground mr-1.5">{i + 1}.</span>
                    {step.title}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">{step.body}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <p className="text-xs text-muted-foreground mt-2 pt-3 border-t border-border/50">
          Older WhatsApp version with no "Create" button? Use a free sticker-maker app like Sticker.ly,
          import the saved images, then add the pack to WhatsApp.
        </p>
      </DialogContent>
    </Dialog>
  );
}
