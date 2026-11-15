// Family voices: a Persian speaker at home checks the built-in voice, marks
// any word it says wrong (to send to whoever looks after the app), and can
// record the word themselves — then the app plays their voice instead.

import { h, fa, icon, toast } from "../lib/dom.js";
import { store } from "../lib/store.js";
import { ALPHABET } from "../data/alphabet.js";
import { LESSONS } from "../data/lessons.js";
import { READING } from "../data/reading.js";
import { SPEAK, ESSENTIALS } from "../data/speak.js";
import { STORIES, storyLines } from "../data/stories.js";
import { voiceId } from "../lib/persian.js";
import { saveVoice, deleteVoice, getStatus, listVoices, fetchVoice } from "../lib/api.js";
import { refreshRecordings, hasRecording, markRecorded, sayPersian, playBuiltIn, hasBundled, loadBundled } from "../lib/speech.js";

const MAX_SECONDS = 20; // long enough for a story sentence

function pickMime() {
  const options = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  return options.find((t) => window.MediaRecorder?.isTypeSupported?.(t)) ?? "";
}

let recorder = null;

const flagged = () => store.get().voiceFlags ?? {};
let onFlagsChange = () => {};

function recordRow(item) {
  const status = h("span", { class: "rec-status" });
  const builtInBtn = h("button", { class: "btn icon-btn", type: "button", "aria-label": `Hear the app's voice say ${item.fa}`, title: "The app's voice" }, icon("speaker"));
  builtInBtn.addEventListener("click", () => playBuiltIn(item.fa) || toast("There's no built-in recording of this one yet."));
  builtInBtn.hidden = !hasBundled(item.fa);
  const flagBtn = h("button", { class: "btn icon-btn flag-btn", type: "button", "aria-label": `Mark ${item.fa} as said wrong`, title: "Said wrong? Mark it" }, "👎");
  const showFlag = () => {
    const on = Boolean(flagged()[item.fa]);
    flagBtn.setAttribute("aria-pressed", String(on));
    flagBtn.closest?.("li")?.classList.toggle("flagged", on);
  };
  flagBtn.addEventListener("click", () => {
    store.update((st) => {
      st.voiceFlags = { ...(st.voiceFlags ?? {}) };
      if (st.voiceFlags[item.fa]) delete st.voiceFlags[item.fa];
      else st.voiceFlags[item.fa] = item.translit ?? "";
    });
    showFlag();
    onFlagsChange();
  });
  const playBtn = h("button", { class: "btn icon-btn", type: "button", "aria-label": `Play your recording of ${item.fa}`, title: "Your recording" }, icon("play"));
  const recBtn = h("button", { class: "btn rec", type: "button" }, "● Record");
  const delBtn = h("button", { class: "btn icon-btn", type: "button", "aria-label": `Delete recording of ${item.fa}`, title: "Delete" }, icon("trash"));

  const refresh = () => {
    const yes = hasRecording(item.fa);
    status.textContent = yes ? "✓ recorded" : "";
    playBtn.disabled = !yes;
    delBtn.hidden = !yes;
  };
  refresh();

  playBtn.addEventListener("click", () => sayPersian(item.fa));
  delBtn.addEventListener("click", async () => {
    if (!confirm(`Delete the recording of ${item.fa}?`)) return;
    try {
      await deleteVoice(voiceId(item.fa));
      markRecorded(item.fa, null);
      refresh();
    } catch (err) {
      toast(err.message);
    }
  });

  recBtn.addEventListener("click", async () => {
    if (recorder?.state === "recording") {
      recorder.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      toast("This browser can't record audio. Try Chrome, Edge, Firefox or Safari.");
      return;
    }
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch {
      toast("I need permission to use the microphone to record.");
      return;
    }
    const mime = pickMime();
    const chunks = [];
    recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const timer = setTimeout(() => recorder?.state === "recording" && recorder.stop(), MAX_SECONDS * 1000);
    recorder.onstop = async () => {
      clearTimeout(timer);
      stream.getTracks().forEach((t) => t.stop());
      recBtn.classList.remove("recording");
      recBtn.textContent = "● Record";
      const type = (recorder.mimeType || mime || "audio/webm").split(";")[0];
      recorder = null;
      const blob = new Blob(chunks, { type });
      if (blob.size < 800) {
        toast("That was very short — try again, saying the word clearly once.");
        return;
      }
      status.textContent = "saving…";
      try {
        await saveVoice(voiceId(item.fa), item.fa, blob);
        markRecorded(item.fa, blob);
        refresh();
        sayPersian(item.fa);
      } catch (err) {
        status.textContent = "";
        toast(err.message);
      }
    };
    recorder.start();
    recBtn.classList.add("recording");
    recBtn.textContent = "■ Stop";
  });

  const li = h(
    "li",
    { class: "rec-row" },
    h("span", { class: "rec-word" }, fa(item.fa), h("small", {}, `${item.translit} — ${item.meaning ?? item.en ?? ""}`)),
    h("span", { class: "rec-actions" }, builtInBtn, flagBtn, status, playBtn, recBtn, delBtn),
  );
  queueMicrotask(showFlag);
  return li;
}

/** Send the family's recordings (Messages, WhatsApp, AirDrop, email…), so they can be
 * added to the app for every phone. Each file is named by its line's id, with a list
 * of ids and lines alongside. */
async function sendRecordings() {
  const list = await listVoices().catch(() => []);
  if (!list.length) return toast("No recordings yet — tap ● Record next to a line first.");
  const files = [];
  for (const v of list) {
    const blob = await fetchVoice(v.id).catch(() => null);
    if (!blob) continue;
    const ext = /mp4|m4a|aac/.test(blob.type) ? "m4a" : /ogg/.test(blob.type) ? "ogg" : /wav/.test(blob.type) ? "wav" : "webm";
    files.push(new File([blob], `${v.id}.${ext}`, { type: blob.type || "audio/mp4" }));
  }
  const lines = list.map((v) => `${v.id}\t${v.text ?? ""}`).join("\n");
  files.push(new File([`Golestan family recordings\n\n${lines}\n`], "golestan-recordings.txt", { type: "text/plain" }));
  try {
    if (navigator.canShare?.({ files })) {
      await navigator.share({ files, title: "Golestan recordings", text: `${list.length} recordings for Golestan` });
      return;
    }
  } catch (err) {
    if (err?.name === "AbortError") return;
  }
  for (const f of files) {
    const a = h("a", { href: URL.createObjectURL(f), download: f.name });
    document.body.append(a);
    a.click();
    a.remove();
  }
  toast("Saved the recordings to your downloads — send them on from there.");
}

/** Share the marked words (Messages, WhatsApp, email…) or copy them. */
async function sendFlags() {
  const list = Object.entries(flagged());
  if (!list.length) return toast("Nothing marked yet — tap 👎 next to any word the app says wrong.");
  const text = `Golestan — words the app's voice says wrong (${list.length}):\n\n${list.map(([w, t]) => `${w}${t ? `  (${t})` : ""}`).join("\n")}`;
  try {
    if (navigator.share) return await navigator.share({ title: "Golestan: words to fix", text });
  } catch (err) {
    if (err?.name === "AbortError") return;
  }
  try {
    await navigator.clipboard.writeText(text);
    toast("Copied — paste it into a message.");
  } catch {
    prompt("Copy this list:", text);
  }
}

export function voicesView() {
  const s = store.get();
  const wrap = h("div", { class: "rec-sections" }, h("p", { class: "lede" }, "Loading recordings…"));
  const pinInput = h("input", { type: "password", inputmode: "numeric", placeholder: "Family PIN", value: s.familyPin, "aria-label": "Family PIN" });
  pinInput.addEventListener("change", () => store.update((st) => (st.familyPin = pinInput.value.trim())));

  const groups = [
    { title: "Travel essentials", items: ESSENTIALS },
    ...SPEAK.map((u) => ({ title: `Speak in Iran: ${u.title}`, items: [...u.phrases, ...u.dialogue] })),
    ...READING.map((r) => ({ title: `Reading Room: ${r.title}`, items: r.items })),
    { title: "Letter names", items: ALPHABET.map((l) => ({ fa: l.spoken, translit: l.name, meaning: `the letter ${l.char}` })) },
    ...LESSONS.map((l) => ({ title: l.title, items: [...l.words, l.closing] })),
    ...s.customLessons.map((c) => ({ title: `${c.lesson.title} (made by Shirin)`, items: [...c.lesson.words, ...c.lesson.phrases] })),
    {
      title: "Letter example words",
      items: ALPHABET.flatMap((l) => [l.word, l.extra]),
    },
    ...STORIES.map((st) => ({ title: `Story: ${st.title}`, items: storyLines(st) })),
  ];

  const flagCount = h("strong", {});
  const showCount = () => {
    const n = Object.keys(flagged()).length;
    flagCount.textContent = n ? `${n} marked` : "none marked yet";
  };
  showCount();
  onFlagsChange = showCount;
  const checkCard = h(
    "div",
    { class: "card check-voice" },
    h("h2", {}, "👂 Check the app's voice"),
    h("p", {}, "Tap 🔊 to hear how the app says a word. If it's wrong, tap 👎. When you're done, send the list — or record the word yourself with ● Record, and the app will use your voice instead."),
    h("p", { class: "row wrap" }, h("span", {}, "Words marked: ", flagCount), h("button", { class: "btn primary small", type: "button", onclick: sendFlags }, "Send the list")),
    h("p", { class: "small" }, "Recorded some lines yourself? Send them too — they'll be added to Golestan so your voice plays on every phone, not just this one."),
    h("p", { class: "row wrap" }, h("button", { class: "btn soft small", type: "button", onclick: sendRecordings }, "🎙 Send my recordings")),
  );

  Promise.all([refreshRecordings(), loadBundled()]).then(() => {
    const seen = new Set();
    wrap.replaceChildren(
      ...groups.map((grp) => {
        const items = grp.items.filter((it) => it && !seen.has(it.fa) && seen.add(it.fa));
        if (!items.length) return "";
        return h("details", { class: "card rec-group" }, h("summary", {}, grp.title, h("small", {}, ` · ${items.length}`)), h("ul", {}, items.map(recordRow)));
      }),
    );
  });

  return h(
    "section",
    { class: "view voices" },
    h(
      "header",
      { class: "page-head" },
      h("h1", {}, "Family voices"),
      h(
        "p",
        { class: "lede" },
        "If someone at home speaks Persian, they can record the words here — then every 🔊 button in the garden plays their voice. A familiar voice is the most authentic teacher there is.",
      ),
      h("p", { class: "small" }, `Tap ● Record, say the word once clearly, and it saves by itself after a few seconds (or tap ■ Stop). ${
          getStatus().server ? "Recordings are kept on the server, so they play on every device." : "Recordings are kept on this device — so record on her phone."
        }`),
      getStatus().familyPinRequired ? h("label", { class: "pin" }, "Family PIN: ", pinInput) : null,
    ),
    checkCard,
    wrap,
  );
}
