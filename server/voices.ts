// "Family voices": a Persian-speaking family member records how words sound,
// so every word in the app can play in a real, familiar voice.
// Recordings are stored as plain files on the server, so they work on every
// device that opens the app.

import { promises as fs } from "node:fs";
import path from "node:path";

const ID_RE = /^[a-z0-9-]{1,64}$/;
const TYPES: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/aac": "aac",
};

export interface VoiceMeta {
  id: string;
  text: string;
  type: string;
  file: string;
  updatedAt: string;
}

export class VoiceStore {
  readonly dir: string;
  constructor(dir: string) {
    this.dir = dir;
  }

  static validId(id: string): boolean {
    return ID_RE.test(id);
  }

  static baseType(contentType: string | undefined): string | null {
    const base = (contentType ?? "").split(";")[0].trim().toLowerCase();
    return base in TYPES ? base : null;
  }

  private metaPath(id: string): string {
    return path.join(this.dir, `${id}.json`);
  }

  async list(): Promise<VoiceMeta[]> {
    let names: string[];
    try {
      names = await fs.readdir(this.dir);
    } catch {
      return [];
    }
    const metas: VoiceMeta[] = [];
    for (const name of names) {
      if (!name.endsWith(".json")) continue;
      try {
        metas.push(JSON.parse(await fs.readFile(path.join(this.dir, name), "utf8")) as VoiceMeta);
      } catch {
        // ignore a damaged entry
      }
    }
    return metas;
  }

  async get(id: string): Promise<{ meta: VoiceMeta; data: Buffer } | null> {
    if (!VoiceStore.validId(id)) return null;
    try {
      const meta = JSON.parse(await fs.readFile(this.metaPath(id), "utf8")) as VoiceMeta;
      const data = await fs.readFile(path.join(this.dir, path.basename(meta.file)));
      return { meta, data };
    } catch {
      return null;
    }
  }

  async put(id: string, text: string, type: string, data: Buffer): Promise<VoiceMeta> {
    await fs.mkdir(this.dir, { recursive: true });
    await this.remove(id);
    const file = `${id}.${TYPES[type]}`;
    await fs.writeFile(path.join(this.dir, file), data);
    const meta: VoiceMeta = { id, text: text.slice(0, 200), type, file, updatedAt: new Date().toISOString() };
    await fs.writeFile(this.metaPath(id), JSON.stringify(meta));
    return meta;
  }

  async remove(id: string): Promise<boolean> {
    if (!VoiceStore.validId(id)) return false;
    try {
      const meta = JSON.parse(await fs.readFile(this.metaPath(id), "utf8")) as VoiceMeta;
      await fs.rm(path.join(this.dir, path.basename(meta.file)), { force: true });
      await fs.rm(this.metaPath(id), { force: true });
      return true;
    } catch {
      return false;
    }
  }
}
