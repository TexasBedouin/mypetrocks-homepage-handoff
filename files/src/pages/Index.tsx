import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PetSpinner } from '@/components/brand/PetSpinner';
import { Seo } from '@/components/seo/Seo';
import { WorldsWallHero } from '@/components/landing/home/WorldsWallHero';
import { FearSection } from '@/components/landing/home/FearSection';
import {
  GuestTestSection,
  RecognitionSection,
  StoriesSection,
  FounderSection,
  SignatureSection,
} from '@/components/landing/home/StorySections';
import { HomeGalleryRail } from '@/components/landing/gallery/HomeGalleryRail';
import { StyleGallerySection } from '@/components/landing/StyleGallerySection';
import { PricingSection } from '@/components/landing/PricingSection';
import { CTASection } from '@/components/landing/CTASection';
import { ShopTeaser } from '@/components/landing/ShopTeaser';
import { Footer } from '@/components/landing/Footer';
import { Header } from '@/components/landing/Header';
import { PhotoUpload } from '@/components/flow/PhotoUpload';
import { StyleSelection } from '@/components/flow/StyleSelection';
import { GeneratingScreen } from '@/components/flow/GeneratingScreen';
import { FreeGiftsReveal } from '@/components/flow/FreeGiftsReveal';
import { CanvasCheckout } from '@/components/flow/CanvasCheckout';
import { PosterCheckout } from '@/components/flow/PosterCheckout';
import { EmailAuthModal } from '@/components/flow/EmailAuthModal';
import { CHECKOUT_KEY, CHECKOUT_ORDER_KEY, PACKAGES } from '@/lib/packages';
import { useFlowStore } from '@/stores/flowStore';
import { Style, GeneratedImage, Bundle, Pet, FreeGift, FlowStep } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { mapCheckoutError } from '@/lib/checkoutErrors';
import { capture, identifyUser } from '@/lib/analytics';
import { clarityEvent } from '@/lib/clarity';
import { useAuth } from '@/hooks/useAuth';
// Cart store removed — using Stripe Checkout directly
import { useGenerationStatus } from '@/hooks/useGenerationStatus';
import type { RealtimeChannel } from '@supabase/supabase-js';

// sessionStorage key used to preserve in-flight preview state across the
// /auth?next=/preview redirect. Cleared on restore.
const PREVIEW_STATE_KEY = 'pet-art-prints:preview-state';

interface PreservedPreviewState {
  step: FlowStep;
  petName: string;
  petImageUrl: string | null;
  selectedStyle: Style | null;
  pet: Pet | null;
  generatedImage: GeneratedImage | null;
  freeGift: FreeGift | null;
}

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // /create drops straight into the create flow (no marketing landing). See the
  // create-init effect below for the new-pet vs reuse-photo doors.
  const isCreateRoute = location.pathname === '/create';
  const { user } = useAuth();
  const { 
    step, setStep, 
    petName, setPetName, 
    petImage, setPetImage,
    petImageUrl, setPetImageUrl,
    setSelectedStyle, selectedStyle,
    generatedImage, setGeneratedImage,
    freeGift, setFreeGift,
    setPet, pet,
    setSelectedBundle
  } = useFlowStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  // Reuse-photo door (D2): true when the flow was seeded from an existing pet,
  // so proceedToGeneration reuses that pet_id instead of inserting a new row.
  const [reuseMode, setReuseMode] = useState(false);
  // On /create we briefly initialize the flow before the first meaningful render
  // (reuse fetches the pet). Until then, show a loader instead of flashing the
  // marketing landing. Non-/create routes are ready immediately.
  const [createReady, setCreateReady] = useState(!isCreateRoute);
  // True when the user hit their daily free-preview cap. Sent to FreeGiftsReveal so
  // it shows an honest "daily limit" card instead of the "we'll regenerate / try
  // again" failure UI (which would be misleading — there's nothing to retry).
  const [dailyLimitReached, setDailyLimitReached] = useState(false);
  // Stripe checkout — no cart store needed
  const { limit, checkLimit, isChecking } = useGenerationStatus();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup realtime subscription and timeout on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  // Arriving from another page through a header link (e.g. /#prices): scroll
  // to that section once it has rendered. Gives up quietly after ~2 seconds.
  useEffect(() => {
    if (isCreateRoute || !location.hash) return;
    const id = decodeURIComponent(location.hash.slice(1));
    let tries = 0;
    const timer = window.setInterval(() => {
      const section = document.getElementById(id);
      tries += 1;
      if (section || tries > 20) {
        window.clearInterval(timer);
        section?.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [location.hash, isCreateRoute]);

  // Restore preserved preview state after returning from /auth?next=/preview.
  // Index.tsx's React state is in-memory; without this, returning users land
  // on the empty landing page after sign-in. Runs once on mount.
  useEffect(() => {
    // The /create route drives its own initial state (see the create-init
    // effect) and must not inherit a stale preview stash from a prior /preview
    // round-trip.
    if (isCreateRoute) return;
    try {
      const raw = sessionStorage.getItem(PREVIEW_STATE_KEY);
      if (!raw) return;
      sessionStorage.removeItem(PREVIEW_STATE_KEY);
      const preserved = JSON.parse(raw) as PreservedPreviewState;
      if (preserved.petName) setPetName(preserved.petName);
      if (preserved.petImageUrl) setPetImageUrl(preserved.petImageUrl);
      if (preserved.selectedStyle) setSelectedStyle(preserved.selectedStyle);
      if (preserved.pet) setPet(preserved.pet);
      if (preserved.generatedImage) setGeneratedImage(preserved.generatedImage);
      if (preserved.freeGift) setFreeGift(preserved.freeGift);
      if (preserved.step) setStep(preserved.step);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Failed to restore preview state', err);
      sessionStorage.removeItem(PREVIEW_STATE_KEY);
    }
    // Intentionally run only once on mount.
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // /create init — drive straight into the create flow, one of two doors:
  //   • new pet  (/create)               → reset + jump to the photo upload step
  //   • reuse    (/create?reusePetId=…)   → seed the flow from an existing pet
  //     (D2: one pet, many orders — reuse the photo, skip re-upload + re-analyze)
  //     and jump straight to style selection.
  // Re-runs whenever the create target (path or query) changes, so switching
  // reusePetId — or going new-pet → reuse — re-initializes even if React Router
  // keeps <Index> mounted (a query-only change is a soft navigation, not a remount).
  useEffect(() => {
    if (!isCreateRoute) return;

    const reusePetId = new URLSearchParams(location.search).get('reusePetId');
    // Always start from a clean slate so we never inherit a prior in-flight flow.
    useFlowStore.getState().reset();
    setReuseMode(false);

    if (!reusePetId) {
      // New-pet door: straight to photo upload.
      capture('create_flow_opened', { mode: 'new_pet' });
      setStep('upload');
      setCreateReady(true);
      return;
    }

    // Reuse door: load the existing pet (RLS scopes this to the signed-in user)
    // and seed the store from it, then skip upload entirely. Drop back to the
    // loader while fetching — covers re-entry with a different reusePetId, when
    // createReady is already true from a prior run.
    setCreateReady(false);
    let cancelled = false;
    (async () => {
      const { data: existingPet, error } = await supabase
        .from('pets')
        .select('*')
        .eq('id', reusePetId)
        .single();

      if (cancelled) return;

      if (error || !existingPet) {
        toast.error("We couldn't find that pet — let's start fresh.");
        navigate('/downloads');
        return;
      }

      capture('create_flow_opened', { mode: 'reuse', pet_id: existingPet.id });
      setReuseMode(true);
      setPet(existingPet);
      setPetName(existingPet.name);
      setPetImageUrl(existingPet.original_image_url);
      setStep('style-selection');
      setCreateReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [location.pathname, location.search]); // eslint-disable-line react-hooks/exhaustive-deps

  // NEW FLOW: Upload → Style → PHONE AUTH → Generate → Free Gifts → Bundle
  
  const handleGetStarted = (file?: File) => {
    if (file) {
      // File was dropped in gallery - store it and go to upload for name entry
      setPetImage(file);
    }
    setStep('upload');
  };

  // Step 1: Upload photo (store locally, upload to storage)
  const handlePhotoComplete = async (file: File, name: string) => {
    setPetImage(file);
    setPetName(name);
    
    try {
      // Upload image to public storage (accessible for AI generation)
      const fileExt = file.name.split('.').pop();
      const tempId = crypto.randomUUID();
      const filePath = `pending/${tempId}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('pet-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('pet-images')
        .getPublicUrl(filePath);

      // Store URL for later use after auth
      setPetImageUrl(publicUrl);
      clarityEvent('upload_completed');
      capture('funnel_upload_completed');
      setStep('style-selection');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image. Please try again.');
    }
  };

  // Step 2: Select style, then require auth
  const handleStyleComplete = (style: Style) => {
    setSelectedStyle(style);
    capture('funnel_style_selected', { style_id: style.id, style_name: style.name });

    // If already logged in, proceed to generation
    if (user) {
      proceedToGeneration(style);
    } else {
      // Show auth modal
      setShowAuthModal(true);
    }
  };

  // Step 3: After auth, create pet record and generate
  const handleAuthComplete = async () => {
    setShowAuthModal(false);
    capture('funnel_auth_completed');
    const { data: { user: authedUser } } = await supabase.auth.getUser();
    if (authedUser) {
      identifyUser(authedUser.id, authedUser.email);
    }

    if (selectedStyle) {
      await proceedToGeneration(selectedStyle);
    }
  };

  const proceedToGeneration = async (style: Style) => {
    setDailyLimitReached(false); // reset; re-set only if the limit check trips below
    setStep('generating');
    setIsGenerating(true);

    try {
      // Get current user (should exist after auth)
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (!currentUser) {
        throw new Error('Authentication required');
      }

      const imageUrl = useFlowStore.getState().petImageUrl;
      if (!imageUrl) {
        throw new Error('Pet image not found');
      }

      // Reuse door (D2 + F3): a returning paid customer reusing an existing pet
      // has already seen their pet rendered. Skip the watermarked free preview
      // entirely — and the daily free-preview cap, which shouldn't gate a buyer —
      // and route straight to the format-choice screen for the seeded pet. No
      // generation, so no checkLimit / pets insert / generate-free-gifts.
      if (reuseMode) {
        const seededPet = useFlowStore.getState().pet;
        if (!seededPet) {
          throw new Error('Pet record unavailable');
        }
        setIsGenerating(false);
        setStep('free-gifts-reveal');
        return;
      }

      // Check the daily free-preview cap first (userId extracted from auth token
      // server-side). Computed before any insert so a limit-check failure can't
      // leave an orphan pets row.
      const limitStatus = await checkLimit();

      // Resolve the pet row exactly once — needed whether or not the cap was hit,
      // so a rate-limited buyer still has a pet to purchase for.
      // Reuse door (D2): the pet was seeded from an existing row — reuse its id
      // (one pet, many orders) and trust the cached identity_card, so skip both
      // the insert and the analyze-pet pre-warm. New-pet door: insert a fresh
      // pets row and pre-warm the identity card for likeness preservation.
      let petRecord = useFlowStore.getState().pet;
      if (!reuseMode || !petRecord) {
        const { data: petData, error: petError } = await supabase
          .from('pets')
          .insert({
            user_id: currentUser.id,
            name: petName,
            original_image_url: imageUrl,
          })
          .select()
          .single();

        if (petError) throw petError;
        petRecord = petData;
        setPet(petData);

        // Pre-warm the pet identity card via Gemini Flash vision analysis
        // (fire-and-forget — runs in parallel with style generation, no await needed)
        // Errors are logged at error level (not warn) so browser monitoring picks them up
        supabase.functions.invoke('analyze-pet', { body: { petId: petData.id } })
          .catch(err => console.error('[analyze-pet pre-warm failed]', { petId: petData.id, error: err }));
      }

      if (!petRecord) {
        throw new Error('Pet record unavailable');
      }

      // D4: keep the cap, but stay graceful — out of free previews lands the buyer
      // on the purchase screen with their pet ready, not a dead end.
      if (limitStatus && !limitStatus.canGenerate) {
        toast.info('You\'ve used your free previews for today — go ahead and pick your package!');
        setDailyLimitReached(true);
        setIsGenerating(false);
        setStep('free-gifts-reveal');
        return;
      }

      // Call generate-free-gifts (now returns immediately with pending status)
      const { data, error } = await supabase.functions.invoke('generate-free-gifts', {
        body: {
          petId: petRecord.id,
          petImageUrl: imageUrl,
          petName: petName,
          styleId: style.id,
          userId: currentUser.id,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Generation failed');
      }

      if (data.error) {
        // Handle rate limiting and payment errors with user-friendly messages
        if (data.limitReached || data.error.includes('Daily limit')) {
          toast.error(`Daily limit reached. Resets at midnight UTC.`);
        } else if (data.error.includes('Rate limit')) {
          toast.error('Service is busy. Please try again in a moment.');
        } else if (data.error.includes('Payment required')) {
          toast.error('Service temporarily unavailable. Please try again later.');
        }
        throw new Error(data.error);
      }

      // NEW: Check if response indicates async processing (pending)
      if (data.pending && data.freeGiftId) {
        if (import.meta.env.DEV) console.log(`Generation enqueued, subscribing to free_gift ${data.freeGiftId}`);
        
        // Subscribe to realtime updates for this free_gift
        const channel = supabase
          .channel(`free-gift-${data.freeGiftId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'free_gifts',
              filter: `id=eq.${data.freeGiftId}`,
            },
            (payload) => {
              if (import.meta.env.DEV) console.log('Free gift update received:', payload);
              const newData = payload.new as {
                id: string;
                status: string;
                preview_image_url: string;
                pet_id: string;
                user_id: string;
                preview_style_id: string;
                sticker_sheet_url: string | null;
                personality_card_url: string | null;
                personality_archetype: string | null;
                personality_strength: string | null;
                personality_weakness: string | null;
                created_at: string;
              };
              
              if (newData.status === 'complete' && newData.preview_image_url !== 'pending') {
                // Generation finished - cancel fallback timeout
                if (timeoutRef.current) {
                  clearTimeout(timeoutRef.current);
                  timeoutRef.current = null;
                }
                if (import.meta.env.DEV) console.log('Generation complete:', newData.preview_image_url);
                
                // Set generated image
                const generatedImageData: GeneratedImage = {
                  id: newData.id,
                  pet_id: newData.pet_id,
                  style_id: style.id,
                  original_url: newData.preview_image_url,
                  watermarked_url: newData.preview_image_url,
                  is_purchased: false,
                  created_at: newData.created_at,
                };
                
                setGeneratedImage(generatedImageData);

                // Set free gift
                setFreeGift({
                  id: newData.id,
                  pet_id: newData.pet_id,
                  user_id: newData.user_id,
                  preview_style_id: newData.preview_style_id,
                  preview_image_url: newData.preview_image_url,
                  sticker_sheet_url: newData.sticker_sheet_url,
                  personality_card_url: newData.personality_card_url,
                  personality_archetype: newData.personality_archetype,
                  personality_strength: newData.personality_strength,
                  personality_weakness: newData.personality_weakness,
                  created_at: newData.created_at,
                });

                toast.success('Your free art pack is ready!');
                setIsGenerating(false);
                setStep('free-gifts-reveal');

                // Cleanup subscription
                supabase.removeChannel(channel);
                channelRef.current = null;
              } else if (newData.status === 'failed') {
                // Cancel fallback timeout
                if (timeoutRef.current) {
                  clearTimeout(timeoutRef.current);
                  timeoutRef.current = null;
                }
                console.error('Generation failed');
                toast.error('Generation failed. Please try again.');
                setIsGenerating(false);
                setStep('style-selection');

                // Cleanup subscription
                supabase.removeChannel(channel);
                channelRef.current = null;
              }
            }
          )
          .subscribe((status) => {
            if (import.meta.env.DEV) console.log('Realtime subscription status:', status);
          });

        channelRef.current = channel;
        
        // Timeout fallback - poll if realtime doesn't fire in 90s
        timeoutRef.current = setTimeout(async () => {
          timeoutRef.current = null;
          if (import.meta.env.DEV) console.log('Realtime timeout - polling database directly');
          
          const { data: freeGiftData, error: pollError } = await supabase
            .from('free_gifts')
            .select('*')
            .eq('id', data.freeGiftId)
            .single();
          
          if (pollError) {
            console.error('Polling error:', pollError);
            toast.error('Connection lost. Please refresh the page.');
            setIsGenerating(false);
            setStep('style-selection');
            supabase.removeChannel(channel);
            channelRef.current = null;
            return;
          }
          
          if (freeGiftData?.status === 'complete' && freeGiftData?.preview_image_url !== 'pending') {
            // Success via polling
            if (import.meta.env.DEV) console.log('Generation complete via polling:', freeGiftData.preview_image_url);
            
            const generatedImageData: GeneratedImage = {
              id: freeGiftData.id,
              pet_id: freeGiftData.pet_id,
              style_id: style.id,
              original_url: freeGiftData.preview_image_url,
              watermarked_url: freeGiftData.preview_image_url,
              is_purchased: false,
              created_at: freeGiftData.created_at,
            };
            
            setGeneratedImage(generatedImageData);
            setFreeGift({
              id: freeGiftData.id,
              pet_id: freeGiftData.pet_id,
              user_id: freeGiftData.user_id,
              preview_style_id: freeGiftData.preview_style_id,
              preview_image_url: freeGiftData.preview_image_url,
              sticker_sheet_url: freeGiftData.sticker_sheet_url,
              personality_card_url: freeGiftData.personality_card_url,
              personality_archetype: freeGiftData.personality_archetype,
              personality_strength: freeGiftData.personality_strength,
              personality_weakness: freeGiftData.personality_weakness,
              created_at: freeGiftData.created_at,
            });
            
            toast.success('Your free art pack is ready!');
            setIsGenerating(false);
            setStep('free-gifts-reveal');
            supabase.removeChannel(channel);
            channelRef.current = null;
          } else if (freeGiftData?.status === 'failed') {
            // Failed via polling
            console.error('Generation failed (polled)');
            toast.error('Generation failed. Please try again.');
            setIsGenerating(false);
            setStep('style-selection');
            supabase.removeChannel(channel);
            channelRef.current = null;
          } else {
            // Still processing after 90s
            toast.error('Generation is taking longer than expected. Please try again.');
            setIsGenerating(false);
            setStep('style-selection');
            supabase.removeChannel(channel);
            channelRef.current = null;
          }
        }, 90000);
        

        return; // Don't set isGenerating to false - wait for realtime update
      }

      // LEGACY: Handle synchronous response (for backwards compatibility)
      if (data.previewImageUrl) {
        const generatedImageData: GeneratedImage = {
          id: data.freeGiftId || crypto.randomUUID(),
          pet_id: petRecord.id,
          style_id: style.id,
          original_url: data.previewImageUrl,
          watermarked_url: data.previewImageUrl,
          is_purchased: false,
          created_at: new Date().toISOString(),
        };

        setGeneratedImage(generatedImageData);

        setFreeGift({
          id: data.freeGiftId || crypto.randomUUID(),
          pet_id: petRecord.id,
          user_id: currentUser.id,
          preview_style_id: style.id,
          preview_image_url: data.previewImageUrl,
          sticker_sheet_url: data.stickerSheetUrl || null,
          personality_card_url: data.personalityCardUrl || null,
          personality_archetype: data.personalityArchetype || null,
          personality_strength: data.personalityStrength || null,
          personality_weakness: data.personalityWeakness || null,
          created_at: new Date().toISOString(),
        });

        toast.success('Your free art pack is ready!');
        setStep('free-gifts-reveal');
        setIsGenerating(false);
      }
    } catch (error) {
      console.error('Generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate preview';
      toast.error(errorMessage);
      setStep('style-selection');
      setIsGenerating(false);
    }
  };

  // Step 4: Format selected on preview page → create order + checkout
  const handleFormatSelected = async (
    bundle: Bundle,
    opts?: { size?: string; styleIds?: string[]; slug?: string }
  ) => {
    if (!user) {
      // #12 sign-in gate: stash preview state in sessionStorage so the user
      // returns to the same preview screen after signing in, then redirect
      // to /auth?next=/preview. Throw so FreeGiftsReveal's catch block resets
      // the CTA loading state immediately.
      try {
        const preserved: PreservedPreviewState = {
          step: 'free-gifts-reveal',
          petName,
          petImageUrl,
          selectedStyle,
          pet,
          generatedImage,
          freeGift,
        };
        sessionStorage.setItem(PREVIEW_STATE_KEY, JSON.stringify(preserved));
      } catch (err) {
        if (import.meta.env.DEV) console.error('Failed to stash preview state', err);
      }
      navigate('/auth?next=/preview');
      throw new Error('Sign in required to complete checkout');
    }
    if (!pet) {
      toast.error('Missing pet info — please re-upload your photo.');
      throw new Error('Missing pet info');
    }

    setSelectedBundle(bundle);

    // Canvas-hero passes all 3 styles up front (opts.styleIds). The digital path
    // sends only the preview style; the buyer picks 2 more on /free-gifts after checkout.
    const selectedStyleIds = opts?.styleIds ?? (selectedStyle ? [selectedStyle.id] : []);

    // Track the inserted order id so we can DELETE the orphan row if Stripe
    // handoff fails (mirrors the upsell checkout cleanup pattern in
    // useUpsellCheckout.ts).
    let createdOrderId: string | null = null;

    try {
      // Step 1: Create order in Supabase
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          pet_id: pet.id,
          bundle_type: opts?.slug ?? bundle.type,
          bundle_price: bundle.price,
          selected_styles: selectedStyleIds,
          status: 'pending',
          email: user.email || null,
          physical_product_type: bundle.physicalProductType || null,
        })
        .select()
        .single();

      if (orderError || !order) {
        console.error('Order creation error:', orderError);
        throw new Error('Failed to create order');
      }

      createdOrderId = order.id;
      if (import.meta.env.DEV) console.log('Order created:', order.id);

      // Step 2: Create Stripe Checkout Session via edge function
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke(
        'create-checkout-session',
        {
          body: {
            orderId: order.id,
            bundleType: bundle.type,
            bundleName: bundle.name,
            price: bundle.price,
            size: opts?.size ?? null,
            userId: user.id,
            petId: pet.id,
            styles: selectedStyleIds,
            successUrl: `${window.location.origin}/downloads`,
            cancelUrl: window.location.origin,
          },
        }
      );

      if (checkoutError) {
        throw checkoutError;
      }
      if (!checkoutData?.url) {
        throw new Error('Checkout session did not return a URL');
      }

      // Set sessionStorage flags ONLY now, right before the redirect, so a
      // failed attempt never strands stale keys.
      sessionStorage.setItem(CHECKOUT_KEY, 'true');
      sessionStorage.setItem(CHECKOUT_ORDER_KEY, createdOrderId);

      capture('funnel_checkout_started', {
        order_id: createdOrderId,
        bundle_type: bundle.type,
        price_usd: bundle.price,
      });

      // Step 3: Redirect to Stripe Checkout
      const checkoutUrl = checkoutData.url;
      const newTab = window.open(checkoutUrl, '_blank');

      if (!newTab || newTab.closed) {
        // Popup was blocked — redirect in current tab instead
        window.location.href = checkoutUrl;
        return;
      }

      toast.success('Checkout opened in new tab!', {
        description: 'After completing your purchase, return here to view your portraits.',
        duration: 15000,
        action: {
          label: 'Go to My Portraits',
          onClick: () => navigate('/downloads'),
        },
      });
    } catch (error) {
      console.error('Checkout error:', error);

      // Orphan cleanup: best-effort delete of the row we inserted.
      // v5: RLS limits DELETE to auth.uid() = user_id so this can only ever
      // affect rows the current user just created. Surface any unexpected
      // failure via console.error.
      if (createdOrderId) {
        try {
          const { error: cleanupError } = await supabase
            .from('orders')
            .delete()
            .eq('id', createdOrderId);
          if (cleanupError) {
            console.error('Failed to clean up orphan order row:', cleanupError);
          }
        } catch (cleanupErr) {
          console.error('Failed to clean up orphan order row:', cleanupErr);
        }
      }

      // Scrub any stale sessionStorage flags from this attempt.
      sessionStorage.removeItem(CHECKOUT_KEY);
      sessionStorage.removeItem(CHECKOUT_ORDER_KEY);

      const msg = await mapCheckoutError(error, 'Failed to create checkout');
      toast.error(msg);
    }
  };

  // /create initialization interstitial — avoids flashing the marketing landing
  // while we seed the flow (the reuse door fetches the pet first). The reuse
  // label confirms continuity from the "Make more of [Pet]" button that sent
  // them here.
  if (isCreateRoute && !createReady) {
    const isReuse = new URLSearchParams(location.search).has('reusePetId');
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <PetSpinner size={72} label={isReuse ? 'Finding your pet…' : 'Getting things ready'} />
      </main>
    );
  }

  // Render generating screen with limit info
  if (isGenerating && selectedStyle) {
    return (
      <GeneratingScreen
        petName={petName} 
        styleName={selectedStyle.name}
        limitInfo={limit ? {
          remaining: limit.remaining,
          dailyLimit: limit.dailyLimit,
          hoursUntilReset: limit.hoursUntilReset,
        } : undefined}
      />
    );
  }

  // Render based on current step
  switch (step) {
    case 'upload':
      return (
        <PhotoUpload
          onComplete={handlePhotoComplete}
          // On /create, "Back" returns to the Hub (My Portraits) rather than the
          // marketing landing the homepage flow falls back to.
          onBack={isCreateRoute ? () => navigate('/downloads') : () => setStep('landing')}
        />
      );

    case 'style-selection':
      return (
        <>
          <StyleSelection
            onComplete={handleStyleComplete}
            // Reuse door starts here (no upload step preceded it), so "Back" goes
            // to the Hub; the new-pet flow steps back to the photo upload.
            onBack={reuseMode ? () => navigate('/downloads') : () => setStep('upload')}
            petName={petName}
          />
          <EmailAuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onAuthenticated={handleAuthComplete}
          />
        </>
      );
    
    case 'generating':
      return <GeneratingScreen petName={petName} styleName={selectedStyle?.name || 'Portrait'} />;
    
    case 'free-gifts-reveal':
      return (
        <FreeGiftsReveal
          generatedImage={generatedImage}
          freeGift={freeGift}
          style={selectedStyle}
          petName={petName}
          dailyLimitReached={dailyLimitReached}
          onContinue={handleFormatSelected}
          onChooseCanvas={() => setStep('canvas-checkout')}
          onChoosePoster={() => setStep('poster-checkout')}
          reuseMode={reuseMode}
          petId={pet?.id}
          petImageUrl={petImageUrl}
          onRetryComplete={(newUrl) => {
            if (generatedImage) {
              setGeneratedImage({ ...generatedImage, watermarked_url: newUrl, original_url: newUrl });
            }
          }}
        />
      );

    case 'canvas-checkout':
      return (
        <CanvasCheckout
          petName={petName}
          previewStyle={selectedStyle}
          onConfirm={(size, styleIds) => {
            const canvasPkg = PACKAGES.find((p) => p.type === 'canvas-print');
            if (!canvasPkg) {
              toast.error('Canvas option is unavailable right now.');
              // Throw so CanvasCheckout's catch resets its submitting state and
              // shows the retry message — a silent return leaves it spinning.
              throw new Error('canvas-print package not found');
            }
            return handleFormatSelected(
              { ...canvasPkg, price: size.price },
              { size: size.value, styleIds, slug: size.slug }
            );
          }}
          onBack={() => setStep('free-gifts-reveal')}
        />
      );

    case 'poster-checkout':
      return (
        <PosterCheckout
          petName={petName}
          previewStyle={selectedStyle}
          onConfirm={(size, styleIds) => {
            const posterPkg = PACKAGES.find((p) => p.type === 'poster-print');
            if (!posterPkg) {
              toast.error('Poster option is unavailable right now.');
              // Throw so PosterCheckout's catch resets its submitting state and
              // shows the retry message — a silent return leaves it spinning.
              throw new Error('poster-print package not found');
            }
            return handleFormatSelected(
              { ...posterPkg, price: size.price },
              { size: size.value, styleIds, slug: size.slug }
            );
          }}
          onBack={() => setStep('free-gifts-reveal')}
        />
      );

    default:
      return (
        <main className="relative">
          <Seo
            title="MyPet.Rocks - See Your Pet as Gallery Art, Free Preview"
            description="Your pet, inside a real art tradition. Upload one photo and see your portrait free in about 30 seconds, before you pay. Canvas, poster, or digital."
            path="/"
          />
          {/* Header with Auth */}
          <Header />

          {/* Landing page. Section order follows the approved "Your world,
              with your pet in it" design: all 15 styles up front, the
              likeness fear answered second, proof and story after, prices
              near the end. Top padding clears the fixed header. */}
          <div className="pt-14">
            <WorldsWallHero onGetStarted={handleGetStarted} />
            <FearSection />
            <HomeGalleryRail />
            <StyleGallerySection onTryStyle={handleGetStarted} />
            <GuestTestSection />
            <RecognitionSection />
            <StoriesSection />
            <PricingSection onGetStarted={handleGetStarted} />
            <FounderSection />
            <SignatureSection />
            {/* Ready-made shop teaser: self-gates on active products */}
            <ShopTeaser />
            <CTASection onGetStarted={handleGetStarted} />
            <Footer />
          </div>
        </main>
      );
  }
};

export default Index;
