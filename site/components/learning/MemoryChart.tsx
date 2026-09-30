"use client";

/**
 * "What I still remember": for each lecture, how many of its phrases are
 * remembered (said correctly and not yet due), due again, or not practised.
 */
export default function MemoryChart({
  rows,
}: {
  rows: Array<{ lectureId: string; number: number; title: string; unlocked: number; remembered: number; due: number; fresh: number }>;
}) {
  return (
    <figure className="memory-chart">
      <figcaption>
        <b>What I still remember</b>
        <span className="memory-legend">
          <i className="remembered" /> Remembered <i className="due" /> Due again <i className="fresh" /> Not practised yet
        </span>
      </figcaption>
      <ul>
        {rows.map((row) => (
          <li key={row.lectureId}>
            <span className="memory-label">
              Lecture {row.number} <small>{row.title}</small>
            </span>
            <span
              className="memory-bar"
              role="img"
              aria-label={`Lecture ${row.number}: ${row.remembered} of ${row.unlocked} phrases remembered, ${row.due} due again, ${row.fresh} not practised yet`}
            >
              {row.remembered > 0 && <i className="remembered" style={{ flexGrow: row.remembered }} />}
              {row.due > 0 && <i className="due" style={{ flexGrow: row.due }} />}
              {row.fresh > 0 && <i className="fresh" style={{ flexGrow: row.fresh }} />}
            </span>
            <span className="memory-count">
              {row.remembered}/{row.unlocked}
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
