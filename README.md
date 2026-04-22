# درع — Daraa

Saudi establishment and compliance advisor. Next.js 14 App Router, full RTL Arabic.

Full architecture: [DESIGN.md](./DESIGN.md).

---

## Quick start

```bash
cp .env.example .env.local   # fill in ANTHROPIC_API_KEY
npm install
npm run dev
```

Without `ANTHROPIC_API_KEY` the app still runs — scanners fall back to surface-level signals, document generation falls back to local templates.

---

## Environment

| Var | Required | Purpose |
|-----|----------|---------|
| `ANTHROPIC_API_KEY` | recommended | Claude-powered paths: privacy-policy deep analysis, document generation, research agent |
| `NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | no | Reserved for persistence. MVP uses in-process stores |
| `BROWSERLESS_URL` | no | Reserved for cookie-consent scanner |

---

## Deploy to Vercel

```bash
npm install -g vercel
vercel login
vercel --prod
```

In Vercel → Project → Settings → Environment Variables, add `ANTHROPIC_API_KEY`, then redeploy.

Vercel Pro (60s function timeout) is required — Hobby tier's 10s limit truncates scans mid-pipeline. For production, replace fire-and-forget with a queue (Inngest or Supabase Edge Functions).

---

## Demo

### Nova Tech (prepared scenario)

Fictional site at `/demo/novatech/` with deliberate gaps: trackers loaded pre-consent, English-only policy, no security headers. Expected result: ~7 gaps, ~2 M SAR fine ceiling, 4 trackers detected.

### Live-test backup URLs

| URL | Vertical | Signal |
|-----|----------|--------|
| `https://jahez.net` | Food delivery | No privacy page, ~2 M SAR |
| `https://tamara.co` | Fintech BNPL | English-only policy |
| `https://stc.com.sa` | Telecom | English-only policy |
| `https://hungerstation.com` | Food delivery | ~81% score (passing path) |

Skip `noon.com` — rate-limits the scanner.

### Establishment path (restaurant)

Pick "أبي أفتح مشروع جديد" → مطعم → الرياض → 2 → 80000 → لا → لقينا محل ولم نوقّع العقد. The result page renders the "احذر قبل التوقيع" banner with a link to `balady.gov.sa`.

Full runbook: [docs/DEMO-RUNBOOK.md](./docs/DEMO-RUNBOOK.md).

---

## Architecture

```
Chat (deterministic state machine, LLM wrapper text only)
  │
  ├─ mode = compliance ─▶ POST /api/scan/start ─▶ orchestrator ─▶ /scan/[id]
  │                          └─ research + 3 scanners + analysis
  │
  └─ mode = establishment ─▶ POST /api/establishment/resolve ─▶ /establishment/[id]
                                └─ research + 7 entity specialists + report

Report ─▶ Documents section ─▶ POST /api/documents/generate ─▶ /documents/[id]
```

Three LLM agents: chat, research, document.
Seven deterministic entity specialists on the A2A bus: mci, municipality, civil_defense, sfda, mohr_gosi, zatca, pdpl_nca.
Two coordination agents: orchestrator, report.

In-process stores on `globalThis`. Swap in the Supabase schema from [supabase/migrations/](./supabase/migrations/) when persistence is needed.

---

## What's real vs mocked

| Capability | Status |
|-----------|--------|
| Privacy-policy scanning (find, fetch, analyse) | real |
| Security header check (HEAD request) | real |
| Third-party tracker detection (22 known domains) | real |
| Cookie-consent detection | not implemented (needs headless browser) |
| Live agent timeline + A2A messages | real |
| PDPL rule evaluation | real (deterministic) |
| Four generated documents (policy / DPO / register / incident) | real (Claude + local fallback) |
| Restaurant establishment roadmap | real |
| Tech / Ecommerce establishment | partial — baseline + PDPL readiness |
| Salon / Construction verticals | stubbed ("قريباً") |
| Renewal tracker | UI mockup only ("قريباً") |

---

## Security posture

- SSRF guard on every scanner fetch (blocks private ranges, file://, non-80/443 ports, revalidates each redirect hop, 2 MB response cap)
- Rate limiting on all public POST endpoints (in-memory, IP-bucketed)
- Security headers via `next.config.mjs`: HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- Scan and plan IDs are bearer tokens (no auth in MVP) — treat them as capability URLs, rotate by letting the 1-hour TTL expire

---

## Tests

```bash
npm run dev            # in one terminal
./scripts/smoke.sh     # in another — 28 end-to-end checks
```

CI: typecheck + lint + build on push/PR, via [.github/workflows/ci.yml](./.github/workflows/ci.yml).

---

## Legal

Advisory tool. Regulatory citations, costs, and timelines are approximate. Verify against the official source (SDAIA, MCI, MOL, Balady, SFDA, NCA) before relying on any output.
