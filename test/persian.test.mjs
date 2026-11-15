import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeFa,
  normalizeLatin,
  quickMatch,
  highlightSegments,
  letterForms,
  voiceId,
} from "../public/js/lib/persian.js";
import { ALPHABET } from "../public/js/data/alphabet.js";
import { LESSONS } from "../public/js/data/lessons.js";

test("normalizeFa unifies Arabic and Persian letter variants", () => {
  assert.equal(normalizeFa("كتاب"), normalizeFa("کتاب"));
  assert.equal(normalizeFa("سلامٌ!"), "سلام");
  assert.equal(normalizeFa("می‌خواهم"), "میخواهم");
  assert.equal(normalizeFa("علي"), "علی");
});

test("normalizeLatin treats common spellings alike", () => {
  assert.equal(normalizeLatin("Salâm!"), normalizeLatin("salaam"));
  assert.equal(normalizeLatin("khub"), normalizeLatin("khoob"));
  assert.equal(normalizeLatin("jân (said 'joon')"), "jan");
});

test("quickMatch accepts close attempts and leaves the rest to Shirin", () => {
  const salam = { fa: "سلام", translit: "salâm" };
  assert.equal(quickMatch(salam, [{ text: "سلام" }]), "yes");
  assert.equal(quickMatch(salam, [{ text: "سلام خوبی" }]), "yes");
  assert.equal(quickMatch(salam, [{ text: "salaam" }]), "yes");
  assert.equal(quickMatch(salam, [{ text: "so lamb" }]), null); // Shirin decides this one
  const khodahafez = { fa: "خداحافظ", translit: "khodâhâfez" };
  assert.equal(quickMatch(khodahafez, [{ text: "خدا حافظ" }]), "yes");
  assert.equal(quickMatch(khodahafez, [{ text: "خداحافز" }]), "yes");
  assert.equal(quickMatch(khodahafez, [{ text: "کتاب" }]), null);
});

test("highlightSegments marks the focus letter and keeps letters joined", () => {
  const segs = highlightSegments("خوب", "خ");
  assert.equal(segs[0].focus, true);
  assert.ok(segs[0].text.endsWith("‍"), "joiner after a joining focus letter");
  assert.equal(segs.map((s) => s.text.replace(/‍/g, "")).join(""), "خوب");
  // alef never joins forward, so no joiner is added after it
  const alef = highlightSegments("انار", "ا");
  assert.ok(alef.every((s) => !s.text.endsWith("‍") || !s.focus));
});

test("letterForms: shy letters only have two shapes", () => {
  assert.equal(letterForms("ر").initial, "ر");
  assert.equal(letterForms("ب").initial, "ب‍");
  assert.equal(letterForms("ب").medial, "‍ب‍");
});

test("voiceId is stable and server-safe", () => {
  assert.equal(voiceId("سلام"), voiceId("سلامٌ"));
  assert.match(voiceId("خداحافظ"), /^w-[0-9a-f]{8}$/);
});

test("the alphabet has all 32 letters, each with example words", () => {
  assert.equal(ALPHABET.length, 32);
  assert.equal(new Set(ALPHABET.map((l) => l.char)).size, 32);
  for (const l of ALPHABET) {
    assert.ok(l.word.fa.includes(l.char) || (l.char === "ا" && l.word.fa.includes("آ")), `${l.name}: main word contains the letter`);
    assert.ok(l.extra.fa.includes(l.char) || (l.char === "ا" && l.extra.fa.includes("آ")), `${l.name}: extra word contains the letter`);
  }
  assert.deepEqual(ALPHABET.filter((l) => l.persian).map((l) => l.char), ["پ", "چ", "ژ", "گ"]);
  assert.deepEqual(ALPHABET.filter((l) => !l.joins).map((l) => l.char), ["ا", "د", "ذ", "ر", "ز", "ژ", "و"]);
});

test("the path covers every letter exactly once, and focus letters appear in their words", () => {
  const taught = LESSONS.flatMap((l) => l.letters);
  assert.equal(taught.length, 32);
  assert.equal(new Set(taught).size, 32);
  for (const lesson of LESSONS) {
    for (const w of lesson.words) {
      if (!w.focus) continue;
      const ok = w.fa.includes(w.focus) || (w.focus === "ا" && w.fa.includes("آ"));
      assert.ok(ok, `${lesson.id}: ${w.fa} contains ${w.focus}`);
      assert.ok(lesson.letters.includes(w.focus), `${lesson.id}: focus ${w.focus} is taught in this lesson`);
    }
    assert.ok(lesson.story.title && lesson.story.body && lesson.story.bridge, `${lesson.id} has a full story`);
  }
});

test("Persian text uses Persian ی and ک, never the Arabic forms", () => {
  const all = JSON.stringify([ALPHABET, LESSONS]);
  assert.ok(!/[يك]/.test(all), "found Arabic yeh or kaf");
});
