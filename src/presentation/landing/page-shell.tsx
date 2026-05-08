import { NavHeader } from './sections/nav-header';
import { Hero } from './sections/hero';
import { AgentsPreview } from './sections/agents-preview';
import { Problem } from './sections/problem';
import { HowItWorks } from './sections/how-it-works';
import { Transparency } from './sections/transparency';
import { Scenarios } from './sections/scenarios';
import { StatsBarSection } from './sections/stats-bar';
import { LandingFooter } from './sections/footer';

/**
 * Landing page composition.
 *
 * Order tells a story: hook (hero) → agents roster → why-now (problem) →
 * how → transparency proof → demo scenarios → stats → footer. The two
 * AI-themed sections (AgentsPreview + Transparency) frame the rest so a
 * judge or visitor immediately knows this is multi-agent + transparent.
 */
export function LandingPageShell() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="paper-grain pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <NavHeader />
      <Hero />
      <AgentsPreview />
      <Problem />
      <HowItWorks />
      <Transparency />
      <Scenarios />
      <StatsBarSection />
      <LandingFooter />
    </main>
  );
}
