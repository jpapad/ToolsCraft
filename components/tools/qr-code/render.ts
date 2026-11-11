import { create, type QRCodeErrorCorrectionLevel } from "qrcode";

export interface QrStyle {
  ecl: QRCodeErrorCorrectionLevel;
  dark: string;
  light: string;
  /** Quiet zone in modules (4 is the standard). */
  margin: number;
}

export interface QrMatrix {
  size: number;
  isDark: (row: number, col: number) => boolean;
}

/** Throws if the content is too long for a QR code at this error-correction level. */
export function buildMatrix(text: string, ecl: QRCodeErrorCorrectionLevel): QrMatrix {
  const { modules } = create(text, { errorCorrectionLevel: ecl });
  return { size: modules.size, isDark: (r, c) => modules.get(r, c) === 1 };
}

/** Crisp, scalable SVG: one path, one unit per module. */
export function toSvg(m: QrMatrix, { dark, light, margin }: Omit<QrStyle, "ecl">): string {
  const total = m.size + margin * 2;
  let d = "";
  for (let r = 0; r < m.size; r++) {
    for (let c = 0; c < m.size; c++) {
      if (m.isDark(r, c)) d += `M${c + margin} ${r + margin}h1v1h-1z`;
    }
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges">` +
    `<rect width="100%" height="100%" fill="${light}"/><path fill="${dark}" d="${d}"/></svg>`
  );
}

/** Draws the code on a canvas of exactly `px` × `px` and returns a PNG. */
export async function toPng(m: QrMatrix, { dark, light, margin }: Omit<QrStyle, "ecl">, px: number): Promise<Blob> {
  const total = m.size + margin * 2;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = px;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, px, px);
  ctx.fillStyle = dark;
  const unit = px / total;
  for (let r = 0; r < m.size; r++) {
    for (let c = 0; c < m.size; c++) {
      if (!m.isDark(r, c)) continue;
      // Round edges to whole pixels so neighbouring modules don't leave hairline gaps.
      const x = Math.round((c + margin) * unit);
      const y = Math.round((r + margin) * unit);
      ctx.fillRect(x, y, Math.round((c + margin + 1) * unit) - x, Math.round((r + margin + 1) * unit) - y);
    }
  }
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG export failed"))), "image/png"),
  );
}
