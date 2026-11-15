// Small helpers for Persian text.

const ZWJ = "‍";
const ZWNJ = "‌";
const SHY = new Set(["ا", "آ", "د", "ذ", "ر", "ز", "ژ", "و"]);

/** The four contextual shapes of a letter, using zero-width joiners so the
 * browser's own Persian shaping draws them. Shy letters have only two shapes. */
export function letterForms(char) {
  const joins = !SHY.has(char);
  return {
    isolated: char,
    final: ZWJ + char,
    medial: joins ? ZWJ + char + ZWJ : ZWJ + char,
    initial: joins ? char + ZWJ : char,
  };
}

/** Normalise Persian for comparison: unify Arabic/Persian letter variants,
 * strip short-vowel marks, tatweel, half-spaces, punctuation and spaces. */
export function normalizeFa(text) {
  return String(text ?? "")
    .replace(/[ً-ٰٟ]/g, "") // harakat
    .replace(/ـ/g, "") // tatweel
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[ةۀ]/g, "ه")
    .replace(/[أإٱ]/g, "ا")
    .replace(/ؤ/g, "و")
    .replace(new RegExp(`[${ZWNJ}${ZWJ}\\s.,!?؟،؛:«»"'()\\-…]`, "g"), "");
}

/** Normalise a Latin transliteration ("Salâm!", "salaam", "sa-laam") for fuzzy comparison. */
export function normalizeLatin(text) {
  return String(text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z]/g, "")
    .replace(/aa/g, "a")
    .replace(/oo/g, "u")
    .replace(/ee/g, "i")
    .replace(/w/g, "v")
    .replace(/q/g, "gh")
    .replace(/(.)\1+/g, "$1");
}

export function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

export function similarity(a, b) {
  if (!a && !b) return 1;
  return 1 - levenshtein(a, b) / Math.max(a.length, b.length);
}

/** Quick, generous local check of a speech attempt before asking Shirin.
 * Returns "yes" when any recognizer guess clearly matches, otherwise null. */
export function quickMatch(target, guesses) {
  const fa = normalizeFa(target.fa);
  const lat = normalizeLatin(target.translit);
  for (const g of guesses) {
    const text = g.text ?? "";
    const gFa = normalizeFa(text);
    if (fa && gFa && (gFa === fa || gFa.includes(fa) || (fa.length >= 4 && similarity(gFa, fa) >= 0.8))) return "yes";
    const gLat = normalizeLatin(text);
    if (lat && gLat && lat.length >= 3 && similarity(gLat, lat) >= 0.8) return "yes";
  }
  return null;
}

/** Split a word into segments, marking where the focus letter appears. */
export function highlightSegments(word, focus) {
  if (!focus) return [{ text: word, focus: false }];
  const targets = focus === "ا" ? ["ا", "آ"] : [focus];
  const out = [];
  for (const ch of word) {
    const isFocus = targets.includes(ch);
    const last = out[out.length - 1];
    if (last && last.focus === isFocus && !isFocus) last.text += ch;
    else out.push({ text: ch, focus: isFocus });
  }
  // Keep letters joined across the coloured spans: a zero-width joiner on
  // both sides of each boundary where the letter before joins forward.
  for (let i = 1; i < out.length; i++) {
    const prev = [...out[i - 1].text].pop();
    const next = [...out[i].text][0];
    if (joinsForward(prev) && isArabicLetter(next)) {
      out[i - 1].text += ZWJ;
      out[i].text = ZWJ + out[i].text;
    }
  }
  return out;
}

function isArabicLetter(ch) {
  return /[ؠ-يٱ-ۓ]/.test(ch ?? "");
}

function joinsForward(ch) {
  return isArabicLetter(ch) && !SHY.has(ch) && ch !== "ء";
}

/** Stable short id for a Persian word, used to file family voice recordings. */
export function voiceId(fa) {
  const s = normalizeFa(fa) || String(fa);
  let h = 0x811c9dc5;
  for (const ch of s) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `w-${h.toString(16).padStart(8, "0")}`;
}

export function hasPersian(text) {
  return /[؀-ۿ]/.test(text);
}

function faWords(text) {
  return String(text ?? "")
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[ةۀ]/g, "ه")
    .replace(/[أإٱ]/g, "ا")
    .replace(/[‌‍]/g, "")
    .replace(/[.,!?؟،؛:«»"'()\-…]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function latinWords(text) {
  return String(text ?? "")
    .replace(/\(.*?\)/g, " ")
    .split(/[\s\-]+/)
    .map(normalizeLatin)
    .filter((w) => w.length > 0);
}

/** Share of the target's words that appear (closely) in the attempt. */
function coverage(target, heard) {
  if (!target.length || !heard.length) return 0;
  let hit = 0;
  for (const w of target) if (heard.some((g) => similarity(g, w) >= 0.75)) hit++;
  return hit / target.length;
}

/** Generous check for a whole spoken line (a phrase or a sentence in a
 * conversation). True when a Persian speaker would clearly follow it. */
export function matchLine(target, guesses) {
  if (quickMatch(target, guesses)) return true;
  const tFa = faWords(target.fa);
  const tLat = latinWords(target.translit);
  const whole = normalizeFa(target.fa);
  for (const g of guesses) {
    const text = g.text ?? "";
    if (hasPersian(text)) {
      if (coverage(tFa, faWords(text)) >= 0.6) return true;
      if (whole.length >= 6 && similarity(normalizeFa(text), whole) >= 0.7) return true;
    } else if (coverage(tLat, latinWords(text)) >= 0.6) {
      return true;
    }
  }
  return false;
}
