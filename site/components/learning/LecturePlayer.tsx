"use client";
/* Browser recovery storage is hydrated after SSR; a single client render is intentional. */
/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AudioLines,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Lightbulb,
  Loader2,
  NotebookPen,
  Save,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  COURSE_PARTS,
  lectures,
  routeProfileForLecture,
  type CourseLecture,
  type CoursePart,
} from "@/lib/course";
import {
  checkpointResult,
  defaultCourseLectureState,
  questionIsCorrect,
  questionsAttempted,
  type CourseDraftPatch,
  type CourseLectureState,
} from "@/lib/course-progress";
import { bookReviewsForAnchorEpisode } from "@/lib/book-reviews";
import type { Skill } from "@/lib/curriculum";
import { storyChapterForModule } from "@/lib/story-world";
import { getYkiMock, parseYkiTargetedReturn } from "@/lib/yki-mocks";
import type { SaveCourse } from "./useCourse";
import AudioButton from "./AudioButton";
import A0TeachingCompanion from "./A0TeachingCompanion";
import BookConnection from "./BookConnection";
import BookReviewBridge from "./BookReviewBridge";
import PracticeStudio from "./PracticeStudio";
import QuestionCard from "./QuestionCard";
import EpisodeBrief from "./EpisodeBrief";
import StoryScene from "./StoryScene";
import { StoryAvatar } from "./StoryAvatar";
import YkiMockFlow from "./YkiMockFlow";
import YkiWorkshopFirstAttempt from "./YkiWorkshopFirstAttempt";

type Props = {
  lecture: CourseLecture;
  state?: CourseLectureState;
  userId: string;
  save: SaveCourse;
  resolveConflict: (id: string) => void;
  onExit: () => void;
  onNext: () => void;
  last: boolean;
  onPracticeSaved: () => void;
  onOpenChapterReview: (chapterNumber: number) => void;
};

const questionAction: Partial<Record<CoursePart, string>> = {
  recall: "Try before you look back. A missed item tells you exactly what to return to; it is not a grade.",
  guided: "Use the hint only when you need it. Build one useful line, then make it personal in the next step.",
  check: "Check the important pieces, then make one small change and try the message again.",
};

function actionLabel(part: CoursePart, profile: ReturnType<typeof routeProfileForLecture>) {
  if (part === "recall") return profile.id === "clinic" ? "Save my first attempt" : "Check my warm-up";
  if (part === "teach") return profile.id.includes("yki") ? "I completed the first attempt" : "I listened and noticed";
  if (part === "guided") return "Check my built line";
  if (part === "practice") return profile.id === "standard" ? "Save my response" : "Save this attempt";
  if (part === "check")
    return profile.id === "yki-mock"
      ? "Save my next drill"
      : profile.id === "standard"
        ? "Keep my retry"
        : "Save this check";
  return "Save for later";
}

function outputLabel(skill: Skill) {
  return skill === "speaking" ? "Say" : skill === "writing" ? "Write" : skill === "listening" ? "Listen" : "Read";
}

function skillLabel(skill: Skill | null) {
  if (skill === "listening") return "Listening";
  if (skill === "reading") return "Reading";
  if (skill === "speaking") return "Speaking";
  if (skill === "writing") return "Writing";
  return "Earlier saved plan";
}

function ActionRibbon({ children }: { children: string }) {
  return (
    <div className="part-action-ribbon">
      <Lightbulb size={18} aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}

function profileAttemptPrompt(lecture: CourseLecture, primarySkill: Skill) {
  return primarySkill === "writing"
    ? lecture.writing.prompt
    : lecture.speaking.prompt;
}

function profileRouteGuidance(profile: ReturnType<typeof routeProfileForLecture>) {
  if (profile.id === "clinic")
    return "Make a short independent attempt first. You will return to the same purpose with one changed detail after focused feedback.";
  if (profile.id === "checkpoint")
    return "Work independently first. This keeps evidence for each skill separate and helps you choose one useful repair.";
  if (profile.id === "yki-workshop")
    return "Use the stated time. Work without a model first, then use one strategy on fresh material.";
  if (profile.id === "yki-mock")
    return "Set realistic conditions, work independently, and diagnose the four skills separately afterwards. This is practice, not certification.";
  return "Try the useful action first; support is here when it helps you complete the task.";
}

function ykiReceptiveStageComplete(
  raw: string | undefined,
  tasks: ReadonlyArray<{ id: string; questions: ReadonlyArray<{ id: string }> }>,
) {
  if (!raw) return false;
  try {
    const evidence = JSON.parse(raw) as { kind?: unknown; checked?: unknown; answers?: unknown };
    const checked = Array.isArray(evidence.checked)
      ? evidence.checked.filter((item): item is string => typeof item === "string")
      : [];
    const answers =
      evidence.answers &&
      typeof evidence.answers === "object" &&
      !Array.isArray(evidence.answers)
        ? (evidence.answers as Record<string, unknown>)
        : null;
    return (
      evidence.kind === "yki-receptive" &&
      !!answers &&
      tasks.every(
        (task) =>
          checked.includes(task.id) &&
          task.questions.every(
            (question) => {
              const answer = answers[question.id];
              return typeof answer === "string" && answer.trim().length > 0;
            },
          ),
      )
    );
  } catch {
    return false;
  }
}

function mergePatch(
  a: CourseDraftPatch,
  b: CourseDraftPatch,
): CourseDraftPatch {
  return {
    ...a,
    ...b,
    ...(a.answers || b.answers
      ? { answers: { ...a.answers, ...b.answers } }
      : {}),
    ...(a.drafts || b.drafts ? { drafts: { ...a.drafts, ...b.drafts } } : {}),
  };
}
export default function LecturePlayer({
  lecture,
  state = defaultCourseLectureState(),
  userId,
  save,
  resolveConflict,
  onExit,
  onNext,
  last,
  onPracticeSaved,
  onOpenChapterReview,
}: Props) {
  const chapter = storyChapterForModule(lecture.module);
  const routeProfile = routeProfileForLecture(lecture);
  const route = lecture.route;
  const ykiMock = routeProfile.id === "yki-mock" ? getYkiMock(lecture.number) : undefined;
  const ykiWorkshop = routeProfile.id === "yki-workshop";
  // The first workshop task is receptive in 56/57, then productive in 58.
  // Store its evidence under the skill the learner actually used; otherwise a
  // listening summary could accidentally become a speaking retry draft.
  const workshopFirstAttemptSkill: Skill =
    lecture.number === 56
      ? "listening"
      : lecture.number === 57
        ? "reading"
        : route.primarySkill;
  // Before the workshop gained separate receptive first-attempt fields,
  // episodes 56 and 57 used their ordinary productive primary-skill draft.
  // Keep that work visible rather than treating it as a missing attempt.
  const legacyWorkshopFirstAttemptSkill =
    ykiWorkshop && workshopFirstAttemptSkill !== route.primarySkill
      ? route.primarySkill
      : undefined;
  const previousLecture = lectures.find(
    (item) => item.number === lecture.number - 1,
  );
  const chapterReviews = bookReviewsForAnchorEpisode(lecture.number);
  const requiresIndependentFirstAttempt =
    routeProfile.id === "clinic" || routeProfile.id === "checkpoint";
  const [part, setPart] = useState<CoursePart>(state.part),
    [answers, setAnswers] = useState(state.answers),
    [notes, setNotes] = useState(state.notes),
    [assignment, setAssignment] = useState(state.assignment),
    [drafts, setDrafts] = useState(state.drafts),
    [skill, setSkill] = useState<Skill>(route.primarySkill);
  const [checked, setChecked] = useState<Partial<Record<CoursePart, boolean>>>(
      {},
    ),
    [saving, setSaving] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [dirty, setDirty] = useState(false),
    [recovered, setRecovered] = useState(false),
    [hydrated, setHydrated] = useState(false),
    [sectionIdx, setSectionIdx] = useState(0);
  const pending = useRef<CourseDraftPatch>({});
  const flyingPatch = useRef<CourseDraftPatch>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alive = useRef(true);
  const inflight = useRef<Promise<void> | null>(null);
  const mounted = useRef(false);
  const storageKey = `stigen:lecture-recovery:${encodeURIComponent(userId)}:${lecture.id}`;
  const backup = useCallback(() => {
    try {
      const combined = mergePatch(flyingPatch.current, pending.current);
      if (Object.keys(combined).length)
        sessionStorage.setItem(storageKey, JSON.stringify(combined));
      else sessionStorage.removeItem(storageKey);
    } catch {
      /* Server persistence remains authoritative. */
    }
  }, [storageKey]);
  const flush = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (inflight.current) {
      await inflight.current;
    }
    if (!Object.keys(pending.current).length) return;
    const patch = pending.current;
    pending.current = {};
    flyingPatch.current = patch;
    backup();
    if (alive.current) {
      setSaving(true);
      setError("");
    }
    // Keep an emergency tab copy until the server acknowledges the save.
    const request = save(lecture.id, { action: "saveDraft", patch })
      .then(() => {
        flyingPatch.current = {};
        backup();
        if (alive.current) setDirty(!!Object.keys(pending.current).length);
      })
      .catch((cause) => {
        pending.current = mergePatch(patch, pending.current);
        flyingPatch.current = {};
        backup();
        if (alive.current) {
          setDirty(true);
          setError(
            cause instanceof Error
              ? cause.message
              : "Your changes could not be saved.",
          );
        }
        throw cause;
      })
      .finally(() => {
        inflight.current = null;
        if (alive.current) setSaving(false);
      });
    inflight.current = request;
    await request;
  }, [save, lecture.id, backup]);
  function queue(patch: CourseDraftPatch) {
    pending.current = mergePatch(pending.current, patch);
    backup();
    setDirty(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void flush().catch(() => {});
    }, 750);
  }
  useEffect(() => {
    alive.current = true;
    if (!mounted.current) {
      mounted.current = true;
      try {
        const raw = sessionStorage.getItem(storageKey);
        if (raw) {
          const patch = JSON.parse(raw) as CourseDraftPatch;
          const clean: CourseDraftPatch = {};
          if (typeof patch.notes === "string")
            clean.notes = patch.notes.slice(0, 5000);
          if (typeof patch.assignment === "string")
            clean.assignment = patch.assignment.slice(0, 5000);
          if (patch.answers && typeof patch.answers === "object")
            clean.answers = Object.fromEntries(
              Object.entries(patch.answers).filter(
                ([id, value]) =>
                  typeof value === "string" &&
                  [
                    ...lecture.recall,
                    ...lecture.guided,
                    ...lecture.checkpoint,
                  ].some((q) => q.id === id),
              ),
            );
          if (patch.drafts && typeof patch.drafts === "object")
            clean.drafts = Object.fromEntries(
              Object.entries(patch.drafts).filter(
                ([key, value]) =>
                  ["listening", "reading", "speaking", "writing"].includes(
                    key,
                  ) && typeof value === "string",
              ),
            );
          if (Object.keys(clean).length) {
            pending.current = clean;
            if (clean.notes !== undefined) setNotes(clean.notes);
            if (clean.assignment !== undefined) setAssignment(clean.assignment);
            if (clean.answers) setAnswers((a) => ({ ...a, ...clean.answers }));
            if (clean.drafts) setDrafts((d) => ({ ...d, ...clean.drafts }));
            setDirty(true);
            setRecovered(true);
          }
        }
      } catch {
        /* Ignore malformed emergency copies. */
      }
    }
    setHydrated(true);
    const warn = (e: BeforeUnloadEvent) => {
      if (Object.keys(pending.current).length || inflight.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      alive.current = false;
      window.removeEventListener("beforeunload", warn);
      if (timer.current) clearTimeout(timer.current);
      void flush().catch(() => {});
    };
    // Hydrate once per keyed lecture. Server revisions must never replace an unsaved local draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lecture.id, storageKey, flush]);
  const changeDraftForSkill = useCallback(
    (draftSkill: Skill, value: string) => {
      setDrafts((d) => ({ ...d, [draftSkill]: value }));
      pending.current = mergePatch(pending.current, {
        drafts: { [draftSkill]: value },
      });
      backup();
      setDirty(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        void flush().catch(() => {});
      }, 750);
    },
    [backup, flush],
  );
  const changeDraft = useCallback(
    (value: string) => changeDraftForSkill(skill, value),
    [changeDraftForSkill, skill],
  );
  function preview(next: CoursePart) {
    // Free navigation: learner can jump to any step at any time. Completion is
    // tracked separately (state.completedParts) so a peek does not affect
    // progress.
    setPart(next);
    setChecked((c) => ({ ...c, [next]: false }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function leave(action: () => void) {
    setBusy(true);
    try {
      await flush();
      action();
    } catch {
    } finally {
      setBusy(false);
    }
  }
  async function complete() {
    if (state.completedParts.includes(part) && partIndex < 5) {
      preview(COURSE_PARTS[partIndex + 1]);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await flush();
      const result = await save(lecture.id, {
        action: "completePart",
        part,
        ...(part !== "practice"
          ? { acknowledged: true as const }
          : {}),
      });
      setPart(result.lectures[lecture.id].part);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Please try saving again.",
      );
    } finally {
      setBusy(false);
    }
  }
  const partIndex = COURSE_PARTS.indexOf(part);
  const earlierDone = COURSE_PARTS.slice(0, partIndex).every((p) =>
    state.completedParts.includes(p),
  );
  const questions =
    part === "recall"
      ? lecture.recall
      : part === "guided"
        ? lecture.guided
        : lecture.checkpoint;
  const result = checkpointResult(questions, answers);
  const allQuestionsAttempted = questionsAttempted(questions, answers);
  const firstAttempt = drafts[route.primarySkill]?.trim() ?? "";
  const hasIndependentFirstAttempt = firstAttempt.length >= 2;
  const currentWorkshopFirstAttempt =
    drafts[workshopFirstAttemptSkill]?.trim() ?? "";
  const legacyWorkshopFirstAttempt = legacyWorkshopFirstAttemptSkill
    ? drafts[legacyWorkshopFirstAttemptSkill]?.trim() ?? ""
    : "";
  const workshopFirstAttempt =
    currentWorkshopFirstAttempt || legacyWorkshopFirstAttempt;
  const workshopFirstAttemptValue = currentWorkshopFirstAttempt
    ? drafts[workshopFirstAttemptSkill] ?? ""
    : legacyWorkshopFirstAttemptSkill
      ? drafts[legacyWorkshopFirstAttemptSkill] ?? ""
      : "";
  const workshopFirstAttemptUsesLegacy =
    !currentWorkshopFirstAttempt && !!legacyWorkshopFirstAttempt;
  const hasWorkshopFirstAttempt =
    ykiWorkshop && workshopFirstAttempt.length >= 2;
  const practiceDone = route.requiredSkills.every((s) => state.practice[s]);
  const mockListeningComplete = ykiMock
    ? ykiReceptiveStageComplete(
        drafts.listening,
        ykiMock.listening,
      )
    : false;
  const mockReadingComplete = ykiMock
    ? ykiReceptiveStageComplete(
        drafts.reading,
        ykiMock.reading,
      )
    : false;
  const mockTargetedReturn = ykiMock
    ? parseYkiTargetedReturn(assignment)
    : null;
  const canContinue = (() => {
    if (state.completedParts.includes(part)) return true;
    if (!earlierDone) return false;
    if (part === "recall")
      return (
        (!questions.length || allQuestionsAttempted) &&
        (!questions.length || !!checked.recall) &&
        (!requiresIndependentFirstAttempt || hasIndependentFirstAttempt)
      );
    if (part === "teach") {
      if (ykiMock) return mockListeningComplete;
      return !ykiWorkshop || hasWorkshopFirstAttempt;
    }
    if (part === "guided")
      return ykiMock ? mockReadingComplete : allQuestionsAttempted && !!checked.guided;
    if (part === "practice") return practiceDone;
    if (part === "check")
      return ykiMock
        ? practiceDone && !!mockTargetedReturn
        : allQuestionsAttempted && !!checked.check;
    return true;
  })();
  const savePracticeAttempt = useCallback(
    async (
      attemptSkill: Skill,
      score: number | null,
      minutes: number,
      attemptId = crypto.randomUUID(),
    ) => {
      try {
        setError("");
        await flush();
        await save(lecture.id, {
          action: "completePractice",
          skill: attemptSkill,
          score,
          minutes: Math.max(1, Math.min(60, Math.round(minutes))),
          attemptId,
        });
        onPracticeSaved();
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Practice could not be saved.",
        );
        throw cause;
      }
    },
    [flush, lecture.id, onPracticeSaved, save],
  );
  const lectureStep = (step: (typeof routeProfile.steps)[number]) => {
    // Episode 1 begins with a model conversation, not a test of material the
    // learner has never met. The two questions only check meaning afterwards.
    if (lecture.number === 1 && step.part === "recall")
      return {
        ...step,
        label: "Hear the conversation",
        description: `Listen first, open the text, then answer ${lecture.recall.length} simple meaning checks.`,
      };
    if (lecture.number === 1 && step.part === "teach")
      return {
        ...step,
        label: "Build it step by step",
        description: "One small card at a time: useful line, mouth cue, sound clue, quick try.",
      };
    return step;
  };
  const activeStep = lectureStep(routeProfile.steps[partIndex]);
  const routeStepButtons = (mobile = false) =>
    routeProfile.steps.map((original, index) => {
      const step = lectureStep(original);
      const completed = state.completedParts.includes(step.part);
      const selected = step.part === part;
      return (
        <button
          type="button"
          key={step.part}
          className={[
            selected ? "selected" : "",
            completed ? "completed" : "",
            mobile ? "mobile-step" : "",
          ].filter(Boolean).join(" ")}
          aria-current={selected ? "step" : undefined}
          aria-label={`Step ${index + 1}: ${step.label}, about ${step.minutes} minutes${completed ? ", completed" : ""}`}
          onClick={() => preview(step.part)}
        >
          <span className="route-step-status" aria-hidden="true">
            {completed ? <Check size={15} /> : index + 1}
          </span>
          <span className="route-step-copy">
            <b>{step.label}</b>
            <small>{step.minutes} min · {step.description}</small>
          </span>
        </button>
      );
    });
  return (
    <div className={`course-space lecture-workspace ${lecture.number === 1 ? "lesson-one-workspace" : ""}`}>
      <div className="lecture-toolbar">
        <button
          type="button"
          className="text-button"
          disabled={busy}
          onClick={() => leave(onExit)}
        >
          <ArrowLeft size={16} />
          Course syllabus
        </button>
        <span
          className={"save-indicator " + (error ? "has-error" : "")}
          aria-live="polite"
        >
          {saving ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Saving…
            </>
          ) : error ? (
            "Save needs attention"
          ) : dirty ? (
            "Unsaved changes"
          ) : state.revision ? (
            <>
              <Check size={14} />
              Saved to your course
            </>
          ) : (
            "Your work saves as you go"
          )}
        </span>
      </div>
      <header className="lecture-title story-episode-title">
        <EpisodeBrief
          lecture={lecture}
          chapter={chapter}
          previousTitle={previousLecture?.title}
        />
        <div className="lecture-progress-line">
          <span className="episode-route-label">
            {routeProfile.label.toUpperCase()}
          </span>
          <Progress
            value={(state.completedParts.length / COURSE_PARTS.length) * 100}
            aria-label={`Episode ${lecture.number} completion`}
          />
          <span>
            {state.completedParts.length}/{COURSE_PARTS.length} steps complete · about {lecture.minutes} minutes, split as needed
          </span>
        </div>
      </header>
      <div className="lecture-layout">
        <aside className="lecture-outline episode-route-panel">
          <div className="episode-route-panel-heading">
            <p className="eyebrow lecture-outline-label">TODAY’S ROUTE</p>
            <p>Step {partIndex + 1} of {COURSE_PARTS.length} · about {activeStep.minutes} min</p>
          </div>
          <nav aria-label={`Episode ${lecture.number} learning route`}>
            {routeStepButtons()}
          </nav>
          <div className="route-current-task">
            <span className="eyebrow">EXPECTED OUTPUT</span>
            <b>{outputLabel(route.primarySkill)} one useful response</b>
            <p>{route.expectedOutput}</p>
          </div>
          <div className="route-success-checks">
            <span className="eyebrow">WHAT COUNTS</span>
            <ul>
              {route.successChecks.slice(0, 3).map((check) => (
                <li key={check}>{check}</li>
              ))}
            </ul>
          </div>
          <p className="help-text">Completed steps are safe to revisit. Your saved resume point stays where it is.</p>
        </aside>
        <div className="lecture-page">
          <div className="part-heading">
            <p className="eyebrow">
              STEP {partIndex + 1} OF {COURSE_PARTS.length} · ABOUT {activeStep.minutes} MINUTES
            </p>
            <h2>{activeStep.label}</h2>
            <p>{activeStep.description}</p>
            <div className="step-contract">
              <span>YOUR ACTION</span>
              <p>{part === "practice" ? route.expectedOutput : activeStep.description}</p>
            </div>
          </div>
          <details className="mobile-route-drawer">
            <summary>
              <span>Step {partIndex + 1} of {COURSE_PARTS.length}</span>
              <small>{activeStep.minutes} min · All steps</small>
            </summary>
            <nav aria-label={`All steps for episode ${lecture.number}`}>
              {routeStepButtons(true)}
            </nav>
          </details>
          <details className="route-support-dock">
            <summary>Support when you choose it <small>English · text support · slow audio · hints · grammar note · model</small></summary>
            <div>
              <p><b>Try first.</b> Then open the support you need: English and text support in the scene, slow audio on listening controls, hints in questions, and a model after your own response.</p>
              <p>There is no microphone requirement. You can always speak aloud and type what you said.</p>
            </div>
          </details>
          <p className="profile-route-guidance">
            {profileRouteGuidance(routeProfile)}
          </p>
          {recovered && (
            <div className="course-note">
              <Save size={18} />
              <p>
                A draft from this tab was recovered.{" "}
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    resolveConflict(lecture.id);
                    void flush()
                      .then(() => setRecovered(false))
                      .catch(() => {});
                  }}
                >
                  Save recovered work
                </button>
              </p>
            </div>
          )}
          {error && (
            <div className="lecture-error" role="alert">
              <p>{error}</p>
              <button
                className="secondary"
                disabled={busy || saving}
                onClick={() => {
                  resolveConflict(lecture.id);
                  setError("");
                  void flush().catch(() => {});
                }}
              >
                Save my draft
              </button>
              <button
                className="text-button"
                onClick={() => {
                  pending.current = {};
                  if (timer.current) clearTimeout(timer.current);
                  try {
                    sessionStorage.removeItem(storageKey);
                  } catch {}
                  window.location.reload();
                }}
              >
                Reload saved version
              </button>
            </div>
          )}
          {part === "recall" && (
            <>
              <div className="teacher-note">
                <Lightbulb size={22} />
                <div>
                  <h3>
                    {lecture.number === 1
                      ? "First hear how the language is used"
                      : "Before you look back…"}
                  </h3>
                  <p>
                    {lecture.number === 1
                      ? "Do not memorise a rule list yet. Listen once, reveal the Swedish and English only when you need them, then copy one line aloud."
                      : "Try remembering without opening your notes. If you get stuck, the hint and explanation will help. This warm-up is not graded."}
                  </p>
                </div>
              </div>
              {lecture.number === 1 && lecture.dialogue && (
                <StoryScene
                  dialogue={lecture.dialogue}
                  chapter={chapter}
                  eyebrow="START WITH THE STORY"
                  title="Meet Aino and Alex"
                  instructions="Listen once, follow the visible Swedish, and copy one line. Open English only when a line is unclear."
                  initiallyOpen
                />
              )}
              {ykiMock && (
                <section className="mock-conditions-card">
                  <span className="eyebrow">SET CONDITIONS · {ykiMock.totalMinutes} MINUTES</span>
                  <h3>{ykiMock.title}</h3>
                  <p>{ykiMock.originalPracticeNotice}</p>
                  <ul>
                    {ykiMock.conditions.map((condition) => (
                      <li key={condition}>{condition}</li>
                    ))}
                  </ul>
                  <div>
                    {ykiMock.timing.map((block) => (
                      <span key={block.id}>{block.label} · {block.minutes} min</span>
                    ))}
                  </div>
                </section>
              )}
              <div className="course-questions">
                {questionAction.recall && (
                  <ActionRibbon>
                    {lecture.number === 1
                      ? "Use the conversation you just heard. These two checks are about meaning, not pronunciation or grammar."
                      : questionAction.recall}
                  </ActionRibbon>
                )}
                {questions.map((q, i) => (
                  <QuestionCard
                    key={q.id}
                    id={q.id}
                    prompt={q.prompt}
                    options={q.options}
                    value={answers[q.id] ?? ""}
                    onChange={(v) => {
                      setAnswers((a) => ({ ...a, [q.id]: v }));
                      queue({ answers: { [q.id]: v } });
                      setChecked((c) => ({ ...c, [part]: false }));
                    }}
                    checked={!!checked[part]}
                    correct={questionIsCorrect(q, answers[q.id] ?? "")}
                    explanation={q.explanation}
                    correctOption={q.answers[0]}
                    hint={q.hint}
                    allowReveal
                    index={i}
                  />
                ))}
              </div>
              {requiresIndependentFirstAttempt && (
                <section className="first-attempt-card">
                  <span className="eyebrow">FIRST ATTEMPT · NO MODEL</span>
                  <h3>{profileAttemptPrompt(lecture, route.primarySkill)}</h3>
                  <p>
                    Say or write a short answer independently. Then type the
                    words you used so your first attempt is saved before the
                    focused retry.
                  </p>
                  <label htmlFor="first-attempt">
                    {route.primarySkill === "writing"
                      ? "Your first written response"
                      : "What you said"}
                  </label>
                  <textarea
                    id="first-attempt"
                    className="field"
                    rows={5}
                    maxLength={5000}
                    value={drafts[route.primarySkill] ?? ""}
                    onChange={(event) =>
                      changeDraftForSkill(route.primarySkill, event.target.value)
                    }
                    placeholder={
                      route.primarySkill === "writing"
                        ? "Kirjoita ensimmäinen vastaus tähän…"
                        : "Type the words you said, or a few keywords…"
                    }
                    lang="sv"
                  />
                  <small>
                    {hasIndependentFirstAttempt
                      ? "First attempt saved. Continue to focused support when you are ready."
                      : "A few words are enough. This is evidence for you, not a grade."}
                  </small>
                </section>
              )}
              {questions.length > 0 && (
                <button
                  className="secondary"
                  onClick={() => setChecked((c) => ({ ...c, [part]: true }))}
                >
                  Check my warm-up
                </button>
              )}
            </>
          )}
          {part === "teach" && (
            <>
              {ykiMock ? (
                <YkiMockFlow
                  mock={ykiMock}
                  stage="listening"
                  drafts={drafts}
                  savedPractice={state.practice}
                  onDraftChange={changeDraftForSkill}
                  onComplete={savePracticeAttempt}
                  returnPlan={assignment}
                  onReturnPlanChange={(value) => {
                    setAssignment(value);
                    queue({ assignment: value });
                  }}
                />
              ) : lecture.dialogue && lecture.number !== 1 && (
                <StoryScene dialogue={lecture.dialogue} chapter={chapter} />
              )}
              {ykiWorkshop && hydrated && (
                <YkiWorkshopFirstAttempt
                  lecture={lecture}
                  minutes={routeProfile.steps[1].minutes}
                  value={workshopFirstAttemptValue}
                  recoveredFromLegacySlot={workshopFirstAttemptUsesLegacy}
                  onChange={(value) =>
                    changeDraftForSkill(workshopFirstAttemptSkill, value)
                  }
                />
              )}
              {(() => {
                const totalSections = lecture.sections.length;
                const currentSection = lecture.sections[Math.min(sectionIdx, totalSections - 1)] ?? lecture.sections[0];
                if (!currentSection) return null;
                const isLastPage = sectionIdx >= totalSections - 1;
                const sectionKind = currentSection.kind ?? "scene";
                const kindMeta = {
                  rule: { pill: "RULE", note: "Today's rule" },
                  register: { pill: "REGISTER", note: "How Swedish shifts by situation" },
                  scene: { pill: "SCENE", note: "Notice one useful pattern" },
                }[sectionKind];
                const ruleBody = currentSection.body;
                return (
                  <>
                    <div className="teacher-note teacher-note-sami">
                      <StoryAvatar name="Sami" size={58} />
                      <div>
                        <span className="teacher-note-label">SAMI &middot; YOUR TEACHER</span>
                        <h3>{kindMeta.note}: {currentSection.title}</h3>
                        <p>{ruleBody[0]}</p>
                      </div>
                    </div>
                    <div className="teach-pagination-header">
                      <span className="eyebrow">STEP {sectionIdx + 1} OF {totalSections}</span>
                      <div className="teach-pagination-bar" role="progressbar" aria-valuemin={1} aria-valuemax={totalSections} aria-valuenow={sectionIdx + 1}>
                        {lecture.sections.map((_, i) => (
                          <span key={i} className={i <= sectionIdx ? "filled" : ""} />
                        ))}
                      </div>
                    </div>
                    <section className={`teaching-section teaching-section-${sectionKind}`}>
                      <span className={`teaching-kind teaching-kind-${sectionKind}`}>{kindMeta.pill}</span>
                      <h3>{currentSection.title}</h3>
                      {sectionKind === "rule" ? (
                        <ol className="teaching-rules">
                          {ruleBody.map((rule, j) => (
                            <li key={j}>{rule}</li>
                          ))}
                        </ol>
                      ) : (
                        <>
                          <div className="teaching-story-lead">
                            <span>{sectionKind === "register" ? "THE SPLIT" : "THE MOMENT"}</span>
                            <p>{ruleBody[0]}</p>
                          </div>
                          {ruleBody.slice(1).map((p, j) => (
                            <p key={j + 1}>{p}</p>
                          ))}
                        </>
                      )}
                      {currentSection.table && (
                        <div className="teaching-table">
                          <table>
                            <caption className="sr-only">{currentSection.title}</caption>
                            <thead>
                              <tr>
                                {currentSection.table.headings.map((h, j) => (
                                  <th scope="col" key={j}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {currentSection.table.rows.map((r, j) => (
                                <tr key={j}>
                                  {r.map((c, k) => (
                                    <td key={k}>{c}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      <div className="worked-examples">
                        {currentSection.examples.map((example, j) => (
                          <div key={j}>
                            <div>
                              <p lang="sv">{example.fi}</p>
                              <p>{example.en}</p>
                              {example.note && <small>{example.note}</small>}
                            </div>
                            <AudioButton
                              text={example.fi}
                              label="Hear example"
                              className="icon-button"
                            />
                          </div>
                        ))}
                      </div>
                      {(currentSection.memoryTip || currentSection.tryIt) && (
                        <div className="lesson-coaching-pair">
                          {currentSection.memoryTip && (
                            <aside className="lesson-memory-tip">
                              <span>MEMORY BRIDGE</span>
                              <p>{currentSection.memoryTip}</p>
                            </aside>
                          )}
                          {currentSection.tryIt && (
                            <aside className="lesson-try-it">
                              <span>DO IT NOW</span>
                              <p>{currentSection.tryIt}</p>
                            </aside>
                          )}
                        </div>
                      )}
                    </section>
                    <div className="teach-pagination-controls">
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => setSectionIdx(Math.max(0, sectionIdx - 1))}
                        disabled={sectionIdx === 0}
                      >
                        &larr; {lecture.number === 1 ? "Previous card" : "Previous rule"}
                      </button>
                      {!isLastPage && (
                        <button
                          type="button"
                          className="primary"
                          onClick={() => setSectionIdx(Math.min(totalSections - 1, sectionIdx + 1))}
                        >
                          {lecture.number === 1 ? "Next card" : "Next rule"} &rarr;
                        </button>
                      )}
                    </div>
                    {isLastPage && (
                      <>
                        {[
                          ...(lecture.bookConnection ? [lecture.bookConnection] : []),
                          ...(lecture.bookConnections ?? []),
                        ].map((connection) => (
                          <BookConnection
                            connection={connection}
                            key={`${connection.chapter}-${connection.title}`}
                            onOpenChapterReview={onOpenChapterReview}
                          />
                        ))}
                        {!!lecture.resources?.length && (
                          <section className="lesson-resources" aria-labelledby={`episode-${lecture.number}-resources`}>
                            <span className="eyebrow">OPTIONAL PRONUNCIATION CHECK</span>
                            <h3 id={`episode-${lecture.number}-resources`}>Compare a real speaker, then return</h3>
                            <p>Use an external recording for one word at a time. Listen, close the page, and repeat here from memory.</p>
                            <div>
                              {lecture.resources.map((resource) => (
                                <a href={resource.url} target="_blank" rel="noreferrer" key={resource.url}>
                                  <span>
                                    <b>{resource.label}</b>
                                    <small>{resource.description}</small>
                                  </span>
                                  <ExternalLink size={16} aria-hidden="true" />
                                </a>
                              ))}
                            </div>
                          </section>
                        )}
                        {(() => {
                          const isPhrase = (fi: string) => /[\s!?.]/.test(fi);
                          const phrases = lecture.words.filter((w) => isPhrase(w.fi));
                          const lexicon = lecture.words.filter((w) => !isPhrase(w.fi));
                          const renderCard = (w: typeof lecture.words[number]) => (
                            <div key={w.id}>
                              <div>
                                <b lang="sv">{w.fi}</b>
                                <AudioButton text={w.fi} label={"Hear " + w.fi} className="icon-button" />
                              </div>
                              <p>{w.en}</p>
                              <p className="word-in-context" lang="sv">{w.example}</p>
                              <small>{w.translation}</small>
                            </div>
                          );
                          const wordBank = (
                            <section className="teaching-section">
                              {phrases.length > 0 && (
                                <>
                                  <h3>Say these today</h3>
                                  <p className="section-sub">Whole chunks you can use immediately. Do not break them up yet.</p>
                                  <div className="lecture-word-grid">{phrases.map(renderCard)}</div>
                                </>
                              )}
                              {lexicon.length > 0 && (
                                <>
                                  <h3 style={{ marginTop: phrases.length ? 26 : 0 }}>Vocabulary to recognise</h3>
                                  <p className="section-sub">Individual words you will meet again. Learn to spot them; production comes with the next episodes.</p>
                                  <div className="lecture-word-grid">{lexicon.map(renderCard)}</div>
                                </>
                              )}
                              <div className="pronunciation-note">
                                <h4>Pronunciation focus</h4>
                                <p>{lecture.pronunciation.tip}</p>
                                <AudioButton text={lecture.pronunciation.text} label="Listen and repeat" />
                              </div>
                            </section>
                          );
                          if (lecture.number === 1) {
                            return (
                              <details className="lesson-one-word-bank">
                                <summary>
                                  <span>
                                    <b>Open the complete Lesson 1 word bank</b>
                                    <small>4 phrases · {lexicon.length} recognition words · one full sound drill</small>
                                  </span>
                                  <ChevronDown size={17} aria-hidden="true" />
                                </summary>
                                {wordBank}
                              </details>
                            );
                          }
                          return wordBank;
                        })()}
                      </>
                    )}
                  </>
                );
              })()}
            </>
          )}
          {(part === "guided" || part === "check") && (
            ykiMock ? (
                <YkiMockFlow
                mock={ykiMock}
                stage={part === "guided" ? "reading" : "diagnosis"}
                drafts={drafts}
                savedPractice={state.practice}
                  onDraftChange={changeDraftForSkill}
                  onComplete={savePracticeAttempt}
                  returnPlan={assignment}
                  onReturnPlanChange={(value) => {
                    setAssignment(value);
                    queue({ assignment: value });
                  }}
              />
            ) : (
            <>
              <section className="route-listening-input">
                <span className="eyebrow">
                  {part === "guided" ? "LISTEN BEFORE YOU ANSWER" : "REPLAY IF YOU NEED IT"}
                </span>
                <h3>Listen for meaning, then answer the listening item.</h3>
                <p>
                  First listen for the situation. On a second listen, catch
                  one detail. Text support stays optional until you choose it.
                </p>
                <div>
                  <AudioButton
                    text={lecture.listening.text}
                    label={part === "guided" ? "Listen once" : "Replay the listening input"}
                  />
                  <AudioButton
                    text={lecture.listening.text}
                    label="Listen slowly"
                    slow
                  />
                </div>
                <details>
                  <summary>Show text support after listening</summary>
                  <p lang="sv">{lecture.listening.text}</p>
                </details>
              </section>
              <div className="course-questions">
                {questionAction[part] && (
                  <ActionRibbon>{questionAction[part]}</ActionRibbon>
                )}
                {questions.map((q, i) => (
                  <QuestionCard
                    key={q.id}
                    id={q.id}
                    prompt={q.prompt}
                    options={q.options}
                    value={answers[q.id] ?? ""}
                    onChange={(v) => {
                      setAnswers((a) => ({ ...a, [q.id]: v }));
                      queue({ answers: { [q.id]: v } });
                      setChecked((c) => ({ ...c, [part]: false }));
                    }}
                    checked={!!checked[part]}
                    correct={questionIsCorrect(q, answers[q.id] ?? "")}
                    explanation={q.explanation}
                    correctOption={q.answers[0]}
                    hint={q.hint}
                    allowReveal={part === "guided"}
                    index={i}
                  />
                ))}
              </div>
              <div className="question-check">
                <button
                  className="secondary"
                  onClick={() => setChecked((c) => ({ ...c, [part]: true }))}
                >
                  {part === "guided" ? "Check my built line" : "Check and plan my retry"}
                </button>
                <p className="help-text">
                  Answer every item, then use the feedback. A missed item
                  points to one useful retry; it does not block you behind a score.
                </p>
              </div>
              {checked[part] && (
                <>
                  <p className="checkpoint-feedback passed" role="status">
                    {result.correct}/{result.total} correct. You have reviewed
                    the feedback; continue when you are ready. If one item
                    affects your message, change it on the retry.
                  </p>
                  {part === "check" && (
                    <div className="transfer-card">
                      <span className="eyebrow">ONE CHANGED DETAIL</span>
                      <p>{route.transferPrompt}</p>
                    </div>
                  )}
                </>
              )}
            </>
            )
          )}
          {part === "practice" && (
            ykiMock ? (
              <YkiMockFlow
                mock={ykiMock}
                stage="production"
                drafts={drafts}
                savedPractice={state.practice}
                onDraftChange={changeDraftForSkill}
                onComplete={savePracticeAttempt}
                returnPlan={assignment}
                onReturnPlanChange={(value) => {
                  setAssignment(value);
                  queue({ assignment: value });
                }}
              />
            ) : (
            <>
              {lecture.level === "A0" && hydrated && (
                <details className="a0-companion-drawer" open>
                  <summary>
                    <AudioLines size={18} />
                    <span>
                      <b>Talk with Stigen &mdash; your AI companion for this task</b>
                      <small>
                        Voice conversation, sound drill, or text help. Stigen
                        knows this lesson&rsquo;s rules and challenges you as you
                        do the real task.
                      </small>
                    </span>
                    <ChevronDown size={16} />
                  </summary>
                  <A0TeachingCompanion lectureId={lecture.id} />
                </details>
              )}
              <div className="practice-focus">
                <span className="eyebrow">YOUR CORE MISSION</span>
                <p>{route.expectedOutput}</p>
                <small>
                  Complete {route.requiredSkills.length === 1 ? "this one task" : "each required task"} to continue. The other skills remain available as extra practice.
                </small>
                <div>
                  {route.requiredSkills.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSkill(s)}
                      className={skill === s ? "selected" : ""}
                    >
                      {state.practice[s] ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <span className="open-circle" />
                      )}
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              {hydrated && (
                <PracticeStudio
                  key={`${lecture.id}-${skill}`}
                  initialSkill={skill}
                  level={lecture.level}
                  lecture={lecture}
                  initialDraft={drafts[skill] ?? ""}
                  onDraftChange={changeDraft}
                  initialSaved={!!state.practice[skill]}
                  timed={
                    routeProfile.id === "yki-workshop" ||
                    routeProfile.id === "yki-mock"
                  }
                  timeLimitSeconds={
                    (routeProfile.id === "yki-workshop" ||
                      routeProfile.id === "yki-mock")
                      ? Math.max(
                          60,
                          Math.floor(
                            (routeProfile.steps[3].minutes * 60) /
                              route.requiredSkills.length,
                          ),
                        )
                      : undefined
                  }
                  requireChangedRetry={
                    (requiresIndependentFirstAttempt && hasIndependentFirstAttempt) ||
                    (ykiWorkshop &&
                      workshopFirstAttemptSkill === skill &&
                      hasWorkshopFirstAttempt)
                  }
                  onComplete={(s, score, minutes, attemptId) =>
                    savePracticeAttempt(
                      s as Skill,
                      score,
                      minutes,
                      attemptId,
                    )
                  }
                />
              )}
              <details className="extra-practice">
                <summary>Optional: practise another skill from this episode</summary>
                <div className="course-levels">
                  {(["listening", "speaking", "reading", "writing"] as Skill[])
                    .filter((s) => !route.requiredSkills.includes(s))
                    .map((s) => (
                      <button key={s} onClick={() => setSkill(s)}>
                        {s}
                      </button>
                    ))}
                  {route.requiredSkills.length === 4 && (
                    <p>This integrated route includes all four skills. Revisit any one when you want another attempt.</p>
                  )}
                </div>
              </details>
            </>
            )
          )}
          {part === "assignment" && (
            <>
              <section className="takeaways">
                <h3>Keep these ideas</h3>
                <ul>
                  {lecture.takeaways.map((t, i) => (
                    <li key={i}>
                      <Check size={17} />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </section>
              <section className="follow-up">
                <span className="eyebrow">REVISIT LATER</span>
                <h3>{ykiMock ? "Your targeted return" : "Save one thing you will use again"}</h3>
                <p>{route.returnPrompt}</p>
                <div className="return-phrase-card">
                  <b>{ykiMock ? skillLabel(mockTargetedReturn?.skill ?? null) : "Key phrase or word family"}</b>
                  <p lang={ykiMock ? undefined : "sv"}>
                    {ykiMock
                      ? (mockTargetedReturn?.drill ?? "Choose a next drill in the diagnosis step.")
                      : lecture.takeaways[0]}
                  </p>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => {
                      window.location.hash = "words";
                    }}
                  >
                    Open Word bank review <ArrowRight size={15} />
                  </button>
                </div>
                {ykiMock ? (
                  <p className="help-text">
                    This plan was saved when you chose it in the diagnosis step.
                    Return there if you want to choose a different skill drill.
                  </p>
                ) : (
                  <>
                    <label htmlFor="assignment">Optional: leave your own one-line reminder</label>
                    <textarea
                      id="assignment"
                      className="field"
                      rows={6}
                      maxLength={5000}
                      value={assignment}
                      onChange={(e) => {
                        setAssignment(e.target.value);
                        queue({ assignment: e.target.value });
                      }}
                      placeholder="For example: ‘Ask again slowly when I do not understand.’"
                    />
                    <p className="help-text">
                      This is optional. Saving the episode also makes its words
                      ready for Word Bank review; no reflection is graded.
                    </p>
                    <details>
                      <summary>See a model after your own attempt</summary>
                      {assignment.trim() ? (
                        <p className="personal-writing">
                          {lecture.assignment.model}
                        </p>
                      ) : (
                        <p>
                          If you want a written model, add even one short line above.
                        </p>
                      )}
                    </details>
                  </>
                )}
              </section>
            </>
          )}
          <details className="lecture-notes">
            <summary>
              <NotebookPen size={18} />
              My notes for episode {lecture.number}
              <ChevronDown size={16} />
            </summary>
            <label htmlFor="lecture-notes">
              A useful pattern, a question, or something to remember
            </label>
            <textarea
              id="lecture-notes"
              className="field"
              rows={4}
              maxLength={5000}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                queue({ notes: e.target.value });
              }}
              placeholder="These notes also appear in your course notebook."
            />
          </details>
          {state.completedAt && part === "assignment" ? (
            <>
              {chapterReviews.map((review) => (
                <BookReviewBridge
                  key={review.number}
                  review={review}
                  onOpen={() => onOpenChapterReview(review.number)}
                />
              ))}
            <div className="lecture-complete">
              <CheckCircle2 size={32} />
              <h3>Episode {lecture.number} complete. Bra jobbat!</h3>
              <p>
                {last
                  ? "You have reached the final clinic. Use your evidence and revision plan to decide what to practise next."
                  : "You have studied the pattern, practised it, and left something to return to."}
              </p>
              <button
                className="primary"
                disabled={busy}
                onClick={() => leave(last ? onExit : onNext)}
              >
                {last
                  ? "Review the course"
                  : "Go to episode " + (lecture.number + 1)}
                <ArrowRight size={18} />
              </button>
            </div>
            </>
          ) : (
            <footer className="lecture-actions">
              <button
                className="text-button"
                disabled={partIndex === 0 || busy}
                onClick={() => preview(COURSE_PARTS[partIndex - 1])}
              >
                <ArrowLeft size={16} />
                Previous step
              </button>
              <div>
                {!earlierDone && (
                  <p className="help-text">
                    Finish the earlier parts to record completion here.
                  </p>
                )}
                <button
                  className="primary"
                  disabled={!canContinue || busy || saving}
                  onClick={complete}
                >
                  {busy ? <Loader2 className="animate-spin" size={18} /> : null}
                  {state.completedParts.includes(part)
                    ? "Continue"
                    : actionLabel(part, routeProfile)}
                  <ArrowRight size={18} />
                </button>
              </div>
            </footer>
          )}
        </div>
      </div>
    </div>
  );
}
