// Offline support: the service worker keeps the garden on the device, so it
// works on the plane and in Iran (where Shirin's AI isn't reachable, but every
// lesson, phrase and recording is).

export const OFFLINE_CACHE = "golestan-offline";

/** Every file of the app (written by scripts/build-files.mjs). */
export async function shellFiles() {
  const res = await fetch("files.json", { cache: "no-cache" });
  return (await res.json()).files;
}

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (location.protocol !== "https:" && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      // offline support is a bonus; the garden works without it
    });
  });
}
