import { h, fa, richText } from "../lib/dom.js";
import { store } from "../lib/store.js";
import { LESSONS, BY_LESSON } from "../data/lessons.js";
import { ALPHABET, BY_CHAR } from "../data/alphabet.js";
import { letterForms } from "../lib/persian.js";
import { gardenSvg } from "../garden.js";
import { chime } from "../lib/sound.js";
import { wordCard, shirinSays, question, traceBoard, listenButtons, play } from "../components.js";

const shuffle = (arr) => arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(([, v]) => v);

// ---------------------------------------------------------------------------
// The player: a sequence of steps with a calm progress line.

function player(title, steps, onFinish) {
  let index = 0;
  let finished = false;
  const body = h("div", { class: "step-body" });
  const dots = h("div", { class: "step-dots", "aria-hidden": "true" }, steps.map(() => h("span")));
  const back = h("button", { class: "btn ghost", type: "button" }, "← Back");
  const next = h("button", { class: "btn primary", type: "button" }, "Next →");
  const root = h(
    "section",
    { class: "view lesson" },
    h("header", { class: "lesson-head" }, h("a", { class: "back-link", href: "#/path" }, "← The path"), h("h1", {}, title), dots),
    body,
    h("footer", { class: "step-nav" }, back, next),
  );

  function render() {
    const step = steps[index];
    // Record progress before drawing the last step, so the new plant is already in the garden.
    if (index === steps.length - 1 && !finished) {
      finished = true;
      onFinish?.();
    }
    body.replaceChildren(step.render());
    [...dots.children].forEach((d, i) => d.classList.toggle("on", i <= index));
    back.style.visibility = index === 0 ? "hidden" : "visible";
    next.textContent = step.nextLabel ?? (index === steps.length - 1 ? "Back to my garden" : "Next →");
    body.querySelector("h2")?.focus?.({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  back.addEventListener("click", () => {
    if (index > 0) {
      index--;
      render();
    }
  });
  next.addEventListener("click", () => {
    if (index < steps.length - 1) {
      index++;
      render();
    } else location.hash = "#/home";
  });
  render();
  return root;
}

// ---------------------------------------------------------------------------
// Pieces of a lesson

function letterStep(letter) {
  const forms = letterForms(letter.char);
  let traceArea = null;
  const traceToggle = h("button", { class: "btn soft", type: "button" }, "✍️ Trace it");
  const wrap = h(
    "div",
    { class: "letter-step" },
    h(
      "div",
      { class: "letter-hero" },
      h("div", { class: "big-letter" }, fa(letter.char)),
      h(
        "div",
        {},
        h("h2", { tabindex: "-1" }, letter.name, letter.persian ? h("span", { class: "badge" }, "✦ Persian original") : null, letter.joins ? null : h("span", { class: "badge shy" }, "shy letter")),
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
    h("div", { class: "row" }, traceToggle),
  );
  traceToggle.addEventListener("click", () => {
    if (traceArea) {
      traceArea.remove();
      traceArea = null;
      return;
    }
    traceArea = traceBoard(letter.char);
    wrap.append(traceArea);
  });
  return wrap;
}

function gamesFor(lesson) {
  const letters = lesson.letters.map((c) => BY_CHAR[c]).filter(Boolean);
  const others = LESSONS.filter((l) => l.id !== lesson.id).flatMap((l) => l.words);
  const qs = [];

  if (letters.length) {
    // 1. sound → letter
    const target = letters[Math.floor(Math.random() * letters.length)];
    const soundOf = (l) => l.sound.split(" ")[0];
    const differs = (l) => l.char !== target.char && soundOf(l) !== soundOf(target);
    const pool = shuffle(ALPHABET.filter((l) => differs(l) && (l.family === target.family || letters.includes(l))));
    const extra = shuffle(ALPHABET.filter(differs));
    const choices = shuffle([target, ...[...pool, ...extra].filter((l, i, a) => a.indexOf(l) === i).slice(0, 2)]);
    qs.push({
      prompt: `Which letter says “${target.sound}”?`,
      options: choices.map((l) => l.char),
      answer: choices.indexOf(target),
      hint: target.shape,
      celebrate: `Yes — that's ${target.name}! ✨`,
    });

    // 2. glyph → name
    const shown = letters[(letters.indexOf(target) + 1) % letters.length];
    const nameChoices = shuffle([shown, ...shuffle(ALPHABET.filter((l) => l !== shown)).slice(0, 2)]);
    qs.push({
      prompt: "What is this letter called?",
      promptFa: shown.char,
      options: nameChoices.map((l) => l.name),
      answer: nameChoices.indexOf(shown),
      hint: shown.shape,
      celebrate: `Lovely — ${shown.name}, saying “${shown.sound}”. 🌸`,
    });

    // 3. find the letter in a word
    const chars = target.char === "ا" ? ["ا", "آ"] : [target.char];
    const has = (word) => chars.some((c) => word.includes(c));
    const w = lesson.words.find((x) => has(x.fa)) ?? lesson.words[0];
    const decoys = shuffle(others.filter((o) => !has(o.fa) && o.fa !== w.fa)).slice(0, 2);
    const wordChoices = shuffle([w, ...decoys]);
    qs.push({
      prompt: `Which word has ${target.name} (${target.char}) inside it?`,
      options: wordChoices.map((x) => x.fa),
      answer: wordChoices.indexOf(w),
      hint: `Look for ${target.shape.split(". ")[0].replace(/\.$/, "").replace(/^./, (c) => c.toLowerCase())}.`,
      celebrate: `That's ${w.fa} (${w.translit}) — “${w.meaning}”. 🌿`,
    });
  } else {
    // meaning questions for the greeting and conversation stops
    shuffle(lesson.words).slice(0, 3).forEach((wd) => {
      const wrong = shuffle(lesson.words.filter((x) => x !== wd)).slice(0, 2);
      const choices = shuffle([wd, ...wrong]);
      qs.push({
        prompt: "What does this mean?",
        promptFa: wd.fa,
        options: choices.map((c) => c.meaning),
        answer: choices.indexOf(wd),
        hint: `It sounds like “${wd.translit}”.`,
        celebrate: `Yes! ${wd.translit} — ${wd.meaning}. ✨`,
      });
    });
  }
  return qs;
}

function quizStep(qs, heading = "A little game") {
  return () => {
    let solved = 0;
    const counter = h("p", { class: "quiz-count" }, "");
    const update = () => (counter.textContent = solved === qs.length ? "All done — wonderful! 🌸" : `${solved} of ${qs.length}`);
    update();
    return h(
      "div",
      { class: "quiz" },
      h("h2", { tabindex: "-1" }, heading),
      h("p", { class: "lede" }, "No pressure — wrong taps just get a hint."),
      qs.map((q) => question(q, () => { solved++; update(); })),
      counter,
    );
  };
}

function storyStep(story) {
  return () =>
    h(
      "article",
      { class: "story" },
      h("p", { class: "eyebrow" }, "A story from Iran"),
      h("h2", { tabindex: "-1" }, story.title),
      richText(story.body),
      story.bridge ? h("p", { class: "bridge" }, "🍁 ", story.bridge) : null,
      h(
        "a",
        { class: "btn soft", href: `#/talk?ask=${encodeURIComponent(`Tell me more about “${story.title}”, please.`)}` },
        "💬 Ask Shirin to tell me more",
      ),
    );
}

function closingCard(closing) {
  if (!closing) return null;
  // Lessons Shirin designs give the closing as one line of mixed text.
  if (typeof closing === "string") return h("div", { class: "closing closing-text" }, richText(closing));
  return h(
    "div",
    { class: "closing" },
    h("p", { class: "nastaliq", lang: "fa", dir: "rtl" }, closing.fa),
    h("p", { class: "translit" }, closing.translit),
    h("p", { class: "meaning" }, closing.meaning),
    listenButtons(closing.fa, { slowToo: false }),
  );
}

// ---------------------------------------------------------------------------
// A lesson from the garden path

export function lessonView(id) {
  const lesson = BY_LESSON[id];
  if (!lesson) return null;
  const letters = lesson.letters.map((c) => BY_CHAR[c]).filter(Boolean);
  const games = gamesFor(lesson);
  const wasDone = store.get().lessonsDone.includes(lesson.id);

  const steps = [
    {
      render: () => h("div", { class: "intro" }, h("h2", { tabindex: "-1", class: "sr-only" }, "Introduction"), h("div", { class: "intro-fa" }, fa(lesson.titleFa)), shirinSays(lesson.intro)),
      nextLabel: "Let's begin →",
    },
    ...letters.map((letter) => ({ render: () => letterStep(letter) })),
    {
      render: () =>
        h(
          "div",
          { class: "words" },
          h("h2", { tabindex: "-1" }, letters.length ? "Words to find them in" : "Words to say"),
          h("p", { class: "lede" }, letters.length ? "The new letters glow inside each word. Listen, then try saying it — I'm a gentle listener." : "Listen, then try saying each one. Any attempt is a good attempt."),
          lesson.words.map((w) => wordCard(w)),
        ),
    },
    { render: quizStep(games) },
    { render: storyStep(lesson.story) },
    {
      render: () => {
        const done = new Set(store.get().lessonsDone);
        return h(
          "div",
          { class: "bloom" },
          h("h2", { tabindex: "-1" }, wasDone ? "Your garden, still blooming" : "Something new is growing"),
          h("div", { class: "card garden-card" }, gardenSvg(done, wasDone ? null : lesson.id)),
          h("p", { class: "lede" }, wasDone ? `You visited “${lesson.title}” again — lovely for your memory.` : lesson.bloomText ?? `You grew ${lesson.plantName}.`),
          closingCard(lesson.closing),
        );
      },
    },
  ];

  return player(lesson.title, steps, () => {
    if (!wasDone) chime("bloom");
    store.update((s) => {
      if (!s.lessonsDone.includes(lesson.id)) s.lessonsDone.push(lesson.id);
      for (const c of lesson.letters) if (!s.lettersSeen.includes(c)) s.lettersSeen.push(c);
      for (const w of lesson.words) {
        const key = `${w.fa} (${w.translit})`;
        if (!s.wordsSeen.includes(key)) s.wordsSeen.push(key);
      }
    });
  });
}

// ---------------------------------------------------------------------------
// A lesson Shirin designed (Opus 5.5, extra-high effort)

export function customLessonView(id) {
  const entry = store.get().customLessons.find((c) => c.id === id);
  if (!entry) return null;
  const L = entry.lesson;
  const focus = new Set(L.focus_letters);
  const withFocus = (item) => ({ ...item, focus: [...item.fa].find((ch) => focus.has(ch)) });

  const steps = [
    {
      render: () =>
        h(
          "div",
          { class: "intro" },
          h("h2", { tabindex: "-1", class: "sr-only" }, "Introduction"),
          L.title_fa ? h("div", { class: "intro-fa" }, fa(L.title_fa)) : null,
          shirinSays(L.intro || "I made this one just for you. 🌸"),
          L.focus_letters.length
            ? h("p", { class: "focus-letters" }, "Letters to notice: ", L.focus_letters.map((c) => h("a", { class: "letter-chip", href: BY_CHAR[c] ? `#/letter/${BY_CHAR[c].id}` : "#/letters" }, fa(c))))
            : null,
        ),
      nextLabel: "Let's begin →",
    },
    {
      render: () => h("div", { class: "words" }, h("h2", { tabindex: "-1" }, "Words"), L.words.map((w) => wordCard(withFocus(w)))),
    },
  ];
  if (L.phrases.length) {
    steps.push({
      render: () => h("div", { class: "words" }, h("h2", { tabindex: "-1" }, "Phrases"), L.phrases.map((p) => wordCard(p))),
    });
  }
  if (L.quiz.length) {
    steps.push({
      render: quizStep(
        L.quiz.map((q) => ({ prompt: q.question, options: q.options, answer: q.answer_index, hint: q.hint, celebrate: q.celebrate })),
        "A gentle quiz",
      ),
    });
  }
  if (L.story.body) steps.push({ render: storyStep(L.story) });
  steps.push({
    render: () =>
      h(
        "div",
        { class: "bloom" },
        h("h2", { tabindex: "-1" }, "Beautifully done"),
        h("p", { class: "lede" }, "This lesson stays in your garden path — come back to it any time."),
        closingCard(L.closing),
        h("p", { class: "made-by" }, "Prepared by Shirin with extra-careful thinking (Claude Opus 5.5)."),
      ),
  });

  return player(L.title, steps, () => {
    chime("bloom");
    store.addUnique("wordsSeen", [...L.words, ...L.phrases].map((w) => `${w.fa} (${w.translit})`));
  });
}

export { play };
