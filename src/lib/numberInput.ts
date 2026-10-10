/**
 * Reads what was typed in a whole-number field (sets, seconds). Returns the
 * number when it is a whole number of at least `min`, and null for anything
 * else, including an empty field. Null means "keep the last good value": the
 * field must never rewrite itself to a default while the coach is typing,
 * because the next digit would land after that default ("1" then "12" -> "112").
 */
export function parseWholeNumber(text: string, min = 1): number | null {
  const trimmed = text.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return Number.isSafeInteger(value) && value >= min ? value : null;
}
