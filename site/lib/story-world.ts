export const storyCharacters = {
  Alex: {
    name: "Alex",
    role: "the learner",
    image: "/images/onboarding/characters/alex.webp",
  },
  Aino: {
    name: "Aino",
    role: "the friend",
    image: "/images/onboarding/characters/aino.webp",
  },
  Sami: {
    name: "Sami",
    role: "the teacher",
    image: "/images/onboarding/characters/sami.webp",
  },
  Sara: {
    name: "Sara",
    role: "the neighbour",
    image: "/images/onboarding/characters/sara.webp",
  },
  Leo: {
    name: "Leo",
    role: "the classmate",
    image: "/images/onboarding/characters/leo.webp",
  },
} as const;

export type StoryCharacterName = keyof typeof storyCharacters;

export type StoryChapter = {
  number: number;
  title: string;
  setting: string;
  summary: string;
  cast: readonly StoryCharacterName[];
  art: string;
};

export const storyChapters: Record<number, StoryChapter> = {
  1: {
    number: 1,
    title: "The first class",
    setting: "A community class and the first week",
    summary:
      "Alex arrives, meets Aino and Sami, and learns to share a name, origin, number, and meeting time.",
    cast: ["Alex", "Aino", "Sami"],
    art: "/images/story/chapters/chapter-01-first-class.webp",
  },
  2: {
    number: 2,
    title: "A new everyday world",
    setting: "People, a weekday, the neighbourhood, and a café",
    summary:
      "The group talks about people and routines, asks useful questions, finds a place, and orders together.",
    cast: ["Alex", "Aino", "Sara"],
    art: "/images/story/chapters/chapter-02-everyday-world.webp",
  },
  3: {
    number: 3,
    title: "Things, rooms, routes, and plans",
    setting: "Shops, home, the street, and free time",
    summary:
      "Shopping and a changed plan give the group reasons to describe, direct, invite, and respond.",
    cast: ["Alex", "Aino", "Sami", "Leo"],
    art: "/images/story/chapters/chapter-03-study-session.webp",
  },
  4: {
    number: 4,
    title: "When conditions change",
    setting: "Weather, health, and yesterday’s events",
    summary:
      "Weather and health needs lead into clear negatives, past events, and one integrated everyday mission.",
    cast: ["Alex", "Sara", "Leo"],
    art: "/images/story/chapters/chapter-04-city-map.webp",
  },
  5: {
    number: 5,
    title: "Connecting your Swedish",
    setting: "Belonging, plans, viewpoints, and reasons",
    summary:
      "Alex talks about what belongs to whom, what comes next, what they think, and why.",
    cast: ["Alex", "Aino", "Sara", "Leo"],
    art: "/images/story/chapters/chapter-05-independence.webp",
  },
  6: {
    number: 6,
    title: "Home, people, and the four skills",
    setting: "Everyday texts, recordings, and messages",
    summary:
      "The group shifts between informal and formal Swedish before an independent four-skill bridge task.",
    cast: ["Alex", "Aino", "Leo"],
    art: "/images/story/chapters/chapter-06-changed-trip.webp",
  },
  7: {
    number: 7,
    title: "Services, stories, and viewpoints",
    setting: "Service counters, neighbourhoods, and local nature",
    summary:
      "Alex reacts, asks, narrates, and supports a viewpoint as everyday tasks become more connected.",
    cast: ["Alex", "Sami", "Leo"],
    art: "/images/story/chapters/chapter-07-new-course.webp",
  },
  8: {
    number: 8,
    title: "Health, work, and daily solutions",
    setting: "Appointments, work, study, and neighbours",
    summary:
      "Practical needs ask the group to explain requirements, coordinate changes, and reach a usable next step.",
    cast: ["Alex", "Sara", "Sami"],
    art: "/images/story/chapters/chapter-08-resolution.webp",
  },
  9: {
    number: 9,
    title: "Work, study, leisure, and public services",
    setting: "Applications, schedules, courses, and public information",
    summary:
      "The group matches requirements, compares options, updates plans, and acts on public-service information.",
    cast: ["Alex", "Aino", "Leo"],
    art: "/images/story/chapters/chapter-09-community-event.webp",
  },
  10: {
    number: 10,
    title: "Keep the service conversation moving",
    setting: "Calls, complaints, service repair, and Finland-Swedish speech",
    summary:
      "Alex narrates, clarifies, complains proportionately, and follows a multi-step problem through to a solution.",
    cast: ["Alex", "Sara", "Sami"],
    art: "/images/story/chapters/chapter-10-plans-change.webp",
  },
  11: {
    number: 11,
    title: "Having a public voice",
    setting: "Opinions, trade-offs, and community decisions",
    summary:
      "The friends explain what they think, listen to another view, and adapt their position.",
    cast: ["Alex", "Aino", "Sami", "Sara", "Leo"],
    art: "/images/story/chapters/chapter-11-having-a-voice.webp",
  },
  12: {
    number: 12,
    title: "The YKI studio",
    setting: "Instructions, timed workshops, and four-skill practice",
    summary:
      "The final planned chapter brings course evidence into unfamiliar YKI-style tasks.",
    cast: ["Alex", "Aino", "Sami", "Sara", "Leo"],
    art: "/images/onboarding/orientation/course-journey.webp",
  },
};

const fallbackStoryChapter: StoryChapter = {
  number: 0,
  title: "Your Swedish story",
  setting: "Everyday Finland",
  summary:
    "Follow the situation, notice what the Swedish needs to do, and take your turn.",
  cast: ["Alex", "Sami"],
  art: "/images/onboarding/orientation/course-journey.webp",
};

export function storyChapterForModule(moduleNumber: number): StoryChapter {
  return (
    storyChapters[moduleNumber] ?? {
      ...fallbackStoryChapter,
      number: moduleNumber,
    }
  );
}

export function storyCharacterForSpeaker(speaker: string) {
  const match = (Object.keys(storyCharacters) as StoryCharacterName[]).find(
    (name) => name.toLocaleLowerCase() === speaker.trim().toLocaleLowerCase(),
  );
  return match ? storyCharacters[match] : null;
}

const episodeArtwork = [
  "",
  "episode-01-sound-workshop.webp",
  "episode-02-names-at-break.webp",
  "episode-03-thirteen-euros.webp",
  "episode-04-ask-for-help.webp",
  "episode-05-practice-clinic.webp",
  "episode-06-profile-cards.webp",
  "episode-07-people-in-my-life.webp",
  "episode-08-a-day-on-one-page.webp",
  "episode-09-first-cafe-order.webp",
  "episode-10-profile-in-the-cafe.webp",
  "episode-11-study-session-plan.webp",
  "episode-12-leos-message.webp",
  "episode-13-who-can-come.webp",
  "episode-14-word-family-on-the-way.webp",
  "episode-15-make-the-plan-clear.webp",
  "episode-16-first-evening-new-home.webp",
  "episode-17-route-to-alexs-door.webp",
  "episode-18-saras-book-by-the-door.webp",
  "episode-19-apartment-shopping.webp",
  "episode-20-route-home.webp",
  "episode-21-study-arrangement.webp",
  "episode-22-outing-directions.webp",
  "episode-23-hobby-choices.webp",
  "episode-24-clinic-appointment.webp",
  "episode-25-a1-change.webp",
  "episode-26-outing-past.webp",
  "episode-27-bus-missing.webp",
  "episode-28-closed-cafe.webp",
  "episode-29-ticket-help.webp",
  "episode-30-story-circle.webp",
  "episode-31-course-interview.webp",
  "episode-32-library-study.webp",
  "episode-33-shared-room.webp",
  "episode-34-absence-message.webp",
  "episode-35-study-needs.webp",
  "episode-36-reschedule.webp",
  "episode-37-key-before-friday.webp",
  "episode-38-ticket-decision.webp",
  "episode-39-leaking-kitchen-tap.webp",
  "episode-40-faulty-lamp-exchange.webp",
  "episode-41-hall-opening-plan.webp",
  "episode-42-venue-choice.webp",
  "episode-43-library-course-choice.webp",
  "episode-44-side-entrance.webp",
  "episode-45-new-arrangement.webp",
  "episode-46-missed-train.webp",
  "episode-47-phone-appointment.webp",
  "episode-48-device-return-request.webp",
  "episode-49-voice-message-time-check.webp",
  "episode-50-thursday-group-confirmation.webp",
  "episode-51-remote-work-discussion.webp",
  "episode-52-bus-possibility.webp",
  "episode-53-course-tradeoff.webp",
  "episode-54-noise-compromise.webp",
  "episode-55-community-trial.webp",
] as const;

const episodeObjects = [
  "",
  "sound cards",
  "name cards",
  "a price tag",
  "a useful question",
  "a shared notebook",
  "profile cards",
  "a family photo",
  "a weekly page",
  "a café menu",
  "a profile card",
  "a study plan",
  "Leo’s message",
  "an invitation",
  "a word family",
  "a clear plan",
  "a grocery bag",
  "a route sketch",
  "Sara’s book",
  "a shopping list",
  "a route home",
  "a study arrangement",
  "an outing map",
  "a choice card",
  "an appointment slip",
  "a changed plan",
  "an empty bus bay",
  "a closed café door",
  "a ticket question",
  "a story circle",
  "an application note",
  "a library desk",
  "a shared room",
  "an absence message",
  "a study need",
  "a new time",
  "a brass key",
  "two ticket options",
  "a kitchen tap",
  "a faulty lamp",
  "a hall plan",
  "a venue choice",
  "a course leaflet",
  "a side entrance",
  "a revised arrangement",
  "a missed train",
  "an appointment call",
  "a return request",
  "a voice note",
  "a Thursday confirmation",
  "a workplace example",
  "a possible bus",
  "a course choice",
  "a neighbourly compromise",
  "a community trial",
] as const;

export function storyArtForLecture(lectureNumber: number) {
  const artwork = episodeArtwork[lectureNumber];
  return artwork
    ? `/images/story/episodes/${artwork}`
    : "/images/onboarding/orientation/course-journey.webp";
}

export function storyObjectForLecture(lectureNumber: number) {
  return episodeObjects[lectureNumber] ?? "a useful clue";
}
