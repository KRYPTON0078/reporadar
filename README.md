# RepoRadar

RepoRadar is a **minimal GitHub App** that watches for newly opened issues and pull requests, then:

1. Ensures a `needs-triage` label exists on the repository
2. Adds that label to the issue or pull request
3. Posts a short triage checklist comment

**Status:** In development (GitHub App listed as *In development*).

**Homepage:** [https://github.com/KRYPTON0078/reporadar](https://github.com/KRYPTON0078/reporadar)

**Support:** [support@reporadar.dev](mailto:support@reporadar.dev)

## GitHub API integration

RepoRadar is a GitHub App. It does **not** use a personal access token.

Incoming `issues` and `pull_request` webhooks are verified with the `X-Hub-Signature-256` HMAC (`sha256`) using the App webhook secret. After a valid `opened` event, the server authenticates as the **installation** with `@octokit/auth-app` and calls the GitHub REST API through `@octokit/rest` to manage labels and comments (`Issues` and `Pull requests` read/write, `Metadata` read).

Apply to the GitHub Developer Program: [https://github.com/developer/register](https://github.com/developer/register). Paste-ready application text is in [docs/APPLY.md](docs/APPLY.md).

## Local development

### Prerequisites

- Node.js 20+
- A GitHub App (create from [app-manifest.yml](app-manifest.yml) or follow [docs/github-app-setup.md](docs/github-app-setup.md))
- [smee.io](https://smee.io) (or another HTTPS tunnel) so GitHub can reach `POST /webhooks/github` on your machine

### Setup

```bash
git clone https://github.com/KRYPTON0078/reporadar.git
cd reporadar
npm install
cp .env.example .env
```

Fill in `.env` with the App ID, webhook secret, and private key from the GitHub App settings page. Never commit `.env` or `*.pem` files.

```bash
npm run dev
```

In another terminal, forward webhooks (replace the smee URL with yours):

```bash
npx smee-client --url https://smee.io/YOUR_SMEE_CHANNEL --path /webhooks/github --port 3000
```

Install the App on a test repository, then open an issue or pull request. RepoRadar should add `needs-triage` and a checklist comment.

### Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | TypeScript watch mode (`tsx watch`) |
| `npm run build` | Compile to `dist/` (`tsc`) |
| `npm start` | Run the compiled server (`node dist/index.js`) |
| `npm run typecheck` | Typecheck without emitting |
| `npm run smoke` | Start the compiled app in-process and `GET /health` |

`npm run smoke` requires a prior `npm run build`.

### Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Liveness JSON `{ "status": "ok", "service": "reporadar" }` |
| `POST` | `/webhooks/github` | GitHub App webhook (signature required) |

## Security

- Webhook payloads are verified before JSON is trusted.
- GitHub App installation tokens are created per request; no user passwords are stored.
- Keep `GITHUB_PRIVATE_KEY` and `GITHUB_WEBHOOK_SECRET` only in environment variables or a secret manager.

## License

MIT
