import { h, fa } from "../lib/dom.js";
import { store } from "../lib/store.js";
import { LESSONS, PROVERBS } from "../data/lessons.js";
import { gardenSvg, allDone } from "../garden.js";
import { READING } from "../data/reading.js";
import { SPEAK } from "../data/speak.js";
import { STORIES } from "../data/stories.js";
import { dueCount } from "../lib/review.js";
import { installHelp, isStandalone } from "./settings.js";
import { highlightedWord, sayIt, listenButtons, avatar } from "../components.js";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return { fa: "صبح بخیر", translit: "sobh bekheyr", meaning: "good morning" };
  if (hour < 18) return { fa: "عصر بخیر", translit: "asr bekheyr", meaning: "good afternoon" };
  return { fa: "شب بخیر", translit: "shab bekheyr", meaning: "good evening" };
}

const dayIndex = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);

export function homeView() {
  const s = store.get();
  const done = new Set(s.lessonsDone);
  const next = LESSONS.find((l) => !done.has(l.id));
  const allWords = LESSONS.flatMap((l) => l.words);
  const word = allWords[dayIndex() % allWords.length];
  const proverb = PROVERBS[dayIndex() % PROVERBS.length];
  const hello = greeting();
  const grown = LESSONS.filter((l) => done.has(l.id)).length;
  const nextSpeak = SPEAK.find((u) => !s.speakingDone.includes(u.id)) ?? SPEAK[0];
  const nextRead = READING.find((u) => !s.readingDone.includes(u.id)) ?? READING[0];
  const story = STORIES[dayIndex() % STORIES.length];

  return h(
    "section",
    { class: "view home" },
    h(
      "header",
      { class: "hero" },
      avatar("lg"),
      h(
        "div",
        {},
        h("p", { class: "eyebrow" }, `${hello.translit} — ${hello.meaning}`),
        h("h1", {}, fa(hello.fa, "hero-fa"), s.name ? h("span", { class: "hero-name" }, ` ${s.name} joon`) : null),
        h("p", { class: "lede" }, next
          ? grown === 0 ? "Welcome to your garden. Let's plant the very first seed together — it only takes a few minutes." : "Your garden is growing. A few calm minutes today is plenty."
          : "Your garden is in full bloom. Come and chat with me whenever you like. 🌸"),
      ),
    ),
    installCard(),
    h(
      "div",
      { class: "card garden-card" },
      gardenSvg(allDone()),
      h(
        "p",
        { class: "garden-caption" },
        `🌿 ${grown}/${LESSONS.length} plants · 🔷 ${READING.filter((r) => s.readingDone.includes(r.id)).length}/${READING.length} tiles · 🏮 ${SPEAK.filter((r) => s.speakingDone.includes(r.id)).length}/${SPEAK.length} lanterns`,
      ),
    ),
    reviewCard(),
    next
      ? h(
          "a",
          { class: "card continue", href: `#/lesson/${next.id}` },
          h("span", { class: "continue-fa" }, fa(next.titleFa)),
          h("span", { class: "continue-text" }, h("small", {}, grown ? "Next on your path" : "Start here"), h("strong", {}, next.title), h("small", {}, `Brings ${next.plantName} to your garden`)),
          h("span", { class: "btn primary" }, grown ? "Continue" : "Begin"),
        )
      : null,
    h(
      "div",
      { class: "grid two" },
      h(
        "article",
        { class: "card daily" },
        h("p", { class: "eyebrow" }, "Word of the day"),
        h("div", { class: "word-top" }, highlightedWord(word.fa, word.focus), h("div", { class: "word-meta" }, h("span", { class: "translit" }, word.translit), h("span", { class: "meaning" }, word.meaning))),
        word.note ? h("p", { class: "note" }, word.note) : null,
        sayIt(word),
      ),
      h(
        "article",
        { class: "card proverb" },
        h("p", { class: "eyebrow" }, "A saying to carry with you"),
        h("p", { class: "nastaliq", lang: "fa", dir: "rtl" }, proverb.fa),
        h("p", { class: "translit" }, proverb.translit),
        h("p", { class: "meaning" }, proverb.meaning),
        listenButtons(proverb.fa),
      ),
    ),
    h(
      "nav",
      { class: "quick-links" },
      h("a", { class: "card link-card", href: `#/speak/${nextSpeak.id}` }, h("span", { class: "link-emoji" }, nextSpeak.icon), h("strong", {}, "Speak in Iran"), h("small", {}, `Next: ${nextSpeak.title}`)),
      h("a", { class: "card link-card", href: `#/read/${nextRead.id}` }, h("span", { class: "link-emoji" }, "📖"), h("strong", {}, "Reading Room"), h("small", {}, `Next: ${nextRead.title}`)),
      h("a", { class: "card link-card", href: `#/story/${story.id}` }, h("span", { class: "link-emoji" }, "📜"), h("strong", {}, "Story of the day"), h("small", {}, story.title)),
      h("a", { class: "card link-card", href: "#/talk" }, h("span", { class: "link-emoji" }, "💬"), h("strong", {}, "Talk with Shirin"), h("small", {}, "Ask anything, or just chat")),
    ),
  );
}

function reviewCard() {
  const n = dueCount();
  if (!n) return null;
  return h(
    "a",
    { class: "card continue review-call", href: "#/review" },
    h("span", { class: "continue-fa", "aria-hidden": "true" }, "🔁"),
    h("span", { class: "continue-text" }, h("small", {}, "Today's review"), h("strong", {}, `${n} word${n === 1 ? "" : "s"} to refresh`), h("small", {}, "About two minutes")),
    h("span", { class: "btn soft" }, "Review"),
  );
}

function installCard() {
  const s = store.get();
  const iOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  if (!iOS || isStandalone() || s.installHintDismissed) return null;
  const card = h(
    "div",
    { class: "card install-card" },
    h("span", { class: "link-emoji", "aria-hidden": "true" }, "📲"),
    h("p", {}, h("strong", {}, "Put Golestan on your Home Screen. "), "It opens full-screen like an app, and works offline in Iran."),
    h("div", { class: "row" }, h("button", { class: "btn primary small", type: "button", onclick: () => installHelp() }, "Show me how"), h("button", { class: "btn ghost small", type: "button", onclick: () => { store.update((st) => (st.installHintDismissed = true)); card.remove(); } }, "Later")),
  );
  return card;
}
