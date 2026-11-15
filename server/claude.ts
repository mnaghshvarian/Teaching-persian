import Anthropic from "@anthropic-ai/sdk";
import { ROUTES } from "./config.ts";
import {
  SHIRIN_CORE,
  TALK_INSTRUCTIONS,
  JUDGE_INSTRUCTIONS,
  DESIGN_INSTRUCTIONS,
} from "./prompts.ts";

// Server-side fallback: if Opus 5.5's safety classifier ever declines a
// (benign) request, the API retries on Anthropic's recommended fallback model
// inside the same call, so Shirin never just goes silent.
const FALLBACK_BETA = "server-side-fallback-2026-07-01";

let client: Anthropic | null = null;
function getClient(): Anthropic {
  // Reads ANTHROPIC_API_KEY (or an `ant auth login` profile) from the environment.
  client ??= new Anthropic();
  return client;
}

// ---------------------------------------------------------------------------
// Learner context — what Shirin knows about her progress. Changes over time, so
// it sits after the cached part of the system prompt.

export interface Learner {
  name: string;
  lessonsDone: string[];
  lettersLearned: string[];
  wordsLearned: string[];
  currentLesson: string;
}

function cleanString(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanList(value: unknown, maxItems: number, maxLen: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => cleanString(v, maxLen))
    .filter(Boolean)
    .slice(-maxItems);
}

export function cleanLearner(raw: unknown): Learner {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    name: cleanString(r.name, 40),
    lessonsDone: cleanList(r.lessonsDone, 40, 80),
    lettersLearned: cleanList(r.lettersLearned, 40, 20),
    wordsLearned: cleanList(r.wordsLearned, 80, 60),
    currentLesson: cleanString(r.currentLesson, 80),
  };
}

function learnerContext(l: Learner): string {
  const lines = ["# About her right now"];
  lines.push(l.name ? `Her name: ${l.name}.` : "She hasn't told you her name yet.");
  lines.push(
    l.lessonsDone.length
      ? `Lessons she has finished: ${l.lessonsDone.join("; ")}.`
      : "She is just starting — no lessons finished yet.",
  );
  if (l.lettersLearned.length) lines.push(`Letters she has met: ${l.lettersLearned.join(" ")}.`);
  if (l.wordsLearned.length) lines.push(`Words she has met: ${l.wordsLearned.join(", ")}.`);
  if (l.currentLesson) lines.push(`She is currently on: ${l.currentLesson}.`);
  return lines.join("\n");
}

function system(task: string, learner: Learner): Anthropic.Beta.BetaTextBlockParam[] {
  return [
    // Stable: persona + task instructions (cached across requests).
    { type: "text", text: `${SHIRIN_CORE}\n\n${task}`, cache_control: { type: "ephemeral" } },
    // Volatile: her progress.
    { type: "text", text: learnerContext(learner) },
  ];
}

function textOf(message: Anthropic.Beta.BetaMessage): string {
  return message.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

export class DeclinedError extends Error {}

// ---------------------------------------------------------------------------
// Live chat — Opus 5.5 at "medium" effort, streamed.

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export function cleanHistory(raw: unknown): ChatTurn[] {
  if (!Array.isArray(raw)) return [];
  const turns: ChatTurn[] = raw
    .filter(
      (m): m is { role: string; content: string } =>
        !!m && typeof m === "object" && typeof m.content === "string" &&
        (m.role === "user" || m.role === "assistant"),
    )
    .map((m) => ({ role: m.role as ChatTurn["role"], content: m.content.trim().slice(0, 4000) }))
    .filter((m) => m.content.length > 0)
    .slice(-30);
  // The API wants the conversation to start with her, not with Shirin's greeting.
  while (turns.length && turns[0].role === "assistant") turns.shift();
  return turns;
}

export async function streamChat(
  history: ChatTurn[],
  learner: Learner,
  onText: (delta: string) => void,
  signal: AbortSignal,
): Promise<{ stopReason: string | null }> {
  const stream = getClient().beta.messages.stream(
    {
      model: ROUTES.talk.model,
      max_tokens: 16000,
      betas: [FALLBACK_BETA],
      fallbacks: "default",
      thinking: { type: "adaptive" },
      output_config: { effort: ROUTES.talk.effort },
      // Also cache the conversation so far, so each new turn is cheap and quick.
      cache_control: { type: "ephemeral" },
      system: system(TALK_INSTRUCTIONS, learner),
      messages: history,
    },
    { signal },
  );
  stream.on("text", onText);
  const final = await stream.finalMessage();
  return { stopReason: final.stop_reason };
}

// ---------------------------------------------------------------------------
// Listening to her pronunciation — Opus 5.5 at "medium" effort.

export interface SpeechGuess {
  text: string;
  confidence: number;
  lang: string;
}

export interface Judgement {
  verdict: "yes" | "almost" | "try_again";
  heard: string;
  message: string;
  tip: string;
}

const JUDGE_SCHEMA = {
  type: "object",
  properties: {
    verdict: { type: "string", enum: ["yes", "almost", "try_again"] },
    heard: { type: "string" },
    message: { type: "string" },
    tip: { type: "string" },
  },
  required: ["verdict", "heard", "message", "tip"],
  additionalProperties: false,
};

export async function judgeSpeech(
  target: { fa: string; translit: string; meaning: string },
  guesses: SpeechGuess[],
  attempt: number,
  learner: Learner,
): Promise<Judgement> {
  const guessLines = guesses.length
    ? guesses
        .map((g, i) => `${i + 1}. "${g.text}" (recognizer language ${g.lang || "unknown"}, confidence ${g.confidence.toFixed(2)})`)
        .join("\n")
    : "(the recognizer returned nothing)";

  const response = await getClient().beta.messages.create({
    model: ROUTES.talk.model,
    max_tokens: 8000,
    betas: [FALLBACK_BETA],
    fallbacks: "default",
    thinking: { type: "adaptive" },
    output_config: {
      effort: ROUTES.talk.effort,
      format: { type: "json_schema", schema: JUDGE_SCHEMA },
    },
    system: system(JUDGE_INSTRUCTIONS, learner),
    messages: [
      {
        role: "user",
        content:
          `Target: ${target.fa} (${target.translit}) — "${target.meaning}"\n` +
          `Attempt number: ${attempt}\n` +
          `What the speech recognizer heard:\n${guessLines}`,
      },
    ],
  });

  if (response.stop_reason === "refusal") throw new DeclinedError("declined");
  const parsed = JSON.parse(textOf(response)) as Partial<Judgement>;
  const verdict = parsed.verdict === "yes" || parsed.verdict === "almost" ? parsed.verdict : "try_again";
  return {
    verdict: attempt >= 3 && verdict === "try_again" ? "almost" : verdict,
    heard: cleanString(parsed.heard, 120),
    message: cleanString(parsed.message, 400) || "Lovely effort! Let's listen once more and try together. 🌿",
    tip: cleanString(parsed.tip, 300),
  };
}

// ---------------------------------------------------------------------------
// Designing a lesson — Opus 5.5 at "xhigh" effort, streamed (it can think for
// a minute or two), with structured output so the lesson player can show it.

const ITEM_SCHEMA = {
  type: "object",
  properties: {
    fa: { type: "string" },
    translit: { type: "string" },
    meaning: { type: "string" },
    note: { type: "string" },
  },
  required: ["fa", "translit", "meaning", "note"],
  additionalProperties: false,
};

const LESSON_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    title_fa: { type: "string" },
    intro: { type: "string" },
    focus_letters: { type: "array", items: { type: "string" } },
    words: { type: "array", items: ITEM_SCHEMA },
    phrases: { type: "array", items: ITEM_SCHEMA },
    story: {
      type: "object",
      properties: {
        title: { type: "string" },
        body: { type: "string" },
        bridge: { type: "string" },
      },
      required: ["title", "body", "bridge"],
      additionalProperties: false,
    },
    quiz: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          options: { type: "array", items: { type: "string" } },
          answer_index: { type: "integer" },
          hint: { type: "string" },
          celebrate: { type: "string" },
        },
        required: ["question", "options", "answer_index", "hint", "celebrate"],
        additionalProperties: false,
      },
    },
    closing: { type: "string" },
  },
  required: ["title", "title_fa", "intro", "focus_letters", "words", "phrases", "story", "quiz", "closing"],
  additionalProperties: false,
};

export interface LessonItem {
  fa: string;
  translit: string;
  meaning: string;
  note: string;
}

export interface DesignedLesson {
  title: string;
  title_fa: string;
  intro: string;
  focus_letters: string[];
  words: LessonItem[];
  phrases: LessonItem[];
  story: { title: string; body: string; bridge: string };
  quiz: { question: string; options: string[]; answer_index: number; hint: string; celebrate: string }[];
  closing: string;
}

function cleanItems(raw: unknown, max: number): LessonItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((it) => {
      const r = (it ?? {}) as Record<string, unknown>;
      return {
        fa: cleanString(r.fa, 120),
        translit: cleanString(r.translit, 160),
        meaning: cleanString(r.meaning, 200),
        note: cleanString(r.note, 300),
      };
    })
    .filter((it) => it.fa && it.meaning)
    .slice(0, max);
}

function cleanLesson(raw: unknown): DesignedLesson {
  const r = (raw ?? {}) as Record<string, unknown>;
  const story = (r.story ?? {}) as Record<string, unknown>;
  const quiz = (Array.isArray(r.quiz) ? r.quiz : [])
    .map((q) => {
      const x = (q ?? {}) as Record<string, unknown>;
      const options = cleanList(x.options, 4, 160);
      const answer = Number(x.answer_index);
      return {
        question: cleanString(x.question, 300),
        options,
        answer_index: Number.isInteger(answer) && answer >= 0 && answer < options.length ? answer : -1,
        hint: cleanString(x.hint, 300),
        celebrate: cleanString(x.celebrate, 200),
      };
    })
    .filter((q) => q.question && q.options.length >= 2 && q.answer_index >= 0)
    .slice(0, 5);
  return {
    title: cleanString(r.title, 100) || "A lesson from Shirin",
    title_fa: cleanString(r.title_fa, 100),
    intro: cleanString(r.intro, 800),
    focus_letters: cleanList(r.focus_letters, 4, 4),
    words: cleanItems(r.words, 10),
    phrases: cleanItems(r.phrases, 6),
    story: {
      title: cleanString(story.title, 120),
      body: cleanString(story.body, 1600),
      bridge: cleanString(story.bridge, 400),
    },
    quiz,
    closing: cleanString(r.closing, 300),
  };
}

export async function designLesson(topic: string, learner: Learner, signal: AbortSignal): Promise<DesignedLesson> {
  const stream = getClient().beta.messages.stream(
    {
      model: ROUTES.design.model,
      max_tokens: 64000,
      betas: [FALLBACK_BETA],
      fallbacks: "default",
      thinking: { type: "adaptive" },
      output_config: {
        effort: ROUTES.design.effort,
        format: { type: "json_schema", schema: LESSON_SCHEMA },
      },
      system: system(DESIGN_INSTRUCTIONS, learner),
      messages: [{ role: "user", content: `Please prepare a lesson for me about: ${topic}` }],
    },
    { signal },
  );
  const final = await stream.finalMessage();
  if (final.stop_reason === "refusal") throw new DeclinedError("declined");
  if (final.stop_reason === "max_tokens") throw new Error("Lesson was cut off before it was finished");
  return cleanLesson(JSON.parse(textOf(final)));
}

export { Anthropic };
