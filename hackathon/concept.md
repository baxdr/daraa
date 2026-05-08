# درع (Daraa) — Agentic Solution Concept

## Agenticthon 2026 · Round 2 Submission

> **العرض الحيّ:** [daraa-sandy.vercel.app](https://daraa-sandy.vercel.app)
> **الكود:** [github.com/baxdr/daraa](https://github.com/baxdr/daraa)
> **الفريق:** بدر العمري · سفر الدوسري

---

## 1. ما الذي يقوم به النظام (What the agent does)

**درع** نظام متعدد الوكلاء يرافق صاحب المحل الصغير في السعودية ـ **مطعم، كوفي، بقالة، مغسلة، صالون** ـ ويتابع رخصه وشهاداته من ٧ جهات حكومية في مكان واحد.

ينطلق المستخدم بمحادثة عربية حرّة (`/chat`) فيها **١٦ سؤالاً موجَّهاً بنشاطه**: نوع المحل، تواريخ الرخص الحالية، عدد الطفايات، نظام التهوية، شهادات الموظفين الصحية، اعتماد اللوحة، إلخ. الـ AI يستخرج البيانات حتى لو جاءت كلها في جملة واحدة بالعربية الخليجية.

بعدها يفتح **١٢ ايجنت** للعمل بالتوازي:

- يفحصون بيانات المحل وكل واحد يستدعي **أدوات deterministic** للحقائق (طفايات، شهادات، نطاقات)
- ينتجون **تقرير امتثال تشغيلي**: ما الذي ينقص، ما الذي يحتاج تجديد، متى تنتهي كل رخصة، تكلفة الحلول
- يبنون **تقويم تذكيرات بريدية** (Resend + GitHub Actions cron) يرسل تنبيهاً قبل ٣٠ يوم من كل تجديد

النتيجة: المالك يفتح داشبورد يومي تظهر فيه «صحّة الرخص ٧٥٪، البلدية تنتهي خلال ١١ يوم، شهادات صحية ناقصة لموظفَين» بدلاً من البحث في ٧ بوابات حكومية.

---

## 2. ما هي القرارات التي يتخذها كل وكيل (Decisions)

| الوكيل                      | نوع القرار                 | ما الذي يقرّره                                                                                                                      |
| --------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Chat Agent** (Sonnet 4.6) | محادثة + استخراج           | أي حقل ينقص، هل يثق بالاستخراج من النص الحرّ أم يطلب تأكيد، متى تكتمل المقابلة                                                      |
| **Orchestrator**            | جدولة + dependencies       | أي ايجنتات تشتغل في موجة، أيها ينتظر outputs الآخرين، متى ينتقل المشروع لـ active_monitoring                                        |
| **Research Agent** (web)    | تصفية الصلة                | أي تحديثات تنظيمية حديثة (mci.gov.sa، sfda.gov.sa…) ترتبط بنشاط هذا المحل، وأي ايجنت يجب إخطاره                                     |
| **MCI specialist**          | منطق سجلّ تجاري            | هل السجل سارٍ أم انتهت مدته، احتساب موعد التجديد القادم، رسم أنشطة فرعية مفقودة                                                     |
| **Civil Defense**           | منطق سلامة                 | عدد الطفايات المطلوبة (`calculate_extinguisher_count(area, vertical)`)، هل المحل يحتاج فحص دوري، هل يبثّ `hasKitchen: true` للبلدية |
| **Municipality**            | اعتماد على رسائل الـ inbox | يقرأ صندوق رسائله: لو وصلت `hasKitchen: true` من Civil Defense → يضيف «رخصة المطبخ التجاري» (لا تظهر بدون هذي الرسالة)              |
| **SFDA**                    | متطلبات غذائية             | هل المحل يحتاج ترخيص SFDA (للأكل/الكوفي/البقالة)، صلاحية الشهادة، هل في نظام تتبّع تبريد                                            |
| **MOH** (وزارة الصحة)       | شهادات الموظفين            | كم موظف يحتاج شهادة صحية حسب نوع النشاط، هل العدد الحالي كافٍ                                                                       |
| **MOHR + GOSI**             | عمالة + نطاقات             | تقدير نطاقات السعودة، هل المحل ضمن «نطاق أخضر» أم لا                                                                                |
| **ZATCA**                   | ضرائب                      | هل دخل المحل تجاوز حدّ VAT الإلزامي (٣٧٥ ألف)، هل يحتاج تسجيل في الفوترة الإلكترونية                                                |
| **Analysis Agent**          | تقييم الحالة               | يقيّم كل entity → فجوة (`critical/high/medium/low`)، يبني الـ topWarnings، ينتج narrative عربي                                      |

---

## 3. هل وكيل واحد أم متعدد (Single vs multi-agent)

**نظام متعدد الوكلاء (Multi-agent) ـ ١٢ ايجنت في طبقتين**

### الطبقة الأولى ـ التنسيق (٥ وكلاء)

`orchestrator` · `chat` · `research` · `analysis` · `report`

### الطبقة الثانية ـ المتخصّصون (٧ وكلاء)

`mci` · `municipality` · `civil_defense` · `sfda` · `moh` · `mohr_gosi` · `zatca`

### تواصل A2A فعلي (Agent-to-Agent)

- كل ايجنت عنده **inbox مستقل** يقرأه قبل ما يبدأ شغله
- الـ Orchestrator يشغّل الايجنتات في **موجات** حسب الـ dependencies المُعرَّفة في كل ملف
- الرسائل بينهم تحمل **payload typed** يغيّر سلوك الوكيل المستقبِل في الـ runtime

### دليل أن الـ A2A حقيقي وليس زخرفة

`CivilDefenseAgent` يصدر `outbox: [{ to: 'municipality', type: 'dependency', payload: { hasKitchen: true } }]`. الـ Municipality يقرأ هذي الرسالة من inboxه فيضيف «رخصة المطبخ التجاري» لمتطلباته. **بدون هذي الرسالة الرخصة ما تظهر إطلاقاً** ـ يعني الرسالة تحدّد المخرج النهائي.

```ts
// src/agents/specialists/civil-defense-agent.ts
outbox: [
  {
    to: 'municipality',
    type: 'dependency',
    payload: { safetyCertReady: true, hasKitchen: isFoodVertical(answers) },
    messageAr: 'شهادة السلامة جاهزة — للبلدية متابعة رخصة المطبخ',
  },
];
```

---

## 4. المعمارية بـ ٦ مكونات

```
┌────────────────────┐       ┌──────────────────────────────────────┐
│   /chat (Next.js)  │──────▶│ Chat Agent                           │
│   ١٦ سؤال موجَّه    │       │ Sonnet 4.6 — extraction + next-q     │
└────────────────────┘       └──────────────────────────────────────┘
                                              │
                                              ▼
                              ┌──────────────────────────────────────┐
                              │ Project Orchestrator                 │
                              │ Wave Scheduler + AgentBus            │
                              └──────────────────────────────────────┘
                                              │
                       ┌──────────────────────┼──────────────────────┐
                       ▼                      ▼                      ▼
              ┌──────────────┐       ┌──────────────┐        ┌──────────────┐
              │  Research    │       │ 7 Specialist │        │  Analysis    │
              │  web_search  │       │   Agents     │        │  narrative   │
              └──────────────┘       └──────┬───────┘        └──────────────┘
                                            │
                                ┌───────────┴───────────┐
                                ▼                       ▼
                      ┌──────────────────┐    ┌──────────────────┐
                      │ Deterministic    │    │ AgentBus (A2A)   │
                      │ Tools (12+)      │    │ inbox per agent  │
                      └──────────────────┘    └──────────────────┘
                                            │
                                            ▼
                       ┌──────────────────────────────────────┐
                       │ Supabase (Postgres)                  │
                       │ daraa_chat_sessions + daraa_projects │
                       └──────────────────────────────────────┘
                                            │
                                            ▼
                       ┌──────────────────────────────────────┐
                       │ Resend + GitHub Actions Cron         │
                       │ تذكير بريدي يومي قبل التجديدات         │
                       └──────────────────────────────────────┘
```

### المكوّنات

1. **Frontend** ـ Next.js 14 (App Router) + Tailwind v4 + React. RTL بالكامل، خط Almarai + IBM Plex Sans Arabic.
2. **Agent Runtime** ـ `OrchestratorRuntime` يدير الـ AgentBus + الـ wave scheduler + الـ telemetry recorder.
3. **Specialists** ـ كل واحد يرث `LlmSpecialistAgent` (Claude tool-use loop) ويُعلن `tools`، `dependencies`، `systemPrompt`.
4. **Tools** ـ ١٢ أداة deterministic: `get_shop_summary`, `list_safety_requirements`, `calculate_extinguisher_count`, `check_renewal_urgency`, `add_months_to_date`, `lookup_vertical_requirements`, `check_vat_threshold`, `estimate_nitaqat_zone`, `list_health_requirements`, `list_food_safety_requirements`, `estimate_balady_cost`, `estimate_safety_cost`.
5. **Persistence** ـ Supabase Postgres مع جدولين بسيطين (`daraa_chat_sessions`, `daraa_projects`) شكل blob jsonb. service-role server-side فقط.
6. **Reminders** ـ GitHub Actions cron يومي ٧ صباح KSA → `/api/cron/reminders` → Resend.

---

## 5. سير العمل الكامل (User Journey)

```
1. User opens /chat
   │
2. Chat Agent: "وش اسم محلك؟" → User: "كافيه الأصالة"
   │
3. ١٦ سؤال (نوع، مدينة، تاريخ السجل، طفايات، تهوية، شهادات...)
   │
4. POST /api/project/start → Orchestrator launches
   │
5. Wave 1: research agent يبحث عبر web_search
   │
6. Wave 2: ٧ متخصصين بالتوازي
   ├─ كل واحد يقرأ inbox + يستدعي tools
   ├─ ينتج EntityCard (متطلبات + تكلفة + خطر)
   └─ يبثّ رسائل A2A للمتخصصين الآخرين
   │
7. Wave 3: analysis agent يبني narrative + topWarnings
   │
8. Project saved to Supabase + Renewal calendar built
   │
9. User redirected → /project/[id]
   ├─ Coverage scope (١١ فحص)
   ├─ Operational dashboard (gaps + dates)
   └─ Agent traces (transparency: tool calls + tokens + latency)
   │
10. Daily cron: لمن أي رخصة < ٣٠ يوم → email reminder
```

---

## 6. الملفات الرئيسية في الكود

| الموضوع           | الملف                                                  |
| ----------------- | ------------------------------------------------------ |
| Orchestrator core | `src/agents/runtime/orchestrator-runtime.ts`           |
| AgentBus + A2A    | `src/agents/runtime/agent-bus.ts`                      |
| Specialist base   | `src/agents/specialists/llm-base/llm-specialist.ts`    |
| Tools (shared)    | `src/agents/specialists/llm-base/shared-tools.ts`      |
| Chat agent        | `src/agents/chat-agent/`                               |
| Analysis          | `src/agents/operational-analysis/`                     |
| Persistence       | `src/infrastructure/persistence/supabase/`             |
| Reminders cron    | `src/app/api/cron/reminders/route.ts`                  |
| Knowledge base    | `src/knowledge/entities.ts` · `src/knowledge/zatca.ts` |

---

## 7. الإثباتات الجاهزة للعرض المباشر

- **شفافية AI**: كل صفحة مشروع فيها قسم `agent-traces` يعرض كل استدعاء أداة، عدد الـ tokens، الـ latency. مثال: `/project/demo-kafe-rafeh-op#agent-traces`
- **A2A حقيقي**: حذف `outbox` من `civil-defense-agent.ts` يؤدي مباشرة لاختفاء «رخصة المطبخ التجاري» من تقرير المطعم
- **Persistence**: الجلسة في Supabase تتحقّق عبر `select * from daraa_chat_sessions` ـ `currentQuestion` يتقدّم خطوة بخطوة
- **Reminders**: تشغيل يدوي لـ workflow في GitHub Actions يبعث إيميل لكل بريد محفوظ خلال ٦٠ ثانية
