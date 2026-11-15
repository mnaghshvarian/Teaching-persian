import express from "express";
import type { Request, Response, NextFunction } from "express";
import path from "node:path";
import { timingSafeEqual } from "node:crypto";
import { fileURLToPath } from "node:url";
import { ROUTES, APP_PASSCODE, FAMILY_PIN, aiConfigured } from "./config.ts";
import Anthropic from "@anthropic-ai/sdk";
import { streamChat, judgeSpeech, designLesson } from "./claude.ts";
import { DeclinedError, cleanHistory, cleanLearner, cleanGuesses } from "../docs/js/shared/shirin.js";
import { VoiceStore } from "./voices.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(here, "..", "docs");

function sameSecret(given: unknown, expected: string): boolean {
  if (typeof given !== "string") return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Turn API errors into gentle, useful messages for the page.
export function friendlyError(err: unknown): { status: number; message: string } {
  if (err instanceof DeclinedError) {
    return { status: 422, message: "Shirin couldn't answer that one. Shall we try it a different way? 🌿" };
  }
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
    return { status: 401, message: "Shirin can't reach Claude — the API key seems to be missing or wrong." };
  }
  if (err instanceof Anthropic.RateLimitError) {
    return { status: 429, message: "Shirin needs a short breather. Please try again in a minute. 🍵" };
  }
  if (err instanceof Anthropic.APIUserAbortError) {
    return { status: 499, message: "Stopped." };
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return { status: 502, message: "Couldn't reach Claude — please check the internet connection." };
  }
  if (err instanceof Anthropic.APIError) {
    return { status: 502, message: `Claude had a hiccup (${err.status ?? "error"}). Please try again.` };
  }
  if (err instanceof SyntaxError) {
    return { status: 502, message: "Shirin's answer got a little tangled. Please try again." };
  }
  console.error(err);
  return { status: 500, message: "Something went wrong. Please try again." };
}

function startEvents(res: Response) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  return (event: Record<string, unknown>) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };
}

export function createApp(options: { voiceDir?: string } = {}) {
  const voices = new VoiceStore(options.voiceDir ?? process.env.VOICE_DIR ?? path.join(here, "..", "data", "voices"));
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "64kb" }));

  // --- status (always open, so the page knows whether to ask for a passcode)
  app.get("/api/status", (_req, res) => {
    res.json({
      ai: aiConfigured(),
      passcodeRequired: Boolean(APP_PASSCODE),
      familyPinRequired: Boolean(FAMILY_PIN),
      routes: ROUTES,
    });
  });

  // --- optional household passcode for everything else under /api
  app.use("/api", (req: Request, res: Response, next: NextFunction) => {
    if (!APP_PASSCODE || sameSecret(req.get("x-app-passcode"), APP_PASSCODE)) return next();
    res.status(401).json({ error: "passcode", message: "Please enter the household passcode." });
  });

  function requireAi(res: Response): boolean {
    if (aiConfigured()) return true;
    res.status(503).json({
      error: "no-ai",
      message: "Shirin is resting — add an ANTHROPIC_API_KEY to the server to wake her up.",
    });
    return false;
  }

  // --- live chat (Opus 5.5, medium effort), streamed as server-sent events
  app.post("/api/chat", async (req, res) => {
    if (!requireAi(res)) return;
    const history = cleanHistory(req.body?.messages);
    if (!history.length || history[history.length - 1].role !== "user") {
      res.status(400).json({ error: "bad-request", message: "Say something to Shirin first. 🌸" });
      return;
    }
    const learner = cleanLearner(req.body?.learner);
    const send = startEvents(res);
    const abort = new AbortController();
    res.on("close", () => abort.abort());
    try {
      const scenario = typeof req.body?.scenario === "string" ? req.body.scenario.slice(0, 20) : null;
      const { stopReason } = await streamChat(history, learner, scenario, (text) => send({ type: "text", text }), abort.signal);
      if (stopReason === "refusal") {
        send({ type: "text", text: "\n\nI'm not able to help with that one — shall we go back to the garden? 🌿" });
      }
      send({ type: "done" });
    } catch (err) {
      if (!abort.signal.aborted) send({ type: "error", message: friendlyError(err).message });
    } finally {
      res.end();
    }
  });

  // --- pronunciation listening (Opus 5.5, medium effort)
  app.post("/api/judge", async (req, res) => {
    if (!requireAi(res)) return;
    const t = req.body?.target ?? {};
    const target = {
      fa: String(t.fa ?? "").slice(0, 120),
      translit: String(t.translit ?? "").slice(0, 160),
      meaning: String(t.meaning ?? "").slice(0, 200),
    };
    if (!target.fa) {
      res.status(400).json({ error: "bad-request", message: "Missing the word to practise." });
      return;
    }
    const guesses = cleanGuesses(req.body?.heard);
    const attempt = Math.max(1, Math.min(10, Number(req.body?.attempt) || 1));
    try {
      res.json(await judgeSpeech(target, guesses, attempt, cleanLearner(req.body?.learner)));
    } catch (err) {
      const { status, message } = friendlyError(err);
      res.status(status).json({ error: "judge", message });
    }
  });

  // --- lesson design (Opus 5.5, xhigh effort), streamed with keep-alive pings
  app.post("/api/lesson", async (req, res) => {
    if (!requireAi(res)) return;
    const topic = String(req.body?.topic ?? "").trim().slice(0, 300);
    if (!topic) {
      res.status(400).json({ error: "bad-request", message: "What would you like the lesson to be about?" });
      return;
    }
    const send = startEvents(res);
    const abort = new AbortController();
    res.on("close", () => abort.abort());
    const ping = setInterval(() => send({ type: "thinking" }), 10_000);
    try {
      const lesson = await designLesson(topic, cleanLearner(req.body?.learner), abort.signal);
      send({ type: "lesson", lesson, route: ROUTES.design });
    } catch (err) {
      if (!abort.signal.aborted) send({ type: "error", message: friendlyError(err).message });
    } finally {
      clearInterval(ping);
      res.end();
    }
  });

  // --- family voices
  app.get("/api/voices", async (_req, res) => {
    const list = await voices.list();
    res.json({ voices: list.map(({ id, text, updatedAt }) => ({ id, text, updatedAt })) });
  });

  app.get("/api/voices/:id", async (req, res) => {
    const found = await voices.get(req.params.id);
    if (!found) {
      res.status(404).json({ error: "not-found" });
      return;
    }
    res.set("Content-Type", found.meta.type);
    res.set("Cache-Control", "no-cache");
    res.send(found.data);
  });

  function requirePin(req: Request, res: Response): boolean {
    if (!FAMILY_PIN || sameSecret(req.get("x-family-pin"), FAMILY_PIN)) return true;
    res.status(403).json({ error: "pin", message: "Please enter the family PIN to record." });
    return false;
  }

  app.put(
    "/api/voices/:id",
    express.raw({ type: ["audio/*", "application/octet-stream"], limit: "3mb" }),
    async (req, res) => {
      if (!requirePin(req, res)) return;
      const id = req.params.id as string;
      const type = VoiceStore.baseType(req.get("content-type"));
      if (!VoiceStore.validId(id) || !type || !Buffer.isBuffer(req.body) || req.body.length < 100) {
        res.status(400).json({ error: "bad-request", message: "That recording didn't come through. Try once more?" });
        return;
      }
      let text = "";
      try {
        text = decodeURIComponent(req.get("x-voice-text") ?? "");
      } catch {
        text = "";
      }
      const meta = await voices.put(id, text, type, req.body);
      res.json({ id: meta.id, text: meta.text, updatedAt: meta.updatedAt });
    },
  );

  app.delete("/api/voices/:id", async (req, res) => {
    if (!requirePin(req, res)) return;
    const ok = await voices.remove(req.params.id);
    res.status(ok ? 200 : 404).json({ ok });
  });

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "not-found" });
  });

  // --- the garden itself
  app.use(express.static(PUBLIC_DIR, { extensions: ["html"] }));

  return app;
}
