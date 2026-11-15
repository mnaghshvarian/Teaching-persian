// A tiny element builder. Text is always set as text (never HTML), so
// anything Shirin says is shown safely.

export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value == null || value === false) continue;
    if (key === "class") el.className = value;
    else if (key === "style" && typeof value === "object") Object.assign(el.style, value);
    else if (key.startsWith("on") && typeof value === "function") el.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === "dataset") Object.assign(el.dataset, value);
    else if (value === true) el.setAttribute(key, "");
    else el.setAttribute(key, value);
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const child of children.flat(Infinity)) {
    if (child == null || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

export function clear(el, ...children) {
  el.replaceChildren();
  append(el, children);
  return el;
}

/** Persian text, right-to-left, in the Persian font. */
export const fa = (text, cls = "") => h("span", { class: `fa ${cls}`.trim(), lang: "fa", dir: "rtl" }, text);

/** Render Shirin's text: **bold**, line breaks, and Persian runs marked for the Persian font. */
export function richText(text) {
  const frag = document.createDocumentFragment();
  const paragraphs = String(text).split(/\n{2,}/);
  paragraphs.forEach((para, pi) => {
    const p = h("p");
    const lines = para.split("\n");
    lines.forEach((line, li) => {
      line.split(/(\*\*[^*]+\*\*)/).forEach((piece) => {
        const bold = /^\*\*[^*]+\*\*$/.test(piece);
        const body = bold ? piece.slice(2, -2) : piece;
        const target = bold ? h("strong") : document.createDocumentFragment();
        // Persian runs get the Persian font and right-to-left order. A run may hold
        // several sentences (with . ! ? between them) so their order stays right; it
        // ends on a Persian letter or ؟, so an English sentence's own "!" stays outside.
        body.split(/([؀-ۿ‌](?:[؀-ۿ‌\s،؛.!?:«»]*[؀-ۿ‌؟»])?)/).forEach((run) => {
          if (!run) return;
          if (/[؀-ۿ]/.test(run)) target.append(fa(run));
          else target.append(document.createTextNode(run));
        });
        p.append(target);
      });
      if (li < lines.length - 1) p.append(h("br"));
    });
    if (pi < paragraphs.length) frag.append(p);
  });
  return frag;
}

let toastTimer = null;
export function toast(message, ms = 4200) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), ms);
}

export const icon = (name) => {
  const paths = {
    play: "M8 5v14l11-7z",
    mic: "M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11z",
    stop: "M7 7h10v10H7z",
    send: "M3 20l18-8L3 4v6l12 2-12 2z",
    back: "M15.5 5 8.5 12l7 7-1.4 1.4L5.7 12l8.4-8.4z",
    trash: "M6 7h12l-1 13H7zM9 4h6l1 2H8z",
    slow: "M12 4a8 8 0 1 0 8 8h-2a6 6 0 1 1-6-6zm0 3v5l4 2-.8 1.5L10 13V7z",
    speaker: "M4 9v6h4l5 4V5L8 9zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z",
  };
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("icon");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", paths[name] ?? "");
  svg.append(path);
  return svg;
};
