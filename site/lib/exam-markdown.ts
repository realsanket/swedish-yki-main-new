/**
 * A small, dependency-free Markdown parser for the exam course documents.
 * It supports exactly what the course files use: headings, paragraphs (soft line
 * breaks kept), nested lists, tables, quotes, rules, fenced code, and inline
 * **bold**, *italic*, ~~strikethrough~~, `code` and [links](url). It returns a
 * tree; the UI renders React nodes from it, so Markdown is never turned into HTML.
 */

export type Inline =
  | { t: "text"; v: string }
  | { t: "strong" | "em" | "del"; c: Inline[] }
  | { t: "code"; v: string }
  | { t: "link"; href: string; c: Inline[] }
  | { t: "br" };

export type ListItem = { c: Inline[]; children: Block[] };
export type Block =
  | { t: "heading"; level: number; c: Inline[] }
  | { t: "para"; c: Inline[] }
  | { t: "list"; ordered: boolean; items: ListItem[] }
  | { t: "table"; head: Inline[][]; rows: Inline[][][] }
  | { t: "quote"; blocks: Block[] }
  | { t: "code"; v: string }
  | { t: "hr" };

/* --------------------------------- inline --------------------------------- */

/** Index of the single `*` that closes an italic opened at `start`, skipping **bold** pairs. */
function italicEnd(s: string, start: number): number {
  let i = start + 1;
  while (i < s.length) {
    if (s.startsWith("**", i)) {
      const close = s.indexOf("**", i + 2);
      if (close < 0) return -1;
      i = close + 2;
      continue;
    }
    if (s[i] === "*" && i > start + 1 && !/\s/.test(s[i - 1])) return i;
    i += 1;
  }
  return -1;
}

export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  let text = "";
  const flush = () => { if (text) { out.push({ t: "text", v: text }); text = ""; } };
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === "\\" && i + 1 < src.length && /[\\`*_{}[\]()#+\-.!|~]/.test(src[i + 1])) { text += src[i + 1]; i += 2; continue; }
    if (ch === "`") {
      const end = src.indexOf("`", i + 1);
      if (end > i) { flush(); out.push({ t: "code", v: src.slice(i + 1, end) }); i = end + 1; continue; }
    }
    if (src.startsWith("~~", i)) {
      const end = src.indexOf("~~", i + 2);
      if (end > i + 2) { flush(); out.push({ t: "del", c: parseInline(src.slice(i + 2, end)) }); i = end + 2; continue; }
    }
    if (src.startsWith("**", i) && i + 2 < src.length && !/\s/.test(src[i + 2])) {
      const end = src.indexOf("**", i + 2);
      if (end > i + 2 && !/\s/.test(src[end - 1])) { flush(); out.push({ t: "strong", c: parseInline(src.slice(i + 2, end)) }); i = end + 2; continue; }
    }
    if (ch === "*" && !src.startsWith("**", i) && i + 1 < src.length && !/\s/.test(src[i + 1])) {
      const end = italicEnd(src, i);
      if (end > i + 1) { flush(); out.push({ t: "em", c: parseInline(src.slice(i + 1, end)) }); i = end + 1; continue; }
    }
    if (ch === "[") {
      const m = /^\[([^\]]+)\]\(([^)\s]+)\)/.exec(src.slice(i));
      if (m) { flush(); out.push({ t: "link", href: m[2], c: parseInline(m[1]) }); i += m[0].length; continue; }
    }
    text += ch;
    i += 1;
  }
  flush();
  return out;
}

/** Plain text of an inline tree (used for speech and search). */
export function inlineText(nodes: Inline[]): string {
  return nodes.map((n) => (n.t === "text" || n.t === "code" ? n.v : n.t === "br" ? " " : inlineText(n.c))).join("");
}

/** Allowed link targets: http(s), mailto and in-page anchors. Anything else is shown as text. */
export function safeHref(href: string): string | null {
  return /^(https?:\/\/|mailto:|#)/i.test(href) ? href : null;
}

/* --------------------------------- blocks --------------------------------- */

const LIST_RE = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
const TABLE_SEP_RE = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

function splitRow(line: string): string[] {
  let row = line.trim();
  if (row.startsWith("|")) row = row.slice(1);
  if (row.endsWith("|") && !row.endsWith("\\|")) row = row.slice(0, -1);
  const cells: string[] = [];
  let cell = "";
  for (let i = 0; i < row.length; i += 1) {
    if (row[i] === "\\" && row[i + 1] === "|") { cell += "|"; i += 1; continue; }
    if (row[i] === "|") { cells.push(cell.trim()); cell = ""; continue; }
    cell += row[i];
  }
  cells.push(cell.trim());
  return cells;
}

function indentOf(line: string): number {
  const m = /^(\s*)/.exec(line);
  return m ? m[1].replace(/\t/g, "    ").length : 0;
}

function parseList(lines: string[], start: number): { block: Block; next: number } {
  const first = LIST_RE.exec(lines[start])!;
  const baseIndent = indentOf(lines[start]);
  const ordered = /\d/.test(first[2]);
  const items: ListItem[] = [];
  let i = start;
  while (i < lines.length) {
    const m = LIST_RE.exec(lines[i]);
    if (!m || indentOf(lines[i]) !== baseIndent) break;
    const item: ListItem = { c: [], children: [] };
    let content = m[3];
    i += 1;
    const nested: string[] = [];
    while (i < lines.length) {
      const line = lines[i];
      if (line.trim() === "") {
        // a blank line ends the item unless an indented continuation follows
        if (i + 1 < lines.length && indentOf(lines[i + 1]) > baseIndent && lines[i + 1].trim() !== "") { nested.push(""); i += 1; continue; }
        break;
      }
      const ind = indentOf(line);
      if (ind > baseIndent) {
        if (LIST_RE.test(line)) nested.push(line);
        else if (nested.length) nested.push(line);
        else content += " " + line.trim();
        i += 1;
        continue;
      }
      break;
    }
    item.c = parseInline(content);
    if (nested.length) item.children = parseBlocks(nested.join("\n"));
    items.push(item);
  }
  return { block: { t: "list", ordered, items }, next: i };
}

export function parseBlocks(md: string): Block[] {
  const lines = md.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") { i += 1; continue; }
    if (/^\s*```/.test(line)) {
      const code: string[] = [];
      i += 1;
      while (i < lines.length && !/^\s*```/.test(lines[i])) { code.push(lines[i]); i += 1; }
      i += 1;
      blocks.push({ t: "code", v: code.join("\n") });
      continue;
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) { blocks.push({ t: "heading", level: h[1].length, c: parseInline(h[2].replace(/\s+#+\s*$/, "")) }); i += 1; continue; }
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { blocks.push({ t: "hr" }); i += 1; continue; }
    if (/^\s*>/.test(line)) {
      const inner: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) { inner.push(lines[i].replace(/^\s*>\s?/, "")); i += 1; }
      blocks.push({ t: "quote", blocks: parseBlocks(inner.join("\n")) });
      continue;
    }
    if (line.includes("|") && i + 1 < lines.length && TABLE_SEP_RE.test(lines[i + 1]) && lines[i + 1].includes("-")) {
      const head = splitRow(line).map(parseInline);
      i += 2;
      const rows: Inline[][][] = [];
      while (i < lines.length && lines[i].trim() !== "" && lines[i].includes("|")) {
        const cells = splitRow(lines[i]).map(parseInline);
        while (cells.length < head.length) cells.push([]);
        rows.push(cells);
        i += 1;
      }
      blocks.push({ t: "table", head, rows });
      continue;
    }
    if (LIST_RE.test(line)) {
      const { block, next } = parseList(lines, i);
      blocks.push(block);
      i = next;
      continue;
    }
    // paragraph: consecutive lines that do not start another block
    const para: string[] = [line];
    i += 1;
    while (i < lines.length) {
      const l = lines[i];
      if (l.trim() === "" || /^(#{1,6})\s/.test(l) || /^\s*```/.test(l) || /^\s*>/.test(l) || LIST_RE.test(l) || /^\s*(-{3,}|\*{3,})\s*$/.test(l)) break;
      if (l.includes("|") && i + 1 < lines.length && TABLE_SEP_RE.test(lines[i + 1]) && lines[i + 1].includes("-")) break;
      para.push(l);
      i += 1;
    }
    const inline: Inline[] = [];
    para.forEach((p, k) => {
      if (k) inline.push({ t: "br" });
      inline.push(...parseInline(p.trim()));
    });
    blocks.push({ t: "para", c: inline });
  }
  return blocks;
}

/* ----------------------------- speech helpers ----------------------------- */

/**
 * The text to send to the speech service for an italic span, or null when the span is not a
 * line to hear (an unfilled slot, no letters, too long). Slot brackets keep their content:
 * "Jag heter [Alex]" is spoken as "Jag heter Alex".
 */
export function speakableText(raw: string): string | null {
  if (raw.includes("___")) return null;
  const text = raw
    .replace(/\*\*/g, "")
    .replace(/~~/g, "")
    .replace(/[[\]]/g, "")
    .replace(/…/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!/\p{L}/u.test(text)) return null;
  if (text.length > 400) return null;
  if (looksEnglish(text)) return null;
  return text;
}

const ENGLISH_WORDS = new Set([
  "the", "and", "is", "are", "this", "that", "you", "your", "to", "of", "for", "with", "it", "be", "can", "will", "what", "when", "how", "not", "or", "if",
  "from", "by", "as", "at", "was", "has", "have", "after", "before", "whole", "rest", "library", "sheet", "plan", "review", "updated", "learn", "without", "which", "swedish", "english", "intermediate", "target", "level", "course", "exam", "note", "today",
]);

/** True when an italic span is an English note, not a Swedish line (two English function words, or a mostly English long span). */
export function looksEnglish(text: string): boolean {
  const words = text.toLowerCase().match(/\p{L}+/gu) ?? [];
  const hits = words.filter((w) => ENGLISH_WORDS.has(w)).length;
  return hits >= 2 || (words.length >= 4 && hits / words.length >= 0.3);
}
