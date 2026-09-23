import { FilmTagType } from "@/types";

export const TAG_TYPES: FilmTagType[] = ["kill", "ace", "block", "dig", "set", "error", "serve_error", "note"];

export const TAG_LABELS: Record<FilmTagType, string> = {
  kill: "Kill",
  error: "Error",
  block: "Block",
  dig: "Dig",
  ace: "Ace",
  serve_error: "Serve Error",
  set: "Set",
  note: "Note"
};
