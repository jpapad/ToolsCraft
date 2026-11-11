import { expose, transfer } from "comlink";
import createQpdf from "@neslinesli93/qpdf-wasm";
import { looksEncrypted } from "@/lib/engines/pdf/encryption";

export interface ProtectJob {
  mode: "protect" | "unlock";
  password: string;
  allowPrint: boolean;
  allowCopy: boolean;
}

interface QpdfRun {
  code: number;
  output?: Uint8Array;
}

/**
 * Runs the qpdf CLI once on a fresh WASM instance (qpdf's main() isn't re-entrant).
 * This build doesn't let us capture stderr, so callers rely on the exit code.
 */
async function qpdf(input: Uint8Array, args: (inPath: string, outPath: string) => string[]): Promise<QpdfRun> {
  // The package's typings omit Emscripten's standard options and FS.writeFile.
  const create = createQpdf as unknown as (opts: object) => Promise<{
    callMain: (args: string[]) => number;
    FS: { writeFile: (p: string, d: Uint8Array) => void; readFile: (p: string) => Uint8Array };
  }>;
  const mod = await create({
    locateFile: () => "/vendor/qpdf/qpdf.wasm",
  });
  mod.FS.writeFile("/in.pdf", input);
  let code: number;
  try {
    code = mod.callMain(args("/in.pdf", "/out.pdf"));
  } catch (e) {
    // Emscripten signals exit() by throwing an ExitStatus with a `status`.
    code = typeof (e as { status?: number })?.status === "number" ? (e as { status: number }).status : 2;
  }
  let output: Uint8Array | undefined;
  // 0 = success, 3 = success with warnings
  if (code === 0 || code === 3) {
    try {
      output = mod.FS.readFile("/out.pdf");
    } catch {
      output = undefined;
    }
  }
  return { code, output };
}

function randomPassword() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("");
}

const api = {
  async run(data: ArrayBuffer, job: ProtectJob): Promise<Uint8Array> {
    const input = new Uint8Array(data);
    const encrypted = looksEncrypted(input);
    let result: QpdfRun;

    if (job.mode === "protect") {
      if (!job.password) throw new Error("Enter a password.");
      if (encrypted) throw new Error("This PDF already has a password or restrictions. Unlock it first.");
      const restricted = !job.allowPrint || !job.allowCopy;
      // With restrictions, use a random owner password so they can't be lifted with the open password.
      const owner = restricted ? randomPassword() : job.password;
      result = await qpdf(input, (i, o) => [
        "--encrypt",
        job.password,
        owner,
        "256",
        ...(job.allowPrint ? [] : ["--print=none"]),
        ...(job.allowCopy ? [] : ["--extract=n"]),
        "--",
        i,
        o,
      ]);
      if (!result.output) throw new Error("This PDF couldn’t be encrypted. It may be damaged.");
    } else {
      if (!encrypted) throw new Error("This PDF isn’t password-protected, so there’s nothing to unlock.");
      result = job.password
        ? await qpdf(input, (i, o) => [`--password=${job.password}`, "--decrypt", i, o])
        : { code: 2 };
      // PDFs that open without a password but block printing/copying unlock with no password.
      if (!result.output) result = await qpdf(input, (i, o) => ["--decrypt", i, o]);
      if (!result.output) {
        throw new Error(job.password ? "Wrong password. Please check it and try again." : "This PDF needs its password to open. Enter it above.");
      }
    }

    return transfer(result.output, [result.output.buffer as ArrayBuffer]);
  },
};

export type PdfProtectWorker = typeof api;
expose(api);
