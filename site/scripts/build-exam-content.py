#!/usr/bin/env python3
"""Generate site/content/exam/*.json from the course documents in ../reports.

Run from site/: npm run content:exam
The app never reads ../reports at run time; this script is the only bridge.
It never reads reports/teacher-only/ or reports/data/ (held-back mock tasks).
"""
import json
import re
import sys
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent
REPORTS = SITE.parent / "reports"
OUT = SITE / "content" / "exam"
if "--out" in sys.argv:
    OUT = Path(sys.argv[sys.argv.index("--out") + 1])

LEARNER = REPORTS / "YKI-LEARNER-DAYS-1-14.md"
CURRICULUM = REPORTS / "YKI-EXAM-FIRST-CURRICULUM.md"
PLAN = REPORTS / "YKI-EXAM-FIRST-PLAN.md"
CORE = REPORTS / "YKI-CORE-SHEET.md"
TEMPLATES = REPORTS / "YKI-NEW-TEMPLATES-T17-T20.md"
BOOKMAP = REPORTS / "YKI-BOOK-MAP.md"
GUIDE = REPORTS / "START-HERE.md"
AUDIO = REPORTS / "YKI-AUDIO-LIST-DAYS-1-14.md"
PILOT = REPORTS / "YKI-PILOT-LOG.md"

LIGHT = {7, 21, 35, 49, 70, 77}
REST = {83}
MOCK = {28, 56, 84}
EXIT = {14, 41, 42, 62, 63}
MINUTES = {7: 35, 21: 35, 35: 37, 49: 35, 70: 35, 77: 35, 82: 45, 83: 20, 28: 95, 56: 145, 84: 150, 63: 75, 65: 80, 73: 80, 79: 80, 78: 65}


def slug(text: str) -> str:
    s = re.sub(r"[^a-z0-9åäö]+", "-", text.lower()).strip("-")
    return s[:60] or "section"


def clean_title(text: str) -> str:
    text = re.sub(r"\s*\((Phase[^)]*)\)\s*$", "", text)
    return text.replace("*", "").strip()


def phase_of(day: int) -> int:
    if day <= 14:
        return 1
    if day <= 42:
        return 2
    if day <= 63:
        return 3
    return 4


def kind_of(day: int) -> str:
    if day in MOCK:
        return "mock"
    if day in REST:
        return "rest"
    if day in LIGHT:
        return "light"
    if day in EXIT:
        return "exit-test"
    return "study"


def read(path: Path) -> list[str]:
    return path.read_text(encoding="utf-8").split("\n")


def join(lines: list[str]) -> str:
    return "\n".join(lines).strip("\n")


# ------------------------------------------------------------ learner pages


def italic_end(s: str, start: int) -> int:
    """Index of the closing single * of an italic span that starts at s[start] == '*'."""
    i = start + 1
    while i < len(s):
        if s.startswith("**", i):
            i += 2
            continue
        if s[i] == "*":
            return i
        i += 1
    return -1


def pattern_cards(unit_key: str, markdown: str) -> list[dict]:
    cards: list[dict] = []
    in_patterns = False
    n = 0
    for line in markdown.split("\n"):
        if line.startswith("**New patterns"):
            in_patterns = True
            continue
        if in_patterns:
            m = re.match(r"^(\d+)\.\s+(\*.*)$", line)
            if not m:
                if line.strip() == "" or line.startswith("**") or line.startswith("Known shapes"):
                    if line.startswith("Known shapes") or line.startswith("**"):
                        in_patterns = False
                    continue
                continue
            rest = m.group(2)
            end = italic_end(rest, 0)
            if end < 0:
                continue
            sv = rest[1:end].replace("**", "").strip()
            en = rest[end + 1:].strip()
            en = re.sub(r"\s*\(.*$", "", en).strip().rstrip(".")
            if sv and en:
                n += 1
                cards.append({"id": f"d{unit_key}-p{m.group(1)}", "front": en, "back": sv})
    return cards


def parse_steps(markdown: str) -> list[dict]:
    steps = []
    on = False
    for line in markdown.split("\n"):
        if line.startswith("**Steps"):
            on = True
            continue
        if on:
            m = re.match(r"^(\d+)\.\s+(.*)$", line)
            if m:
                text = m.group(2)
                mm = re.findall(r"\((\d+)\s*min\)", text)
                step = {"id": f"s{m.group(1)}", "text": text}
                if mm:
                    step["minutes"] = int(mm[-1])
                steps.append(step)
            elif line.strip() == "" and steps:
                continue
            elif line.startswith("**"):
                break
    return steps


DEFAULT_AMBER = "You got there, but slowly, or one mistake kept coming back: write it in your error list and go on."
DEFAULT_RED = "You misunderstood the card, could not answer, or needed to read the model: do this day again tomorrow with new details."


def parse_done(markdown: str) -> dict:
    done = {"green": "", "amber": "", "red": ""}
    extra = ""
    on = False
    for line in markdown.split("\n"):
        if line.startswith("**Done?"):
            on = True
            continue
        if on:
            m = re.match(r"^-\s+Amber or Red[^:]*:\s*(.*)$", line)
            if m:
                extra = re.sub(r"^see the top\.?\s*", "", m.group(1).strip())
                continue
            m = re.match(r"^-\s+(Green|Amber|Red)[^:]*:\s*(.*)$", line)
            if m:
                done[m.group(1).lower()] = m.group(2).strip()
    if not done["green"]:
        return {
            "green": "Every test is Green or Amber, with at most one Red that is not a misread task word.",
            "amber": "A test that works but slowly, or one kind of slip that keeps coming back: note it and go on.",
            "red": "A misread task word, a whole kind of item failing, or you needed the model: repeat that test with new items.",
        }
    if not done["amber"]:
        done["amber"] = DEFAULT_AMBER + (" " + extra if extra else "")
    if not done["red"]:
        done["red"] = DEFAULT_RED
    return done


def parse_dialogues(unit_key: str, lines: list[str], title: str) -> list[dict]:
    turns = []
    text = "\n".join(lines)
    for m in re.finditer(r"(Voice|You):\s*\*([^*]+?)\*", text):
        turns.append({"who": "voice" if m.group(1) == "Voice" else "you", "sv": m.group(2).strip()})
    if len(turns) >= 2:
        return [{"id": f"d{unit_key}-call", "title": title, "turns": turns}]
    return []


def build_learner() -> tuple[dict, list[dict]]:
    lines = read(LEARNER)
    try:
        back_at = next(i for i, l in enumerate(lines) if l.startswith("# Back of the file"))
    except StopIteration:
        sys.exit("learner file: '# Back of the file' heading not found")
    front, back = lines[:back_at], lines[back_at:]

    # Front: split on '## Day' and '### Day'
    pages: dict[str, dict] = {}
    cur_key = None
    buf: list[str] = []
    titles: dict[str, str] = {}

    def flush():
        if cur_key is not None:
            pages[cur_key] = {"lines": buf[:]}

    for l in front:
        m3 = re.match(r"^### Day (\d+[ab]): (.*)$", l)
        m2 = re.match(r"^## Day (\d+): (.*)$", l)
        if m3:
            flush()
            cur_key, buf = m3.group(1), []
            titles[cur_key] = m3.group(2).strip()
            continue
        if m2:
            flush()
            n = m2.group(1)
            if n == "3":
                cur_key, buf = None, []  # intro lines of Day 3 are dropped
                continue
            cur_key, buf = n, []
            titles[cur_key] = m2.group(2).strip()
            continue
        if cur_key is not None:
            buf.append(l)
    flush()

    # Back: sections '## Day N...'
    back_by_key: dict[str, list[str]] = {}
    back_titles: dict[str, str] = {}
    bk = None
    for l in back:
        m = re.match(r"^## Day (\d+[ab]?)\b(.*)$", l)
        if m:
            bk = m.group(1)
            back_by_key.setdefault(bk, [])
            back_titles[bk] = (m.group(1) + m.group(2)).strip(": ")
            back_by_key[bk].append("")
            continue
        if bk is not None:
            back_by_key[bk].append(l)

    learner: dict[str, dict] = {}
    for key, data in pages.items():
        body = data["lines"]
        # trim trailing separators
        while body and body[-1].strip() in ("", "---"):
            body.pop()
        md = join(body)
        back_lines = back_by_key.get(key, [])
        # Day 3 back sections are 3a / 3b; Day 14 and others use the plain number.
        dlg = parse_dialogues(key, back_lines, back_titles.get(key, f"Day {key} call"))
        learner[key] = {
            "markdown": md,
            "steps": parse_steps(md),
            "cards": pattern_cards(key, md),
            "backMarkdown": join(back_lines) if any(x.strip() for x in back_lines) else "",
            "dialogues": dlg,
            "doneWhen": parse_done(md),
        }
    unit_order = []
    for key in learner:
        day = int(re.match(r"\d+", key).group(0))
        unit_order.append({"key": key, "day": day, "title": clean_title(titles.get(key, f"Day {key}"))})
    return learner, unit_order


# --------------------------------------------------------------- curriculum


def is_boundary(line: str) -> bool:
    return bool(re.match(r"^#{1,3} ", line))


def build_curriculum() -> tuple[list[dict], list[dict]]:
    lines = read(CURRICULUM)
    plan_lines = read(PLAN)

    # plan 5.1 day sections for pointer days
    plan_days: dict[str, str] = {}
    pk = None
    pbuf: list[str] = []
    for l in plan_lines:
        m = re.match(r"^#### Day (\d+)[:,]", l)
        if m and not re.match(r"^#### Day \d+, extra", l):
            if pk:
                plan_days[pk] = join(pbuf)
            pk, pbuf = m.group(1), [l]
            continue
        if pk and (re.match(r"^#{1,3} ", l) or re.match(r"^#### (?!Day)", l)):
            plan_days[pk] = join(pbuf)
            pk = None
            continue
        if pk:
            pbuf.append(l)
    if pk:
        plan_days[pk] = join(pbuf)

    entries: list[dict] = []
    notes: list[dict] = []
    i = 0
    intro: list[str] = []
    note_title = "Curriculum notes"
    note_buf: list[str] = []
    while i < len(lines):
        l = lines[i]
        m = re.match(r"^### Day (\d+)([ab]?)\b(?!,)[:\s]*(.*)$", l)
        sub = re.match(r"^#### Day (\d+[ab])\b:\s*(.*)$", l)
        after = re.match(r"^## (After Day 84.*)$", l)
        if m:
            if note_buf and any(x.strip() for x in note_buf):
                notes.append({"id": slug(note_title), "title": note_title, "level": 2, "markdown": join(note_buf)})
            note_buf = []
            key = m.group(1) + m.group(2)
            day = int(m.group(1))
            j = i + 1
            body = [l]
            while j < len(lines) and not is_boundary(lines[j]):
                body.append(lines[j])
                j += 1
            while body and body[-1].strip() in ("", "---"):
                body.pop()
            md = join(body)
            heading_title = clean_title(m.group(3))
            ph = re.search(r"Phase (\d)", m.group(3))
            entry = {
                "key": key,
                "label": f"Day {key}",
                "day": day,
                "title": heading_title,
                "phase": int(ph.group(1)) if ph else phase_of(day),
                "markdown": md,
            }
            entries.append(entry)
            i = j
            continue
        if after:
            if note_buf and any(x.strip() for x in note_buf):
                notes.append({"id": slug(note_title), "title": note_title, "level": 2, "markdown": join(note_buf)})
                note_buf = []
            j = i + 1
            body = [l]
            while j < len(lines) and not re.match(r"^#{1,2} ", lines[j]):
                body.append(lines[j])
                j += 1
            md = join(body).rstrip("-\n ")
            entries.append({"key": "after", "label": "After Day 84", "day": 85, "title": clean_title(after.group(1)), "phase": None, "markdown": md})
            i = j
            continue
        wk = re.match(r"^## (Week \d+.*)$", l)
        if wk:
            if note_buf and any(x.strip() for x in note_buf):
                notes.append({"id": slug(note_title), "title": note_title, "level": 2, "markdown": join(note_buf)})
            note_title = wk.group(1)
            note_buf = []
            i += 1
            continue
        note_buf.append(l)
        i += 1
    if note_buf and any(x.strip() for x in note_buf):
        notes.append({"id": slug(note_title), "title": note_title, "level": 2, "markdown": join(note_buf)})

    # sub-day entries (3a/3b, 34a/34b, 38a/38b) as slices of their parent
    sub_entries: list[dict] = []
    for e in entries:
        parts = re.split(r"(?m)^(?=#### Day \d+[ab]:)", e["markdown"])
        for part in parts:
            mm = re.match(r"^#### Day (\d+[ab]):\s*(.*)", part)
            if mm and not re.match(r"^\d+b$", mm.group(1)) or (mm and mm.group(1) in ("3b", "34b", "38b")):
                pass
            if mm:
                k = mm.group(1)
                if any(x["key"] == k for x in entries):
                    continue
                body = part.rstrip("\n -")
                sub_entries.append({"key": k, "label": f"Day {k}", "day": int(re.match(r"\d+", k).group(0)), "title": clean_title(mm.group(2)), "phase": e["phase"], "markdown": body})
    entries.extend(sub_entries)

    # pointer days get the plan's full day text appended
    for e in entries:
        if e["key"].isdigit() and "section 5.1 of the plan" in e["markdown"] and e["key"] in plan_days and len(e["markdown"]) < 2500:
            e["markdown"] += "\n\n---\n\n**Full day plan (from the method, section 5.1)**\n\n" + plan_days[e["key"]]
            e["fullFromPlan"] = True

    # intro of the file before the first day (header paragraphs)
    first = next((k for k, l in enumerate(lines) if re.match(r"^### Day ", l)), len(lines))
    head = [x for x in lines[:first] if not re.match(r"^# Swedish YKI level 3, exam-first curriculum, part", x)]
    head_md = join(head)
    if head_md.strip():
        notes.insert(0, {"id": "how-to-read", "title": "How to read the curriculum", "level": 2, "markdown": head_md})
    return entries, notes


# ------------------------------------------------------------------- docs


def doc_sections(lines: list[str], level: int = 2, layer_marks: bool = False) -> list[dict]:
    sections: list[dict] = []
    layer = None
    cur = None
    buf: list[str] = []
    prefix = "#" * level + " "
    for l in lines:
        if layer_marks:
            m1 = re.match(r"^# (ACTIVE CORE|RECOGNITION CORE|REFERENCE|STUDY RULES)", l)
            if m1:
                layer = {"ACTIVE CORE": "active", "RECOGNITION CORE": "recognition", "REFERENCE": "reference", "STUDY RULES": "rules"}[m1.group(1)]
                if cur:
                    cur["markdown"] = join(buf)
                    sections.append(cur)
                    cur, buf = None, []
                continue
        if l.startswith(prefix) and not l.startswith(prefix + "#"):
            if cur:
                cur["markdown"] = join(buf)
                sections.append(cur)
            title = l[len(prefix):].strip()
            cur = {"id": slug(title), "title": title, "level": level, "markdown": ""}
            if layer:
                cur["layer"] = layer
            buf = []
        elif cur is not None:
            buf.append(l)
        else:
            buf.append(l)
    if cur:
        cur["markdown"] = join(buf)
        sections.append(cur)
    # text before the first section becomes an 'Overview'
    return sections


def make_doc(doc_id: str, title: str, summary: str, path: Path, level: int = 2, layer_marks: bool = False, drop_title: bool = True, playable: bool = False) -> dict:
    lines = read(path)
    head: list[str] = []
    first_sec = next((i for i, l in enumerate(lines) if (l.startswith("#" * level + " ") and not l.startswith("#" * level + "#")) or (layer_marks and re.match(r"^# (ACTIVE CORE|RECOGNITION CORE|REFERENCE|STUDY RULES)", l))), len(lines))
    head = [l for l in lines[:first_sec] if not (drop_title and l.startswith("# "))]
    secs = doc_sections(lines[first_sec:], level, layer_marks)
    if any(x.strip() for x in head):
        secs.insert(0, {"id": "overview", "title": "Overview", "level": level, "markdown": join(head)})
    for s in secs:
        s["id"] = slug(s["title"])
    # unique ids
    seen: dict[str, int] = {}
    for s in secs:
        n = seen.get(s["id"], 0)
        seen[s["id"]] = n + 1
        if n:
            s["id"] = f"{s['id']}-{n+1}"
    return {"id": doc_id, "title": title, "summary": summary, "playable": playable, "sections": secs}


# -------------------------------------------------------------------- main


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    learner, learner_units = build_learner()
    entries, notes = build_curriculum()

    by_key = {e["key"]: e for e in entries}
    units: list[dict] = []

    def add_unit(key, day, title, curriculum_key):
        units.append({
            "key": key,
            "label": f"Day {key}",
            "day": day,
            "title": title,
            "phase": phase_of(day),
            "kind": kind_of(day),
            "minutes": MINUTES.get(day, 60),
            "curriculumKey": curriculum_key,
            **({"hasLearnerPage": True} if key in learner else {}),
        })

    # Days 1-14 from learner pages (3a/3b separate)
    for u in sorted(learner_units, key=lambda x: (x["day"], x["key"])):
        ck = u["key"] if u["key"] in by_key else str(u["day"])
        add_unit(u["key"], u["day"], u["title"], ck)
    # Days 15-84 from the curriculum, with sub-days
    for day in range(15, 85):
        k = str(day)
        if day in (34, 38):
            for sk in (f"{day}a", f"{day}b"):
                if sk in by_key:
                    add_unit(sk, day, by_key[sk]["title"], sk)
            continue
        if k not in by_key:
            sys.exit(f"curriculum: Day {day} not found")
        add_unit(k, day, by_key[k]["title"], k)
        if f"{day}b" in by_key and day == 31:
            add_unit("31b", 31, by_key["31b"]["title"], "31b")

    # light/rest/mock titles for the learner days come from the page headings
    docs = [
        make_doc("core", "Core sheet", "What you memorise, what you recognise, what you look up.", CORE, level=2, layer_marks=True, playable=True),
        make_doc("method", "Method (the plan)", "Why the course works the way it does: rules, gates, the 60-minute day, mocks, the calendar.", PLAN),
        make_doc("templates", "Templates T17-T20", "Extra answer templates for gaps in the practice book.", TEMPLATES, playable=True),
        make_doc("bookmap", "Practice book map", "Where each task of the practice book is used, by page (pointers only).", BOOKMAP),
        make_doc("guide", "Start here", "How to study from the documents, in what order, and how to mark a day.", GUIDE),
        make_doc("audio", "Audio list, Days 1-14", "Every Swedish line of Days 1-14 in order, for recording.", AUDIO, playable=True),
        make_doc("pilot", "Pilot log (paper copy)", "The paper version of the seven-lesson pilot log; the app keeps the same record.", PILOT),
    ]
    seen_ids: dict[str, int] = {}
    for n in notes:
        k = n["id"]
        seen_ids[k] = seen_ids.get(k, 0) + 1
        if seen_ids[k] > 1:
            n["id"] = f"{k}-{seen_ids[k]}"
    docs.insert(1, {"id": "curriculum-notes", "title": "Curriculum notes", "summary": "Rules and notes that sit above the weeks of the curriculum.", "playable": False, "sections": notes})

    (OUT / "units.json").write_text(json.dumps(units, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    (OUT / "learner.json").write_text(json.dumps(learner, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    entries.sort(key=lambda e: (e["day"], e["key"]))
    (OUT / "curriculum.json").write_text(json.dumps(entries, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    (OUT / "docs.json").write_text(json.dumps(docs, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"units {len(units)}, learner pages {len(learner)}, curriculum entries {len(entries)}, docs {len(docs)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
