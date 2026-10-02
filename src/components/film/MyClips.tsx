"use client";

import { Play } from "lucide-react";
import { useMemo } from "react";

import { MyClip } from "@/hooks/useMyClips";
import { formatTimestamp } from "@/lib/film";
import { groupClipsByFilm } from "@/lib/filmQuickTag";

import { describeTag } from "./tagMeta";

/** An athlete's own plays and the coach's comments to them, grouped by film. */
export function MyClips({
  clips,
  loading,
  error,
  onPlay
}: {
  clips: MyClip[];
  loading: boolean;
  error: string | null;
  onPlay: (filmId: string, seconds: number) => void;
}) {
  const groups = useMemo(() => groupClipsByFilm(clips), [clips]);

  if (loading) return <p className="muted">Loading your clips...</p>;
  if (error) return <p className="muted">{error}</p>;

  if (groups.length === 0) {
    return (
      <div className="empty-state">
        <p className="muted">No clips yet. When your coach tags your plays or leaves you a comment, they show up here.</p>
      </div>
    );
  }

  return (
    <div className="my-clips">
      {groups.map((group) => (
        <section key={group.filmId} className="my-clips-film">
          <h3>{group.title}</h3>
          <ul className="film-tag-list">
            {group.clips.map((clip) => (
              <li key={clip.id} className="film-tag-item my-clip-item">
                <button
                  type="button"
                  className="ghost film-tag-timestamp"
                  aria-label={`Watch ${describeTag(clip)} at ${formatTimestamp(clip.seconds)}`}
                  onClick={() => onPlay(group.filmId, clip.seconds)}
                >
                  <Play size={14} /> {formatTimestamp(clip.seconds)}
                </button>
                <span className="film-tag-type">{describeTag(clip)}</span>
                {clip.note && <span className="film-tag-note">{clip.note}</span>}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
