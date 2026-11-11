const CHUNK = 0x8000;

export function bytesToBase64(bytes: Uint8Array, urlSafe = false): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  const b64 = btoa(binary);
  return urlSafe ? b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") : b64;
}

/**
 * Lenient decode: ignores whitespace and a leading data: URI prefix,
 * and accepts both standard and URL-safe alphabets, with or without padding.
 */
export function base64ToBytes(input: string): { bytes: Uint8Array; mime?: string } {
  let s = input.trim();
  let mime: string | undefined;
  const dataUri = /^data:([^;,]*)(;[^,]*)?,/.exec(s);
  if (dataUri) {
    mime = dataUri[1] || undefined;
    s = s.slice(dataUri[0].length);
  }
  s = s.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(s) || s.length % 4 === 1) {
    throw new Error("This isn’t valid Base64. Only A–Z, a–z, 0–9, +, / (or - and _) and = padding are allowed.");
  }
  s = s.padEnd(Math.ceil(s.length / 4) * 4, "=");
  const binary = atob(s);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { bytes, mime };
}

export function encodeText(text: string, urlSafe = false): string {
  return bytesToBase64(new TextEncoder().encode(text), urlSafe);
}

export class BinaryDataError extends Error {
  constructor(readonly bytes: Uint8Array, readonly mime?: string) {
    super("This decodes to binary data (like an image or file), not text. Download it as a file instead.");
  }
}

/** Decodes to UTF-8 text; throws BinaryDataError if the result isn't text. */
export function decodeText(input: string): string {
  const { bytes, mime } = base64ToBytes(input);
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    // Control characters other than tab/newline usually mean binary content.
    if (/[\u0000-\u0008\u000E-\u001F]/.test(text)) throw new Error("binary");
    return text;
  } catch {
    throw new BinaryDataError(bytes, mime);
  }
}

/** Guesses a file type from its first bytes, for downloading decoded data. */
export function sniffMime(bytes: Uint8Array): { mime: string; ext: string } {
  const hex = Array.from(bytes.subarray(0, 12), (b) => b.toString(16).padStart(2, "0")).join("");
  if (hex.startsWith("89504e47")) return { mime: "image/png", ext: "png" };
  if (hex.startsWith("ffd8ff")) return { mime: "image/jpeg", ext: "jpg" };
  if (hex.startsWith("47494638")) return { mime: "image/gif", ext: "gif" };
  if (hex.startsWith("52494646") && hex.slice(16, 24) === "57454250") return { mime: "image/webp", ext: "webp" };
  if (hex.startsWith("25504446")) return { mime: "application/pdf", ext: "pdf" };
  if (hex.startsWith("504b0304")) return { mime: "application/zip", ext: "zip" };
  return { mime: "application/octet-stream", ext: "bin" };
}
