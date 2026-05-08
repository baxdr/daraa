const PROBLEMS = [
  'جهات حكومية كثيرة ومُربكة',
  'ترتيب خاطئ يؤدي لرفض الطلب',
  'وثائق مرفوضة وطلبات متكررة',
  'غرامات غير متوقعة',
  'شهور من التأخير والتعقيد',
];

const SOLUTIONS = [
  'تسلسل صحيح مخصص لنشاطك',
  'وثائق جاهزة بالكامل',
  'تحذيرات مسبقة من الغرامات',
  'خريطة طريق كاملة',
  'أيام بدلاً من أشهر',
];

export function Problem() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 pb-16 md:px-10 md:pb-24">
      <div className="mb-12">
        <h2 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
          الفرق واضح
        </h2>
      </div>
      <div className="rule mb-12" />

      <div className="grid gap-8 md:grid-cols-2">
        <div className="rounded-lg border border-rule bg-white p-8 md:p-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-paper-2 px-4 py-2">
            <span aria-hidden className="text-lg">
              ✗
            </span>
            <span className="text-sm font-bold text-ink-2">بدون درع</span>
          </div>
          <h3 className="font-display text-2xl font-extrabold text-ink">المشاكل</h3>
          <ul className="mt-6 space-y-4">
            {PROBLEMS.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <span className="mt-1 text-lg text-warn" aria-hidden>
                  ⚠
                </span>
                <span className="text-sm text-ink-2">{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-accent bg-gradient-to-b from-white to-paper-2/50 p-8 md:p-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2">
            <span aria-hidden className="text-lg">
              ✓
            </span>
            <span className="text-sm font-bold text-accent">مع درع</span>
          </div>
          <h3 className="font-display text-2xl font-extrabold text-ink">الحلول</h3>
          <ul className="mt-6 space-y-4">
            {SOLUTIONS.map((s) => (
              <li key={s} className="flex items-start gap-3">
                <span className="mt-1 text-lg text-accent" aria-hidden>
                  ✓
                </span>
                <span className="text-sm text-ink-2">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
