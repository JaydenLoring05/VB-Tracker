"use client";

import { useId, useMemo } from "react";

import { BlockTable, PassTable, plural, SetZoneCourt } from "@/components/film/FilmStats";
import { useAthleteFilmStats } from "@/hooks/useAthleteFilmStats";
import { formatPassAverage, passAverages, setDistribution, statsByFilm } from "@/lib/filmStats";

/**
 * The Film tab of the coach's athlete drill-down (F-01): the athlete's
 * passing average and block outcomes, film by film, and where they set if
 * they are a setter. Loads its tags only when the tab is opened.
 */
export function AthleteFilmStats({
  userId,
  teamId,
  displayName
}: {
  userId: string;
  /** The team being viewed, so an athlete on two of the coach's teams doesn't get the numbers mixed. */
  teamId?: string;
  displayName: string;
}) {
  const { loading, tags, films, error } = useAthleteFilmStats(userId, teamId);
  const headingId = useId();

  const stats = useMemo(() => {
    // Tags whose film can't be read (deleted mid-load) are left out everywhere, so the tiles match the tables.
    const known = tags.filter((tag) => films[tag.film_id]);
    const byFilm = statsByFilm(known, films);
    return {
      passes: passAverages(known).team,
      sets: setDistribution(known),
      passFilms: byFilm.filter((line) => line.passes.count > 0),
      blockFilms: byFilm.filter((line) => line.blocks.total > 0),
      blocks: byFilm.reduce((sum, line) => sum + line.blocks.total, 0),
      stuffs: byFilm.reduce((sum, line) => sum + line.blocks.stuff, 0)
    };
  }, [tags, films]);

  if (loading) {
    return (
      <p className="muted" role="status">
        Loading film stats...
      </p>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <p className="muted">{error}</p>
      </div>
    );
  }

  if (stats.passFilms.length === 0 && stats.blockFilms.length === 0 && stats.sets.total === 0) {
    return (
      <div className="empty-state">
        <p className="muted">
          No film stats for {displayName} yet. They show up here once you rate their passes, tag their blocks or pick a
          zone on their sets in Film.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="athlete-adherence-summary">
        <div>
          <strong>{formatPassAverage(stats.passes.average)}</strong>
          <span className="muted">
            {stats.passes.count > 0
              ? `Passing average on ${plural(stats.passes.count, "pass", "passes")}`
              : "Passing average (no rated passes)"}
          </span>
        </div>
        <div>
          <strong>{stats.blocks}</strong>
          <span className="muted">
            {stats.blocks === 1 ? "Block" : "Blocks"} tagged, {plural(stats.stuffs, "stuff")}
          </span>
        </div>
        <div>
          <strong>{stats.sets.total}</strong>
          <span className="muted">{stats.sets.total === 1 ? "Set" : "Sets"} with a zone</span>
        </div>
      </div>

      <div className="film-stats athlete-film-stats">
        {stats.passFilms.length > 0 && (
          <section className="film-stats-section" aria-labelledby={`${headingId}-passing`}>
            <div className="film-stats-head">
              <h3 id={`${headingId}-passing`}>Passing by film</h3>
              <p className="muted">Rated 0 to 3, newest film first</p>
            </div>
            <PassTable
              rowHeader="Film"
              caption={`${displayName}'s passing average in each film`}
              rows={stats.passFilms.map((line) => ({ key: line.filmId, label: line.title, ...line.passes }))}
            />
          </section>
        )}

        {stats.blockFilms.length > 0 && (
          <section className="film-stats-section" aria-labelledby={`${headingId}-blocking`}>
            <div className="film-stats-head">
              <h3 id={`${headingId}-blocking`}>Blocking by film</h3>
            </div>
            <BlockTable
              rowHeader="Film"
              caption={`${displayName}'s block outcomes in each film`}
              rows={stats.blockFilms.map((line) => ({ key: line.filmId, label: line.title, counts: line.blocks }))}
            />
          </section>
        )}

        {stats.sets.total > 0 && (
          <section className="film-stats-section" aria-labelledby={`${headingId}-sets`}>
            <div className="film-stats-head">
              <h3 id={`${headingId}-sets`}>Set distribution</h3>
              <p className="muted">Across every film</p>
            </div>
            <SetZoneCourt sets={stats.sets} />
          </section>
        )}
      </div>
    </>
  );
}
