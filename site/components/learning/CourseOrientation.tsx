"use client";

import Image from "next/image";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Ear,
  Headphones,
  Mic2,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import AudioButton from "./AudioButton";

const characters = [
  {
    name: "Alex",
    role: "The learner",
    image: "/images/onboarding/characters/alex.webp",
    copy: "Alex makes the first attempt: greeting someone and building four simple lines about himself.",
    sv: "Hej! Jag heter Alex.",
    en: "Hello! My name is Alex.",
  },
  {
    name: "Aino",
    role: "The conversation partner",
    image: "/images/onboarding/characters/aino.webp",
    copy: "Aino gives the language a purpose. She listens, replies naturally, and keeps the first conversation moving.",
    sv: "Hej Alex! Vad heter du?",
    en: "Hello Alex! What is your name?",
  },
  {
    name: "Sami",
    role: "The teacher",
    image: "/images/onboarding/characters/sami.webp",
    copy: "Sami slows down one sound idea at a time, then sends the language straight back into the conversation.",
    sv: "Lyssna först. Försök sedan själv.",
    en: "Listen first. Then try it yourself.",
  },
] as const;

const practiceLoop = [
  {
    name: "Listen",
    cue: "01",
    image: "/images/onboarding/activity-modes/listening.webp",
    copy: "Hear the whole exchange once. Your first job is only to understand who is speaking and why.",
    icon: Headphones,
  },
  {
    name: "Notice",
    cue: "02",
    image: "/images/onboarding/activity-modes/pronunciation.webp",
    copy: "Focus on one feature: a vowel shape, vowel length, or a consonant that becomes soft.",
    icon: Search,
  },
  {
    name: "Speak",
    cue: "03",
    image: "/images/onboarding/activity-modes/conversation.webp",
    copy: "Use the line with support, then say your own version without reading every word.",
    icon: Mic2,
  },
  {
    name: "Check",
    cue: "04",
    image: "/images/onboarding/activity-modes/review-clinic.webp",
    copy: "Retrieve the important phrase once more before moving on. A small check makes the practice stick.",
    icon: Check,
  },
] as const;

const steps = ["Lesson map", "Your people", "How it works"];

export default function CourseOrientation({
  onExit,
  onBegin,
}: {
  onExit: () => void;
  onBegin: () => void;
}) {
  const [step, setStep] = useState(0);
  const [practice, setPractice] = useState(0);

  return (
    <div className="course-space orientation-space">
      <div className="orientation-toolbar">
        <button type="button" className="text-button" onClick={onExit}>
          <ArrowLeft size={17} /> Back to the course
        </button>
        <span>About 2 minutes · Revisit anytime</span>
      </div>

      <header className="orientation-heading">
        <div>
          <p className="eyebrow">INNAN DU BÖRJAR · BEFORE YOU BEGIN</p>
          <h1>Your first Swedish lesson has one clear destination.</h1>
          <p>
            Meet the opening conversation, the three people around it, and the
            simple practice loop used throughout Lecture 1.
          </p>
        </div>
        <span className="orientation-not-lesson">
          <Sparkles size={17} /> Prepares Lecture 1 · no progress recorded
        </span>
      </header>

      <nav className="orientation-steps" aria-label="Lesson 1 introduction">
        {steps.map((label, index) => (
          <button
            type="button"
            key={label}
            aria-current={step === index ? "step" : undefined}
            className={step === index ? "active" : ""}
            onClick={() => setStep(index)}
          >
            <span>{index + 1}</span>
            {label}
          </button>
        ))}
      </nav>

      <section className="orientation-stage" aria-live="polite">
        {step === 0 && (
          <div className="orientation-lesson-map">
            <Image
              src="/images/story/chapters/chapter-01-first-class.webp"
              alt="Alex arriving for his first Swedish class with Aino and Sami"
              fill
              sizes="(max-width: 1180px) 100vw, 1180px"
              priority
            />
            <div className="orientation-lesson-copy">
              <span className="orientation-kicker">
                LECTURE 1 · FIRST CONVERSATION
              </span>
              <h2>Start with four lines you can use immediately.</h2>
              <p>
                You will not memorise a page of rules first. You will meet the
                language inside a short classroom conversation, then learn how
                its sounds work.
              </p>
              <div className="orientation-model-card">
                <span>BUILD YOUR OWN VERSION</span>
                <p lang="sv">Hej! Jag heter <b>___</b>.</p>
                <p lang="sv">Jag bor i Finland.</p>
                <p lang="sv">Jag kommer från <b>___</b>.</p>
                <p lang="sv">Jag talar <b>___</b>.</p>
              </div>
            </div>
            <div className="orientation-lesson-sequence" aria-label="Lesson 1 map">
              <div><span>01</span><p><b>Meet</b>Hear the first conversation</p></div>
              <div><span>02</span><p><b>Build</b>Make the four lines yours</p></div>
              <div><span>03</span><p><b>Hear</b>Work with vowels and sound changes</p></div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="orientation-cast">
            <header>
              <div>
                <span className="orientation-kicker">A SMALL, USEFUL CAST</span>
                <h2>Each person has one teaching job.</h2>
                <p>
                  The same three people keep the opening scene easy to follow:
                  one learner, one conversation partner, and one teacher.
                </p>
              </div>
              <aside className="orientation-book-note">
                <BookOpen size={18} aria-hidden="true" />
                <p>
                  The source dialogue defines the language focus. Stigen uses
                  an original cast and newly written practice around it.
                </p>
              </aside>
            </header>
            <div className="orientation-cast-grid">
              {characters.map((item) => (
                <article key={item.name}>
                  <Image
                    src={item.image}
                    alt={`Portrait of ${item.name}`}
                    width={520}
                    height={520}
                  />
                  <div>
                    <span>{item.role}</span>
                    <h3>{item.name}</h3>
                    <p>{item.copy}</p>
                    <div className="orientation-character-voices" aria-label={`${item.name} voice previews`}>
                      <AudioButton
                        text={item.sv}
                        speaker={item.name}
                        language="sv"
                        label="Svenska"
                        className="orientation-voice-button"
                      />
                      <AudioButton
                        text={item.en}
                        speaker={item.name}
                        language="en"
                        label="English"
                        className="orientation-voice-button"
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="orientation-method">
            <div className="orientation-practice">
              <div className="orientation-copy">
                <span className="orientation-kicker">ONE REPEATABLE LOOP</span>
                <h2>Do one learning job at a time.</h2>
                <p>
                  Lecture 1 always tells you what to focus on. Select each step
                  to preview the rhythm of the lesson.
                </p>
                <div
                  className="mode-picker orientation-loop-picker"
                  role="group"
                  aria-label="Lesson practice loop"
                >
                  {practiceLoop.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <button
                        type="button"
                        key={item.name}
                        className={practice === index ? "active" : ""}
                        aria-pressed={practice === index}
                        onClick={() => setPractice(index)}
                      >
                        <span>{item.cue}</span><Icon size={18} /> {item.name}
                      </button>
                    );
                  })}
                </div>
                <div className="orientation-sound-scope">
                  <Ear size={19} aria-hidden="true" />
                  <p>
                    <b>Sound focus:</b> the nine vowel letters, long and short
                    vowels, and soft G, K, and SK before front vowels.
                  </p>
                </div>
              </div>
              <article className="mode-focus">
                <Image
                  src={practiceLoop[practice].image}
                  alt={`${practiceLoop[practice].name} practice illustration`}
                  width={720}
                  height={720}
                />
                <div>
                  <span>STEP {practiceLoop[practice].cue}</span>
                  <h3>{practiceLoop[practice].name}</h3>
                  <p>{practiceLoop[practice].copy}</p>
                </div>
              </article>
            </div>
            <div className="orientation-finish">
              <div>
                <span className="eyebrow">YOUR FIRST TARGET</span>
                <h2><span lang="sv">Vad heter du?</span> — answer in your own voice.</h2>
                <p>The lesson supplies the words, sound help, and several chances to try again.</p>
              </div>
              <Users size={34} aria-hidden="true" />
            </div>
          </div>
        )}
      </section>

      <footer className="orientation-actions">
        <button
          type="button"
          className="secondary"
          onClick={() => (step === 0 ? onExit() : setStep(step - 1))}
        >
          <ArrowLeft size={17} /> {step === 0 ? "Back to course" : "Previous"}
        </button>
        {step < steps.length - 1 ? (
          <button
            type="button"
            className="primary"
            onClick={() => setStep((current) => current + 1)}
          >
            Continue <ArrowRight size={17} />
          </button>
        ) : (
          <button type="button" className="primary lime" onClick={onBegin}>
            Begin Lecture 1 <ArrowRight size={18} />
          </button>
        )}
      </footer>
    </div>
  );
}
