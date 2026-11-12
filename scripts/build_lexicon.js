/**
 * Open Lexicon Foundation — Hindi Lexicon & Wordlist ETL Pipeline
 * Normalizes Devanagari Unicode (NFC), parses full IndoWordNet (noun/verb/adj/adv)
 * with definitions, synset synonyms, antonym pointers & examples, merges hindi-hunspell,
 * and generates JSON, JSONL, CSV, Wordlist, Hunspell .dic/.aff & Web Chunks.
 */
const fs = require('fs');
const path = require('path');

const RAW_DIR = process.env.RAW_HI_DIR || path.resolve(__dirname, '../../../raw/hi');
const DIST_DIR = path.resolve(__dirname, '../dist');
const CHUNKS_DIR = path.join(DIST_DIR, 'chunks');

fs.mkdirSync(CHUNKS_DIR, { recursive: true });

// Strict Devanagari Unicode cleaning & NFC normalization
function cleanHindiWord(str) {
  if (!str) return '';
  let s = String(str)
    .replace(/\uFEFF/g, '')
    .replace(/_/g, ' ')
    .normalize('NFC')
    .replace(/[\u200B\u200E\u200F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Strip surrounding punctuation
  s = s.replace(/^[,;।|.!?'\"()\-\[\]]+|[,;।|.!?'\"()\-\[\]]+$/g, '').trim();

  // Must contain Devanagari letters (\u0904-\u0939, \u0958-\u0961) and no ASCII digits/Latin
  if (!/[\u0904-\u0939\u0958-\u0961]/.test(s)) return '';
  if (/[A-Za-z0-9]/.test(s)) return '';
  if (s.length > 60) return '';
  return s;
}

function isPureSingleHindiToken(word) {
  return /^[\u0900-\u097F\u200C\u200D]+$/.test(word);
}

const posFiles = [
  { file: 'data.noun', pos: 'noun' },
  { file: 'data.verb', pos: 'verb' },
  { file: 'data.adj', pos: 'adjective' },
  { file: 'data.adv', pos: 'adverb' }
];

const synsetsByKey = new Map(); // `${pos}:${offset}` -> { words, def, examples, antonymKeys }
const lexiconMap = new Map();
const pureWordSet = new Set();

function getOrCreateEntry(word) {
  if (!lexiconMap.has(word)) {
    lexiconMap.set(word, {
      word,
      pos: new Set(),
      defs: new Set(),
      synonyms: new Set(),
      antonyms: new Set(),
      examples: new Set(),
      sources: new Set()
    });
  }
  return lexiconMap.get(word);
}

console.log('1. Parsing IndoWordNet (wordnet-hi) synsets...');
const wnDir = path.join(RAW_DIR, 'wordnet-hi/package/db');

for (const { file, pos } of posFiles) {
  const fpath = path.join(wnDir, file);
  if (!fs.existsSync(fpath)) continue;
  const lines = fs.readFileSync(fpath, 'utf8').split('\n');
  for (const line of lines) {
    if (!line || line.startsWith('  ')) continue;
    const pipeIdx = line.indexOf('|');
    if (pipeIdx === -1) continue;

    const metaTokens = line.substring(0, pipeIdx).trim().split(/\s+/);
    const glossary = line.substring(pipeIdx + 1).trim();
    if (metaTokens.length < 4) continue;

    const offset = metaTokens[0];
    const rawWords = metaTokens[3].split(':').map(cleanHindiWord).filter(Boolean);
    if (rawWords.length === 0) continue;

    // Scan lexical antonym pointers (e.g. 1223/1224/2224/3224/4224 <4hex> <8digitOffset>)
    const antonymOffsets = [];
    for (let i = 5; i < metaTokens.length - 2; i++) {
      const sym = metaTokens[i];
      if (/^[1-4]22[34]$/.test(sym) && /^[0-9a-fA-F]{4}$/.test(metaTokens[i + 1]) && /^\d{8}$/.test(metaTokens[i + 2])) {
        antonymOffsets.push(`${pos}:${metaTokens[i + 2]}`);
      }
    }

    // Split definition and example sentence in glossary (usually def:"example")
    let def = glossary;
    let example = '';
    const quoteSplit = glossary.match(/^([\s\S]*?):\s*"([\s\S]*?)"\s*$/);
    if (quoteSplit) {
      def = quoteSplit[1].trim();
      example = quoteSplit[2].trim();
    }

    synsetsByKey.set(`${pos}:${offset}`, {
      pos,
      words: rawWords,
      def,
      example,
      antonymOffsets
    });
  }
}

console.log(`→ Parsed ${synsetsByKey.size} WordNet synsets. Resolving synonyms & antonyms...`);

for (const syn of synsetsByKey.values()) {
  const antWords = [];
  for (const antKey of syn.antonymOffsets) {
    const targetSyn = synsetsByKey.get(antKey);
    if (targetSyn) {
      for (const aw of targetSyn.words) antWords.push(aw);
    }
  }

  for (const w of syn.words) {
    const entry = getOrCreateEntry(w);
    entry.pos.add(syn.pos);
    if (syn.def) entry.defs.add(syn.def);
    if (syn.example && entry.examples.size < 2) entry.examples.add(syn.example);
    for (const s of syn.words) {
      if (s !== w) entry.synonyms.add(s);
    }
    for (const a of antWords) {
      if (a !== w) entry.antonyms.add(a);
    }
    entry.sources.add('IndoWordNet');
    pureWordSet.add(w);
  }
}

console.log('2. Merging & normalizing hindi-hunspell (hi_IN.txt & hi_IN.dic)...');
const hiTxtPath = path.join(RAW_DIR, 'hindi-hunspell/Hindi/hi_IN.txt');
if (fs.existsSync(hiTxtPath)) {
  const lines = fs.readFileSync(hiTxtPath, 'utf8').split('\n');
  for (const line of lines) {
    const w = cleanHindiWord(line);
    if (w && isPureSingleHindiToken(w)) {
      pureWordSet.add(w);
    }
  }
}

const hiDicPath = path.join(RAW_DIR, 'hindi-hunspell/Hindi/hi_IN.dic');
if (fs.existsSync(hiDicPath)) {
  const lines = fs.readFileSync(hiDicPath, 'utf8').split('\n').slice(1);
  for (const line of lines) {
    const baseWord = line.split('/')[0];
    const w = cleanHindiWord(baseWord);
    if (w && isPureSingleHindiToken(w)) {
      pureWordSet.add(w);
    }
  }
}

// Copy hi_IN.aff if available
const hiAffPath = path.join(RAW_DIR, 'hindi-hunspell/Hindi/hi_IN.aff');
if (fs.existsSync(hiAffPath)) {
  fs.copyFileSync(hiAffPath, path.join(DIST_DIR, 'hi_IN.aff'));
}

console.log(`→ Rich Dictionary Entries: ${lexiconMap.size}`);
console.log(`→ Total Verified Unique NFC Hindi Words: ${pureWordSet.size}`);

// Build structured entries
const richEntries = [];
let idx = 1;
const sortedWords = Array.from(lexiconMap.keys()).sort((a, b) => a.localeCompare(b, 'hi'));
for (const word of sortedWords) {
  const e = lexiconMap.get(word);
  richEntries.push({
    id: `hi-${String(idx++).padStart(6, '0')}`,
    word: e.word,
    pos: Array.from(e.pos),
    def: Array.from(e.defs).slice(0, 3),
    synonyms: Array.from(e.synonyms).slice(0, 10),
    antonyms: Array.from(e.antonyms).slice(0, 6),
    examples: Array.from(e.examples).slice(0, 2),
    sources: Array.from(e.sources)
  });
}

// Export 1: JSONL (partitioned into <=30MB files for optimal GitHub storage)
const mid = Math.ceil(richEntries.length / 2);
fs.writeFileSync(
  path.join(DIST_DIR, 'hindi_lexicon_rich_part1.jsonl'),
  richEntries.slice(0, mid).map(e => JSON.stringify(e)).join('\n') + '\n',
  'utf8'
);
fs.writeFileSync(
  path.join(DIST_DIR, 'hindi_lexicon_rich_part2.jsonl'),
  richEntries.slice(mid).map(e => JSON.stringify(e)).join('\n') + '\n',
  'utf8'
);

// Export 2: Compact JSON partitioned (<35MB per file)
fs.writeFileSync(path.join(DIST_DIR, 'hindi_lexicon_rich_part1.json'), JSON.stringify(richEntries.slice(0, mid)), 'utf8');
fs.writeFileSync(path.join(DIST_DIR, 'hindi_lexicon_rich_part2.json'), JSON.stringify(richEntries.slice(mid)), 'utf8');

// Export 2b: POS-split files for NLP workflows
const byPosDir = path.join(DIST_DIR, 'by_pos');
fs.mkdirSync(byPosDir, { recursive: true });
for (const posName of ['noun', 'verb', 'adjective', 'adverb']) {
  const subset = richEntries.filter(e => e.pos.includes(posName));
  fs.writeFileSync(
    path.join(byPosDir, `hindi_${posName}.jsonl`),
    subset.map(e => JSON.stringify(e)).join('\n') + '\n',
    'utf8'
  );
}

// Export 3: CSV (partitioned <=25MB per file)
const csvEscape = v => `"${String(v).replace(/"/g, '""')}"`;
const csvHeader = 'id,word,pos,definition,synonyms,antonyms,example';
const toCsvRow = e => [
  e.id,
  e.word,
  e.pos.join('; '),
  e.def.join(' | '),
  e.synonyms.join('; '),
  e.antonyms.join('; '),
  e.examples.join(' | ')
].map(csvEscape).join(',');

fs.writeFileSync(
  path.join(DIST_DIR, 'hindi_lexicon_core_part1.csv'),
  '\uFEFF' + [csvHeader, ...richEntries.slice(0, mid).map(toCsvRow)].join('\n') + '\n',
  'utf8'
);
fs.writeFileSync(
  path.join(DIST_DIR, 'hindi_lexicon_core_part2.csv'),
  '\uFEFF' + [csvHeader, ...richEntries.slice(mid).map(toCsvRow)].join('\n') + '\n',
  'utf8'
);

// Export 4: Master Verified Wordlist (.txt)
const allSortedWords = Array.from(pureWordSet).sort((a, b) => a.localeCompare(b, 'hi'));
fs.writeFileSync(path.join(DIST_DIR, 'hindi_wordlist_verified.txt'), allSortedWords.join('\n') + '\n', 'utf8');

// Export 5: Hunspell .dic
fs.writeFileSync(
  path.join(DIST_DIR, 'hi_IN.dic'),
  `${allSortedWords.length}\n${allSortedWords.join('\n')}\n`,
  'utf8'
);

// Export 6: Alphabetical Web Chunks
const chunkBuckets = new Map();
for (const e of richEntries) {
  const firstChar = Array.from(e.word)[0] || 'other';
  const code = firstChar.codePointAt(0).toString(16);
  if (!chunkBuckets.has(code)) chunkBuckets.set(code, { char: firstChar, items: [] });
  chunkBuckets.get(code).items.push(e);
}
const chunkManifest = [];
for (const [code, bucket] of chunkBuckets.entries()) {
  const fname = `hi_${code}.json`;
  fs.writeFileSync(path.join(CHUNKS_DIR, fname), JSON.stringify(bucket.items), 'utf8');
  chunkManifest.push({ char: bucket.char, code, file: fname, count: bucket.items.length });
}
chunkManifest.sort((a, b) => a.char.localeCompare(b.char, 'hi'));
fs.writeFileSync(path.join(CHUNKS_DIR, 'manifest.json'), JSON.stringify(chunkManifest, null, 2), 'utf8');

// Export 7: Stats
const stats = {
  language: 'Hindi (हिन्दी)',
  iso_639_1: 'hi',
  rich_entries: richEntries.length,
  total_verified_words: allSortedWords.length,
  with_definitions: richEntries.filter(e => e.def.length > 0).length,
  with_synonyms: richEntries.filter(e => e.synonyms.length > 0).length,
  with_antonyms: richEntries.filter(e => e.antonyms.length > 0).length,
  with_examples: richEntries.filter(e => e.examples.length > 0).length,
  chunk_files: chunkManifest.length,
  unicode_normalization: 'NFC',
  license: 'GPL-3.0',
  generated_at: new Date().toISOString()
};
fs.writeFileSync(path.join(DIST_DIR, 'stats.json'), JSON.stringify(stats, null, 2), 'utf8');
console.log('✅ Hindi Lexicon Build Complete!', stats);
