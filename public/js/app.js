import { h, clear } from "./lib/dom.js";
import { store } from "./lib/store.js";
import { loadStatus, getStatus } from "./lib/api.js";
import { refreshRecordings } from "./lib/speech.js";
import { setAmbience } from "./lib/sound.js";
import { homeView } from "./views/home.js";
import { pathView } from "./views/path.js";
import { lessonView, customLessonView } from "./views/lesson.js";
import { lettersView, letterView } from "./views/letters.js";
import { talkView } from "./views/talk.js";
import { storiesView } from "./views/stories.js";
import { voicesView } from "./views/voices.js";
import { applyTheme, openOnboarding, openSettings, openPasscode } from "./views/settings.js";

const main = document.getElementById("main");

const ROUTES = [
  [/^\/?(home)?$/, () => homeView(), "home"],
  [/^\/path$/, () => pathView(), "path"],
  [/^\/lesson\/([\w-]+)$/, (m) => lessonView(m[1]), "path"],
  [/^\/custom\/([\w-]+)$/, (m) => customLessonView(m[1]), "path"],
  [/^\/letters$/, () => lettersView(), "letters"],
  [/^\/letter\/([\w-]+)$/, (m) => letterView(m[1]), "letters"],
  [/^\/talk$/, (_m, params) => talkView(params), "talk"],
  [/^\/stories$/, () => storiesView(), "stories"],
  [/^\/voices$/, () => voicesView(), "voices"],
];

function route() {
  const raw = location.hash.replace(/^#/, "") || "/home";
  const [path, query = ""] = raw.split("?");
  const params = new URLSearchParams(query);
  for (const [re, make, tab] of ROUTES) {
    const m = path.match(re);
    if (!m) continue;
    const view = make(m, params);
    if (!view) break;
    clear(main, view);
    document.querySelectorAll("[data-tab]").forEach((a) => a.classList.toggle("active", a.dataset.tab === tab));
    main.focus({ preventScroll: true });
    window.scrollTo(0, 0);
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
  await loadStatus();
  const status = getStatus();
  if (status.offline) {
    document.getElementById("banner").replaceChildren(
      h("p", {}, "🌙 Can't reach the garden's server. The letters still work; start the server with ", h("code", {}, "npm start"), " for everything else."),
    );
    document.getElementById("banner").hidden = false;
  }
  window.addEventListener("hashchange", route);
  const begin = () => {
    refreshRecordings().finally(route);
    if (!store.get().onboarded) openOnboarding(route);
  };
  if (status.passcodeRequired && !store.get().passcode) openPasscode(begin);
  else begin();
}

start();
