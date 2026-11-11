export function formatBytes(bytes: number, decimals = 1): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** i;
  return `${value.toFixed(i === 0 ? 0 : decimals)} ${units[i]}`;
}

/** "photo.jpeg" + "webp" → "photo.webp" */
export function renameExt(name: string, ext: string): string {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  return `${base}.${ext.replace(/^\./, "")}`;
}

/** Returns a name not yet in `used` ("a.pdf", "a (1).pdf", …) and records it. */
export function uniqueName(name: string, used: Set<string>): string {
  let candidate = name;
  let n = 1;
  while (used.has(candidate)) {
    const dot = name.lastIndexOf(".");
    candidate = dot > 0 ? `${name.slice(0, dot)} (${n})${name.slice(dot)}` : `${name} (${n})`;
    n++;
  }
  used.add(candidate);
  return candidate;
}

/** Cleans a user-typed file name and makes sure it ends with `.ext`. */
export function safeFileName(name: string, ext: string, fallback: string): string {
  const clean = name.trim().replace(/[\\/:*?"<>|]+/g, "-") || fallback;
  return clean.toLowerCase().endsWith(`.${ext}`) ? clean : `${clean}.${ext}`;
}
