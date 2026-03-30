// Sample data for Indian Lappa League prototype

export const STAGES = {
  STAGE_1: { label: 'Stage 1', color: '#2979FF', weeks: [1, 2, 3, 4] },
  STAGE_2: { label: 'Stage 2', color: '#FF6D00', weeks: [5, 6, 7, 8] },
  STAGE_3: { label: 'Stage 3', color: '#FFD700', weeks: [9] },
};

export const AVATAR_COLORS = [
  '#FFD700', '#2979FF', '#00C853', '#FF6D00', '#AA00FF',
  '#00BCD4', '#FF1744', '#76FF03', '#FF9100', '#448AFF',
  '#E040FB', '#FFAB40', '#69F0AE',
];

export const PLAYERS = [
  { id: 1, name: 'Aditya', initials: 'AD', role: 'GRIEVANCE' },
  { id: 2, name: 'Aman', initials: 'AM', role: 'PARTICIPANT' },
  { id: 3, name: 'Deepanshu', initials: 'DP', role: 'PARTICIPANT' },
  { id: 4, name: 'Rajjo', initials: 'RJ', role: 'PARTICIPANT', avatar: '/avatars/rajjo.jpg' },
  { id: 5, name: 'Shan', initials: 'SN', role: 'AUDIT' },
  { id: 6, name: 'Shivek', initials: 'SK', role: 'PARTICIPANT' },
  { id: 7, name: 'Shubham', initials: 'SH', role: 'AUDIT' },
  { id: 8, name: 'Sudarshan', initials: 'SD', role: 'PARTICIPANT' },
  { id: 9, name: 'Suyash', initials: 'SY', role: 'PARTICIPANT' },
  { id: 10, name: 'Tushar', initials: 'TU', role: 'PARTICIPANT' },
  { id: 12, name: 'Vikrant', initials: 'VK', role: 'ADMIN', avatar: '/avatars/vikrant.jpg' },
  { id: 13, name: 'Vipul', initials: 'VP', role: 'FINANCE', avatar: '/avatars/vipul.jpg' },
];

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

// Weekly standings data (Week 1-3 sample)
export const WEEKLY_DATA = {
  1: [
    // Week 1 placeholder — real results TBD (matches start 28-Mar)
    { playerId: 1, predicted: 9, played: 0, wins: 0, losses: 0, draws: 0, points: 0 },
    { playerId: 2, predicted: 9, played: 0, wins: 0, losses: 0, draws: 0, points: 0 },
    { playerId: 3, predicted: 9, played: 0, wins: 0, losses: 0, draws: 0, points: 0 },
    { playerId: 4, predicted: 9, played: 0, wins: 0, losses: 0, draws: 0, points: 0 },
    { playerId: 5, predicted: 9, played: 0, wins: 0, losses: 0, draws: 0, points: 0 },
    { playerId: 6, predicted: 9, played: 0, wins: 0, losses: 0, draws: 0, points: 0 },
    { playerId: 7, predicted: 9, played: 0, wins: 0, losses: 0, draws: 0, points: 0 },
    { playerId: 8, predicted: 9, played: 0, wins: 0, losses: 0, draws: 0, points: 0 },
    { playerId: 9, predicted: 9, played: 0, wins: 0, losses: 0, draws: 0, points: 0 },
    { playerId: 10, predicted: 9, played: 0, wins: 0, losses: 0, draws: 0, points: 0 },
    { playerId: 12, predicted: 9, played: 0, wins: 0, losses: 0, draws: 0, points: 0 },
    { playerId: 13, predicted: 9, played: 0, wins: 0, losses: 0, draws: 0, points: 0 },
  ],
  2: [
    { playerId: 1, predicted: 0, played: 0, wins: 0, losses: 0, draws: 0, points: 0 },
    { playerId: 2, predicted: 0, played: 0, wins: 0, losses: 0, draws: 0, points: 0 },
    { playerId: 3, predicted: 0, played: 0, wins: 0, losses: 0, draws: 0, points: 0 },
    { playerId: 4, predicted: 0, played: 0, wins: 0, losses: 0, draws: 0, points: 0 },
    { playerId: 5, predicted: 0, played: 0, wins: 0, losses: 0, draws: 0, points: 0 },
    { playerId: 6, predicted: 0, played: 0, wins: 0, losses: 0, draws: 0, points: 0 },
    { playerId: 7, predicted: 0, played: 0, wins: 0, losses: 0, draws: 0, points: 0 },
    { playerId: 8, predicted: 0, played: 0, wins: 0, losses: 0, draws: 0, points: 0 },
    { playerId: 9, predicted: 0, played: 0, wins: 0, losses: 0, draws: 0, points: 0 },
    { playerId: 10, predicted: 0, played: 0, wins: 0, losses: 0, draws: 0, points: 0 },
    { playerId: 12, predicted: 0, played: 0, wins: 0, losses: 0, draws: 0, points: 0 },
    { playerId: 13, predicted: 0, played: 0, wins: 0, losses: 0, draws: 0, points: 0 },
  ],
  3: [
    { playerId: 1, predicted: 0, played: 0, wins: 0, losses: 0, draws: 0, points: 0 },
    { playerId: 2, predicted: 0, played: 0, wins: 0, losses: 0, draws: 0, points: 0 },
    { playerId: 3, predicted: 0, played: 0, wins: 0, losses: 0, draws: 0, points: 0 },
    { playerId: 4, predicted: 0, played: 0, wins: 0, losses: 0, draws: 0, points: 0 },
    { playerId: 5, predicted: 0, played: 0, wins: 0, losses: 0, draws: 0, points: 0 },
    { playerId: 6, predicted: 0, played: 0, wins: 0, losses: 0, draws: 0, points: 0 },
    { playerId: 7, predicted: 0, played: 0, wins: 0, losses: 0, draws: 0, points: 0 },
    { playerId: 8, predicted: 0, played: 0, wins: 0, losses: 0, draws: 0, points: 0 },
    { playerId: 9, predicted: 0, played: 0, wins: 0, losses: 0, draws: 0, points: 0 },
    { playerId: 10, predicted: 0, played: 0, wins: 0, losses: 0, draws: 0, points: 0 },
    { playerId: 12, predicted: 0, played: 0, wins: 0, losses: 0, draws: 0, points: 0 },
    { playerId: 13, predicted: 0, played: 0, wins: 0, losses: 0, draws: 0, points: 0 },
  ],
};

// Match history for player profile view (placeholder — no results yet)
export const MATCH_HISTORY_SAMPLE_W3 = [];

// Cumulative points per week for the race chart
export const CUMULATIVE_POINTS = PLAYERS.map((player) => {
  const weeks = [0];
  let total = 0;
  for (let w = 1; w <= 3; w++) {
    const weekData = WEEKLY_DATA[w];
    if (weekData) {
      const playerWeek = weekData.find((d) => d.playerId === player.id);
      total += playerWeek ? playerWeek.points : 0;
    }
    weeks.push(total);
  }
  return { playerId: player.id, name: player.name, weeks };
});

// Team prediction frequency (placeholder — no results yet)
export const TEAM_PREDICTIONS_SAMPLE = [
  { team: 'CSK', count: 0 },
  { team: 'MI', count: 0 },
  { team: 'KKR', count: 0 },
  { team: 'RCB', count: 0 },
  { team: 'GT', count: 0 },
  { team: 'DC', count: 0 },
  { team: 'SRH', count: 0 },
  { team: 'PBKS', count: 0 },
  { team: 'RR', count: 0 },
  { team: 'LSG', count: 0 },
];

// Match schedule per week (sample: weeks 1-3)
export const MATCH_SCHEDULE = {
  1: [
    { matchNum: 1,  home: 'RCB',  away: 'SRH',  date: '28-Mar' },
    { matchNum: 2,  home: 'MI',   away: 'KKR',  date: '29-Mar' },
    { matchNum: 3,  home: 'RR',   away: 'CSK',  date: '30-Mar' },
    { matchNum: 4,  home: 'PBKS', away: 'GT',   date: '31-Mar' },
    { matchNum: 5,  home: 'LSG',  away: 'DC',   date: '1-Apr'  },
    { matchNum: 6,  home: 'KKR',  away: 'SRH',  date: '2-Apr'  },
    { matchNum: 7,  home: 'CSK',  away: 'PBKS', date: '3-Apr'  },
    { matchNum: 8,  home: 'DC',   away: 'MI',   date: '4-Apr'  },
    { matchNum: 9,  home: 'GT',   away: 'RR',   date: '4-Apr'  },
  ],
  2: [
    { matchNum: 8,  home: 'SRH',  away: 'DC',   winner: 'SRH'  },
    { matchNum: 9,  home: 'PBKS', away: 'GT',   winner: 'GT'   },
    { matchNum: 10, home: 'RR',   away: 'LSG',  winner: 'LSG'  },
    { matchNum: 11, home: 'MI',   away: 'RCB',  winner: 'RCB'  },
    { matchNum: 12, home: 'KKR',  away: 'CSK',  winner: 'KKR'  },
    { matchNum: 13, home: 'DC',   away: 'GT',   winner: 'GT'   },
    { matchNum: 14, home: 'SRH',  away: 'RR',   winner: 'SRH'  },
    { matchNum: 15, home: 'LSG',  away: 'PBKS', winner: 'LSG'  },
  ],
  3: [
    { matchNum: 16, home: 'RCB',  away: 'DC',   winner: 'RCB'  },
    { matchNum: 17, home: 'CSK',  away: 'MI',   winner: 'CSK'  },
    { matchNum: 18, home: 'RCB',  away: 'KKR',  winner: 'KKR'  },
    { matchNum: 19, home: 'DC',   away: 'SRH',  winner: 'SRH'  },
    { matchNum: 20, home: 'GT',   away: 'LSG',  winner: 'GT'   },
    { matchNum: 21, home: 'PBKS', away: 'RR',   winner: null   }, // no result
    { matchNum: 22, home: 'MI',   away: 'RCB',  winner: 'MI'   },
    { matchNum: 23, home: 'SRH',  away: 'CSK',  winner: 'CSK'  },
    { matchNum: 24, home: 'KKR',  away: 'DC',   winner: 'KKR'  },
  ],
};

// All players' predictions per match per week
// Shape: { [weekNum]: { [playerId]: { [matchNum]: predictedTeam } } }
export const ALL_PREDICTIONS = {
  1: {
    // Real Week 1 predictions from Google Form (Round 1 - Lappa 2026)
    1:  { 1:'SRH', 2:'MI',  3:'CSK', 4:'PBKS', 5:'DC',  6:'SRH', 7:'PBKS', 8:'DC',  9:'GT'  }, // Aditya (Adi)
    2:  { 1:'RCB', 2:'MI',  3:'CSK', 4:'PBKS', 5:'DC',  6:'SRH', 7:'PBKS', 8:'MI',  9:'GT'  }, // Aman
    3:  { 1:'RCB', 2:'MI',  3:'RR',  4:'GT',   5:'DC',  6:'SRH', 7:'PBKS', 8:'DC',  9:'GT'  }, // Deepanshu (Pincha)
    4:  { 1:'RCB', 2:'MI',  3:'CSK', 4:'GT',   5:'DC',  6:'SRH', 7:'CSK',  8:'MI',  9:'GT'  }, // Rajjo
    5:  { 1:'RCB', 2:'MI',  3:'RR',  4:'PBKS', 5:'DC',  6:'SRH', 7:'PBKS', 8:'DC',  9:'GT'  }, // Shaan
    6:  { 1:'SRH', 2:'MI',  3:'CSK', 4:'GT',   5:'DC',  6:'SRH', 7:'PBKS', 8:'DC',  9:'GT'  }, // Shivek
    7:  { 1:'RCB', 2:'MI',  3:'CSK', 4:'GT',   5:'DC',  6:'KKR', 7:'CSK',  8:'MI',  9:'GT'  }, // Shubham (Gungun)
    8:  { 1:'RCB', 2:'MI',  3:'RR',  4:'GT',   5:'LSG', 6:'KKR', 7:'CSK',  8:'MI',  9:'GT'  }, // Sudarshan (Suddi)
    9:  { 1:'RCB', 2:'KKR', 3:'RR',  4:'PBKS', 5:'LSG', 6:'KKR', 7:'PBKS', 8:'MI',  9:'RR'  }, // Suyash
    10: { 1:'RCB', 2:'MI',  3:'RR',  4:'PBKS', 5:'DC',  6:'SRH', 7:'CSK',  8:'MI',  9:'GT'  }, // Tushar
    12: { 1:'RCB', 2:'MI',  3:'CSK', 4:'PBKS', 5:'DC',  6:'SRH', 7:'CSK',  8:'MI',  9:'GT'  }, // Vikrant
    13: { 1:'RCB', 2:'KKR', 3:'CSK', 4:'PBKS', 5:'DC',  6:'SRH', 7:'PBKS', 8:'DC',  9:'GT'  }, // Vipul
  },
  2: {
    1:  { 8:'DC',   9:'GT',   10:'LSG', 11:'RCB', 12:'KKR', 13:'GT',  14:'RR',  15:'PBKS' },
    2:  { 8:'SRH',  9:'PBKS', 10:'RR',  11:'MI',  12:'CSK', 13:'DC',  14:'SRH', 15:'LSG'  },
    3:  { 8:'SRH',  9:'GT',   10:'LSG', 11:'RCB', 12:'KKR', 13:'GT',  14:'SRH', 15:'LSG'  },
    4:  { 8:'DC',   9:'PBKS', 10:'RR',  11:'MI',  12:'CSK', 13:'DC',  14:'RR',  15:'PBKS' },
    5:  { 8:'SRH',  9:'GT',   10:'LSG', 11:'RCB', 12:'KKR', 13:'GT',  14:'SRH', 15:'LSG'  },
    6:  { 8:'DC',   9:'PBKS', 10:'RR',  11:'MI',  12:'CSK', 13:'DC',  14:'RR',  15:'PBKS' },
    7:  { 8:'SRH',  9:'GT',   10:'LSG', 11:'RCB', 12:'KKR', 13:'GT',  14:'SRH', 15:'LSG'  },
    8:  { 8:'DC',   9:'PBKS', 10:'RR',  11:'MI',  12:'CSK', 13:'DC',  14:'RR',  15:'PBKS' },
    9:  { 8:'SRH',  9:'GT',   10:'LSG', 11:'RCB', 12:'KKR', 13:'GT',  14:'SRH', 15:'LSG'  },
    10: { 8:'DC',   9:'PBKS', 10:'RR',  11:'MI',  12:'KKR', 13:'DC',  14:'RR',  15:'PBKS' },
    12: { 8:'DC',   9:'PBKS', 10:'RR',  11:'MI',  12:'CSK', 13:'DC',  14:'RR',  15:'PBKS' },
    13: { 8:'SRH',  9:'GT',   10:'LSG', 11:'MI',  12:'KKR', 13:'DC',  14:'SRH', 15:'PBKS' },
  },
  3: {
    1:  { 16:'RCB', 17:'CSK', 18:'KKR', 19:'DC',  20:'GT',  21:'RR',  22:'MI',  23:'SRH', 24:'KKR' },
    2:  { 16:'DC',  17:'CSK', 18:'KKR', 19:'SRH', 20:'GT',  21:'PBKS',22:'MI',  23:'CSK', 24:'KKR' },
    3:  { 16:'RCB', 17:'MI',  18:'RCB', 19:'DC',  20:'LSG', 21:'RR',  22:'RCB', 23:'CSK', 24:'DC'  },
    4:  { 16:'RCB', 17:'CSK', 18:'KKR', 19:'DC',  20:'GT',  21:'RR',  22:'MI',  23:'SRH', 24:'KKR' },
    5:  { 16:'DC',  17:'MI',  18:'RCB', 19:'SRH', 20:'GT',  21:'PBKS',22:'MI',  23:'CSK', 24:'KKR' },
    6:  { 16:'RCB', 17:'CSK', 18:'KKR', 19:'SRH', 20:'GT',  21:'RR',  22:'MI',  23:'SRH', 24:'KKR' },
    7:  { 16:'DC',  17:'CSK', 18:'RCB', 19:'DC',  20:'LSG', 21:'PBKS',22:'RCB', 23:'CSK', 24:'DC'  },
    8:  { 16:'RCB', 17:'MI',  18:'KKR', 19:'SRH', 20:'GT',  21:'RR',  22:'MI',  23:'CSK', 24:'KKR' },
    9:  { 16:'DC',  17:'CSK', 18:'RCB', 19:'DC',  20:'GT',  21:'PBKS',22:'RCB', 23:'SRH', 24:'DC'  },
    10: { 16:'RCB', 17:'MI',  18:'KKR', 19:'SRH', 20:'LSG', 21:'RR',  22:'MI',  23:'CSK', 24:'KKR' },
    12: { 16:'RCB', 17:'MI',  18:'KKR', 19:'SRH', 20:'GT',  21:'RR',  22:'RCB', 23:'CSK', 24:'KKR' },
    13: { 16:'DC',  17:'CSK', 18:'RCB', 19:'DC',  20:'LSG', 21:'PBKS',22:'MI',  23:'SRH', 24:'DC'  },
  },
};

// Helper: get sorted leaderboard for a week
export function getWeeklyLeaderboard(weekNum) {
  const data = WEEKLY_DATA[weekNum];
  if (!data) return [];
  return data
    .map((d) => ({
      ...d,
      player: PLAYERS.find((p) => p.id === d.playerId),
    }))
    .sort((a, b) => b.points - a.points || b.wins - a.wins)
    .map((d, i) => ({ ...d, rank: i + 1 }));
}

// Helper: get stage leaderboard (aggregate weeks)
export function getStageLeaderboard(stage) {
  const weeks = STAGES[stage].weeks;
  const aggregated = {};
  PLAYERS.forEach((p) => {
    aggregated[p.id] = { playerId: p.id, player: p, predicted: 0, played: 0, wins: 0, losses: 0, draws: 0, points: 0, weeklyWins: 0 };
  });
  weeks.forEach((w) => {
    const lb = getWeeklyLeaderboard(w);
    if (lb.length === 0) return;
    if (lb[0]) aggregated[lb[0].playerId].weeklyWins++;
    lb.forEach((row) => {
      const agg = aggregated[row.playerId];
      agg.predicted += row.predicted;
      agg.played += row.played;
      agg.wins += row.wins;
      agg.losses += row.losses;
      agg.draws += row.draws;
      agg.points += row.points;
    });
  });
  return Object.values(aggregated)
    .sort((a, b) => b.points - a.points || b.wins - a.wins)
    .map((d, i) => ({ ...d, rank: i + 1 }));
}

// Helper: get overall leaderboard
export function getOverallLeaderboard() {
  return getStageLeaderboard('STAGE_1'); // Only Stage 1 data exists in sample
}
