// Checks on the Reading Room, Speak in Iran, the recordings, the offline
// file list and Shirin's shared request shapes.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { READING } from "../docs/js/data/reading.js";
import { SPEAK, ESSENTIALS } from "../docs/js/data/speak.js";
import { matchLine } from "../docs/js/lib/persian.js";
import { chatRequest, designRequest, judgeRequest, cleanLearner, cleanHistory, DEFAULT_ROUTES } from "../docs/js/shared/shirin.js";
import { collectItems } from "../scripts/collect-audio.mjs";
import { listFiles } from "../scripts/build-files.mjs";

const docs = new URL("../docs/", import.meta.url);

test("Reading Room: eight units, every item complete", () => {
  assert.equal(READING.length, 8);
  for (const unit of READING) {
    assert.ok(unit.title && unit.titleFa && unit.intro, unit.id);
    assert.ok(unit.items.length >= 6, `${unit.id} has enough to read`);
    for (const it of unit.items) assert.ok(it.fa && it.translit && it.meaning, `${unit.id}: ${it.fa}`);
  }
});

test("Speak in Iran: ten situations with phrases, a two-sided dialogue and a role", () => {
  assert.equal(SPEAK.length, 10);
  for (const unit of SPEAK) {
    assert.ok(unit.phrases.length >= 6, `${unit.id} phrases`);
    assert.ok(unit.dialogue.some((l) => l.who === "you") && unit.dialogue.some((l) => l.who === "them"), `${unit.id} dialogue`);
    for (const l of [...unit.phrases, ...unit.dialogue]) assert.ok(l.fa && l.translit && l.meaning, `${unit.id}: ${l.fa}`);
    assert.ok(unit.role.who && unit.role.setting && unit.role.goal, `${unit.id} role`);
  }
  assert.ok(ESSENTIALS.length >= 10);
});

test("Persian text uses Persian letters and half-spaces", () => {
  const all = JSON.stringify([READING, SPEAK, ESSENTIALS]);
  assert.ok(!/[يك]/.test(all), "Arabic yeh or kaf found");
  assert.ok(!/(^|[^؀-ۿ‌])می [؀-ۿ]/.test(all), "a mi- verb is missing its half-space");
});

test("every built-in word and phrase has a recording", () => {
  const index = JSON.parse(readFileSync(new URL("audio/index.json", docs), "utf8"));
  const have = new Set(index.ids);
  const missing = collectItems().filter((it) => !have.has(it.id) || !existsSync(new URL(`audio/${it.id}.mp3`, docs)));
  assert.deepEqual(missing.map((m) => m.fa), []);
});

test("the offline file list is up to date", () => {
  const saved = JSON.parse(readFileSync(new URL("files.json", docs), "utf8")).files;
  assert.deepEqual(saved, listFiles(), "run: node scripts/build-files.mjs");
});

test("conversation lines are matched generously but not blindly", () => {
  const line = SPEAK.find((s) => s.id === "s4").dialogue[1]; // سلام. لطفاً برید میدون آزادی.
  assert.ok(matchLine(line, [{ text: "سلام لطفا برید میدون آزادی" }]));
  assert.ok(matchLine(line, [{ text: "salam lotfan berid meydoon azadi" }]));
  assert.ok(!matchLine(line, [{ text: "کتاب" }]));
});

test("Shirin's shared requests: medium for talk and role-play, xhigh for lessons", () => {
  const learner = cleanLearner({ name: "Ava", speakingDone: ["Taxi and getting around"] });
  const history = cleanHistory([{ role: "assistant", content: "hi" }, { role: "user", content: "salâm!" }]);
  const chat = chatRequest({ history, learner });
  assert.equal(chat.model, "claude-opus-5-5");
  assert.equal(chat.output_config.effort, "medium");
  assert.equal(chat.messages[0].role, "user");
  const role = chatRequest({ history, learner, scenario: SPEAK[3] });
  assert.match(role.system[1].text, /Role-play: Taxi/);
  assert.match(role.system[1].text, /Speak in Iran situations practised: Taxi/);
  assert.equal(role.system[0].text, chat.system[0].text, "the cached part never changes");
  assert.equal(designRequest({ topic: "bakery", learner }).output_config.effort, "xhigh");
  assert.equal(judgeRequest({ target: { fa: "سلام", translit: "salâm", meaning: "hi" }, guesses: [], attempt: 1, learner }).output_config.effort, "medium");
  assert.deepEqual(DEFAULT_ROUTES, { design: { model: "claude-opus-5-5", effort: "xhigh" }, talk: { model: "claude-opus-5-5", effort: "medium" } });
});
