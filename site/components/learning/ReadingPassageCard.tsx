"use client";
import { useState } from "react";
import type { ReadingPassage } from "@/lib/course-types";
import QuestionCard from "./QuestionCard";

export default function ReadingPassageCard({ passage }: { passage: ReadingPassage }) {
  const [gistAnswer, setGistAnswer] = useState("");
  const [gistChecked, setGistChecked] = useState(false);
  const [detailAnswer, setDetailAnswer] = useState("");
  const [detailChecked, setDetailChecked] = useState(false);

  return (
    <div className="reading-passage-card">
      <span className="eyebrow">READ FIRST</span>
      <div className="reading-passage" lang="sv">
        {passage.text.split("\n").map((line, i) =>
          line ? <p key={i}>{line}</p> : <br key={i} />
        )}
      </div>
      <div className="passage-questions">
        <QuestionCard
          id="rp-gist"
          prompt={passage.gist.prompt}
          options={passage.gist.options}
          value={gistAnswer}
          onChange={setGistAnswer}
          checked={gistChecked}
          correct={gistAnswer === passage.gist.options[passage.gist.answer]}
          explanation={passage.gist.explanation}
          correctOption={passage.gist.options[passage.gist.answer]}
          disabled={gistChecked}
          index={0}
        />
        {!gistChecked && (
          <button
            className="secondary"
            disabled={!gistAnswer}
            onClick={() => setGistChecked(true)}
          >
            Check
          </button>
        )}
        {gistChecked && (
          <>
            <QuestionCard
              id="rp-detail"
              prompt={passage.detail.prompt}
              options={passage.detail.options}
              value={detailAnswer}
              onChange={setDetailAnswer}
              checked={detailChecked}
              correct={detailAnswer === passage.detail.options[passage.detail.answer]}
              explanation={passage.detail.explanation}
              correctOption={passage.detail.options[passage.detail.answer]}
              disabled={detailChecked}
              index={1}
            />
            {!detailChecked && (
              <button
                className="secondary"
                disabled={!detailAnswer}
                onClick={() => setDetailChecked(true)}
              >
                Check
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
