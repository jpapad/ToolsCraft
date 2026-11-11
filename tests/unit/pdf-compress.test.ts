import { PDFDocument, PDFName, PDFNumber, PDFRawStream, PDFRef } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { compressPdf, toRgba, unpredictPng, type ImageCodec } from "@/components/tools/pdf-compress/compress";

/** Fake codec: halves dimensions over the limit and "encodes" to a tiny fixed JPEG. */
const fakeCodec: ImageCodec = {
  decodeJpeg: async () => ({ data: new Uint8ClampedArray(4 * 4), width: 2, height: 2 }),
  downscale: async (px, max) =>
    Math.max(px.width, px.height) <= max ? px : { data: px.data, width: px.width / 2, height: px.height / 2 },
  encodeJpeg: async () => new Uint8Array([0xff, 0xd8, 0xff, 0xd9]),
};

/** Deterministic pseudo-random bytes (xorshift), so deflate can't shrink them much. */
function noise(length: number, seed = 1) {
  let x = seed;
  return new Uint8Array(length).map(() => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return x & 0xff;
  });
}

async function pdfWithImages() {
  const doc = await PDFDocument.create();
  doc.addPage([200, 200]);
  const w = 4000, h = 100;
  const raw = noise(w * h * 3);
  const image = doc.context.flateStream(raw, {
    Type: "XObject", Subtype: "Image", Width: w, Height: h, ColorSpace: "DeviceRGB", BitsPerComponent: 8,
  });
  const imageRef = doc.context.register(image);

  const mask = doc.context.flateStream(noise(w * h, 7), {
    Type: "XObject", Subtype: "Image", Width: w, Height: h, ColorSpace: "DeviceGray", BitsPerComponent: 8,
  });
  const maskRef = doc.context.register(mask);
  const withMask = doc.context.flateStream(raw, {
    Type: "XObject", Subtype: "Image", Width: w, Height: h, ColorSpace: "DeviceRGB", BitsPerComponent: 8, SMask: maskRef,
  });
  const withMaskRef = doc.context.register(withMask);
  return { bytes: await doc.save(), imageRef, maskRef, withMaskRef };
}

const streamAt = async (bytes: Uint8Array, ref: PDFRef) =>
  (await PDFDocument.load(bytes)).context.lookup(PDFRef.of(ref.objectNumber, ref.generationNumber)) as PDFRawStream;

describe("compressPdf", () => {
  it("re-encodes large images as JPEG, scales them down, and leaves soft masks alone", async () => {
    const { bytes, imageRef, maskRef, withMaskRef } = await pdfWithImages();
    const result = await compressPdf(bytes, "a.pdf", "recommended", fakeCodec);

    expect(result.unchanged).toBe(false);
    expect(result.recompressed).toBe(2);
    expect(result.bytes.length).toBeLessThan(bytes.length);

    const img = await streamAt(result.bytes, imageRef);
    expect(img.dict.get(PDFName.of("Filter"))?.toString()).toBe("/DCTDecode");
    expect((img.dict.get(PDFName.of("Width")) as PDFNumber).asNumber()).toBe(2000);
    expect((img.dict.get(PDFName.of("Length")) as PDFNumber).asNumber()).toBe(4);

    const mask = await streamAt(result.bytes, maskRef);
    expect(mask.dict.get(PDFName.of("Filter"))?.toString()).toBe("/FlateDecode");
    const masked = await streamAt(result.bytes, withMaskRef);
    expect(masked.dict.get(PDFName.of("SMask"))?.toString()).toBe(maskRef.toString());
  });

  it("returns the original when there is nothing to gain", async () => {
    const doc = await PDFDocument.create();
    doc.addPage();
    const bytes = await doc.save();
    const result = await compressPdf(bytes, "a.pdf", "strong", fakeCodec);
    expect(result).toMatchObject({ unchanged: true, images: 0 });
  });
});

describe("PNG predictor and color conversion", () => {
  it("reverses Sub and Up filters", () => {
    // Two 1-channel rows of 2 pixels: [filter, a, b] each
    const raw = new Uint8Array([1, 10, 5, 2, 1, 1]);
    expect([...unpredictPng(raw, 2, 1)]).toEqual([10, 15, 11, 16]);
  });

  it("expands gray and CMYK to RGBA", () => {
    expect([...toRgba(new Uint8Array([200]), 1, 1, 1).data]).toEqual([200, 200, 200, 255]);
    expect([...toRgba(new Uint8Array([0, 0, 0, 255]), 1, 1, 4).data]).toEqual([0, 0, 0, 255]);
    expect([...toRgba(new Uint8Array([0, 0, 0, 0]), 1, 1, 4).data]).toEqual([255, 255, 255, 255]);
  });
});
