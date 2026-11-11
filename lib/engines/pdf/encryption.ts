const WINDOW = 65_536;

/**
 * True if the PDF declares encryption (an /Encrypt entry in a trailer).
 * Checks the start and end of the file: linearized PDFs keep a trailer near the
 * start, everything else at the end. Works with plain and cross-reference-stream trailers.
 */
export function looksEncrypted(data: ArrayBuffer | Uint8Array): boolean {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const latin1 = new TextDecoder("latin1");
  const head = latin1.decode(bytes.subarray(0, WINDOW));
  const tail = latin1.decode(bytes.subarray(Math.max(0, bytes.length - WINDOW)));
  return head.includes("/Encrypt") || tail.includes("/Encrypt");
}
