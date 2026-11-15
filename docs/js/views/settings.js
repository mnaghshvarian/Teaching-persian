import { h, fa } from "../lib/dom.js";
import { store } from "../lib/store.js";
import { getStatus, verifyKey, refreshKeyStatus } from "../lib/api.js";
import { shellFiles, OFFLINE_CACHE } from "../offline.js";
import { setAmbience } from "../lib/sound.js";
import { avatar } from "../components.js";

export function applyTheme() {
  const { theme } = store.get().settings;
  if (theme === "auto") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", theme);
}

function dialog(...children) {
  const dlg = h("dialog", { class: "dialog" }, ...children);
  dlg.addEventListener("close", () => dlg.remove());
  document.body.append(dlg);
  dlg.showModal();
  return dlg;
}

export function openOnboarding(onDone) {
  const name = h("input", { type: "text", maxlength: 40, placeholder: "Your first name", autocomplete: "given-name", "aria-label": "Your name" });
  const form = h(
    "form",
    { method: "dialog", class: "onboarding" },
    avatar("xl"),
    h("h2", {}, fa("سلام"), " — hello!"),
    h("p", {}, "I'm Shirin. I'll be your Persian teacher in this little garden: calm, patient, and never strict. We'll learn the alphabet, real words, and stories from Iran, a few minutes at a time."),
    h("label", {}, "What should I call you?", name),
    h("button", { class: "btn primary", type: "submit" }, "Let's begin 🌿"),
  );
  const dlg = dialog(form);
  form.addEventListener("submit", () => {
    store.update((s) => {
      s.name = name.value.trim();
      s.onboarded = true;
    });
    onDone?.();
  });
  dlg.addEventListener("cancel", () => store.update((s) => (s.onboarded = true)));
  setTimeout(() => name.focus(), 50);
}

export function openPasscode(onDone) {
  const code = h("input", { type: "password", "aria-label": "Household passcode", placeholder: "Passcode" });
  const form = h(
    "form",
    { method: "dialog", class: "onboarding" },
    h("h2", {}, "The garden gate 🔑"),
    h("p", {}, "This garden has a household passcode. Please enter it once — this browser will remember it."),
    code,
    h("button", { class: "btn primary", type: "submit" }, "Open"),
  );
  dialog(form);
  form.addEventListener("submit", () => {
    store.update((s) => (s.passcode = code.value.trim()));
    onDone?.();
  });
}

export function openSettings(onChange) {
  const s = store.get();
  const status = getStatus();
  const name = h("input", { type: "text", maxlength: 40, value: s.name, "aria-label": "Your name" });
  const theme = h("select", { "aria-label": "Theme" }, h("option", { value: "auto" }, "Follow my device"), h("option", { value: "light" }, "Day garden"), h("option", { value: "dark" }, "Night garden"));
  theme.value = s.settings.theme;
  const ambience = h("input", { type: "checkbox" });
  ambience.checked = s.settings.ambience;
  const passcode = status.passcodeRequired ? h("input", { type: "password", value: s.passcode, "aria-label": "Household passcode" }) : null;

  // Shirin's AI: on the server, or with her own key straight from this device.
  const keyInput = h("input", { type: "password", autocomplete: "off", spellcheck: "false", placeholder: "sk-ant-…", value: s.apiKey, "aria-label": "Anthropic API key" });
  const keyMsg = h("p", { class: "small", "aria-live": "polite" });
  const testBtn = h("button", { class: "btn soft small", type: "button" }, "Check key");
  testBtn.addEventListener("click", async () => {
    const key = keyInput.value.trim();
    if (!key) {
      keyMsg.textContent = "Paste a key first.";
      return;
    }
    keyMsg.textContent = "Checking…";
    try {
      await verifyKey(key);
      keyMsg.textContent = "✓ The key works — Shirin is ready. 🌿";
    } catch (err) {
      keyMsg.textContent = err.message;
    }
  });
  const aiSection =
    status.mode === "server"
      ? h("p", {}, "Shirin is awake — this garden's server holds the key. 🌿")
      : h(
          "div",
          { class: "key-box" },
          h(
            "p",
            {},
            "Shirin's conversation and lesson-making use Claude. Paste your own Anthropic API key — it stays on this device and is only sent to Anthropic. Everything else works without it.",
          ),
          h("label", {}, "Anthropic API key", keyInput),
          h("div", { class: "row" }, testBtn),
          keyMsg,
          h("p", { class: "small" }, "Tip: in the Anthropic Console, give the key a small monthly spending limit. Get a key at platform.claude.com."),
        );

  const routes = status.routes;
  const form = h(
    "form",
    { method: "dialog", class: "settings" },
    h("h2", {}, "Settings"),
    h("label", {}, "Your name", name),
    h("label", {}, "Look", theme),
    h("label", { class: "check" }, ambience, " Soft fountain sounds"),
    passcode ? h("label", {}, "Household passcode", passcode) : null,
    h("div", { class: "about" }, h("h3", {}, "Shirin's AI"), aiSection),
    h(
      "div",
      { class: "about" },
      h("h3", {}, "How Shirin thinks"),
      h(
        "ul",
        {},
        h("li", {}, "Preparing lessons: ", h("strong", {}, routes.design.model), ` at ${routes.design.effort === "xhigh" ? "extra-high" : routes.design.effort} effort — she thinks carefully.`),
        h("li", {}, "Talking, role-play & listening: ", h("strong", {}, routes.talk.model), ` at ${routes.talk.effort} effort — quick and natural.`),
      ),
      h("p", {}, "Every built-in word has its own recording, so the garden speaks Persian even on iPhone. 🔊"),
    ),
    h(
      "div",
      { class: "row space" },
      h(
        "button",
        {
          class: "btn ghost danger",
          type: "button",
          onclick: () => {
            if (confirm("Start over? This clears your garden, lessons and chat on this device.")) {
              store.reset();
              location.hash = "#/home";
              location.reload();
            }
          },
        },
        "Start over",
      ),
      h("button", { class: "btn primary", type: "submit" }, "Done"),
    ),
  );
  dialog(form);
  form.addEventListener("submit", () => {
    store.update((st) => {
      st.name = name.value.trim();
      st.settings.theme = theme.value;
      st.settings.ambience = ambience.checked;
      if (passcode) st.passcode = passcode.value.trim();
      if (status.mode !== "server") st.apiKey = keyInput.value.trim();
    });
    refreshKeyStatus();
    applyTheme();
    setAmbience(ambience.checked);
    onChange?.();
  });
}

const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
export const isStandalone = () => window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone === true;

/**
 * On an iPhone, a link tapped inside WhatsApp, Instagram, Gmail and the like
 * opens in that app's own little browser, which cannot add to the Home Screen.
 * Safari and Chrome name themselves in the user agent; those little browsers don't.
 */
export const inOtherAppsBrowser = () => isIOS() && !isStandalone() && !/Safari\/|CriOS|FxiOS|EdgiOS/.test(navigator.userAgent);

/** How to put the garden on the Home Screen, like an app. */
export function installHelp() {
  const steps = isIOS()
    ? [
        ...(inOtherAppsBrowser()
          ? ["You're inside another app's browser. Tap ⋯ or the compass 🧭 and choose “Open in Safari” — then follow these steps there."]
          : []),
        "In Safari, tap the Share button (a square with an arrow ⬆︎). On newer iPhones, tap ⋯ at the bottom first, then Share.",
        "Scroll down and tap “Add to Home Screen”. If you see “Open as Web App”, leave it switched on.",
        "Tap “Add”. A Golestan icon appears on your Home Screen.",
        "From now on, always open Golestan from that icon — your garden and progress live there.",
      ]
    : [
        "Open the browser menu (⋮ or ⋯).",
        "Choose “Install app” or “Add to Home screen”.",
        "Open Golestan from its new icon.",
      ];
  dialog(
    h(
      "form",
      { method: "dialog", class: "onboarding" },
      h("h2", {}, "📲 Golestan on your Home Screen"),
      h("ol", { class: "install-steps" }, steps.map((t) => h("li", {}, t))),
      h("p", { class: "small" }, "Then tap “Save for offline” in More, so everything works on the plane and in Iran without internet."),
      h("button", { class: "btn primary", type: "submit" }, "Got it"),
    ),
  );
}

/** Download every recording and page into the offline cache. */
export async function saveForOffline() {
  const bar = h("span", { style: { width: "0%" } });
  const msg = h("p", { "aria-live": "polite" }, "Gathering the garden…");
  const done = h("button", { class: "btn primary", type: "submit", disabled: true }, "Close");
  dialog(
    h(
      "form",
      { method: "dialog", class: "onboarding" },
      h("h2", {}, "✈️ Saving for offline"),
      h("p", {}, "This keeps every lesson, phrase and recording on this device — for the plane, and for Iran, where the internet can be slow or filtered."),
      h("div", { class: "track-meter big" }, bar),
      msg,
      done,
    ),
  );
  try {
    if (!("caches" in window)) throw new Error("This browser can't save pages for offline use.");
    const index = await (await fetch("audio/index.json")).json();
    const urls = [...(await shellFiles()), ...index.ids.map((id) => `audio/${id}.mp3`)];
    const cache = await caches.open(OFFLINE_CACHE);
    let n = 0;
    for (let i = 0; i < urls.length; i += 8) {
      await Promise.all(
        urls.slice(i, i + 8).map(async (u) => {
          try {
            const res = await fetch(u, { cache: "no-cache" });
            if (res.ok) await cache.put(u, res);
          } catch {
            // skip one file; the rest still save
          }
          n++;
        }),
      );
      bar.style.width = `${Math.round((n / urls.length) * 100)}%`;
      msg.textContent = `${n} of ${urls.length} saved…`;
    }
    msg.textContent = "✓ Saved! Golestan now works without internet on this device. (Shirin's AI chat still needs a connection.)";
  } catch (err) {
    msg.textContent = err.message || "Couldn't save for offline. Please try again with a good connection.";
  } finally {
    done.disabled = false;
  }
}
