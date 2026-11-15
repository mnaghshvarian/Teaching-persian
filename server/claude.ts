// The optional server's link to Claude. All of Shirin's prompts, request
// shapes and answer parsing live in the shared module, so the server and the
// browser-only (GitHub Pages) version behave exactly the same.

import Anthropic from "@anthropic-ai/sdk";
import { ROUTES } from "./config.ts";
import {
  chatRequest,
  judgeRequest,
  designRequest,
  parseJudgement,
  parseLesson,
} from "../docs/js/shared/shirin.js";
import type { ChatTurn, Learner, SpeechGuess } from "../docs/js/shared/shirin.js";
import { BY_SPEAK } from "../docs/js/data/speak.js";

let client: Anthropic | null = null;
function getClient(): Anthropic {
  // Reads ANTHROPIC_API_KEY (or an `ant auth login` profile) from the environment.
  client ??= new Anthropic();
  return client;
}

/** Live chat or role-play (Opus 5.5, medium effort), streamed piece by piece. */
export async function streamChat(
  history: ChatTurn[],
  learner: Learner,
  scenarioId: string | null,
  onText: (delta: string) => void,
  signal: AbortSignal,
): Promise<{ stopReason: string | null }> {
  const scenario = scenarioId ? (BY_SPEAK as Record<string, (typeof BY_SPEAK)[string]>)[scenarioId] ?? null : null;
  const stream = getClient().beta.messages.stream(chatRequest({ history, learner, route: ROUTES.talk, scenario }), { signal });
  stream.on("text", onText);
  const final = await stream.finalMessage();
  return { stopReason: final.stop_reason };
}

/** Listening to her pronunciation (Opus 5.5, medium effort). */
export async function judgeSpeech(
  target: { fa: string; translit: string; meaning: string },
  guesses: SpeechGuess[],
  attempt: number,
  learner: Learner,
) {
  const response = await getClient().beta.messages.create(judgeRequest({ target, guesses, attempt, learner, route: ROUTES.talk }));
  return parseJudgement(response, attempt);
}

/** Designing a lesson (Opus 5.5, xhigh effort), streamed because it thinks for a while. */
export async function designLesson(topic: string, learner: Learner, signal: AbortSignal) {
  const stream = getClient().beta.messages.stream(designRequest({ topic, learner, route: ROUTES.design }), { signal });
  return parseLesson(await stream.finalMessage());
}
