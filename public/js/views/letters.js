import { h, fa } from "../lib/dom.js";
import { store } from "../lib/store.js";
import { ALPHABET, BY_ID, FAMILIES } from "../data/alphabet.js";
import { LESSONS } from "../data/lessons.js";
import { letterForms } from "../lib/persian.js";
import { wordCard, traceBoard, listenButtons } from "../components.js";

export function lettersView() {
  const seen = new Set(store.get().lettersSeen);
  const families = [];
  for (const letter of ALPHABET) {
    let fam = families.find((f) => f.key === letter.family);
    if (!fam) families.push((fam = { key: letter.family, letters: [] }));
    fam.letters.push(letter);
  }
  return h(
    "section",
    { class: "view letters" },
    h(
      "header",
      { class: "page-head" },
      h("h1", {}, "The 32 letters"),
      h("p", { class: "lede" }, "Letters live in families that share one shape — only the dots change. Read right to left, starting at the top right."),
      h(
        "p",
        { class: "legend" },
        h("span", { class: "badge" }, "✦ Persian original"),
        " the four letters Persia invented  ",
        h("span", { class: "badge shy" }, "shy"),
        " never joins the next letter",
      ),
    ),
    h(
      "div",
      { class: "families", dir: "rtl" },
      families.map((fam) =>
        h(
          "div",
          { class: "family", dir: "ltr" },
          h("p", { class: "family-name" }, FAMILIES[fam.key]),
          h(
            "div",
            { class: "tiles", dir: "rtl" },
            fam.letters.map((l) =>
              h(
                "a",
                { class: `tile ${seen.has(l.char) ? "seen" : ""} ${l.joins ? "" : "shy"}`, href: `#/letter/${l.id}`, "aria-label": `${l.name}, says ${l.sound}` },
                l.persian ? h("span", { class: "star", "aria-hidden": "true" }, "✦") : null,
                h("span", { class: "tile-glyph" }, fa(l.char)),
                h("span", { class: "tile-name", dir: "ltr" }, l.name),
              ),
            ),
          ),
        ),
      ),
    ),
  );
}

export function letterView(id) {
  const letter = BY_ID[id];
  if (!letter) return null;
  const forms = letterForms(letter.char);
  const siblings = ALPHABET.filter((l) => l.family === letter.family && l.id !== id);
  const lesson = LESSONS.find((l) => l.letters.includes(letter.char));
  const idx = ALPHABET.indexOf(letter);
  const prev = ALPHABET[idx - 1];
  const next = ALPHABET[idx + 1];
  store.addUnique("lettersSeen", [letter.char]);

  return h(
    "section",
    { class: "view letter-detail" },
    h("a", { class: "back-link", href: "#/letters" }, "← All letters"),
    h(
      "div",
      { class: "letter-hero" },
      h("div", { class: "big-letter" }, fa(letter.char)),
      h(
        "div",
        {},
        h("h1", {}, letter.name, letter.persian ? h("span", { class: "badge" }, "✦ Persian original") : null, letter.joins ? null : h("span", { class: "badge shy" }, "shy letter")),
        h("p", { class: "sound" }, "Says ", h("strong", {}, letter.sound)),
        listenButtons(letter.spoken, { slowToo: false }),
      ),
    ),
    h("p", { class: "hint" }, "🗣 ", letter.hint),
    h("p", { class: "shape" }, "👁 ", letter.shape),
    h(
      "div",
      { class: "forms" },
      [["at the end", forms.final], ["in the middle", forms.medial], ["at the start", forms.initial], ["on its own", forms.isolated]].map(([label, glyph]) =>
        h("div", { class: "form" }, fa(glyph), h("small", {}, label)),
      ),
    ),
    h("h2", {}, "In real words"),
    wordCard({ ...letter.word, focus: letter.char }),
    wordCard({ ...letter.extra, focus: letter.char }),
    h("h2", {}, "Trace it"),
    traceBoard(letter.char),
    siblings.length
      ? h(
          "div",
          { class: "siblings" },
          h("h2", {}, "Its family"),
          h("p", { class: "lede" }, "Same shape, different dots:"),
          h("div", { class: "tiles", dir: "rtl" }, siblings.map((l) => h("a", { class: "tile", href: `#/letter/${l.id}` }, h("span", { class: "tile-glyph" }, fa(l.char)), h("span", { class: "tile-name", dir: "ltr" }, `${l.name} · ${l.sound}`)))),
        )
      : null,
    h(
      "div",
      { class: "row wrap" },
      lesson ? h("a", { class: "btn soft", href: `#/lesson/${lesson.id}` }, `🌿 Its lesson: ${lesson.title}`) : null,
      h("a", { class: "btn soft", href: `#/talk?ask=${encodeURIComponent(`Can you help me practise the letter ${letter.char} (${letter.name})?`)}` }, "💬 Practise with Shirin"),
    ),
    h(
      "nav",
      { class: "prev-next" },
      next ? h("a", { class: "btn ghost", href: `#/letter/${next.id}` }, "← ", fa(next.char), ` ${next.name}`) : h("span"),
      prev ? h("a", { class: "btn ghost", href: `#/letter/${prev.id}` }, `${prev.name} `, fa(prev.char), " →") : h("span"),
    ),
  );
}
