import { h, fa } from "../lib/dom.js";
import { store } from "../lib/store.js";
import { getStatus } from "../lib/api.js";
import { persianVoiceAvailable } from "../lib/speech.js";
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

  const routes = status.routes;
  const form = h(
    "form",
    { method: "dialog", class: "settings" },
    h("h2", {}, "Settings"),
    h("label", {}, "Your name", name),
    h("label", {}, "Look", theme),
    h("label", { class: "check" }, ambience, " Soft fountain sounds"),
    passcode ? h("label", {}, "Household passcode", passcode) : null,
    h(
      "div",
      { class: "about" },
      h("h3", {}, "About Shirin"),
      routes
        ? h(
            "ul",
            {},
            h("li", {}, "Preparing lessons: ", h("strong", {}, routes.design.model), ` at ${routes.design.effort === "xhigh" ? "extra-high" : routes.design.effort} effort — she thinks carefully.`),
            h("li", {}, "Talking & listening: ", h("strong", {}, routes.talk.model), ` at ${routes.talk.effort} effort — quick and natural.`),
          )
        : h("p", {}, "Can't reach the server right now."),
      h("p", {}, status.ai ? "Shirin is awake. 🌿" : "Shirin is resting — the server has no API key yet."),
      h("p", {}, persianVoiceAvailable() ? "This device has a Persian voice. 🔊" : "This device has no built-in Persian voice — Microsoft Edge has lovely ones, or use Family voices."),
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
    });
    applyTheme();
    setAmbience(ambience.checked);
    onChange?.();
  });
}
