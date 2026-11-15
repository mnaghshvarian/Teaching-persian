import { h, fa, richText } from "../lib/dom.js";
import { LESSONS } from "../data/lessons.js";

export function storiesView() {
  return h(
    "section",
    { class: "view stories" },
    h("header", { class: "page-head" }, h("a", { class: "back-link", href: "#/stories" }, "← All stories"), h("h1", {}, "Tea-time history"), h("p", { class: "lede" }, "A little history and culture, one cup of tea at a time — the stories from the alphabet path.")),
    h(
      "div",
      { class: "story-grid" },
      LESSONS.map((l) =>
        h(
          "details",
          { class: "card story-card" },
          h("summary", {}, h("span", { class: "story-fa" }, fa(l.titleFa)), h("span", {}, h("strong", {}, l.story.title), h("small", {}, `from “${l.title}”`))),
          h(
            "div",
            { class: "story" },
            richText(l.story.body),
            h("p", { class: "bridge" }, "🍁 ", l.story.bridge),
            h(
              "div",
              { class: "row wrap" },
              h("a", { class: "btn soft", href: `#/talk?ask=${encodeURIComponent(`Tell me more about “${l.story.title}”, please.`)}` }, "💬 Ask Shirin for more"),
              h("a", { class: "btn ghost", href: `#/lesson/${l.id}` }, "🌿 Open the lesson"),
            ),
          ),
        ),
      ),
    ),
  );
}
