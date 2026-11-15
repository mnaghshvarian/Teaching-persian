// Shared building blocks: the "say it" practice widget, word cards, the
// tracing board, multiple-choice questions and Shirin's speech bubble.

import { h, fa, icon, toast, richText } from "./lib/dom.js";
import { highlightSegments, quickMatch } from "./lib/persian.js";
import { canListen, listen, listenErrorMessage, sayPersian } from "./lib/speech.js";
import { judge, getStatus } from "./lib/api.js";
import { chime } from "./lib/sound.js";
import { store } from "./lib/store.js";
import { gardenSvg, allDone } from "./garden.js";

const PRAISE = [
  ["آفرین", "âfarin", "well done"],
  ["عالی", "âli", "wonderful"],
  ["چه خوب", "che khub", "how lovely"],
  ["ماشالله", "mâshâllâ", "bravo"],
];

export async function play(text, slow = false) {
  const source = await sayPersian(text, { slow });
  if (!source) {
    toast("This device has no Persian voice yet. Try Microsoft Edge or Chrome on Android — or ask a family member to record it in Family voices 🎙", 6500);
  }
  return source;
}

export function listenButtons(text, { slowToo = true } = {}) {
  return h(
    "span",
    { class: "listen-buttons" },
    h("button", { class: "btn icon-btn", type: "button", "aria-label": "Listen", title: "Listen", onclick: () => play(text) }, icon("speaker")),
    slowToo && h("button", { class: "btn icon-btn", type: "button", "aria-label": "Listen slowly", title: "Slowly", onclick: () => play(text, true) }, h("span", { "aria-hidden": "true" }, "🐢")),
  );
}

/** Practise saying a word: listen → speak → a kind, smart response. */
export function sayIt(item) {
  const feedback = h("div", { class: "sayit-feedback", "aria-live": "polite" });
  let attempts = 0;

  const show = (kind, ...content) => {
    feedback.className = `sayit-feedback show ${kind}`;
    feedback.replaceChildren(...content);
  };

  const celebrate = (message, tip) => {
    const [p, t, m] = PRAISE[Math.floor(Math.random() * PRAISE.length)];
    chime("yes");
    show("yes", h("strong", {}, fa(p), ` (${t}) — ${m}! `), message ? richText(message) : "", tip ? h("p", { class: "tip" }, "💡 ", tip) : "");
    store.addUnique("wordsSeen", [`${item.fa} (${item.translit})`]);
  };

  const mic = h("button", { class: "btn mic", type: "button" }, icon("mic"), h("span", {}, "Say it"));
  mic.addEventListener("click", async () => {
    if (mic.classList.contains("listening")) return;
    if (!canListen) {
      show(
        "neutral",
        h("p", {}, "Say it out loud — I believe in you. Then tap below. 🌸"),
        h("button", { class: "btn soft", type: "button", onclick: () => celebrate("") }, "I said it!"),
      );
      return;
    }
    mic.classList.add("listening");
    mic.lastChild.textContent = "Listening…";
    show("neutral", h("p", {}, "I'm listening… 🌿"));
    try {
      const { guesses } = await listen({
        lang: "fa-IR",
        onInterim: (t) => show("neutral", h("p", {}, "I'm listening… ", fa(t))),
      });
      attempts++;
      if (!guesses.length) {
        show("neutral", h("p", {}, "I didn't quite catch that — maybe the mic was shy. Try once more, a little closer? 🌿"));
        return;
      }
      if (quickMatch(item, guesses)) {
        celebrate("");
        return;
      }
      if (getStatus().ai) {
        show("neutral", h("p", { class: "thinking-dots" }, "Shirin is listening carefully"));
        try {
          const j = await judge({ fa: item.fa, translit: item.translit, meaning: item.meaning }, guesses, attempts);
          if (j.verdict === "yes") celebrate(j.message, j.tip);
          else {
            chime("almost");
            show(j.verdict === "almost" ? "almost" : "neutral", richText(j.message), j.tip ? h("p", { class: "tip" }, "💡 ", j.tip) : "");
          }
          return;
        } catch {
          // fall through to the gentle offline answer
        }
      }
      if (attempts >= 2) celebrate("A Persian speaker would understand you — that's what matters. Let's keep going.");
      else {
        chime("almost");
        show("almost", h("p", {}, "So close! Listen once more, then try again — slowly is perfect."));
      }
    } catch (err) {
      show("neutral", h("p", {}, listenErrorMessage(err)));
    } finally {
      mic.classList.remove("listening");
      mic.lastChild.textContent = "Say it";
    }
  });

  return h("div", { class: "sayit" }, h("div", { class: "sayit-row" }, listenButtons(item.fa), mic), feedback);
}

/** A Persian word with the focus letter gently coloured. */
export function highlightedWord(text, focus) {
  return h(
    "span",
    { class: "fa word-fa", lang: "fa", dir: "rtl" },
    highlightSegments(text, focus).map((seg) => (seg.focus ? h("span", { class: "focus" }, seg.text) : seg.text)),
  );
}

export function wordCard(item) {
  return h(
    "article",
    { class: "word-card" },
    h("div", { class: "word-top" }, highlightedWord(item.fa, item.focus), h("div", { class: "word-meta" }, h("span", { class: "translit" }, item.translit), h("span", { class: "meaning" }, item.meaning))),
    item.note ? h("p", { class: "note" }, item.note) : null,
    sayIt(item),
  );
}

/** Shirin speaking, in a little bubble. */
export function shirinSays(text) {
  return h("div", { class: "shirin-says" }, avatar(), h("div", { class: "bubble" }, richText(text)));
}

export function avatar(size = "") {
  return h("span", { class: `avatar ${size}`.trim(), "aria-hidden": "true" }, fa("ش"));
}

/** A gentle multiple-choice question. Wrong answers only ever get a hint. */
export function question({ prompt, promptFa, options, answer, hint, celebrate }, onRight) {
  const hintEl = h("p", { class: "q-hint", "aria-live": "polite" });
  let solved = false;
  const buttons = options.map((opt, i) =>
    h(
      "button",
      {
        class: "btn option",
        type: "button",
        onclick: (e) => {
          if (solved) return;
          const btn = e.currentTarget;
          if (i === answer) {
            solved = true;
            btn.classList.add("right");
            chime("yes");
            hintEl.className = "q-hint yes";
            hintEl.replaceChildren(celebrate || "Lovely! 🌸");
            onRight?.();
          } else {
            btn.classList.add("soft-wrong");
            btn.disabled = true;
            hintEl.className = "q-hint";
            hintEl.replaceChildren(hint ? `Hint: ${hint}` : "Not that one — have another look. 🌿");
          }
        },
      },
      typeof opt === "string" && /[؀-ۿ]/.test(opt) ? fa(opt, "option-fa") : opt,
    ),
  );
  return h(
    "div",
    { class: "question" },
    h("p", { class: "q-prompt" }, prompt),
    promptFa ? h("div", { class: "q-glyph" }, fa(promptFa)) : null,
    h("div", { class: "options" }, buttons),
    hintEl,
  );
}

/** Trace a letter over its soft grey shape. Every attempt gets a kind word. */
export function traceBoard(char) {
  const size = 280;
  const canvas = h("canvas", { class: "trace-canvas", width: size, height: size, "aria-label": `Trace the letter ${char}` });
  const msg = h("p", { class: "trace-msg", "aria-live": "polite" }, "Follow the soft shape with your finger or mouse. Persian flows from right to left.");
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  const stroke = document.createElement("canvas");
  stroke.width = size;
  stroke.height = size;
  const sctx = stroke.getContext("2d");
  const font = `${Math.round(size * 0.62)}px Vazirmatn, sans-serif`;

  const style = getComputedStyle(document.documentElement);
  const guideColor = () => style.getPropertyValue("--trace-guide").trim() || "#d8cfc0";
  const inkColor = () => style.getPropertyValue("--saffron").trim() || "#d9962b";

  function drawGuide(c, color) {
    c.save();
    c.fillStyle = color;
    c.font = font;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.direction = "rtl";
    c.fillText(char, size / 2, size * 0.5);
    c.restore();
  }
  function redraw() {
    ctx.clearRect(0, 0, size, size);
    drawGuide(ctx, guideColor());
    ctx.drawImage(stroke, 0, 0);
  }

  let drawing = false;
  let last = null;
  const pos = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * size, y: ((e.clientY - r.top) / r.height) * size };
  };
  canvas.addEventListener("pointerdown", (e) => {
    drawing = true;
    last = pos(e);
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drawing) return;
    const p = pos(e);
    sctx.strokeStyle = inkColor();
    sctx.lineWidth = 16;
    sctx.lineCap = "round";
    sctx.lineJoin = "round";
    sctx.beginPath();
    sctx.moveTo(last.x, last.y);
    sctx.lineTo(p.x, p.y);
    sctx.stroke();
    last = p;
    redraw();
  });
  const end = () => (drawing = false);
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);

  function check() {
    const mask = document.createElement("canvas");
    mask.width = size;
    mask.height = size;
    const mctx = mask.getContext("2d");
    drawGuide(mctx, "#000");
    const g = mctx.getImageData(0, 0, size, size).data;
    const s = sctx.getImageData(0, 0, size, size).data;
    let guide = 0, covered = 0, ink = 0, outside = 0;
    for (let i = 3; i < g.length; i += 16) {
      const inGuide = g[i] > 60;
      const inked = s[i] > 60;
      if (inGuide) guide++;
      if (inked) ink++;
      if (inGuide && inked) covered++;
      if (inked && !inGuide) outside++;
    }
    if (!ink) {
      msg.textContent = "Whenever you're ready — start from the right side of the shape. 🌿";
      return;
    }
    const coverage = covered / Math.max(guide, 1);
    const stray = outside / ink;
    if (coverage > 0.45 && stray < 0.75) {
      chime("yes");
      msg.textContent = "Beautiful! A calligrapher in the making. ✨";
    } else if (coverage > 0.2) {
      msg.textContent = "Lovely! One more, a little slower, staying on the grey shape?";
    } else {
      msg.textContent = "Nice start! Try tracing right over the soft grey letter.";
    }
  }

  const clearBtn = h("button", { class: "btn ghost", type: "button", onclick: () => { sctx.clearRect(0, 0, size, size); redraw(); msg.textContent = "Fresh page. 🌿"; } }, "Clear");
  const doneBtn = h("button", { class: "btn soft", type: "button", onclick: check }, "Done");

  document.fonts?.load(font, char).finally(redraw);
  redraw();
  return h("div", { class: "trace" }, canvas, h("div", { class: "trace-actions" }, clearBtn, doneBtn), msg);
}

/** A calm, step-by-step player with a progress line (used by every lesson type). */
export function player(title, steps, backHref, onFinish) {
  let index = 0;
  let finished = false;
  const body = h("div", { class: "step-body" });
  const dots = h("div", { class: "step-dots", "aria-hidden": "true" }, steps.map(() => h("span")));
  const back = h("button", { class: "btn ghost", type: "button" }, "← Back");
  const next = h("button", { class: "btn primary", type: "button" }, "Next →");
  const root = h(
    "section",
    { class: "view lesson" },
    h("header", { class: "lesson-head" }, h("a", { class: "back-link", href: backHref }, "← Back to Learn"), h("h1", {}, title), dots),
    body,
    h("footer", { class: "step-nav" }, back, next),
  );

  function render() {
    const step = steps[index];
    // Record progress before drawing the last step, so the garden already shows it.
    if (index === steps.length - 1 && !finished) {
      finished = true;
      onFinish?.();
    }
    body.replaceChildren(step.render());
    body.classList.remove("settle");
    void body.offsetWidth;
    body.classList.add("settle");
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

/** The last step of a unit: the garden, with the new tile or lantern appearing. */
export function gardenStep({ title, text, freshId, extra = null }) {
  return {
    render: () =>
      h(
        "div",
        { class: "bloom" },
        h("h2", { tabindex: "-1" }, title),
        h("div", { class: "card garden-card" }, gardenSvg(allDone(), freshId)),
        h("p", { class: "lede" }, text),
        extra ? extra() : null,
      ),
  };
}
