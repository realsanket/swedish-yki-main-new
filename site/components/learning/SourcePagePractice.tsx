"use client";

import Image from "next/image";
import { BookOpenText, Check, EyeOff, Headphones, MessagesSquare, Search, Volume2, X } from "lucide-react";
import { useState } from "react";
import type { SourcePagePractice as SourcePagePracticeData } from "@/lib/course-types";
import { storyCharacterForSpeaker, type StoryCharacterName } from "@/lib/story-world";
import AudioButton from "./AudioButton";
import { MarkedWord } from "./activities/shared";
import styles from "./SourcePagePractice.module.css";

type PracticeMode = "listen" | "read" | "sounds" | "vanish" | "roleplay";
type Line = SourcePagePracticeData["lines"][number];

const allModes: Array<{ id: PracticeMode; label: string; icon: typeof Headphones }> = [
  { id: "listen", label: "Listen for gist", icon: Headphones },
  { id: "read", label: "Understand", icon: BookOpenText },
  { id: "sounds", label: "Sound hunt", icon: Search },
  { id: "vanish", label: "Vanishing text", icon: EyeOff },
  { id: "roleplay", label: "Role-play", icon: MessagesSquare },
];

const vanishLevels = ["Full text", "Some gaps", "First letters", "Meaning only"];

const voiceFor = (line: Line): StoryCharacterName => storyCharacterForSpeaker(line.voice)?.name ?? "Henrik";
const normalize = (word: string) => word.normalize("NFC").toLocaleLowerCase("sv").replace(/[^\p{L}]/gu, "");

/** Splits a line into word and non-word parts so punctuation survives masking. */
function tokens(text: string) {
  return text.split(/(\p{L}+)/u).filter(Boolean).map((part) => ({ part, word: /\p{L}/u.test(part) }));
}

function maskLine(text: string, level: number) {
  let wordIndex = -1;
  return tokens(text).map(({ part, word }, index) => {
    if (!word) return <span key={index}>{part}</span>;
    wordIndex += 1;
    const hide = level >= 2 || (level === 1 && wordIndex % 3 === 1);
    if (!hide) return <span key={index}>{part}</span>;
    const shown = level >= 2 ? part[0] : "";
    return (
      <span key={index} className={styles.gap} aria-label={`hidden word starting with ${part[0]}`}>
        {shown}
        {"_".repeat(Math.max(1, part.length - shown.length))}
      </span>
    );
  });
}

/**
 * A verified textbook page practised as a ladder: gist, meaning, the page's own
 * sound marks, vanishing text, then role-play. Every stage reads its material
 * from lecture content; stages without content are omitted.
 */
export default function SourcePagePractice({ practice }: { practice: SourcePagePracticeData }) {
  const modes = allModes.filter((mode) => mode.id !== "sounds" || !!practice.soundSpots?.length);
  const [mode, setMode] = useState<PracticeMode>("listen");
  const modeIndex = modes.findIndex((item) => item.id === mode);
  const nextMode = modes[modeIndex + 1];
  const segments = practice.lines.map((line) => ({ text: line.fi, speaker: voiceFor(line), language: "sv" as const }));
  const fullText = practice.lines.map((line) => line.fi).join(" ");
  const pageCovered = mode === "vanish" || mode === "roleplay";

  return (
    <section className="source-page-practice" aria-labelledby="source-page-practice-title">
      <header>
        <div>
          <span>TEXTBOOK PAGE PRACTICE</span>
          <h3 id="source-page-practice-title">{practice.title}</h3>
          <p>
            You already know this conversation from Elin and Alex. Now climb the same page in {modes.length} short
            stages: hear it, understand it, notice its sounds, lose the text, then play a part.
          </p>
        </div>
        <AudioButton text={fullText} segments={segments} label="Hear the textbook dialogue" className="secondary" />
      </header>

      <nav aria-label="Textbook page practice stages" style={{ gridTemplateColumns: `repeat(${modes.length}, minmax(0, 1fr))` }}>
        {modes.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              type="button"
              key={item.id}
              className={mode === item.id ? "active" : ""}
              aria-current={mode === item.id ? "step" : undefined}
              onClick={() => setMode(item.id)}
            >
              <span>{index + 1}</span>
              <Icon size={16} aria-hidden="true" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className={`source-page-practice-layout mode-${mode}`}>
        <figure>
          <div className={styles.pageFrame}>
            <Image src={practice.image} alt={practice.imageAlt} width={1067} height={1667} sizes="390px" />
            {mode === "listen" && (
              <div className={styles.textCover}>
                <Headphones size={20} aria-hidden="true" />
                <b>Text hidden for the first listen</b>
                <span>Use the picture: who are they, and what are they doing?</span>
              </div>
            )}
          </div>
          {pageCovered && (
            <div className="source-page-cover">
              <EyeOff size={28} aria-hidden="true" />
              <b>Page covered</b>
              <span>{mode === "vanish" ? "Rely on memory, not the page." : "Play your part from memory."}</span>
            </div>
          )}
          <figcaption>Private course reference{practice.pageLabel ? ` · ${practice.pageLabel}` : ""}</figcaption>
        </figure>

        <div className="source-page-practice-work">
          {mode === "listen" && <ListenStage practice={practice} segments={segments} fullText={fullText} />}
          {mode === "read" && <ReadStage practice={practice} />}
          {mode === "sounds" && <SoundHuntStage practice={practice} />}
          {mode === "vanish" && <VanishStage practice={practice} segments={segments} fullText={fullText} />}
          {mode === "roleplay" && <RolePlayStage practice={practice} />}

          {nextMode && (
            <button type="button" className={`primary ${styles.nextStage}`} onClick={() => setMode(nextMode.id)}>
              Next stage: {nextMode.label} →
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function StageIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <div className={styles.stageIntro}>
      <span>{eyebrow}</span>
      <h4>{title}</h4>
      <p>{children}</p>
    </div>
  );
}

function ListenStage({
  practice,
  segments,
  fullText,
}: {
  practice: SourcePagePracticeData;
  segments: { text: string; speaker: StoryCharacterName; language: "sv" }[];
  fullText: string;
}) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const questions = practice.listenQuestions ?? [];
  return (
    <>
      <StageIntro eyebrow="STAGE 1 · EARS ONLY" title="Listen without following every word.">
        Look at the picture, not the text. Play the dialogue once, answer, then play it again to check.
      </StageIntro>
      <div className={styles.audioRow}>
        <AudioButton text={fullText} segments={segments} label="Play the dialogue" className="secondary" />
        <AudioButton text={fullText} label="Play it slowly" slow className="secondary" />
      </div>
      <ol className={styles.questions}>
        {questions.map((question, questionIndex) => {
          const chosen = answers[questionIndex];
          return (
            <li key={question.prompt}>
              <b>{question.prompt}</b>
              <div role="group" aria-label={question.prompt}>
                {question.options.map((option, optionIndex) => {
                  const state =
                    chosen === undefined
                      ? ""
                      : optionIndex === question.answer
                        ? styles.right
                        : optionIndex === chosen
                          ? styles.wrong
                          : styles.dim;
                  return (
                    <button
                      type="button"
                      key={option}
                      disabled={chosen !== undefined}
                      className={`${styles.option} ${state}`}
                      onClick={() => setAnswers((current) => ({ ...current, [questionIndex]: optionIndex }))}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              {chosen !== undefined && (
                <p className={styles.explanation}>
                  {chosen === question.answer ? <Check size={15} aria-hidden="true" /> : <X size={15} aria-hidden="true" />}
                  {question.explanation}
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </>
  );
}

function ReadStage({ practice }: { practice: SourcePagePracticeData }) {
  const [chainStep, setChainStep] = useState(0);
  const chain = practice.backchain;
  const chainLine = chain ? practice.lines[chain.line] : undefined;
  return (
    <>
      <StageIntro eyebrow="STAGE 2 · MEANING" title="Now read each turn. Open only what you need.">
        Say each line after the audio. New words sit under each line; English is one tap away.
      </StageIntro>
      <div className="source-dialogue-lines">
        {practice.lines.map((line, index) => (
          <article key={`${line.speaker}-${index}`}>
            <span>{line.speaker}</span>
            <div>
              <p lang="sv">{line.fi}</p>
              {!!line.glossary?.length && (
                <details className={styles.glossary}>
                  <summary>New words</summary>
                  <div>
                    {line.glossary.map((word) => (
                      <span key={word.fi}>
                        <b lang="sv">{word.fi}</b> {word.en}
                      </span>
                    ))}
                  </div>
                </details>
              )}
              <details>
                <summary>English</summary>
                <p>{line.en}</p>
              </details>
            </div>
            <AudioButton text={line.fi} speaker={voiceFor(line)} language="sv" label={`Hear ${line.speaker}'s line`} className="icon-button" />
          </article>
        ))}
      </div>

      {chain && chainLine && (
        <div className={styles.backchain}>
          <span className={styles.eyebrow}>BUILD THE LONG LINE FROM THE END</span>
          <p>
            Long lines are easier from the back: the newest piece always comes first, and the end you already know
            follows naturally.
          </p>
          <ol>
            {chain.chunks.slice(0, chainStep + 1).map((chunk, index) => (
              <li key={chunk} className={index === chainStep ? styles.currentChunk : ""}>
                <span lang="sv">{chunk}</span>
                <AudioButton text={chunk} speaker={voiceFor(chainLine)} label={`Hear: ${chunk}`} className="icon-button" />
              </li>
            ))}
          </ol>
          {chainStep < chain.chunks.length - 1 ? (
            <button type="button" className="secondary" onClick={() => setChainStep((step) => step + 1)}>
              I said it — add the next piece
            </button>
          ) : (
            <button type="button" className="secondary" onClick={() => setChainStep(0)}>
              Start the chain again
            </button>
          )}
        </div>
      )}

      {!!practice.naturalNotes?.length && (
        <div className={styles.naturalNotes}>
          <span className={styles.eyebrow}>ON THE PAGE → WHAT YOU WILL HEAR AND SAY</span>
          {practice.naturalNotes.map((note) => (
            <div key={note.source}>
              <p>
                <span className={styles.onPage} lang="sv">{note.source}</span>
                <span aria-hidden="true">→</span>
                <b lang="sv">{note.natural}</b>
                <AudioButton text={note.natural} label={`Hear: ${note.natural}`} className="icon-button" />
              </p>
              <small>{note.note}</small>
            </div>
          ))}
        </div>
      )}
      {practice.note && !practice.naturalNotes?.length && (
        <p className="source-language-note">
          <Volume2 size={15} aria-hidden="true" />
          <span><b>Produce naturally:</b> {practice.note}</span>
        </p>
      )}
    </>
  );
}

function SoundHuntStage({ practice }: { practice: SourcePagePracticeData }) {
  const spots = practice.soundSpots ?? [];
  const [found, setFound] = useState<string[]>([]);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const spotFor = (word: string) => spots.find((spot) => normalize(spot.word) === normalize(word));
  const complete = found.length === spots.length;

  function pick(word: string) {
    const spot = spotFor(word);
    if (!spot) {
      setMessage({ ok: false, text: `${word} is not marked on the page. Look for g, k, sk, skj and å.` });
      return;
    }
    if (!found.includes(spot.word)) setFound((current) => [...current, spot.word]);
    setMessage({ ok: true, text: `${spot.word}: ${spot.rule}` });
  }

  return (
    <>
      <StageIntro eyebrow="STAGE 3 · YOUR EYES AND THE RULES" title={`Find the ${spots.length} words the page marks in red.`}>
        The textbook colours the letters that change sound. Look at the page, then tap those words below. Each find
        reveals the Lesson 1 rule behind it.
      </StageIntro>
      {!!practice.focus.length && (
        <p className={styles.focus}>
          <b>The page&apos;s own note card:</b>
          {practice.focus.map((item) => <span key={item}>{item}</span>)}
        </p>
      )}
      <div className={styles.huntLines}>
        {practice.lines.map((line, lineIndex) => (
          <p key={lineIndex}>
            <b>{line.speaker}:</b>{" "}
            {tokens(line.fi).map(({ part, word }, index) => {
              if (!word) return <span key={index}>{part}</span>;
              const spot = spotFor(part);
              const isFound = !!spot && found.includes(spot.word);
              return (
                <button
                  type="button"
                  key={index}
                  lang="sv"
                  className={`${styles.huntWord} ${isFound ? styles.huntFound : ""}`}
                  onClick={() => pick(part)}
                >
                  {isFound ? <MarkedWord text={part} mark={spot.mark} className={styles.mark} /> : part}
                </button>
              );
            })}
          </p>
        ))}
      </div>
      <p className={`${styles.huntMessage} ${message ? (message.ok ? styles.right : styles.wrong) : ""}`} aria-live="polite">
        {message?.text ?? `${found.length} of ${spots.length} found.`}
      </p>
      {found.length > 0 && (
        <ul className={styles.spotList}>
          {spots
            .filter((spot) => found.includes(spot.word))
            .map((spot) => (
              <li key={spot.word}>
                <MarkedWord text={spot.word} mark={spot.mark} className={styles.mark} />
                <small>{spot.rule}</small>
                <AudioButton text={spot.word} label={`Hear ${spot.word}`} className="icon-button" />
              </li>
            ))}
        </ul>
      )}
      <div className={styles.audioRow}>
        <b>{found.length} of {spots.length} found</b>
        {!complete && (
          <button type="button" className="text-button" onClick={() => setFound(spots.map((spot) => spot.word))}>
            Show the ones I missed
          </button>
        )}
      </div>
    </>
  );
}

function VanishStage({
  practice,
  segments,
  fullText,
}: {
  practice: SourcePagePracticeData;
  segments: { text: string; speaker: StoryCharacterName; language: "sv" }[];
  fullText: string;
}) {
  const [level, setLevel] = useState(0);
  return (
    <>
      <StageIntro eyebrow="STAGE 4 · LET THE TEXT DISAPPEAR" title="Say the whole dialogue aloud at every level.">
        Read it once with full text. Each time you manage the whole conversation, hide more. At the last level only
        the meaning is left.
      </StageIntro>
      <div className={styles.levels} role="group" aria-label="How much text to show">
        {vanishLevels.map((label, index) => (
          <button
            type="button"
            key={label}
            aria-pressed={level === index}
            className={`${styles.level} ${level === index ? styles.levelActive : ""}`}
            onClick={() => setLevel(index)}
          >
            <span>{index + 1}</span>
            {label}
          </button>
        ))}
      </div>
      <div className={styles.vanishLines}>
        {practice.lines.map((line, index) => (
          <p key={index}>
            <b>{line.speaker}:</b>{" "}
            {level >= 3 ? <em>{practice.recallCues[index] ?? line.en}</em> : <span lang="sv">{maskLine(line.fi, level)}</span>}
          </p>
        ))}
      </div>
      <div className={styles.audioRow}>
        {level < vanishLevels.length - 1 ? (
          <button type="button" className="secondary" onClick={() => setLevel((value) => value + 1)}>
            I said it all — hide more
          </button>
        ) : (
          <span className={styles.done}>
            <Check size={16} aria-hidden="true" /> If you managed this level, the dialogue is yours.
          </span>
        )}
        <AudioButton text={fullText} segments={segments} label="Check by listening" className="secondary" />
      </div>
    </>
  );
}

function RolePlayStage({ practice }: { practice: SourcePagePracticeData }) {
  const speakers = [...new Set(practice.lines.map((line) => line.speaker))];
  const [role, setRole] = useState(speakers[1] ?? speakers[0]);
  const [turn, setTurn] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const current = practice.lines[turn];
  const finished = turn >= practice.lines.length;
  const partner = speakers.find((speaker) => speaker !== role);

  function restart(nextRole = role) {
    setRole(nextRole);
    setTurn(0);
    setRevealed(false);
  }

  return (
    <>
      <StageIntro eyebrow="STAGE 5 · PLAY A PART" title={`You are ${role}. ${partner ?? "Your partner"} starts the talk.`}>
        Play your partner&apos;s line, then say yours from the meaning cue before you reveal it. Swap roles afterwards.
      </StageIntro>
      <div className={styles.roles} role="group" aria-label="Choose your role">
        {speakers.map((speaker) => (
          <button
            type="button"
            key={speaker}
            aria-pressed={role === speaker}
            className={`${styles.level} ${role === speaker ? styles.levelActive : ""}`}
            onClick={() => restart(speaker)}
          >
            Be {speaker}
          </button>
        ))}
      </div>
      <div className={styles.chat}>
        {practice.lines.slice(0, Math.min(turn + 1, practice.lines.length)).map((line, index) => {
          const mine = line.speaker === role;
          const hidden = mine && index === turn && !revealed;
          return (
            <div key={index} className={`${styles.bubble} ${mine ? styles.mine : ""}`}>
              <b>{mine ? `You (${line.speaker})` : line.speaker}</b>
              {hidden ? (
                <p className={styles.cue}>
                  Your turn: <em>{practice.recallCues[index] ?? line.en}</em>
                </p>
              ) : (
                <p lang="sv">{line.fi}</p>
              )}
              {!hidden && <AudioButton text={line.fi} speaker={voiceFor(line)} label={`Hear ${line.speaker}`} className="icon-button" />}
            </div>
          );
        })}
      </div>
      {finished ? (
        <div className={styles.audioRow}>
          <span className={styles.done}>
            <Check size={16} aria-hidden="true" /> Conversation complete.
          </span>
          {partner && (
            <button type="button" className="secondary" onClick={() => restart(partner)}>
              Swap: be {partner}
            </button>
          )}
          <button type="button" className="text-button" onClick={() => restart()}>
            Again as {role}
          </button>
        </div>
      ) : current.speaker === role && !revealed ? (
        <button type="button" className="secondary" onClick={() => setRevealed(true)}>
          I said it — show the line
        </button>
      ) : (
        <button
          type="button"
          className="secondary"
          onClick={() => {
            setTurn((value) => value + 1);
            setRevealed(false);
          }}
        >
          {turn + 1 < practice.lines.length ? "Next turn →" : "Finish the conversation"}
        </button>
      )}
    </>
  );
}
