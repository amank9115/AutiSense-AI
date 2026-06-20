/**
 * Date / age helpers shared across dashboard pages.
 */

/**
 * Formats a date-of-birth string as a human-readable "Xy Ym" age.
 *
 * Pure and deterministic given `now` (defaults to the current date). Pass an
 * explicit `now` in tests to avoid time-dependent assertions.
 */
export function calculateAge(dob: string, now: Date = new Date()): string {
  const birth = new Date(dob);
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  return `${years}y ${months}m`;
}
