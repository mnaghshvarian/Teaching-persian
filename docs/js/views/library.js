// The Story Library: Persian through stories — Shahnameh, love stories,
// Kalileh and Demneh, Saadi, Hafez, the Prophet's family and the Quran.

import { h, fa, richText, icon, toast } from "../lib/dom.js";
import { store } from "../lib/store.js";
import { COLLECTIONS, STORIES, BY_STORY } from "../data/stories.js";
import { plateSvg } from "../plates.js";
import { sayPersian, sayPersianAndWait, stopSpeaking } from "../lib/speech.js";
import { chime } from "../lib/sound.js";
import { addToReview } from "../lib/review.js";
import { getStatus } from "../lib/api.js";
import { listenButtons, question } from "../components.js";

const shuffle = (arr) => arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(([, v]) => v);
const dayIndex = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
const readSet = () => new Set(store.get().storiesRead ?? []);
const collectionOf = (story) => COLLECTIONS.find((c) => c.id === story.collection);

/** The story's picture: a museum painting in a manuscript frame, or an illuminated plate. */
export function storyPicture(story, { thumb = false } = {}) {
  if (story.image) {
    const img = h("img", {
      src: `stories/img/${story.image}.jpg`,
      alt: story.credit ? story.credit.title.replace(/[“”]/g, "") : story.title,
      loading: thumb ? "lazy" : "eager",
      decoding: "async",
    });
    if (thumb) return h("span", { class: "thumb" }, img);
    return h(
      "figure",
      { class: "miniature" },
      h("div", { class: "miniature-frame" }, img),
      story.credit
        ? h(
            "figcaption",
            {},
            story.credit.title,
            `, ${story.credit.date}. `,
            h("a", { href: story.credit.url, target: "_blank", rel: "noopener" }, "The Metropolitan Museum of Art"),
            " · public domain",
          )
        : null,
    );
  }
  const svg = plateSvg(story.plate, story.titleFa);
  if (thumb) return h("span", { class: "thumb plate" }, svg);
  return h("figure", { class: "miniature plate" }, svg, h("figcaption", {}, "An illuminated plate — holy figures are never pictured."));
}

function levelDots(level) {
  return h("span", { class: "level", title: ["", "Gentle", "Steady", "Rich"][level], "aria-label": `Level ${level} of 3` }, "●".repeat(level), h("span", { class: "dim" }, "●".repeat(3 - level)));
}

function storyCard(story, read) {
  return h(
    "a",
    { class: `story-tile ${read.has(story.id) ? "read" : ""}`, href: `#/story/${story.id}` },
    storyPicture(story, { thumb: true }),
    h("span", { class: "tile-title" }, story.title),
    h("span", { class: "tile-fa" }, fa(story.titleFa)),
    h("span", { class: "tile-meta" }, levelDots(story.level), read.has(story.id) ? h("span", { class: "tick" }, "✓ read") : null),
  );
}

export function libraryView() {
  const read = readSet();
  const featured = STORIES[dayIndex() % STORIES.length];
  return h(
    "section",
    { class: "view library" },
    h(
      "header",
      { class: "page-head" },
      h("h1", {}, "Stories"),
      h(
        "p",
        { class: "lede" },
        "Learn Persian the way Iranian children do — through stories. Each one is told in short, simple Persian, with sound for every sentence. Read the Persian first; peek at the help whenever you like.",
      ),
      h("p", { class: "small" }, `📚 ${read.size} of ${STORIES.length} stories read`),
    ),
    h(
      "a",
      { class: "card featured-story", href: `#/story/${featured.id}` },
      storyPicture(featured, { thumb: true }),
      h(
        "span",
        { class: "featured-text" },
        h("small", {}, "Story of the day"),
        h("strong", {}, featured.title),
        fa(featured.titleFa, "featured-fa"),
        h("small", {}, collectionOf(featured).title),
      ),
    ),
    COLLECTIONS.map((col) => {
      const stories = STORIES.filter((s) => s.collection === col.id);
      return h(
        "section",
        { class: "collection", id: `col-${col.id}` },
        h("h2", {}, col.title, " ", fa(col.titleFa, "col-fa")),
        h("p", { class: "lede small" }, richText(col.blurb)),
        h("div", { class: "story-row" }, stories.map((s) => storyCard(s, read))),
      );
    }),
    h(
      "a",
      { class: "card link-card history-link", href: "#/history" },
      h("span", { class: "link-emoji", "aria-hidden": "true" }, "🍵"),
      h("strong", {}, "Tea-time history"),
      h("small", {}, "Nowruz, Yalda, Ferdowsi, Rumi, ta'ârof… the stories from the alphabet path"),
    ),
  );
}

// ---------------------------------------------------------------- the reader

const HELP = [
  ["fa", "Persian only"],
  ["translit", "+ sounds"],
  ["all", "+ English"],
];

function lineItem(line, { poem = false } = {}) {
  const li = h(
    "li",
    { class: `story-line ${poem ? "verse" : ""}` },
    h("p", { class: `line-fa ${poem ? "nastaliq" : ""}`, lang: "fa", dir: "rtl" }, line.fa),
    h("p", { class: "line-translit translit" }, line.translit),
    h("p", { class: "line-en" }, line.en),
    h("button", { class: "btn icon-btn line-play", type: "button", "aria-label": "Listen", title: "Listen", onclick: (e) => { e.stopPropagation(); sayPersian(line.fa); } }, icon("speaker")),
  );
  li.addEventListener("click", () => {
    li.classList.toggle("open");
    sayPersian(line.fa);
  });
  return li;
}

function falDialog(story) {
  const result = h("div", { class: "fal-result", hidden: true });
  const take = h("button", { class: "btn primary", type: "button" }, "🌙 Open the Divan");
  const dlg = h(
    "dialog",
    { class: "dialog fal" },
    h(
      "form",
      { method: "dialog" },
      h("h2", {}, "Fâl-e Hâfez ", fa("فال حافظ")),
      h("p", { class: "lede" }, "Close your eyes, think of a wish or a question, and say softly: “O Hafez of Shiraz, tell me…” Then open the Divan."),
      h("div", { class: "row center" }, take),
      result,
      h("div", { class: "row center" }, h("button", { class: "btn ghost", type: "submit" }, "Close")),
    ),
  );
  take.addEventListener("click", () => {
    const c = story.couplets[Math.floor(Math.random() * story.couplets.length)];
    chime("bloom");
    result.hidden = false;
    take.textContent = "🌙 Another fâl";
    result.replaceChildren(
      h("p", { class: "nastaliq couplet", lang: "fa", dir: "rtl" }, c.fa),
      h("p", { class: "translit couplet-translit" }, c.translit),
      h("p", { class: "couplet-en" }, c.en),
      h("p", { class: "fal-reading" }, "🌸 ", c.reading),
      listenButtons(c.fa),
    );
    sayPersian(c.fa);
  });
  dlg.addEventListener("close", () => dlg.remove());
  document.body.append(dlg);
  dlg.showModal();
}

export function storyView(id) {
  const story = BY_STORY[id];
  if (!story) return null;
  const col = collectionOf(story);
  const siblings = STORIES.filter((s) => s.collection === story.collection);
  const next = siblings[siblings.indexOf(story) + 1] ?? STORIES[(STORIES.indexOf(story) + 1) % STORIES.length];

  const linesEl = h("ol", { class: `story-lines ${story.poem ? "poem" : ""}` });
  const items = story.sentences ?? story.poem ?? [];
  const lis = items.map((l) => lineItem(l, { poem: Boolean(story.poem) }));
  linesEl.append(...lis);

  // how much help to show
  const helpBar = h("div", { class: "help-toggle", role: "group", "aria-label": "How much help to show" });
  const setHelp = (level) => {
    store.update((s) => (s.settings.storyHelp = level));
    view.dataset.help = level;
    [...helpBar.children].forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.level === level)));
  };
  HELP.forEach(([level, label]) =>
    helpBar.append(h("button", { class: "seg", type: "button", dataset: { level }, onclick: () => setHelp(level) }, label)),
  );

  // listen to the whole story, line by line
  let playing = false;
  const playAll = h("button", { class: "btn primary", type: "button" }, icon("play"), h("span", {}, "Listen to the story"));
  playAll.addEventListener("click", async () => {
    if (playing) {
      playing = false;
      stopSpeaking();
      return;
    }
    playing = true;
    playAll.lastChild.textContent = "Stop";
    for (let i = 0; i < items.length && playing; i++) {
      lis.forEach((el, k) => el.classList.toggle("now", k === i));
      lis[i].scrollIntoView({ block: "center", behavior: "smooth" });
      await sayPersianAndWait(items[i].fa);
      await new Promise((r) => setTimeout(r, 500));
    }
    lis.forEach((el) => el.classList.remove("now"));
    playing = false;
    playAll.lastChild.textContent = "Listen to the story";
  });

  const quiz = shuffle(story.words)
    .slice(0, 3)
    .map((w) => {
      const wrong = shuffle(story.words.filter((x) => x !== w)).slice(0, 2);
      const choices = shuffle([w, ...wrong]);
      return {
        prompt: "What does this word mean?",
        promptFa: w.fa,
        options: choices.map((c) => c.meaning),
        answer: choices.indexOf(w),
        hint: `It's said “${w.translit}”.`,
        celebrate: `Yes — ${w.translit}! ✨`,
      };
    });

  const done = readSet().has(story.id);
  const finish = h("button", { class: "btn primary", type: "button" }, done ? "✓ Read — read it again any time" : "✓ I've read this story");
  finish.addEventListener("click", () => {
    store.update((s) => {
      s.storiesRead = [...new Set([...(s.storiesRead ?? []), story.id])];
    });
    addToReview(story.words);
    chime("bloom");
    finish.textContent = "✓ Read — its words are in your review 🌸";
    toast("آفرین (âfarin)! Another story in your library. 📚");
  });

  const view = h(
    "article",
    { class: "view story-reader" },
    h("a", { class: "back-link", href: `#/stories` }, "← All stories"),
    storyPicture(story),
    h("p", { class: "eyebrow" }, col.title),
    h("h1", {}, story.title),
    h("p", { class: "story-title-fa nastaliq", lang: "fa", dir: "rtl" }, story.titleFa),
    h("p", { class: "about" }, richText(story.about)),
    story.couplets
      ? h("div", { class: "card fal-card" }, h("p", {}, "🌙 Make a wish and let Hafez answer, as Iranians do on Yalda night."), h("button", { class: "btn primary", type: "button", onclick: () => falDialog(story) }, "Take a fâl"))
      : null,
    h("div", { class: "reader-tools" }, playAll, helpBar),
    h("p", { class: "small" }, "Read each line in Persian first. Tap a line to hear it and see the help."),
    linesEl,
    story.couplets
      ? h(
          "section",
          { class: "couplets" },
          h("h2", {}, "Lines to carry with you"),
          story.couplets.map((c) =>
            h(
              "div",
              { class: "card couplet-card" },
              h("p", { class: "nastaliq couplet", lang: "fa", dir: "rtl" }, c.fa),
              h("p", { class: "translit couplet-translit" }, c.translit),
              h("p", { class: "couplet-en" }, c.en),
              listenButtons(c.fa),
            ),
          ),
        )
      : null,
    story.moral
      ? h(
          "div",
          { class: "closing moral" },
          h("p", { class: "eyebrow" }, "The lesson"),
          h("p", { class: "nastaliq", lang: "fa", dir: "rtl" }, story.moral.fa),
          h("p", { class: "translit" }, story.moral.translit),
          h("p", { class: "meaning" }, story.moral.en),
          listenButtons(story.moral.fa, { slowToo: false }),
        )
      : null,
    h("h2", {}, "Words from the story"),
    h(
      "ul",
      { class: "story-words" },
      story.words.map((w) =>
        h(
          "li",
          {},
          h("button", { class: "pb-main", type: "button", onclick: () => sayPersian(w.fa) }, h("span", { class: "pb-fa" }, fa(w.fa)), h("span", { class: "pb-en" }, h("span", { class: "translit" }, w.translit), h("span", { class: "meaning" }, w.meaning))),
        ),
      ),
    ),
    h("h2", {}, "A little check"),
    quiz.map((q) => question(q)),
    h(
      "div",
      { class: "row wrap center story-end" },
      finish,
      getStatus().ai
        ? h("a", { class: "btn soft", href: `#/talk?ask=${encodeURIComponent(`Can you tell me more about the story “${story.title}”, and teach me one more Persian word from it?`)}` }, "💬 Ask Shirin about it")
        : null,
      h("a", { class: "btn ghost", href: `#/story/${next.id}` }, `Next: ${next.title} →`),
    ),
  );
  view.dataset.help = store.get().settings.storyHelp ?? "translit";
  [...helpBar.children].forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.level === view.dataset.help)));
  return view;
}
