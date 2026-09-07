#!/usr/bin/env node
/**
 * Starts the compiled Express app, hits GET /health, and exits.
 * Run `npm run build` first.
 */
import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const appModuleUrl = pathToFileURL(resolve("dist/app.js")).href;

let createApp;
try {
  ({ createApp } = await import(appModuleUrl));
} catch (error) {
  console.error("Failed to load dist/app.js. Run `npm run build` first.");
  console.error(error);
  process.exit(1);
}

const app = createApp();
const server = createServer(app);

await new Promise((resolveListen, rejectListen) => {
  server.listen(0, "127.0.0.1", () => resolveListen());
  server.on("error", rejectListen);
});

const address = server.address();
if (!address || typeof address === "string") {
  console.error("Server did not bind a TCP port");
  process.exit(1);
}

const url = `http://127.0.0.1:${address.port}/health`;

try {
  const response = await fetch(url);
  const body = await response.json();

  if (response.status !== 200 || body.status !== "ok" || body.service !== "reporadar") {
    console.error("Health check failed", { status: response.status, body });
    process.exit(1);
  }

  console.log(`smoke-health: ${url} -> ${response.status} ${JSON.stringify(body)}`);
} finally {
  await new Promise((resolveClose, rejectClose) => {
    server.close((err) => (err ? rejectClose(err) : resolveClose()));
  });
}
