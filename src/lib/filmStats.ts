import { FilmTag, SetZone } from "@/types";

/**
 * Film stats from tags (F-01). Pure functions over the film_tags columns
 * that already exist (schema_v36 details, schema_v53 result), so nothing
 * here needs a database change.
 */

/** The columns the stats read. Any FilmTag fits. */
export type StatTag = Pick<FilmTag, "tag" | "athlete_id" | "pass_rating" | "set_zone" | "block_outcome" | "result">;

const SET_ZONE_ORDER: SetZone[] = ["1", "2", "3", "4", "5", "6"];

export type ZoneCount = { zone: SetZone; count: number; /** 0 to 1, of the sets that have a zone. */ share: number };

export type SetDistribution = {
  /** Sets tagged with a zone. */
  total: number;
  /** All six zones in order, including the empty ones. */
  zones: ZoneCount[];
  /** Sets tagged with no zone (the three-tap flow records a result, not a zone). */
  unzoned: number;
};

/** Where the sets went: how many to each zone, and each zone's share. */
export function setDistribution(tags: StatTag[]): SetDistribution {
  const counts = new Map<SetZone, number>();
  let total = 0;
  let unzoned = 0;

  for (const tag of tags) {
    if (tag.tag !== "set") continue;
    if (!tag.set_zone || !SET_ZONE_ORDER.includes(tag.set_zone)) {
      unzoned += 1;
      continue;
    }
    counts.set(tag.set_zone, (counts.get(tag.set_zone) ?? 0) + 1);
    total += 1;
  }

  const zones = SET_ZONE_ORDER.map((zone) => {
    const count = counts.get(zone) ?? 0;
    return { zone, count, share: total > 0 ? count / total : 0 };
  });

  return { total, zones, unzoned };
}

export type PassSummary = { count: number; average: number | null };
export type PassLine = { athleteId: string | null; count: number; average: number };
export type PassAverages = { team: PassSummary; athletes: PassLine[] };

function isPassRating(value: unknown): value is 0 | 1 | 2 | 3 {
  return value === 0 || value === 1 || value === 2 || value === 3;
}

/** Unassigned tags (no athlete) always sort last. */
function unassignedLast(a: string | null, b: string | null): number {
  if (a === null && b !== null) return 1;
  if (b === null && a !== null) return -1;
  return 0;
}

/**
 * Passing average per athlete on the 0-3 scale, plus the team's. Only
 * rated passes count; best passer first.
 */
export function passAverages(tags: StatTag[]): PassAverages {
  const byAthlete = new Map<string | null, { count: number; sum: number }>();
  let count = 0;
  let sum = 0;

  for (const tag of tags) {
    if (tag.tag !== "pass" || !isPassRating(tag.pass_rating)) continue;
    const line = byAthlete.get(tag.athlete_id) ?? { count: 0, sum: 0 };
    line.count += 1;
    line.sum += tag.pass_rating;
    byAthlete.set(tag.athlete_id, line);
    count += 1;
    sum += tag.pass_rating;
  }

  const athletes = [...byAthlete.entries()]
    .map(([athleteId, line]) => ({ athleteId, count: line.count, average: line.sum / line.count }))
    .sort(
      (a, b) => unassignedLast(a.athleteId, b.athleteId) || b.average - a.average || b.count - a.count
    );

  return { team: { count, average: count > 0 ? sum / count : null }, athletes };
}

export type BlockCounts = {
  /** Every block tagged, with or without an outcome. */
  total: number;
  stuff: number;
  touch: number;
  tooled: number;
  missed: number;
  /** Three-tap "Error": could be tooled or a net touch, so it has no outcome. */
  error: number;
  /** Tagged as a block with no outcome picked. */
  unrated: number;
};

export type BlockLine = { athleteId: string | null } & BlockCounts;

function emptyBlockCounts(): BlockCounts {
  return { total: 0, stuff: 0, touch: 0, tooled: 0, missed: 0, error: 0, unrated: 0 };
}

function addBlock(counts: BlockCounts, tag: StatTag) {
  counts.total += 1;
  if (tag.block_outcome === "stuff" || tag.block_outcome === "touch" || tag.block_outcome === "tooled" || tag.block_outcome === "missed") {
    counts[tag.block_outcome] += 1;
  } else if (tag.result === "error") {
    counts.error += 1;
  } else {
    counts.unrated += 1;
  }
}

/** Block outcomes per athlete: most blocks first, then most stuffs. */
export function blockOutcomes(tags: StatTag[]): BlockLine[] {
  const byAthlete = new Map<string | null, BlockCounts>();

  for (const tag of tags) {
    if (tag.tag !== "block") continue;
    let counts = byAthlete.get(tag.athlete_id);
    if (!counts) {
      counts = emptyBlockCounts();
      byAthlete.set(tag.athlete_id, counts);
    }
    addBlock(counts, tag);
  }

  return [...byAthlete.entries()]
    .map(([athleteId, counts]) => ({ athleteId, ...counts }))
    .sort((a, b) => unassignedLast(a.athleteId, b.athleteId) || b.total - a.total || b.stuff - a.stuff);
}

export type FilmStats = { sets: SetDistribution; passes: PassAverages; blocks: BlockLine[] };

/**
 * All three stats for one film. With an athlete id, the per-athlete tables
 * keep only that athlete's rows (what an athlete sees on the film page);
 * the set map stays the team's. Only null means "everyone": an empty id
 * matches nobody, so a viewer whose id is missing never sees the whole team.
 */
export function filmStatsForAthlete(tags: StatTag[], athleteId: string | null): FilmStats {
  const passes = passAverages(tags);
  const blocks = blockOutcomes(tags);

  return {
    sets: setDistribution(tags),
    passes: athleteId !== null ? { ...passes, athletes: passes.athletes.filter((line) => line.athleteId === athleteId) } : passes,
    blocks: athleteId !== null ? blocks.filter((line) => line.athleteId === athleteId) : blocks
  };
}

/** False when a film's tags give the stats nothing to show yet. */
export function hasFilmStats(stats: FilmStats): boolean {
  return stats.sets.total > 0 || stats.passes.athletes.length > 0 || stats.blocks.length > 0;
}

export type FilmStatLine = {
  filmId: string;
  title: string;
  createdAt: string;
  passes: PassSummary;
  blocks: BlockCounts;
};

/**
 * One line per film ("per match") for a set of tags, newest film first.
 * Meant for one athlete's tags. Films with no rated pass and no block are
 * left out.
 */
export function statsByFilm<T extends StatTag & { film_id: string }>(
  tags: T[],
  films: Record<string, { title: string; created_at: string } | undefined>
): FilmStatLine[] {
  const byFilm = new Map<string, T[]>();
  for (const tag of tags) {
    if (!films[tag.film_id]) continue;
    const list = byFilm.get(tag.film_id);
    if (list) list.push(tag);
    else byFilm.set(tag.film_id, [tag]);
  }

  const lines: FilmStatLine[] = [];
  for (const [filmId, filmTags] of byFilm) {
    const film = films[filmId]!;
    const passes = passAverages(filmTags).team;
    const blocks = emptyBlockCounts();
    for (const tag of filmTags) if (tag.tag === "block") addBlock(blocks, tag);
    if (passes.count === 0 && blocks.total === 0) continue;
    lines.push({ filmId, title: film.title, createdAt: film.created_at, passes, blocks });
  }

  return lines.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** "2.13", or "-" when nothing is rated. Coaches read passing to two places. */
export function formatPassAverage(average: number | null): string {
  return average === null ? "-" : average.toFixed(2);
}

/** A 0-1 share as a whole percent, such as "33%". */
export function formatShare(share: number): string {
  return `${Math.round(share * 100)}%`;
}
