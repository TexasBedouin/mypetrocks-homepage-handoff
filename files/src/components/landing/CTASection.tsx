interface CTASectionProps {
  onGetStarted: (file?: File) => void;
}
export function CTASection({
  onGetStarted
}: CTASectionProps) {
  return <section className="py-32 md:py-40 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Headline */}
          <h2 className="font-display font-semibold text-4xl md:text-5xl text-foreground leading-tight mb-12">
            Your gallery wall is missing one piece. You already know which one.
          </h2>

          {/* CTA Button — same gold, same shape as the hero CTA */}
          <button onClick={() => onGetStarted()} className="
              inline-flex h-14 items-center rounded-lg
              bg-primary px-10 text-lg font-semibold text-primary-foreground
              shadow-lg transition-all duration-200
              hover:-translate-y-0.5 hover:brightness-105
            ">
            See your pet's portrait free
          </button>

          {/* Subtext */}
          <p className="mt-6 mx-auto max-w-md text-muted-foreground text-base leading-relaxed">
            About 30 seconds. No card. Don't love it? Don't buy it.
          </p>
        </div>
      </div>
    </section>;
}