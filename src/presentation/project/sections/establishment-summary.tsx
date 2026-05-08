/**
 * Operational compliance summary — top-level stats for the project page.
 *
 * Was named "Establishment" in the pre-pivot tri-mode era. Kept the
 * filename to avoid a wide rename across imports; the export name is
 * still EstablishmentSummary so the call site in page-shell.tsx keeps
 * working. Content is operational-only post-pivot.
 */

interface ShopSummaryProps {
  entityCount: number;
  weekCount: number;
  costMinSar: number;
  costMaxSar: number;
}

export function EstablishmentSummary({
  entityCount,
  weekCount,
  costMinSar,
  costMaxSar,
}: ShopSummaryProps) {
  return (
    <section className="mb-12 grid grid-cols-1 gap-0 border border-rule bg-white sm:grid-cols-3">
      <StatCell label="الجهات اللي تتابعها" value={entityCount.toString()} />
      <StatCell
        label="الرسوم التقديرية"
        value={
          costMaxSar === 0
            ? 'مجاني'
            : `${costMinSar.toLocaleString('en-US')}–${costMaxSar.toLocaleString('en-US')} ريال`
        }
        note="رسوم الجهات فقط"
      />
      <StatCell
        label="جدول الترتيب"
        value={`${weekCount} أسابيع`}
        note="بالتوازي حيث يمكن"
        noRightBorder
      />
    </section>
  );
}

interface StatCellProps {
  label: string;
  value: string;
  note?: string;
  noRightBorder?: boolean;
}

function StatCell({ label, value, note, noRightBorder }: StatCellProps) {
  return (
    <div
      className={`px-5 py-5 md:px-6 md:py-6 ${
        noRightBorder ? '' : 'border-b border-rule sm:border-b-0 sm:border-s'
      }`}
    >
      <div className="eyebrow">{label}</div>
      <div className="mt-2 font-display text-2xl font-extrabold leading-tight tracking-tight text-ink">
        {value}
      </div>
      {note && <div className="mt-1 text-xs text-muted">{note}</div>}
    </div>
  );
}
