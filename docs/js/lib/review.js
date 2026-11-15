// A gentle daily review (spaced repetition, Leitner style). Words she has
// met come back after 1, 2, 4, 7, 15, then 30 days; anything she isn't sure
// of comes back the same day. Nothing is ever "failed".

import { store } from "./store.js";
import { ALPHABET } from "../data/alphabet.js";
import { LESSONS } from "../data/lessons.js";
import { READING } from "../data/reading.js";
import { SPEAK, ESSENTIALS } from "../data/speak.js";
import { STORIES } from "../data/stories.js";

const DAY = 86_400_000;
const GAPS = [0, 1, 2, 4, 7, 15, 30];

let catalog = null;
/** Every built-in word and phrase, by its Persian text. */
export function itemsByFa() {
  if (catalog) return catalog;
  catalog = new Map();
  const add = (it, from) => it?.fa && !catalog.has(it.fa) && catalog.set(it.fa, { ...it, from });
  for (const l of ALPHABET) {
    add(l.word, "Letters");
    add(l.extra, "Letters");
  }
  for (const l of LESSONS) l.words.forEach((w) => add(w, l.title));
  for (const r of READING) r.items.forEach((w) => add(w, r.title));
  for (const s of SPEAK) s.phrases.forEach((w) => add(w, s.title));
  ESSENTIALS.forEach((w) => add(w, "Essentials"));
  for (const st of STORIES) st.words.forEach((w) => add(w, st.title));
  return catalog;
}

function find(fa) {
  if (itemsByFa().has(fa)) return itemsByFa().get(fa);
  for (const c of store.get().customLessons) {
    const it = [...c.lesson.words, ...c.lesson.phrases].find((w) => w.fa === fa);
    if (it) return { ...it, from: c.lesson.title };
  }
  return null;
}

/** Add items she has just met to the review (due tomorrow). */
export function addToReview(items) {
  store.update((s) => {
    for (const it of items) {
      if (!it?.fa || s.review[it.fa]) continue;
      s.review[it.fa] = { box: 0, due: Date.now() + DAY / 2 };
    }
  });
}

export function dueItems(limit = 12) {
  const now = Date.now();
  return Object.entries(store.get().review)
    .filter(([, r]) => r.due <= now)
    .sort((a, b) => a[1].due - b[1].due)
    .map(([fa, r]) => ({ ...find(fa), box: r.box }))
    .filter((it) => it.fa)
    .slice(0, limit);
}

export const dueCount = () => Object.values(store.get().review).filter((r) => r.due <= Date.now()).length;
export const reviewSize = () => Object.keys(store.get().review).length;

/** knew = true moves the word to a longer gap; false brings it back later today. */
export function grade(fa, knew) {
  store.update((s) => {
    const r = s.review[fa] ?? { box: 0, due: 0 };
    r.box = knew ? Math.min(r.box + 1, GAPS.length - 1) : 0;
    r.due = Date.now() + (knew ? GAPS[r.box] * DAY : 10 * 60_000);
    s.review[fa] = r;
  });
}
