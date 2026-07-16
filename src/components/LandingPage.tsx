interface LandingPageProps {
  onEnter: () => void;
}

export function LandingPage({ onEnter }: LandingPageProps) {
  return (
    <div className="landing-page relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 py-12 text-center">
      <div className="landing-page__glow landing-page__glow--a" aria-hidden="true" />
      <div className="landing-page__glow landing-page__glow--b" aria-hidden="true" />
      <div className="landing-page__dots" aria-hidden="true" />

      <div className="landing-page__content relative z-10 mx-auto flex max-w-lg flex-col items-center gap-6 sm:gap-7">
        <p className="landing-page__brand font-heading text-5xl font-extrabold tracking-tight text-rose-500 sm:text-6xl md:text-7xl">
          StudyBuddy
        </p>

        <h1 className="font-heading text-2xl font-bold leading-snug text-gray-800 sm:text-3xl">
          Your calm corner for uni life
        </h1>

        <p className="max-w-md text-base font-medium leading-relaxed text-gray-500 sm:text-lg">
          A soft space to map courses, weeks, and study sessions—so the semester feels manageable.
        </p>

        <button
          type="button"
          onClick={onEnter}
          className="mt-1 rounded-2xl bg-pink-500 px-8 py-3.5 text-base font-bold text-white shadow-md shadow-pink-200/80 transition-colors hover:bg-pink-600 sm:px-10 sm:py-4 sm:text-lg"
        >
          Open planner
        </button>
      </div>
    </div>
  );
}
