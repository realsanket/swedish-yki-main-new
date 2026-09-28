"use client";

import Image from "next/image";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Headphones,
  MessageCircleMore,
  Mic2,
  NotebookPen,
  PencilLine,
  RefreshCw,
  Sparkles,
  Users,
} from "lucide-react";

const characters = [
  {
    name: "Alex",
    role: "The learner",
    image: "/images/onboarding/characters/alex.webp",
    copy: "Alex is building a life in Finland. Curiosity—and the courage to try again—moves the story forward.",
  },
  {
    name: "Aino",
    role: "The friend",
    image: "/images/onboarding/characters/aino.webp",
    copy: "Aino models natural Swedish, but she is a real friend rather than a walking answer key. Sometimes she needs Alex’s help too.",
  },
  {
    name: "Sami",
    role: "The teacher",
    image: "/images/onboarding/characters/sami.webp",
    copy: "Sami explains one useful pattern at a time and treats questions, pauses, and repairs as a normal part of learning.",
  },
  {
    name: "Sara",
    role: "The neighbour",
    image: "/images/onboarding/characters/sara.webp",
    copy: "Sara connects class Swedish to homes, services, work, and the small practical moments of community life.",
  },
  {
    name: "Leo",
    role: "The classmate",
    image: "/images/onboarding/characters/leo.webp",
    copy: "Leo’s plans, journeys, and opinions give the group useful reasons to compare, clarify, and keep a conversation moving.",
  },
] as const;

const modes = [
  {
    name: "Spoken Swedish",
    image: "/images/onboarding/activity-modes/spoken-language.webp",
    copy: "A clearly marked everyday form. An asterisk identifies a spoken-language word when needed.",
    icon: MessageCircleMore,
  },
  {
    name: "Pronunciation",
    image: "/images/onboarding/activity-modes/pronunciation.webp",
    copy: "Listen, notice one sound feature, then repeat at a comfortable pace.",
    icon: Mic2,
  },
  {
    name: "Listening",
    image: "/images/onboarding/activity-modes/listening.webp",
    copy: "Listen first for the situation, then return for one useful detail.",
    icon: Headphones,
  },
  {
    name: "Conversation",
    image: "/images/onboarding/activity-modes/conversation.webp",
    copy: "Use a supported turn, respond naturally, and try the scene again with less help.",
    icon: Users,
  },
  {
    name: "Writing",
    image: "/images/onboarding/activity-modes/writing.webp",
    copy: "Plan a message, write it, use feedback, and make a clearer second version.",
    icon: PencilLine,
  },
  {
    name: "Reading",
    image: "/images/onboarding/activity-modes/reading.webp",
    copy: "Find the purpose first, then locate the words that carry the answer.",
    icon: BookOpen,
  },
  {
    name: "Clinic",
    image: "/images/onboarding/activity-modes/review-clinic.webp",
    copy: "Reconnect earlier skills in a changed situation. Every fifth episode is a cumulative clinic.",
    icon: RefreshCw,
  },
] as const;

const steps = ["Your path", "Your people", "How you practise", "Ready to begin"];

export default function CourseOrientation({
  onExit,
  onBegin,
}: {
  onExit: () => void;
  onBegin: () => void;
}) {
  const [step, setStep] = useState(0);
  const [character, setCharacter] = useState(0);
  const [mode, setMode] = useState(0);

  return (
    <div className="course-space orientation-space">
      <div className="orientation-toolbar">
        <button type="button" className="text-button" onClick={onExit}>
          <ArrowLeft size={17} /> Back to the course
        </button>
        <span>About 4 minutes · Revisit anytime</span>
      </div>

      <header className="orientation-heading">
        <div>
          <p className="eyebrow">INNAN DU BÖRJAR · BEFORE YOU BEGIN</p>
          <h1>Your Swedish has somewhere to go.</h1>
          <p>
            Meet the people, practice modes, and small learning habits that
            connect every Stigen episode.
          </p>
        </div>
        <span className="orientation-not-lesson">
          <Sparkles size={17} /> This tour is not a numbered episode
        </span>
      </header>

      <nav className="orientation-steps" aria-label="Course introduction">
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
          <div className="orientation-path">
            <div className="orientation-copy">
              <span className="orientation-kicker">A0 → B1 · YOUR OWN PACE</span>
              <h2>From first sounds to everyday independence.</h2>
              <p>
                Stigen begins before A1, with sound, survival phrases, and a
                first short conversation. Each chapter returns to familiar
                situations with more language and less support.
              </p>
              <ul className="orientation-checks">
                <li><Check /> Understand one useful pattern.</li>
                <li><Check /> Hear it inside a human moment.</li>
                <li><Check /> Try it with support, then independently.</li>
                <li><Check /> Meet it again in a later clinic.</li>
              </ul>
              <div className="orientation-trust-note">
                Completing the course creates evidence of practice. It does not
                automatically certify a CEFR level or YKI result.
              </div>
            </div>
            <Image
              src="/images/onboarding/orientation/course-journey.webp"
              alt="An illustrated journey from first Swedish words to confident everyday communication"
              width={1024}
              height={1024}
              priority
            />
          </div>
        )}

        {step === 1 && (
          <div className="orientation-people">
            <div className="orientation-cast-visual">
              <Image
                src="/images/onboarding/characters/stigen-cast.webp"
                alt="Alex, Aino, Sami, Sara, and Leo learning together"
                width={1536}
                height={1024}
              />
            </div>
            <div className="orientation-copy">
              <span className="orientation-kicker">ONE CONNECTED STORY</span>
              <h2>Language arrives because someone needs it.</h2>
              <p>
                The five recurring characters carry the course from the first
                classroom meeting into homes, cafés, work, travel, services,
                and community life.
              </p>
              <aside className="orientation-book-note">
                <BookOpen size={18} aria-hidden="true" />
                <p>
                  The supplied classroom notes and books shaped the progression,
                  but their pages are not reproduced here. Every Stigen scene,
                  prompt, and answer is newly written for this course.
                </p>
              </aside>
              <div
                className="character-picker"
                role="group"
                aria-label="Meet the cast"
              >
                {characters.map((item, index) => (
                  <button
                    type="button"
                    key={item.name}
                    className={character === index ? "active" : ""}
                    aria-pressed={character === index}
                    onClick={() => setCharacter(index)}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
              <article className="character-focus">
                <Image
                  src={characters[character].image}
                  alt={`Portrait of ${characters[character].name}`}
                  width={520}
                  height={520}
                />
                <div>
                  <span>{characters[character].role}</span>
                  <h3>{characters[character].name}</h3>
                  <p>{characters[character].copy}</p>
                </div>
              </article>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="orientation-practice">
            <div className="orientation-copy">
              <span className="orientation-kicker">A CONSISTENT VISUAL LANGUAGE</span>
              <h2>Know what kind of practice comes next.</h2>
              <p>
                Select a mode to see its purpose. The same visual cue returns
                throughout the course, so attention stays on the Swedish.
              </p>
              <div
                className="mode-picker"
                role="group"
                aria-label="Practice modes"
              >
                {modes.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <button
                      type="button"
                      key={item.name}
                      className={mode === index ? "active" : ""}
                      aria-pressed={mode === index}
                      onClick={() => setMode(index)}
                    >
                      <Icon size={18} /> {item.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <article className="mode-focus">
              <Image
                src={modes[mode].image}
                alt={`${modes[mode].name} practice illustration`}
                width={720}
                height={720}
              />
              <div>
                <span>YOU WILL</span>
                <h3>{modes[mode].name}</h3>
                <p>{modes[mode].copy}</p>
              </div>
            </article>
          </div>
        )}

        {step === 3 && (
          <div className="orientation-ready">
            <div className="register-card">
              <Image
                src="/images/onboarding/orientation/standard-vs-spoken.webp"
                alt="Two friendly conversation styles representing standard and spoken Swedish"
                width={1024}
                height={1024}
              />
              <div>
                <span className="orientation-kicker">TWO USEFUL REGISTERS</span>
                <h2>Clear standard Swedish. Clearly marked everyday Swedish.</h2>
                <div className="register-examples">
                  <p><span>STANDARD</span><b lang="sv">Jag är Alex.</b><small>I am Alex.</small></p>
                  <p><span>CONVERSATION</span><b lang="sv">Ja e Alex.*</b><small>I’m Alex.</small></p>
                </div>
                <p className="help-text">
                  Spoken forms are introduced when they help you understand real
                  conversations. They never silently replace the standard form.
                </p>
              </div>
            </div>

            <div className="orientation-tools-card">
              <div>
                <span className="orientation-kicker">YOUR LEARNING TOOLS</span>
                <h2>Keep the useful parts close.</h2>
                <ul>
                  <li><NotebookPen /> Save notes and follow-up writing in your notebook.</li>
                  <li><BookOpen /> Revisit words through spaced recall in the word bank.</li>
                  <li><RefreshCw /> Use clinics to reconnect skills in a new situation.</li>
                </ul>
              </div>
              <Image
                src="/images/onboarding/orientation/learning-tools.webp"
                alt="A notebook, word cards, and connected learning tools"
                width={1024}
                height={1024}
              />
            </div>

            <div className="orientation-setting-card">
              <Image
                src="/images/onboarding/orientation/finland-setting.webp"
                alt="Alex and Sara walking through an everyday Helsinki neighbourhood"
                width={1672}
                height={941}
              />
              <div>
                <span className="orientation-kicker">A REAL EVERYDAY SETTING</span>
                <h2>Finland is part of the story—not a list to memorise.</h2>
                <p>
                  Places, transport, weather, services, and local routines appear
                  when the characters need them. Cultural context always serves a
                  practical language goal.
                </p>
              </div>
            </div>

            <div className="orientation-finish">
              <div>
                <span className="eyebrow">FIRST STOP</span>
                <h2>Greet, introduce yourself, and hear Swedish clearly.</h2>
                <p>Begin with the nine vowel letters, long and short sounds, and the rhythm of a useful first conversation.</p>
              </div>
              <button
                type="button"
                className="primary lime"
                onClick={onBegin}
              >
                Begin Episode 1 <ArrowRight size={18} />
              </button>
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
          <button type="button" className="text-button" onClick={onExit}>
            Return to the syllabus
          </button>
        )}
      </footer>
    </div>
  );
}
