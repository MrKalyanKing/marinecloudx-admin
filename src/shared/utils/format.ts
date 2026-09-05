/**
 * Deterministic value formatting.
 *
 * Every formatter here pins an explicit locale **and** timezone. That is not a
 * style preference — it is a correctness requirement.
 *
 * `toLocaleDateString()` with no arguments uses the ambient locale, which
 * differs between the Node process rendering the HTML (`8/17/2026`) and the
 * visitor's browser (`17/8/2026`). React then finds the two renders disagree
 * and throws a hydration error. Pinning the locale makes both sides produce the
 * same string.
 *
 * Timezone is pinned to UTC for the same reason: the server and the visitor are
 * rarely in the same zone, and a date near midnight would otherwise render as
 * two different days.
 *
 * Shared by the admin and the public site so there is one definition to change.
 */

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const DATE_TIME_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

const NUMBER_FORMAT = new Intl.NumberFormat("en-GB");

/** e.g. "17 Aug 2026". Returns an em dash for missing values. */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";

  return DATE_FORMAT.format(new Date(value));
}

/** e.g. "17 Aug 2026, 09:36" (UTC). */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";

  return DATE_TIME_FORMAT.format(new Date(value));
}

export function formatNumber(value: number): string {
  return NUMBER_FORMAT.format(value);
}

/** ISO string for a `<time datetime="…">` attribute. */
export function toIsoDate(value: string | Date): string {
  return new Date(value).toISOString();
}
