import { h, fa, toast } from "../lib/dom.js";
import { store } from "../lib/store.js";
import { LESSONS } from "../data/lessons.js";
import { designLesson, getStatus } from "../lib/api.js";
import { chime } from "../lib/sound.js";
import { READING } from "../data/reading.js";
import { SPEAK } from "../data/speak.js";
import { readingList } from "./reading.js";

const IDEAS = [
  "Ordering at a Persian bakery on Yonge Street",
  "Words for a trip to Shiraz and Isfahan",
  "Greeting family politely at Nowruz",
  "Words for a cozy Persian dinner",
  "Yalda night is coming — what will I hear?",
  "Kind things to say to my husband",
  "A gentle review of everything I've learned",
];

const CALM_LINES = [
  "Shirin is pouring a fresh glass of tea… 🍵",
  "She's choosing words you'll really use…",
  "Double-checking every spelling and sound…",
  "Finding a story to go with it…",
  "Arranging it all, one petal at a time… 🌸",
];

export function learnView() {
  const s = store.get();
  const done = new Set(s.lessonsDone);
  const nextId = LESSONS.find((l) => !done.has(l.id))?.id;

  const stops = LESSONS.map((l, i) =>
    h(
      "li",
      { class: `stop ${done.has(l.id) ? "done" : ""} ${l.id === nextId ? "next" : ""}` },
      h("span", { class: "stop-dot", "aria-hidden": "true" }, done.has(l.id) ? "✓" : String(i)),
      h(
        "a",
        { class: "stop-card", href: `#/lesson/${l.id}` },
        h("span", { class: "stop-fa" }, fa(l.titleFa)),
        h("span", { class: "stop-text" }, h("strong", {}, l.title), h("small", {}, done.has(l.id) ? `In your garden: ${l.plantName}` : l.id === nextId ? `Next · brings ${l.plantName}` : `Brings ${l.plantName}`)),
      ),
    ),
  );

  const readDone = READING.filter((r) => s.readingDone.includes(r.id)).length;
  const speakDone = SPEAK.filter((r) => s.speakingDone.includes(r.id)).length;
  const lettersDone = LESSONS.filter((l) => done.has(l.id)).length;
  const track = (href, icon, title, sub, n, total) =>
    h(
      "a",
      { class: "card track", href },
      h("span", { class: "track-icon", "aria-hidden": "true" }, icon),
      h("span", { class: "track-text" }, h("strong", {}, title), h("small", {}, sub)),
      h("span", { class: "track-meter", role: "img", "aria-label": `${n} of ${total} done` }, h("span", { style: { width: `${Math.round((n / total) * 100)}%` } })),
      h("small", { class: "track-count" }, `${n}/${total}`),
    );

  return h(
    "section",
    { class: "view path" },
    h(
      "header",
      { class: "page-head" },
      h("h1", {}, "Learn"),
      h("p", { class: "lede" }, "Three gentle paths to reading and speaking Persian on your own. Wander in any order — nothing is locked, and there's no clock ticking."),
    ),
    h(
      "div",
      { class: "tracks" },
      track("#/learn#alphabet", "الف", "1 · The alphabet", "All 32 letters, a plant for each stop", lettersDone, LESSONS.length),
      track("#/learn#reading", "📖", "2 · The Reading Room", "Signs, menus, prices, messages, a story", readDone, READING.length),
      track("#/speak", "🗣", "3 · Speak in Iran", "Ten real situations, with practice", speakDone, SPEAK.length),
    ),
    h("h2", { id: "alphabet" }, "The alphabet path"),
    h("p", { class: "lede" }, "Thirteen calm stops. Each one brings something new to your garden. ", h("a", { href: "#/letters" }, "See all 32 letters →")),
    h("ol", { class: "stops" }, stops),
    h("h2", { id: "reading" }, "The Reading Room"),
    h("p", { class: "lede" }, "Read real Persian first, then peek. Each unit tiles an arch in your garden."),
    readingList(),
    designer(),
  );
}

function designer() {
  const s = store.get();
  const status = getStatus();
  const custom = s.customLessons;

  const input = h("textarea", { id: "topic", rows: 2, maxlength: 300, placeholder: "e.g. Words for meeting family at Nowruz" });
  const chips = h(
    "div",
    { class: "chips" },
    IDEAS.map((idea) => h("button", { class: "chip", type: "button", onclick: () => { input.value = idea; input.focus(); } }, idea)),
  );
  const progress = h("div", { class: "design-progress", hidden: true });
  const go = h("button", { class: "btn primary", type: "button" }, "✨ Prepare my lesson");

  go.addEventListener("click", async () => {
    const topic = input.value.trim();
    if (!topic) {
      toast("Tell Shirin what you'd like to learn about. 🌿");
      input.focus();
      return;
    }
    const abort = new AbortController();
    go.disabled = true;
    progress.hidden = false;
    const started = Date.now();
    const line = h("p", { class: "calm-line" }, CALM_LINES[0]);
    const clock = h("small", {}, "");
    const cancel = h("button", { class: "btn ghost", type: "button", onclick: () => abort.abort() }, "Stop");
    progress.replaceChildren(h("div", { class: "brewing", "aria-hidden": "true" }, h("span"), h("span"), h("span")), line, clock, cancel);
    const timer = setInterval(() => {
      const secs = Math.round((Date.now() - started) / 1000);
      line.textContent = CALM_LINES[Math.floor(secs / 9) % CALM_LINES.length];
      clock.textContent = `Thinking deeply for ${secs}s — careful lessons take a minute or two.`;
    }, 1000);
    try {
      const lesson = await designLesson(topic, abort.signal);
      const id = `c${Date.now().toString(36)}`;
      store.update((st) => {
        st.customLessons = [{ id, topic, createdAt: new Date().toISOString(), lesson }, ...st.customLessons].slice(0, 30);
      });
      chime("bloom");
      location.hash = `#/custom/${id}`;
    } catch (err) {
      if (!abort.signal.aborted) toast(err.message || "Shirin couldn't finish that lesson. Please try again.", 6000);
    } finally {
      clearInterval(timer);
      go.disabled = false;
      progress.hidden = true;
    }
  });

  return h(
    "section",
    { class: "card designer" },
    h("h2", {}, "A lesson made just for you"),
    h("p", {}, "Tell Shirin what you'd like to be able to say. She'll think it through carefully and prepare a short lesson — words, a story, and a gentle quiz."),
    status.ai
      ? h("div", { class: "designer-form" }, h("label", { for: "topic", class: "sr-only" }, "Lesson topic"), input, chips, h("div", { class: "row" }, go), progress)
      : h("p", { class: "resting" }, "🌙 Shirin is resting right now — once an API key is added to the server, she can prepare lessons for you."),
    custom.length
      ? h(
          "div",
          { class: "custom-list" },
          h("h3", {}, "Your lessons from Shirin"),
          h(
            "ul",
            {},
            custom.map((c) =>
              h(
                "li",
                {},
                h("a", { href: `#/custom/${c.id}` }, c.lesson.title_fa ? fa(c.lesson.title_fa) : null, " ", c.lesson.title),
                h(
                  "button",
                  {
                    class: "btn icon-btn",
                    type: "button",
                    "aria-label": `Remove ${c.lesson.title}`,
                    title: "Remove",
                    onclick: () => {
                      if (!confirm(`Remove “${c.lesson.title}”?`)) return;
                      store.update((st) => (st.customLessons = st.customLessons.filter((x) => x.id !== c.id)));
                      window.dispatchEvent(new HashChangeEvent("hashchange"));
                    },
                  },
                  "×",
                ),
              ),
            ),
          ),
        )
      : null,
  );
}
