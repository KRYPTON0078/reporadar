import crypto from "node:crypto";
import type { Request, Response } from "express";
import {
  createInstallationOctokit,
  triageOpenedItem,
} from "./github.js";

export type GitHubWebhookPayload = {
  action?: string;
  installation?: { id: number };
  repository?: {
    name: string;
    owner?: { login: string };
  };
  issue?: { number: number };
  pull_request?: { number: number };
};

export function verifyGitHubSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  secret: string,
): boolean {
  if (!signatureHeader || !secret) {
    return false;
  }

  const expected =
    "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  const expectedBuf = Buffer.from(expected, "utf8");
  const actualBuf = Buffer.from(signatureHeader, "utf8");

  if (expectedBuf.length !== actualBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

export function getRawBody(req: Request): Buffer {
  if (Buffer.isBuffer(req.body)) {
    return req.body;
  }

  if (typeof req.body === "string") {
    return Buffer.from(req.body, "utf8");
  }

  throw new Error("Webhook body must be the raw Buffer from express.raw()");
}

function getWebhookSecret(): string {
  const secret = process.env.GITHUB_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new Error("GITHUB_WEBHOOK_SECRET is not configured");
  }
  return secret;
}

function targetFromPayload(payload: GitHubWebhookPayload): {
  owner: string;
  repo: string;
  issueNumber: number;
} | null {
  const owner = payload.repository?.owner?.login;
  const repo = payload.repository?.name;
  const issueNumber = payload.issue?.number ?? payload.pull_request?.number;

  if (!owner || !repo || issueNumber === undefined) {
    return null;
  }

  return { owner, repo, issueNumber };
}

export async function handleGitHubWebhook(
  req: Request,
  res: Response,
): Promise<void> {
  let rawBody: Buffer;
  try {
    rawBody = getRawBody(req);
  } catch (error) {
    console.error("github webhook: invalid body", error);
    res.status(400).json({ error: "invalid_body" });
    return;
  }

  let secret: string;
  try {
    secret = getWebhookSecret();
  } catch (error) {
    console.error("github webhook: missing secret", error);
    res.status(500).json({ error: "webhook_secret_not_configured" });
    return;
  }

  const signature = req.header("x-hub-signature-256");
  if (!verifyGitHubSignature(rawBody, signature, secret)) {
    res.status(401).json({ error: "invalid_signature" });
    return;
  }

  const event = req.header("x-github-event") ?? "";
  const delivery = req.header("x-github-delivery") ?? "unknown";

  let payload: GitHubWebhookPayload;
  try {
    payload = JSON.parse(rawBody.toString("utf8")) as GitHubWebhookPayload;
  } catch {
    res.status(400).json({ error: "invalid_json" });
    return;
  }

  if (event === "ping") {
    res.status(200).json({ ok: true, event: "ping", delivery });
    return;
  }

  const shouldTriage =
    (event === "issues" || event === "pull_request") && payload.action === "opened";

  if (!shouldTriage) {
    res.status(200).json({ ok: true, ignored: true, event, action: payload.action, delivery });
    return;
  }

  const installationId = payload.installation?.id;
  if (!installationId) {
    res.status(400).json({ error: "missing_installation" });
    return;
  }

  const target = targetFromPayload(payload);
  if (!target) {
    res.status(400).json({ error: "missing_repository_or_number" });
    return;
  }

  try {
    const octokit = createInstallationOctokit(installationId);
    await triageOpenedItem(octokit, target.owner, target.repo, target.issueNumber);
  } catch (error) {
    console.error("github webhook: triage failed", { delivery, event, error });
    res.status(500).json({ error: "triage_failed" });
    return;
  }

  res.status(200).json({
    ok: true,
    event,
    action: payload.action,
    delivery,
    owner: target.owner,
    repo: target.repo,
    number: target.issueNumber,
  });
}
