// Family voice recordings kept on this device (IndexedDB), for the static
// GitHub Pages version where there is no server to hold them.

const DB = "golestan-voices";
const STORE = "voices";

function open() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) return reject(new Error("no-indexeddb"));
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const result = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(result?.result ?? result);
    t.onerror = () => reject(t.error);
  });
}

export async function list() {
  try {
    const all = await tx("readonly", (s) => s.getAll());
    return (all ?? []).map(({ id, text, updatedAt }) => ({ id, text, updatedAt }));
  } catch {
    return [];
  }
}

export async function get(id) {
  try {
    const row = await tx("readonly", (s) => s.get(id));
    return row?.blob ?? null;
  } catch {
    return null;
  }
}

export async function put(id, text, blob) {
  const updatedAt = new Date().toISOString();
  await tx("readwrite", (s) => s.put({ id, text, blob, updatedAt }));
  return { id, text, updatedAt };
}

export async function remove(id) {
  await tx("readwrite", (s) => s.delete(id));
}
