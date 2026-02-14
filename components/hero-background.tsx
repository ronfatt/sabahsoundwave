export function HeroBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="hero-aurora-a absolute -left-20 -top-20 h-72 w-72 rounded-full" />
      <div className="hero-aurora-b absolute -right-20 -bottom-16 h-80 w-80 rounded-full" />
      <div className="hero-noise absolute inset-0" />
      <div className="hero-bottom-fade absolute inset-x-0 bottom-0 h-28" />
    </div>
  );
}
