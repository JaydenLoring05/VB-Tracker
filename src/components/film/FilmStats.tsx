"use client";

import { CSSProperties, useId, useMemo } from "react";

import {
  BlockCounts,
  filmStatsForAthlete,
  formatPassAverage,
  formatShare,
  hasFilmStats,
  SetDistribution,
  StatTag
} from "@/lib/filmStats";
import { SetZone } from "@/types";

import "@/styles/film-stats.css";

// The court as the team sees it facing the net: front row 4-3-2, back row 5-6-1.
const COURT_ORDER: SetZone[] = ["4", "3", "2", "5", "6", "1"];

/** The strongest tint a zone gets. Kept low so the text on it stays readable. */
const MAX_ZONE_FILL = 28;

export function plural(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}

/** Set distribution drawn as the six court zones, each with its count and share. */
export function SetZoneCourt({ sets }: { sets: SetDistribution }) {
  const byZone = new Map(sets.zones.map((zone) => [zone.zone, zone]));
  // Tint each zone against the busiest one, so the most-set zone always stands out.
  const busiest = Math.max(...sets.zones.map((zone) => zone.share), 0);

  return (
    <div className="set-court">
      <span className="set-court-net" aria-hidden="true">
        Net
      </span>
      <ul className="set-court-grid" role="list">
        {COURT_ORDER.map((zoneId) => {
          const zone = byZone.get(zoneId);
          const count = zone?.count ?? 0;
          const share = zone?.share ?? 0;
          return (
            <li
              key={zoneId}
              className={count === 0 ? "set-court-zone is-empty" : "set-court-zone"}
              style={{ "--zone-fill": `${busiest > 0 ? Math.round((share / busiest) * MAX_ZONE_FILL) : 0}%` } as CSSProperties}
            >
              <span className="set-court-zone-name">Zone {zoneId}</span>
              <strong className="set-court-zone-share">{formatShare(share)}</strong>
              <span className="set-court-zone-count">{plural(count, "set")}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** A table that scrolls sideways on its own when the screen is too narrow for it. */
export function StatsTableScroll({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="film-stats-scroll" role="region" aria-label={label} tabIndex={0}>
      {children}
    </div>
  );
}

export type PassRow = { key: string; label: string; count: number; average: number | null };

/** Passes and passing average, one row per athlete (film page) or per film (athlete drill-down). */
export function PassTable({ rows, rowHeader, caption }: { rows: PassRow[]; rowHeader: string; caption: string }) {
  return (
    <StatsTableScroll label={caption}>
      <table className="film-stats-table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{rowHeader}</th>
            <th scope="col" className="num">
              Passes
            </th>
            <th scope="col" className="num">
              Average
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <th scope="row">{row.label}</th>
              <td className="num">{row.count}</td>
              <td className="num">
                <strong>{formatPassAverage(row.average)}</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </StatsTableScroll>
  );
}

export type BlockRow = { key: string; label: string; counts: BlockCounts };

/** Block outcomes, one row per athlete (film page) or per film (athlete drill-down). */
export function BlockTable({ rows, rowHeader, caption }: { rows: BlockRow[]; rowHeader: string; caption: string }) {
  const unrated = rows.reduce((sum, row) => sum + row.counts.unrated, 0);

  return (
    <>
      <StatsTableScroll label={caption}>
        <table className="film-stats-table">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              <th scope="col">{rowHeader}</th>
              <th scope="col" className="num">
                Blocks
              </th>
              <th scope="col" className="num">
                Stuff
              </th>
              <th scope="col" className="num">
                Touch
              </th>
              <th scope="col" className="num">
                Tooled
              </th>
              <th scope="col" className="num">
                Missed
              </th>
              <th scope="col" className="num">
                Error
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <th scope="row">{row.label}</th>
                <td className="num">
                  <strong>{row.counts.total}</strong>
                </td>
                <td className="num">{row.counts.stuff}</td>
                <td className="num">{row.counts.touch}</td>
                <td className="num">{row.counts.tooled}</td>
                <td className="num">{row.counts.missed}</td>
                <td className="num">{row.counts.error}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </StatsTableScroll>
      {unrated > 0 && (
        <p className="muted film-stats-note">
          {plural(unrated, "block")} {unrated === 1 ? "has" : "have"} no outcome, so the columns add up to less than Blocks.
        </p>
      )}
    </>
  );
}

/**
 * Stats for the film being watched, worked out from its tags (F-01):
 * passing average, where the sets went, and block outcomes.
 *
 * A coach sees every athlete. With `onlyAthleteId` (an athlete's own view)
 * the passing and blocking tables show just that athlete; the set map is
 * the team's either way.
 */
export function FilmStats({
  tags,
  athleteName,
  onlyAthleteId = null
}: {
  tags: StatTag[];
  /** Display name for a tag's athlete, or null when it has none / isn't visible. */
  athleteName: (athleteId: string | null) => string | null;
  onlyAthleteId?: string | null;
}) {
  const stats = useMemo(() => filmStatsForAthlete(tags, onlyAthleteId), [tags, onlyAthleteId]);
  const own = onlyAthleteId !== null;
  const headingId = useId();
  const nameFor = (athleteId: string | null) => athleteName(athleteId) ?? "No athlete";

  if (!hasFilmStats(stats)) {
    return (
      <div className="empty-state">
        <p className="muted">
          {own
            ? "No stats for this film yet. They show up here once your coach rates your passes or tags your blocks."
            : "No stats for this film yet. Rate a pass, tag a block or pick a zone on a set, and the numbers add up here."}
        </p>
      </div>
    );
  }

  return (
    <div className="film-stats">
      <section className="film-stats-section" aria-labelledby={`${headingId}-passing`}>
        <div className="film-stats-head">
          <h4 id={`${headingId}-passing`}>{own ? "Your passing" : "Passing"}</h4>
          {stats.passes.team.average !== null && (
            <p className="muted">
              Team average <strong>{formatPassAverage(stats.passes.team.average)}</strong> on{" "}
              {plural(stats.passes.team.count, "pass", "passes")}
            </p>
          )}
        </div>
        {stats.passes.athletes.length > 0 ? (
          <PassTable
            rowHeader="Athlete"
            caption="Passing average by athlete, on the 0 to 3 scale"
            rows={stats.passes.athletes.map((line) => ({ key: line.athleteId ?? "none", label: nameFor(line.athleteId), ...line }))}
          />
        ) : (
          <p className="muted film-stats-empty">
            {own ? "None of your passes are rated in this film yet." : "No rated passes yet. Passes are rated 0 to 3."}
          </p>
        )}
      </section>

      <section className="film-stats-section" aria-labelledby={`${headingId}-sets`}>
        <div className="film-stats-head">
          <h4 id={`${headingId}-sets`}>{own ? "Where the team set" : "Set distribution"}</h4>
          {stats.sets.total > 0 && <p className="muted">{plural(stats.sets.total, "set")} with a zone</p>}
        </div>
        {stats.sets.total > 0 ? (
          <SetZoneCourt sets={stats.sets} />
        ) : (
          <p className="muted film-stats-empty">
            {own
              ? "No sets have a zone in this film yet."
              : "No sets have a zone yet. Open Detailed tags, tag a set and pick its zone to see where the ball is going."}
          </p>
        )}
        {stats.sets.total > 0 && stats.sets.unzoned > 0 && (
          <p className="muted film-stats-note">
            {plural(stats.sets.unzoned, "more set")} {stats.sets.unzoned === 1 ? "has" : "have"} no zone, so{" "}
            {stats.sets.unzoned === 1 ? "it isn't" : "they aren't"} counted here.
          </p>
        )}
      </section>

      <section className="film-stats-section" aria-labelledby={`${headingId}-blocking`}>
        <div className="film-stats-head">
          <h4 id={`${headingId}-blocking`}>{own ? "Your blocking" : "Blocking"}</h4>
        </div>
        {stats.blocks.length > 0 ? (
          <BlockTable
            rowHeader="Athlete"
            caption="Block outcomes by athlete"
            rows={stats.blocks.map((line) => ({ key: line.athleteId ?? "none", label: nameFor(line.athleteId), counts: line }))}
          />
        ) : (
          <p className="muted film-stats-empty">{own ? "None of your blocks are tagged in this film yet." : "No blocks tagged yet."}</p>
        )}
      </section>
    </div>
  );
}
