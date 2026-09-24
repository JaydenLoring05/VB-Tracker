"use client";

import { ExternalLink } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { parseYouTubeId } from "@/lib/film";
import { FilmTag, FilmTagType, TeamFilm } from "@/types";

import { AddTagControls } from "./AddTagControls";
import { TagFilterChips } from "./TagFilterChips";
import { TagList } from "./TagList";
import { YouTubePlayer, YouTubePlayerHandle } from "./YouTubePlayer";

export function FilmPanel({
  film,
  tags,
  isCoach,
  onAddTag,
  onDeleteTag
}: {
  film: TeamFilm;
  tags: FilmTag[];
  isCoach: boolean;
  onAddTag: (input: { filmId: string; seconds: number; tag: FilmTagType }) => void;
  onDeleteTag: (tag: FilmTag) => void;
}) {
  const playerRef = useRef<YouTubePlayerHandle>(null);
  const [activeFilter, setActiveFilter] = useState<FilmTagType | null>(null);

  const youTubeId = useMemo(() => parseYouTubeId(film.video_url), [film.video_url]);

  function handleSeek(seconds: number) {
    playerRef.current?.seekTo(seconds);
  }

  const visibleTags = activeFilter ? tags.filter((tag) => tag.tag === activeFilter) : tags;

  return (
    <div className="film-panel">
      <h3>{film.title}</h3>

      {youTubeId ? (
        <YouTubePlayer ref={playerRef} videoId={youTubeId} />
      ) : (
        <a className="film-external-link" href={film.video_url} target="_blank" rel="noopener noreferrer">
          <ExternalLink size={16} /> Open video
        </a>
      )}

      {isCoach && (
        <AddTagControls
          isYouTube={Boolean(youTubeId)}
          getCurrentTime={() => playerRef.current?.getCurrentTime() ?? 0}
          onAddTag={({ seconds, tag }) => onAddTag({ filmId: film.id, seconds, tag })}
        />
      )}

      <TagFilterChips tags={tags} activeFilter={activeFilter} onChange={setActiveFilter} />

      <TagList tags={visibleTags} isCoach={isCoach} onSeek={handleSeek} onDelete={onDeleteTag} />
    </div>
  );
}
