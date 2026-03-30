# Indian Lappa League - Product Requirements Document

**Version:** 1.0
**Author:** Rajat Singh (Product Lead)
**Date:** March 17, 2026
**Status:** Draft - Pending Review

---

## 1. Overview

### 1.1 What is Indian Lappa League?
Indian Lappa League (ILL) is a private prediction dashboard for IPL 2026. A group of 13 NSIT alumni (2012-2016 batch) predict the winner of every IPL match and compete for weekly, stage, and overall prizes. The tagline: **Predict | Banter | Win**.

### 1.2 Problem Statement
The group currently has no centralized way to submit predictions, track standings, or see how they compare against each other across the IPL season. Coordination happens over WhatsApp which is error-prone and hard to audit.

### 1.3 Goals
- Give all 13 participants a single place to view standings and track competition
- Automate scoring based on the official ILL rulebook
- Show real-time leaderboards at weekly, stage, and overall levels
- Make it mobile-first (most users check on phones)
- Keep the UI minimal — maximum 2-3 pages, clean navigation with back/forward
- Produce a clear prototype + specs for a developer to build the production app

---

## 2. Users & Roles

| Role | Who | Permissions |
| --- | --- | --- |
| **Participant** | 13 NSIT alumni | View leaderboards, view own history, share standings to Instagram Story |
| **Admin (Executive)** | Vikrant | Manage matches, override scores, manage users, resolve disputes |
| **Finance** | Vipul | View prize distribution, mark payments |
| **Grievance** | Aditya | View and respond to disputes |
| **Audit** | Shubham, Shan | View all predictions, verify scoring |

> **Note:** One person may hold multiple roles (e.g., Vikrant is also a participant).

---

## 3. Tournament Structure (from Rulebook)

### 3.1 Timeline
- **Entry fee deadline:** March 22, 2026
- **Entry fee:** Rs. 3,500 per participant
- **Total prize pool:** Rs. 45,500
- **Season:** IPL 2026 (70 league matches + 4 playoff matches = 74 total)

### 3.2 Week Definition
A **week** runs **Sunday through Saturday** (end of day). All matches in that window belong to that week's prediction round.

### 3.3 Stages

| Stage | Weeks | Matches Covered |
| --- | --- | --- |
| Stage 1 | Weeks 1-4 | First 35 league matches |
| Stage 2 | Weeks 5-8 | Next 35 league matches |
| Stage 3 | Week 9 | Playoffs (4 matches) |

### 3.4 Base Scoring
| Outcome | Points |
| --- | --- |
| Correct prediction | **10 points** |
| Incorrect prediction | **0 points** |
| Rain / No Result | **5 points** (everyone) |
| Late / missed prediction | **0 points** |

### 3.5 Submission Rules
- Predictions for each week must be submitted **before the first match of that week begins**
- Matches already started at submission time score **0 points** for that participant
- Predictions are locked once submitted (no edits after deadline)

### 3.6 Tiebreakers (in order)
1. Most correct predictions
2. Most weekly wins
3. Highest points during the playoff stage
4. Organizer (Executive Department) decision

---

## 4. Prize Distribution (from Rulebook)

### 4.1 Weekly Prizes (9 weeks)

| Position | Prize |
| --- | --- |
| Winner | Rs. 700 |
| Runner-up | Rs. 300 |
| **Total per week** | **Rs. 1,000** |

Total weekly pool: 9 weeks x Rs. 1,000 = **Rs. 9,000**

### 4.2 Stage Prizes (3 stages)

| Position | Prize |
| --- | --- |
| 1st | Rs. 2,500 |
| 2nd | Rs. 1,500 |
| 3rd | Rs. 1,000 |
| **Total per stage** | **Rs. 5,000** |

Total stage pool: 3 stages x Rs. 5,000 = **Rs. 15,000**

### 4.3 Overall Tournament Prizes

| Position | Prize |
| --- | --- |
| 1st | Rs. 9,000 |
| 2nd | Rs. 5,000 |
| 3rd | Rs. 3,500 |
| 4th | Rs. 2,500 |
| 5th | Rs. 1,500 |
| **Total** | **Rs. 21,500** |

### 4.4 Prize Pool Verification
- Weekly: Rs. 9,000
- Stages: Rs. 15,000
- Overall: Rs. 21,500
- **Grand Total: Rs. 45,500** (matches 13 x Rs. 3,500)

---

## 5. Features & Requirements

### 5.1 Authentication & Access
- **P0** - Login system (email/phone + password, or invite-link based)
- **P0** - Only 13 pre-registered participants can access the app
- **P1** - Role-based access (admin, participant, audit, etc.)

### 5.2 Prediction Submission (External — Google Form)
Predictions are **not** submitted within the webapp. Instead:
- **P0** - Predictions are collected via a **Google Form** managed by the admin each week
- **P0** - The webapp imports/syncs prediction data from the Google Form responses (admin uploads or API sync)
- **P0** - The webapp is purely a **leaderboard and standings dashboard** — not a prediction entry tool
- **P1** - Show prediction status per player: submitted / missed (based on imported data)

### 5.3 Weekly Leaderboard
This is the **primary view** participants will check most often.

**Required columns:**

| Column | Description |
| --- | --- |
| Rank | Position this week |
| Player Avatar | Profile picture/icon of the participant |
| Player Name | Participant name |
| Total Matches Predicted | Number of predictions submitted this week |
| Total Matches Happened | Matches completed this week so far |
| Wins (Correct) | Correct predictions this week |
| Losses (Incorrect) | Incorrect predictions this week |
| Draws (No Result) | Rain/abandoned matches this week |
| Total Points | Points earned this week |

**Additional requirements:**
- **P0** - Week selector (Week 1, Week 2, ... Week 9) to view any week
- **P0** - Current stage indicator (Stage 1 / Stage 2 / Stage 3)
- **P0** - Highlight weekly winner and runner-up with prize amounts
- **P0** - Sort by points (descending), with tiebreaker logic applied
- **P0** - Player avatar/photo icon next to each name in the leaderboard
- **P0** - **Share to Instagram Story** button — generates a styled image of the weekly standings for sharing
- **P1** - Show rank change indicator (up/down/same vs. previous week)

### 5.4 Stage Leaderboard
Aggregated standings across all weeks within a stage.

**Required columns:** Same as weekly + cumulative across the stage's weeks.

| Column | Description |
| --- | --- |
| Rank | Position in this stage |
| Player Avatar | Profile picture/icon of the participant |
| Player Name | Participant name |
| Total Matches Predicted | Predictions submitted across stage weeks |
| Total Matches Happened | Matches completed in this stage so far |
| Wins | Correct predictions in this stage |
| Losses | Incorrect predictions in this stage |
| Draws | No Result matches in this stage |
| Total Points | Cumulative points for this stage |
| Weekly Wins | Number of weekly wins in this stage (for tiebreaker) |

**Additional requirements:**
- **P0** - Stage selector (Stage 1, Stage 2, Stage 3)
- **P0** - Show which weeks are part of the selected stage
- **P0** - Highlight top 3 with prize amounts
- **P0** - Apply tiebreaker rules for ranking

### 5.5 Overall Tournament Leaderboard
The grand standings across the entire IPL season.

**Required columns:**

| Column | Description |
| --- | --- |
| Rank | Overall position |
| Player Avatar | Profile picture/icon of the participant |
| Player Name | Participant name |
| Total Matches Predicted | Across all weeks |
| Total Matches Happened | All completed matches |
| Wins | All correct predictions |
| Losses | All incorrect predictions |
| Draws | All No Result matches |
| Total Points | Grand total |
| Weekly Wins | Total weekly wins (tiebreaker) |
| Prediction Accuracy | Win % = Wins / (Wins + Losses) |

**Additional requirements:**
- **P0** - Highlight top 5 with prize amounts
- **P0** - Apply full tiebreaker chain
- **P1** - Show prize earnings to date (weekly + stage prizes already won)

### 5.6 Player Profile
- **P0** - Individual prediction history: match-by-match with predicted team, actual winner, points earned
- **P0** - Summary stats: total points, accuracy %, correct/incorrect/draws
- **P1** - Week-over-week performance chart
- **P1** - Prize earnings summary
- **P2** - Head-to-head comparison with another player

### 5.7 Match Results & Scoring
- **P0** - Admin can input match results (winner or No Result)
- **P0** - Auto-calculate points for all participants upon result entry
- **P0** - Leaderboards update immediately after result entry
- **P1** - Match result history with all participants' predictions revealed (after match is over)
- **P2** - Integration with a cricket API for auto-fetching results

### 5.8 Admin Panel
- **P0** - Add/edit matches (teams, date, time, venue, week assignment)
- **P0** - Enter match results
- **P0** - View all participants' predictions (audit view)
- **P0** - Override scores if needed (with audit log)
- **P1** - Manage participants (add/remove, mark payment status)
- **P1** - Bulk import match schedule

### 5.9 Share to Instagram Story
- **P0** - "Share" button on every leaderboard view (weekly, stage, overall)
- **P0** - Generates a styled, branded image (ILL-themed card) of the current standings
- **P0** - Image includes: ILL logo/branding, leaderboard table with player avatars and names, current week/stage label, "Predict | Banter | Win" tagline
- **P0** - Uses Web Share API or direct Instagram Story deep link (`instagram://story-camera`) to open Instagram with the image pre-loaded
- **P1** - Fallback: download image if Instagram is not available
- **P1** - Watermark with "Indian Lappa League" branding on shared image

### 5.10 Player Avatars
- **P0** - **Rank badges** — #1 gets a gold crown/trophy icon, #2 silver, #3 bronze (like FIFA rankings)
- **P0** - **Points bar** — horizontal mini progress bar behind each player's points cell showing relative points (longest bar = leader). Think MLB standings bar charts.
- **P0** - **Row highlighting** — top 2 (weekly prize winners) get a subtle gold/green glow. Last place gets a "Lappa of the Week" badge (fun/banter element)
- **P0** - **Color-coded W/L/D** — green for wins, red for losses, grey for draws (like NBA box scores)
- **P1** - **Rank change arrows** — animated green up-arrow / red down-arrow next to rank, with number of positions changed (e.g., ↑3, ↓2)
- **P1** - **Streak indicator** — small flame icon for 3+ correct predictions in a row, ice icon for 3+ wrong

### 5.11 Data Visualization & Visual Design (Pro-Level Dashboard)
Inspired by ESPN, NBA, MLB, and Premier League fantasy dashboards. The goal is to make the dashboard feel like a **broadcast-quality sports product**, not a spreadsheet.

#### Page 1 — Leaderboard Visuals

**Hero Section (Top of Page)**
- **P0** - **Top 3 Podium** — stylized podium graphic showing 1st, 2nd, 3rd place with avatars, names, and points (like NBA All-Star voting). Animated on load.
- **P0** - **Current Stage + Week Badge** — bold, color-coded banner (e.g., Stage 1 = blue, Stage 2 = orange, Stage 3 = gold/playoff gold)
- **P1** - **"Match Day" live indicator** — pulsing dot or badge when a match is happening today

**Leaderboard Table Visuals**

**Charts on Leaderboard Page**
- **P0** - **Points Race Line Chart** — multi-line chart showing all 13 players' cumulative points over weeks (like an F1 championship standings chart). X-axis = weeks, Y-axis = points. Each player is a colored line. Tap a line to highlight that player.
- **P1** - **Weekly Winner History** — horizontal bar showing who won each week (color-coded by player), giving a visual timeline of dominance
- **P1** - **Prediction Accuracy Donut** — overall group accuracy as a donut chart (% correct vs incorrect vs no result)

#### Page 2 — Player Profile Visuals

**Player Card Header**
- **P0** - **Sports card design** — player avatar large, name, overall rank, total points, accuracy % displayed like a trading card (think NBA 2K player card or cricket trading card)
- **P0** - **Stat tiles** — 4 bold stat tiles: Total Points | Accuracy % | Correct Predictions | Prize Earnings (like ESPN player stat boxes)

**Player Charts**
- **P0** - **Points Over Time (Area Chart)** — player's weekly points as a filled area chart, with a dashed line showing the group average for comparison
- **P0** - **Win/Loss/Draw Pie Chart** — simple donut showing breakdown of predictions
- **P1** - **Team Prediction Heatmap** — which IPL teams does this player predict most? Color grid showing prediction frequency per team (reveals loyalty/bias)
- **P1** - **Head-to-Head Comparison** — select another player, see side-by-side stat comparison bars (like UFC tale of the tape)
- **P2** - **Hot/Cold Streak Timeline** — visual timeline showing streaks of correct/incorrect predictions

**Match History Table**
- **P0** - **Team logos** next to match entries (not just text names)
- **P0** - **Color-coded result** — green check for correct, red X for incorrect, grey dash for no result
- **P1** - **Expandable match detail** — tap a match to see what all 13 players predicted

#### Visual Design Language

**Color Palette**
- Primary: Deep navy / dark theme (like ESPN dark mode or NBA app)
- Accents: Gold (#FFD700) for winners, green (#00C853) for correct, red (#FF1744) for incorrect
- Stage colors: Stage 1 = Electric Blue, Stage 2 = Vivid Orange, Stage 3 = Championship Gold

**Typography**
- Bold, condensed headings (sports broadcast style)
- Monospace or tabular numbers for points and stats (clean alignment)
- Player names in medium weight, stats in bold

**Animations & Micro-interactions**
- **P1** - Leaderboard rows animate/reorder when switching weeks
- **P1** - Points counter animates up when new results are added
- **P1** - Confetti burst on screen when viewing the overall champion (final week)
- **P2** - Subtle parallax on player card header

**Branding Elements**
- **P0** - ILL logo in header
- **P0** - "Predict | Banter | Win" tagline visible on every page
- **P0** - "Lappa of the Week" fun badge for last place (banter element from the league's spirit)
- **P1** - Custom trophy/badge icons for weekly winner, stage winner, overall champion

### 5.12 Notifications & Engagement
- **P1** - Reminder before weekly submission deadline (via WhatsApp or external)
- **P2** - Push notification when leaderboard updates
- **P2** - Weekly summary (top performer, biggest upset, etc.)

---

## 6. Key Pages / Screens

### 6.1 Design Principle: Maximum 2-3 Pages
The entire participant-facing experience fits on **2-3 clean pages**. Navigation uses simple **back/forward icons** on the page itself (no complex nav bars or sidebars). Keep it minimal, fast, and mobile-friendly.

### 6.2 Page Structure

**Page 1 — Home / Leaderboard (Default Landing Page)**
This is the primary screen. It combines the key views into one scrollable page with tab/toggle switching:
- **Hero: Top 3 Podium** — stylized podium with avatars (see 5.11)
- **Stage + Week Badge** — color-coded current phase indicator
- **Tab: Weekly Standings** (default) — leaderboard with rank badges, points bars, W/L/D colors, avatars
- **Tab: Stage Standings** — stage selector (Stage 1 / Stage 2 / Stage 3), aggregated leaderboard
- **Tab: Overall Standings** — grand tournament leaderboard with top 5 highlighted
- **Points Race Chart** — multi-line chart below leaderboard showing all players' cumulative journey
- **Share to Instagram Story** button — available on all tabs
- Week selector dropdown (for weekly tab)

**Page 2 — Player Profile (tap on any player row)**
Reached by tapping a player's row in any leaderboard. Shows:
- **Sports trading card header** — avatar, name, rank, key stats in bold tiles
- **Points Over Time area chart** — player vs group average
- **Win/Loss/Draw donut chart**
- Match-by-match prediction history with team logos and color-coded results
- Prize earnings to date
- Back arrow to return to leaderboard

**Page 3 — Admin Panel (admin only, hidden from participants)**
- Enter match results
- Import predictions from Google Form
- View all participants' predictions (audit view)
- Override scores with audit log
- Manage match schedule

### 6.3 Navigation
- **Back/forward arrow icons** on the page itself for navigation (no browser-dependent navigation)
- Tapping a player row → Player Profile (Page 2)
- Back arrow on Page 2 → returns to leaderboard (Page 1)
- Admin panel accessible via a small admin icon (visible only to admin role)

### 6.4 Screen Priority for Prototype

| Screen | Priority | Notes |
| --- | --- | --- |
| Page 1: Leaderboard (Weekly/Stage/Overall tabs) | P0 | Default landing page, core experience |
| Page 2: Player Profile | P0 | Tap any player to see details |
| Page 3: Admin Panel | P0 | Required for scoring and data management |
| Share to Instagram Story | P0 | Social sharing feature |

---

## 7. Data Model (High-Level)

### Core Entities

**Participant**
- id, name, email/phone, avatar_url (profile picture), role, payment_status, created_at

**Match**
- id, match_number, team_home, team_away, venue, date_time, week_number, stage, result (home_win / away_win / no_result / pending)

**Prediction**
- id, participant_id, match_id, predicted_winner, submitted_at, points_awarded

**Week**
- id, week_number, stage, start_date (Sunday), end_date (Saturday), submission_deadline, is_active

**Leaderboard Cache** (optional, for performance)
- participant_id, scope (weekly/stage/overall), scope_id, total_points, wins, losses, draws, rank

---

## 8. Scoring Engine Rules

The scoring engine must implement the following logic:

1. **On prediction submission:**
  - Validate submission is before deadline (first match of that week)
  - For each match: if match has already started at submission time, mark prediction as invalid (0 points)
  - Store prediction with timestamp

2. **On match result entry:**
  - If result = No Result: award 5 points to ALL participants for that match
  - If result = team win: award 10 points to participants who predicted correctly, 0 to others
  - Participants who did not submit a prediction for this match get 0 points
  - Recalculate weekly, stage, and overall leaderboards

3. **Tiebreaker resolution:**
  - Primary: Most correct predictions (count of 10-point results)
  - Secondary: Most weekly wins (count of weeks where participant ranked #1)
  - Tertiary: Highest points during playoff stage (Stage 3)
  - Final: Admin decision

---

## 9. Non-Functional Requirements

| Requirement | Target |
| --- | --- |
| Mobile responsiveness | Must work well on phones (primary device) |
| Load time | < 2 seconds for leaderboard |
| Concurrent users | 13 (small scale) |
| Data integrity | All predictions timestamped, audit trail for score overrides |
| Availability | Should be up during match hours (evening IST) |

---

## 10. Tech Stack (Prototype)

| Layer | Choice | Rationale |
| --- | --- | --- |
| Frontend | React | As per project spec |
| Backend | Node.js | As per project spec |
| Database | SQLite or PostgreSQL | Simple relational data |
| Deployment | Vercel | As per project spec |
| Source control | GitHub | As per project spec |

---

## 11. Out of Scope (for Prototype)

- Prediction submission (handled via Google Form, not in the webapp)
- Live cricket score integration (results entered manually by admin)
- Chat or banter features (stays on WhatsApp)
- Payment processing (handled offline)
- Complex analytics or ML predictions
- Native mobile app (responsive web is sufficient)

---

## 12. Open Questions

1. **Weekly twists:** The rulebook mentions "All weekly twists build on top of this base scoring system." Are there specific twist mechanics for each week, or is this left to the admin to announce? If specific twists exist, they need to be documented to build into the scoring engine.

2. **Prediction visibility:** Should participants be able to see others' predictions before the match on the dashboard? (Recommended: No - reveal only after match is complete to prevent copying.)

3. **Stage 3 (Playoffs):** Playoffs have only 4 matches in 1 week. Should the weekly and stage leaderboard be combined for Stage 3, or kept separate?

4. **Admin result entry:** Should the admin enter results match-by-match, or can they bulk-enter at end of day?

5. **Participant names:** Should we use real names, nicknames, or let participants choose display names?

6. **Google Form sync:** Should prediction data be imported manually by admin (CSV upload) or auto-synced via Google Sheets API?

7. **Player photos:** Will participants provide their own photos, or should we use WhatsApp profile pics / a default avatar set?

8. **Instagram Story format:** What dimensions and branding style for the shareable image? (Recommended: 1080x1920 story format with ILL branding.)

---

## 13. Success Metrics

- All 13 participants actively submitting predictions each week
- Zero scoring disputes (accurate automated scoring)
- Leaderboard updated within minutes of match completion
- Developer can build the production app from this spec + prototype without ambiguity

---

## 14. Appendix: Prize Pool Summary Chart

| Category | Pool | # of Prizes |
| --- | --- | --- |
| Weekly | Rs. 9,000 | 9 weeks x 2 prizes |
| Stage | Rs. 15,000 | 3 stages x 3 prizes |
| Overall | Rs. 21,500 | 5 prizes |
| **Total** | **Rs. 45,500** |  |

---

*This PRD is based on the Indian Lappa League Rulebook (IPL 2026 edition). All scoring rules, prize amounts, and tournament structure are as specified in the rulebook.*
