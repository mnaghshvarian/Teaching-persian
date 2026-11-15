// Server tests. Claude is replaced by a tiny local mock of the Messages API,
// so these run offline and check the exact requests Shirin sends: which
// model, which effort, adaptive thinking, the fallback opt-in, and caching.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const requests = [];
let mock;
let app;
let base;
let voiceDir;

function sse(res, text, stopReason = "end_turn") {
  res.writeHead(200, { "content-type": "text/event-stream" });
  const ev = (type, data) => res.write(`event: ${type}\ndata: ${JSON.stringify({ type, ...data })}\n\n`);
  ev("message_start", {
    message: { id: "msg_test", type: "message", role: "assistant", model: "claude-opus-5-5", content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 10, output_tokens: 1 } },
  });
  ev("content_block_start", { index: 0, content_block: { type: "thinking", thinking: "", signature: "" } });
  ev("content_block_delta", { index: 0, delta: { type: "signature_delta", signature: "sig" } });
  ev("content_block_stop", { index: 0 });
  ev("content_block_start", { index: 1, content_block: { type: "text", text: "" } });
  const mid = Math.floor(text.length / 2);
  for (const piece of [text.slice(0, mid), text.slice(mid)]) ev("content_block_delta", { index: 1, delta: { type: "text_delta", text: piece } });
  ev("content_block_stop", { index: 1 });
  ev("message_delta", { delta: { stop_reason: stopReason, stop_sequence: null }, usage: { output_tokens: 20 } });
  ev("message_stop", {});
  res.end();
}

const LESSON = {
  title: "At the bakery",
  title_fa: "نانوایی",
  intro: "Let's buy some bread!",
  focus_letters: ["ن"],
  words: [{ fa: "نان", translit: "nân", meaning: "bread", note: "Two rice bowls." }],
  phrases: [{ fa: "لطفاً", translit: "lotfan", meaning: "please", note: "" }],
  story: { title: "Sangak", body: "Bread baked on hot pebbles.", bridge: "Like a Toronto bakery." },
  quiz: [{ question: "What is نان?", options: ["bread", "tea", "rice"], answer_index: 0, hint: "You eat it.", celebrate: "Yes!" }],
  closing: "نوش جان (nush-e jân)",
};

before(async () => {
  mock = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const json = JSON.parse(body || "{}");
      requests.push({ url: req.url, headers: req.headers, body: json });
      const system = JSON.stringify(json.system ?? "");
      if (system.includes("preparing a lesson")) return sse(res, JSON.stringify(LESSON));
      if (system.includes("listening to her say a word")) {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(
          JSON.stringify({
            id: "msg_j", type: "message", role: "assistant", model: "claude-opus-5-5", stop_reason: "end_turn", stop_sequence: null,
            usage: { input_tokens: 5, output_tokens: 5 },
            content: [
              { type: "thinking", thinking: "", signature: "s" },
              { type: "text", text: JSON.stringify({ verdict: "yes", heard: "salâm", message: "آفرین! Beautiful.", tip: "" }) },
            ],
          }),
        );
        return;
      }
      return sse(res, "سلام (salâm)! Lovely to see you. 🌿");
    });
  });
  await new Promise((r) => mock.listen(0, r));
  process.env.ANTHROPIC_API_KEY = "test-key";
  process.env.ANTHROPIC_BASE_URL = `http://127.0.0.1:${mock.address().port}`;
  voiceDir = await mkdtemp(path.join(tmpdir(), "golestan-voices-"));
  const { createApp } = await import("../server/app.ts");
  app = createApp({ voiceDir }).listen(0);
  await new Promise((r) => app.once("listening", r));
  base = `http://127.0.0.1:${app.address().port}`;
});

after(async () => {
  app?.close();
  mock?.close();
  if (voiceDir) await rm(voiceDir, { recursive: true, force: true });
});

const post = (p, body) => fetch(base + p, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

async function events(res) {
  const text = await res.text();
  return text.split("\n\n").filter(Boolean).map((chunk) => JSON.parse(chunk.replace(/^data: /, "")));
}

test("status reports both model routes", async () => {
  const s = await (await fetch(base + "/api/status")).json();
  assert.equal(s.ai, true);
  assert.deepEqual(s.routes.design, { model: "claude-opus-5-5", effort: "xhigh" });
  assert.deepEqual(s.routes.talk, { model: "claude-opus-5-5", effort: "medium" });
});

test("chat streams Shirin's reply using Opus 5.5 at medium effort", async () => {
  requests.length = 0;
  const res = await post("/api/chat", {
    messages: [
      { role: "assistant", content: "greeting shown in the page" },
      { role: "user", content: "[Spoken…] so lamb" },
    ],
    learner: { name: "Ava", lessonsDone: ["The cups"], lettersLearned: ["خ"], wordsLearned: [], currentLesson: "The shy letters" },
  });
  const evs = await events(res);
  assert.equal(evs.filter((e) => e.type === "text").map((e) => e.text).join(""), "سلام (salâm)! Lovely to see you. 🌿");
  assert.equal(evs.at(-1).type, "done");

  const { body, headers } = requests[0];
  assert.equal(body.model, "claude-opus-5-5");
  assert.equal(body.output_config.effort, "medium");
  assert.deepEqual(body.thinking, { type: "adaptive" });
  assert.equal(body.stream, true);
  assert.equal(body.fallbacks, "default");
  assert.match(headers["anthropic-beta"], /server-side-fallback-2026-07-01/);
  assert.equal(body.messages[0].role, "user", "leading greeting is dropped");
  assert.equal(body.system[0].cache_control.type, "ephemeral");
  assert.match(body.system[0].text, /Shirin/);
  assert.match(body.system[1].text, /Her name: Ava/);
  assert.ok(!("temperature" in body));
});

test("role-play: Shirin plays a situation from Speak in Iran", async () => {
  requests.length = 0;
  const res = await post("/api/chat", { messages: [{ role: "user", content: "Let's start" }], scenario: "s4", learner: {} });
  await events(res);
  const { body } = requests[0];
  assert.equal(body.output_config.effort, "medium");
  assert.match(body.system[1].text, /Role-play: Taxi and getting around/);
  assert.match(body.system[1].text, /taxi driver/);
});

test("lesson design uses Opus 5.5 at xhigh effort with a JSON schema", async () => {
  requests.length = 0;
  const res = await post("/api/lesson", { topic: "Buying bread", learner: {} });
  const evs = await events(res);
  const lesson = evs.find((e) => e.type === "lesson").lesson;
  assert.equal(lesson.title, "At the bakery");
  assert.equal(lesson.words[0].fa, "نان");
  assert.equal(lesson.quiz[0].answer_index, 0);

  const { body } = requests[0];
  assert.equal(body.model, "claude-opus-5-5");
  assert.equal(body.output_config.effort, "xhigh");
  assert.equal(body.output_config.format.type, "json_schema");
  assert.ok(body.output_config.format.schema.required.includes("quiz"));
  assert.equal(body.max_tokens, 64000);
});

test("pronunciation judging uses medium effort and returns a kind verdict", async () => {
  requests.length = 0;
  const res = await post("/api/judge", {
    target: { fa: "سلام", translit: "salâm", meaning: "hello" },
    heard: [{ text: "so lamb", confidence: 0.4, lang: "en-US" }],
    attempt: 1,
  });
  const j = await res.json();
  assert.equal(j.verdict, "yes");
  assert.equal(requests[0].body.output_config.effort, "medium");
  assert.match(requests[0].body.messages[0].content, /so lamb/);
});

test("family voices: save, list, play and delete", async () => {
  const audio = Buffer.alloc(2000, 7);
  const put = await fetch(base + "/api/voices/w-1234abcd", {
    method: "PUT",
    headers: { "content-type": "audio/webm;codecs=opus", "x-voice-text": encodeURIComponent("سلام") },
    body: audio,
  });
  assert.equal(put.status, 200);
  const list = await (await fetch(base + "/api/voices")).json();
  assert.deepEqual(list.voices.map((v) => [v.id, v.text]), [["w-1234abcd", "سلام"]]);
  const got = await fetch(base + "/api/voices/w-1234abcd");
  assert.equal(got.headers.get("content-type"), "audio/webm");
  assert.equal((await got.arrayBuffer()).byteLength, 2000);
  assert.equal((await fetch(base + "/api/voices/w-1234abcd", { method: "DELETE" })).status, 200);
  assert.equal((await fetch(base + "/api/voices/w-1234abcd")).status, 404);
});

test("family voices reject unsafe ids and non-audio", async () => {
  const bad = await fetch(base + "/api/voices/..%2Fsecret", { method: "PUT", headers: { "content-type": "audio/webm" }, body: Buffer.alloc(500) });
  assert.ok(bad.status === 400 || bad.status === 404);
  const text = await fetch(base + "/api/voices/w-1", { method: "PUT", headers: { "content-type": "text/plain" }, body: "hello" });
  assert.equal(text.status, 400);
});

test("the garden page is served", async () => {
  const res = await fetch(base + "/");
  assert.equal(res.status, 200);
  assert.match(await res.text(), /Golestan/);
});
