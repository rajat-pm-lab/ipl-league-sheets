// Shared constants used by both API and frontend
// Keep in sync with sampleData.js player list

export const PLAYERS = [
  { id: 1, name: 'Aditya', initials: 'AD', role: 'GRIEVANCE' },
  { id: 2, name: 'Aman', initials: 'AM', role: 'PARTICIPANT' },
  { id: 3, name: 'Deepanshu', initials: 'DP', role: 'PARTICIPANT' },
  { id: 4, name: 'Rajjo', initials: 'RJ', role: 'PARTICIPANT', avatar: '/avatars/rajjo.jpg' },
  { id: 5, name: 'Shan', initials: 'SN', role: 'AUDIT', avatar: '/avatars/shan.jpg' },
  { id: 6, name: 'Shivek', initials: 'SK', role: 'PARTICIPANT' },
  { id: 7, name: 'Shubham', initials: 'SH', role: 'AUDIT' },
  { id: 8, name: 'Sudarshan', initials: 'SD', role: 'PARTICIPANT' },
  { id: 9, name: 'Suyash', initials: 'SY', role: 'PARTICIPANT' },
  { id: 10, name: 'Tushar', initials: 'TU', role: 'PARTICIPANT' },
  { id: 12, name: 'Vikrant', initials: 'VK', role: 'ADMIN', avatar: '/avatars/vikrant.jpg' },
  { id: 13, name: 'Vipul', initials: 'VP', role: 'FINANCE', avatar: '/avatars/vipul.jpg' },
];

// Map nicknames/form names to player IDs
export const NAME_ALIASES = {
  'aditya': 1, 'adi': 1,
  'aman': 2,
  'deepanshu': 3, 'pincha': 3,
  'rajjo': 4, 'rajat': 4,
  'shan': 5, 'shaan': 5,
  'shivek': 6,
  'shubham': 7, 'gungun': 7,
  'sudarshan': 8, 'suddi': 8,
  'suyash': 9,
  'tushar': 10, 'tushar bhasin': 10,
  'vikrant': 12,
  'vipul': 13,
};

export const IPL_TEAMS = [
  { abbr: 'CSK', name: 'Chennai Super Kings', color: '#FFD700' },
  { abbr: 'MI', name: 'Mumbai Indians', color: '#004BA0' },
  { abbr: 'RCB', name: 'Royal Challengers Bengaluru', color: '#D4213D' },
  { abbr: 'KKR', name: 'Kolkata Knight Riders', color: '#3A225D' },
  { abbr: 'DC', name: 'Delhi Capitals', color: '#004C93' },
  { abbr: 'SRH', name: 'Sunrisers Hyderabad', color: '#FF822A' },
  { abbr: 'PBKS', name: 'Punjab Kings', color: '#ED1B24' },
  { abbr: 'RR', name: 'Rajasthan Royals', color: '#254AA5' },
  { abbr: 'GT', name: 'Gujarat Titans', color: '#6DB3C3' },
  { abbr: 'LSG', name: 'Lucknow Super Giants', color: '#A72056' },
];

// Team name variations from cricket APIs → standard abbreviation
export const TEAM_NAME_MAP = {
  'chennai super kings': 'CSK', 'csk': 'CSK',
  'mumbai indians': 'MI', 'mi': 'MI',
  'royal challengers bengaluru': 'RCB', 'royal challengers bangalore': 'RCB', 'rcb': 'RCB',
  'kolkata knight riders': 'KKR', 'kkr': 'KKR',
  'delhi capitals': 'DC', 'dc': 'DC',
  'sunrisers hyderabad': 'SRH', 'srh': 'SRH',
  'punjab kings': 'PBKS', 'pbks': 'PBKS',
  'rajasthan royals': 'RR', 'rr': 'RR',
  'gujarat titans': 'GT', 'gt': 'GT',
  'lucknow super giants': 'LSG', 'lsg': 'LSG',
};

export const STAGES = {
  STAGE_1: { label: 'Stage 1', color: '#2979FF', weeks: [1, 2, 3] },
  STAGE_2: { label: 'Stage 2', color: '#FF6D00', weeks: [4, 5, 6] },
  STAGE_3: { label: 'Stage 3', color: '#FFD700', weeks: [7, 8, 9] },
};

export function getStageForWeek(weekNum) {
  for (const [key, stage] of Object.entries(STAGES)) {
    if (stage.weeks.includes(weekNum)) return key;
  }
  return 'STAGE_1';
}

export function resolvePlayerId(name) {
  if (!name) return null;
  const normalized = name.trim().toLowerCase();
  return NAME_ALIASES[normalized] || null;
}
