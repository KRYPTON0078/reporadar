import express from "express";
import { handleGitHubWebhook } from "./webhook.js";

export function createApp(): express.Express {
  const app = express();

  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      service: "reporadar",
    });
  });

  app.post(
    "/webhooks/github",
    express.raw({ type: "application/json" }),
    (req, res, next) => {
      void handleGitHubWebhook(req, res).catch(next);
    },
  );

  app.use(
    (
      error: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error("unhandled error", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "internal_error" });
      }
    },
  );

  return app;
}
