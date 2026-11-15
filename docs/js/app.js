import { h, clear } from "./lib/dom.js";
import { store } from "./lib/store.js";
import { loadStatus, getStatus } from "./lib/api.js";
import { refreshRecordings, loadBundled } from "./lib/speech.js";
import { setAmbience } from "./lib/sound.js";
import { registerServiceWorker } from "./offline.js";
import { homeView } from "./views/home.js";
import { learnView } from "./views/learn.js";
import { lessonView, customLessonView } from "./views/lesson.js";
import { readingView } from "./views/reading.js";
import { speakView, speakListView } from "./views/speak.js";
import { phrasebookView } from "./views/phrasebook.js";
import { reviewView } from "./views/review.js";
import { lettersView, letterView } from "./views/letters.js";
import { talkView } from "./views/talk.js";
import { storiesView } from "./views/stories.js";
import { libraryView, storyView } from "./views/library.js";
import { voicesView } from "./views/voices.js";
import { moreView } from "./views/more.js";
import { applyTheme, openOnboarding, openSettings, openPasscode } from "./views/settings.js";

const main = document.getElementById("main");

const ROUTES = [
  [/^\/?(home)?$/, () => homeView(), "home"],
  [/^\/(learn|path)$/, () => learnView(), "learn"],
  [/^\/lesson\/([\w-]+)$/, (m) => lessonView(m[1]), "learn"],
  [/^\/custom\/([\w-]+)$/, (m) => customLessonView(m[1]), "learn"],
  [/^\/read\/([\w-]+)$/, (m) => readingView(m[1]), "learn"],
  [/^\/speak$/, () => speakListView(), "speak"],
  [/^\/speak\/([\w-]+)$/, (m) => speakView(m[1]), "speak"],
  [/^\/phrases$/, () => phrasebookView(), "speak"],
  [/^\/review$/, () => reviewView(), "more"],
  [/^\/letters$/, () => lettersView(), "learn"],
  [/^\/letter\/([\w-]+)$/, (m) => letterView(m[1]), "learn"],
  [/^\/talk$/, (_m, params) => talkView(params), "talk"],
  [/^\/stories$/, () => libraryView(), "stories"],
  [/^\/story\/([\w-]+)$/, (m) => storyView(m[1]), "stories"],
  [/^\/history$/, () => storiesView(), "stories"],
  [/^\/voices$/, () => voicesView(), "more"],
  [/^\/more$/, () => moreView(route), "more"],
];

function route() {
  const raw = location.hash.replace(/^#/, "") || "/home";
  const [pathAndAnchor, query = ""] = raw.split("?");
  const [path, anchor] = pathAndAnchor.split("#");
  const params = new URLSearchParams(query);
  for (const [re, make, tab] of ROUTES) {
    const m = path.match(re);
    if (!m) continue;
    const view = make(m, params);
    if (!view) break;
    clear(main, view);
    document.querySelectorAll("[data-tab]").forEach((a) => a.classList.toggle("active", a.dataset.tab === tab));
    main.focus({ preventScroll: true });
    const target = anchor && document.getElementById(anchor);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    else window.scrollTo(0, 0);
    return;
  }
  location.hash = "#/home";
}

function wireShell() {
  document.getElementById("settings-btn").addEventListener("click", () => openSettings(route));
  const amb = document.getElementById("ambience-btn");
  const syncAmb = () => {
    const on = store.get().settings.ambience;
    amb.setAttribute("aria-pressed", String(on));
    amb.title = on ? "Fountain sounds on" : "Fountain sounds off";
  };
  amb.addEventListener("click", () => {
    store.update((s) => (s.settings.ambience = !s.settings.ambience));
    setAmbience(store.get().settings.ambience);
    syncAmb();
  });
  syncAmb();
}

async function start() {
  applyTheme();
  wireShell();
  registerServiceWorker();
  loadBundled();
  await loadStatus();
  window.addEventListener("hashchange", route);
  const begin = () => {
    refreshRecordings().finally(route);
    if (!store.get().onboarded) openOnboarding(route);
  };
  if (getStatus().passcodeRequired && !store.get().passcode) openPasscode(begin);
  else begin();
}

start();

export { h };
