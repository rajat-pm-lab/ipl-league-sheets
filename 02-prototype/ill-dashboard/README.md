# ILL Dashboard — IPL Prediction League

React + Vite prototype for the NSIT alumni IPL Prediction League.

---

## Octopus Paul — Week Prediction Algorithm

Paul is the in-app predictor widget that calls Week Winner, Runner-Up, and Lappa after each match result is entered.

### How it works

Paul runs a **5-factor weighted model** on every page load. Scores are normalised to 0–1 per factor, then combined.

```
PaulScore(player) =
  0.40 × N( ExpectedRemainingPts )   ← future projection for this week
  0.20 × N( CurrentWeekPts )         ← points already earned this week
  0.20 × N( RankScore, week N-1 )    ← most recent prior week standing
  0.15 × N( RankScore, week N-2 )    ← 2nd most recent prior week
  0.05 × N( RankScore, week N-3 )    ← 3rd most recent prior week

N(x) = (x − min) / (max − min)   across all players for that factor
RankScore(rank) = numPlayers − rank + 1   (rank 1 → best score)
```

### Factor 1: Expected Remaining Points (40%)

For each **remaining (unplayed)** match, per player:

| Match type | Expected value |
|---|---|
| Cannibalised | `0` — checked first, overrides everything |
| Triple Dip | `blendedRate × 50 − 20` (EV of +30/−20) |
| BAU (normal) | `blendedRate × 10` (EV of +10/0) |

**Triple Dip breakeven:** A player needs >40% win rate for TD to add value vs a BAU match.

### Blended Win Rate (used in Factor 1)

Bayesian blend of current-week form and career history. Prior weight = 5 pseudo-matches.

```
blendedRate = (wkWins + careerRate × 5) / (wkPlayed + 5)
```

- If 0 matches played yet this week → blendedRate ≈ careerRate
- If 5 matches played → equal weight to week form and career
- Absolute fallback: 0.45 if no history at all

### Week 4 — specific mechanics handled

- **Triple Dip:** player marks 2 matches. Correct = +30, wrong = −20.
- **Cannibalisation:** one player sabotages one of another player's matches → 0 pts for that match regardless of result or TD status.
- **Cannib resolution:** most votes wins; tie-break prefers target's TD match, then earliest match number.
- **Cannibalised TD:** cannibalisation check always runs first → 0 pts, not TD EV.

### Auto-updates

Paul re-computes on every API call. Vercel caches for 60 seconds (`s-maxage=60`).
Punch a winner into the Google Sheet → Paul updates within ~1 minute.

### Data sources

| Data | Source |
|---|---|
| Match winners | `Match Results` sheet tab |
| Player picks, TDs, cannib choices | `Week N` sheet tab |
| Cannib resolution | Computed in `api/sheets-data.js` → `cannibResolution` |
| Weekly scores | Computed in `lib/scoring.js` → `weeklyData` |

---

## Dev setup

```bash
cd 02-prototype/ill-dashboard
npm install
npm run dev
```

Requires a `.env` file (or Vercel env vars) with:
- `GOOGLE_SHEETS_CLIENT_EMAIL`
- `GOOGLE_SHEETS_PRIVATE_KEY`
- `GOOGLE_SHEETS_SPREADSHEET_ID`
