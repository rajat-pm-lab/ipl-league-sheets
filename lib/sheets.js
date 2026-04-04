import { google } from 'googleapis';
import { resolvePlayerId, TEAM_NAME_MAP } from './constants.js';

let sheetsClient = null;

function getClient() {
  if (sheetsClient) return sheetsClient;

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

const SPREADSHEET_ID = () => process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

// Read a sheet tab and return rows as objects (first row = headers)
async function readSheet(tabName, range) {
  const sheets = getClient();
  const fullRange = range ? `'${tabName}'!${range}` : `'${tabName}'`;
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID(),
    range: fullRange,
  });

  const rows = res.data.values || [];
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((row) => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] || '';
    });
    return obj;
  });
}

// Write values to a sheet range
async function writeSheet(tabName, range, values) {
  const sheets = getClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID(),
    range: `'${tabName}'!${range}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  });
}

// ── Public API ──

// Read match results from "Match Results" tab
// Expected columns: match_num, week, home, away, date, winner, status
export async function readMatchResults() {
  const rows = await readSheet('Match Results');
  return rows.map((r) => ({
    matchNum: parseInt(r.match_num || r.matchnum, 10),
    week: parseInt(r.week, 10),
    home: (r.home || '').trim().toUpperCase(),
    away: (r.away || '').trim().toUpperCase(),
    date: r.date || '',
    winner: (r.winner || '').trim().toUpperCase() || undefined,
    // Auto-derive status: if winner is filled in, treat as completed regardless of status column
    status: (r.winner || '').trim()
      ? 'completed'
      : (r.status || 'upcoming').trim().toLowerCase(),
  }));
}

// Read scoring rules from "Rules" tab
// Expected columns: rule_id, description, type, points, active
// OR per-stage columns: rule_id, description, type, stage1_points, stage2_points, stage3_points, active
export async function readScoringRules() {
  const rows = await readSheet('Rules');
  const rules = {};
  for (const r of rows) {
    if (r.active?.toUpperCase() !== 'TRUE') continue;
    rules[r.rule_id] = {
      description: r.description,
      type: r.type,
      points: parseInt(r.points || r.stage1_points || '0', 10),
      stage1: parseInt(r.stage1_points || r.points || '0', 10),
      stage2: parseInt(r.stage2_points || r.points || '0', 10),
      stage3: parseInt(r.stage3_points || r.points || '0', 10),
    };
  }
  return rules;
}

// Read predictions for a given week from "Week N" tab
// Google Form responses — columns: timestamp, name, then one column per match
// Match columns expected format: "Match 1: RCB vs SRH" or similar
// matchResults: optional array from readMatchResults() — used to resolve Double Dip "DC vs GT" format
export async function readWeekPredictions(weekNum, matchResults = []) {
  const tabName = `Week ${weekNum}`;
  let rows;
  try {
    rows = await readSheet(tabName);
  } catch {
    return {}; // Tab doesn't exist yet
  }

  if (rows.length === 0) return {};

  // Find match columns — look for columns containing "match" or team abbreviations
  const sampleRow = rows[0];
  const headers = Object.keys(sampleRow);

  // Identify the name column (usually "name" or contains "name")
  const nameKey = headers.find((h) => h.includes('name') || h === 'name') || headers[1];

  // Identify match columns — any column with a match number pattern
  const matchColumns = [];
  for (const h of headers) {
    const matchNum = extractMatchNum(h);
    if (matchNum !== null) {
      matchColumns.push({ header: h, matchNum });
    }
  }

  // Detect special week mechanic columns (Double Dip and Hate Team)
  const doubleDipKey = headers.find((h) => h.includes('double'));
  const hateTeamKey = headers.find((h) => h.includes('hate'));

  // Pre-filter match results for this week (for DD team-pair lookup)
  const weekMatches = matchResults.filter((m) => m.week === weekNum);

  // Build predictions: { playerId: { matchNum: teamAbbr, _doubleDip?: N, _hateTeam?: 'ABBR' } }
  const predictions = {};
  for (const row of rows) {
    const playerName = row[nameKey];
    const playerId = resolvePlayerId(playerName);
    if (!playerId) continue;

    predictions[playerId] = {};
    for (const { header, matchNum } of matchColumns) {
      const pick = normalizeTeamName(row[header]);
      if (pick) {
        predictions[playerId][matchNum] = pick;
      }
    }

    // Double Dip: resolve match number from value (supports "Match 14", "14", or "DC vs GT" format)
    if (doubleDipKey && row[doubleDipKey]) {
      const ddMatch = resolveDoubleDipMatch(row[doubleDipKey], weekMatches);
      if (ddMatch) predictions[playerId]._doubleDip = ddMatch;
    }

    // Hate Team: normalize to team abbreviation
    if (hateTeamKey && row[hateTeamKey]) {
      const hateTeam = normalizeTeamName(row[hateTeamKey]);
      if (hateTeam) predictions[playerId]._hateTeam = hateTeam;
    }
  }

  return predictions;
}

// Read per-week rule overrides from "Weekly Rules" tab
// Expected columns: week, rule_id, points, note
// If a week is not listed, scoring falls back to stage rules from "Rules" tab
export async function readWeeklyRuleOverrides() {
  let rows;
  try {
    rows = await readSheet('Weekly Rules');
  } catch {
    return {}; // Tab doesn't exist yet — no overrides
  }
  const overrides = {}; // { weekNum: { rule_id: { points, note } } }
  for (const r of rows) {
    const week = parseInt(r.week, 10);
    if (!week || !r.rule_id) continue;
    if (!overrides[week]) overrides[week] = {};
    overrides[week][r.rule_id.trim()] = {
      points: parseInt(r.points, 10),
      note: (r.note || '').trim(),
    };
  }
  return overrides;
}

// Write a match result back to the sheet
export async function writeMatchResult(matchNum, winner, status = 'completed') {
  const results = await readMatchResults();
  const rowIndex = results.findIndex((r) => r.matchNum === matchNum);
  if (rowIndex === -1) return false;

  // +2 because: +1 for header row, +1 for 1-based index
  const sheetRow = rowIndex + 2;
  await writeSheet('Match Results', `F${sheetRow}:G${sheetRow}`, [[winner, status]]);
  return true;
}

// ── Helpers ──

function extractMatchNum(header) {
  // Matches patterns like "Match 1", "match 1: rcb vs srh", "m1", "#1"
  const patterns = [
    /match\s*(\d+)/i,
    /m(\d+)/i,
    /#(\d+)/,
  ];
  for (const p of patterns) {
    const m = header.match(p);
    if (m) return parseInt(m[1], 10);
  }
  return null;
}

// Resolve Double Dip match number from a form value
// Supports: "Match 14", "14", "DC vs GT", "GT vs DC"
function resolveDoubleDipMatch(value, weekMatches) {
  if (!value) return null;
  const trimmed = value.trim();

  // Try "Match N" or plain number first
  const byNum = extractMatchNum(trimmed) ?? (parseInt(trimmed, 10) || null);
  if (byNum) return byNum;

  // Try "TEAM vs TEAM" format (e.g., "DC vs GT")
  const vsMatch = trimmed.match(/^(.+?)\s+vs\s+(.+?)$/i);
  if (vsMatch) {
    const team1 = normalizeTeamName(vsMatch[1].trim());
    const team2 = normalizeTeamName(vsMatch[2].trim());
    if (team1 && team2) {
      const found = weekMatches.find((m) =>
        (m.home === team1 && m.away === team2) ||
        (m.home === team2 && m.away === team1)
      );
      if (found) return found.matchNum;
    }
  }
  return null;
}

function normalizeTeamName(value) {
  if (!value) return null;
  const cleaned = value.trim().toLowerCase();
  // Direct abbreviation
  const upper = cleaned.toUpperCase();
  if (['CSK', 'MI', 'RCB', 'KKR', 'DC', 'SRH', 'PBKS', 'RR', 'GT', 'LSG'].includes(upper)) {
    return upper;
  }
  // Full name lookup
  return TEAM_NAME_MAP[cleaned] || null;
}
