# DealFlow — AI Deal Sourcing Agent

> Your personal AI analyst that scans the internet 24/7, scores every project against your investment thesis, and delivers a daily brief — so you never miss the next breakout company.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![DeepSeek](https://img.shields.io/badge/LLM-DeepSeek-purple)
![License](https://img.shields.io/badge/License-MIT-green)

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

**Next step**: Concierge MVP — manually serve 5 investors for 1 week, then ask if they'd pay. See [GTM.md](./GTM.md) for the full plan.

---

## The Problem (Hypothesis)

Top VCs see 1000+ companies per year but invest in fewer than 10. The best deals are found early — before they hit your inbox. Solo angels spend 10+ hours/week manually scanning Product Hunt, Twitter, and GitHub for signals, with 95% noise.

**But this might be wrong.** Maybe solo angels don't need more deal flow — maybe they need faster evaluation of existing deal flow. That's why we're validating before scaling.

---

## The Solution

DealFlow is an AI-powered deal sourcing agent that:

1. **Scans** Product Hunt, GitHub Trending, and more — 24/7, automatically
2. **Scores** every project against your custom investment thesis using DeepSeek LLM
3. **Delivers** a curated Daily Deal Brief every morning with actionable insights
4. **Learns** from your 👍/👎 feedback to improve recommendations over time (flywheel is live, not roadmap)

---

## Quick Start

```bash
git clone https://github.com/your-username/dealflow.git
cd dealflow
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page, or [/dashboard](http://localhost:3000/dashboard) for the investor workspace.

To enable AI scoring, configure your DeepSeek API key in Dashboard → API 配置 tab (no restart needed). The app works without an API key using realistic sample data.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 16)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Landing Page │  │  Dashboard   │  │  Settings    │  │
│  │  Waitlist +  │  │ Brief+Deals  │  │ Preferences  │  │
│  │  Validation  │  │ + Feedback   │  │ + API Config │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
├─────────────────────────────────────────────────────────┤
│                    Feedback Flywheel                      │
│  👍/👎 → deal_feedback table → getFeedbackPatterns()     │
│       → inject into scoring prompt → better scores       │
├─────────────────────────────────────────────────────────┤
│                    Core Engine                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Sources    │  │  DeepSeek    │  │   SQLite     │  │
│  │  PH/GitHub   │  │  Scoring +   │  │  WAL mode    │  │
│  │  (fallback)  │  │  Brief Gen   │  │  + Analytics │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 16 (App Router) | Full-stack, fast iteration |
| Language | TypeScript | Type safety, better DX |
| Styling | Tailwind CSS v4 | Rapid UI development |
| LLM | DeepSeek API | Cost-effective ($0.14/1M tokens), strong reasoning |
| Database | SQLite (better-sqlite3, WAL) | Zero-config, portable |
| Security | DOMPurify | XSS protection for markdown rendering |
| Data Sources | Product Hunt, GitHub Trending | High signal-to-noise for early-stage |

---

## Competitive Landscape

DealFlow sits in a crowded space. Here's an honest look:

| Product | Price | Why they might win |
|---------|-------|-------------------|
| Harmonic.ai | ~$15K/yr | Data moat + CRM integration |
| Signal (NFX) | Free | Network effects + brand |
| Sourcescrub | ~$12K/yr | PE-focused data depth |
| Affinity AI | ~$2.4K/yr | Relationship intelligence |
| Twitter + ChatGPT | ~$20/mo | Already "good enough" for many |

**DealFlow's bet**: there's a gap between "free but manual" and "$15K/yr enterprise" that a $99/mo AI-native tool can fill for solo investors. This bet is unvalidated.

---

## Feedback Flywheel (Live)

The scoring system learns from user feedback in real-time:

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

This isn't a roadmap item — the code is running. See `src/lib/db.ts#getFeedbackPatterns()` and `src/lib/deepseek.ts#scoreDeal()`.

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                 # Landing page (waitlist + narrative)
│   ├── dashboard/page.tsx       # Investor dashboard (orchestrator)
│   └── api/                     # REST endpoints
├── components/
│   ├── DealCard.tsx             # Accordion + score + feedback
│   ├── BriefSection.tsx         # Sanitized markdown + deal linking
│   ├── FilterBar.tsx            # Verdict/source filter + sort
│   ├── OnboardingStepper.tsx    # Cold start guide
│   ├── PreferencesForm.tsx      # Tag input + toast
│   ├── ApiConfigForm.tsx        # API key management
│   └── Skeleton.tsx             # Loading states
├── lib/
│   ├── types.ts                 # Shared type definitions
│   ├── deepseek.ts              # LLM client + scoring (with feedback loop)
│   ├── sources.ts               # Data source fetchers
│   ├── config.ts                # Runtime config
│   └── db.ts                    # SQLite + feedback patterns
GTM.md                           # Validation report (not a plan)
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DEEPSEEK_API_KEY` | No* | DeepSeek API key (*can be set via Dashboard UI) |
| `DEEPSEEK_BASE_URL` | No | API base URL (default: `https://api.deepseek.com`) |
| `DEEPSEEK_MODEL` | No | Model name (default: `deepseek-chat`) |

---

## Roadmap

**Done:**
- [x] AI deal scoring with DeepSeek
- [x] Daily brief generation
- [x] Feedback flywheel (👍/👎 → scoring prompt)
- [x] Component architecture (7 extracted components)
- [x] URL-synced tab state
- [x] Brief → deal information flow (clickable + highlight)
- [x] XSS protection (DOMPurify)
- [x] Error isolation (Promise.allSettled)
- [x] Waitlist collection (demand validation)
- [x] Self-built event tracking

**Next (validation-gated):**
- [ ] Concierge MVP (manually serve 5 investors)
- [ ] Deploy to Vercel (get live URL)
- [ ] Twitter thread → measure signup conversion
- [ ] Cold DM 50 angels → validate ICP
- [ ] Email/Slack delivery for daily briefs

**Only if validated:**
- [ ] Multi-user support
- [ ] Additional data sources (Twitter/X, Crunchbase)
- [ ] Personalized ranking model

---

## License

MIT — see [LICENSE](./LICENSE)
