// Lists every Persian word and phrase in the garden that should have a
// recording, with the pronunciation to use. Run before scripts/make_audio.py:
//   node scripts/collect-audio.mjs
// Writes scripts/audio-items.json.

import { writeFileSync } from "node:fs";
import { ALPHABET } from "../docs/js/data/alphabet.js";
import { LESSONS, PROVERBS } from "../docs/js/data/lessons.js";
import { READING } from "../docs/js/data/reading.js";
import { SPEAK, ESSENTIALS } from "../docs/js/data/speak.js";
import { voiceId } from "../docs/js/lib/persian.js";

/** Every built-in Persian word and phrase, with the pronunciation for its recording. */
export function collectItems() {
const items = new Map();

/** The pronunciation to synthesise: an explicit `say`, a "(said 'joon')" hint, or the transliteration. */
function pronunciation(translit, say) {
  if (say) return say;
  const said = /\(said '([^']+)'\)/.exec(translit ?? "");
  if (said) return said[1];
  return String(translit ?? "").replace(/\(.*?\)/g, "").trim();
}

function add(items, fa, translit, say) {
  if (!fa || !translit) return;
  const id = voiceId(fa);
  if (items.has(id)) return;
  items.set(id, { id, fa, say: pronunciation(translit, say) });
}

for (const l of ALPHABET) {
  add(items, l.spoken, l.name.replace(/\(.*?\)/g, "").trim());
  add(items, l.word.fa, l.word.translit, l.word.say);
  add(items, l.extra.fa, l.extra.translit, l.extra.say);
}
for (const lesson of LESSONS) {
  for (const w of lesson.words) add(items, w.fa, w.translit, w.say);
  add(items, lesson.closing.fa, lesson.closing.translit, lesson.closing.say);
}
for (const p of PROVERBS) add(items, p.fa, p.translit, p.say);
for (const unit of READING) for (const it of unit.items) add(items, it.fa, it.translit, it.say);
for (const unit of SPEAK) {
  for (const p of unit.phrases) add(items, p.fa, p.translit, p.say);
  for (const line of unit.dialogue) add(items, line.fa, line.translit, line.say);
}
for (const e of ESSENTIALS) add(items, e.fa, e.translit, e.say);
for (const g of [
  ["صبح بخیر", "sobh bekheyr"],
  ["عصر بخیر", "asr bekheyr"],
  ["شب بخیر", "shab bekheyr"],
  ["آفرین", "âfarin"],
  ["عالی", "âli"],
]) add(items, g[0], g[1]);

return [...items.values()];
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop())) {
  const list = collectItems();
  writeFileSync(new URL("./audio-items.json", import.meta.url), JSON.stringify(list, null, 1) + "\n");
  console.log(`${list.length} items → scripts/audio-items.json`);
}
