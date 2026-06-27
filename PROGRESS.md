# Neaven — Project Progress

## What is Neaven

Neaven is an AI SaaS product positioned as **"Your AI Co-founder"** — not an assistant, a co-founder. It fuses business vision keeping with coding supervision and built-in revenue-first analytics. Built for solo and small-team founders who are actively building (especially vibecoding with AI coding agents).

**Core insight**: Business tools (Founders OS) see goals but not code. Coding tools (Greptile, CodeRabbit) see code but not goals. Neaven is the fusion layer that sees both — plus it has its own analytics product built in (inspired by DataFast).

## Product Pillars (v1)

1. **The Brief** — Source of truth from onboarding conversation (what you're building, who for, goals, deadline, tools). Everything else checks against this.
2. **The Watcher** — Coding session supervisor via MCP. Monitors prompts, flags drift from the brief, refines bad prompts, runs agentic loops (prompt → code → test → repeat).
3. **Co-founder** (NOT "manager" — users don't want managers over them) — Slack-like chat interface. Morning briefings, mid-session nudges, end-of-day recaps.
4. **Analytics** — Built-in revenue-first analytics (own product, like DataFast). Users add a script tag to their site + connect Stripe. Revenue attribution per channel, funnels, goals, live visitors, customer journeys.
5. **Agents** — Text-based agent builder. Describe what you want in plain text → Neaven generates the workflow → user can tweak nodes if they want. Per-agent authority settings (full control vs observe-only).
6. **Connectors** — Connect to external tools via MCP, API, OAuth, or iPaaS. Smart suggestions based on the user's stack.

## Tech Stack

- **Framework**: Next.js (App Router) with TypeScript
- **Styling**: Tailwind CSS with custom theme (accent orange #f97316, primary dark navy #0f172a)
- **Charts**: Recharts (interactive charts) + custom SVG (donut chart)
- **Icons**: Lucide React
- **Font**: Inter (via next/font)
- **Location**: `app/` directory inside the repo

## Screens Built (12 routes, all working)

| Route | Screen | Status |
|---|---|---|
| `/` | Landing page | ✅ Complete — hero, app preview, 6 feature cards, how it works, differentiator, testimonials, pricing, CTA, footer |
| `/login` | Login | ✅ Complete — split layout, Google/GitHub OAuth + email/password |
| `/signup` | Sign up | ✅ Complete — same pattern, value props on left |
| `/onboarding` | Onboarding | ✅ Complete — lightweight 3-step flow: name project → connect tools (with smart suggestions) → done |
| `/dashboard` | Dashboard | ✅ Complete — stats, co-founder insights, tasks, activity feed |
| `/brief` | The Brief | ✅ Complete — sections (what/who/goals/timeline/tools), OKRs with progress bars |
| `/watcher` | The Watcher | ✅ Complete — session cards, prompt timeline (drift/refined/approved/loop events) |
| `/cofounder` | Co-founder chat | ✅ Complete — Slack-like chat with morning digest, nudges, action buttons, thumbs up/down |
| `/analytics` | Analytics | ✅ Complete (heavily iterated) — see details below |
| `/agents` | Agents | ✅ Complete — agent list, text-to-workflow creation modal with node editor, authority settings |
| `/connectors` | Connectors | ✅ Complete — connector library with categories, search, "suggested for your stack" banner |
| `/settings` | Settings | ✅ Complete — 6 tabs: profile, notifications, connections, watcher config, billing, security |

## Analytics — Detailed State (most iterated screen)

The analytics page is Neaven's own monitoring product (inspired by DataFast). Key features:

### Clickable metric cards (top bar)
- 7 metrics: Visitors, Revenue, Conversion rate, Revenue/visitor, Bounce rate, Session time, Online
- Clicking any metric switches the main chart to show that metric's data
- Active metric gets accent underline + orange text
- Revenue is the default view (dual-axis: visitors area + revenue bars)

### Rich hover tooltips per metric
- Revenue: visitors (new/returning progress bar), refunds, new revenue, RPV, conversion rate
- Visitors: pageviews, pages/visitor, unique split (new vs returning), returning rate
- Others: value + description

### Interactive data panels (2x2 grid)
- **Traffic sources**: Channel (donut chart) / Referrer / Campaign / Keyword tabs
- **Geography**: Map / Country / Region / City tabs with drill-down
- **Pages**: Hostname / Page / Entry page / Exit link tabs
- **Technology**: Browser / OS / Device tabs

### Panel interactions
- **Sort toggle**: Visitors ↕ / Revenue ↕ per panel — accent styling when revenue sort active
- **Hover tooltip**: Cursor-following card with smooth physics (0.7s cubic-bezier ease, side locked on row enter, position-aware — above for bottom rows, below for top rows, left/right based on panel center)
- **Inline action buttons**: Filter + Go-to (go-to only on referrer/campaign) appear on row right side on hover
- **Cross-filtering**: Click filter → adds filter pill at top, multiple filters stackable, clear all button
- **Max 10 rows** per panel, DETAILS button for full modal with search
- **Detail modals**: Full list with search, 3-column layout (name/visitors/revenue)

### Geo drill-down
- Click a country → it gets selected (highlighted, others dimmed to 40% opacity)
- Only one selection at a time, click again to deselect
- Switch to Region tab → shows only that country's regions (breadcrumb: "Showing regions in France")
- Click a region → select it, switch to City → shows only that region's cities
- 20 regions and 22 cities with proper country/region hierarchy

### Channel donut chart (custom SVG)
- Pure SVG (no Recharts) to avoid label flickering
- Labels outside with connector lines
- Hover: segment expands, others fade to 50%, tooltip in corner with visitors/revenue/top sources
- Blue palette for visitors sort, orange palette for revenue sort
- Dropdown: "All (9.1k)" with channel breakdown

### Other tabs
- **Goals & Funnels**: Signup funnel + purchase funnel with drop-off percentages
- **Journeys**: Customer journey table with visitor info, source, spend, time-to-complete, step dots

## Design Decisions

- **"Co-founder" not "Manager"** — User explicitly said people don't want managers over them. All language changed throughout.
- **Onboarding is lightweight** — Name project → connect tools → done. No heavy questionnaire. The Brief can be filled in later.
- **Analytics is built-in** — Neaven IS the analytics product (like DataFast), not a connector to external analytics. One script tag + Stripe connection.
- **Tool suggestions on onboarding** — After naming the project, immediately show recommended tools to connect (Claude Code, GitHub, Vercel, Supabase, Cursor) so dashboards have data from day one.
- **Revenue-first** — Revenue and revenue/visitor are highlighted metrics, not buried. Every data table shows revenue attribution alongside visitors.
- **Clean light theme** — Notion/ClickUp/Slack inspired. White backgrounds, subtle borders, accent orange, Inter font.

## Analytics — What's Built vs What's Missing (DataFast UX Spec)

Full DataFast UX spec saved as two text files in repo root. This is the definitive reference.

### Built ✅
- [x] KPI row — 7 clickable metric cards switching the main chart
- [x] Main chart — combo area (visitors) + bar (revenue), dual Y-axes
- [x] Rich hover tooltips per metric (revenue shows new/returning/refunds breakdown)
- [x] Sources panel — Channel (donut) / Referrer / Campaign / Keyword tabs
- [x] Geography panel — Country / Region / City tabs with drill-down selection
- [x] Pages panel — Hostname / Page / Entry page / Exit link tabs
- [x] Technology panel — Browser / OS / Device tabs
- [x] Sort toggle (Visitors ↕ / Revenue ↕) per panel
- [x] Hover tooltip with smooth physics (position-aware, side-locked)
- [x] Inline filter + go-to buttons on row hover
- [x] Cross-filtering with filter pills
- [x] Detail modals with search for all panels
- [x] Max 10 rows per panel, DETAILS for full list
- [x] Goals & Funnels tab (basic funnels with drop-off percentages)
- [x] Journey tab (customer journey table)
- [x] Custom SVG donut chart with labels + connector lines
- [x] Channel dropdown filtering within donut
- [x] Geo drill-down (select country → regions filter, select region → cities filter)

### Missing — Analytics Features (from DataFast spec)
- [ ] **User tab** — individual visitor list with pseudonymous names (animal+color), cartoon avatars, device/OS/browser info, goal completion dots, "Load more" pagination
- [ ] **User Detail Panel** — full-screen overlay on user click: event log (visited page, triggered event), expandable parameters table, oldest/newest sort toggle, COPY journey button with toast, activity mini-timeline, left sidebar with device specs
- [ ] **Funnel waterfall/sankey** — tapering shape visualization (not just progress bars), hover tooltip with top sources + top countries per step, step value ($/visitor)
- [ ] **Goal tab multi-line chart** — each goal as colored line, click goal to highlight, goal visibility toggles modal, add goals modal (JS/HTML/API methods)
- [ ] **Map tab** — interactive choropleth world map, hover shows country tooltip, click applies global filter
- [ ] **Real-time 3D globe** — fullscreen view on "Online" click, 3D rotating globe with avatars pinned at locations, left panel with stats, bottom activity feed, toolbar (avatars, share, lofi music player, map view toggle, 8h replay with scrubber, fullscreen)
- [ ] **Social spike markers** — avatar/icon circles on chart data points for social mentions, tooltip shows tweet quotes with "+N more"
- [ ] **Chart period navigation** — ← → arrows on chart edges to pan through time
- [ ] **Google Search Console modal** — for Keyword DETAILS, columns: Search Term / Position (🏅) / Impressions / Visitors / CTR / Revenue (est.)
- [ ] **Exit link tab** — shows "Exits" count alongside Visitors (unique metric)
- [ ] **Floating bottom buttons** — globe icon + lightbulb icon fixed at viewport bottom center
- [ ] **Revenue hover on KPI card** — mini popover on Revenue metric showing Refunds + New breakdown without clicking

### Missing — Non-Analytics Features
- [ ] The Brief — make sections editable inline
- [ ] The Watcher — live coding session integration mockup
- [ ] Agents — make node editor draggable/interactive
- [ ] Mobile responsiveness pass
- [ ] Dark mode toggle
- [ ] Backend/API architecture
- [ ] Authentication (Supabase Auth)
- [ ] Data persistence layer
- [ ] Connect Stripe flow (OAuth/API key setup UI)

## Key Files

- `app/src/app/page.tsx` — Landing page (renders LandingPage component)
- `app/src/components/landing/LandingPage.tsx` — Full landing page with all sections
- `app/src/components/app/AppLayout.tsx` — Shared sidebar + top bar layout for app screens
- `app/src/components/Logo.tsx` — Logo component
- `app/src/components/Button.tsx` — Button component
- `app/src/app/analytics/page.tsx` — Analytics (largest file, most interactive)
- `app/src/app/agents/page.tsx` — Agents with creation modal
- `app/src/app/connectors/page.tsx` — Connector library
- `app/src/app/cofounder/page.tsx` — Co-founder chat
- `app/src/app/dashboard/page.tsx` — Dashboard
- `app/src/app/brief/page.tsx` — The Brief
- `app/src/app/watcher/page.tsx` — The Watcher
- `app/src/app/onboarding/page.tsx` — Onboarding flow
- `app/src/app/settings/page.tsx` — Settings
- `app/src/app/login/page.tsx` — Login
- `app/src/app/signup/page.tsx` — Signup

## User Preferences (Omar)

- Wants clean, professional UI inspired by Notion, ClickUp, Slack, DataFast
- Prefers autonomous execution — don't ask for permissions, just do it
- Wants high interactivity — hover effects, smooth animations, PowerBI-style exploration
- Analytics hover tooltip: smooth physics, position-aware (above/below based on row index, left/right based on panel center), side locked on row enter to prevent flipping
- Filter button in the row (not in tooltip), go-to button only on link-type data (referrer, campaign)
- Country/Region/City uses ISO 2-letter codes, not emoji flags
- Max 10 rows per panel, DETAILS for more
- Revenue always highlighted in accent orange
