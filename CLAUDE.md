# CLAUDE.md — IPL League Sheets (Active Prototype)

## What This Repo Is
This is the **active, live prototype** of the Indian Lappa League (ILL) prediction dashboard.
It uses Google Sheets as the backend — no traditional database.

**Live URL:** https://ipl-league-sheets.vercel.app
**GitHub:** ipl-league-sheets (separate from ipl-prediction-league which is Shaan's repo)

---

## Who This Is For
- **Builder:** Rajat Singh (PM + product designer, non-technical)
- **Users:** 12 NSIT alumni (2012-2016 batch) competing in a private IPL prediction league
- **Admin:** Vikrant (enters match results, manages data)

---

## Current State (March 2026)
- IPL 2026 season is **live** — Week 1 predictions are in
- 12 players active (Utkarsh was removed)
- 9 matches in Week 1 schedule; 3 have results so far
- Scoring, leaderboard, and Picks tab are all functional

---

## Architecture

```
Google Sheet (ID: 15YEBSCRUec2f0DhPmYLVipr8h9A944KViB7INRVfeMc)
  ├── Rules tab        — scoring points per stage (admin editable)
  ├── Match Results tab — match schedule + winner column
  └── Week N tabs      — player predictions (pasted from Google Form CSV)

Vercel Serverless
  ├── /api/sheets-data.js     — main data endpoint (60s cache)
  └── /api/cron/update-results.js — daily cron (11:30 PM IST) auto-fetches from CricAPI

React + Vite Frontend (02-prototype/ill-dashboard/)
  ├── DataContext.jsx   — fetches /api/sheets-data, fallback to static data
  ├── Leaderboard.jsx   — 4 tabs: Weekly, Stage, Overall, Picks
  └── PredictionsView.jsx — accordion match cards showing all players' picks
```

---

## Key Files
| File | Purpose |
|---|---|
| `lib/constants.js` | Players list, team names, stages, NAME_ALIASES for nicknames |
| `lib/sheets.js` | Google Sheets API client — reads Rules, Match Results, Week N tabs |
| `lib/scoring.js` | Pure scoring engine — computeWeeklyScores, rankLeaderboard, etc. |
| `api/sheets-data.js` | Main API endpoint — assembles all data for frontend |
| `vercel.json` | Build config, cron schedule, API rewrites |

---

## Player Roster (12 players)
| ID | Name | Nicknames |
|---|---|---|
| 1 | Rajat | Rajjo |
| 2 | Vikrant | — |
| 3 | Vipul | — |
| 4 | Deepanshu | Pincha |
| 5 | Shubham | Gungun |
| 6 | Sudarshan | Suddi |
| 7 | Aditya | Adi |
| 8 | Shan | Shaan |
| 9 | Akash | — |
| 10 | Kartik | — |
| 12 | Himanshu | — |
| 13 | Nishant | — |

Player ID 11 (Utkarsh) was removed. IDs are not sequential on purpose — do not renumber.

---

## Scoring Rules
- **Correct pick:** 10 points (configurable per stage in Rules tab)
- **Wrong pick:** 0 points
- **No Result (rain/abandoned):** 5 points for everyone
- **Missed/late prediction:** 0 points

Rules are read from the Google Sheet `Rules` tab — **no code deploy needed to change points**.

---

## How Data Updates Work
1. Admin fills `winner` column in `Match Results` tab of Google Sheet
2. Site refreshes data within ~60 seconds (CDN cache: s-maxage=60)
3. No code deploy needed for any data changes

**Weekly picks flow:**
1. Players submit via Google Form
2. Admin downloads CSV response
3. Admin pastes into Sheet tab named `Week N` (same format as Week 1)
4. Scoring picks it up automatically

---

## Dynamic Rules (Weekly Twists)
Edit the `Rules` tab in Google Sheet:
- Column `stage1`, `stage2`, `stage3` — points per stage
- To add per-week rules, add a `week_N` column and handle in `lib/scoring.js`

---

## Vercel Env Vars Required
- `GOOGLE_SHEETS_ID` — Sheet ID
- `GOOGLE_SHEETS_CLIENT_EMAIL` — service account email (ipl-sheets-bot@...)
- `GOOGLE_SHEETS_PRIVATE_KEY` — private key (rotate if ever exposed in plaintext)
- `CRON_SECRET` — validates cron job requests
- `CRICKET_API_KEY` — (optional) CricAPI free tier key for auto-results

---

## Two Repos — Don't Confuse Them
| Repo | Status | Notes |
|---|---|---|
| `ipl-league-sheets` | **Active** | This repo. Sheets backend. Live at ipl-league-sheets.vercel.app |
| `ipl-prediction-league` | Shaan's work | Traditional Node.js backend. Keep separate, don't merge. |

---

## Security
- Private Key IPL JSON folder is in .gitignore — never commit service account keys
- No real phone numbers or emails in code
- Rotate service account key in Google Cloud Console if key is ever exposed
