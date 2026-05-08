import { NavHeader } from './sections/nav-header';
import { Hero } from './sections/hero';
import { Problem } from './sections/problem';
import { HowItWorks } from './sections/how-it-works';
import { Scenarios } from './sections/scenarios';
import { StatsBarSection } from './sections/stats-bar';
import { LandingFooter } from './sections/footer';

export function LandingPageShell() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="paper-grain pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <NavHeader />
      <Hero />
      <Problem />
      <HowItWorks />
      <Scenarios />
      <StatsBarSection />
      <LandingFooter />
    </main>
  );
}
