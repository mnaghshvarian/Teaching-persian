// The pocket phrasebook: every useful phrase, searchable, with sound — and a
// big "show this" card to hold up for a taxi driver or shopkeeper. Works offline.

import { h, fa, icon } from "../lib/dom.js";
import { SPEAK, ESSENTIALS } from "../data/speak.js";
import { READING } from "../data/reading.js";
import { normalizeFa, normalizeLatin } from "../lib/persian.js";
import { sayPersian } from "../lib/speech.js";
import { play } from "../components.js";

function showCard(item) {
  const dlg = h(
    "dialog",
    { class: "show-card" },
    h("p", { class: "show-hint" }, "Show this to the person you're talking to"),
    h("p", { class: "show-fa", lang: "fa", dir: "rtl" }, item.fa),
    h("p", { class: "show-translit" }, item.translit),
    h("p", { class: "show-meaning" }, item.meaning),
    h(
      "div",
      { class: "row center" },
      h("button", { class: "btn primary", type: "button", onclick: () => play(item.fa) }, icon("speaker"), "Play it for them"),
      h("button", { class: "btn ghost", type: "button", onclick: () => dlg.close() }, "Close"),
    ),
  );
  dlg.addEventListener("close", () => dlg.remove());
  document.body.append(dlg);
  dlg.showModal();
}

function row(item, group) {
  return h(
    "li",
    { class: "pb-row", dataset: { search: `${normalizeFa(item.fa)} ${normalizeLatin(item.translit)} ${item.meaning.toLowerCase()} ${group.toLowerCase()}` } },
    h(
      "button",
      { class: "pb-main", type: "button", onclick: () => sayPersian(item.fa), "aria-label": `Play ${item.meaning}` },
      h("span", { class: "pb-fa" }, fa(item.fa)),
      h("span", { class: "pb-en" }, h("span", { class: "translit" }, item.translit), h("span", { class: "meaning" }, item.meaning)),
    ),
    h("button", { class: "btn icon-btn", type: "button", title: "Show it big", "aria-label": `Show “${item.meaning}” in big letters`, onclick: () => showCard(item) }, "⤢"),
  );
}

export function phrasebookView() {
  const groups = [
    { title: "Essentials", icon: "⭐", items: ESSENTIALS },
    ...SPEAK.map((u) => ({ title: u.title, icon: u.icon, items: u.phrases })),
    { title: "Signs you'll see", icon: "🪧", items: READING.find((r) => r.id === "r3").items },
    { title: "On the menu", icon: "🍽", items: READING.find((r) => r.id === "r4").items },
  ];
  const search = h("input", { type: "search", class: "pb-search", placeholder: "Search: taxi, how much, merci, سلام…", "aria-label": "Search phrases" });
  const sections = groups.map((g) =>
    h("section", { class: "pb-group" }, h("h2", {}, h("span", { "aria-hidden": "true" }, g.icon, " "), g.title), h("ul", { class: "pb-list" }, g.items.map((it) => row(it, g.title)))),
  );
  const empty = h("p", { class: "lede", hidden: true }, "Nothing found — try a simpler word. 🌿");
  search.addEventListener("input", () => {
    const q = search.value.trim();
    const qLat = normalizeLatin(q);
    const qFa = normalizeFa(q);
    const qEn = q.toLowerCase();
    let any = false;
    for (const sec of sections) {
      let visible = 0;
      for (const li of sec.querySelectorAll(".pb-row")) {
        const hay = li.dataset.search;
        const show = !q || (qFa && hay.includes(qFa)) || (qLat.length > 1 && hay.includes(qLat)) || hay.includes(qEn);
        li.hidden = !show;
        if (show) visible++;
      }
      sec.hidden = visible === 0;
      if (visible) any = true;
    }
    empty.hidden = any;
  });
  return h(
    "section",
    { class: "view phrasebook" },
    h(
      "header",
      { class: "page-head" },
      h("h1", {}, "Pocket phrasebook"),
      h("p", { class: "lede" }, "Tap a phrase to hear it. Tap ⤢ to show it in big letters to the person in front of you. Everything here works offline."),
      search,
    ),
    empty,
    sections,
  );
}
