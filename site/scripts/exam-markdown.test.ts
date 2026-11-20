// Markdown parser for the exam course documents. Run: npm run test:exam
import assert from "node:assert/strict";
import fs from "node:fs";
import { inlineText, parseBlocks, parseInline, safeHref, speakableText, type Block, type Inline } from "../lib/exam-markdown.ts";

const plain = (md: string) => inlineText(parseInline(md));

// inline: italic with nested bold, strikethrough, code, escapes, links
assert.deepEqual(parseInline("*Jag heter **Alex**.* My name is Alex."), [
  { t: "em", c: [{ t: "text", v: "Jag heter " }, { t: "strong", c: [{ t: "text", v: "Alex" }] }, { t: "text", v: "." }] },
  { t: "text", v: " My name is Alex." },
]);
assert.deepEqual(parseInline("not ~~Jag är bor~~"), [{ t: "text", v: "not " }, { t: "del", c: [{ t: "text", v: "Jag är bor" }] }]);
assert.deepEqual(parseInline("2 * 3 and a*b"), [{ t: "text", v: "2 * 3 and a*b" }]);
assert.deepEqual(parseInline("`npm run check`"), [{ t: "code", v: "npm run check" }]);
assert.equal(plain("a \\* b"), "a * b");
assert.equal(plain("**bold *and italic* text**"), "bold and italic text");
assert.equal(plain("unclosed *italic"), "unclosed *italic");
{
  const links = parseInline("[the plan](#method) and [x](javascript:alert(1))").filter((n): n is Extract<Inline, { t: "link" }> => n.t === "link");
  assert.equal(links.length, 2);
  assert.equal(safeHref(links[0].href), "#method");
  assert.equal(safeHref(links[1].href), null, "a javascript: link is never rendered as a link");
}
assert.equal(safeHref("javascript:alert(1)"), null);
assert.equal(safeHref("data:text/html,x"), null);
assert.equal(safeHref("https://oph.fi"), "https://oph.fi");
assert.equal(safeHref("#method"), "#method");

// blocks
const md = [
  "## Day 4: Book", "", "**New patterns (4)**", "1. *Hej.* Hi.", "2. *Tack.* Thanks.", "   - nested bullet", "",
  "| A | B |", "|---|---|", "| *x* | y \\| z |", "", "> a quote", "", "---", "", "line one", "line two", "", "```", "code *not italic*", "```",
].join("\n");
const blocks = parseBlocks(md);
assert.equal(blocks[0].t, "heading");
assert.equal((blocks[0] as Extract<Block, { t: "heading" }>).level, 2);
assert.equal(blocks[1].t, "para");
const list = blocks[2] as Extract<Block, { t: "list" }>;
assert.equal(list.t, "list");
assert.equal(list.ordered, true);
assert.equal(list.items.length, 2);
assert.equal(list.items[1].children.length, 1, "nested list under item 2");
const table = blocks[3] as Extract<Block, { t: "table" }>;
assert.equal(table.t, "table");
assert.equal(table.head.length, 2);
assert.equal(inlineText(table.rows[0][1]), "y | z", "escaped pipe stays in the cell");
assert.deepEqual(blocks.slice(4).map((b) => b.t), ["quote", "hr", "para", "code"]);
const para = blocks[6] as Extract<Block, { t: "para" }>;
assert.ok(para.c.some((n) => n.t === "br"), "soft line breaks are kept");
assert.equal((blocks[7] as Extract<Block, { t: "code" }>).v, "code *not italic*");

// a bold label line followed directly by another one stays two lines in one paragraph
const labels = parseBlocks("**Words:** *berätta* tell\n**Rule:** one verb form");
assert.equal(labels.length, 1);

// speech text
assert.equal(speakableText("Jag heter **Alex**."), "Jag heter Alex.");
assert.equal(speakableText("Jag bor i [Esbo]."), "Jag bor i Esbo.");
assert.equal(speakableText("Jag bor i [___]."), null);
assert.equal(speakableText("…"), null);
assert.equal(speakableText("12"), null);
assert.equal(speakableText("Hej … hej då"), "Hej hej då");
assert.equal(speakableText("16 November 2026, updated after the third review. This sheet is the whole core."), null, "an English note is never read aloud");
assert.equal(speakableText("Swedish YKI intermediate test, target level 3."), null);
assert.equal(speakableText("Jag har bott i Finland i fem år."), "Jag har bott i Finland i fem år.");
assert.equal(speakableText("Hej, det här är Alex. Jag skulle vilja boka en tid."), "Hej, det här är Alex. Jag skulle vilja boka en tid.");
assert.equal(speakableText("Tack för att du förstår."), "Tack för att du förstår.");

// every generated string parses, and the learner pages keep their Swedish
const dir = new URL("../content/exam/", import.meta.url).pathname;
const read = (name: string) => JSON.parse(fs.readFileSync(dir + name, "utf8"));
let strings = 0;
function walkInline(nodes: Inline[]) { for (const n of nodes) if ("c" in n) walkInline(n.c); }
function walkBlocks(bs: Block[]) {
  for (const b of bs) {
    if (b.t === "heading" || b.t === "para") walkInline(b.c);
    if (b.t === "list") for (const it of b.items) { walkInline(it.c); walkBlocks(it.children); }
    if (b.t === "table") { b.head.forEach(walkInline); b.rows.forEach((r) => r.forEach(walkInline)); }
    if (b.t === "quote") walkBlocks(b.blocks);
  }
}
const check = (md: string) => { strings += 1; walkBlocks(parseBlocks(md)); };
for (const page of Object.values(read("learner.json")) as { markdown: string; backMarkdown?: string }[]) { check(page.markdown); if (page.backMarkdown) check(page.backMarkdown); }
for (const e of read("curriculum.json") as { markdown: string }[]) check(e.markdown);
for (const d of read("docs.json") as { sections: { markdown: string }[] }[]) for (const s of d.sections) check(s.markdown);
assert.ok(strings > 150, `expected many strings, parsed ${strings}`);

const day4 = (read("learner.json") as Record<string, { markdown: string }>)["4"].markdown;
const spans: string[] = [];
(function collect(bs: Block[]) { for (const b of bs) { const walk = (ns: Inline[]) => ns.forEach((n) => { if (n.t === "em") spans.push(inlineText(n.c)); if ("c" in n) walk(n.c); }); if (b.t === "para" || b.t === "heading") walk(b.c); if (b.t === "list") b.items.forEach((it) => { walk(it.c); collect(it.children); }); } })(parseBlocks(day4));
assert.ok(spans.includes("Jag skulle vilja boka en tid."), "Day 4 keeps its Swedish as italic spans");
for (const sv of spans.filter((x) => /[åäö]|^(Jag|Vad|Var|Hej|Kan|Tack)\b/.test(x))) assert.notEqual(speakableText(sv), null, `Swedish must stay playable: ${sv}`);
assert.ok(spans.some((s) => s.startsWith("Hej, det här är")));

console.log(`exam markdown: all checks passed (${strings} generated strings parsed)`);
