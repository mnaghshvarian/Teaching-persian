// Writes docs/files.json — the list of app files the service worker keeps
// for offline use (recordings are listed separately in docs/audio/index.json).
//   node scripts/build-files.mjs

import { readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "docs");

/** The app's files, relative to docs/ (recordings excluded). */
export function listFiles() {
const files = ["./"];
function walk(dir) {
  for (const name of readdirSync(dir).sort()) {
    const full = path.join(dir, name);
    const rel = path.relative(root, full).split(path.sep).join("/");
    if (statSync(full).isDirectory()) {
      if (rel === "img") continue; // screenshots for the README
      walk(full);
    } else if (!rel.endsWith(".mp3") && !name.startsWith(".") && rel !== "files.json" && rel !== "sw.js") {
      files.push(rel);
    }
  }
}
walk(root);
return files;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop())) {
  const files = listFiles();
  writeFileSync(path.join(root, "files.json"), JSON.stringify({ files }, null, 1) + "\n");
  console.log(`${files.length} files → docs/files.json`);
}
