// Checks on the Story Library: every story complete, every picture present,
// no holy figure ever pictured, correct Persian letters — and the whole site in git.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { COLLECTIONS, STORIES, storyLines } from "../docs/js/data/stories.js";
import { PLATE_MOTIFS } from "../docs/js/plates.js";

const docs = new URL("../docs/", import.meta.url);

test("every story belongs to a collection and is complete", () => {
  const ids = new Set(COLLECTIONS.map((c) => c.id));
  assert.equal(new Set(STORIES.map((s) => s.id)).size, STORIES.length, "story ids are unique");
  for (const s of STORIES) {
    assert.ok(ids.has(s.collection), `${s.id}: collection`);
    assert.ok(s.title && s.titleFa && s.about, `${s.id}: titles and about`);
    assert.ok([1, 2, 3].includes(s.level), `${s.id}: level`);
    const lines = s.sentences ?? s.poem;
    assert.ok(lines?.length >= 4, `${s.id}: at least four lines`);
    for (const l of storyLines(s)) assert.ok(l.fa && l.translit && (l.en || l.meaning), `${s.id}: ${l.fa}`);
    assert.ok(s.words.length >= 5, `${s.id}: words`);
  }
  for (const c of COLLECTIONS) assert.ok(STORIES.some((s) => s.collection === c.id), `${c.id} has stories`);
});

test("every story has its picture", () => {
  for (const s of STORIES) {
    if (s.image) {
      assert.ok(existsSync(new URL(`stories/img/${s.image}.jpg`, docs)), `${s.id}: image file`);
      assert.match(s.credit?.url ?? "", /^https:\/\/www\.metmuseum\.org\//, `${s.id}: museum credit`);
    } else {
      assert.ok(PLATE_MOTIFS.includes(s.plate), `${s.id}: plate motif`);
    }
  }
});

const RELIGIOUS = new Set(["ahlulbayt", "yaran", "quran"]);

test("religious stories never show figurative paintings", () => {
  for (const s of STORIES.filter((x) => RELIGIOUS.has(x.collection))) {
    assert.equal(s.image, undefined, `${s.id} must use an illuminated plate, not a painting`);
    assert.ok(s.plate, `${s.id} has a plate`);
  }
});

test("religious stories carry their verses, hadith or prayers, with sources", () => {
  for (const s of STORIES.filter((x) => RELIGIOUS.has(x.collection))) {
    assert.ok(s.quotes?.length >= 1, `${s.id}: at least one verse, hadith or prayer`);
    for (const q of s.quotes) {
      assert.ok(q.ar && q.fa && q.translit && q.en && q.source, `${s.id}: complete quote ${q.fa}`);
      assert.match(q.ar, /[\u064B-\u0652]/, `${s.id}: the Arabic is written with its vowel marks`);
    }
    if (s.collection !== "quran" && s.id !== "everyday-prayers") assert.ok(s.sources?.length >= 1, `${s.id}: names its sources`);
  }
});

test("Lady Khadijeh's story follows the Shia narrations", () => {
  const k = STORIES.find((s) => s.id === "khadijeh");
  const text = k.sentences.map((l) => l.fa).join(" ");
  assert.match(text, /بیست و پنج/, "about twenty-five at her marriage");
  assert.match(text, /ازدواج نکرده بود/, "her first marriage");
  assert.match(text, /خواهرش هاله/, "the daughters of her sister Hala");
  assert.match(text, /ام‌المؤمنین/, "Mother of the Believers");
  assert.doesNotMatch(text, /چهل/, "no 'forty years old'");
});

test("story Persian uses Persian letters and half-spaces", () => {
  const text = JSON.stringify(STORIES.map((s) => [s.titleFa, storyLines(s).map((l) => l.fa)]));
  assert.ok(!/[يك]/.test(text), "Arabic yeh or kaf found");
  assert.ok(!/(^|[^؀-ۿ‌])می [؀-ۿ]/.test(text), "a mi- verb is missing its half-space");
});

test("no file of the website is left out of git", (t) => {
  let ignored;
  try {
    ignored = execFileSync("git", ["ls-files", "--others", "--ignored", "--exclude-standard", "docs"], {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
    }).trim();
  } catch {
    t.skip("git is not available");
    return;
  }
  assert.equal(ignored, "", `ignored by .gitignore, so GitHub Pages would not get them:\n${ignored}`);
});
