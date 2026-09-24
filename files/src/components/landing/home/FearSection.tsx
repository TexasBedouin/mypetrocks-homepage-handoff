import { useMemo, useState } from 'react';
import { BeforeAfterSlider } from '@/components/ui/before-after-slider';
import { useLikenessPairs } from '@/hooks/useLikenessPairs';
import { cn } from '@/lib/utils';
import { pairsForChoice, type PetChoice } from './homeLayout';

const PET_CHOICES: { value: PetChoice; label: string }[] = [
  { value: 'all', label: 'All pets' },
  { value: 'dog', label: 'Dogs' },
  { value: 'cat', label: 'Cats' },
];

const STEPS = [
  {
    title: 'Upload one photo',
    body: 'Any clear photo from your camera roll.',
  },
  {
    title: 'See it free in about 30 seconds',
    body: 'Not right? Try again. Up to 3 free previews.',
  },
  {
    title: 'Get 3 portraits, pick your favorite',
    body: "All 3 HD portraits are yours. Printing? Pick the one to print whenever you're ready. Nothing prints until you choose, and your refund is yours any time before it does.",
  },
];

/**
 * Answers the #1 objection right under the hero: "will it actually look like
 * my dog?" A before/after slider the visitor can filter to their kind of pet,
 * then the three steps that show the whole flow is built around that fear.
 */
export function FearSection() {
  const { pairs, loading } = useLikenessPairs();
  const [choice, setChoice] = useState<PetChoice>('all');
  const [index, setIndex] = useState(0);

  const visible = useMemo(() => pairsForChoice(pairs, choice), [pairs, choice]);
  // Only offer a pet filter when there is at least one pair for it.
  const choices = PET_CHOICES.filter(
    (c) => c.value === 'all' || pairsForChoice(pairs, c.value).length > 0,
  );
  const current = visible[index % Math.max(visible.length, 1)];

  function pick(next: PetChoice) {
    setChoice(next);
    setIndex(0);
  }

  return (
    <section id="how-it-works" className="scroll-mt-14 bg-background py-16 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div
          className={cn(
            'grid items-center gap-10',
            (loading || current) && 'md:grid-cols-[minmax(0,460px)_1fr] md:gap-16',
          )}
        >
          <div>
            <h2 className="font-display font-medium leading-[1.02] text-foreground text-[clamp(34px,4.6vw,62px)]">
              "Will it actually look like my {choice === 'cat' ? 'cat' : 'dog'}?"
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              A fair question. AI can get things wrong. A missing marking. Eyes that aren't quite
              right. That's why you see it free first, and if it isn't them, you don't buy.
            </p>
            {choices.length > 1 && (
              <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Show examples for">
                {choices.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    aria-pressed={choice === c.value}
                    onClick={() => pick(c.value)}
                    className={cn(
                      'h-12 rounded-full border px-5 text-base font-medium transition-colors',
                      choice === c.value
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border text-foreground/85 hover:border-primary/60',
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reserve the slider's space while pairs load so the page doesn't jump. */}
          {loading && <div className="aspect-square w-full rounded-lg bg-background-dark" aria-hidden="true" />}
          {!loading && current && (
            <div>
              <BeforeAfterSlider
                key={current.id}
                variant="gallery"
                beforeImage={current.beforeUrl}
                afterImage={current.afterUrl}
                beforeLabel={current.petName ? `${current.petName}, the photo` : 'Your photo'}
                afterLabel="The portrait"
              />
              {visible.length > 1 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {visible.map((p, i) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setIndex(i)}
                      aria-label={`Show ${p.petName || 'this pet'}`}
                      aria-pressed={i === index % visible.length}
                      className={cn(
                        'h-16 w-16 overflow-hidden rounded-lg border-2 transition-colors',
                        i === index % visible.length ? 'border-primary' : 'border-transparent',
                      )}
                    >
                      <img src={p.afterUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-16 md:mt-24">
          <h3 className="font-display font-medium text-foreground text-[clamp(28px,3.4vw,46px)]">
            The whole system is built around that fear.
          </h3>
          <p className="mt-3 max-w-3xl text-lg text-muted-foreground">
            And you don't get one portrait. Every order includes{' '}
            <strong className="font-semibold text-primary">3 HD portraits of your pet</strong>, so you
            pick your favorite from three.
          </p>
          <ol className="mt-8 grid gap-5 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="border-t-2 border-primary bg-background-dark p-7">
                <span className="font-display text-4xl text-primary">{i + 1}</span>
                <p className="mt-2 text-xl font-semibold text-foreground">{step.title}</p>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
