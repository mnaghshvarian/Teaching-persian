// Her progress lives in this browser. Every read and write is guarded so the
// app still works in a private window or if storage is blocked.

const KEY = "golestan.v1";

const DEFAULTS = {
  name: "",
  onboarded: false,
  lessonsDone: [],
  lettersSeen: [],
  wordsSeen: [],
  customLessons: [],
  chat: [],
  settings: {
    micLang: "en-US", // what the Talk mic listens for: "en-US" (English & Persian mix) or "fa-IR"
    speakReplies: false,
    theme: "auto",
    ambience: false,
  },
  passcode: "",
  familyPin: "",
};

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULTS);
    const parsed = JSON.parse(raw);
    return { ...structuredClone(DEFAULTS), ...parsed, settings: { ...DEFAULTS.settings, ...(parsed.settings ?? {}) } };
  } catch {
    return structuredClone(DEFAULTS);
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage unavailable — keep going in memory
  }
  for (const fn of listeners) fn(state);
}

export const store = {
  get: () => state,
  update(fn) {
    fn(state);
    save();
  },
  onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  addUnique(listName, items) {
    store.update((s) => {
      const set = new Set(s[listName]);
      for (const it of items) if (it) set.add(it);
      s[listName] = [...set];
    });
  },
  reset() {
    state = structuredClone(DEFAULTS);
    save();
  },
};
