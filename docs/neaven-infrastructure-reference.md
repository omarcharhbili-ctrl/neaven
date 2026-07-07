# Neaven — Infrastructure Reference

This doc exists to give Claude Code (or anyone picking up this project) the real, current state of what's deployed — so it doesn't have to guess, and doesn't conflict with what's already running. This is a living reference, not a spec — update it whenever infrastructure actually changes.

Related specs (architecture/behavior, not infra): `neaven-main-agent-spec.md`, `neaven-watcher-spec.md`, `neaven-llm-implementation-spec.md`.

---

## Production Server

- **Host:** Hetzner VPS (CX23), Ubuntu 24.04 LTS, hostname `neaven-prod`
- **Domain:** neaven.net — DNS/proxy via Cloudflare, SSL handled automatically by Caddy
- **Core stack** (`~/neaven/docker-compose.yml`): Caddy (reverse proxy), Postgres 16, Redis 7 — all in the default Docker network
- **Caddyfile location:** `~/neaven/caddy/Caddyfile`
- Current Caddyfile only serves a placeholder response ("Neaven is coming soon") on the root, plus one active route (see PR-Agent below). The real app isn't deployed here yet.

---

## Shared Docker Network

- **Name:** `neaven_shared`
- **Purpose:** lets Caddy reach other isolated service stacks (PR-Agent, and Activepieces once needed) by container name, without exposing those services' ports publicly.
- Any new backend service that Caddy needs to route to must join this network explicitly in its own `docker-compose.yml`.

---

## PR-Agent (Watcher's code-quality pipeline)

- **What it is:** self-hosted, open-source PR-Agent (`The-PR-Agent/pr-agent` on GitHub), NOT the hosted Qodo product. No dashboard — its only output is comments posted directly on GitHub pull requests.
- **Location on server:** `~/pr-agent/`
- **Built locally from source** (not pulled from a registry) — the `github_app` deployment target isn't published as a prebuilt image, had to `git clone` the repo into `~/pr-agent/source` and `docker build` it ourselves. Image tag: `pr-agent:github_app`.
- **Config:** `~/pr-agent/.secrets.toml` — contains the GitHub App credentials (app_id, webhook_secret, private_key) and the Groq API key. Model in use: `groq/qwen/qwen3.6-27b`.
- **Networking:** container joined to `neaven_shared`. Not bound to any public port itself — reachable only via Caddy.
- **Webhook route:** GitHub → `https://neaven.net/api/v1/github_webhooks` → Caddy → `pr-agent-pr-agent-1:3000` (proxied). Confirmed working (GitHub's `ping` event delivered successfully).
- **Resilience requirement (from Watcher spec discussion):** this must never block the main app. If PR-Agent is down, GitHub webhook deliveries should just fail/retry on GitHub's side — nothing in Neaven's own app should wait on or depend on PR-Agent responding synchronously.

---

## Activepieces (Automation agent's engine)

- **Location on server:** `~/activepieces/`
- **Status:** currently the stock, unmodified pre-built image (`ghcr.io/activepieces/activepieces:latest`), running as its own fully isolated stack — own Postgres, own Redis, own Docker network. **Not currently reachable via Caddy** — bound only to `127.0.0.1` on the server, accessed for testing via SSH tunnel.
- **Telemetry:** explicitly disabled (`AP_TELEMETRY_ENABLED=false`).
- **Decision made: Option 3 (custom auth bridge)** — clone Activepieces' MIT-licensed source, build a custom login bridge (founder authenticates via Clerk, gets silently authenticated into their own Activepieces project — no separate login screen), restyle to match Neaven. Zero recurring cost; real dev work, to be done via Claude Code.
  - Ruled out: paying for the official Embed SDK (~$800+/month, not viable pre-revenue) and giving founders a separate standalone Activepieces account (breaks the single-app experience).
  - **Licensing note:** the Activepieces repo (`activepieces/activepieces`) is mixed-license — the core builder/engine is MIT (freely modifiable), but their official embedding SDK code is under a separate Commercial license. Building a custom auth bridge from scratch (rather than reusing their embedding module) avoids that licensing question entirely.
- **The currently-deployed server instance stays running as-is until a custom version is finalized and ready to replace it** — no reason to tear it down early.

---

## Local Development Environment (laptop)

- **Docker Desktop** installed (Windows, required WSL install + a restart to get working).
- **Dev database stack:** `C:\neaven-dev\docker-compose.yml` — Postgres 16 + Redis 7, mirroring production's setup but fully separate/disposable.
  - Postgres: `postgresql://neaven:devpassword@localhost:5432/neaven_db`
  - Redis: `localhost:6379`
- This is for local app development only — never points at or affects the production database.

---

## Project Repos / Folders (proposed structure, not yet created)

```
C:\neaven-app\
├── web\            ← existing Next.js repo (landing page + future app UI)
├── automation\       ← cloned activepieces/activepieces source, for eventual customization (see open decision above)
├── inspiration\        ← reference-only repos, not built/wired into the app:
│                         - chat interface template (only the chat component is relevant, not the rest of the template)
│                         - Plausible Analytics (dashboard/metrics UI reference)
```

- **PR-Agent does not need to be cloned locally** — it's already built and deployed on the server, and its code isn't being customized (no auth/branding changes needed there).

---

## Known Constraints / Gotchas for Local Testing

- **GitHub webhooks cannot reach `localhost`.** To test real webhook delivery against code running on a laptop, a tunnel tool (e.g. smee.io) is required to forward GitHub's request to the local machine. Not needed for work that doesn't touch the live webhook flow.
- **Server is Linux, laptop is Windows** — Docker networking/permissions can occasionally behave slightly differently between the two; don't assume 100% identical behavior without checking post-deploy.
- **No automatic local-to-server sync.** Deploying anything built/tested locally requires an explicit deploy step (intended: GitHub Actions), not manual copying.
- **Avoid running two diverging versions long-term** — if a customized Activepieces (or anything else) is built locally, the original server instance should be replaced, not left running alongside it indefinitely.
