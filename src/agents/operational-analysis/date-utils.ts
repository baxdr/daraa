/**
 * Date utility helpers used by the operational analyzer. Internal — not re-exported.
 */

export const MS_PER_DAY = 86_400_000;

export function parseIsoDate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return null;
  const [, y, m, d] = match;
  const dt = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

export function daysBetween(from: Date, to: Date): number | null {
  if (!(to instanceof Date) || Number.isNaN(to.getTime())) return null;
  const fromUtc = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  const toUtc = to.getTime();
  return Math.round((toUtc - fromUtc) / MS_PER_DAY);
}

export function isoOf(d: Date): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}
