import { h, richText, icon, toast } from "../lib/dom.js";
import { store } from "../lib/store.js";
import { chat, getStatus } from "../lib/api.js";
import { canListen, listen, listenErrorMessage, sayReply, stopSpeaking } from "../lib/speech.js";
import { avatar } from "../components.js";
import { BY_SPEAK } from "../data/speak.js";

const SUGGESTIONS = [
  "How do I say “good morning”?",
  "Tell me a short story about Nowruz",
  "Quiz me gently on my letters",
  "How do I greet family politely?",
  "What should I say when I'm offered tea?",
  "Teach me one sweet word for today",
];

function greetingText() {
  const { name } = store.get();
  const hello = `سلام (salâm)${name ? `, ${name} joon` : ""}! 🌿`;
  if (!getStatus().ai) {
    return `${hello} I'm resting right now. Wake me in Settings and we can chat, role-play a taxi ride or a family dinner, and make lessons together.\n\nEverything else in the garden is ready for you — the letters, the Reading Room, Speak in Iran and the phrasebook.`;
  }
  return `${hello} I'm so happy you're here. You can type, or tap the microphone and just speak — English, Persian, or a mix. Don't worry about pronunciation; I'm good at understanding beginners.\n\nWhat would you like to do today?`;
}

export function talkView(params) {
  const status = getStatus();
  const log = h("div", { class: "chat-log", "aria-live": "polite" });
  const input = h("textarea", { class: "chat-input", rows: 1, placeholder: "Write to Shirin…", "aria-label": "Message to Shirin" });
  const send = h("button", { class: "btn primary icon-btn round", type: "button", "aria-label": "Send", title: "Send" }, icon("send"));
  const mic = h("button", { class: "btn mic icon-btn round", type: "button", "aria-label": "Speak", title: "Speak" }, icon("mic"));
  const speakToggle = h("label", { class: "toggle" }, h("input", { type: "checkbox" }), h("span", {}, "Read replies aloud"));
  const langSelect = h(
    "select",
    { "aria-label": "What I'll speak" },
    h("option", { value: "en-US" }, "I'll speak English & a little Persian"),
    h("option", { value: "fa-IR" }, "I'll speak Persian"),
  );
  const chips = h("div", { class: "chips" });
  let busy = false;
  let abort = null;

  const settings = store.get().settings;
  speakToggle.firstChild.checked = settings.speakReplies;
  langSelect.value = settings.micLang;
  speakToggle.firstChild.addEventListener("change", (e) => {
    store.update((s) => (s.settings.speakReplies = e.target.checked));
    if (!e.target.checked) stopSpeaking();
  });
  langSelect.addEventListener("change", (e) => store.update((s) => (s.settings.micLang = e.target.value)));

  function bubble(role, text) {
    const body = h("div", { class: "bubble" }, richText(text));
    const row = h("div", { class: `msg ${role}` }, role === "assistant" ? avatar() : null, body);
    log.append(row);
    return body;
  }

  function renderAll() {
    log.replaceChildren();
    if (!store.get().chatScenario) bubble("assistant", greetingText());
    for (const m of store.get().chat) bubble(m.role, m.display ?? m.content);
    chips.hidden = !status.ai || store.get().chat.length > 0;
    requestAnimationFrame(() => (log.scrollTop = log.scrollHeight));
  }

  async function submit(content, display) {
    if (busy || !content.trim()) return;
    if (!status.ai) {
      toast("Shirin is resting — add an API key to the server to wake her up. 🌙");
      return;
    }
    busy = true;
    chips.hidden = true;
    stopSpeaking();
    store.update((s) => s.chat.push({ role: "user", content, display }));
    bubble("user", display ?? content);
    const body = bubble("assistant", "");
    body.classList.add("thinking-dots");
    log.scrollTop = log.scrollHeight;

    let reply = "";
    let frame = 0;
    abort = new AbortController();
    try {
      await chat(
        store.get().chat.map(({ role, content: c }) => ({ role, content: c })),
        (delta) => {
          reply += delta;
          if (!frame) {
            frame = requestAnimationFrame(() => {
              frame = 0;
              body.classList.remove("thinking-dots");
              body.replaceChildren(richText(reply));
              log.scrollTop = log.scrollHeight;
            });
          }
        },
        abort.signal,
        store.get().chatScenario,
      );
      cancelAnimationFrame(frame);
      body.classList.remove("thinking-dots");
      body.replaceChildren(richText(reply || "🌿"));
      if (reply) {
        store.update((s) => {
          s.chat.push({ role: "assistant", content: reply });
          s.chat = s.chat.slice(-40);
        });
        if (store.get().settings.speakReplies) sayReply(reply);
      }
    } catch (err) {
      body.classList.remove("thinking-dots");
      body.replaceChildren(richText(abort.signal.aborted ? "(stopped)" : err.message || "Something went wrong — shall we try again?"));
      body.classList.add("error");
      // keep the conversation valid for the next try
      store.update((s) => {
        if (s.chat.at(-1)?.role === "user") s.chat.pop();
      });
    } finally {
      busy = false;
      abort = null;
      log.scrollTop = log.scrollHeight;
    }
  }

  send.addEventListener("click", () => {
    const text = input.value.trim();
    input.value = "";
    autosize();
    submit(text);
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send.click();
    }
  });
  const autosize = () => {
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
  };
  input.addEventListener("input", autosize);

  mic.addEventListener("click", async () => {
    if (!canListen) {
      toast("This browser can't listen — try Chrome, Edge or Safari. You can always type. 🌿", 5000);
      return;
    }
    if (mic.classList.contains("listening")) return;
    mic.classList.add("listening");
    stopSpeaking();
    const lang = store.get().settings.micLang;
    input.placeholder = "Listening… speak whenever you're ready";
    try {
      const { guesses } = await listen({ lang, onInterim: (t) => { input.value = t; autosize(); } });
      input.value = "";
      autosize();
      if (!guesses.length) {
        toast("I didn't catch anything that time — try again, a little closer? 🌿");
        return;
      }
      const best = guesses[0].text;
      const alts = guesses.slice(1, 4).map((g) => `“${g.text}”`).join(", ");
      const content =
        `[Spoken into the microphone; the ${lang === "fa-IR" ? "Persian" : "English"} speech recognizer heard: “${best}”` +
        (alts ? `; other possible hearings: ${alts}` : "") +
        `. Read it generously — she is a beginner.]\n${best}`;
      submit(content, `🎙 ${best}`);
    } catch (err) {
      toast(listenErrorMessage(err), 6000);
    } finally {
      mic.classList.remove("listening");
      input.placeholder = "Write to Shirin…";
    }
  });

  chips.append(
    ...SUGGESTIONS.map((s) => h("button", { class: "chip", type: "button", onclick: () => submit(s) }, s)),
  );

  const clearBtn = h(
    "button",
    {
      class: "btn ghost small",
      type: "button",
      onclick: () => {
        if (!store.get().chat.length || confirm("Start a fresh conversation? (Your lessons and garden stay.)")) {
          abort?.abort();
          store.update((s) => {
            s.chat = [];
            s.chatScenario = null;
          });
          location.hash = "#/talk";
          renderAll();
        }
      },
    },
    "New conversation",
  );

  const view = h(
    "section",
    { class: "view talk" },
    h(
      "header",
      { class: "talk-head" },
      avatar("lg"),
      h("div", {}, h("h1", {}, "Shirin"), h("p", { class: "lede" }, status.ai ? "Your Persian teacher · calm, kind and patient" : "Resting right now 🌙")),
      clearBtn,
    ),
    scenarioBanner(),
    log,
    chips,
    status.ai
      ? h("div", { class: "composer" }, mic, input, send)
      : h(
          "div",
          { class: "resting card" },
          h("p", {}, "🌙 Shirin is resting. To chat, role-play and make lessons she needs Claude: add your Anthropic API key in Settings (it stays on this device). Everything else in the garden works already — even offline."),
          h("button", { class: "btn soft", type: "button", onclick: () => document.getElementById("settings-btn").click() }, "Open Settings"),
        ),
    h("div", { class: "talk-options" }, langSelect, speakToggle),
  );

  function scenarioBanner() {
    const sc = BY_SPEAK[store.get().chatScenario];
    if (!sc) return null;
    return h(
      "div",
      { class: "card scenario-banner" },
      h("span", { class: "scenario-icon", "aria-hidden": "true" }, sc.icon),
      h("p", {}, h("strong", {}, `Role-play: ${sc.title}`), h("br"), h("small", {}, `Shirin is playing ${sc.role.who}. Answer in Persian if you can — English is fine when you're stuck.`)),
      h("button", { class: "btn ghost small", type: "button", onclick: () => clearBtn.click() }, "End"),
    );
  }

  const scenario = params.get("scenario");
  if (scenario && BY_SPEAK[scenario] && status.ai) {
    history.replaceState(null, "", "#/talk");
    if (store.get().chatScenario !== scenario) {
      store.update((s) => {
        s.chat = [];
        s.chatScenario = scenario;
      });
      renderAll();
      view.querySelector(".talk-head").after(scenarioBanner());
      setTimeout(() => submit("(Let's start the role-play — you begin, please.)", "🎭 Let's begin"), 50);
      return view;
    }
  }

  renderAll();
  if (params.get("ask")) {
    const ask = params.get("ask");
    history.replaceState(null, "", "#/talk");
    setTimeout(() => submit(ask), 50);
  }
  return view;
}
