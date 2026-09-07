import "dotenv/config";
import { createApp } from "./app.js";

const DEFAULT_PORT = 3000;

function listenPort(): number {
  const raw = process.env.PORT?.trim();
  if (!raw) {
    return DEFAULT_PORT;
  }

  const port = Number(raw);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`PORT must be an integer between 1 and 65535, received: ${raw}`);
  }

  return port;
}

const port = listenPort();
const app = createApp();

app.listen(port, () => {
  console.log(`RepoRadar listening on http://127.0.0.1:${port}`);
  console.log("Health:  GET /health");
  console.log("Webhook: POST /webhooks/github");
});
