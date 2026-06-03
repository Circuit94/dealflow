# DealFlow — AI Deal Sourcing Agent

> Your personal AI analyst that scans the internet 24/7, scores every project against your investment thesis, and delivers a daily brief — so you never miss the next breakout company.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![DeepSeek](https://img.shields.io/badge/LLM-DeepSeek-purple)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-38B2AC?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Table of Contents

- [Why I'm Building This](#why-im-building-this)
- [Current Status](#current-status-pre-validation)
- [The Problem](#the-problem-hypothesis)
- [The Solution](#the-solution)
- [Live Demo & Quick Start](#live-demo--quick-start)
- [Architecture](#architecture)
- [Tech Stack & Design Decisions](#tech-stack--design-decisions)
- [Core Features Deep Dive](#core-features-deep-dive)
- [GTM Strategy & UX Optimization](#gtm-strategy--ux-optimization)
- [Competitive Landscape](#competitive-landscape)
- [Development Journey & Challenges](#development-journey--challenges)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Roadmap](#roadmap)
- [Lessons Learned](#lessons-learned)
- [License](#license)

---

## Why I'm Building This

I'm a 2027 graduate who's been obsessed with the intersection of AI and venture capital. While studying how top investors find deals, I noticed a gap: Tier-1 funds have $25K/year Pitchbook subscriptions and dedicated sourcing teams, but solo angels and micro-fund GPs are still manually scrolling Twitter at midnight hoping to catch the next breakout.

This isn't a "build it and they will come" project. It's a **hypothesis-driven experiment**: can an AI agent replace 10+ hours/week of manual deal sourcing for individual investors? I don't know the answer yet — that's what the [GTM validation report](./GTM.md) is for.

**What makes me qualified to build this?** Honestly, not much yet — I'm not a VC. But I can ship fast (this MVP was built in days with vibe coding), I understand LLM capabilities deeply, and I'm willing to do the unsexy work of cold DMing 50 angels to validate whether this solves a real problem.

---

## Current Status: Pre-Validation

This is an MVP built to test hypotheses, not a production product. Here's what's real and what's not:

| What's Real (code is running) | What's Unvalidated |
|-------------------------------|-------------------|
| AI scoring with feedback flywheel | Whether anyone needs this |
| Daily brief generation | Whether the scoring is accurate enough |
| Multi-source scanning (PH + GitHub) | Whether $99/mo pricing works |
| Feedback → prompt optimization loop | Whether solo angels are the right ICP |
| GTM-optimized landing page with product preview | Whether the conversion funnel works |
| Coach mark onboarding + feedback toast UX | Whether users complete the activation loop |
| i18n (Chinese + English) | Which locale converts better |

**Next step**: Concierge MVP — manually serve 5 investors for 1 week, then ask if they'd pay. See [GTM.md](./GTM.md) for the full plan.

---

## The Problem (Hypothesis)

Top VCs see 1000+ companies per year but invest in fewer than 10. The best deals are found early — before they hit your inbox. Solo angels spend 10+ hours/week manually scanning Product Hunt, Twitter, and GitHub for signals, with 95% noise.

The market timing is compelling: AI has lowered the barrier to starting companies, causing deal volume to explode (YC 2024 received 30,000+ applications). Seed rounds are closing in 3 weeks instead of 6 (Carta data). But individual investors' tooling hasn't kept up.

**But this might be wrong.** Maybe solo angels don't need more deal flow — maybe they need faster evaluation of existing deal flow. That's why we're validating before scaling.

---

## The Solution

DealFlow is an AI-powered deal sourcing agent that:

1. **Scans** Product Hunt, GitHub Trending, and more — 24/7, automatically
2. **Scores** every project against your custom investment thesis using DeepSeek LLM
3. **Delivers** a curated Daily Deal Brief every morning with actionable insights
4. **Learns** from your 👍/👎 feedback to improve recommendations over time (flywheel is live, not roadmap)

---

## Live Demo & Quick Start

```bash
git clone https://github.com/Circuit94/dealflow.git
cd dealflow
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the GTM-optimized landing page, or [/dashboard](http://localhost:3000/dashboard) for the investor workspace with demo data.

To enable AI scoring, configure your DeepSeek API key in Dashboard → API tab (no restart needed). The app works without an API key using realistic demo data that showcases the full experience.

### Vercel Deployment

The project is deployed on Vercel for live validation. Push to `main` triggers automatic production deployment.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 16 App Router)               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │   Landing Page   │  │    Dashboard     │  │   Settings   │  │
│  │  Product Preview │  │  Brief + Deals   │  │  Preferences │  │
│  │  Progressive     │  │  Coach Mark      │  │  + API Config│  │
│  │  Waitlist Form   │  │  Feedback Toast  │  │              │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                    Feedback Flywheel (Live)                       │
│  👍/👎 → deal_feedback table → getFeedbackPatterns()             │
│       → inject into scoring prompt → better scores → repeat      │
├─────────────────────────────────────────────────────────────────┤
│                    Core Engine                                    │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │   Sources    │  │    DeepSeek      │  │     SQLite       │  │
│  │  PH/GitHub   │  │  Scoring + Brief │  │  WAL mode        │  │
│  │  (fallback)  │  │  + Feedback Loop │  │  + Event Track   │  │
│  └──────────────┘  └──────────────────┘  └──────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                    GTM Validation Layer                           │
│  Waitlist Collection · Pricing Survey · Pain Point Clustering    │
│  Self-built Analytics · Hypothesis Tracking · Conversion Events  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack & Design Decisions

| Layer | Technology | Why This Choice |
|-------|-----------|-----------------|
| Framework | Next.js 16 (App Router) | Full-stack in one repo, fast iteration, Vercel deployment |
| Language | TypeScript 5 | Type safety across API boundaries, better refactoring |
| UI | React 19 + Tailwind CSS v4 | Rapid prototyping, zero-config styling |
| LLM | DeepSeek API | Cost-effective ($0.14/1M tokens), strong reasoning, good for structured output |
| Database | SQLite (better-sqlite3, WAL) | Zero-config, portable, perfect for single-user MVP |
| Security | DOMPurify | XSS protection for LLM-generated markdown rendering |
| i18n | Custom React Context + localStorage | Lightweight, no heavy library for 2-locale MVP |
| Data Sources | Product Hunt GraphQL + GitHub Trending | High signal-to-noise for early-stage startups |

### Key Design Principles

**1. Demo-First Experience**: The app works fully without any API key. Realistic demo data (5 deals with scores, verdicts, and actionable next steps) lets visitors experience the product value before committing.

**2. Progressive Disclosure**: Landing page shows product preview → captures email → asks role/pain/pricing (optional) → guides to preference setup. Each step adds value without blocking.

**3. Feedback Flywheel as Core Loop**: Not a roadmap item — the code is running. `getFeedbackPatterns()` extracts category preferences, source preferences, and calibration signals from user feedback, then injects them into the DeepSeek scoring prompt.

**4. Self-Built Analytics**: No PostHog/Mixpanel dependency. Events are stored in SQLite alongside deal data, keeping the stack minimal and the data portable.

**5. Runtime Configuration**: API keys can be set via the Dashboard UI without server restart, using an in-memory config layer that overrides environment variables.

---

## Core Features Deep Dive

### AI Deal Scoring

Each deal is scored 0-100 against the investor's thesis using a structured prompt that includes:
- The investor's stated preferences (sectors, stage, geography, signals)
- Feedback patterns extracted from historical 👍/👎 (activated after 3+ feedbacks)
- Structured output format (score, verdict, one-liner, strengths, risks, suggested action)

Verdicts: `STRONG_MATCH` (80+), `MODERATE_MATCH` (60-79), `PASS` (<60)

### Daily Brief Generation

A markdown-formatted investment brief generated from the day's top-scored deals, structured as:
- Top Picks (highest scores with actionable next steps)
- Worth Watching (moderate matches to monitor)
- Passed (with clear reasoning)

Briefs are persisted and browsable via history navigation.

### Feedback Flywheel

```
User 👍/👎 on deals
       ↓
getFeedbackPatterns() extracts:
  - Category preferences ("likes AI/ML 5/6 times")
  - Source preferences ("PH deals get more 👍")
  - Calibration signals ("user liked 3 deals scored as PASS")
       ↓
Patterns injected into DeepSeek scoring prompt
       ↓
Next batch of scores reflects learned preferences
```

See `src/lib/db.ts#getFeedbackPatterns()` and `src/lib/deepseek.ts#scoreDeal()`.

### Dashboard UX

- **Coach Mark Onboarding**: First-time visitors see a 3-step guide overlay (localStorage-persisted)
- **Feedback Toast**: Visual confirmation when users like/pass on deals ("AI 已记录偏好，未来推荐将更精准")
- **Demo Scan Modal**: In demo mode, clicking "Daily Scan" shows a friendly modal explaining API key requirement instead of a confusing error redirect
- **Brief → Deal Navigation**: Clicking deal names in the brief jumps to the pipeline tab with highlight animation
- **Filter/Sort Pipeline**: By verdict, source, category, with score/date sorting

### Landing Page (GTM-Optimized)

- **Product Preview Before Capture**: Mock browser window showing 3 real-looking deal cards with scores/verdicts
- **Investor-Native Copy**: "别人发 TS 的时候 / 你才刚看到 deal" — uses VC jargon (mark up, TS, DD, check size)
- **Progressive Waitlist**: Email first → optional role/pain/pricing survey → preference setup redirect
- **ROI Framing**: Comparison table with "发现时机" (2-4 weeks before Crunchbase) and explicit ROI row
- **Scarcity Signal**: Real-time waitlist count ("已有 N/100 位投资人加入")

---

## GTM Strategy & UX Optimization

The project underwent a comprehensive GTM UX audit addressing 16 items across 5 categories. See [DEVLOG.md](./DEVLOG.md) for the full development narrative.

### Audit Categories & Key Changes

**Landing Page Conversion (Items #1-5)**:
- Moved from "feature list" to "product preview first" — let users see AI scoring in action before asking for email
- Rewrote all copy from generic SaaS language to investor-native terminology
- Added ROI framing and competitive comparison with explicit time/money savings

**Dashboard UX Gaps (Items #6-9)**:
- Added coach mark for first-time activation guidance
- Implemented feedback toast to close the "did my action register?" loop
- Demo mode scan button now shows explanatory modal instead of error state
- Demo data uses today's date for temporal realism

**Funnel Structure (Items #10-11)**:
- Post-waitlist state now guides users to `/dashboard?tab=settings` for preference setup
- Progressive disclosure form: email → optional survey → skip option

**ICP Language (Items #12-13)**:
- All pain points rewritten with real investor community language
- Comparison table adds "发现时机" and "ROI" dimensions that matter to angels

**Technical Experience (Items #14-16)**:
- Mobile scroll hint for comparison table
- Footer links point to real social URLs
- Waitlist count fetched on mount for social proof

---

## Competitive Landscape

DealFlow sits in a crowded space. Here's an honest look:

| Product | Price | Core Strength | Why They Might Win Over Us |
|---------|-------|---------------|---------------------------|
| Harmonic.ai | ~$15K/yr | AI sourcing + relationship graph + CRM | Data moat, proven paying customers |
| Signal (NFX) | Free | VC social network + deal sharing | Network effects + brand |
| Sourcescrub | ~$12K/yr | Automated sourcing + data cleaning | PE-focused depth |
| Affinity AI | ~$2.4K/yr | Relationship intelligence + pipeline | CRM integration, industry standard |
| Twitter + ChatGPT | ~$20/mo | Manual but flexible | Already "good enough" for many |

**DealFlow's bet**: there's a gap between "free but manual" and "$15K/yr enterprise" that a $99/mo AI-native tool can fill for solo investors. This bet is unvalidated — see [GTM.md](./GTM.md) for the validation plan.

---

## Development Journey & Challenges

This project was built iteratively over 12 commits, evolving from a basic Next.js scaffold to a GTM-ready MVP. See [DEVLOG.md](./DEVLOG.md) for the complete development narrative with technical challenges and solutions.

### Key Technical Challenges Encountered

**1. Next.js 16 Breaking Changes**: This project uses Next.js 16 with the App Router, which has significant differences from earlier versions. Client components require explicit `'use client'` directives, and the new React 19 patterns (like `useFormStatus`) required careful handling of server/client boundaries.

**2. SQLite in Serverless Context**: Using `better-sqlite3` with WAL mode in a Next.js API route context required careful path resolution (`process.cwd()` for the data directory) and ensuring the database file persists across hot reloads in development.

**3. LLM Output Parsing**: DeepSeek's structured output (JSON with scores, arrays of strengths/risks) occasionally returns malformed JSON. The scoring function includes robust parsing with fallbacks and error isolation (`Promise.allSettled` for batch scoring).

**4. i18n Without Heavy Libraries**: Rather than adding `next-intl` or `react-i18next` (overkill for a 2-locale MVP), a custom React Context system was built with localStorage persistence and parameterized template strings.

**5. XSS in LLM-Generated Content**: Daily briefs contain markdown rendered as HTML. Since LLM output is untrusted, DOMPurify sanitization was added to prevent XSS attacks through crafted deal descriptions.

**6. Demo Mode UX**: Creating a seamless demo experience that feels real (not obviously fake) while clearly communicating "this is demo data" required careful balance — solved with a subtle amber banner + realistic data + today's date.

**7. Feedback Flywheel Cold Start**: The scoring improvement loop needs minimum 3 feedbacks to activate. Before that threshold, users see generic scores. The coach mark helps guide users to provide initial feedback.

**8. GTM Landing Page Optimization**: The biggest challenge was writing copy that resonates with investors (not developers). Multiple iterations moved from feature-focused ("AI scans Product Hunt") to outcome-focused ("别人发 TS 的时候你才刚看到 deal") based on real investor community language patterns.

---

## Project Structure

```
dealflow/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # GTM-optimized landing page
│   │   ├── layout.tsx               # Root layout with SEO metadata
│   │   ├── globals.css              # Tailwind v4 imports
│   │   ├── dashboard/
│   │   │   └── page.tsx             # Investor workspace (807 lines)
│   │   └── api/
│   │       ├── brief/route.ts       # GET: fetch brief | POST: generate new
│   │       ├── config/route.ts      # GET: status | PUT: update API config
│   │       ├── deals/route.ts       # GET: list scored | POST: scan + score
│   │       ├── events/route.ts      # POST: track event | GET: stats
│   │       ├── feedback/route.ts    # POST: submit | GET: stats + map
│   │       ├── preferences/route.ts # GET: fetch | PUT: update
│   │       └── waitlist/route.ts    # POST: join | GET: count
│   ├── components/
│   │   ├── ApiConfigForm.tsx        # API key management UI
│   │   ├── BriefSection.tsx         # Markdown brief with deal linking
│   │   ├── DealCard.tsx             # Score circle + expandable details
│   │   ├── FilterBar.tsx            # Pipeline filter/sort controls
│   │   ├── OnboardingStepper.tsx    # 3-step cold start guide
│   │   ├── PreferencesForm.tsx      # Tag-based preference editor
│   │   └── Skeleton.tsx             # Loading state placeholders
│   └── lib/
│       ├── config.ts                # Runtime config (env + UI overrides)
│       ├── db.ts                    # SQLite WAL + feedback pattern extraction
│       ├── deepseek.ts              # LLM scoring + brief generation
│       ├── i18n.tsx                 # Custom i18n (zh/en, React Context)
│       ├── sources.ts               # PH GraphQL + GitHub Trending fetchers
│       └── types.ts                 # Shared TypeScript interfaces
├── data/
│   └── dealflow.db                  # SQLite database (WAL mode)
├── GTM.md                           # Validation report (hypotheses + pivot paths)
├── DEVLOG.md                        # Development journal & technical decisions
├── AGENTS.md                        # AI coding agent instructions
└── package.json                     # Next.js 16 + React 19 + better-sqlite3
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DEEPSEEK_API_KEY` | No* | DeepSeek API key (*can be set via Dashboard UI at runtime) |
| `DEEPSEEK_BASE_URL` | No | API base URL (default: `https://api.deepseek.com`) |
| `DEEPSEEK_MODEL` | No | Model name (default: `deepseek-chat`) |
| `PRODUCTHUNT_API_KEY` | No | Product Hunt API key (falls back to sample data) |
| `DEAL_SCORE_THRESHOLD` | No | Minimum score to include in brief (default: 60) |

---

## Roadmap

### Done (12 commits, pre-validation MVP complete)

- [x] AI deal scoring with DeepSeek (structured output: score/verdict/strengths/risks/action)
- [x] Daily brief generation (markdown, persisted, browsable history)
- [x] Feedback flywheel (👍/👎 → pattern extraction → prompt injection → better scores)
- [x] Multi-source scanning (Product Hunt GraphQL + GitHub Trending)
- [x] Component architecture (7 extracted, reusable components)
- [x] URL-synced tab state (shareable dashboard links)
- [x] Brief → deal information flow (clickable names + highlight animation)
- [x] XSS protection (DOMPurify for LLM-generated content)
- [x] Error isolation (Promise.allSettled for batch operations)
- [x] Waitlist collection with pricing/pain survey (demand validation)
- [x] Self-built event tracking (no external analytics dependency)
- [x] i18n support (Chinese + English, auto-detect + manual toggle)
- [x] GTM-optimized landing page (product preview, investor copy, progressive form)
- [x] Dashboard UX polish (coach mark, feedback toast, demo scan modal)
- [x] Demo mode with realistic data (works without API key)
- [x] Vercel deployment (auto-deploy on push to main)

### Next (validation-gated — only proceed if Concierge MVP succeeds)

- [ ] Concierge MVP: manually serve 5 investors for 1 week
- [ ] Twitter thread campaign → measure signup conversion
- [ ] Cold DM 50 angels → validate ICP and willingness to pay
- [ ] Email/Slack delivery for daily briefs (reduce return friction)
- [ ] Additional data sources (Twitter/X mentions, Crunchbase)

### Only if validated (H2 + H3 + H6 all pass)

- [ ] Multi-user support with authentication
- [ ] Personalized ranking model (beyond prompt injection)
- [ ] Reverse matching (tell founders which investors might be interested)
- [ ] Mobile app / PWA for push notifications

---

## Lessons Learned

**1. Demo-first beats signup-first.** The initial landing page asked for email before showing any product value. Conversion was hypothetically low. After adding a product preview section with mock deal cards, the value proposition becomes immediately tangible.

**2. Investor copy ≠ developer copy.** Early versions used phrases like "AI-powered deal sourcing tool" — generic SaaS language. Rewriting with investor jargon ("别人发 TS 的时候你才刚看到 deal", "mark up", "check size") creates instant recognition and trust.

**3. The feedback flywheel is the moat, not the data.** Competitors have more data sources, but few have a closed-loop learning system that improves with each user interaction. This is the defensible advantage worth validating.

**4. Honest positioning builds trust.** The README and GTM.md explicitly state what's unvalidated. This transparency is intentional — it signals intellectual honesty to potential early adopters who are themselves investors evaluating risk.

**5. SQLite is underrated for MVPs.** Zero-config, WAL mode for concurrent reads, portable (just copy the file), and fast enough for single-user scenarios. No need for Postgres/Supabase at this stage.

**6. Self-built analytics > third-party for validation.** Storing events in the same SQLite database means zero external dependencies, full data ownership, and the ability to query anything without dashboard limitations.

**7. Progressive disclosure reduces form abandonment.** The waitlist form captures email first (low friction), then optionally asks for role/pain/pricing. Users who skip step 2 still join the waitlist — their email alone is valuable for outreach.

---

## License

MIT — see [LICENSE](./LICENSE)

---

## Links

- **Live Demo**: [dealflow on Vercel](https://dealflow.vercel.app) (if deployed)
- **Twitter/X**: [@dealaboratory](https://twitter.com/dealaboratory)
- **GitHub**: [Circuit94/dealflow](https://github.com/Circuit94/dealflow)
- **GTM Validation Report**: [GTM.md](./GTM.md)
- **Development Log**: [DEVLOG.md](./DEVLOG.md)
