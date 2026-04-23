/**
 * Shared type definitions for the درع agent pipeline.
 * Kept intentionally flat so it can be consumed in both server code and the UI.
 */

export type Severity = 'critical' | 'medium' | 'low';
export type Regulation = 'PDPL' | 'NCA_ECC' | 'ZATCA';

export interface ScanResult {
  url: string;
  scannedAt: string;
  privacyPolicy: PrivacyPolicyCheck;
  securityHeaders?: import('@/scanner/security-headers').SecurityHeaderCheck;
  thirdParty?: import('@/scanner/third-party').ThirdPartyCheck;
  // Still pending Puppeteer work:
  cookieConsent?: unknown;
  dataForms?: unknown;
}

export interface PrivacyPolicyCheck {
  found: boolean;
  policyUrl?: string;
  language?: 'ar' | 'en' | 'both' | 'unknown';
  hasArabicVersion?: boolean;
  rawTextExcerpt?: string;
  analysis?: PrivacyPolicyAnalysis;
  error?: string;
}

export interface PrivacyPolicyAnalysis {
  mentionsPdpl: boolean;
  dataSubjectRights: { covered: string[]; missing: string[] };
  purposeStated: boolean;
  legalBasis: boolean;
  retentionPeriod: boolean;
  dpoContact: boolean;
  crossBorder: boolean;
  thirdParty: boolean;
  notes?: string;
}

export interface Gap {
  id: string;
  severity: Severity;
  regulation: Regulation;
  ruleId: string;        // e.g. 'pdpl_art4_rights'
  ruleLabel: string;     // Arabic display label — the source of truth for what the user sees
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  evidence: string;
  fineEstimateSar: number;
  fixComplexity: 'easy' | 'medium' | 'hard';
  canAutoGenerate: boolean;
  requiresHumanReview: boolean;
}

/**
 * Honest naming (see v4 design, §9):
 *   - 3 LLM agents:      chat, research, document
 *   - 4 coordination:    orchestrator, scan, regulatory, analysis, report
 *                        (scan/regulatory/analysis are deterministic modules
 *                         presented as agents in the UI timeline)
 *   - 7 entity specialists: mci, municipality, civil_defense, sfda,
 *                            mohr_gosi, zatca, pdpl_nca
 *
 * Grouping in code: we keep a single `AgentId` union so the bus / store /
 * UI don't need to care which layer an agent belongs to.
 */
export type CoordinationAgent =
  | 'orchestrator'
  | 'chat'
  | 'research'
  | 'scan'
  | 'regulatory'
  | 'analysis'
  | 'report'
  | 'document';

export type EntityAgent =
  | 'mci'
  | 'municipality'
  | 'civil_defense'
  | 'sfda'
  | 'moh'
  | 'mohr_gosi'
  | 'zatca'
  | 'zatca_einvoice'
  | 'maroof'
  | 'pdpl_nca'
  | 'contractor_classification';

export type AgentId = CoordinationAgent | EntityAgent;

/** @deprecated — use AgentId. Kept as a type alias for backwards compat. */
export type AgentName = AgentId;

export interface AgentActivity {
  /** Monotonic sequence number within a run — used by the UI to detect new events. */
  seq: number;
  kind: 'activity';
  agent: AgentId;
  agentAr: string;
  status: 'started' | 'working' | 'completed' | 'error';
  messageAr: string;
  createdAt: number;
}

/**
 * Inter-agent message (A2A protocol).
 *
 * These are emitted alongside activities on the run's timeline. They're
 * deterministic — the sender and receiver are determined by known entity
 * dependencies (civil_defense → municipality is pre-wired, not emergent) —
 * but the UI still renders them as agent-to-agent communication because the
 * protocol IS real: one agent decides what to say, another agent receives
 * and optionally acknowledges.
 */
export interface AgentMessage {
  seq: number;
  kind: 'message';
  from: AgentId;
  to: AgentId | 'ALL';
  /** Message intent — affects how the UI renders it. */
  type: 'dependency' | 'data_share' | 'warning' | 'update' | 'ack';
  messageAr: string;
  /** Optional structured payload (e.g. a CR number shared with all agents). */
  payload?: Record<string, unknown>;
  createdAt: number;
}

export type TimelineEvent = AgentActivity | AgentMessage;

export const AGENT_LABELS_AR: Record<AgentId, string> = {
  // Coordination
  orchestrator: 'المنسّق',
  chat:         'وكيل المحادثة',
  research:     'وكيل البحث',
  scan:         'وكيل الفحص',
  regulatory:   'وكيل الأنظمة',
  analysis:     'وكيل التحليل',
  report:       'وكيل التقرير',
  document:     'وكيل المستندات',
  // Entity specialists
  mci:                       'متخصّص التجارة',
  municipality:              'متخصّص البلدية',
  civil_defense:             'متخصّص الدفاع المدني',
  sfda:                      'متخصّص الغذاء والدواء',
  moh:                       'متخصّص وزارة الصحة',
  mohr_gosi:                 'متخصّص الموارد البشرية والتأمينات',
  zatca:                     'متخصّص الزكاة والضريبة',
  zatca_einvoice:            'متخصّص الفوترة الإلكترونية',
  maroof:                    'متخصّص معروف',
  pdpl_nca:                  'متخصّص حماية البيانات',
  contractor_classification: 'متخصّص تصنيف المقاولين',
};
