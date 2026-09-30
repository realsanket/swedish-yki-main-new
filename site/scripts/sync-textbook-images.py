"""Copy mapped textbook pages into public/ for local and deployed builds.

The canonical page scans already live in docs/text-book-images. Keeping a second
binary copy in Git makes review systems reject the lecture-only change, so these
public files are generated instead.
"""
from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

SITE = Path(__file__).resolve().parents[1]
ROOT = SITE.parent
LECTURES = SITE / "content" / "lectures"
PUBLIC = SITE / "public"
SOURCE = ROOT / "docs" / "text-book-images"
PAGE_PATTERN = re.compile(r"textbook-lesson-\d{2}-page-(\d{2})\.png$")

copied = []
for lecture_file in sorted(LECTURES.glob("lecture-[0-9][0-9].json")):
    lecture = json.loads(lecture_file.read_text())
    for step in lecture.get("extraSteps", []):
        for page in step.get("pages", []):
            public_path = page.get("image", "")
            match = PAGE_PATTERN.search(public_path)
            if not match:
                continue
            source = SOURCE / f"page-0{match.group(1)}.png"
            target = PUBLIC / public_path.lstrip("/")
            if not source.exists():
                raise FileNotFoundError(f"Missing canonical textbook page: {source}")
            target.parent.mkdir(parents=True, exist_ok=True)
            if target.is_symlink() or not target.exists() or source.read_bytes() != target.read_bytes():
                target.unlink(missing_ok=True)
                shutil.copyfile(source, target)
            copied.append(target.relative_to(SITE))

print(f"textbook images: {len(set(copied))} ready")
