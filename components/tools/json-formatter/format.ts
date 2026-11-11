import type { TextResult } from "@/components/shared/text-tool-shell";

export type JsonMode = "format" | "minify";
export type JsonIndent = "2" | "4" | "tab";

export interface JsonOptions {
  mode: JsonMode;
  indent: JsonIndent;
  sortKeys: boolean;
}

function sortDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort((a, b) => a.localeCompare(b))
        .map((k) => [k, sortDeep((value as Record<string, unknown>)[k])]),
    );
  }
  return value;
}

/** Turns a character offset into "line X, column Y" for friendlier errors. */
function locate(input: string, message: string): string {
  const pos = /position (\d+)/.exec(message);
  if (!pos || /line \d+/.test(message)) return message;
  const before = input.slice(0, Number(pos[1]));
  const line = before.split("\n").length;
  const column = before.length - before.lastIndexOf("\n");
  return `${message} (line ${line}, column ${column})`;
}

export function formatJson(input: string, opts: JsonOptions): TextResult {
  if (!input.trim()) return { ok: true, value: "" };
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch (e) {
    return { ok: false, error: locate(input, e instanceof Error ? e.message : "Invalid JSON") };
  }
  if (opts.sortKeys) parsed = sortDeep(parsed);
  const space = opts.mode === "minify" ? undefined : opts.indent === "tab" ? "\t" : Number(opts.indent);
  return { ok: true, value: JSON.stringify(parsed, null, space) };
}
