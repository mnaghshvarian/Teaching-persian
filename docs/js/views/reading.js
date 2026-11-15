// The Reading Room: read real Persian first, then reveal.

import { h, fa, richText } from "../lib/dom.js";
import { store } from "../lib/store.js";
import { READING, BY_READING } from "../data/reading.js";
import { chime } from "../lib/sound.js";
import { addToReview } from "../lib/review.js";
import { shirinSays, sayIt, listenButtons, question, player, gardenStep } from "../components.js";

const shuffle = (arr) => arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(([, v]) => v);

function readCard(item, index, total) {
  const answer = h(
    "div",
    { class: "reveal", hidden: true },
    h("p", { class: "translit big" }, item.translit),
    h("p", { class: "meaning" }, item.meaning),
    item.note ? h("p", { class: "note" }, item.note) : null,
    sayIt(item),
  );
  const btn = h(
    "button",
    {
      class: "btn soft",
      type: "button",
      onclick: () => {
        answer.hidden = false;
        btn.hidden = true;
      },
    },
    "👀 Show me",
  );
  return h(
    "article",
    { class: "read-card" },
    h("p", { class: "eyebrow" }, `${index + 1} of ${total} · read it, then peek`),
    h("div", { class: "read-fa" }, fa(item.fa)),
    h("div", { class: "row center" }, btn),
    answer,
  );
}

export function readingView(id) {
  const unit = BY_READING[id];
  if (!unit) return null;
  const wasDone = store.get().readingDone.includes(id);
  const per = 4;
  const pages = [];
  for (let i = 0; i < unit.items.length; i += per) pages.push(unit.items.slice(i, i + per));

  const quiz = shuffle(unit.items)
    .slice(0, 3)
    .map((it) => {
      const wrong = shuffle(unit.items.filter((x) => x !== it)).slice(0, 2);
      const choices = shuffle([it, ...wrong]);
      return {
        prompt: "What does this say?",
        promptFa: it.fa,
        options: choices.map((c) => c.meaning),
        answer: choices.indexOf(it),
        hint: `It's read “${it.translit}”.`,
        celebrate: `Yes — ${it.translit}! You read it. ✨`,
      };
    });

  const steps = [
    {
      render: () =>
        h(
          "div",
          { class: "intro" },
          h("h2", { tabindex: "-1", class: "sr-only" }, "Introduction"),
          h("div", { class: "intro-fa" }, fa(unit.titleFa)),
          shirinSays(unit.intro),
          unit.tips?.length ? h("ul", { class: "tips card" }, unit.tips.map((t) => h("li", {}, richText(t)))) : null,
        ),
      nextLabel: "Let's read →",
    },
    ...pages.map((page, pi) => ({
      render: () =>
        h(
          "div",
          { class: "reading" },
          h("h2", { tabindex: "-1" }, pi === 0 ? "Try reading these" : "A few more"),
          page.map((it, k) => readCard(it, pi * per + k, unit.items.length)),
        ),
    })),
    {
      render: () =>
        h(
          "div",
          { class: "quiz" },
          h("h2", { tabindex: "-1" }, "Can you read it?"),
          h("p", { class: "lede" }, "No transliteration this time — just you and the Persian. Wrong taps only get a hint."),
          quiz.map((q) => question(q)),
        ),
    },
    gardenStep({
      title: wasDone ? "Read again — lovely" : "A new tile for your garden",
      text: wasDone ? `You read “${unit.title}” again.` : "Turquoise tilework now shines in one of your garden's arches. 🌿",
      freshId: wasDone ? null : id,
    }),
  ];

  return player(unit.title, steps, "#/learn", () => {
    if (!wasDone) chime("bloom");
    store.update((s) => {
      if (!s.readingDone.includes(id)) s.readingDone.push(id);
    });
    addToReview(unit.items.filter((it) => !/^[۰-۹]/.test(it.fa) || it.fa.includes("تومان")));
  });
}

export function readingList() {
  const done = new Set(store.get().readingDone);
  return h(
    "ol",
    { class: "unit-list" },
    READING.map((r, i) =>
      h(
        "li",
        {},
        h(
          "a",
          { class: `unit-card ${done.has(r.id) ? "done" : ""}`, href: `#/read/${r.id}` },
          h("span", { class: "unit-fa" }, fa(r.titleFa)),
          h("span", { class: "unit-text" }, h("strong", {}, r.title), h("small", {}, done.has(r.id) ? "✓ Read" : `${r.items.length} things to read`)),
          h("span", { class: "unit-num", "aria-hidden": "true" }, String(i + 1)),
        ),
      ),
    ),
  );
}

export { listenButtons };
