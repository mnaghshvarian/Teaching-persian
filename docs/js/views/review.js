// Today's review: a few words she has met, Persian first. She reads, peeks,
// and says whether she knew it. Two minutes a day keeps everything fresh.

import { h, fa } from "../lib/dom.js";
import { dueItems, grade, reviewSize } from "../lib/review.js";
import { chime } from "../lib/sound.js";
import { sayIt } from "../components.js";

export function reviewView() {
  const items = dueItems(12);
  const wrap = h("div", { class: "review-wrap" });
  const total = items.length;
  let i = 0;
  let knew = 0;

  function card() {
    if (i >= items.length) {
      chime("bloom");
      wrap.replaceChildren(
        h(
          "div",
          { class: "card center-card" },
          h("p", { class: "big-emoji", "aria-hidden": "true" }, "🌸"),
          h("h2", {}, total ? "All done for today" : "Nothing to review right now"),
          h(
            "p",
            { class: "lede" },
            total
              ? `You remembered ${knew} of ${total}. The ones you weren't sure of will come back soon — that's how memory grows.`
              : reviewSize()
                ? "Everything you've learned is resting. Come back tomorrow, or learn something new. 🌿"
                : "Finish a lesson, a reading or a situation, and its words will come back here to stay fresh.",
          ),
          h("a", { class: "btn primary", href: "#/learn" }, "Learn something new"),
        ),
      );
      return;
    }
    const it = items[i];
    const answer = h(
      "div",
      { class: "reveal", hidden: true },
      h("p", { class: "translit big" }, it.translit),
      h("p", { class: "meaning" }, it.meaning),
      sayIt(it),
      h(
        "div",
        { class: "row center wrap" },
        h("button", { class: "btn ghost", type: "button", onclick: () => next(false) }, "Not yet — show me again soon"),
        h("button", { class: "btn primary", type: "button", onclick: () => next(true) }, "I knew it ✓"),
      ),
    );
    const peek = h("button", { class: "btn soft", type: "button", onclick: () => { answer.hidden = false; peek.hidden = true; } }, "👀 Show me");
    wrap.replaceChildren(
      h(
        "article",
        { class: "read-card review-card" },
        h("p", { class: "eyebrow" }, `${i + 1} of ${total}${it.from ? ` · from ${it.from}` : ""}`),
        h("div", { class: "read-fa" }, fa(it.fa)),
        h("p", { class: "lede center" }, "Read it — what does it say?"),
        h("div", { class: "row center" }, peek),
        answer,
      ),
    );
  }

  function next(yes) {
    grade(items[i].fa, yes);
    if (yes) {
      knew++;
      chime("yes");
    }
    i++;
    card();
  }

  card();
  return h(
    "section",
    { class: "view review" },
    h("header", { class: "page-head" }, h("h1", {}, "Today's review"), h("p", { class: "lede" }, "A few words you've met, Persian first. Nothing to fail — just a gentle refresh.")),
    wrap,
  );
}
