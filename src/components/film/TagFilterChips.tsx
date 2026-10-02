"use client";

import { FilmTag, FilmTagType } from "@/types";

import { FILTER_TAG_TYPES, TAG_LABELS } from "./tagMeta";

export function TagFilterChips({
  tags,
  activeFilter,
  onChange
}: {
  tags: FilmTag[];
  activeFilter: FilmTagType | null;
  onChange: (tag: FilmTagType | null) => void;
}) {
  const counts = FILTER_TAG_TYPES.reduce<Record<FilmTagType, number>>((acc, tag) => {
    acc[tag] = tags.filter((t) => t.tag === tag).length;
    return acc;
  }, {} as Record<FilmTagType, number>);

  return (
    <div className="filter-row tag-filter-row">
      {FILTER_TAG_TYPES.map((tag) => {
        const count = counts[tag];
        const isActive = activeFilter === tag;
        return (
          <button
            key={tag}
            type="button"
            className={isActive ? "ghost tag-chip active" : "ghost tag-chip"}
            onClick={() => onChange(isActive ? null : tag)}
          >
            {TAG_LABELS[tag]} ({count})
          </button>
        );
      })}
    </div>
  );
}
