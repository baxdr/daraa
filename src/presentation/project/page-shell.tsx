import { LegalDisclaimer } from '@/presentation/components/legal-disclaimer';
import { SaveProjectBanner } from '@/presentation/components/save-project-banner';
import { OperationalDashboard } from '@/presentation/components/operational-dashboard';
import { ActiveMonitoringPanel } from '@/presentation/components/active-monitoring-panel';
import type { ProjectRecord } from '@/lib/project-store';

import { CITY_LABELS, verticalDisplayLabel } from './helpers/labels';
import { ProjectMasthead } from './sections/project-masthead';
import { TopWarnings } from './sections/top-warnings';
import { EstablishmentSummary } from './sections/establishment-summary';
import { RoadmapSection } from './sections/roadmap-section';

interface ProjectPageShellProps {
  project: ProjectRecord;
  /** Current viewer's userId, if signed in. Used by the save banner to
   *  decide between "claim with one click" vs "send magic-link". */
  viewerUserId?: string | null;
  /** True when Supabase Auth is wired (env vars present). When false we
   *  hide the magic-link UX and fall back to plain email-save. */
  authEnabled?: boolean;
}

/**
 * Unified project dashboard for small-shop license tracking.
 */
export function ProjectPageShell({
  project,
  viewerUserId = null,
  authEnabled = false,
}: ProjectPageShellProps) {
  const {
    companyName,
    vertical,
    cityId,
    entities,
    roadmap,
    costSummary,
    topWarnings,
    messages,
    operationalReport,
    renewals,
  } = project;
  const cityLabel = cityId ? (CITY_LABELS[cityId] ?? cityId) : null;
  const verticalLabel = verticalDisplayLabel(vertical);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10 md:px-10 md:py-14">
      <ProjectMasthead
        projectId={project.id}
        companyName={companyName}
        verticalLabel={verticalLabel}
        cityLabel={cityLabel}
        url={null}
        isCompliance={false}
        isOperational
      />

      <div className="rule-ink mb-10" />

      <SaveProjectBanner
        projectId={project.id}
        {...(project.email !== undefined ? { initialEmail: project.email } : {})}
        isSignedIn={Boolean(viewerUserId)}
        isOwnedByMe={Boolean(viewerUserId && project.ownerUserId === viewerUserId)}
        authEnabled={authEnabled}
      />

      <TopWarnings warnings={topWarnings} />

      {operationalReport && (
        <section className="mb-12">
          <OperationalDashboard report={operationalReport} />
        </section>
      )}

      <EstablishmentSummary
        entityCount={entities.length}
        weekCount={roadmap.length}
        costMinSar={costSummary.minSar}
        costMaxSar={costSummary.maxSar}
      />

      <RoadmapSection
        roadmap={roadmap}
        messages={messages}
        costSummary={costSummary}
        isCompliance={false}
      />

      {project.phase === 'active_monitoring' && renewals && renewals.length > 0 && (
        <ActiveMonitoringPanel renewals={renewals} totalEntities={entities.length} />
      )}

      <LegalDisclaimer />
    </main>
  );
}
