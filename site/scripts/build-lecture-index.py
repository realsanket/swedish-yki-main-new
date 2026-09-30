"""Regenerate content/lectures/index.json from the active lecture files.

Run from site/ after editing any content/lectures/lecture-XX.json:
    python3 scripts/build-lecture-index.py
"""
import glob
import json

files = sorted(glob.glob("content/lectures/lecture-[0-9][0-9].json"))
lectures = sorted((json.load(open(path)) for path in files), key=lambda lecture: lecture["number"])
with open("content/lectures/index.json", "w") as out:
    out.write(json.dumps(lectures, indent=2, ensure_ascii=False) + "\n")
print("index.json:", [lecture["number"] for lecture in lectures])
