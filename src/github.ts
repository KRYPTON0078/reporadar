import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";

export const TRIAGE_LABEL = "needs-triage";
export const TRIAGE_LABEL_COLOR = "FBCA04";
export const TRIAGE_LABEL_DESCRIPTION =
  "Awaiting initial triage by maintainers";

const TRIAGE_COMMENT = `## RepoRadar triage checklist

Thanks for opening this. A maintainer will review it shortly.

- [ ] Understand the request or bug report
- [ ] Confirm labels, type, and affected area
- [ ] Identify an assignee (or mark as help-wanted)
- [ ] Estimate priority and next step

*Posted automatically by [RepoRadar](https://github.com/KRYPTON0078/reporadar).*`;

export type InstallationAuth = {
  appId: number;
  privateKey: string;
  installationId: number;
};

function isOctokitStatus(error: unknown, status: number): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as { status: unknown }).status === status
  );
}

export function readAppCredentials(): { appId: number; privateKey: string } {
  const appIdRaw = process.env.GITHUB_APP_ID?.trim();
  const privateKeyRaw = process.env.GITHUB_PRIVATE_KEY;

  if (!appIdRaw) {
    throw new Error("GITHUB_APP_ID is required to authenticate as a GitHub App");
  }

  const appId = Number(appIdRaw);
  if (!Number.isInteger(appId) || appId <= 0) {
    throw new Error("GITHUB_APP_ID must be a positive integer");
  }

  if (!privateKeyRaw?.trim()) {
    throw new Error("GITHUB_PRIVATE_KEY is required to authenticate as a GitHub App");
  }

  const privateKey = privateKeyRaw.replace(/\\n/g, "\n").trim();
  return { appId, privateKey };
}

export function createInstallationOctokit(
  installationId: number,
  credentials?: { appId: number; privateKey: string },
): Octokit {
  const { appId, privateKey } = credentials ?? readAppCredentials();

  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId,
      privateKey,
      installationId,
    } satisfies InstallationAuth,
    userAgent: "RepoRadar/0.1.0",
  });
}

export async function ensureNeedsTriageLabel(
  octokit: Octokit,
  owner: string,
  repo: string,
): Promise<void> {
  try {
    await octokit.issues.getLabel({
      owner,
      repo,
      name: TRIAGE_LABEL,
    });
    return;
  } catch (error) {
    if (!isOctokitStatus(error, 404)) {
      throw error;
    }
  }

  try {
    await octokit.issues.createLabel({
      owner,
      repo,
      name: TRIAGE_LABEL,
      color: TRIAGE_LABEL_COLOR,
      description: TRIAGE_LABEL_DESCRIPTION,
    });
  } catch (error) {
    // Concurrent webhooks may create the label first.
    if (isOctokitStatus(error, 422)) {
      return;
    }
    throw error;
  }
}

export async function addNeedsTriageLabel(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number,
): Promise<void> {
  await octokit.issues.addLabels({
    owner,
    repo,
    issue_number: issueNumber,
    labels: [TRIAGE_LABEL],
  });
}

export async function postTriageComment(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number,
): Promise<void> {
  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body: TRIAGE_COMMENT,
  });
}

export async function triageOpenedItem(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number,
): Promise<void> {
  await ensureNeedsTriageLabel(octokit, owner, repo);
  await addNeedsTriageLabel(octokit, owner, repo, issueNumber);
  await postTriageComment(octokit, owner, repo, issueNumber);
}
