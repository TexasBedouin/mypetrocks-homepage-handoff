import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

/*
 * Static storytelling sections for the homepage. Copy comes from the approved
 * messaging framework (Notion: "MyPet.Rocks Messaging Framework (Clean, v1)").
 *
 * PHOTOS NEEDED: until a path is set, a section renders its text-only layout
 * (no empty boxes on the live site). Drop files in public/home/ and set paths.
 */
// Amer's two dogs and his cat. Pets only: the founder prefers not to show his face.
const FOUNDER_PHOTO: string | null = '/home/founder-pets.webp';
// Jan van Eyck, The Arnolfini Portrait (1434). Public domain painting.
const ARNOLFINI_DOG_PHOTO: string | null = '/home/arnolfini-portrait.webp';

interface Story {
  quote: string;
  story: string;
  /** What we made (portrait, shirt, wall). Customer-provided, with permission. */
  photo: string;
  photoAlt: string;
  /** The real pet, shown as a small round photo on the corner of `photo`. */
  realPhoto: string;
  realLabel: string;
}

/**
 * Where the stars come from. All three customers left 5-star reviews on the
 * former MyPetRocksArt Etsy shop (founder confirmed 2026-09-24; the shop page
 * still shows its 5-star rating). Only show stars that are real reviews.
 */
const REVIEW_SOURCE = 'Etsy';

const STORIES: Story[] = [
  {
    quote: 'Everyone at the office is asking me about this shirt.',
    story:
      'She gave her husband a shirt with Feather, their chicken, in space, in the Retro Cosmic Voyager style. It is now the shirt he wears more than any other.',
    photo: '/home/testimonials/chicken-shirt.webp',
    photoAlt: 'A navy t-shirt printed with Feather the chicken in a space helmet among planets',
    realPhoto: '/home/testimonials/chicken-shirt-real.webp',
    realLabel: 'The real Feather',
  },
  {
    quote: 'Please make sure the tongue still sticks out.',
    story: 'She was browsing for art, not pet art. Her cat has one signature move. It did.',
    photo: '/home/testimonials/tongue-cat-portrait.webp',
    photoAlt: 'A black cat portrait among cherry blossoms, tongue sticking out',
    realPhoto: '/home/testimonials/tongue-cat-real.webp',
    realLabel: 'The real cat',
  },
  {
    quote: 'This will work really well on my wall.',
    story:
      'Black frames, gold accents, and the Kanazawa Gold Leaf style. Her pet did not interrupt the wall she had built. It finished it.',
    photo: '/home/testimonials/gold-wall.webp',
    photoAlt: 'A gallery wall with a gold leaf portrait of a long-haired dog with a blue bow',
    realPhoto: '/home/testimonials/gold-wall-real.webp',
    realLabel: 'The real pup',
  },
];

const SECTION_Y = 'py-16 md:py-28';

export function GuestTestSection() {
  return (
    <section className="relative overflow-hidden">
      <img
        src="/hero/beans-gallery-wall.webp"
        alt="A pit bull's engraved portrait hanging in a curated gallery wall"
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover object-[center_40%] md:left-auto md:right-0 md:w-[64%]"
      />
      {/* Desktop: the photo sits in the right two-thirds so the copy never
          covers the portrait on the wall; the fade blends its left edge. */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20 md:bg-gradient-to-r md:from-background md:from-40% md:via-background/60 md:via-50% md:to-transparent md:to-70%" />
      <div className="relative mx-auto flex min-h-[520px] max-w-6xl items-end px-5 py-16 md:min-h-[620px] md:items-center">
        <div className="max-w-xl">
          <p className="font-display text-[clamp(44px,6vw,76px)] italic leading-none text-foreground">
            "Wait... is that <span className="text-primary">her</span>?"
          </p>
          <p className="mt-6 text-lg leading-relaxed text-foreground/85 md:text-xl">
            Guests stop in front of it for one reason. It isn't the dog. It's the world you chose,
            and the story of why you chose it.
          </p>
        </div>
      </div>
    </section>
  );
}

export function RecognitionSection() {
  return (
    <section className={cn(SECTION_Y, 'bg-background text-center')}>
      <div className="mx-auto max-w-4xl px-5">
        <h2 className="font-display font-medium leading-[1.1] text-foreground text-[clamp(32px,4.6vw,64px)]">
          Your walls say who you are.
          <br />
          Your camera roll holds who you love.
        </h2>
        <p className="mt-5 font-display text-[clamp(26px,3vw,40px)] italic text-primary">
          The two never meet.
        </p>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Everything made for pet lovers looks the same. The dog mom mug. The paw print pillow.
          Sweet, but not your style. So your taste stayed on the wall, and your pet stayed on your
          phone.
        </p>
        <p className="mt-6 text-base tracking-wide text-muted-foreground">
          For the dog parent whose aesthetic isn't "dog parent."
        </p>
      </div>
    </section>
  );
}

export function StoriesSection() {
  return (
    <section className={cn(SECTION_Y, 'bg-background-dark')}>
      <div className="mx-auto max-w-6xl px-5">
        <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-primary">
          Happy customers
        </p>
        <h2 className="mt-3 font-display font-medium text-foreground text-[clamp(34px,4.2vw,60px)]">
          Their world, <em className="text-primary">with their pet in it.</em>
        </h2>
        <div className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
          {STORIES.map((s) => (
            <figure key={s.quote} className="flex flex-col gap-4">
              <div className="relative">
                <img
                  src={s.photo}
                  alt={s.photoAlt}
                  loading="lazy"
                  className="aspect-[4/3] w-full rounded-lg object-cover"
                />
                {/* The real pet, big enough to compare with the result at a glance. */}
                <figure className="absolute -bottom-14 left-4 m-0 flex items-end gap-3">
                  <img
                    src={s.realPhoto}
                    alt={s.realLabel}
                    loading="lazy"
                    className="h-28 w-28 rounded-full object-cover shadow-lg ring-4 ring-background-dark md:h-32 md:w-32"
                  />
                  <figcaption className="mb-2 rounded-md bg-background-dark px-2.5 py-1 text-[15px] font-medium text-foreground">
                    {s.realLabel}
                  </figcaption>
                </figure>
              </div>
              <div className="h-12" aria-hidden="true" />
              <p
                className="flex items-center gap-2 text-[15px] text-muted-foreground"
                aria-label={`Rated 5 out of 5 stars on ${REVIEW_SOURCE}`}
              >
                <span className="flex gap-0.5 text-primary" aria-hidden="true">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </span>
                <span aria-hidden="true">5-star review on {REVIEW_SOURCE}</span>
              </p>
              <blockquote className="font-display text-[28px] italic leading-tight text-foreground">
                "{s.quote}"
              </blockquote>
              <figcaption className="text-base leading-relaxed text-muted-foreground">
                {s.story}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FounderSection() {
  return (
    <section className={cn(SECTION_Y, 'bg-background-dark')}>
      <div
        className={cn(
          'mx-auto grid max-w-6xl items-center gap-10 px-5',
          FOUNDER_PHOTO && 'md:grid-cols-[520px_1fr] md:gap-16',
        )}
      >
        {FOUNDER_PHOTO && (
          <img
            src={FOUNDER_PHOTO}
            alt="Amer's two dogs on a black leather couch, one grinning at the camera, with his long-haired cat standing behind them"
            loading="lazy"
            className="aspect-[4/3] w-full rounded-lg object-cover"
          />
        )}
        <div className={cn(!FOUNDER_PHOTO && 'mx-auto max-w-3xl text-center')}>
          <p className="font-display text-[clamp(32px,4vw,56px)] italic leading-[1.06] text-foreground">
            "They barged into my world. Now they all fit in it."
          </p>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Nobody really picks a pet. They show up, and they barge into your world. I'm Amer. I have
            two dogs and a cat, and I built MyPet.Rocks because nothing was good enough for my own
            walls. I'm a real person, not an anonymous app. Meet my animals on social, or email me directly.
          </p>
          <p className="mt-5 text-lg text-primary">
            There's a person here who cares. That's rarer than it should be.
          </p>
        </div>
      </div>
    </section>
  );
}

export function SignatureSection() {
  return (
    <section className={cn(SECTION_Y, 'bg-background')}>
      <div
        className={cn(
          'mx-auto grid max-w-6xl items-center gap-10 px-5',
          ARNOLFINI_DOG_PHOTO && 'md:grid-cols-[440px_1fr] md:gap-16',
        )}
      >
        {ARNOLFINI_DOG_PHOTO && (
          <figure className="m-0">
            <img
              src={ARNOLFINI_DOG_PHOTO}
              alt="Jan van Eyck's Arnolfini Portrait: a couple holding hands, with a small brown dog standing at their feet"
              loading="lazy"
              className="w-full rounded-lg object-cover"
            />
            <figcaption className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              Jan van Eyck, <em>The Arnolfini Portrait</em>, 1434. Look at their feet.
            </figcaption>
          </figure>
        )}
        <div className={cn(!ARNOLFINI_DOG_PHOTO && 'mx-auto max-w-3xl text-center')}>
          <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-primary">
            A 500-year-old tradition
          </p>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground md:text-xl">
            In the old masters, a small dog at someone's feet meant loyalty. A hound meant nobility.
            The painter put it there to say something about the person who paid for the portrait.
          </p>
          <p className="mt-6 font-display text-[clamp(32px,4vw,56px)] leading-[1.05] text-foreground">
            The pet was never the subject. It was <em className="text-primary">the signature.</em>
          </p>
        </div>
      </div>
    </section>
  );
}
