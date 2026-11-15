import { createApp } from "./app.ts";
import { PORT, ROUTES, aiConfigured } from "./config.ts";

const app = createApp();
const server = app.listen(PORT, () => {
  console.log(`\n  🌿 Golestan is open: http://localhost:${PORT}\n`);
  console.log(`  Lesson design : ${ROUTES.design.model} (effort ${ROUTES.design.effort})`);
  console.log(`  Live talk     : ${ROUTES.talk.model} (effort ${ROUTES.talk.effort})`);
  if (!aiConfigured()) {
    console.log("\n  ⚠  No ANTHROPIC_API_KEY found. The alphabet, lessons and games work,");
    console.log("     but Shirin can't chat or design lessons until you add a key.\n");
  }
});
// Lesson design at xhigh effort can take a couple of minutes.
server.requestTimeout = 10 * 60 * 1000;
