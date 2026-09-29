"use client";

import { useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import type { SoundMapActivity as SoundMapActivityData } from "@/lib/course-types";
import AudioButton from "../AudioButton";
import styles from "./TeachingActivity.module.css";

/**
 * Explore sounds one tile at a time, light up the groups they share, then
 * rebuild the two-part mouth recipes from memory.
 */
export default function SoundMapActivity({ activity }: { activity: SoundMapActivityData }) {
  const [selected, setSelected] = useState(0);
  const [feature, setFeature] = useState<string | null>(null);
  const recipeSounds = activity.sounds.filter((sound) => sound.recipe);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizChoice, setQuizChoice] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const sound = activity.sounds[selected];
  const activeFeature = activity.features?.find((item) => item.id === feature);
  const quizDone = quizIndex >= recipeSounds.length;
  const quizSound = recipeSounds[Math.min(quizIndex, recipeSounds.length - 1)];

  return (
    <div className={styles.soundMap}>
      {!!activity.features?.length && (
        <div className={styles.featureBar} role="group" aria-label="Light up a sound group">
          {activity.features.map((item) => (
            <button
              type="button"
              key={item.id}
              aria-pressed={feature === item.id}
              className={feature === item.id ? styles.selected : ""}
              onClick={() => setFeature(feature === item.id ? null : item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
      {activeFeature && <p className={styles.featureNote}>{activeFeature.note}</p>}

      <div className={styles.soundGrid} role="group" aria-label="Sounds">
        {activity.sounds.map((item, index) => {
          const lit = !feature || item.features?.includes(feature);
          return (
            <button
              type="button"
              key={item.symbol}
              aria-pressed={selected === index}
              className={[styles.soundTile, selected === index ? styles.selected : "", lit ? "" : styles.dim].filter(Boolean).join(" ")}
              onClick={() => setSelected(index)}
            >
              <b lang="sv">{item.symbol}</b>
              <small>{item.words[0]?.fi}</small>
            </button>
          );
        })}
      </div>

      <div className={styles.soundDetail} aria-live="polite">
        <div className={styles.soundSymbol} lang="sv">{sound.symbol}</div>
        <div>
          {sound.recipe && (
            <p className={styles.recipe}>
              <span>{sound.recipe.from}</span> + <span>{sound.recipe.to}</span> = <b lang="sv">{sound.symbol}</b>
            </p>
          )}
          <p>{sound.cue}</p>
          <div className={styles.soundWords}>
            {sound.words.map((word) => (
              <span key={word.fi}>
                <b lang="sv">{word.fi}</b> <small>{word.en}</small>
                <AudioButton text={word.fi} label={`Hear ${word.fi}`} className="icon-button" />
              </span>
            ))}
          </div>
        </div>
      </div>

      {!!activity.contrasts?.length && (
        <div className={styles.contrasts}>
          {activity.contrasts.map((contrast) => (
            <div key={contrast.label}>
              <b lang="sv">{contrast.label}</b>
              <small>{contrast.cue}</small>
              <AudioButton text={contrast.audio} label={`Hear ${contrast.label}`} className="icon-button" slow />
            </div>
          ))}
        </div>
      )}

      {recipeSounds.length > 0 && (
        <div className={styles.recipeQuiz}>
          <span className={styles.eyebrow}>{activity.quizPrompt ?? "RECIPE CHECK · WHICH SOUND IS IT?"}</span>
          {quizDone ? (
            <div className={styles.sortResult} aria-live="polite">
              <b>{quizScore} of {recipeSounds.length} recipes rebuilt on the first try</b>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setQuizIndex(0);
                  setQuizChoice(null);
                  setQuizScore(0);
                }}
              >
                <RotateCcw size={15} aria-hidden="true" /> Try the recipes again
              </button>
            </div>
          ) : (
            <>
              <p className={styles.recipe}>
                <span>{quizSound.recipe!.from}</span> + <span>{quizSound.recipe!.to}</span> = <b>?</b>
              </p>
              <div className={styles.quizOptions} role="group" aria-label="Choose the sound">
                {activity.sounds.map((option) => {
                  const state = !quizChoice
                    ? ""
                    : option.symbol === quizSound.symbol
                      ? styles.right
                      : option.symbol === quizChoice
                        ? styles.wrong
                        : styles.dim;
                  return (
                    <button
                      type="button"
                      key={option.symbol}
                      lang="sv"
                      disabled={!!quizChoice}
                      className={state}
                      onClick={() => {
                        setQuizChoice(option.symbol);
                        if (option.symbol === quizSound.symbol) setQuizScore((value) => value + 1);
                      }}
                    >
                      {option.symbol}
                    </button>
                  );
                })}
              </div>
              {quizChoice && (
                <div className={`${styles.feedback} ${quizChoice === quizSound.symbol ? styles.right : styles.wrong}`} aria-live="polite">
                  {quizChoice === quizSound.symbol ? <Check size={17} aria-hidden="true" /> : <X size={17} aria-hidden="true" />}
                  <p>
                    <b>{quizSound.symbol}</b> — {quizSound.cue}
                  </p>
                  <button
                    type="button"
                    className="primary"
                    onClick={() => {
                      setQuizIndex((value) => value + 1);
                      setQuizChoice(null);
                    }}
                  >
                    {quizIndex + 1 < recipeSounds.length ? "Next recipe →" : "See my result →"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
