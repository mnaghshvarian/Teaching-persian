// Listening (speech recognition) and speaking (family recordings first, then
// the device's Persian voice if it has one).

import { fetchVoice, listVoices } from "./api.js";
import { voiceId, hasPersian } from "./persian.js";

// --- listening ----------------------------------------------------------------

const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
export const canListen = Boolean(Recognition);

let active = null;

/** Listen once. Resolves with { guesses: [{text, confidence, lang}] }.
 * onInterim(text) is called with live partial results. */
export function listen({ lang = "fa-IR", onInterim } = {}) {
  if (!Recognition) return Promise.reject(Object.assign(new Error("unsupported"), { code: "unsupported" }));
  stopListening();
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
            if (alt.transcript.trim()) {
              guesses.push({ text: alt.transcript.trim(), confidence: alt.confidence || 0, lang });
            }
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
      resolve({ guesses });
    };
    try {
      rec.start();
    } catch (err) {
      settled = true;
      reject(err);
    }
  });
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
      return "This browser can't listen yet. Chrome, Edge or Safari can — or just say it out loud and tap “I said it”.";
    case "not-allowed":
    case "service-not-allowed":
      return "I need permission to use the microphone. You can allow it from the little icon next to the address bar.";
    case "audio-capture":
      return "I couldn't find a microphone. Is one plugged in?";
    case "network":
      return "Listening needs an internet connection. Let's try again in a moment.";
    default:
      return "Something interrupted me while listening. Shall we try again?";
  }
}

// --- family recordings --------------------------------------------------------

let recorded = new Set();
const blobCache = new Map();

export async function refreshRecordings() {
  try {
    recorded = new Set((await listVoices()).map((v) => v.id));
  } catch {
    recorded = new Set();
  }
  blobCache.clear();
  return recorded;
}

export const hasRecording = (fa) => recorded.has(voiceId(fa));
export const markRecorded = (fa, yes) => {
  const id = voiceId(fa);
  if (yes) recorded.add(id);
  else recorded.delete(id);
  blobCache.delete(id);
};

let currentAudio = null;

async function playRecording(fa) {
  const id = voiceId(fa);
  if (!recorded.has(id)) return false;
  let url = blobCache.get(id);
  if (!url) {
    const blob = await fetchVoice(id);
    if (!blob) return false;
    url = URL.createObjectURL(blob);
    blobCache.set(id, url);
  }
  currentAudio?.pause();
  currentAudio = new Audio(url);
  await currentAudio.play();
  return true;
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
    matching.find((v) => /natural|neural|online|google/i.test(v.name)) ||
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

/** Say a Persian word or phrase. Returns where the sound came from:
 * "family", "device", or null if nothing could play it. */
export async function sayPersian(fa, { slow = false } = {}) {
  synth?.cancel();
  try {
    if (await playRecording(fa)) return "family";
  } catch {
    // fall through to the device voice
  }
  return (await speakWithDevice(fa, "fa", slow ? 0.6 : 0.85)) ? "device" : null;
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
  currentAudio?.pause();
}
