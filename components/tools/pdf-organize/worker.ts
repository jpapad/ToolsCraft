import { expose, transfer } from "comlink";
import { organizePdf, type PageEdit } from "./organize";

const api = {
  async organize(data: ArrayBuffer, name: string, edits: PageEdit[]) {
    const bytes = await organizePdf(data, name, edits);
    return transfer(bytes, [bytes.buffer as ArrayBuffer]);
  },
};

export type PdfOrganizeWorker = typeof api;
expose(api);
