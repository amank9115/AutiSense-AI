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
  if (isNaN(birth.getTime())) return "—";
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
    years--;
    months += 12;
  }
  if (now.getDate() < birth.getDate() && months > 0) months--;
  return `${years}y ${months}m`;
}
