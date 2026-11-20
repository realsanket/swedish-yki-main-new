// Runs every scripts/exam-*.test.ts with tsx, in name order, and stops at the first failure.
// Run: npm run test:exam                   (all)
//      npm run test:exam -- state mark     (only exam-state.test.ts and exam-mark.test.ts)
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const tsx = createRequire(import.meta.url).resolve("tsx/cli");
// A filter is the exact middle of a file name: "state" selects exam-state.test.ts only.
const filters = process.argv.slice(2).map((f) => f.trim()).filter(Boolean);
const stem = (name) => name.slice("exam-".length, -".test.ts".length);
const files = readdirSync(here)
  .filter((name) => /^exam-.+\.test\.ts$/.test(name))
  .filter((name) => !filters.length || filters.includes(stem(name)))
  .sort();

if (!files.length) {
  console.error(filters.length ? `No exam tests match: ${filters.join(", ")}` : "No scripts/exam-*.test.ts files found.");
  process.exit(1);
}

for (const name of files) {
  console.log(`> ${name}`);
  const result = spawnSync(process.execPath, [tsx, join(here, name)], { stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`FAILED: ${name}${result.signal ? ` (signal ${result.signal})` : ""}`);
    process.exit(result.status || 1);
  }
}
console.log(`exam tests: ${files.length} file${files.length === 1 ? "" : "s"} passed`);
