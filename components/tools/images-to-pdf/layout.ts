export type PageSize = "fit" | "a4" | "letter";
export type Orientation = "auto" | "portrait" | "landscape";

export interface LayoutOptions {
  pageSize: PageSize;
  orientation: Orientation;
  /** Margin in PDF points (1/72 inch). */
  margin: number;
}

const SIZES = { a4: [595.28, 841.89], letter: [612, 792] } as const;
/** Screen pixels are 1/96 inch; PDF points are 1/72 inch. */
const PX_TO_PT = 0.75;

export interface Placement {
  pageWidth: number;
  pageHeight: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Where to draw an image of `w`×`h` pixels on its page. Images are centered and never upscaled. */
export function placeImage(w: number, h: number, opts: LayoutOptions): Placement {
  const natW = w * PX_TO_PT;
  const natH = h * PX_TO_PT;
  const m = opts.margin;

  if (opts.pageSize === "fit") {
    return { pageWidth: natW + 2 * m, pageHeight: natH + 2 * m, x: m, y: m, width: natW, height: natH };
  }

  const [short, long] = SIZES[opts.pageSize];
  const landscape = opts.orientation === "landscape" || (opts.orientation === "auto" && w > h);
  const pageWidth = landscape ? long : short;
  const pageHeight = landscape ? short : long;

  const scale = Math.min(1, (pageWidth - 2 * m) / natW, (pageHeight - 2 * m) / natH);
  const width = natW * scale;
  const height = natH * scale;
  return { pageWidth, pageHeight, x: (pageWidth - width) / 2, y: (pageHeight - height) / 2, width, height };
}

/** Reads the EXIF orientation (1–8) from JPEG bytes; 1 if absent. */
export function jpegOrientation(bytes: Uint8Array): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return 1;
  let offset = 2;
  while (offset + 4 < view.byteLength) {
    const marker = view.getUint16(offset);
    const size = view.getUint16(offset + 2);
    if (marker === 0xffe1 && view.getUint32(offset + 4) === 0x45786966 /* "Exif" */) {
      const tiff = offset + 10;
      const little = view.getUint16(tiff) === 0x4949;
      const ifd = tiff + view.getUint32(tiff + 4, little);
      const entries = view.getUint16(ifd, little);
      for (let i = 0; i < entries; i++) {
        const entry = ifd + 2 + i * 12;
        if (entry + 10 > view.byteLength) return 1;
        if (view.getUint16(entry, little) === 0x0112) return view.getUint16(entry + 8, little);
      }
      return 1;
    }
    if ((marker & 0xff00) !== 0xff00 || marker === 0xffda) return 1; // start of image data
    offset += 2 + size;
  }
  return 1;
}

export function sniffImageType(bytes: Uint8Array): "jpeg" | "png" | "other" {
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  return "other";
}
