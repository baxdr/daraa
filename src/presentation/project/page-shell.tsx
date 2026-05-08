import { DocumentsSection } from '@/presentation/components/documents-section';
import { LegalDisclaimer } from '@/presentation/components/legal-disclaimer';
import { SaveProjectBanner } from '@/presentation/components/save-project-banner';
import { OperationalDashboard } from '@/presentation/components/operational-dashboard';
import { ActiveMonitoringPanel } from '@/presentation/components/active-monitoring-panel';
import { computeRenewals } from '@/lib/renewals';
import type { ProjectRecord } from '@/lib/project-store';

import { CITY_LABELS, verticalDisplayLabel } from './helpers/labels';
import { buildRecommendations } from './helpers/document-recommendations';
import { ProjectMasthead } from './sections/project-masthead';
import { TradeNameBanner } from './sections/trade-name-banner';
import { TopWarnings } from './sections/top-warnings';
import { ComplianceSummary } from './sections/compliance-summary';
import { EstablishmentSummary } from './sections/establishment-summary';
import { GapsSection } from './sections/gaps-section';
import { RoadmapSection } from './sections/roadmap-section';
import {
  ComplianceWithoutUrlNotice,
  EstablishmentToComplianceHandoff,
} from './sections/handoff-section';

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
 * Unified project dashboard. Same page for both modes — establishment renders
 * entities as a roadmap; compliance adds score + gaps + fines on top. Every
 * alert, entity, cost summary, renewal list, and document recommendation
 * lives here so there's ONE place to look.
 */
export function ProjectPageShell({
  project,
  viewerUserId = null,
  authEnabled = false,
}: ProjectPageShellProps) {
  const {
    mode,
    companyName,
    vertical,
    cityId,
    entities,
    roadmap,
    costSummary,
    topWarnings,
    analysis,
    complianceScore,
    totalFineCeilingSar,
    gaps,
    answers,
    url,
    messages,
    operationalReport,
  } = project;
  const cityLabel = cityId ? (CITY_LABELS[cityId] ?? cityId) : null;
  const verticalLabel = verticalDisplayLabel(vertical);
  const isCompliance = mode === 'compliance';
  const isOperational = mode === 'operational_compliance';
  const mciTradeName = !isCompliance ? entities.find((e) => e.id === 'mci')?.nameCheck : undefined;
  const showTradeName = mciTradeName !== undefined && mciTradeName.status !== 'skipped';

  return (
    <main className="mx-auto max-w-4xl px-6 py-10 md:px-10 md:py-14">
      <ProjectMasthead
        projectId={project.id}
        companyName={companyName}
        verticalLabel={verticalLabel}
        cityLabel={cityLabel}
        url={url}
        isCompliance={isCompliance}
        isOperational={isOperational}
      />

      <div className="rule-ink mb-10" />

      <SaveProjectBanner
        projectId={project.id}
        {...(project.email !== undefined ? { initialEmail: project.email } : {})}
        isSignedIn={Boolean(viewerUserId)}
        isOwnedByMe={Boolean(viewerUserId && project.ownerUserId === viewerUserId)}
        authEnabled={authEnabled}
      />

      {showTradeName && mciTradeName && (
        <section className="mb-10">
          <TradeNameBanner check={mciTradeName} companyName={companyName} />
        </section>
      )}

      <TopWarnings warnings={topWarnings} />

      {isOperational && operationalReport && (
        <section className="mb-12">
          <OperationalDashboard report={operationalReport} />
        </section>
      )}

      {isCompliance && analysis && (
        <ComplianceSummary
          complianceScore={complianceScore}
          totalFineCeilingSar={totalFineCeilingSar}
        />
      )}

      {!isCompliance && (
        <EstablishmentSummary
          entityCount={entities.length}
          weekCount={roadmap.length}
          costMinSar={costSummary.minSar}
          costMaxSar={costSummary.maxSar}
        />
      )}

      {isCompliance && <GapsSection scanId={project.id} gaps={gaps} analysis={analysis} />}

      <RoadmapSection
        roadmap={roadmap}
        messages={messages}
        costSummary={costSummary}
        isCompliance={isCompliance}
      />

      {/* Active-monitoring panel — operational mode shows its own richer
          timeline above, so we suppress this panel there. */}
      {!isOperational && project.phase === 'active_monitoring' && (
        <ActiveMonitoringPanel
          renewals={computeRenewals(entities, new Date(project.createdAt))}
          totalEntities={entities.length}
        />
      )}

      {isCompliance && gaps && (
        <DocumentsSection
          scanId={project.id}
          recommendations={buildRecommendations(answers, gaps)}
        />
      )}

      {isCompliance && !url && <ComplianceWithoutUrlNotice />}
      {!isCompliance && <EstablishmentToComplianceHandoff projectId={project.id} />}

      <LegalDisclaimer />
    </main>
  );
}
