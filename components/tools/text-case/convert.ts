import {
  camelCase,
  constantCase,
  dotCase,
  kebabCase,
  pascalCase,
  pathCase,
  snakeCase,
  trainCase,
} from "change-case";

export interface CaseDef {
  id: string;
  label: string;
  convert: (text: string) => string;
}

/** Applies `fn` to each line separately, so multi-line lists keep their lines. */
const perLine = (fn: (s: string) => string) => (text: string) =>
  text
    .split("\n")
    .map((line) => (line.trim() ? fn(line) : line))
    .join("\n");

const titleCase = (s: string) => s.toLowerCase().replace(/(^|[\s\-‐([{"'“‘])(\p{L})/gu, (_, sep, ch) => sep + ch.toUpperCase());

const sentenceCase = (s: string) =>
  s.toLowerCase().replace(/(^\s*|[.!?]\s+)(\p{L})/gu, (_, sep, ch) => sep + ch.toUpperCase());

const alternating = (s: string) => {
  let i = 0;
  return [...s].map((ch) => (/\p{L}/u.test(ch) ? (i++ % 2 ? ch.toUpperCase() : ch.toLowerCase()) : ch)).join("");
};

const inverse = (s: string) =>
  [...s].map((ch) => (ch === ch.toUpperCase() ? ch.toLowerCase() : ch.toUpperCase())).join("");

export const cases: CaseDef[] = [
  { id: "upper", label: "UPPERCASE", convert: (s) => s.toUpperCase() },
  { id: "lower", label: "lowercase", convert: (s) => s.toLowerCase() },
  { id: "title", label: "Title Case", convert: titleCase },
  { id: "sentence", label: "Sentence case", convert: sentenceCase },
  { id: "camel", label: "camelCase", convert: perLine(camelCase) },
  { id: "pascal", label: "PascalCase", convert: perLine(pascalCase) },
  { id: "snake", label: "snake_case", convert: perLine(snakeCase) },
  { id: "constant", label: "CONSTANT_CASE", convert: perLine(constantCase) },
  { id: "kebab", label: "kebab-case", convert: perLine(kebabCase) },
  { id: "train", label: "Train-Case", convert: perLine(trainCase) },
  { id: "dot", label: "dot.case", convert: perLine(dotCase) },
  { id: "path", label: "path/case", convert: perLine(pathCase) },
  { id: "alternating", label: "aLtErNaTiNg", convert: alternating },
  { id: "inverse", label: "InVeRsE", convert: inverse },
];

export function textStats(text: string) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return { characters: [...text].length, words, lines: text ? text.split("\n").length : 0 };
}
