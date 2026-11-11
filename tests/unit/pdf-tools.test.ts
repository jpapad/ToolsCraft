import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { isValidRangeSyntax, parseRanges, splitPdf } from "@/components/tools/pdf-split/split";
import { jpegOrientation, placeImage, sniffImageType } from "@/components/tools/images-to-pdf/layout";

async function makePdf(widths: number[]) {
  const doc = await PDFDocument.create();
  for (const w of widths) doc.addPage([w, 300]);
  return doc.save();
}

describe("parseRanges", () => {
  it("parses single pages, ranges and open ends", () => {
    expect(parseRanges("1-3, 5, 8-", 9)).toEqual([[0, 1, 2], [4], [7, 8]]);
    expect(parseRanges("-2", 5)).toEqual([[0, 1]]);
  });

  it("explains bad input", () => {
    expect(() => parseRanges("4", 3)).toThrow(/3 pages/);
    expect(() => parseRanges("5-2", 9)).toThrow(/backwards/);
    expect(() => parseRanges("0", 9)).toThrow(/start at 1/);
    expect(() => parseRanges(" , ", 9)).toThrow(/at least one/);
  });

  it("checks syntax before the page count is known", () => {
    expect(isValidRangeSyntax("1-3, 5, 8-")).toBe(true);
    expect(isValidRangeSyntax("abc")).toBe(false);
    expect(isValidRangeSyntax("")).toBe(false);
  });
});

describe("splitPdf", () => {
  const widths = [101, 102, 103, 104];
  const pagesOf = async (bytes: Uint8Array) => (await PDFDocument.load(bytes)).getPages().map((p) => p.getWidth());

  it("splits every page", async () => {
    const out = await splitPdf(await makePdf(widths), "doc.pdf", { mode: "all", ranges: "" });
    expect(out.map((o) => o.name)).toEqual(["doc-page-1.pdf", "doc-page-2.pdf", "doc-page-3.pdf", "doc-page-4.pdf"]);
    expect(await pagesOf(out[2].bytes)).toEqual([103]);
  });

  it("splits by ranges", async () => {
    const out = await splitPdf(await makePdf(widths), "doc.pdf", { mode: "ranges", ranges: "1-2, 4" });
    expect(out.map((o) => o.name)).toEqual(["doc-pages-1-2.pdf", "doc-page-4.pdf"]);
    expect(await pagesOf(out[0].bytes)).toEqual([101, 102]);
  });

  it("extracts selected pages into one file, without duplicates", async () => {
    const out = await splitPdf(await makePdf(widths), "doc.pdf", { mode: "extract", ranges: "4, 1-2, 2" });
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe("doc-extracted.pdf");
    expect(await pagesOf(out[0].bytes)).toEqual([104, 101, 102]);
  });
});

describe("images to PDF layout", () => {
  it("uses the image size (px → pt) plus margins for 'fit'", () => {
    expect(placeImage(800, 600, { pageSize: "fit", orientation: "auto", margin: 10 })).toEqual({
      pageWidth: 620, pageHeight: 470, x: 10, y: 10, width: 600, height: 450,
    });
  });

  it("picks landscape A4 for wide images and fits inside margins", () => {
    const p = placeImage(4000, 2000, { pageSize: "a4", orientation: "auto", margin: 20 });
    expect(p.pageWidth).toBeCloseTo(841.89);
    expect(p.width).toBeCloseTo(841.89 - 40);
    expect(p.x).toBeCloseTo(20);
  });

  it("never upscales small images and centers them", () => {
    const p = placeImage(100, 100, { pageSize: "letter", orientation: "portrait", margin: 0 });
    expect(p.width).toBe(75);
    expect(p.x).toBeCloseTo((612 - 75) / 2);
  });

  it("reads EXIF orientation from JPEG bytes", () => {
    // SOI, APP1 "Exif\0\0", TIFF big-endian header, 1 IFD entry: Orientation = 6
    const jpeg = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe1, 0x00, 0x22, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00,
      0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08,
      0x00, 0x01, 0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01, 0x00, 0x06, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
    ]);
    expect(jpegOrientation(jpeg)).toBe(6);
    expect(jpegOrientation(new Uint8Array([0xff, 0xd8, 0xff, 0xda, 0, 2]))).toBe(1);
    expect(sniffImageType(jpeg)).toBe("jpeg");
  });
});
