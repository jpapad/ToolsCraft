import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { mergePdfs } from "@/components/tools/pdf-merge/merge";

async function makePdf(pages: number, width = 200) {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage([width, 300]);
  return doc.save();
}

describe("mergePdfs", () => {
  it("merges pages in the given order", async () => {
    const a = await makePdf(2, 100);
    const b = await makePdf(3, 200);
    const progress: number[] = [];

    const out = await PDFDocument.load(
      await mergePdfs(
        [
          { name: "b.pdf", data: b },
          { name: "a.pdf", data: a },
        ],
        (p) => progress.push(p),
      ),
    );

    expect(out.getPageCount()).toBe(5);
    expect(out.getPages().map((p) => p.getWidth())).toEqual([200, 200, 200, 100, 100]);
    expect(progress.at(-1)).toBe(100);
  });

  it("names the broken file in the error", async () => {
    const a = await makePdf(1);
    await expect(
      mergePdfs([
        { name: "good.pdf", data: a },
        { name: "broken.pdf", data: new TextEncoder().encode("not a pdf") },
      ]),
    ).rejects.toThrow(/broken\.pdf/);
  });

  it("requires at least two files", async () => {
    await expect(mergePdfs([{ name: "a.pdf", data: await makePdf(1) }])).rejects.toThrow(/two/);
  });
});
