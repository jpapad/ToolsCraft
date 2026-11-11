export interface PageBox {
  x: number;
  y: number;
  width: number;
  height: number;
  /** The page's /Rotate value (clockwise degrees: 0, 90, 180, 270). */
  rotation: number;
}

export interface MarkLayout {
  /** Watermark height ÷ width. */
  aspect: number;
  /** Watermark width as a fraction of the page's visible width (0–1). */
  widthRatio: number;
  /** Angle as the reader sees it, counter-clockwise degrees (45 = diagonal up). */
  angle: number;
  layout: "center" | "tile";
}

export interface Placement {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Counter-clockwise rotation (degrees) around (x, y), as pdf-lib expects. */
  rotate: number;
}

/** Bottom-left corner that puts a rotated w×h box's center at (cx, cy). */
function cornerFor(cx: number, cy: number, w: number, h: number, deg: number) {
  const r = (deg * Math.PI) / 180;
  return {
    x: cx - ((w / 2) * Math.cos(r) - (h / 2) * Math.sin(r)),
    y: cy - ((w / 2) * Math.sin(r) + (h / 2) * Math.cos(r)),
  };
}

export function placeWatermark(page: PageBox, mark: MarkLayout): Placement[] {
  const rotated = page.rotation % 180 !== 0;
  const visibleWidth = rotated ? page.height : page.width;
  const width = visibleWidth * mark.widthRatio;
  const height = width * mark.aspect;
  // The page itself is turned clockwise by its /Rotate, so draw at angle + rotation
  // to make the watermark look the way the reader chose.
  const rotate = (mark.angle + page.rotation) % 360;

  const centers: [number, number][] = [];
  if (mark.layout === "center") {
    centers.push([page.x + page.width / 2, page.y + page.height / 2]);
  } else {
    const step = Math.max(width, height) * 1.35 + 24;
    let row = 0;
    for (let cy = page.y + step / 2; cy < page.y + page.height + step / 2; cy += step * 0.8, row++) {
      const offset = row % 2 ? step / 2 : 0;
      for (let cx = page.x + offset; cx < page.x + page.width + step / 2; cx += step) centers.push([cx, cy]);
    }
  }

  return centers.map(([cx, cy]) => ({ ...cornerFor(cx, cy, width, height, rotate), width, height, rotate }));
}
