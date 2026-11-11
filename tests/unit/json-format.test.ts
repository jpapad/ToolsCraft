import { describe, expect, it } from "vitest";
import { formatJson } from "@/components/tools/json-formatter/format";

const opts = { mode: "format", indent: "2", sortKeys: false } as const;

describe("formatJson", () => {
  it("pretty-prints with the chosen indent", () => {
    expect(formatJson('{"a":1}', opts)).toEqual({ ok: true, value: '{\n  "a": 1\n}' });
    expect(formatJson('{"a":1}', { ...opts, indent: "tab" })).toEqual({ ok: true, value: '{\n\t"a": 1\n}' });
  });

  it("minifies", () => {
    expect(formatJson('{ "a" : [1, 2] }', { ...opts, mode: "minify" })).toEqual({ ok: true, value: '{"a":[1,2]}' });
  });

  it("sorts keys at every level", () => {
    const r = formatJson('{"b":{"d":1,"c":2},"a":0}', { ...opts, mode: "minify", sortKeys: true });
    expect(r).toEqual({ ok: true, value: '{"a":0,"b":{"c":2,"d":1}}' });
  });

  it("reports invalid JSON with a location", () => {
    const r = formatJson('{\n  "a": 1,\n}', opts);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/line 3/);
  });

  it("treats empty input as empty output", () => {
    expect(formatJson("   ", opts)).toEqual({ ok: true, value: "" });
  });
});
