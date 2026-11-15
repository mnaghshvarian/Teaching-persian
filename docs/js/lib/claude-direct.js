// Talking to Claude straight from the browser, with the learner's own API key.
// Used when the garden is a static site (GitHub Pages) with no server.
// The key never leaves her device except to go to Anthropic's API.
// Loaded only when needed, together with the bundled official SDK.

import Anthropic from "../../vendor/anthropic-sdk.js";
import {
  chatRequest,
  judgeRequest,
  designRequest,
  parseJudgement,
  parseLesson,
  cleanHistory,
  cleanLearner,
  cleanGuesses,
  friendlyError,
} from "../shared/shirin.js";
import { BY_SPEAK } from "../data/speak.js";
import { ApiError } from "./api.js";

let client = null;
let clientKey = "";

function getClient(apiKey) {
  if (!apiKey) throw new ApiError("Add your Anthropic API key in Settings to wake Shirin. 🌙", "no-key");
  if (!client || clientKey !== apiKey) {
    // Only for testing against a local mock; normally unset.
    let baseURL;
    try {
      baseURL = localStorage.getItem("golestan.apiBase") || undefined;
    } catch {
      baseURL = undefined;
    }
    client = new Anthropic({ apiKey, baseURL, dangerouslyAllowBrowser: true, maxRetries: 2 });
    clientKey = apiKey;
  }
  return client;
}

function gentle(err) {
  if (err instanceof ApiError) return err;
  return new ApiError(friendlyError(err).message, "claude");
}

/** Live chat or role-play (Opus 5.5, medium effort), streamed. */
export async function chatDirect(apiKey, messages, learner, scenarioId, onText, signal) {
  try {
    const history = cleanHistory(messages);
    const scenario = scenarioId ? BY_SPEAK[scenarioId] ?? null : null;
    const stream = getClient(apiKey).beta.messages.stream(chatRequest({ history, learner: cleanLearner(learner), scenario }), { signal });
    stream.on("text", onText);
    const final = await stream.finalMessage();
    if (final.stop_reason === "refusal") onText("\n\nI'm not able to help with that one — shall we go back to the garden? 🌿");
  } catch (err) {
    throw gentle(err);
  }
}

/** Listening to her pronunciation (Opus 5.5, medium effort). */
export async function judgeDirect(apiKey, target, heard, attempt, learner) {
  try {
    const response = await getClient(apiKey).beta.messages.create(
      judgeRequest({ target, guesses: cleanGuesses(heard), attempt, learner: cleanLearner(learner) }),
    );
    return parseJudgement(response, attempt);
  } catch (err) {
    throw gentle(err);
  }
}

/** Designing a lesson (Opus 5.5, xhigh effort), streamed. */
export async function designDirect(apiKey, topic, learner, signal) {
  try {
    const stream = getClient(apiKey).beta.messages.stream(designRequest({ topic, learner: cleanLearner(learner) }), { signal });
    return parseLesson(await stream.finalMessage());
  } catch (err) {
    throw gentle(err);
  }
}

/** Confirms a key works with a model lookup — free, no tokens used. */
export async function verifyKey(apiKey) {
  try {
    await getClient(apiKey).models.retrieve("claude-opus-5-5");
    return true;
  } catch (err) {
    throw gentle(err);
  }
}
