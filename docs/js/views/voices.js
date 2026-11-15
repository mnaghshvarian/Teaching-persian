// Family voices: a Persian speaker at home records the words, so the app
// plays a real, familiar voice instead of a robot.

import { h, fa, icon, toast } from "../lib/dom.js";
import { store } from "../lib/store.js";
import { ALPHABET } from "../data/alphabet.js";
import { LESSONS } from "../data/lessons.js";
import { READING } from "../data/reading.js";
import { SPEAK, ESSENTIALS } from "../data/speak.js";
import { voiceId } from "../lib/persian.js";
import { saveVoice, deleteVoice, getStatus } from "../lib/api.js";
import { refreshRecordings, hasRecording, markRecorded, sayPersian } from "../lib/speech.js";

const MAX_SECONDS = 8;

function pickMime() {
  const options = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  return options.find((t) => window.MediaRecorder?.isTypeSupported?.(t)) ?? "";
}

let recorder = null;

function recordRow(item) {
  const status = h("span", { class: "rec-status" });
  const playBtn = h("button", { class: "btn icon-btn", type: "button", "aria-label": `Play ${item.fa}`, title: "Play" }, icon("play"));
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

  return h(
    "li",
    { class: "rec-row" },
    h("span", { class: "rec-word" }, fa(item.fa), h("small", {}, `${item.translit} — ${item.meaning}`)),
    h("span", { class: "rec-actions" }, status, playBtn, recBtn, delBtn),
  );
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
  ];

  refreshRecordings().then(() => {
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
    wrap,
  );
}
