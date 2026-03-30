// One-time script to set up Google Sheet tabs with initial data
// Run: node scripts/setup-sheets.js

import { google } from 'googleapis';

const SPREADSHEET_ID = '15YEBSCRUec2f0DhPmYLVipr8h9A944KViB7INRVfeMc';
const CLIENT_EMAIL = 'ipl-sheets-bot@ipl-league-491802.iam.gserviceaccount.com';
const PRIVATE_KEY = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!PRIVATE_KEY) {
  console.error('Set GOOGLE_SHEETS_PRIVATE_KEY env var first');
  process.exit(1);
}

const auth = new google.auth.GoogleAuth({
  credentials: { client_email: CLIENT_EMAIL, private_key: PRIVATE_KEY },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

async function createTab(title) {
  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title } } }],
      },
    });
    console.log(`Created tab: ${title}`);
  } catch (e) {
    if (e.message?.includes('already exists')) {
      console.log(`Tab already exists: ${title}`);
    } else {
      throw e;
    }
  }
}

async function writeTab(tab, values) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${tab}'!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  });
  console.log(`Wrote ${values.length} rows to ${tab}`);
}

async function main() {
  // ── Tab 1: Rules ──
  await createTab('Rules');
  await writeTab('Rules', [
    ['rule_id', 'description', 'type', 'points', 'active'],
    ['correct_pick', 'Correct match winner prediction', 'per_match', 10, 'TRUE'],
    ['wrong_pick', 'Wrong prediction', 'per_match', 0, 'TRUE'],
    ['no_result', 'Match abandoned / no result', 'per_match', 5, 'TRUE'],
  ]);

  // ── Tab 2: Match Results ──
  await createTab('Match Results');
  await writeTab('Match Results', [
    ['match_num', 'week', 'home', 'away', 'date', 'winner', 'status'],
    // Week 1 — real IPL 2026 matches
    [1, 1, 'RCB', 'SRH', '28-Mar', '', 'upcoming'],
    [2, 1, 'MI', 'KKR', '29-Mar', '', 'upcoming'],
    [3, 1, 'RR', 'CSK', '30-Mar', '', 'upcoming'],
    [4, 1, 'PBKS', 'GT', '31-Mar', '', 'upcoming'],
    [5, 1, 'LSG', 'DC', '1-Apr', '', 'upcoming'],
    [6, 1, 'KKR', 'SRH', '2-Apr', '', 'upcoming'],
    [7, 1, 'CSK', 'PBKS', '3-Apr', '', 'upcoming'],
    [8, 1, 'DC', 'MI', '4-Apr', '', 'upcoming'],
    [9, 1, 'GT', 'RR', '4-Apr', '', 'upcoming'],
  ]);

  // ── Tab 3: Week 1 predictions ──
  await createTab('Week 1');
  await writeTab('Week 1', [
    ['name', 'Match 1: RCB vs SRH', 'Match 2: MI vs KKR', 'Match 3: RR vs CSK', 'Match 4: PBKS vs GT', 'Match 5: LSG vs DC', 'Match 6: KKR vs SRH', 'Match 7: CSK vs PBKS', 'Match 8: DC vs MI', 'Match 9: GT vs RR'],
    ['Adi',      'SRH', 'MI',  'CSK', 'PBKS', 'DC',  'SRH', 'PBKS', 'DC',  'GT'],
    ['Aman',     'RCB', 'MI',  'CSK', 'PBKS', 'DC',  'SRH', 'PBKS', 'MI',  'GT'],
    ['Pincha',   'RCB', 'MI',  'RR',  'GT',   'DC',  'SRH', 'PBKS', 'DC',  'GT'],
    ['Rajjo',    'RCB', 'MI',  'CSK', 'GT',   'DC',  'SRH', 'CSK',  'MI',  'GT'],
    ['Shaan',    'RCB', 'MI',  'RR',  'PBKS', 'DC',  'SRH', 'PBKS', 'DC',  'GT'],
    ['Shivek',   'SRH', 'MI',  'CSK', 'GT',   'DC',  'SRH', 'PBKS', 'DC',  'GT'],
    ['Gungun',   'RCB', 'MI',  'CSK', 'GT',   'DC',  'KKR', 'CSK',  'MI',  'GT'],
    ['Suddi',    'RCB', 'MI',  'RR',  'GT',   'LSG', 'KKR', 'CSK',  'MI',  'GT'],
    ['Suyash',   'RCB', 'KKR', 'RR',  'PBKS', 'LSG', 'KKR', 'PBKS', 'MI',  'RR'],
    ['Tushar',   'RCB', 'MI',  'RR',  'PBKS', 'DC',  'SRH', 'CSK',  'MI',  'GT'],
    ['Vikrant',  'RCB', 'MI',  'CSK', 'PBKS', 'DC',  'SRH', 'CSK',  'MI',  'GT'],
    ['Vipul',    'RCB', 'KKR', 'CSK', 'PBKS', 'DC',  'SRH', 'PBKS', 'DC',  'GT'],
  ]);

  console.log('\n✅ All tabs set up! Open your sheet to verify.');
}

main().catch(console.error);
