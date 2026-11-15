// Listening (speech recognition) and speaking. For playback the order is:
//   1. a family member's own recording (if they made one),
//   2. the garden's bundled recording (every built-in word has one — this is
//      what makes it work on iPhone, which has no Persian voice),
//   3. the device's Persian voice, if it has one.

import { fetchVoice, listVoices } from "./api.js";
import { voiceId, hasPersian } from "./persian.js";

// --- listening ----------------------------------------------------------------

const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
export const canListen = Boolean(Recognition);

const FA_UNSUPPORTED = "golestan.faRecognitionUnsupported";
function faUnsupported() {
  try {
    return localStorage.getItem(FA_UNSUPPORTED) === "1";
  } catch {
    return false;
  }
}

let active = null;

function listenOnce(lang, onInterim) {
  return new Promise((resolve, reject) => {
    const rec = new Recognition();
    active = rec;
    rec.lang = lang;
    rec.interimResults = true;
    rec.maxAlternatives = 5;
    rec.continuous = false;
    const guesses = [];
    let settled = false;

    rec.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          for (let j = 0; j < result.length; j++) {
            const alt = result[j];
            if (alt.transcript.trim()) guesses.push({ text: alt.transcript.trim(), confidence: alt.confidence || 0, lang });
          }
        } else {
          interim += result[0].transcript;
        }
      }
      if (interim && onInterim) onInterim(interim);
    };
    rec.onerror = (event) => {
      if (settled) return;
      if (event.error === "no-speech" || event.error === "aborted") return; // handled in onend
      settled = true;
      reject(Object.assign(new Error(event.error), { code: event.error }));
    };
    rec.onend = () => {
      active = null;
      if (settled) return;
      settled = true;
      resolve({ guesses, lang });
    };
    try {
      rec.start();
    } catch (err) {
      settled = true;
      reject(Object.assign(err, { code: err.code ?? "start-failed" }));
    }
  });
}

/** Listen once. Resolves with { guesses: [{text, confidence, lang}], lang }.
 * Asked for Persian on a device that can't recognise it (some iPhones), it
 * quietly listens in English instead — the matching understands
 * transliterations, and Shirin reads English look-alikes generously. */
export async function listen({ lang = "fa-IR", onInterim } = {}) {
  if (!Recognition) throw Object.assign(new Error("unsupported"), { code: "unsupported" });
  stopListening();
  const wanted = lang === "fa-IR" && faUnsupported() ? "en-US" : lang;
  try {
    return await listenOnce(wanted, onInterim);
  } catch (err) {
    if (wanted === "fa-IR" && ["language-not-supported", "service-not-allowed", "bad-grammar"].includes(err.code)) {
      try {
        localStorage.setItem(FA_UNSUPPORTED, "1");
      } catch {
        // fine
      }
      return listenOnce("en-US", onInterim);
    }
    throw err;
  }
}

export function stopListening() {
  if (active) {
    try {
      active.stop();
    } catch {
      // already stopped
    }
  }
}

export function listenErrorMessage(err) {
  switch (err?.code) {
    case "unsupported":
      return "This browser can't listen yet — just say it out loud and tap “I said it”. (Safari, Chrome and Edge can listen.)";
    case "not-allowed":
    case "service-not-allowed":
      return "I need permission to use the microphone. On iPhone: Settings → Safari → Microphone → Allow, then try again.";
    case "audio-capture":
      return "I couldn't find a microphone. Is one connected?";
    case "network":
      return "Listening needs an internet connection. Let's try again in a moment.";
    default:
      return "Something interrupted me while listening. Shall we try again?";
  }
}

// --- bundled recordings -------------------------------------------------------

// audio/index.json lists every recording with a short fingerprint of its
// contents; the fingerprint goes in the address, so when a recording is
// remade, phones fetch the new one instead of a saved old copy.
let bundled = null; // Map id → fingerprint ("" when the index has none)
let bundledLoad = null;
export function loadBundled() {
  bundledLoad ??= fetch("audio/index.json")
    .then((r) => (r.ok ? r.json() : {}))
    .then((j) => (bundled = new Map(j.files ? Object.entries(j.files) : (j.ids ?? []).map((id) => [id, ""]))))
    .catch(() => (bundled = new Map()));
  return bundledLoad;
}
export const hasBundled = (fa) => Boolean(bundled?.has(voiceId(fa)));
/** The address of a built-in recording, with its fingerprint. */
export const bundledUrl = (id) => `audio/${id}.mp3${bundled?.get(id) ? `?v=${bundled.get(id)}` : ""}`;

// --- family recordings --------------------------------------------------------

let recorded = new Set();
const blobCache = new Map();

export async function refreshRecordings() {
  try {
    recorded = new Set((await listVoices()).map((v) => v.id));
  } catch {
    recorded = new Set();
  }
  for (const url of blobCache.values()) URL.revokeObjectURL(url);
  blobCache.clear();
  // Fetch them now, so a tap can start playing straight away (iPhone only
  // allows sound that starts right inside a tap).
  await Promise.all(
    [...recorded].map(async (id) => {
      try {
        const blob = await fetchVoice(id);
        if (blob) blobCache.set(id, URL.createObjectURL(blob));
      } catch {
        // skip this one
      }
    }),
  );
  return recorded;
}

export const hasRecording = (fa) => recorded.has(voiceId(fa));
export function markRecorded(fa, blob) {
  const id = voiceId(fa);
  const old = blobCache.get(id);
  if (old) URL.revokeObjectURL(old);
  blobCache.delete(id);
  if (blob) {
    recorded.add(id);
    blobCache.set(id, URL.createObjectURL(blob));
  } else {
    recorded.delete(id);
  }
}

// One shared <audio> element. On iPhone, once it has played inside a tap it may
// keep playing new clips (needed for conversations that play line after line).
const player = new Audio();
player.preload = "auto";
let playToken = 0;

function playUrl(url, slow) {
  const token = ++playToken;
  player.pause();
  player.src = url;
  player.preservesPitch = true;
  player.webkitPreservesPitch = true;
  player.defaultPlaybackRate = slow ? 0.7 : 1;
  player.playbackRate = slow ? 0.7 : 1;
  return new Promise((resolve, reject) => {
    player.onended = () => token === playToken && resolve(true);
    player.onerror = () => token === playToken && reject(new Error("audio"));
    player.play().catch(reject);
  });
}

/** The best clip for a word, decided without waiting, so playback can start inside the tap. */
function clipFor(fa) {
  const id = voiceId(fa);
  if (blobCache.has(id)) return { url: blobCache.get(id), source: "family" };
  if (bundled?.has(id)) return { url: bundledUrl(id), source: "garden" };
  return null;
}

// --- device voices ------------------------------------------------------------

const synth = window.speechSynthesis;
let voices = [];
function loadVoices() {
  voices = synth ? synth.getVoices() : [];
}
if (synth) {
  loadVoices();
  synth.addEventListener?.("voiceschanged", loadVoices);
}

function pickVoice(prefix) {
  const matching = voices.filter((v) => v.lang?.toLowerCase().startsWith(prefix));
  return (
    matching.find((v) => /natural|neural|online|google|premium|enhanced/i.test(v.name)) ||
    matching.find((v) => v.localService) ||
    matching[0] ||
    null
  );
}

export const persianVoiceAvailable = () => Boolean(pickVoice("fa"));

function speakWithDevice(text, langPrefix, rate) {
  return new Promise((resolve) => {
    if (!synth) return resolve(false);
    const voice = pickVoice(langPrefix);
    if (!voice) return resolve(false);
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = rate;
    u.onend = () => resolve(true);
    u.onerror = () => resolve(false);
    synth.speak(u);
  });
}

/** Say a Persian word or phrase. Resolves with where the sound came from:
 * "family", "garden", "device", or null if nothing could play it. */
export function sayPersian(fa, { slow = false } = {}) {
  synth?.cancel();
  const clip = clipFor(fa);
  if (clip) {
    playUrl(clip.url, slow).catch(() => {});
    return Promise.resolve(clip.source);
  }
  return speakWithDevice(fa, "fa", slow ? 0.6 : 0.85).then((ok) => (ok ? "device" : null));
}

/** Play the built-in recording of a word, even when a family recording exists (for checking it). */
export function playBuiltIn(fa) {
  synth?.cancel();
  const id = voiceId(fa);
  if (!bundled?.has(id)) return false;
  playUrl(bundledUrl(id), false).catch(() => {});
  return true;
}

/** Play a Persian line and wait until it has finished (for conversations). */
export async function sayPersianAndWait(fa) {
  synth?.cancel();
  const clip = clipFor(fa);
  if (clip) {
    try {
      return await playUrl(clip.url, false);
    } catch {
      return false;
    }
  }
  return speakWithDevice(fa, "fa", 0.85);
}

/** Read one of Shirin's replies aloud: English parts in an English voice,
 * Persian parts in a Persian voice when the device has one. */
export async function sayReply(text) {
  if (!synth) return;
  synth.cancel();
  const clean = text
    .replace(/\*\*/g, "")
    .replace(/\(([^)]*)\)/g, (m, inner) => (hasPersian(inner) ? m : "")) // skip transliterations
    .replace(/[🌿🌸🍵🌙🍎✨]/gu, "");
  const parts = clean.split(/([؀-ۿ‌][؀-ۿ‌\s،؟]*)/).filter((p) => p.trim());
  const faOk = persianVoiceAvailable();
  for (const part of parts) {
    if (hasPersian(part)) {
      if (faOk) await speakWithDevice(part, "fa", 0.8);
    } else {
      await speakWithDevice(part, "en", 0.95);
    }
  }
}

export function stopSpeaking() {
  synth?.cancel();
  playToken++;
  player.pause();
}
