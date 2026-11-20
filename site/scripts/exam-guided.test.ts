// Answer checks for the guided Day 1 and Day 2 lessons. Run: npm run test:exam
import assert from "node:assert/strict";
import { checkNumber, checkPoint, compareLine, diffWords, editDistance, norm } from "../lib/exam-guided.ts";
import { DAY1, DAY2, GUIDED_DAYS } from "../components/exam/guided/guidedDays.ts";

assert.equal(norm("  Jag  BOR i Esbo! "), "jag bor i esbo");
assert.equal(editDistance("bor", "bor"), 0);
assert.equal(editDistance("esbo", "esbå"), 1);

// verdicts
assert.equal(compareLine("jag bor i esbo", "Jag bor i Esbo.").verdict, "exact", "capitals and the full stop do not matter");
assert.equal(compareLine("Jag bor i Esb.", "Jag bor i Esbo.").verdict, "slip", "one missing letter is a slip");
assert.equal(compareLine("Jag bor i Esbå", "Jag bor i Esbo.").verdict, "slip");
assert.equal(compareLine("Jag är bor i Esbo", "Jag bor i Esbo.").verdict, "different", "the Day 1 trap is a real error");
assert.equal(compareLine("Jag i Esbo bor", "Jag bor i Esbo.").verdict, "different", "word order is a real error");
assert.equal(compareLine("Var du bor?", "Var bor du?").verdict, "different", "the Day 2 trap is a real error");
assert.equal(compareLine("   ", "Jag heter Alex.").verdict, "empty");

// the diff marks only the words that do not belong
const marks = diffWords(["jag", "är", "bor", "i", "esbo"], ["jag", "bor", "i", "esbo"]);
assert.deepEqual(marks.filter((m) => !m.ok).map((m) => m.word), ["är"]);

// points of a free message
assert.equal(checkPoint("hej", "Hej! Jag heter Alex."), true);
assert.equal(checkPoint("hej", "Jag heter Alex. Hej!"), false, "Hej! must open the message");
assert.equal(checkPoint("??", "Vad heter du? Var bor du?"), true);
assert.equal(checkPoint("??", "Vad heter du?"), false, "two questions are required");
assert.equal(checkPoint("hälsningar", "... Hälsningar, Alex"), true);

// numbers
assert.equal(checkNumber("12", 12), true);
assert.equal(checkNumber(" 0 ", 0), true);
assert.equal(checkNumber("tolv", 12), false);
assert.equal(checkNumber("", 0), false);

// the lesson data is consistent
for (const day of Object.values(GUIDED_DAYS)) {
  assert.ok(day.cards.length <= 8, `${day.key}: at most 8 cards`);
  assert.ok(day.patterns.length <= 6, `${day.key}: at most 6 patterns`);
  assert.equal(new Set(day.cards.map((c) => c.id)).size, day.cards.length, `${day.key}: card ids are unique`);
  assert.equal(new Set(day.steps.map((s) => s.id)).size, day.steps.length);
  assert.equal(day.steps.reduce((n, s) => n + s.minutes, 0) <= 60, true, `${day.key}: steps fit 60 minutes`);
  for (const p of day.patterns) {
    if (p.slot) {
      assert.ok(p.template.includes("{}"), `${p.id}: slot needs a {} in the template`);
      assert.ok(p.en.includes("{}"), `${p.id}: slot needs a {} in the English`);
    }
  }
}
assert.equal(DAY1.steps.reduce((n, s) => n + s.minutes, 0), 60);
assert.equal(DAY2.steps.reduce((n, s) => n + s.minutes, 0), 60);
// every typed line of Day 1 is its pattern filled with the default slot
const filled = DAY1.patterns.map((p) => (p.slot ? p.template.replace("{}", p.slot.value) : p.template));
assert.deepEqual(DAY1.typeLines.map((l) => l.sv), filled);
// the Day 2 dictation key is right
for (const item of DAY2.numbers!.dictation) assert.equal(DAY2.numbers!.words.find((w) => w.sv === item.say)!.en, String(item.key));
// the Day 2 models
assert.equal(compareLine(DAY2.message!.model, DAY2.message!.model).verdict, "exact");
for (const point of DAY2.message!.points) assert.equal(checkPoint(point.test, DAY2.message!.model), true, `the model message meets: ${point.label}`);

console.log("exam guided: all checks passed");
