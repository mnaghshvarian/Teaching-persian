// Speak in Iran: phrases → listen to a real conversation → take your part.
// The practice works with no AI at all (and offline): the other person's lines
// play from the garden's recordings, and her answers are checked by forgiving
// matching. With Shirin's AI available, she can also role-play freely.

import { h, fa, richText, icon } from "../lib/dom.js";
import { store } from "../lib/store.js";
import { SPEAK, BY_SPEAK } from "../data/speak.js";
import { chime } from "../lib/sound.js";
import { addToReview } from "../lib/review.js";
import { matchLine } from "../lib/persian.js";
import { canListen, listen, listenErrorMessage, sayPersianAndWait, sayPersian, stopSpeaking } from "../lib/speech.js";
import { getStatus, judge } from "../lib/api.js";
import { wordCard, shirinSays, listenButtons, player, gardenStep, avatar } from "../components.js";

function line(l, { reveal = true } = {}) {
  return h(
    "div",
    { class: `talk-line ${l.who}` },
    l.who === "them" ? h("span", { class: "who", "aria-hidden": "true" }, "🙂") : null,
    h(
      "div",
      { class: "bubble" },
      h("p", { class: "line-fa" }, fa(l.fa)),
      reveal ? h("p", { class: "translit" }, l.translit) : null,
      reveal ? h("p", { class: "meaning" }, l.meaning) : null,
      listenButtons(l.fa),
    ),
  );
}

function conversationStep(unit) {
  return () => {
    const lines = unit.dialogue.map((l) => line(l));
    const playAll = h("button", { class: "btn primary", type: "button" }, icon("play"), "Play the conversation");
    let playing = false;
    playAll.addEventListener("click", async () => {
      if (playing) {
        playing = false;
        stopSpeaking();
        return;
      }
      playing = true;
      playAll.lastChild.textContent = "Stop";
      for (let i = 0; i < lines.length && playing; i++) {
        lines.forEach((el, k) => el.classList.toggle("now", k === i));
        lines[i].scrollIntoView({ block: "nearest", behavior: "smooth" });
        await sayPersianAndWait(unit.dialogue[i].fa);
        await new Promise((r) => setTimeout(r, 450));
      }
      lines.forEach((el) => el.classList.remove("now"));
      playing = false;
      playAll.lastChild.textContent = "Play the conversation";
    });
    return h(
      "div",
      { class: "conversation" },
      h("h2", { tabindex: "-1" }, "Listen to the conversation"),
      h("p", { class: "lede" }, "Listen first, then read along. Your lines are on the right — next you'll say them yourself."),
      h("div", { class: "row" }, playAll),
      h("div", { class: "talk-lines" }, lines),
    );
  };
}

/** Her turn: the other person speaks, she answers. No AI needed. */
function practiceStep(unit) {
  return () => {
    const feed = h("div", { class: "talk-lines practice" });
    const controls = h("div", { class: "practice-controls", "aria-live": "polite" });
    let i = 0;
    let attempts = 0;
    let doneCount = 0;

    const scrollDown = () => controls.scrollIntoView({ block: "nearest", behavior: "smooth" });

    async function advance() {
      while (i < unit.dialogue.length && unit.dialogue[i].who === "them") {
        const l = unit.dialogue[i];
        feed.append(line(l));
        scrollDown();
        await sayPersianAndWait(l.fa);
        i++;
      }
      if (i >= unit.dialogue.length) {
        chime("bloom");
        controls.replaceChildren(
          h("p", { class: "practice-done" }, `آفرین! (âfarin) You held the whole conversation — ${doneCount} lines in Persian. 🌸`),
        );
        return;
      }
      yourTurn(unit.dialogue[i]);
    }

    function accept(l, heard, message) {
      // Each line can be answered once: ignore a double tap or a late answer.
      if (unit.dialogue[i] !== l) return;
      controls.replaceChildren(h("p", { class: "small" }, "🎧 Listening to them…"));
      chime("yes");
      doneCount++;
      feed.append(line(l));
      if (message) feed.append(h("div", { class: "practice-note" }, richText(message)));
      i++;
      attempts = 0;
      advance();
    }

    function yourTurn(l) {
      const hintBox = h("div", { class: "hint-box", hidden: true }, h("p", { class: "line-fa" }, fa(l.fa)), h("p", { class: "translit" }, l.translit), listenButtons(l.fa));
      const feedback = h("div", { class: "sayit-feedback" });
      const mic = h("button", { class: "btn mic", type: "button" }, icon("mic"), h("span", {}, "Say it"));
      const show = h("button", { class: "btn ghost", type: "button", onclick: () => (hintBox.hidden = false) }, "👀 Show me");
      const skip = h("button", { class: "btn ghost", type: "button", onclick: () => accept(l, "", "") }, canListen ? "I said it →" : "I said it! →");
      controls.replaceChildren(
        h("p", { class: "your-turn" }, "Your turn — say: ", h("strong", {}, `“${l.meaning}”`)),
        hintBox,
        h("div", { class: "row wrap" }, canListen ? mic : null, show, skip),
        feedback,
      );
      scrollDown();

      mic.addEventListener("click", async () => {
        if (mic.classList.contains("listening")) return;
        mic.classList.add("listening");
        mic.lastChild.textContent = "Listening…";
        feedback.className = "sayit-feedback show neutral";
        feedback.replaceChildren(h("p", {}, "I'm listening… 🌿"));
        try {
          const { guesses } = await listen({ lang: "fa-IR", onInterim: (t) => feedback.replaceChildren(h("p", {}, "I'm listening… ", t)) });
          attempts++;
          if (!guesses.length) {
            feedback.replaceChildren(h("p", {}, "I didn't catch that — try once more, a little closer? 🌿"));
            return;
          }
          if (matchLine(l, guesses)) return accept(l, guesses[0].text, "");
          if (getStatus().ai) {
            feedback.replaceChildren(h("p", { class: "thinking-dots" }, "Shirin is listening carefully"));
            try {
              const j = await judge({ fa: l.fa, translit: l.translit, meaning: l.meaning }, guesses, attempts);
              if (j.verdict !== "try_again") return accept(l, guesses[0].text, j.verdict === "almost" && j.tip ? `💡 ${j.tip}` : j.message);
              feedback.replaceChildren(richText(j.message), j.tip ? h("p", { class: "tip" }, "💡 ", j.tip) : "");
              hintBox.hidden = false;
              return;
            } catch {
              // fall through to the gentle answer below
            }
          }
          if (attempts >= 2) return accept(l, guesses[0].text, "Lovely — a Persian speaker would understand you. Let's keep going.");
          hintBox.hidden = false;
          sayPersian(l.fa);
          feedback.replaceChildren(h("p", {}, "So close! Here's how it goes — listen, then try once more."));
        } catch (err) {
          feedback.replaceChildren(h("p", {}, listenErrorMessage(err)));
        } finally {
          mic.classList.remove("listening");
          mic.lastChild.textContent = "Say it";
        }
      });
    }

    const start = h("button", { class: "btn primary", type: "button" }, "▶ Start the conversation");
    start.addEventListener("click", () => {
      start.remove();
      advance();
    });
    controls.append(start);

    return h(
      "div",
      { class: "practice-wrap" },
      h("h2", { tabindex: "-1" }, "Now it's your turn"),
      h(
        "p",
        { class: "lede" },
        canListen
          ? "They'll speak; you answer out loud. I listen kindly — and you can always peek or move on."
          : "They'll speak; you answer out loud, then tap “I said it”. You can always peek.",
      ),
      feed,
      controls,
    );
  };
}

export function speakView(id) {
  const unit = BY_SPEAK[id];
  if (!unit) return null;
  const wasDone = store.get().speakingDone.includes(id);
  const steps = [
    {
      render: () =>
        h(
          "div",
          { class: "intro" },
          h("h2", { tabindex: "-1", class: "sr-only" }, "Introduction"),
          h("div", { class: "intro-fa" }, h("span", { "aria-hidden": "true" }, unit.icon, " "), fa(unit.titleFa)),
          shirinSays(unit.intro),
          unit.tip ? h("p", { class: "bridge" }, "🍵 ", richText(unit.tip)) : null,
        ),
      nextLabel: "The phrases →",
    },
    {
      render: () =>
        h(
          "div",
          { class: "words" },
          h("h2", { tabindex: "-1" }, "Phrases you'll use"),
          h("p", { class: "lede" }, "Listen, then say each one. Slowly is perfect."),
          unit.phrases.map((p) => wordCard(p)),
        ),
    },
    { render: conversationStep(unit) },
    { render: practiceStep(unit) },
    gardenStep({
      title: wasDone ? "Another lovely conversation" : "A lantern for your garden",
      text: wasDone ? `You practised “${unit.title}” again.` : "A new lantern glows along your garden wall. 🏮",
      freshId: wasDone ? null : id,
      extra: () =>
        h(
          "div",
          { class: "row wrap center" },
          getStatus().ai
            ? h("a", { class: "btn soft", href: `#/talk?scenario=${unit.id}` }, "🎭 Role-play freely with Shirin")
            : null,
          h("a", { class: "btn ghost", href: "#/speak" }, "More situations"),
        ),
    }),
  ];
  return player(unit.title, steps, "#/speak", () => {
    if (!wasDone) chime("bloom");
    store.update((s) => {
      if (!s.speakingDone.includes(id)) s.speakingDone.push(id);
    });
    addToReview(unit.phrases);
  });
}

export function speakListView() {
  const done = new Set(store.get().speakingDone);
  const ai = getStatus().ai;
  return h(
    "section",
    { class: "view speak-list" },
    h(
      "header",
      { class: "page-head" },
      h("h1", {}, "Speak in Iran"),
      h(
        "p",
        { class: "lede" },
        "Ten real situations, in the Persian people actually speak on the street. Start with the first one — it's the key to never needing a translator.",
      ),
    ),
    h(
      "a",
      { class: "card continue phrasebook-call", href: "#/phrases" },
      h("span", { class: "continue-fa", "aria-hidden": "true" }, "📒"),
      h("span", { class: "continue-text" }, h("strong", {}, "Pocket phrasebook"), h("small", {}, "Every phrase, with sound, offline — and big letters to show people")),
      h("span", { class: "btn soft" }, "Open"),
    ),
    h(
      "div",
      { class: "scenario-grid" },
      SPEAK.map((u, i) =>
        h(
          "a",
          { class: `card scenario ${done.has(u.id) ? "done" : ""}`, href: `#/speak/${u.id}` },
          h("span", { class: "scenario-icon", "aria-hidden": "true" }, u.icon),
          h("span", { class: "scenario-text" }, h("strong", {}, `${i + 1}. ${u.title}`), h("span", { class: "scenario-fa" }, fa(u.titleFa)), h("small", {}, done.has(u.id) ? "✓ Practised · 🏮" : `${u.phrases.length} phrases · a conversation`)),
        ),
      ),
    ),
    h(
      "div",
      { class: "card tip-card" },
      avatar(),
      h(
        "p",
        {},
        ai
          ? "After a situation, you can role-play it freely with me — I'll play the taxi driver, the aunt or the shopkeeper, and adapt to whatever you say."
          : "Everything here works without the internet, so it comes with you to Iran. Open the Phrasebook for a quick reference on the go.",
      ),
    ),
  );
}
