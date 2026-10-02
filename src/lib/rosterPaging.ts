// Paging for the coach roster. A volleyball roster fits in one page; the cap
// only exists so a very large team (or a club using one team for everyone)
// cannot load an unbounded number of rows in one request.

export const ROSTER_PAGE_SIZE = 100;

/**
 * Inclusive row range for PostgREST's .range(). It asks for one row past the
 * page so the caller can tell whether another page exists without a count
 * query.
 */
export function rosterPageRange(offset: number, pageSize = ROSTER_PAGE_SIZE): { from: number; to: number } {
  return { from: offset, to: offset + pageSize };
}

export function splitRosterPage<T>(rows: T[], pageSize = ROSTER_PAGE_SIZE): { rows: T[]; hasMore: boolean } {
  return { rows: rows.slice(0, pageSize), hasMore: rows.length > pageSize };
}
