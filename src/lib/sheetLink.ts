/**
 * Google Sheets links for bringing in a plan (F-17). A sheet shared as
 * "Anyone with the link" can be read as CSV with no Google sign-in. Only
 * docs.google.com spreadsheet links with a well-formed id are accepted, and
 * the address that's fetched is built here from that id, never taken from
 * what was typed.
 */

/** Spreadsheet ids are long and URL-safe: letters, digits, "-" and "_". */
const SHEET_ID = /^[A-Za-z0-9_-]{20,100}$/;

/** The CSV export address for a Google Sheets link, or null if it isn't one. */
export function sheetCsvUrl(link: string): string | null {
  let url: URL;
  try {
    url = new URL(link.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.hostname !== "docs.google.com" || url.port !== "" || url.username !== "") {
    return null;
  }

  // /spreadsheets/d/<id>/edit, also with an account number: /spreadsheets/u/1/d/<id>/...
  const match = url.pathname.match(/^\/spreadsheets(?:\/u\/\d{1,2})?\/d\/([^/]+)(?:\/.*)?$/);
  if (!match || !SHEET_ID.test(match[1])) return null;

  // The tab the coach was looking at: "#gid=123" or "?gid=123".
  const gid = (url.hash.match(/gid=(\d{1,12})/) ?? url.search.match(/[?&]gid=(\d{1,12})/))?.[1];
  return `https://docs.google.com/spreadsheets/d/${match[1]}/gviz/tq?tqx=out:csv${gid ? `&gid=${gid}` : ""}`;
}

/** True when what the coach pasted is just a Google Sheets link. */
export function isSheetLink(text: string): boolean {
  const value = text.trim();
  return !/\s/.test(value) && sheetCsvUrl(value) != null;
}

/** Sheets are a few kilobytes as CSV; a cap keeps a wrong or huge link from tying up the server. */
export const MAX_SHEET_BYTES = 1024 * 1024;

/** How long to wait for Google before giving up. */
export const SHEET_TIMEOUT_MS = 8000;

/** The response body as text, or null once it passes `max` bytes. */
export async function readCapped(response: Response, max: number): Promise<string | null> {
  const declared = Number(response.headers.get("content-length"));
  if (declared > max) return null;
  if (!response.body) return "";

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}
