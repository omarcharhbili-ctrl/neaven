# Neaven — Infrastructure Reference

This doc exists to give Claude Code (or anyone picking up this project) the real, current state of what's deployed — so it doesn't have to guess, and doesn't conflict with what's already running. This is a living reference, not a spec — update it whenever infrastructure actually changes.

Related specs (architecture/behavior, not infra): `neaven-main-agent-spec.md`, `neaven-watcher-spec.md`, `neaven-llm-implementation-spec.md`.

---

## Production Server

- **Host:** Hetzner VPS (CX23), Ubuntu 24.04 LTS, hostname `neaven-prod`
- **Domain:** neaven.net — DNS/proxy via Cloudflare, SSL handled automatically by Caddy
- **Core stack** (`~/neaven/docker-compose.yml`): Caddy (reverse proxy), Postgres 16, Redis 7 — all in the default Docker network
- **Caddyfile location:** `~/neaven/caddy/Caddyfile` (a `.bak` sits next to it from the last edit)
- Routes: `neaven.net`/`www` → `neaven-web:3000` (plus the PR-Agent webhook route below), and `automations.neaven.net` → `neaven-automation-engine:80` with the engine's `sign-up`/`sign-in` API answering 404 publicly (only the Neaven app reaches those, server-to-server).

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

## Automation engine (Neaven-branded Activepieces) — DEPLOYED 2026-07-17

- **Location on server:** `~/neaven-automation/` (compose + `bridge/embed-bridge.html` + LF entrypoint; tracked in the repo as `automation-engine/docker-compose.prod.yml`)
- **Image:** `neaven-automation:dev` — built locally from the MIT core with Neaven branding baked in at source (`automation-engine/neaven-branding.patch`), transferred via `docker save | ssh | docker load` (the CX23 is too small to build it from source).
- **Stack:** own Postgres 16 + Redis 7 on its own network; the engine container also joins `neaven_shared` so Caddy routes `automations.neaven.net` to it. Loopback `127.0.0.1:8081` kept for SSH-tunnel debugging.
- **Secrets:** `~/neaven-automation/.env` (chmod 600) — `AP_ENCRYPTION_KEY`, `AP_JWT_SECRET`, `AP_POSTGRES_PASSWORD`, generated at setup, never in git.
- **Platform:** created via the onboarding API and owned by a seeded `admin@neaven.net` account; its credentials live in `~/neaven-automation/.admin-credentials` (chmod 600). Founders are provisioned as platform MEMBERs with their own project by the silent-auth bridge (`app/src/app/api/automation/bridge/route.ts`): Clerk session → per-founder engine account (random server-side password in the `connections` table) → silent sign-in → token handed to the iframe via URL fragment through the same-origin `embed-bridge.html`.
- **Security posture:** `AP_ALLOW_OPEN_SIGN_UP=true` is required for provisioning, but Caddy answers 404 for `/api/v1/authentication/sign-up|sign-in` publicly — the bridge calls them over `neaven_shared` (`ACTIVEPIECES_INTERNAL_URL=http://neaven-automation-engine`), so the world cannot self-register. `AP_ALLOWED_EMBED_ORIGINS=https://neaven.net,https://www.neaven.net` sets the CSP `frame-ancestors` so only Neaven may iframe the builder.
- **Telemetry:** disabled.
- **DNS:** `automations.neaven.net` must exist in Cloudflare (A → 167.233.167.41, same proxy setting as the root). Caddy auto-issues the cert once the record resolves; it retries on its own.
- The old stock stack (`~/activepieces/`, `ghcr.io/activepieces/activepieces:latest`) was torn down the same day — its volumes (`activepieces_ap_postgres_data`, throwaway test data) were left in place and can be pruned.
- **Licensing note:** only the MIT core is used; the auth bridge is custom-built and does not touch the commercially-licensed embed SDK.

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
