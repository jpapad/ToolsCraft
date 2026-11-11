import { describe, expect, it } from "vitest";
import { reducer, type ProcessorState } from "@/lib/hooks/use-file-processor";
import { uniqueName } from "@/lib/utils/files";

const file = (name: string) => new File(["x"], name);
const idle: ProcessorState = { phase: "idle", items: [], outputs: [] };

describe("file processor state machine", () => {
  it("goes idle → ready → processing → done", () => {
    let s = reducer(idle, { type: "ADD", files: [file("a"), file("b")] });
    expect(s.phase).toBe("ready");
    s = reducer(s, { type: "START" });
    expect(s.phase).toBe("processing");
    const ids = s.items.map((i) => i.id);
    s = reducer(s, { type: "ITEM_DONE", ids, outputs: [] });
    s = reducer(s, { type: "FINISH", outputs: [{ name: "out", blob: new Blob() }] });
    expect(s.phase).toBe("done");
    expect(s.outputs).toHaveLength(1);
  });

  it("ignores edits while processing", () => {
    let s = reducer(idle, { type: "ADD", files: [file("a")] });
    s = reducer(s, { type: "START" });
    expect(reducer(s, { type: "ADD", files: [file("b")] })).toBe(s);
    expect(reducer(s, { type: "REMOVE", id: s.items[0].id })).toBe(s);
  });

  it("ends in error only if every file failed", () => {
    let s = reducer(idle, { type: "ADD", files: [file("a"), file("b")] });
    s = reducer(s, { type: "START" });
    s = reducer(s, { type: "ITEM_ERROR", id: s.items[0].id, error: "bad" });
    expect(reducer(s, { type: "FINISH", outputs: [] }).phase).toBe("done");
    s = reducer(s, { type: "ITEM_ERROR", id: s.items[1].id, error: "bad" });
    expect(reducer(s, { type: "FINISH", outputs: [] }).phase).toBe("error");
  });

  it("cancel returns to ready with items re-queued", () => {
    let s = reducer(idle, { type: "ADD", files: [file("a")] });
    s = reducer(s, { type: "START" });
    s = reducer(s, { type: "PROGRESS", ids: [s.items[0].id], progress: 50 });
    s = reducer(s, { type: "CANCEL" });
    expect(s.phase).toBe("ready");
    expect(s.items[0]).toMatchObject({ status: "queued", progress: 0 });
  });

  it("reorders and removes", () => {
    let s = reducer(idle, { type: "ADD", files: [file("a"), file("b")] });
    const [a, b] = s.items.map((i) => i.id);
    s = reducer(s, { type: "REORDER", ids: [b, a] });
    expect(s.items.map((i) => i.file.name)).toEqual(["b", "a"]);
    s = reducer(s, { type: "REMOVE", id: a });
    s = reducer(s, { type: "REMOVE", id: b });
    expect(s.phase).toBe("idle");
  });
});

describe("uniqueName", () => {
  it("adds a counter for duplicates", () => {
    const used = new Set<string>();
    expect(["a.pdf", "a.pdf", "a.pdf"].map((n) => uniqueName(n, used))).toEqual(["a.pdf", "a (1).pdf", "a (2).pdf"]);
  });
});
