const fs = require('fs');
const path = require('path');

const DIST_DIR = path.resolve(__dirname, '../dist');
const stats = JSON.parse(fs.readFileSync(path.join(DIST_DIR, 'stats.json'), 'utf8'));
const part1Path = path.join(DIST_DIR, 'hindi_lexicon_rich_part1.jsonl');
const part2Path = path.join(DIST_DIR, 'hindi_lexicon_rich_part2.jsonl');
const wlPath = path.join(DIST_DIR, 'hindi_wordlist_verified.txt');
const manifestPath = path.join(DIST_DIR, 'chunks/manifest.json');

let errors = 0;
const seenWords = new Set();

const lines = [
  ...fs.readFileSync(part1Path, 'utf8').trim().split('\n'),
  ...fs.readFileSync(part2Path, 'utf8').trim().split('\n')
];

if (lines.length !== stats.rich_entries) {
  console.error(`❌ Stats mismatch: stats=${stats.rich_entries}, lines=${lines.length}`);
  errors++;
}

for (let i = 0; i < lines.length; i++) {
  const entry = JSON.parse(lines[i]);
  if (!entry.id || !/^hi-\d{6}$/.test(entry.id)) {
    console.error(`❌ Invalid ID at line ${i + 1}: ${entry.id}`);
    errors++;
  }
  if (!entry.word || entry.word !== entry.word.normalize('NFC')) {
    console.error(`❌ Non-NFC word at line ${i + 1}: ${entry.word}`);
    errors++;
  }
  if (seenWords.has(entry.word)) {
    console.error(`❌ Duplicate rich entry at line ${i + 1}: ${entry.word}`);
    errors++;
  }
  seenWords.add(entry.word);
}

const wlLines = fs.readFileSync(wlPath, 'utf8').trim().split('\n');
const wlSet = new Set(wlLines);
if (wlLines.length !== wlSet.size) {
  console.error(`❌ Duplicate entries in wordlist: ${wlLines.length} vs ${wlSet.size}`);
  errors++;
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
for (const m of manifest) {
  if (!fs.existsSync(path.join(DIST_DIR, 'chunks', m.file))) {
    console.error(`❌ Missing chunk file: ${m.file}`);
    errors++;
  }
}

if (errors > 0) {
  console.error(`❌ Validation failed with ${errors} errors.`);
  process.exit(1);
}
console.log(`✅ Validation Passed! ${lines.length} rich entries, ${wlLines.length} NFC words, ${manifest.length} chunks verified.`);
