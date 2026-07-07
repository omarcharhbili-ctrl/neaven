# Neaven — Analytics Agent Spec

## Overview

The Analytics agent is one of the main agent's four sub-agents. Its job is watching revenue and web analytics data, and surfacing what actually matters — not raw numbers, but genuine signal.

## What it watches

Revenue and web analytics data sources, connected the same way as other external connections (search, select, authenticate — same pattern as Claude's own connectors). Always live, continuously ingesting.

## When it speaks up

Only on meaningful anomalies — a real spike or crash, not routine day-to-day fluctuation. Example: 0 to 10,000 visitors overnight is worth surfacing; a normal 5% daily wobble is not. The general principle (shared with the Watcher's update pattern): significant, unusual, or actionable events push a summary; routine/expected activity doesn't.

## What "good analysis" means here

Not just detecting that a number moved — interpreting why it might matter and what it could mean, given the founder's actual context (vision, progress, prior conversations). This requires real reasoning depth, not just arithmetic, which is why it's routed to a stronger model than a bare classifier would need.

## Model

Groq-hosted Qwen3.6 27B — the strongest model available on Groq for general reasoning, chosen because interpreting analytics meaningfully needs more depth than a cheap classifier model can reliably provide.

## Reporting to the main agent

Summarized by default, same reporting model as the other sub-agents. The main agent can pull the Analytics agent's full context directly if a founder asks a detailed question about revenue/traffic.

## Dashboard

Feeds the founder-facing dashboard alongside the Watcher's Tips. Visual/structural inspiration for this dashboard: Plausible Analytics' UI (clean, privacy-respecting, no unnecessary chart-junk) — reference only, not a code dependency.

## Out of Scope (v1)

- Predictive forecasting or modeling beyond anomaly detection — not built yet, purely reactive to what's already happened.
- Cross-founder benchmarking ("how do I compare to other Neaven founders") — no data-sharing mechanism exists or is planned for v1.
