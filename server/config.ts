// Model routing for Shirin.
//
// Two jobs, two settings — both on Claude Opus 5.5:
//   • "design" — preparing lessons and teaching material. Runs at effort "xhigh"
//     so Shirin thinks carefully about spelling, pronunciation, history and
//     how to pace things for a beginner.
//   • "talk"   — live conversation and listening to pronunciation. Runs at
//     effort "medium" so replies come back quickly and the chat feels natural.
//
// Override with environment variables if you ever want to experiment:
//   DESIGN_MODEL, DESIGN_EFFORT, TALK_MODEL, TALK_EFFORT

export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

const EFFORTS: readonly Effort[] = ["low", "medium", "high", "xhigh", "max"];

function effortFrom(value: string | undefined, fallback: Effort): Effort {
  if (!value) return fallback;
  const v = value.trim().toLowerCase();
  if ((EFFORTS as readonly string[]).includes(v)) return v as Effort;
  console.warn(`Ignoring unknown effort "${value}", using "${fallback}".`);
  return fallback;
}

export interface Route {
  model: string;
  effort: Effort;
}

export const ROUTES: { design: Route; talk: Route } = {
  design: {
    model: process.env.DESIGN_MODEL?.trim() || "claude-opus-5-5",
    effort: effortFrom(process.env.DESIGN_EFFORT, "xhigh"),
  },
  talk: {
    model: process.env.TALK_MODEL?.trim() || "claude-opus-5-5",
    effort: effortFrom(process.env.TALK_EFFORT, "medium"),
  },
};

export const PORT = Number(process.env.PORT) || 3000;

// Optional: set APP_PASSCODE if you put the app on the internet, so only your
// household can use your API key. The browser asks for it once.
export const APP_PASSCODE = process.env.APP_PASSCODE?.trim() || "";

// Optional: set FAMILY_PIN so only the family member recording voices can
// add or delete recordings. Listening never needs the PIN.
export const FAMILY_PIN = process.env.FAMILY_PIN?.trim() || "";

export function aiConfigured(): boolean {
  return Boolean(
    process.env.ANTHROPIC_API_KEY ||
      process.env.ANTHROPIC_AUTH_TOKEN ||
      process.env.ANTHROPIC_PROFILE,
  );
}
