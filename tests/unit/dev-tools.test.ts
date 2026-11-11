import { describe, expect, it } from "vitest";
import { BinaryDataError, base64ToBytes, decodeText, encodeText, sniffMime } from "@/components/tools/base64/base64";
import { wifiPayload } from "@/components/tools/qr-code/payload";
import { buildMatrix, toSvg } from "@/components/tools/qr-code/render";
import { cases, textStats } from "@/components/tools/text-case/convert";

describe("base64", () => {
  it("round-trips UTF-8 text including Greek and emoji", () => {
    const text = "Καλημέρα 👋";
    expect(decodeText(encodeText(text))).toBe(text);
  });

  it("produces URL-safe output without padding", () => {
    expect(encodeText("??>", false)).toBe("Pz8+");
    expect(encodeText("??>>", true)).toBe("Pz8-Pg");
  });

  it("decodes leniently: whitespace, data URIs, URL-safe, missing padding", () => {
    expect(decodeText("SGVs\nbG8=")).toBe("Hello");
    expect(decodeText("Pz8-Pg")).toBe("??>>");
    expect(base64ToBytes("data:text/plain;base64,SGk=").mime).toBe("text/plain");
  });

  it("rejects invalid input and flags binary data", () => {
    expect(() => decodeText("abc$")).toThrow(/valid Base64/);
    const png = "iVBORw0KGgo="; // PNG signature
    expect(() => decodeText(png)).toThrow(BinaryDataError);
    expect(sniffMime(base64ToBytes(png).bytes).ext).toBe("png");
  });
});

describe("QR code", () => {
  it("builds Wi-Fi payloads with escaping", () => {
    expect(wifiPayload({ ssid: "Home;Net", password: 'p"w', security: "WPA", hidden: false })).toBe(
      'WIFI:T:WPA;S:Home\\;Net;P:p\\"w;;',
    );
    expect(wifiPayload({ ssid: "Cafe", password: "x", security: "nopass", hidden: true })).toBe(
      "WIFI:T:nopass;S:Cafe;H:true;;",
    );
  });

  it("renders an SVG sized to modules + margin", () => {
    const m = buildMatrix("https://example.com", "M");
    expect(m.size).toBe(25); // version 2
    expect(toSvg(m, { dark: "#000000", light: "#ffffff", margin: 4 })).toContain('viewBox="0 0 33 33"');
  });

  it("throws when content is too long", () => {
    expect(() => buildMatrix("x".repeat(5000), "H")).toThrow();
  });
});

describe("text case", () => {
  const conv = (id: string, s: string) => cases.find((c) => c.id === id)!.convert(s);

  it("converts code cases line by line", () => {
    expect(conv("camel", "user profile\nfirst name")).toBe("userProfile\nfirstName");
    expect(conv("constant", "max retry count")).toBe("MAX_RETRY_COUNT");
    expect(conv("kebab", "Hello World")).toBe("hello-world");
  });

  it("handles prose cases with any alphabet", () => {
    expect(conv("title", "καλή ΜΕΡΑ κόσμε")).toBe("Καλή Μερα Κόσμε");
    expect(conv("sentence", "hello there. how ARE you? fine")).toBe("Hello there. How are you? Fine");
  });

  it("counts characters, words and lines", () => {
    expect(textStats("a b\nc 👋")).toEqual({ characters: 7, words: 4, lines: 2 });
    expect(textStats("")).toEqual({ characters: 0, words: 0, lines: 0 });
  });
});
