/**
 * Coverage scope card — the explicit menu of everything the agents check.
 *
 * Without this, users see a list of gaps but don't realise the scope of
 * the analysis (e.g. "did you also check my signage / lease / staff
 * health certs?"). This component renders all 11 check categories with
 * a clean/issue indicator per category, derived from OperationalReport.
 */

import type { OperationalReport, OpCategory } from '@/agents/operational-analysis';

interface CategoryDef {
  id: OpCategory;
  labelAr: string;
  /** One-line description of what's checked. */
  checkedAr: string;
}

const CATEGORIES: CategoryDef[] = [
  { id: 'cr', labelAr: 'السجل التجاري', checkedAr: 'تجديد سنوي + تحديث النشاط' },
  { id: 'municipal', labelAr: 'الرخصة البلدية', checkedAr: 'موعد التجديد + اشتراطات النشاط' },
  {
    id: 'civil_defense',
    labelAr: 'الدفاع المدني',
    checkedAr: 'شهادة السلامة السنوية',
  },
  {
    id: 'extinguishers',
    labelAr: 'الطفايات والسلامة',
    checkedAr: 'العدد + الفحص الدوري + مخارج الطوارئ',
  },
  {
    id: 'ventilation',
    labelAr: 'التهوية والشفط',
    checkedAr: 'نظام شفط مطابق للمطابخ',
  },
  {
    id: 'refrigeration',
    labelAr: 'التبريد',
    checkedAr: 'صيانة دورية للمبردات',
  },
  {
    id: 'hygiene',
    labelAr: 'الشهادات الصحية',
    checkedAr: 'شهادة سارية لكل موظف يتعامل مع الغذاء',
  },
  { id: 'sfda', labelAr: 'ترخيص الغذاء (SFDA)', checkedAr: 'فحص ميداني سنوي' },
  {
    id: 'signage',
    labelAr: 'لوحة المحل',
    checkedAr: 'اعتماد بلدي + المواصفات',
  },
  {
    id: 'labor',
    labelAr: 'العمل والنطاقات',
    checkedAr: 'نسبة التوطين + تأمينات شهرية',
  },
  { id: 'lease', labelAr: 'عقد الإيجار', checkedAr: 'تنبيه قبل الانتهاء بـ ٦٠ يوم' },
];

export function CoverageScope({ report }: { report: OperationalReport }) {
  const issuesByCategory = new Map<OpCategory, { critical: number; medium: number; low: number }>();
  for (const gap of report.gaps) {
    const bucket = issuesByCategory.get(gap.category) ?? { critical: 0, medium: 0, low: 0 };
    if (gap.severity === 'critical') bucket.critical += 1;
    else if (gap.severity === 'medium') bucket.medium += 1;
    else bucket.low += 1;
    issuesByCategory.set(gap.category, bucket);
  }

  const cleanCount = CATEGORIES.filter((c) => !issuesByCategory.has(c.id)).length;

  return (
    <section className="mb-12">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">
            ما الذي فحصناه لمحلك
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-2">
            ١١ فئة فحص تشمل التراخيص + البنية التحتية للسلامة + الشهادات + الإيجار. الـ ✓ يعني
            بياناتك سليمة في هذي الفئة، الرقم الأحمر/الأصفر يعني عدد الملاحظات.
          </p>
        </div>
        <span className="font-mono text-xs text-muted" dir="rtl">
          {cleanCount} / {CATEGORIES.length} سليم
        </span>
      </div>
      <div className="rule mb-6" />

      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
        {CATEGORIES.map((cat) => {
          const issues = issuesByCategory.get(cat.id);
          const hasIssues = issues !== undefined;
          const total = issues ? issues.critical + issues.medium + issues.low : 0;
          const tone = !hasIssues
            ? 'border-accent/30 bg-accent-soft'
            : (issues?.critical ?? 0) > 0
              ? 'border-danger/40 bg-danger/5'
              : 'border-warn/40 bg-warn-soft';
          return (
            <div key={cat.id} className={`border ${tone} px-4 py-3`}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-display text-sm font-extrabold text-ink">{cat.labelAr}</span>
                {hasIssues ? (
                  <span
                    className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 font-mono text-[10px] font-bold tabular-nums ${
                      (issues?.critical ?? 0) > 0
                        ? 'bg-danger text-white'
                        : 'bg-warn-strong text-white'
                    }`}
                  >
                    {total}
                  </span>
                ) : (
                  <span
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white"
                    aria-label="سليم"
                    title="ما لقينا ملاحظات في هذي الفئة"
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 6 L5 9 L10 3" />
                    </svg>
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-ink-2">{cat.checkedAr}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
