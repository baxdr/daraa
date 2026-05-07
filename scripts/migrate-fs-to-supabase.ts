#!/usr/bin/env tsx
/**
 * درع Phase 1: Migrate JSON projects to Supabase
 *
 * Reads all JSON files from data/projects/*.json and writes them to the Supabase
 * database. Idempotent (uses upsert logic). Dry-run by default.
 *
 * Usage:
 *   npx tsx scripts/migrate-fs-to-supabase.ts [--apply]
 *
 * With --apply flag, actually writes to the database.
 * Without --apply, prints what would be inserted (dry-run).
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

/* ========================================================================== */
/* Environment + Setup                                                        */
/* ========================================================================== */

const SUPABASE_URL = process.env['NEXT_PUBLIC_SUPABASE_URL'];
const SERVICE_ROLE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'];

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const APPLY_FLAG = process.argv.includes('--apply');
const PROJECTS_DIR = path.join(process.cwd(), 'data', 'projects');

/* ========================================================================== */
/* Zod schemas (validation without importing from src/)                       */
/* ========================================================================== */

const CostSummarySchema = z.object({
  minSar: z.number(),
  maxSar: z.number(),
  itemCount: z.number(),
});

const GapSchema = z.object({
  id: z.string(),
  severity: z.enum(['critical', 'medium', 'low']),
  ruleId: z.string(),
  titleAr: z.string(),
  explanationAr: z.string(),
  legalRefAr: z.string(),
  fineCeilingSar: z.number(),
  evidenceSource: z.enum(['answer', 'scan', 'both', 'unknown']),
  confidence: z.enum(['high', 'low']),
  canAutoGenerate: z.boolean(),
});

const AnalysisReportSchema = z.object({
  complianceScore: z.number(),
  totalFineCeilingSar: z.number(),
  applicableRuleCount: z.number(),
  gaps: z.array(GapSchema),
  compliantItems: z.array(z.any()),
  remediationPlan: z.array(z.any()),
  scanSkipped: z.boolean(),
  degradedMode: z.boolean(),
});

const GovEntitySchema = z.object({
  id: z.string(),
  nameAr: z.string(),
  nameSimpleAr: z.string(),
  explainAr: z.string(),
  estimatedCostSar: z.object({ min: z.number(), max: z.number() }),
  estimatedTimeAr: z.string(),
  order: z.number(),
  dependencies: z.array(z.string()),
});

const RoadmapWeekSchema = z.object({
  label: z.string(),
  entities: z.array(GovEntitySchema),
});

const ScanResultSchema = z
  .object({
    url: z.string(),
    scannedAt: z.string(),
  })
  .strict()
  .catchall(z.unknown());

const OperationalReportSchema = z.object({
  gaps: z.array(z.any()),
  overdue: z.array(z.any()),
  upcomingRenewals: z.array(z.any()),
  healthScore: z.number(),
  computedAt: z.string(),
});

const AgentActivitySchema = z.object({
  seq: z.number(),
  kind: z.literal('activity'),
  agent: z.string(),
  agentAr: z.string(),
  status: z.enum(['started', 'working', 'completed', 'error']),
  messageAr: z.string(),
  createdAt: z.number(),
});

const AgentMessageSchema = z.object({
  seq: z.number(),
  kind: z.literal('message'),
  from: z.string(),
  to: z.string(),
  type: z.enum(['dependency', 'data_share', 'warning', 'update', 'ack']),
  messageAr: z.string(),
  payload: z.record(z.unknown()).optional(),
  createdAt: z.number(),
});

const ProjectRecordSchema = z.object({
  id: z.string(),
  createdAt: z.number(),
  mode: z.enum(['establishment', 'compliance', 'operational_compliance']),
  status: z.enum(['pending', 'running', 'complete', 'error']),
  phase: z.enum(['roadmap', 'active_monitoring']),
  email: z.string().optional(),
  companyName: z.string(),
  vertical: z.string(),
  cityId: z.string().optional(),
  url: z.string().nullable(),
  answers: z.record(z.unknown()),
  activities: z.array(AgentActivitySchema),
  messages: z.array(AgentMessageSchema),
  entities: z.array(GovEntitySchema),
  roadmap: z.array(RoadmapWeekSchema),
  costSummary: CostSummarySchema,
  topWarnings: z.array(z.string()),
  regulatoryUpdates: z.array(z.any()),
  complianceScore: z.number().optional(),
  totalFineCeilingSar: z.number().optional(),
  gaps: z.array(GapSchema).optional(),
  analysis: AnalysisReportSchema.optional(),
  scanResult: ScanResultSchema.optional(),
  operationalReport: OperationalReportSchema.optional(),
  errorMessage: z.string().optional(),
});

type ProjectRecord = z.infer<typeof ProjectRecordSchema>;

/* ========================================================================== */
/* Statistics                                                                 */
/* ========================================================================== */

interface MigrationStats {
  total: number;
  migrated: number;
  skipped: number;
  errors: number;
}

const stats: MigrationStats = {
  total: 0,
  migrated: 0,
  skipped: 0,
  errors: 0,
};

/* ========================================================================== */
/* Main migration logic                                                       */
/* ========================================================================== */

async function migrateProject(project: ProjectRecord): Promise<void> {
  try {
    // For demo purposes, create a default workspace for each project if needed.
    // In production, projects should be claimed by email or assigned to existing workspace.
    // This script uses the service role, so we bypass RLS.

    // 1. Insert into companies
    const { error: companyError, data: companyData } = await supabase
      .from('companies')
      .upsert(
        {
          id: project.id,
          workspace_id: '00000000-0000-0000-0000-000000000000', // TODO: Create default workspace
          owner_user_id: null, // Projects are initially unclaimed
          email: project.email,
          mode: project.mode,
          status: project.status,
          phase: project.phase,
          company_name: project.companyName,
          vertical: project.vertical,
          city_id: project.cityId,
          url: project.url,
          answers: project.answers,
          cost_min_sar: project.costSummary.minSar,
          cost_max_sar: project.costSummary.maxSar,
          cost_item_count: project.costSummary.itemCount,
          top_warnings: project.topWarnings,
          compliance_score: project.complianceScore ?? null,
          total_fine_ceiling_sar: project.totalFineCeilingSar ?? null,
          error_message: project.errorMessage,
          created_at: new Date(project.createdAt).toISOString(),
        },
        { onConflict: 'id' },
      )
      .select();

    if (companyError) {
      console.error(`  ✗ Failed to insert company ${project.id}:`, companyError.message);
      stats.errors++;
      return;
    }

    // 2. Insert entities (preserving order)
    if (project.entities.length > 0) {
      const { error: entitiesError } = await supabase
        .from('company_entities')
        .delete()
        .eq('company_id', project.id);

      if (entitiesError) {
        console.warn(`  ⚠ Failed to clear entities for ${project.id}:`, entitiesError.message);
      }

      const { error: entitiesInsertError } = await supabase.from('company_entities').insert(
        project.entities.map((entity: typeof GovEntitySchema._type, ord: number) => ({
          company_id: project.id,
          ord,
          entity,
        })),
      );

      if (entitiesInsertError) {
        console.error(
          `  ✗ Failed to insert entities for ${project.id}:`,
          entitiesInsertError.message,
        );
        stats.errors++;
        return;
      }
    }

    // 3. Insert roadmap weeks
    if (project.roadmap.length > 0) {
      const { error: roadmapError } = await supabase
        .from('company_roadmap_weeks')
        .delete()
        .eq('company_id', project.id);

      if (roadmapError) {
        console.warn(`  ⚠ Failed to clear roadmap for ${project.id}:`, roadmapError.message);
      }

      const { error: roadmapInsertError } = await supabase.from('company_roadmap_weeks').insert(
        project.roadmap.map((week: typeof RoadmapWeekSchema._type, ord: number) => ({
          company_id: project.id,
          ord,
          week,
        })),
      );

      if (roadmapInsertError) {
        console.error(
          `  ✗ Failed to insert roadmap for ${project.id}:`,
          roadmapInsertError.message,
        );
        stats.errors++;
        return;
      }
    }

    // 4. Insert gaps (compliance mode)
    if (project.gaps && project.gaps.length > 0) {
      const { error: gapsError } = await supabase
        .from('company_gaps')
        .delete()
        .eq('company_id', project.id);

      if (gapsError) {
        console.warn(`  ⚠ Failed to clear gaps for ${project.id}:`, gapsError.message);
      }

      const { error: gapsInsertError } = await supabase.from('company_gaps').insert(
        project.gaps.map((gap: typeof GapSchema._type, ord: number) => ({
          company_id: project.id,
          ord,
          gap,
        })),
      );

      if (gapsInsertError) {
        console.error(`  ✗ Failed to insert gaps for ${project.id}:`, gapsInsertError.message);
        stats.errors++;
        return;
      }
    }

    // 5. Insert analysis report (compliance mode)
    if (project.analysis) {
      const { error: analysisError } = await supabase
        .from('company_analysis')
        .upsert(
          { company_id: project.id, analysis: project.analysis },
          { onConflict: 'company_id' },
        );

      if (analysisError) {
        console.error(`  ✗ Failed to insert analysis for ${project.id}:`, analysisError.message);
        stats.errors++;
        return;
      }
    }

    // 6. Insert scan result (compliance mode)
    if (project.scanResult) {
      const { error: scanError } = await supabase
        .from('company_scan_result')
        .upsert({ company_id: project.id, scan: project.scanResult }, { onConflict: 'company_id' });

      if (scanError) {
        console.error(`  ✗ Failed to insert scan for ${project.id}:`, scanError.message);
        stats.errors++;
        return;
      }
    }

    // 7. Insert operational report (operational_compliance mode)
    if (project.operationalReport) {
      const { error: opError } = await supabase
        .from('company_operational_report')
        .upsert(
          { company_id: project.id, report: project.operationalReport },
          { onConflict: 'company_id' },
        );

      if (opError) {
        console.error(
          `  ✗ Failed to insert operational report for ${project.id}:`,
          opError.message,
        );
        stats.errors++;
        return;
      }
    }

    // 8. Insert activities
    if (project.activities.length > 0) {
      const { error: activitiesError } = await supabase
        .from('agent_activities')
        .delete()
        .eq('company_id', project.id);

      if (activitiesError) {
        console.warn(`  ⚠ Failed to clear activities for ${project.id}:`, activitiesError.message);
      }

      const { error: activitiesInsertError } = await supabase.from('agent_activities').insert(
        project.activities.map((activity: typeof AgentActivitySchema._type) => ({
          company_id: project.id,
          agent: activity.agent,
          agent_ar: activity.agentAr,
          status: activity.status,
          message_ar: activity.messageAr,
          seq: activity.seq,
        })),
      );

      if (activitiesInsertError) {
        console.error(
          `  ✗ Failed to insert activities for ${project.id}:`,
          activitiesInsertError.message,
        );
        stats.errors++;
        return;
      }
    }

    // 9. Insert messages
    if (project.messages.length > 0) {
      const { error: messagesError } = await supabase
        .from('agent_messages')
        .delete()
        .eq('company_id', project.id);

      if (messagesError) {
        console.warn(`  ⚠ Failed to clear messages for ${project.id}:`, messagesError.message);
      }

      const { error: messagesInsertError } = await supabase.from('agent_messages').insert(
        project.messages.map((msg: typeof AgentMessageSchema._type) => ({
          company_id: project.id,
          from_agent: msg.from,
          to_agent: msg.to,
          type: msg.type,
          message_ar: msg.messageAr,
          payload: msg.payload,
          seq: msg.seq,
        })),
      );

      if (messagesInsertError) {
        console.error(
          `  ✗ Failed to insert messages for ${project.id}:`,
          messagesInsertError.message,
        );
        stats.errors++;
        return;
      }
    }

    console.log(`  ✓ Migrated: ${project.id}`);
    stats.migrated++;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  ✗ Error processing ${project.id}:`, msg);
    stats.errors++;
  }
}

async function main() {
  console.log(`\nدرع Phase 1: Migrate FS → Supabase\n`);

  if (!fs.existsSync(PROJECTS_DIR)) {
    console.log('No projects directory found. Nothing to migrate.');
    return;
  }

  const files = fs.readdirSync(PROJECTS_DIR).filter((f) => f.endsWith('.json'));

  if (files.length === 0) {
    console.log('No project files found.');
    return;
  }

  console.log(`Found ${files.length} project file(s).\n`);
  console.log(APPLY_FLAG ? 'Mode: APPLY (writing to Supabase)' : 'Mode: DRY-RUN (no changes)');
  console.log('');

  for (const file of files) {
    stats.total++;
    const filePath = path.join(PROJECTS_DIR, file);

    try {
      const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const project = ProjectRecordSchema.parse(raw);

      if (APPLY_FLAG) {
        await migrateProject(project);
      } else {
        console.log(`  [dry-run] Would insert: ${project.id} (${project.mode})`);
        stats.migrated++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ Failed to parse ${file}:`, msg);
      stats.errors++;
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Summary:`);
  console.log(`  Total files:  ${stats.total}`);
  console.log(`  Migrated:     ${stats.migrated}`);
  console.log(`  Skipped:      ${stats.skipped}`);
  console.log(`  Errors:       ${stats.errors}`);
  console.log(`${'='.repeat(50)}\n`);

  if (stats.errors > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
