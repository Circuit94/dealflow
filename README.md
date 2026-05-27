# DealFlow — AI Deal Sourcing Agent

> Your personal AI analyst that scans the internet 24/7, scores every project against your investment thesis, and delivers a daily brief — so you never miss the next breakout company.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![DeepSeek](https://img.shields.io/badge/LLM-DeepSeek-purple)
![License](https://img.shields.io/badge/License-MIT-green)

## The Problem

Top VCs see 1000+ companies per year but invest in fewer than 10. The best deals are found early — before they hit your inbox.

- **10+ hours/week** manually scanning Product Hunt, Twitter, GitHub for signals
- **95% noise** — most of what you see doesn't match your thesis
- **Too late** — by the time a deal reaches you, 3 other funds already have term sheets out

## The Solution

DealFlow is an AI-powered deal sourcing agent that:

1. **Scans** Product Hunt, GitHub Trending, and more — 24/7, automatically
2. **Scores** every project against your custom investment thesis using DeepSeek LLM
3. **Delivers** a curated Daily Deal Brief every morning with actionable insights
4. **Learns** from your 👍/👎 feedback to improve recommendations over time

## Quick Start

```bash
# Clone the repo
git clone https://github.com/your-username/dealflow.git
cd dealflow

# Install dependencies
npm install

# Run development server (works without API key using sample data)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page, or go to [/dashboard](http://localhost:3000/dashboard) for the investor workspace.

To enable AI scoring, configure your DeepSeek API key in the Dashboard → API 配置 tab (no restart needed).

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Landing Page │  │  Dashboard   │  │  Settings    │  │
│  │  Waitlist +  │  │ Brief+Deals  │  │ Preferences  │  │
│  │  GTM/CTA    │  │ + Feedback   │  │ + API Config │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
├─────────────────────────────────────────────────────────┤
│                    API Routes                             │
│  POST /api/deals      → Fetch + Score deals              │
│  GET  /api/deals      → Get scored pipeline              │
│  POST /api/brief      → Generate daily brief             │
│  GET  /api/brief      → Get latest brief                 │
│  GET  /api/preferences → Get investor preferences        │
│  PUT  /api/preferences → Update preferences              │
│  GET  /api/config     → Get API config status            │
│  PUT  /api/config     → Update API key (runtime)         │
│  POST /api/feedback   → Submit deal 👍/👎 (flywheel)     │
│  GET  /api/feedback   → Get feedback stats               │
│  POST /api/waitlist   → Join waitlist (demand validation)│
│  GET  /api/waitlist   → Get waitlist count               │
│  POST /api/events     → Track user events                │
│  GET  /api/events     → Get event counts                 │
├─────────────────────────────────────────────────────────┤
│                    Core Engine                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Sources    │  │  DeepSeek    │  │   SQLite     │  │
│  │  PH/GitHub   │  │  Scoring +   │  │  Persistence │  │
│  │  (fallback)  │  │  Brief Gen   │  │  + Analytics │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 16 (App Router) | Full-stack, fast iteration |
| Language | TypeScript | Type safety, better DX |
| Styling | Tailwind CSS v4 | Rapid UI development |
| LLM | DeepSeek API | Cost-effective ($0.14/1M tokens), strong reasoning |
| Database | SQLite (better-sqlite3) | Zero-config, portable, Vercel-compatible with workaround |
| Data Sources | Product Hunt, GitHub Trending | High signal-to-noise for early-stage |
| Analytics | Self-built (SQLite events table) | Zero-cost, own your data, migrate later |

## GTM Strategy

See [GTM.md](./GTM.md) for the full Go-to-Market one-pager, including:

- **Hypothesis validation board** — every core assumption tagged as 🟢 verified / 🟡 pending / 🔴 unverified
- **ICP definition** — Solo Angel / Micro-fund GP (not Tier-1 VCs)
- **Competitive positioning** — "Morning Brew for investors" (push, not search)
- **Channel priority** — Cold DM first (highest conversion + doubles as user research)
- **Pricing logic** — $99/mo anchored between Crunchbase Pro ($49) and Harmonic ($1,250)

## Demand Validation

The landing page includes a waitlist form that collects:
- Email + Role (ICP validation)
- Pain point (problem validation)
- Price willingness (pricing validation)

All data stored in SQLite for analysis. No third-party form tools needed.

## Product Flywheel

Every deal card in the Dashboard has 👍/👎 buttons. Feedback is stored in `deal_feedback` table and tracked via the events system. This creates the data foundation for:
1. Measuring AI scoring accuracy (H6)
2. Personalizing recommendations per user
3. Building switching cost over time

## Project Structure

```
src/
├── app/
│   ├── page.tsx                 # Landing page (waitlist + GTM narrative)
│   ├── layout.tsx               # Root layout + metadata
│   ├── dashboard/page.tsx       # Investor dashboard (brief + deals + feedback)
│   └── api/
│       ├── deals/route.ts       # Deal fetching + AI scoring
│       ├── brief/route.ts       # Daily brief generation
│       ├── preferences/route.ts # Investor preferences CRUD
│       ├── config/route.ts      # Runtime API key management
│       ├── feedback/route.ts    # Deal 👍/👎 feedback (flywheel)
│       ├── waitlist/route.ts    # Waitlist collection (demand validation)
│       └── events/route.ts      # Event tracking (analytics)
├── lib/
│   ├── deepseek.ts              # DeepSeek API client + scoring logic
│   ├── sources.ts               # Data source fetchers (PH, GitHub)
│   ├── config.ts                # Runtime config management
│   └── db.ts                    # SQLite database layer + analytics
GTM.md                           # Go-to-Market strategy document
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DEEPSEEK_API_KEY` | No* | DeepSeek API key (*can be set via Dashboard UI) |
| `DEEPSEEK_BASE_URL` | No | API base URL (default: `https://api.deepseek.com`) |
| `DEEPSEEK_MODEL` | No | Model name (default: `deepseek-chat`) |
| `PRODUCTHUNT_API_KEY` | No | Product Hunt API key for live data |

*Note: API key can be configured at runtime through the Dashboard → API 配置 tab, no restart needed.*

## Demo Mode

The app includes realistic sample data for Product Hunt and GitHub Trending, so you can demo the full flow without any API keys. Just run `npm run dev` and click "执行每日扫描" in the dashboard.

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (follow prompts)
vercel
```

Note: SQLite requires `nodejs` runtime. For production, consider migrating to Turso (SQLite edge) or Supabase.

## Roadmap

- [x] AI deal scoring with DeepSeek
- [x] Daily brief generation
- [x] Waitlist collection (demand validation)
- [x] Deal feedback flywheel (👍/👎)
- [x] Self-built event tracking
- [x] Runtime API key configuration
- [ ] Deploy to Vercel (get live URL)
- [ ] Twitter/X thread → measure signup conversion
- [ ] Cold DM 50 angels → validate ICP
- [ ] Email/Slack delivery for daily briefs
- [ ] Feedback-driven prompt optimization
- [ ] Multi-user support with authentication

## License

MIT — see [LICENSE](./LICENSE)
