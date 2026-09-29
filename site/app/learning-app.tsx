"use client";
import Image from "next/image";
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  lazy,
  Suspense,
} from "react";
import {
  Route,
  LayoutDashboard,
  Headphones,
  Layers,
  Flag,
  ChartNoAxesCombined,
  CircleHelp,
  Settings,
  NotebookPen,
  ChevronRight,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { lessons, type Lesson, type Skill } from "@/lib/curriculum";
import { lectures, type CourseLecture } from "@/lib/course";
import {
  defaultProgress,
  type ProgressData,
  type ProgressAction,
} from "@/lib/progress";
import { useCourse } from "@/components/learning/useCourse";
import { storyChapterForModule } from "@/lib/story-world";
import { bookReviewForNumber, type BookReview } from "@/lib/book-reviews";
import {
  CourseHome,
  CourseSyllabus,
  CourseNotebook,
  CourseProgress,
} from "@/components/learning/CourseViews";
const LecturePlayer = lazy(() => import("@/components/learning/LecturePlayer"));
const LessonPlayer = lazy(() => import("@/components/learning/LessonPlayer"));
const CourseOrientation = lazy(
  () => import("@/components/learning/CourseOrientation"),
);
const ChapterCompanion = lazy(
  () => import("@/components/learning/ChapterCompanion"),
);
const PracticeStudio = lazy(
  () => import("@/components/learning/PracticeStudio"),
);
const WordBank = lazy(() => import("@/components/learning/WordBank"));
const Resources = lazy(() => import("@/components/learning/Resources"));
const SettingsView = lazy(() => import("@/components/learning/SettingsView"));

const nav = [
  {
    name: "Classroom",
    label: "Continue story",
    slug: "classroom",
    icon: LayoutDashboard,
    group: "story",
  },
  {
    name: "Course",
    label: "Story path",
    slug: "course",
    icon: Route,
    group: "story",
  },
  {
    name: "Practice",
    label: "Practice studio",
    slug: "practice",
    icon: Headphones,
    group: "practice",
  },
  {
    name: "Notebook",
    label: "Story notebook",
    slug: "notebook",
    icon: NotebookPen,
    group: "practice",
  },
  {
    name: "Word bank",
    label: "Word bank",
    slug: "words",
    icon: Layers,
    group: "practice",
  },
  {
    name: "My progress",
    label: "My progress",
    slug: "progress",
    icon: ChartNoAxesCombined,
    group: "progress",
  },
  {
    name: "YKI preparation",
    label: "YKI preparation",
    slug: "yki",
    icon: Flag,
    group: "progress",
  },
  {
    name: "Resources",
    label: "Resources",
    slug: "resources",
    icon: CircleHelp,
    group: "utility",
  },
  {
    name: "Settings",
    label: "Learning tools",
    slug: "settings",
    icon: Settings,
    group: "utility",
  },
];

const sidebarGroups = [
  {
    group: "story",
    label: "YOUR STORY",
    ariaLabel: "Story navigation",
  },
  {
    group: "practice",
    label: "PRACTISE & RETURN",
    ariaLabel: "Practice and review",
  },
  {
    group: "progress",
    label: "PROGRESS & YKI",
    ariaLabel: "Progress and YKI preparation",
  },
] as const;

export default function LearningApp({ userId }: { userId: string }) {
  return (
    <SidebarProvider
      className="story-shell"
      style={{ "--sidebar-width": "240px" } as React.CSSProperties}
    >
      <AppContent userId={userId} />
      <Toaster position="bottom-right" />
    </SidebarProvider>
  );
}
function AppContent({ userId }: { userId: string }) {
  const [view, setView] = useState("Classroom"),
    [lesson, setLesson] = useState<Lesson | null>(null),
    [lecture, setLecture] = useState<CourseLecture | null>(null),
    [chapterReview, setChapterReview] = useState<BookReview | null>(null),
    [chapterReviewReturn, setChapterReviewReturn] = useState("course"),
    [skill, setSkill] = useState<Skill>("listening"),
    [data, setData] = useState<ProgressData>(defaultProgress),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [signedOut, setSignedOut] = useState(false);
  const course = useCourse();
  const { setOpenMobile } = useSidebar();
  const mutation = useRef(Promise.resolve());
  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/progress", {
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
      const d = (await r.json()) as ProgressData & { error?: string };
      if (!r.ok) {
        setSignedOut(r.status === 401);
        throw new Error(d.error ?? "Your progress is unavailable.");
      }
      setSignedOut(false);
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load progress.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) return load();
    });
    return () => {
      active = false;
    };
  }, [load]);
  useEffect(() => {
    function read() {
      const hash = window.location.hash.slice(1);
      const [rawKey, id, returnTarget] = hash.split("/");
      let key = rawKey;
      if (key === "main-content") return;
      if (key === "today") key = "classroom";
      if (key === "path") key = "course";
      setOpenMobile(false);
      setLesson(null);
      setLecture(null);
      setChapterReview(null);
      if (key === "lecture") {
        const found = lectures.find((l) => l.id === id);
        if (found) {
          setLecture(found);
          setView("Course");
          return;
        }
      }
      if (key === "lesson") {
        const found = lessons.find((l) => l.id === id);
        if (found) {
          setLesson(found);
          setView("Course");
          return;
        }
      }
      if (key === "orientation") {
        setView("Orientation");
        return;
      }
      if (key === "chapter-review") {
        const found = bookReviewForNumber(Number(id));
        if (found) {
          setChapterReview(found);
          setChapterReviewReturn(returnTarget ?? "course");
          setView("Chapter companion");
          return;
        }
      }
      setView(nav.find((n) => n.slug === key)?.name ?? "Classroom");
      if (["listening", "speaking", "reading", "writing"].includes(id))
        setSkill(id as Skill);
    }
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [setOpenMobile]);
  function navigate(name: string) {
    const slug = nav.find((n) => n.name === name)?.slug ?? "classroom";
    window.location.hash = slug;
    setView(name);
    setLesson(null);
    setLecture(null);
    setChapterReview(null);
    setOpenMobile(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function start(l: CourseLecture) {
    window.location.hash = "lecture/" + l.id;
    setLecture(l);
    setLesson(null);
    setChapterReview(null);
    setView("Course");
    setOpenMobile(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function openOrientation() {
    window.location.hash = "orientation";
    setLecture(null);
    setLesson(null);
    setChapterReview(null);
    setView("Orientation");
    setOpenMobile(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function openChapterReview(number: number, returnTarget = "course") {
    const review = bookReviewForNumber(number);
    if (!review) return;
    window.location.hash = `chapter-review/${number}/${returnTarget}`;
    setChapterReview(review);
    setChapterReviewReturn(returnTarget);
    setLesson(null);
    setLecture(null);
    setView("Chapter companion");
    setOpenMobile(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function returnFromChapterReview() {
    const returnLecture = lectures.find(
      (item) => item.id === chapterReviewReturn,
    );
    if (returnLecture) {
      start(returnLecture);
      return;
    }
    navigate("Course");
  }
  async function save(action: ProgressAction) {
    const run = mutation.current
      .catch(() => {})
      .then(async () => {
        const r = await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action),
        });
        const d = (await r.json()) as ProgressData & { error?: string };
        if (!r.ok) throw new Error(d.error ?? "Could not save. Try again.");
        setData(d);
      });
    mutation.current = run;
    await run;
  }
  async function savePractice(
    s: string,
    score: number | null,
    minutes: number,
    attemptId?: string,
  ) {
    await save({
      action: "practice",
      id: attemptId ?? crypto.randomUUID(),
      skill: s as Skill,
      score,
      minutes: Math.max(1, Math.min(60, Math.round(minutes))),
    });
  }
  const done = lectures.filter(
    (l) => course.data.lectures[l.id]?.completedAt,
  ).length;
  const currentLecture =
    lectures.find((item) => !course.data.lectures[item.id]?.completedAt) ??
    lectures.at(-1);
  const currentChapter = storyChapterForModule(currentLecture?.module ?? 1);
  const currentViewLabel =
    chapterReview
      ? `Chapter ${String(chapterReview.number).padStart(2, "0")} companion`
      : nav.find((item) => item.name === view)?.label ?? view;
  const chapterReviewReturnLecture = chapterReview
    ? lectures.find((item) => item.id === chapterReviewReturn)
    : undefined;
  const chapterReviewNext = chapterReview
    ? lectures.find((item) => item.number === chapterReview.anchorEpisode + 1)
    : undefined;
  return (
    <>
      <Sidebar className="stigen-sidebar">
        <SidebarHeader>
          <a
            className="brand"
            href="#classroom"
            onClick={() => navigate("Classroom")}
          >
            <Image
              className="brand-mark-image"
              src="/favicon.svg"
              alt=""
              width={42}
              height={42}
              priority
            />
            stigen<span className="brand-dot">.</span>
          </a>
          <p className="brand-sub">Swedish, one story at a time.</p>
        </SidebarHeader>
        <SidebarContent>
          {sidebarGroups.map((group) => (
            <div key={group.group}>
              <p className="nav-label">{group.label}</p>
              <nav aria-label={group.ariaLabel}>
                {nav.filter((item) => item.group === group.group).map((n) => {
                  const active =
                    view === n.name ||
                    (n.name === "Course" && Boolean(chapterReview));
                  return (
                    <button
                      type="button"
                      key={n.name}
                      className={"nav-item " + (active ? "active" : "")}
                      aria-current={active ? "page" : undefined}
                      onClick={() => navigate(n.name)}
                    >
                      <n.icon size={20} />
                      {n.label}
                      {active && <span className="active-dot" />}
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
          {currentLecture && (
            <div className="sidebar-goal">
              <span className="small-label">YOUR NEXT SCENE</span>
              <span className="sidebar-chapter-number">
                {String(currentChapter.number).padStart(2, "0")}
              </span>
              <h3>{currentChapter.title}</h3>
              <p>
                Lecture {currentLecture.number} · {currentLecture.title}
              </p>
              <button type="button" onClick={() => start(currentLecture)}>
                {course.data.lectures[currentLecture.id]?.revision
                  ? "Resume this lesson"
                  : "Begin this lesson"}
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </SidebarContent>
        <SidebarFooter>
          <button
            type="button"
            className={"nav-item " + (view === "Resources" ? "active" : "")}
            aria-current={view === "Resources" ? "page" : undefined}
            onClick={() => navigate("Resources")}
          >
            <CircleHelp size={20} />
            Resources & guidance
          </button>
          <button
            type="button"
            className="profile"
            onClick={() => navigate("Settings")}
            aria-label="Open learning tools"
          >
            <span className="avatar"><Settings size={17} /></span>
            <span>
              <b>Learning tools</b>
              <small>AI practice and progress export</small>
            </span>
            <Settings size={18} />
          </button>
        </SidebarFooter>
      </Sidebar>
      <main className="app-main" id="main-content" tabIndex={-1}>
        <header className="topbar">
          <div>
            <SidebarTrigger className="mobile-menu" />
            <span>Your Swedish story</span>
            <ChevronRight size={15} />
            <b>
              {chapterReview
                ? `Chapter ${String(chapterReview.number).padStart(2, "0")} companion`
                : lecture
                  ? "Lecture " + lecture.number
                  : currentViewLabel}
            </b>
          </div>
          <div>
            {/* Vercel exposes its environment at build time; local runs never show this. */}
            {process.env.NEXT_PUBLIC_VERCEL_ENV && (
              <span className="preview-pill" title="Hosted preview: lessons and games work; Azure voice features are off and progress resets when the preview goes idle. Run it locally for everything.">
                Preview · voice off
              </span>
            )}
            <span className="course-top-progress">
              {done}/{lectures.length} {lectures.length === 1 ? "lesson" : "lessons"}
            </span>
            <button
              type="button"
              className="level-pill"
              onClick={() => navigate("Course")}
            >
              A0 · Chapter 1
            </button>
          </div>
        </header>
        <div className="page-content">
          <Suspense
            fallback={
              <div className="loading-state" role="status">
                <h2>Opening your learning space…</h2>
              </div>
            }
          >
            {loading || course.loading ? (
              <div className="loading-state" role="status">
                <span className="brand-mark">
                  <Route />
                </span>
                <h2>Opening your classroom…</h2>
              </div>
            ) : error || course.error ? (
              <div className="panel empty-state">
                <AlertCircle size={36} />
                <h1>
                  {signedOut
                    ? "Keep your progress with you"
                    : "Your saved work needs a moment"}
                </h1>
                <p>{error || course.error}</p>
                {signedOut ? (
                  <a
                    className="primary"
                    href="/signin-with-chatgpt?return_to=/"
                    target="_top"
                  >
                    Sign in with ChatGPT
                  </a>
                ) : (
                  <button
                    type="button"
                    className="primary"
                    onClick={() => {
                      void load();
                      void course.reload();
                    }}
                  >
                    <RefreshCw size={18} />
                    Try again
                  </button>
                )}
              </div>
            ) : chapterReview ? (
              <ChapterCompanion
                review={chapterReview}
                returnLabel={
                  chapterReviewReturnLecture
                    ? `Return to Episode ${chapterReviewReturnLecture.number}`
                    : "Back to story path"
                }
                continueLabel={
                  chapterReviewNext
                    ? `Continue to Episode ${chapterReviewNext.number}`
                    : null
                }
                onReturn={returnFromChapterReview}
                onContinue={() =>
                  chapterReviewNext
                    ? start(chapterReviewNext)
                    : navigate("Course")
                }
              />
            ) : lecture ? (
              <LecturePlayer
                key={lecture.id}
                userId={userId}
                lecture={lecture}
                state={course.data.lectures[lecture.id]}
                save={course.save}
                resolveConflict={course.resolveConflict}
                onExit={() => navigate("Course")}
                onNext={() => {
                  const next = lectures.find(
                    (l) => l.number === lecture.number + 1,
                  );
                  if (next) start(next);
                  else navigate("Course");
                }}
                last={lecture.number === lectures.at(-1)?.number}
                onPracticeSaved={() => void load(true)}
                onOpenChapterReview={(number) =>
                  openChapterReview(number, lecture.id)
                }
              />
            ) : lesson ? (
              <LessonPlayer
                key={lesson.id}
                userId={userId}
                lesson={lesson}
                onExit={() => navigate("Course")}
                onPractice={savePractice}
                onComplete={async (minutes) => {
                  await save({
                    action: "complete",
                    lessonId: lesson.id,
                    minutes,
                  });
                  toast.success("Practice episode completed. Bra jobbat!");
                }}
              />
            ) : view === "Orientation" ? (
              <CourseOrientation
                onExit={() => navigate("Course")}
                onBegin={() => {
                  const first = lectures.find((item) => item.number === 1);
                  if (first) start(first);
                }}
              />
            ) : view === "Classroom" ? (
              <CourseHome
                data={course.data}
                progress={data}
                navigate={navigate}
                start={start}
                openOrientation={openOrientation}
              />
            ) : view === "Course" ? (
              <CourseSyllabus
                data={course.data}
                start={start}
                legacyCompleted={data.completed}
                openOrientation={openOrientation}
                openChapterReview={(number) => openChapterReview(number)}
              />
            ) : view === "Notebook" ? (
              <CourseNotebook data={course.data} start={start} />
            ) : view === "Word bank" ? (
              <WordBank
                data={data}
                course={course.data}
                onReview={async (wordId, rating, id) =>
                  save({ action: "review", wordId, rating, id })
                }
              />
            ) : view === "My progress" ? (
              <CourseProgress
                data={course.data}
                progress={data}
                start={start}
              />
            ) : view === "Settings" ? (
              <SettingsView
                data={data}
                course={course.data}
                nextEpisode={
                  currentLecture
                    ? {
                        number: currentLecture.number,
                        title: currentLecture.title,
                      }
                    : undefined
                }
                onContinue={
                  currentLecture ? () => start(currentLecture) : undefined
                }
              />
            ) : view === "Resources" ? (
              <Resources />
            ) : view === "Practice" ? (
              <>
                <div className="page-heading">
                  <div>
                    <p className="eyebrow">HARJOITELLAAN · LET’S PRACTISE</p>
                    <h1>A safe place to try your Swedish.</h1>
                    <p>
                      Extra {currentLecture?.level ?? "A0"} practice that
                      follows Lecture {currentLecture?.number ?? 1}. Choose
                      a skill and a familiar situation.
                    </p>
                  </div>
                </div>
                <PracticeStudio
                  initialSkill={skill}
                  level={currentLecture?.level ?? "A0"}
                  onComplete={savePractice}
                />
              </>
            ) : (
              <>
                <div className="page-heading">
                  <div>
                    <p className="eyebrow">KOHTI YKIÄ · YOUR NEXT CHAPTER</p>
                    <h1>Practise for the moments that matter.</h1>
                    <p>
                      Original intermediate practice for all four skills, with
                      timed tasks.
                    </p>
                  </div>
                </div>
                <div className="exam-overview">
                  <div>
                    <span className="badge">YOUR TARGET</span>
                    <h2>B1 · YKI grade 3</h2>
                    <p>
                      Intermediate YKI assesses B1–B2. Each skill receives its
                      own grade. These shorter practice sets build familiarity;
                      they aren’t a full official exam.
                    </p>
                  </div>
                  <div className="exam-facts">
                    <span>
                      <Flag size={20} />
                      <b>4</b> separately assessed skills
                    </span>
                    <span>
                      <Headphones size={20} />
                      <b>Real life</b> everyday situations
                    </span>
                  </div>
                </div>
                <PracticeStudio
                  key="exam"
                  level="B1"
                  exam
                  onComplete={savePractice}
                />
                <div className="callout">
                  <CircleHelp size={22} />
                  <p>
                    Practice scores show task accuracy, not an official YKI
                    grade. Speaking and writing require trained human assessment
                    for certification.{" "}
                    <button
                      className="text-button"
                      onClick={() => navigate("Resources")}
                    >
                      Read official guidance →
                    </button>
                  </p>
                </div>
              </>
            )}
          </Suspense>
        </div>
      </main>
    </>
  );
}
