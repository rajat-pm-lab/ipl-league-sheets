#!/usr/bin/env node
// Syncs Weekly Winners/ → public/certificates/ and generates manifest.json
// Filename convention: "Week N Winner Name.jpg" or "Week N Runner Up Name.jpg"

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'Weekly Winners');
const DEST_DIR = path.join(ROOT, '02-prototype/ill-dashboard/public/certificates');

fs.mkdirSync(DEST_DIR, { recursive: true });

// If source dir doesn't exist, write empty manifest and exit cleanly
if (!fs.existsSync(SRC_DIR)) {
  fs.writeFileSync(path.join(DEST_DIR, 'manifest.json'), '[]');
  console.log('sync-certs: Weekly Winners/ not found, wrote empty manifest');
  process.exit(0);
}

const files = fs.readdirSync(SRC_DIR).filter((f) => /\.(jpg|jpeg|png)$/i.test(f));

const byWeek = {};

for (const file of files) {
  // Match "Week 1 Winner Shan.jpg" or "Week 1 Runner Up Deepanshu.jpg"
  const winnerMatch = file.match(/week\s+(\d+)\s+winner\s+(.+)\.(jpg|jpeg|png)/i);
  const runnerMatch = file.match(/week\s+(\d+)\s+runner\s+up\s+(.+)\.(jpg|jpeg|png)/i);

  if (winnerMatch) {
    const week = parseInt(winnerMatch[1], 10);
    const name = winnerMatch[2].trim();
    const ext = winnerMatch[3].toLowerCase();
    const destName = `week-${week}-winner.${ext === 'jpeg' ? 'jpg' : ext}`;
    fs.copyFileSync(path.join(SRC_DIR, file), path.join(DEST_DIR, destName));
    if (!byWeek[week]) byWeek[week] = { week };
    byWeek[week].winner = { name, file: `/certificates/${destName}` };

  } else if (runnerMatch) {
    const week = parseInt(runnerMatch[1], 10);
    const name = runnerMatch[2].trim();
    const ext = runnerMatch[3].toLowerCase();
    const destName = `week-${week}-runner-up.${ext === 'jpeg' ? 'jpg' : ext}`;
    fs.copyFileSync(path.join(SRC_DIR, file), path.join(DEST_DIR, destName));
    if (!byWeek[week]) byWeek[week] = { week };
    byWeek[week].runnerUp = { name, file: `/certificates/${destName}` };
  }
}

const manifest = Object.values(byWeek).sort((a, b) => a.week - b.week);
fs.writeFileSync(path.join(DEST_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));

console.log(`sync-certs: ${manifest.length} week(s) synced →`, manifest.map((m) => `Week ${m.week}`).join(', '));
