// Copies runtime assets that must be served as plain files (WASM, fonts) into public/vendor.
// Runs automatically before dev/build and after install.
import { cpSync, mkdirSync, rmSync } from "node:fs";

const out = "public/vendor";
rmSync(out, { recursive: true, force: true });
mkdirSync(`${out}/qpdf`, { recursive: true });

cpSync("node_modules/@neslinesli93/qpdf-wasm/dist/qpdf.wasm", `${out}/qpdf/qpdf.wasm`);
for (const dir of ["standard_fonts", "cmaps", "wasm", "iccs"]) {
  cpSync(`node_modules/pdfjs-dist/${dir}`, `${out}/pdfjs/${dir}`, { recursive: true });
}
console.log("vendor assets copied to", out);
