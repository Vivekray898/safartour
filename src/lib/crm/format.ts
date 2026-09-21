/**
 * Centralized CRM formatting utilities.
 *
 * Every date/currency/reference the CRM shows to a user must go through
 * these helpers so that no page can ever render `Invalid Date`, a raw
 * Postgres timestamp, or an internal database id.
 *
 * Dates in the CRM are stored as TEXT in two shapes:
 *  - `YYYY-MM-DD` (date-only columns: start_date, payment_date, ...)
 *  - `YYYY-MM-DD HH:MM:SS` UTC (timestamp columns: created_at, updated_at, ...)
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/** Parse a CRM date/datetime value into Date parts, or null when unusable. */
function parseDateValue(value: string | number | Date | null | undefined): {
  y: number; m: number; d: number; hh: number; mm: number;
} | null {
  if (value === null || value === undefined || value === '') return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return { y: value.getFullYear(), m: value.getMonth(), d: value.getDate(), hh: value.getHours(), mm: value.getMinutes() };
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return { y: d.getFullYear(), m: d.getMonth(), d: d.getDate(), hh: d.getHours(), mm: d.getMinutes() };
  }

  const s = String(value).trim();
  if (!s) return null;

  // `YYYY-MM-DD[ HH:MM[:SS]]` — the CRM's canonical TEXT format. Parse the
  // fields directly (never `new Date(s)`, which shifts date-only strings to
  // UTC and can render the wrong day in IST).
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) {
    const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    return { y, m: mo - 1, d, hh: Number(m[4] ?? 0), mm: Number(m[5] ?? 0) };
  }

  // Fall back to the platform parser for anything else (ISO with TZ etc.);
  // verify it actually produced a valid date.
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return { y: d.getFullYear(), m: d.getMonth(), d: d.getDate(), hh: d.getHours(), mm: d.getMinutes() };
}

/** `21 Sep 2026` — or fallback when unset/invalid. */
export function formatCRMDate(value: string | number | Date | null | undefined, fallback = '—'): string {
  const p = parseDateValue(value);
  if (!p) return fallback;
  return `${p.d} ${MONTHS[p.m]} ${p.y}`;
}

/** `21 Sep 2026, 2:30 PM` — or fallback when unset/invalid. */
export function formatCRMDateTime(value: string | number | Date | null | undefined, fallback = '—'): string {
  const p = parseDateValue(value);
  if (!p) return fallback;
  const h24 = p.hh;
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${p.d} ${MONTHS[p.m]} ${p.y}, ${h12}:${String(p.mm).padStart(2, '0')} ${ampm}`;
}

/** `21 Sep 2026 → 26 Sep 2026` (or single side when only one exists). */
export function formatCRMDateRange(
  start: string | number | Date | null | undefined,
  end: string | number | Date | null | undefined,
  fallback = 'Dates not set',
): string {
  const a = formatCRMDate(start, '');
  const b = formatCRMDate(end, '');
  if (a && b) return `${a} → ${b}`;
  if (a || b) return a || b;
  return fallback;
}

/** Indian-rupee money format: `₹1,23,456` — never NaN. */
export function formatCRMMoney(value: number | string | null | undefined, fallback = '₹0'): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (n === null || n === undefined || Number.isNaN(n) || !Number.isFinite(n)) return fallback;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

/** Human-readable reference for a database id, e.g. id 7 → `CUS-0007`. */
export function formatReference(prefix: string, id: number | string | null | undefined): string {
  if (id === null || id === undefined || id === '') return '—';
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) return '—';
  return `${prefix}-${String(n).padStart(4, '0')}`;
}
