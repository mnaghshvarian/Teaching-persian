// How the page reaches Shirin's AI and the family voices. Two ways to run:
//   • "server": the optional Node server holds the API key (npm start / a host).
//   • "direct": the static site (e.g. GitHub Pages) talks to Claude straight
//     from the browser with the learner's own API key, stored on her device.
// Everything else in the garden works with no AI at all.

import { store } from "./store.js";
import { LESSONS } from "../data/lessons.js";
import { BY_READING } from "../data/reading.js";
import { BY_SPEAK } from "../data/speak.js";
import { DEFAULT_ROUTES } from "../shared/shirin.js";
import * as local from "./localvoices.js";

let status = { mode: "none", server: false, ai: false, passcodeRequired: false, familyPinRequired: false, routes: DEFAULT_ROUTES };

export async function loadStatus() {
  let server = null;
  // GitHub Pages is static: there is no server to ask (and asking logs a 404).
  const staticHost = /\.github\.io$/.test(location.hostname);
  try {
    if (staticHost) throw new Error("static");
    const res = await fetch("api/status", { headers: { accept: "application/json" } });
    if (res.ok && (res.headers.get("content-type") || "").includes("json")) server = await res.json();
  } catch {
    server = null;
  }
  if (server) {
    status = { ...server, server: true, mode: server.ai ? "server" : store.get().apiKey ? "direct" : "none" };
    if (!server.ai && store.get().apiKey) status = { ...status, ai: true, routes: DEFAULT_ROUTES };
  } else {
    const hasKey = Boolean(store.get().apiKey);
    status = { mode: hasKey ? "direct" : "none", server: false, ai: hasKey, passcodeRequired: false, familyPinRequired: false, routes: DEFAULT_ROUTES };
  }
  return status;
}

export const getStatus = () => status;

export function refreshKeyStatus() {
  const hasKey = Boolean(store.get().apiKey);
  if (status.mode !== "server") status = { ...status, mode: hasKey ? "direct" : "none", ai: hasKey, routes: DEFAULT_ROUTES };
  return status;
}

function headers(extra = {}) {
  const h = { ...extra };
  const { passcode } = store.get();
  if (passcode) h["x-app-passcode"] = passcode;
  return h;
}

export class ApiError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

async function failure(res) {
  let body = {};
  try {
    body = await res.json();
  } catch {
    // not JSON
  }
  return new ApiError(body.message || `Request failed (${res.status})`, body.error || String(res.status));
}

/** What Shirin should know about her progress. */
export function learnerSnapshot() {
  const s = store.get();
  const done = LESSONS.filter((l) => s.lessonsDone.includes(l.id));
  const next = LESSONS.find((l) => !s.lessonsDone.includes(l.id));
  return {
    name: s.name,
    lessonsDone: done.map((l) => l.title),
    lettersLearned: s.lettersSeen,
    wordsLearned: s.wordsSeen.slice(-60),
    currentLesson: next ? next.title : "the whole alphabet path is finished",
    readingDone: s.readingDone.map((id) => BY_READING[id]?.title).filter(Boolean),
    speakingDone: s.speakingDone.map((id) => BY_SPEAK[id]?.title).filter(Boolean),
  };
}

async function* readEvents(res) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf("\n\n")) >= 0) {
      const chunk = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const line = chunk.split("\n").find((l) => l.startsWith("data: "));
      if (line) {
        try {
          yield JSON.parse(line.slice(6));
        } catch {
          // skip a malformed event
        }
      }
    }
  }
}

const direct = () => import("./claude-direct.js");

/** Stream a reply from Shirin (Opus 5.5, medium effort). `scenario` = a Speak in Iran id for role-play. */
export async function chat(messages, onText, signal, scenario = null) {
  if (status.mode === "direct") {
    return (await direct()).chatDirect(store.get().apiKey, messages, learnerSnapshot(), scenario, onText, signal);
  }
  const res = await fetch("api/chat", {
    method: "POST",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({ messages, learner: learnerSnapshot(), scenario }),
    signal,
  });
  if (!res.ok) throw await failure(res);
  for await (const ev of readEvents(res)) {
    if (ev.type === "text") onText(ev.text);
    else if (ev.type === "error") throw new ApiError(ev.message, "stream");
  }
}

/** Ask Shirin to design a lesson (Opus 5.5, xhigh effort). Can take a minute or two. */
export async function designLesson(topic, signal) {
  if (status.mode === "direct") return (await direct()).designDirect(store.get().apiKey, topic, learnerSnapshot(), signal);
  const res = await fetch("api/lesson", {
    method: "POST",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({ topic, learner: learnerSnapshot() }),
    signal,
  });
  if (!res.ok) throw await failure(res);
  for await (const ev of readEvents(res)) {
    if (ev.type === "lesson") return ev.lesson;
    if (ev.type === "error") throw new ApiError(ev.message, "stream");
  }
  throw new ApiError("The lesson didn't arrive. Please try again.", "empty");
}

/** Ask Shirin how a spoken attempt sounded (Opus 5.5, medium effort). */
export async function judge(target, heard, attempt) {
  if (status.mode === "direct") return (await direct()).judgeDirect(store.get().apiKey, target, heard, attempt, learnerSnapshot());
  const res = await fetch("api/judge", {
    method: "POST",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({ target, heard, attempt, learner: learnerSnapshot() }),
  });
  if (!res.ok) throw await failure(res);
  return res.json();
}

/** Check an API key works (a free model lookup, no tokens used). */
export async function verifyKey(key) {
  return (await direct()).verifyKey(key);
}

// --- family voices: on the server when there is one, otherwise on this device

export async function listVoices() {
  if (!status.server) return local.list();
  const res = await fetch("api/voices", { headers: headers() });
  if (!res.ok) throw await failure(res);
  return (await res.json()).voices;
}

export async function fetchVoice(id) {
  if (!status.server) return local.get(id);
  const res = await fetch(`api/voices/${id}`, { headers: headers() });
  if (!res.ok) return null;
  return res.blob();
}

export async function saveVoice(id, text, blob) {
  if (!status.server) return local.put(id, text, blob);
  const { familyPin } = store.get();
  const res = await fetch(`api/voices/${id}`, {
    method: "PUT",
    headers: headers({
      "Content-Type": blob.type || "audio/webm",
      "x-voice-text": encodeURIComponent(text),
      ...(familyPin ? { "x-family-pin": familyPin } : {}),
    }),
    body: blob,
  });
  if (!res.ok) throw await failure(res);
  return res.json();
}

export async function deleteVoice(id) {
  if (!status.server) return local.remove(id);
  const { familyPin } = store.get();
  const res = await fetch(`api/voices/${id}`, {
    method: "DELETE",
    headers: headers(familyPin ? { "x-family-pin": familyPin } : {}),
  });
  if (!res.ok) throw await failure(res);
}
