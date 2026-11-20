import { getDb } from "./db";
import { applyExamAction, defaultExamState, normalizeExamState, type ExamContext } from "./exam-state.ts";
// P0 shim: package C replaces this. Storage still reads and writes the v1 state.
import type { ExamActionV1 as ExamAction, ExamStateV1 as ExamState } from "./exam-types.ts";

type Row = { state: string };

export function readExamState(userId: string): ExamState {
  const row = getDb().prepare("SELECT state FROM exam_state WHERE user_id = ?").get(userId) as Row | undefined;
  if (!row) return defaultExamState();
  try { return normalizeExamState(JSON.parse(row.state)); } catch { return defaultExamState(); }
}

/** Reads, applies one action and writes back inside one transaction, so two tabs cannot overwrite each other. */
export function applyExamActionDb(userId: string, action: ExamAction, ctx: ExamContext, now = Date.now()): ExamState {
  const db = getDb();
  const run = db.transaction(() => {
    const row = db.prepare("SELECT state FROM exam_state WHERE user_id = ?").get(userId) as Row | undefined;
    let current: ExamState;
    try { current = row ? normalizeExamState(JSON.parse(row.state), now) : defaultExamState(now); } catch { current = defaultExamState(now); }
    const next = applyExamAction(current, action, ctx, now);
    db.prepare("INSERT INTO exam_state (user_id, state, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET state = excluded.state, updated_at = excluded.updated_at").run(userId, JSON.stringify(next), now);
    return next;
  });
  return run.immediate();
}
