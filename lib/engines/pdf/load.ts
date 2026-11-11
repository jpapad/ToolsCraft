import { EncryptedPDFError, PDFDocument } from "pdf-lib";
import { looksEncrypted } from "./encryption";

/**
 * Loads a PDF with pdf-lib and turns its errors into messages people understand.
 * pdf-lib can't read encrypted files, and with modern AES encryption it often
 * fails with a generic parse error instead of EncryptedPDFError.
 */
export async function loadPdf(data: ArrayBuffer | Uint8Array, name: string): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(data, { updateMetadata: false });
  } catch (e) {
    if (e instanceof EncryptedPDFError || looksEncrypted(data)) {
      throw new Error(`“${name}” is password-protected. Unlock it first with the Unlock PDF tool.`);
    }
    throw new Error(`“${name}” is not a valid PDF or is damaged.`);
  }
}
