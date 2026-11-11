import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { organizePdf } from "@/components/tools/pdf-organize/organize";
import { placeWatermark } from "@/components/tools/pdf-watermark/placement";
import { resizeTarget } from "@/lib/engines/image/codec";
import { looksEncrypted } from "@/lib/engines/pdf/encryption";

const center = (p: { x: number; y: number; width: number; height: number; rotate: number }) => {
  const r = (p.rotate * Math.PI) / 180;
  return {
    x: p.x + (p.width / 2) * Math.cos(r) - (p.height / 2) * Math.sin(r),
    y: p.y + (p.width / 2) * Math.sin(r) + (p.height / 2) * Math.cos(r),
  };
};

describe("watermark placement", () => {
  const page = { x: 0, y: 0, width: 600, height: 800, rotation: 0 };
  const mark = { aspect: 0.25, widthRatio: 0.5, angle: 45, layout: "center" as const };

  it("centers a rotated watermark on the page", () => {
    const [p] = placeWatermark(page, mark);
    expect(p.width).toBe(300);
    expect(p.height).toBe(75);
    const c = center(p);
    expect(c.x).toBeCloseTo(300);
    expect(c.y).toBeCloseTo(400);
  });

  it("respects crop box offsets and compensates for page rotation", () => {
    const [p] = placeWatermark({ x: 50, y: 20, width: 600, height: 800, rotation: 90 }, { ...mark, angle: 0 });
    expect(p.rotate).toBe(90);
    expect(p.width).toBe(400); // half of the *visible* width (the page's height when rotated)
    const c = center(p);
    expect(c.x).toBeCloseTo(350);
    expect(c.y).toBeCloseTo(420);
  });

  it("tiles many copies", () => {
    expect(placeWatermark(page, { ...mark, widthRatio: 0.2, layout: "tile" }).length).toBeGreaterThan(6);
  });
});

describe("resizeTarget", () => {
  it("scales by percent", () => expect(resizeTarget(1000, 500, { mode: "percent", percent: 50 })).toEqual({ width: 500, height: 250 }));
  it("derives the missing side", () => {
    expect(resizeTarget(1000, 500, { mode: "pixels", width: 200, keepAspect: true })).toEqual({ width: 200, height: 100 });
    expect(resizeTarget(1000, 500, { mode: "pixels", height: 50, keepAspect: true })).toEqual({ width: 100, height: 50 });
  });
  it("fits inside a box, or stretches when asked", () => {
    expect(resizeTarget(1000, 500, { mode: "pixels", width: 300, height: 300, keepAspect: true })).toEqual({ width: 300, height: 150 });
    expect(resizeTarget(1000, 500, { mode: "pixels", width: 300, height: 300, keepAspect: false })).toEqual({ width: 300, height: 300 });
  });
  it("can upscale but stays within browser canvas limits", () => {
    expect(resizeTarget(100, 100, { mode: "percent", percent: 300 })).toEqual({ width: 300, height: 300 });
    expect(resizeTarget(10_000, 10, { mode: "percent", percent: 300 }).width).toBe(16_384);
  });
});

describe("organizePdf", () => {
  it("reorders, drops and rotates pages", async () => {
    const doc = await PDFDocument.create();
    for (const w of [100, 200, 300]) doc.addPage([w, 400]);
    const out = await PDFDocument.load(
      await organizePdf(await doc.save(), "a.pdf", [
        { index: 2, rotation: 90 },
        { index: 0, rotation: 270 },
      ]),
    );
    expect(out.getPages().map((p) => [p.getWidth(), p.getRotation().angle])).toEqual([
      [300, 90],
      [100, 270],
    ]);
  });

  it("refuses to produce an empty PDF", async () => {
    const doc = await PDFDocument.create();
    doc.addPage();
    await expect(organizePdf(await doc.save(), "a.pdf", [])).rejects.toThrow(/at least one/);
  });
});

describe("encrypted PDF detection", () => {
  it("spots /Encrypt in the trailer", async () => {
    const fake = new TextEncoder().encode("%PDF-1.7\n...\ntrailer << /Size 5 /Encrypt 4 0 R >>\n%%EOF");
    expect(looksEncrypted(fake)).toBe(true);

    const doc = await PDFDocument.create();
    doc.addPage();
    expect(looksEncrypted(await doc.save())).toBe(false);
  });
});
