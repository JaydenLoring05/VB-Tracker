import { ImportedPlan, parseProgramText } from "@/lib/customProgram";
import { parseCsv, parseTabs, readProgramSheet } from "@/lib/sheetImport";

/**
 * Reads a plan file the coach picked, in the browser. The file is never
 * uploaded or stored: only what the coach keeps from the preview is saved.
 * The .xlsx and .docx readers load only when such a file is picked.
 */

/** Plans are a few kilobytes; anything far bigger is the wrong file. */
export const MAX_PLAN_FILE_BYTES = 5 * 1024 * 1024;

export const PLAN_FILE_TYPES = ".csv,.tsv,.txt,.xlsx,.docx";

export class PlanFileError extends Error {}

/**
 * A Google Sheets link the coach pasted, read through /api/import-sheet (the
 * sheet must be shared as "Anyone with the link"). The CSV comes back to the
 * browser and is read here like an uploaded file; nothing is stored.
 */
export async function readSheetLink(link: string): Promise<ImportedPlan> {
  let response: Response;
  try {
    response = await fetch("/api/import-sheet", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: link.trim() })
    });
  } catch {
    throw new PlanFileError("Couldn't reach NextRep. Check your connection and try again.");
  }
  const body = (await response.json().catch(() => null)) as { ok?: boolean; csv?: string; error?: string } | null;
  if (!response.ok || !body?.ok || typeof body.csv !== "string") {
    throw new PlanFileError(body?.error ?? "Couldn't read that sheet. Download it as .csv and upload the file.");
  }
  return readProgramSheet(parseCsv(body.csv));
}

/** Text a coach pasted: copied spreadsheet cells (tab-separated) or lines of exercises. */
export function readPastedPlan(text: string): ImportedPlan {
  return text.includes("\t") ? readProgramSheet(parseTabs(text)) : parseProgramText(text);
}

export async function readPlanFile(file: File): Promise<ImportedPlan> {
  if (file.size > MAX_PLAN_FILE_BYTES) {
    throw new PlanFileError("That file is too big to be a training plan. Pick the plan itself, under 5 MB.");
  }
  const extension = file.name.toLowerCase().split(".").pop() ?? "";

  switch (extension) {
    case "csv":
      return readProgramSheet(parseCsv(await file.text()));
    case "tsv":
      return readProgramSheet(parseTabs(await file.text()));
    case "txt":
      return readPastedPlan(await file.text());
    case "xlsx":
      return readXlsx(file);
    case "docx":
      return readDocx(file);
    default:
      throw new PlanFileError("Pick a .csv, .xlsx, .docx or .txt file, or paste the plan instead.");
  }
}

async function readXlsx(file: File): Promise<ImportedPlan> {
  const { default: readXlsxFile } = await import("read-excel-file/browser");
  const sheets = await readXlsxFile(file);
  // The first tab with exercises in it; other tabs are named so the coach knows.
  const read = sheets.map((sheet) => ({ name: sheet.sheet, plan: readProgramSheet(sheet.data as unknown[][]) }));
  const used = read.find((sheet) => sheet.plan.days.length > 0) ?? read[0];
  if (!used) throw new PlanFileError("That spreadsheet is empty.");
  const others = read.filter((sheet) => sheet !== used).map((sheet) => `"${sheet.name}"`);
  return others.length > 0
    ? { ...used.plan, leftOut: [...used.plan.leftOut, `Only the "${used.name}" tab was read. Not read: ${others.join(", ")}.`] }
    : used.plan;
}

async function readDocx(file: File): Promise<ImportedPlan> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
  const tables = [...new DOMParser().parseFromString(html, "text/html").querySelectorAll("table")];
  if (tables.length > 0) {
    // A plan laid out in tables reads like a sheet: every table's rows, one after another.
    const grid = tables.flatMap((table) => [
      ...[...table.querySelectorAll("tr")].map((row) =>
        [...row.querySelectorAll("td, th")].map((cell) => cell.textContent?.trim() ?? "")
      ),
      []
    ]);
    const plan = readProgramSheet(grid);
    if (plan.days.length > 0) return plan;
  }
  const { value: text } = await mammoth.extractRawText({ arrayBuffer });
  return parseProgramText(text);
}
