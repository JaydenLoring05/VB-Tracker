import { describe, expect, it } from "vitest";

import { isSheetLink, readCapped, sheetCsvUrl } from "@/lib/sheetLink";

const ID = "1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-abc";

describe("sheetCsvUrl", () => {
  it("builds the CSV address from a sheet link, keeping the tab", () => {
    expect(sheetCsvUrl(`https://docs.google.com/spreadsheets/d/${ID}/edit?usp=sharing`)).toBe(
      `https://docs.google.com/spreadsheets/d/${ID}/gviz/tq?tqx=out:csv`
    );
    expect(sheetCsvUrl(`https://docs.google.com/spreadsheets/d/${ID}/edit#gid=845123`)).toBe(
      `https://docs.google.com/spreadsheets/d/${ID}/gviz/tq?tqx=out:csv&gid=845123`
    );
    expect(sheetCsvUrl(`https://docs.google.com/spreadsheets/u/1/d/${ID}/edit?gid=7`)).toBe(
      `https://docs.google.com/spreadsheets/d/${ID}/gviz/tq?tqx=out:csv&gid=7`
    );
    expect(sheetCsvUrl(`  https://docs.google.com/spreadsheets/d/${ID}  `)).not.toBeNull();
  });

  it("accepts only docs.google.com spreadsheet links with a well-formed id", () => {
    for (const link of [
      `http://docs.google.com/spreadsheets/d/${ID}/edit`,
      `https://docs.google.com.evil.example/spreadsheets/d/${ID}`,
      `https://evil.example/spreadsheets/d/${ID}`,
      `https://docs.google.com:8443/spreadsheets/d/${ID}`,
      `https://user@docs.google.com/spreadsheets/d/${ID}`,
      `https://docs.google.com/document/d/${ID}/edit`,
      `https://docs.google.com/spreadsheets/d/short/edit`,
      `https://docs.google.com/spreadsheets/d/${ID}%2F..%2F..%2Fx/edit`,
      "not a link",
      ""
    ]) {
      expect(sheetCsvUrl(link), link).toBeNull();
    }
  });

  it("never passes anything but the id and a numeric tab through", () => {
    expect(sheetCsvUrl(`https://docs.google.com/spreadsheets/d/${ID}/edit#gid=1&x=https://evil.example`)).toBe(
      `https://docs.google.com/spreadsheets/d/${ID}/gviz/tq?tqx=out:csv&gid=1`
    );
  });
});

describe("isSheetLink", () => {
  it("is true only for a pasted link on its own", () => {
    expect(isSheetLink(`https://docs.google.com/spreadsheets/d/${ID}/edit`)).toBe(true);
    expect(isSheetLink(`Monday\nhttps://docs.google.com/spreadsheets/d/${ID}/edit`)).toBe(false);
    expect(isSheetLink("Monday\nBack squat 3x8")).toBe(false);
  });
});

describe("readCapped", () => {
  it("reads a body under the cap and stops one over it", async () => {
    expect(await readCapped(new Response("a,b\n1,2"), 100)).toBe("a,b\n1,2");
    expect(await readCapped(new Response("x".repeat(101)), 100)).toBeNull();
    expect(await readCapped(new Response("x", { headers: { "content-length": "5000" } }), 100)).toBeNull();
  });
});
