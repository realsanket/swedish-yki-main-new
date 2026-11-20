/** Checks for typed answers in the guided Day 1 and Day 2 lessons. Pure: no React, no network. */

export function norm(text: string): string {
  return text.toLowerCase().normalize("NFC").replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}

export function editDistance(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const up = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = up;
    }
  }
  return prev[b.length];
}

export type Verdict = "exact" | "slip" | "different" | "empty";
export type WordMark = { word: string; ok: boolean };

/** Words of `typed` that are not part of the longest common word sequence with `model` are marked not ok. */
export function diffWords(typed: string[], model: string[]): WordMark[] {
  const n = typed.length, m = model.length;
  const table = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i -= 1) for (let j = m - 1; j >= 0; j -= 1) table[i][j] = typed[i] === model[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
  const marks: WordMark[] = [];
  let i = 0, j = 0;
  while (i < n) {
    if (j < m && typed[i] === model[j]) { marks.push({ word: typed[i], ok: true }); i += 1; j += 1; }
    else if (j < m && table[i][j + 1] >= table[i + 1][j]) j += 1;
    else { marks.push({ word: typed[i], ok: false }); i += 1; }
  }
  return marks;
}

/** exact: same words (capitals and punctuation ignored); slip: at most 2 letters off in the same words; different: anything else. */
export function compareLine(typed: string, model: string): { verdict: Verdict; marks: WordMark[] } {
  const t = norm(typed), m = norm(model);
  if (!t) return { verdict: "empty", marks: [] };
  const marks = diffWords(t.split(" "), m.split(" "));
  if (t === m) return { verdict: "exact", marks };
  const sameWordCount = t.split(" ").length === m.split(" ").length;
  if (sameWordCount && editDistance(t, m) <= 2) return { verdict: "slip", marks };
  return { verdict: "different", marks };
}

/** A required point of a free message, checked by a simple test (see guidedDays.ts). */
export function checkPoint(test: string, typed: string): boolean {
  const t = norm(typed);
  if (test === "??") return (typed.match(/\?/g) ?? []).length >= 2;
  if (test === "hej") return t.split(" ")[0] === "hej";
  if (test === "hälsningar") return t.includes("hälsningar");
  return t.includes(test);
}

/** Digits typed for a dictated number: "12" and " 12 " are right; "tolv" is not (the check is for digits). */
export function checkNumber(typed: string, key: number): boolean {
  return /^\s*\d{1,3}\s*$/.test(typed) && Number(typed) === key;
}
