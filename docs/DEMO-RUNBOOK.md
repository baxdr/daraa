# Demo runbook

3.5 minutes. Rehearse 5× before going on stage.

---

## Pre-flight (30 min before)

- Laptop charged, quiet
- `npm run dev` running, or production URL reachable
- Two tabs pre-opened:
  - App: `http://localhost:3333/` (or prod URL)
  - Nova Tech demo: `http://localhost:3333/demo/novatech/`
- Internet verified (Research Agent + backup URLs both need it)
- `ANTHROPIC_API_KEY` set — visit `/chat` and confirm the first question renders
- Backup URLs re-tested in the last 24 h (§4)
- Backup video on a USB drive + in cloud (offline-playable)

---

## 1. Opening · 15 s

> كل صاحب مشروع في السعودية يتعامل مع 5 إلى 15 جهة حكومية. من التأسيس للتشغيل، الإجراءات متعددة والتجديدات تنتهي بدون ما يدري. درع فيه وكيل ذكي متخصّص بكل جهة، يتواصلون مع بعض ويبنون لك خريطة الامتثال.

Stay on the landing page. Point at the two tracks.

---

## 2. Establishment — coffee shop · 90 s

Click **"ابدأ الاستشارة المجانية"**.

| Question | Answer |
|----------|--------|
| وش تبي تسوي؟ | أبي أفتح مشروع جديد |
| نوع المشروع؟ | مطعم / كوفي شوب |
| في أي مدينة؟ | الرياض |
| عدد الشركاء؟ | 2 |
| رأس المال؟ | 80000 |
| شريك غير سعودي؟ | لا — كلنا سعوديين |
| وضع الموقع؟ | **لقينا محل ولم نوقّع العقد** |

While the timeline runs, call out 2 A2A messages as they appear:

- `وكيل البحث → متخصص SFDA: تحديث السعرات الحرارية`
- `متخصّص الدفاع المدني → متخصّص البلدية: شهادتي لازم قبلك`

When the roadmap renders, point at the yellow banner:

> قبل ما توقّع عقد الإيجار — تأكّد من بلدي. ناس كثير يوقّعون قبل ما يتأكدون، ويخسرون الإيجار.

Scroll through the weekly roadmap. Cost summary: **~6,900–12,600 ريال · 4 أسابيع**.

---

## 3. Compliance — Nova Tech · 60 s

New tab: `/chat` → **"عندي مشروع شغّال"**.

| Question | Answer |
|----------|--------|
| نوع الشركة | SaaS |
| عدد الموظفين | 25 |
| تعالج بيانات شخصية؟ | نعم |
| عدد المستخدمين | أكثر من ١٠٠ ألف |
| عيّنتم DPO؟ | لا |
| أين البيانات؟ | خارج السعودية |
| عقود مع جهات حكومية؟ | نعم |
| URL | `http://localhost:3333/demo/novatech/index.html` |

Point at the A2A messages:

- `وكيل الفحص → متخصّص حماية البيانات: تسليم نتائج الفحص`
- `متخصّص حماية البيانات → وكيل التحليل: 13 قاعدة قابلة للتطبيق`

When the report renders, hold on the Fine Ticker counting up to ~2,000,000 ريال.

> سقف الغرامات 2 مليون ريال. الفجوات بلغة بسيطة — مو مصطلحات قانونية.

Expand one gap card ("وش المشكلة بالضبط").

---

## 4. Document generation · 20 s

Scroll to الوثائق الموصى بها → click **ولّد الوثيقة** on سياسة الخصوصية.

A4 policy renders. Type a company name in the toolbar — placeholder replaces live across the document.

> مخصّصة بأنواع البيانات، الموقع، والضمانات. اطبع PDF، راجعها قانونياً، انشرها.

---

## 5. Live test · 40 s

> خلوني أفحص موقع أحد منكم.

Start a fresh chat → compliance path → paste the judge's URL.

Backup if no volunteer (tested 24 h before):

- `https://jahez.net` — dramatic, ~2 M SAR
- `https://tamara.co` — fintech, English-only policy
- `https://stc.com.sa` — big brand, English-only policy
- `https://hungerstation.com` — ~81% score, shows the passing path

Skip `noon.com` — rate-limits the scanner.

---

## 6. Close · 15 s

> من التأسيس للتشغيل — وكيل ذكي لكل جهة، يتواصلون مع بعض، يعطونك النتيجة جاهزة. درع أول منصة سعودية تسوي هذا.

---

## If something breaks

| Breakage | Response |
|----------|----------|
| Chat POST 500 | Reload the tab. If it persists, refresh the browser and restart. |
| Scan stuck on timeline | Wait 30 s (fire-and-forget + polling). If still stuck, cancel and play the backup video. |
| Nova Tech doesn't load | Use one of the live backup URLs. |
| Claude API 429 | Fallbacks kick in automatically. Narrate: "نظامنا يشتغل حتى لو الـ AI API tripped." |
| Internet down | Play the backup video. |

---

## Agent count Q&A

If asked "كم agent":

> 3 وكلاء LLM — المحادثة، البحث، توليد المستندات.
> 7 متخصّصين deterministic، كل واحد يعرف جهة واحدة.
> وكيلي تنسيق — المنسّق ووكيل التقرير.
> المجموع 12. الثلاثة اللي فوق يستعملون Claude — الباقي rule-based يتواصلون عبر A2A bus.
