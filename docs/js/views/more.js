import { h, fa } from "../lib/dom.js";
import { getStatus } from "../lib/api.js";
import { openSettings, installHelp, saveForOffline } from "./settings.js";

export function moreView(onChange) {
  const status = getStatus();
  const link = (href, emoji, title, sub) =>
    h("a", { class: "card link-card", href }, h("span", { class: "link-emoji", "aria-hidden": "true" }, emoji), h("strong", {}, title), h("small", {}, sub));
  const action = (emoji, title, sub, onclick) =>
    h("button", { class: "card link-card as-button", type: "button", onclick }, h("span", { class: "link-emoji", "aria-hidden": "true" }, emoji), h("strong", {}, title), h("small", {}, sub));
  return h(
    "section",
    { class: "view more" },
    h("header", { class: "page-head" }, h("h1", {}, "More"), h("p", { class: "lede" }, "Everything else in the garden.")),
    h(
      "div",
      { class: "quick-links" },
      link("#/review", "🔁", "Today's review", "Two minutes to keep words fresh"),
      link("#/letters", "الف", "The 32 letters", "In shape families, with tracing"),
      link("#/stories", "📜", "Stories", "Shahnameh, Saadi, Hafez, the Prophet's family, the Quran"),
      link("#/phrases", "📒", "Pocket phrasebook", "Every phrase, offline, with sound"),
      link("#/voices", "🎙", "Family voices", "Record a loved one saying the words"),
      action("📲", "Put it on your Home Screen", "Use it like an app on iPhone", () => installHelp()),
      action("✈️", "Save for offline", "Take everything to Iran, no internet needed", () => saveForOffline()),
      action("⚙︎", "Settings", status.ai ? "Shirin is awake 🌿" : "Wake Shirin with an API key", () => openSettings(onChange)),
    ),
  );
}

export { fa };
