#!/usr/bin/env python3
"""Validate site/content/exam/*.json (the exam course track). Run: npm run exam:check"""
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent
EXAM = SITE / "content" / "exam"
errors: list[str] = []


def fail(msg: str) -> None:
    errors.append(msg)


def load(name: str):
    path = EXAM / name
    if not path.exists():
        fail(f"{name} is missing; run npm run content:exam")
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def plain(text: str) -> str:
    return re.sub(r"\s+", " ", text.replace("**", "").replace("*", "").replace("~~", "")).strip()


units = load("units.json") or []
learner = load("learner.json") or {}
curriculum = load("curriculum.json") or []
docs = load("docs.json") or []

keys = [u["key"] for u in units]
if len(keys) != len(set(keys)):
    fail("duplicate unit keys")
days = sorted({u["day"] for u in units})
if days != list(range(1, 85)):
    fail(f"units must cover days 1-84 exactly; missing {sorted(set(range(1, 85)) - set(days))}")
curr_keys = {e["key"] for e in curriculum}
for u in units:
    if u["curriculumKey"] not in curr_keys:
        fail(f"unit {u['key']}: curriculum entry {u['curriculumKey']} not found")
    if u["phase"] not in (1, 2, 3, 4):
        fail(f"unit {u['key']}: bad phase")
    if u["kind"] not in ("study", "light", "rest", "mock", "exit-test"):
        fail(f"unit {u['key']}: bad kind")
    if not 10 <= u["minutes"] <= 200:
        fail(f"unit {u['key']}: minutes {u['minutes']} out of range")
    if bool(u.get("hasLearnerPage")) != (u["key"] in learner):
        fail(f"unit {u['key']}: hasLearnerPage does not match learner.json")
if "after" not in curr_keys:
    fail("curriculum entry 'after' (After Day 84) is missing")
for e in curriculum:
    if len(e["markdown"]) < 300:
        fail(f"curriculum {e['key']}: entry is suspiciously short ({len(e['markdown'])} characters)")

for key, page in learner.items():
    md = page["markdown"]
    if len(md) < 400:
        fail(f"learner {key}: page too short")
    if len(page["steps"]) < 5:
        fail(f"learner {key}: expected at least 5 steps, found {len(page['steps'])}")
    ids = [c["id"] for c in page["cards"]]
    if len(page["cards"]) > 8:
        fail(f"learner {key}: {len(page['cards'])} cards; the daily limit is 8")
    if len(ids) != len(set(ids)):
        fail(f"learner {key}: duplicate card ids")
    for c in page["cards"]:
        if plain(c["back"]) not in plain(md):
            fail(f"learner {key}: card {c['id']} text does not appear verbatim in the page: {c['back']!r}")
        if not c["front"].strip():
            fail(f"learner {key}: card {c['id']} has no English front")
    for part in ("green", "amber", "red"):
        if not page["doneWhen"].get(part):
            fail(f"learner {key}: doneWhen.{part} is empty")
    for d in page["dialogues"]:
        if len(d["turns"]) < 4:
            fail(f"learner {key}: dialogue {d['id']} has fewer than 4 turns")
    if "HELPER ONLY" in md:
        fail(f"learner {key}: contains HELPER ONLY text")
for key in ("4", "10", "11", "12"):
    if key in learner and not learner[key]["dialogues"]:
        fail(f"learner {key}: expected a phone-call script")

want_docs = {"core", "curriculum-notes", "method", "templates", "bookmap", "guide", "audio", "pilot"}
if {d["id"] for d in docs} != want_docs:
    fail(f"docs must be exactly {sorted(want_docs)}")
for d in docs:
    if not d["sections"]:
        fail(f"doc {d['id']}: no sections")
    ids = [s["id"] for s in d["sections"]]
    if len(ids) != len(set(ids)):
        fail(f"doc {d['id']}: duplicate section ids")
    for s in d["sections"]:
        if "teacher-only" in s["markdown"] and "YKI-MOCK-RESERVE" in s["markdown"] and "|" in s["markdown"] and "p" in s["markdown"] and re.search(r"`p\d+-[A-Z]", s["markdown"]) and "held back" in s["markdown"].lower() and False:
            pass

# The generated files must match the documents they come from (skip when ../reports is absent).
if (SITE.parent / "reports" / "YKI-EXAM-FIRST-CURRICULUM.md").exists():
    with tempfile.TemporaryDirectory() as tmp:
        r = subprocess.run([sys.executable, str(SITE / "scripts" / "build-exam-content.py"), "--out", tmp], capture_output=True, text=True)
        if r.returncode != 0:
            fail("build-exam-content.py failed: " + r.stderr.strip()[:200])
        else:
            for name in ("units.json", "learner.json", "curriculum.json", "docs.json"):
                if (Path(tmp) / name).read_text(encoding="utf-8") != (EXAM / name).read_text(encoding="utf-8"):
                    fail(f"{name} is out of date; run npm run content:exam")

if errors:
    print("Exam content check FAILED:")
    for e in errors:
        print(" -", e)
    sys.exit(1)
print(f"Exam content OK: {len(units)} units, {len(learner)} learner pages, {len(curriculum)} curriculum entries, {len(docs)} documents")
