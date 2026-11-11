/** Quick syntax check, usable before the page count is known. */
export function isValidRangeSyntax(input: string): boolean {
  return /^\s*\d*\s*-?\s*\d*\s*(,\s*\d*\s*-?\s*\d*\s*)*$/.test(input) && /\d/.test(input);
}

/**
 * Parses "1-3, 5, 8-" into groups of 0-based page indexes.
 * "8-" means "page 8 to the end", "-3" means "pages 1 to 3".
 */
export function parseRanges(input: string, pageCount: number): number[][] {
  const groups: number[][] = [];
  for (const raw of input.split(",")) {
    const part = raw.trim();
    if (!part) continue;
    const m = /^(\d*)\s*(-)?\s*(\d*)$/.exec(part);
    if (!m || (!m[1] && !m[3])) throw new Error(`“${part}” is not a valid page range.`);
    const start = m[1] ? Number(m[1]) : 1;
    const end = m[2] ? (m[3] ? Number(m[3]) : pageCount) : start;
    if (start < 1 || end < 1) throw new Error("Page numbers start at 1.");
    if (start > pageCount || end > pageCount) {
      throw new Error(`“${part}” is outside the document, which has ${pageCount} page${pageCount === 1 ? "" : "s"}.`);
    }
    if (start > end) throw new Error(`“${part}” goes backwards. Write it as ${end}-${start}.`);
    groups.push(Array.from({ length: end - start + 1 }, (_, i) => start - 1 + i));
  }
  if (!groups.length) throw new Error("Enter at least one page or range, e.g. 1-3, 5.");
  return groups;
}
