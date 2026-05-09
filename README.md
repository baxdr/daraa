# درع — DARAA

### Saudi Small-Shop Compliance & License Tracking

<div dir="rtl">

> مستشار ذكاء اصطناعي متعدد الوكلاء يتابع رخص المحلات الصغيرة في السعودية، يُنبّه قبل انتهاء التجديدات، ويشرح لكل مالك بالعربي وش المطلوب من كل جهة حكومية وكيف يجهّزها.

</div>

---

## Overview

**DARAA** is an Arabic-first, multi-agent AI platform for Saudi small-shop owners (مطاعم، كوفي، بقالات، صالونات، مغاسل). It collects 16 facts about the shop in a natural Arabic conversation, then runs 12 specialised agents in parallel waves to produce:

- A complete map of every government entity the shop must register with (MCI, Civil Defense, Municipality, SFDA, MOH, MOHR/GOSI, ZATCA — up to 7 per vertical).
- Cost ranges and time estimates per entity, **never invented** — always derived from local deterministic tools.
- A renewal calendar with per-license deadlines and a daily cron that emails owners 30 / 14 / 7 days before each expiry.
- A live activity feed showing exactly which agent ran, what tools it called, and what messages it sent to other agents — full transparency for the owner.

**Built for Agenticthon 2026** — covering: Process Automation · Multi-Agent Systems · Agent-to-Agent (A2A) Communication.

**Team**: بدر العمري · سفر الدوسري

---

## Architecture

### Agent System — 12 agents in 2 layers

```
┌─────────────────────────────────────────────────────────────┐
│           Coordination Layer (5 agents)                      │
│                                                              │
│  chat · orchestrator · research · analysis · report          │
└──────────────────────────┬──────────────────────────────────┘
                           │  Wave Scheduler + AgentBus
┌──────────────────────────▼──────────────────────────────────┐
│           Specialist Layer (7 agents — all LLM)              │
│                                                              │
│  mci · zatca · mohr_gosi · civil_defense                     │
│  municipality · sfda · moh                                   │
└─────────────────────────────────────────────────────────────┘
```

| Agent           | Role                                                            | LLM?             | File                                                                                                     |
| --------------- | --------------------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------- |
| `chat`          | Collects 16 answers via free-form Arabic conversation           | Yes — Sonnet 4.6 | [`src/agents/chat-agent/`](src/agents/chat-agent/)                                                       |
| `orchestrator`  | Wave scheduler, state transitions, error capture                | No               | [`src/agents/project-orchestrator/runner.ts`](src/agents/project-orchestrator/runner.ts)                 |
| `research`      | Pulls live regulatory updates with `web_search` tool            | Yes — Sonnet 4.6 | [`src/agents/research-agent.ts`](src/agents/research-agent.ts)                                           |
| `analysis`      | Builds gap report (deterministic) + writes Arabic narrative     | Hybrid           | [`src/agents/operational-analysis/`](src/agents/operational-analysis/)                                   |
| `report`        | Compiles entities + roadmap + renewals into final ProjectRecord | No               | [`src/agents/project-orchestrator/entity-builder.ts`](src/agents/project-orchestrator/entity-builder.ts) |
| `mci`           | Ministry of Commerce — Commercial Registration                  | Yes — Sonnet 4.6 | [`src/agents/specialists/mci-agent.ts`](src/agents/specialists/mci-agent.ts)                             |
| `zatca`         | Zakat & Tax — VAT threshold check                               | Yes — Sonnet 4.6 | [`src/agents/specialists/zatca-agent.ts`](src/agents/specialists/zatca-agent.ts)                         |
| `mohr_gosi`     | HR & Social Insurance — Nitaqat zone estimation                 | Yes — Sonnet 4.6 | [`src/agents/specialists/mohr-gosi-agent.ts`](src/agents/specialists/mohr-gosi-agent.ts)                 |
| `civil_defense` | Civil Defense — Safety certificate, extinguisher math           | Yes — Sonnet 4.6 | [`src/agents/specialists/civil-defense-agent.ts`](src/agents/specialists/civil-defense-agent.ts)         |
| `municipality`  | Balady License — needs `civil_defense` outbox                   | Yes — Sonnet 4.6 | [`src/agents/specialists/municipality-agent.ts`](src/agents/specialists/municipality-agent.ts)           |
| `sfda`          | Food & Drug Authority (food verticals only)                     | Yes — Sonnet 4.6 | [`src/agents/specialists/sfda-agent.ts`](src/agents/specialists/sfda-agent.ts)                           |
| `moh`           | Ministry of Health (restaurants + salons)                       | Yes — Sonnet 4.6 | [`src/agents/specialists/moh-agent.ts`](src/agents/specialists/moh-agent.ts)                             |

### True A2A Communication

Agents communicate via a real message bus — not UI theatre. The wave scheduler runs agents in dependency order; each agent reads its inbox and changes behaviour based on received payloads.

**Example:** `CivilDefenseAgent` emits `{ hasKitchen: true }` → `MunicipalityAgent` reads this from its inbox and adds "Commercial Kitchen License" to its requirements. Without that message, the requirement never appears.

```bash
npm run test:agents
```

Output shows `municipality → blocked (wave 1)` then `municipality → complete (wave 3)` — after receiving the civil_defense message.

### Wave Scheduling — parallel where possible

For a restaurant (7 specialists), the scheduler runs **4 waves**:

```
Wave 1: mci  (no deps)
Wave 2: zatca · mohr_gosi · civil_defense  (parallel — all depend on mci)
Wave 3: municipality  (depends on civil_defense)
Wave 4: sfda · moh  (parallel — both depend on municipality)
```

Source: [`src/agents/runtime/orchestrator-runtime.ts`](src/agents/runtime/orchestrator-runtime.ts).

---

## How the LLM Is Wired

| Question                            | Answer                                                                                                                 |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Which model?**                    | `claude-sonnet-4-6` — single model for every LLM agent in the system.                                                  |
| **Which provider?**                 | Anthropic API directly (the official `@anthropic-ai/sdk` SDK).                                                         |
| **Which agents call it?**           | `chat`, `research`, `analysis` (narrator), and all 7 specialists. The orchestrator and report layer are deterministic. |
| **Where is it configured?**         | [`src/lib/claude.ts`](src/lib/claude.ts) — `MODELS.sonnet = 'claude-sonnet-4-6'`.                                      |
| **What if the API key is missing?** | Every LLM agent has a deterministic `fallback()` path — the system still produces a valid result without the LLM.      |
| **Rate-limit handling?**            | If primary key returns 429, automatic failover to `BACKUP_ANTHROPIC_API_KEY` if configured.                            |
| **Tool use?**                       | Every specialist runs a tool-use loop (≤6 iterations) where Claude calls local TypeScript functions for facts/numbers. |
| **Why tools?**                      | Numbers (extinguisher count, VAT threshold, fine ceilings) come from local deterministic functions, not LLM guesses.   |

For a deeper walkthrough see [`hackathon/agents-deep-dive.html`](hackathon/agents-deep-dive.html).

---

## Tech Stack

| Layer       | Technology                                                                   |
| ----------- | ---------------------------------------------------------------------------- |
| Framework   | Next.js 14 (App Router) + TypeScript strict                                  |
| UI          | Tailwind CSS v4 — Modernist Arabic Editorial system                          |
| Fonts       | Almarai (headings) · IBM Plex Sans Arabic (body) · JetBrains Mono (numerals) |
| AI          | Anthropic SDK — `claude-sonnet-4-6`                                          |
| Persistence | Supabase Postgres (jsonb blob) · in-memory cache during a run                |
| Auth        | Supabase Auth (magic-link + Google OAuth)                                    |
| Email       | Resend SMTP — daily renewal reminders                                        |
| Cron        | GitHub Actions — 7am KSA daily                                               |
| Functions   | Vercel Fluid Compute · `waitUntil` for post-response orchestration           |
| Validation  | Zod on every API endpoint                                                    |
| Deploy      | Vercel — `daraa-sandy.vercel.app`                                            |

---

## Project Structure

Where every agent and its supporting code actually lives:

```
src/
├── agents/
│   ├── runtime/
│   │   ├── agent-bus.ts                # AgentBus — inbox per agent + delivery
│   │   ├── orchestrator-runtime.ts     # Wave scheduler — runs agents in parallel
│   │   ├── types.ts                    # Agent / AgentMessage / AgentResult types
│   │   ├── replay/                     # Deterministic replay for tests
│   │   └── telemetry/                  # Trace recorder + types
│   │
│   ├── chat-agent/                     # The conversation agent (LLM)
│   │   ├── claude-turn.ts              # Calls Sonnet, parses JSON extractions
│   │   ├── fast-path.ts                # Skips LLM when input matches a button choice
│   │   ├── prompt.ts                   # System prompt + question-bridge prompt
│   │   ├── helpers.ts                  # Affordance/suggestion helpers for the UI
│   │   └── scripted.ts                 # Demo-mode scripted answers
│   │
│   ├── chat-flow/                      # The 16-question script (deterministic)
│   │   ├── flow.ts                     # nextQuestion() walker
│   │   ├── questions.ts                # Question definitions
│   │   └── validators.ts               # Per-field validation rules
│   │
│   ├── project-orchestrator/           # Layer 1 — orchestration
│   │   ├── runner.ts                   # The pipeline: research → specialists → analysis → report
│   │   ├── entity-builder.ts           # Compose EntityCards from agent results
│   │   ├── warnings.ts                 # Top-warning rules per vertical
│   │   └── index.ts                    # Public barrel
│   │
│   ├── specialists/                    # Layer 2 — 7 LLM specialists
│   │   ├── llm-base/
│   │   │   ├── llm-specialist.ts       # Base class — tool loop + fallback
│   │   │   ├── tool-runner.ts          # Anthropic tool-use loop implementation
│   │   │   ├── shared-tools.ts         # 4 tools every specialist can use
│   │   │   └── types.ts                # AgentTool / AgentTrace
│   │   ├── mci-agent.ts                # MCI / Commercial Registration
│   │   ├── zatca-agent.ts              # ZATCA / Tax
│   │   ├── mohr-gosi-agent.ts          # MOHR + GOSI
│   │   ├── civil-defense-agent.ts      # Civil Defense / Fire Safety
│   │   ├── municipality-agent.ts       # Balady License
│   │   ├── sfda-agent.ts               # Food & Drug
│   │   ├── moh-agent.ts                # Health
│   │   └── index.ts                    # getAgentsForVertical(v) factory
│   │
│   ├── operational-analysis/           # Hybrid: deterministic gaps + LLM narrator
│   │   ├── runner.ts                   # Builds OperationalReport from chat answers
│   │   ├── narrator.ts                 # Sonnet — adds Arabic prose + 3 priorities
│   │   ├── gap-builders.ts             # Per-license gap detection
│   │   └── date-utils.ts               # Pure date math
│   │
│   ├── research-agent.ts               # Sonnet + web_search → RegulatoryUpdate[]
│   └── types.ts                        # Shared AgentId, AgentActivity, AgentMessage
│
├── lib/
│   ├── claude.ts                       # Anthropic SDK client + MODELS const
│   ├── agent-bus.ts                    # Public emit/send/flushBus API for orchestrator
│   ├── project-store.ts                # In-memory project map + persistence hooks
│   ├── project-fs.ts                   # Filesystem fallback driver
│   └── chat-sessions.ts                # In-memory chat session store
│
├── infrastructure/
│   ├── persistence/
│   │   ├── persistence-router.ts       # Selects FS or Supabase by env
│   │   ├── filesystem/                 # Local-dev driver
│   │   └── supabase/                   # Production driver (jsonb blob)
│   └── auth/
│       ├── supabase-auth.ts            # Server-side Supabase client + cookies
│       └── get-principal.ts            # Resolve user/anon from session
│
├── knowledge/                          # Static Arabic-language reference data
│   ├── entities.ts                     # Government entities + verticals
│   ├── pdpl.ts                         # PDPL terms (referenced in chat tooltips)
│   └── terms.ts                        # Arabic explanations for jargon
│
└── app/                                # Next.js App Router
    ├── chat/                           # /chat — the conversation UI
    ├── project/[projectId]/            # /project/<id> — final dashboard
    │   └── agents/                     # /project/<id>/agents — live timeline
    ├── api/
    │   ├── chat/                       # POST chat turn
    │   ├── project/start/route.ts      # Kicks off the orchestrator (waitUntil)
    │   └── project/[projectId]/        # GET project status (polled by UI)
    └── auth/                           # Login, logout, magic-link callbacks

hackathon/
├── architecture-diagram.html           # Layered architecture + sequence diagrams
├── agents-deep-dive.html               # Full per-agent reference (this is the judges' doc)
├── concept.md                          # Pitch concept
└── video-script.md                     # Demo video script
```

---

## What Uses Claude vs What Doesn't

| Uses Claude (LLM)                     | Deterministic (TypeScript only)          |
| ------------------------------------- | ---------------------------------------- |
| Free-form Arabic chat extraction      | Wave scheduler + AgentBus delivery       |
| Question bridge sentences             | Cost / extinguisher / VAT / Nitaqat math |
| 7 specialists (tool-use loop)         | Renewal calendar + reminder cron logic   |
| Web search for regulatory updates     | Roadmap composition                      |
| Operational narrative + priority list | All gap detection (severity, deadlines)  |
|                                       | Final upsert to Supabase                 |

The split is intentional: **Claude writes Arabic prose and orchestrates tools — it never owns numbers.**

---

## Getting Started

### Prerequisites

- Node.js 20+ (Vercel default)
- pnpm 9+
- An Anthropic API key — [console.anthropic.com](https://console.anthropic.com)
- (Optional) Supabase project for production persistence + auth

### Installation

```bash
git clone https://github.com/baxdr/daraa
cd daraa
pnpm install
```

### Configuration

```bash
cp .env.example .env.local
# Required
ANTHROPIC_API_KEY=sk-ant-...
# Optional — production stack
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
PERSISTENCE_DRIVER=supabase   # 'filesystem' (default) or 'supabase'
RESEND_API_KEY=...
```

### Build & Run

```bash
pnpm dev            # opens at http://localhost:3333
```

For production:

```bash
pnpm build
pnpm start
```

### Testing

```bash
pnpm test:agents    # AgentBus runtime + A2A proof-of-blocking
pnpm typecheck      # tsc --noEmit
pnpm lint           # next lint
```

---

## Demo Flow

1. Click "ابدأ الاستشارة المجانية".
2. Type in Arabic: `"عندي كوفي بالرياض، مساحته ٨٠ متر، فيه ٤ موظفين"`.
3. Watch the chat agent extract `vertical=coffee · city=riyadh · area=80 · employees=4` from one sentence.
4. Answer the remaining ~10 questions (each one explained in plain Arabic).
5. Hit "ابدأ المتابعة" → redirected to `/project/[id]/agents`.
6. Watch the 5 specialists run in parallel waves with **live A2A messages**.
7. Auto-redirect to the dashboard with full roadmap, costs, and renewal calendar.

Live demo: **[daraa-sandy.vercel.app](https://daraa-sandy.vercel.app)**.

---

## Tracks Covered

| Track                    | How                                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| **Process Automation**   | Full small-shop license pipeline — up to 7 entities, correct sequence, dependencies enforced. |
| **Multi-Agent Systems**  | 5 coordination + 7 specialist agents, wave scheduler, inbox-based routing.                    |
| **Agent-to-Agent (A2A)** | Real AgentBus — payloads change receiving-agent behaviour at runtime.                         |

---

## License

MIT — see [LICENSE](./LICENSE).

---

<div align="center">

**درع** · Built for Agenticthon 2026 · Saudi Arabia 🇸🇦

بدر العمري · سفر الدوسري

</div>
