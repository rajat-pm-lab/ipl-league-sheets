# CLAUDE.md — IPL Prediction League

## Project Overview
A web app for NSIT engineering alumni (2012-2016 batch, ~13-14 players) to predict winners of every IPL match and compete for weekly and phase-wise prizes.

## Who This Is For
- **Builder:** Rajat Singh (PM + product designer)
- **Developer:** A software developer friend who will build the production app
- **Users:** 13-14 NSIT alumni competing in a private prediction league

## What We're Building
- **Leaderboard Dashboard** — real-time standings, weekly & phase-wise rankings
- **Match Prediction System** — predict winners for each IPL match before it starts
- **Prize Tracking** — weekly and phase-wise prizes as per the rulebook
- **Player Profiles** — track individual prediction history and accuracy

## Project Phases
| Phase | Status | Description |
| --- | --- | --- |
| 01-design | Not started | UX mockups, data model, system architecture |
| 02-prototype | Not started | Working prototype for developer handoff |
| 03-rulebook | Not started | Formalized rules, scoring, prize structure |

## Tech Stack (Prototype)
| Layer | Tools |
| --- | --- |
| Frontend | React |
| Backend | Node.js |
| Deployment | Vercel |
| Source control | GitHub |

## Key Deliverables
1. **Design specs** — mockups, user flows, data model for the developer
2. **Working prototype** — clickable/functional demo the developer can reference
3. **Rulebook** — scoring rules, prize distribution, tiebreakers

## How Claude Should Work on This Project
- This is a **design-first project** — the goal is to produce clear specs and a prototype for a developer to build from
- Keep designs simple and mobile-friendly (most users will check on phones)
- The rulebook will be provided separately — integrate its rules into the scoring logic
- Prioritize clarity for the developer: clean data models, clear API contracts, annotated mockups
- IPL 2025 season context: 10 teams, 74 matches (league stage + playoffs)

## Security
- This is a private group app but the repo may be public (portfolio)
- No real phone numbers or emails in committed code
- Use `.env` for any API keys or secrets
