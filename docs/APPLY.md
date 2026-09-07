# GitHub Developer Program — paste-ready application

Register here: **https://github.com/developer/register**

Use the blocks below. They match the public product copy for RepoRadar (status: **In development**).

---

## Application / product name

RepoRadar

## Homepage / URL

https://github.com/KRYPTON0078/reporadar

## Support email

support@reporadar.dev

## Short description (one paragraph)

RepoRadar is a GitHub App that helps maintainers triage incoming work. When someone opens an issue or pull request, RepoRadar verifies the webhook, authenticates as the GitHub App installation, ensures a `needs-triage` label exists, applies that label, and posts a short checklist comment so the item is visible in the review queue.

## How we use the GitHub API

RepoRadar integrates with GitHub exclusively as a GitHub App (not with personal access tokens).

1. GitHub sends `issues` and `pull_request` webhooks to `POST /webhooks/github`.
2. RepoRadar verifies `X-Hub-Signature-256` with HMAC-SHA256 and the App webhook secret, then parses the payload.
3. For `action: opened`, it exchanges the installation id for an installation access token via the GitHub App authentication API (`@octokit/auth-app`).
4. It calls the REST API (`@octokit/rest`) to get-or-create the `needs-triage` label, add that label to the issue or pull request, and create a triage checklist comment.

Requested permissions are the minimum needed for that flow: **Issues** read/write, **Pull requests** read/write, and **Metadata** read. Subscribed events are **Issues** and **Pull requests**. The App is public and currently **In development**.

## Longer product description (optional field)

RepoRadar is a small, open-source automation service for repository maintainers. Many projects lose new issues and pull requests in an unlabeled backlog. RepoRadar standardizes the first response: a dedicated `needs-triage` label plus a short checklist the team can complete.

The implementation is a Node.js / TypeScript Express server. Security is based on GitHub’s recommended GitHub App patterns: webhook signature verification on the raw request body, and short-lived installation tokens rather than stored user credentials. Operators can register the App from `app-manifest.yml`, forward local webhooks with smee.io, and install the App on selected repositories.

RepoRadar does not scrape arbitrary repositories, does not request organization administration, and does not store GitHub content beyond what is required to process a webhook in memory. Source code, setup instructions, and the App homepage are at https://github.com/KRYPTON0078/reporadar. Support: support@reporadar.dev.

## Privacy / data handling (if asked)

Webhook payloads are processed in memory to identify the repository, installation, and issue or pull request number. RepoRadar does not persist GitHub issue bodies, comments, or source code to its own database in the current version. GitHub App private keys and webhook secrets are supplied via environment variables and must not be committed to git.

## Checklist before you submit

- [ ] GitHub App created (manifest or manual setup in `docs/github-app-setup.md`)
- [ ] App status set to **In development**
- [ ] Homepage URL is https://github.com/KRYPTON0078/reporadar
- [ ] User support email is support@reporadar.dev
- [ ] This repository is public so reviewers can inspect the GitHub API integration
