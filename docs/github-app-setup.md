# GitHub App setup

RepoRadar is registered as a GitHub App. This document covers creating the App, required permissions and events, local webhook forwarding with smee.io, and environment variables.

Homepage: https://github.com/KRYPTON0078/reporadar  
Support: support@reporadar.dev  
App status: **In development**

## Permissions

Set these Repository permissions (no extra organization permissions):

| Permission | Access |
| --- | --- |
| **Issues** | Read and write |
| **Pull requests** | Read and write |
| **Metadata** | Read |

Metadata is required for all GitHub Apps. Issues and pull requests write access is used to create the `needs-triage` label, apply it, and post the triage comment. Pull request comments and labels use the Issues API; GitHub still requires the Pull requests permission for PR events.

## Events

Subscribe to:

- **Issues**
- **Pull requests**

RepoRadar handles `issues.opened` and `pull_request.opened`. Other actions (`closed`, `synchronize`, and so on) are acknowledged and ignored. GitHub `ping` events return `200` after signature verification.

## Create the App from the manifest

1. Open GitHub → Settings → Developer settings → GitHub Apps → **New GitHub App**.
2. Or use [Register a GitHub App from a manifest](https://docs.github.com/en/apps/sharing-github-apps/registering-a-github-app-from-a-manifest) with [`app-manifest.yml`](../app-manifest.yml).
3. Replace `https://smee.io/YOUR_SMEE_CHANNEL` with a real webhook URL (see smee.io below, or your deployed HTTPS endpoint).
4. Confirm:
   - GitHub App name: **RepoRadar**
   - Homepage URL: `https://github.com/KRYPTON0078/reporadar`
   - Webhook: enabled
   - **Public** App
   - Default events: `issues`, `pull_request`
   - Default permissions: `issues: write`, `pull_requests: write`, `metadata: read`
5. Create the App, then generate a **private key**. Download the `.pem` file and store it outside the repository.
6. Copy the **App ID** and generate a **webhook secret**. Keep the secret in a password manager.
7. Leave the App listed as **In development** until you are ready for a marketplace or broader listing.

## Create the App manually

If you are not using the manifest:

1. GitHub → Settings → Developer settings → GitHub Apps → **New GitHub App**.
2. GitHub App name: `RepoRadar`.
3. Homepage URL: `https://github.com/KRYPTON0078/reporadar`.
4. Callback URL: not required for webhook-only triage (you may reuse the homepage URL if the form requires one).
5. Uncheck **Expire user authorization tokens** / skip identifying users unless you add OAuth later.
6. Webhook URL: your smee.io channel or production `https://<host>/webhooks/github`.
7. Webhook secret: a long random string; this becomes `GITHUB_WEBHOOK_SECRET`.
8. Permissions and events: tables above.
9. Where can this GitHub App be installed: **Any account** (public App).
10. Create the App, generate a private key, note the App ID.

## smee.io notes (local development)

GitHub will not send webhooks to `http://localhost`. For local work, use [smee.io](https://smee.io):

1. Open https://smee.io and start a new channel. Copy the channel URL (`https://smee.io/<id>`).
2. Set that URL as the GitHub App **Webhook URL** (path is optional; smee receives the POST at the channel URL).
3. Run RepoRadar: `npm run dev` (default port `3000`).
4. Forward events to the local Express route:

   ```bash
   npx smee-client --url https://smee.io/YOUR_SMEE_CHANNEL --path /webhooks/github --port 3000
   ```

   This delivers payloads to `http://127.0.0.1:3000/webhooks/github` and preserves headers, including `X-Hub-Signature-256` and `X-GitHub-Event`.
5. Put the same channel URL in `app-manifest.yml` under `hook_attributes.url` if you recreate the App from the manifest.
6. Do not commit a personal smee channel if you treat it as private; the placeholder `YOUR_SMEE_CHANNEL` is enough for the repo.
7. Production should use a stable HTTPS URL, not smee.io.

Webhook signature verification uses the **raw** JSON body. If a proxy re-serializes JSON, HMAC verification fails with `401 invalid_signature`. smee-client forwards the payload as received; avoid extra JSON pretty-printers in front of the server.

## Environment variables

Copy `.env.example` to `.env`:

| Variable | Source |
| --- | --- |
| `PORT` | Local listen port (default `3000`) |
| `GITHUB_APP_ID` | GitHub App ID (number) |
| `GITHUB_WEBHOOK_SECRET` | Webhook secret from the App settings |
| `GITHUB_PRIVATE_KEY` | Full PEM contents. In a single-line `.env` value, encode newlines as `\n` |

Never commit `.env` or `*.pem` files. `.gitignore` already excludes them.

## Install on a repository

1. GitHub App settings → **Install App** → choose a user or organization → **Only select repositories** → pick a test repo.
2. Open an issue or pull request on that repo.
3. Confirm:
   - Label `needs-triage` exists and is applied
   - A RepoRadar triage checklist comment is posted

If labeling fails, check that the installation includes Issues and Pull requests write, and that the webhook delivery in the App settings shows `200` from `POST /webhooks/github`.
