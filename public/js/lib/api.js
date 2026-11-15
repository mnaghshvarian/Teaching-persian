import { store } from "./store.js";
import { LESSONS } from "../data/lessons.js";

let status = { ai: false, passcodeRequired: false, familyPinRequired: false, routes: null, offline: true };

export async function loadStatus() {
  try {
    const res = await fetch("/api/status");
    status = { ...(await res.json()), offline: false };
  } catch {
    status = { ...status, offline: true };
  }
  return status;
}

export const getStatus = () => status;

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
    currentLesson: next ? next.title : "the whole path is finished",
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

/** Stream a reply from Shirin (Opus 5.5, medium effort). Calls onText for each piece. */
export async function chat(messages, onText, signal) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({ messages, learner: learnerSnapshot() }),
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
  const res = await fetch("/api/lesson", {
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
  const res = await fetch("/api/judge", {
    method: "POST",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({ target, heard, attempt, learner: learnerSnapshot() }),
  });
  if (!res.ok) throw await failure(res);
  return res.json();
}

// --- family voices -----------------------------------------------------------

export async function listVoices() {
  const res = await fetch("/api/voices", { headers: headers() });
  if (!res.ok) throw await failure(res);
  return (await res.json()).voices;
}

export async function fetchVoice(id) {
  const res = await fetch(`/api/voices/${id}`, { headers: headers() });
  if (!res.ok) return null;
  return res.blob();
}

export async function saveVoice(id, text, blob) {
  const { familyPin } = store.get();
  const res = await fetch(`/api/voices/${id}`, {
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
  const { familyPin } = store.get();
  const res = await fetch(`/api/voices/${id}`, {
    method: "DELETE",
    headers: headers(familyPin ? { "x-family-pin": familyPin } : {}),
  });
  if (!res.ok) throw await failure(res);
}
