import { useState, useCallback } from 'react';
import { useStyles } from '@/hooks/useStyles';
import { getPrimaryStyleImage } from '@/lib/style-utils';
import { getOptimizedImageUrl } from '@/lib/image-utils';
import { Style } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { SwipeHint } from '@/components/landing/SwipeHint';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { ProtectedImage } from '@/components/ui/protected-image';
import { StyleLightbox } from '@/components/landing/gallery/StyleLightbox';
import { CuratedWorldsGrid } from '@/components/landing/home/CuratedWorldsGrid';
import { TOTAL_STYLES } from '@/components/landing/home/heroWall';
interface StyleGallerySectionProps {
  onTryStyle?: () => void;
}
export function StyleGallerySection({
  onTryStyle
}: StyleGallerySectionProps) {
  const {
    styles,
    loading
  } = useStyles();
  const [selectedStyle, setSelectedStyle] = useState<Style | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [showHint, setShowHint] = useState(true);
  const isMobile = useIsMobile();
  const handleTryStyle = () => {
    setSelectedStyle(null);
    if (onTryStyle) {
      onTryStyle();
    } else {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };
  const handleImageLoad = useCallback((styleId: string) => {
    setLoadedImages(prev => new Set(prev).add(styleId));
  }, []);
  const handleCardInteraction = useCallback(() => {
    setShowHint(false);
  }, []);
  if (loading) {
    return <section id="worlds" className="scroll-mt-14 py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display font-semibold text-4xl md:text-5xl text-foreground mb-4">
              In one of these worlds, your dog is a guardian. In another, a co-pilot.
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-sm" />)}
          </div>
        </div>
      </section>;
  }
  return <section id="worlds" className="scroll-mt-14 py-24 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <p className="text-muted-foreground font-medium text-[13px] uppercase tracking-[0.16em] mb-4">
            {styles.length > 0 ? styles.length : TOTAL_STYLES} art worlds
          </p>
          <h2 className="font-display font-semibold text-4xl md:text-5xl text-foreground mb-4 max-w-4xl mx-auto leading-tight">
            In one of these worlds, your dog is a guardian. In another, a co-pilot.{' '}
            <em className="text-primary">Which one is theirs?</em>
          </h2>
          <p className="font-sans text-muted-foreground text-lg">
            Each one comes from a real art tradition. Tap any world to explore it.
          </p>
        </div>

        {/* Style Grid - single column on mobile, grid on larger screens */}
        <div className="relative">
          {/* First-time swipe hint */}
          {showHint && styles.length > 0 && <SwipeHint onDismiss={handleCardInteraction} />}
          
          {/* Styles failed to load: show the hand-picked images, never an empty grid. */}
          {styles.length === 0 && <CuratedWorldsGrid onTryStyle={handleTryStyle} />}
          <div className={cn('grid gap-3 sm:gap-6 max-w-6xl mx-auto', 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4', isMobile && 'px-1')}>
            {styles.map((style, index) => {
            const imageCount = style.images?.filter(img => img.image_type !== 'template').length || 0;
            const isLoaded = loadedImages.has(style.id);
            return <div key={style.id} onClick={() => {
              handleCardInteraction();
              setSelectedStyle(style);
            }} className={cn('group relative overflow-hidden cursor-pointer rounded-sm transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]', 'hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] hover:ring-1 hover:ring-primary/15', isMobile ? 'aspect-square w-full' : 'aspect-square')}>
                  {/* Image with load animation */}
                   <ProtectedImage src={getOptimizedImageUrl(getPrimaryStyleImage(style) || '/placeholder.svg', 'thumbnail')} alt={style.name} className={cn('w-full h-full object-cover transition-all duration-500 ease-out group-hover:scale-[1.02]', isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.98]')} loading="lazy" decoding="async" onLoad={() => handleImageLoad(style.id)} />
                  
                  {/* Always-visible name label */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
                    <h3 className="font-display md:text-xl text-white text-xl">
                      {style.name}
                    </h3>
                  </div>
                  
                  {/* Image count indicator - visible on hover */}
                  {imageCount > 1 && <div className={cn('absolute bottom-14 right-3 px-2 py-1 rounded-full bg-black/60 text-white text-xs font-medium transition-opacity duration-300', isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}>
                      {imageCount} photos
                    </div>}
                  
                  {/* Hover overlay with "View" indicator - desktop only */}
                  {!isMobile && <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <span className="bg-background/90 text-foreground px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                        View Gallery
                      </span>
                    </div>}
                </div>;
          })}
          </div>
        </div>

        {/* Style lightbox — same superior experience as the homepage gallery */}
        {selectedStyle && (
          <StyleLightbox
            key={selectedStyle.id}
            style={selectedStyle}
            onClose={() => setSelectedStyle(null)}
            onTryStyle={handleTryStyle}
          />
        )}
      </div>
    </section>;
}