# درع (DARAA) — Agentic Solution Concept
## Agenticthon 2026 — Round 2 Submission

---

## What the Agent Does

**DARAA** is an Arabic-first, multi-agent AI platform built around the tagline: *"أسّس شركتك بثقة، وامتثل بذكاء"* — it solves two problems every Saudi business owner faces:

1. **Business Formation** — Navigating 7–15 government entities (Ministry of Commerce, Civil Defense, Municipality, SFDA, ZATCA, MOHR, GOSI…) in the correct sequence, with the correct documents, without missing critical dependencies.

2. **Regulatory Compliance** — Understanding and fixing gaps against Saudi PDPL (Personal Data Protection Law), NCA ECC cybersecurity controls, and ZATCA e-invoicing requirements — before inspectors arrive.

The user speaks to DARAA in free-form Gulf Arabic via a guided chat interface. Claude Sonnet 4.6 extracts up to 10 structured fields from a single sentence. Three entry modes are presented clearly upfront:
- **🏢 أبدأ مشروع جديد** — تأسيس وتسجيل الشركة
- **🔍 عندي شركة شغّالة** — فحص امتثالها الرقمي (PDPL, NCA)
- **📋 عندي محل أو مطعم** — تتبّع رخصي وتجديداتي

A multi-agent pipeline then runs and produces either a complete formation roadmap or a compliance gap report with ready-to-use legal documents — all in Arabic.

---

## What Decisions the Agents Make

| Agent | Decision Type | What It Decides |
|-------|--------------|-----------------|
| **Chat Agent** (Claude 4.6) | Conversational | Which field to ask next; whether to trust a free-text extraction or ask for confirmation; when the intake is complete |
| **Wave Scheduler** | Dependency resolution | Which specialist agents can run in parallel vs. which must wait for upstream results; deadlock detection after 3 retry cycles |
| **Research Agent** (Claude + web_search) | Relevance filtering | Which live regulatory updates from PDPL/ZATCA/NCA are relevant to this specific business; which specialist agents need to be notified |
| **CivilDefenseAgent** | Domain logic | Whether the business requires a fire safety inspection; emits `{ hasKitchen: true }` payload if applicable |
| **MunicipalityAgent** | Context-dependent | Reads its AgentBus inbox; if it finds `hasKitchen: true` from Civil Defense, adds "رخصة المطبخ التجاري" to requirements — a requirement that never appears otherwise |
| **Analysis Agent** | Rule evaluation | Evaluates 14 deterministic PDPL rules against scan results; calculates fine ceiling; determines severity of each gap |
| **Document Agent** (Claude 4.6) | Personalization | Which of 4 Arabic legal templates to generate; how to embed company name, sector, city, and data processing details specific to this business |
| **Orchestrator** | Session management | When all waves are complete; how to surface partial results if a scanner times out; phase transition (roadmap → active monitoring) |

---

## Single-Agent or Multi-Agent?

**Multi-agent system** — specifically a **19-agent two-tier architecture**:

### Coordination Layer (8 agents)
Orchestrator · Chat · Research · Scan · Analysis · Report · Document · Regulatory

### Specialist Layer (11 agents — deterministic, no LLM)
MCI · ZATCA · ZATCA E-Invoice · MOHR+GOSI · Civil Defense · Municipality · SFDA · MOH · PDPL+NCA · Maroof · Contractor Classification

### True A2A Communication
Agents communicate via a real message bus (`AgentBus`) with isolated inboxes per agent. The wave scheduler executes agents in dependency order. Messages carry typed payloads that **change receiving agent behavior at runtime**.

**Proof:**
- `CivilDefenseAgent` emits `{ hasKitchen: true }` → `MunicipalityAgent` reads inbox → adds "Commercial Kitchen License" to its requirements
- `ResearchAgent` discovers a PDPL amendment → broadcasts to relevant specialist agents → they update their guidance
- Without the Civil Defense message, the Municipality agent never produces the kitchen requirement — the A2A is load-bearing, not decorative

Running `npm run test:agents` shows:
```
municipality → blocked (wave 1)
civil_defense → complete (wave 1) [emitted: hasKitchen=true]
municipality → complete (wave 3) [added: رخصة المطبخ التجاري]
```

---

## Architecture Diagram

```
User (Gulf Arabic chat)        URL (website scan)
          │                           │
    Chat Agent                   4 Web Scanners
    Claude 4.6                 Privacy · Security
    10-field NLU               Trackers · Forms
          │                           │
          └──────────┬────────────────┘
                     │
              AgentBus (A2A)
           Research Agent (Claude + web_search)
                     │
             Wave Scheduler (OrchestratorRuntime)
        ┌────────────┴──────────────────────────┐
   Wave 1: MCI · SFDA · MOH · Maroof · Civil Defense
   Wave 2: ZATCA · E-Invoice · (Municipality blocked ⏳)
   Wave 3: Municipality ✓ (received Civil Defense payload)
           MOHR+GOSI ✓ (received Research broadcast)
                     │
       ┌─────────────┴───────────────────┐
 Analysis Engine              Document Agent
 14 PDPL rules                Claude Sonnet 4.6
 Fine ceiling calc            4 Arabic legal docs
 Gap report                   A4 print-ready
```

---

## Tracks Covered

| Track | How DARAA Covers It |
|-------|---------------------|
| **Process Automation** | Full government formation pipeline — 7–15 entities, correct sequence, dependency enforcement, cost estimates, renewal scheduling |
| **Multi-Agent Systems** | 19 agents across two tiers; wave scheduler; parallel execution within each wave; resilience via Promise.allSettled + AbortController timeouts |
| **Agent-to-Agent (A2A)** | Real `AgentBus` — typed payloads, isolated inboxes, chronological message log visible in the UI; messages change receiving agent behaviour at runtime |

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Next.js 14 (App Router) + TypeScript strict |
| AI | Anthropic SDK — `claude-sonnet-4-6` with backup key failover |
| A2A Runtime | Custom `AgentBus` + `OrchestratorRuntime` wave scheduler |
| Web Scanning | Cheerio (HTML parsing) + HTTP HEAD analysis |
| Validation | Zod on every API endpoint |
| Persistence | File-backed JSON with atomic writes + SHA-256 email index |
| Documents | `window.print()` + print CSS → Arabic A4 PDF |
| Deploy | Vercel |

---

## UX & Frontend Highlights

The platform went through a deliberate UX pass addressing real usability issues found during testing:

| Issue | Fix Applied |
|-------|-------------|
| Mode selection was ambiguous | Three clearly-labeled entry modes with icons and descriptions |
| Progress bar showed misleading % | Now shows "السؤال ٣/٨" — actual question count |
| Error recovery was silent | Retry button preserves user input; explicit error message |
| Mixed Arabic/English text broke layout | `dir="auto"` on all message bubbles |
| Hints had no examples | Every numeric/date question has a real-world example |
| Project dashboard lacked urgency cues | Color-coded status badges + urgency tooltips |
| No loading feedback | Animated skeleton replaces blank screen on project load |

The landing page leads with a clear value proposition and two prominent CTAs that directly enter the correct mode — no intermediate step.

---

## Architecture: How Agents Receive Information

Every agent receives an **`AgentContext`** object built from the user's chat answers:

```typescript
interface AgentContext {
  mode: 'establishment' | 'compliance' | 'operational_compliance'
  vertical: VerticalId        // restaurant, salon, construction…
  answers: Answers            // all chat answers
  cityId, capitalSar, partnerCount, leaseStatus, websiteUrl…
}
```

All 11 specialist agents receive the **same context** — they differ in what they do with it. Cross-agent communication happens exclusively via the **AgentBus**, not via shared state.

---

## Honest Scope (Hackathon MVP)

- No government API integrations (mc.gov.sa, maroof.sa don't offer public APIs)
- Sessions expire after 1 hour (Supabase schema written but not yet connected)
- Form scanner is Cheerio-only (client-side React forms not detected)
- Regulatory fine figures are conservative estimates from published PDPL text; need legal review before production use

---

**Team:** بدر العمري · سفر الدوسري

*أداة استرشادية — لا تغني عن الاستشارة القانونية*
