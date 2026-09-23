import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const directory = process.argv[2] || 'data/gpu-processing/session-output';
const jobs = new Map(
  JSON.parse(readFileSync('data/public-session-queue.json', 'utf8')).map((job) => [String(job.id), job]),
);
const database = new DatabaseSync('data/public-processing.sqlite');

database.exec(
  'CREATE TABLE IF NOT EXISTS transcripts(id TEXT PRIMARY KEY,session TEXT,model TEXT,media_sha256 TEXT,duration REAL,official_url TEXT,language TEXT,text TEXT,payload TEXT,imported_at TEXT)',
);
const save = database.prepare(
  "INSERT OR REPLACE INTO transcripts VALUES(?,?,?,?,?,?,?,?,?,datetime('now'))",
);

let imported = 0;
let legacySkipped = 0;
const rejected = [];

for (const name of readdirSync(directory)) {
  if (!/^\d+-canary\.json$/.test(name)) continue;

  const id = name.split('-')[0];
  const job = jobs.get(id);
  const receipt = JSON.parse(readFileSync(path.join(directory, name), 'utf8'));

  if (!receipt.officialPage || !receipt.sessionId) {
    legacySkipped += 1;
    continue;
  }
  if (
    !job ||
    receipt.officialPage !== job.officialPage ||
    receipt.sessionId !== job.sessionId ||
    receipt.language !== job.language ||
    !/^https:\/\/www\.parlament\.ch\//.test(receipt.officialPage)
  ) {
    throw new Error(`SOURCE_MISMATCH ${id}`);
  }

  const words = receipt.segments?.flatMap((segment) => segment.words || []);
  const invalidReceipt =
    !/^[a-f0-9]{64}$/.test(receipt.mediaSha256) ||
    !Number.isFinite(receipt.duration_seconds) ||
    receipt.duration_seconds <= 0 ||
    typeof receipt.text !== 'string' ||
    !receipt.text.trim() ||
    receipt.model !== 'nvidia/canary-1b-v2';
  const invalidWordTiming =
    !words?.length ||
    words.some(
      (word) =>
        !Number.isFinite(word.start) ||
        !Number.isFinite(word.end) ||
        word.start < 0 ||
        word.end < word.start ||
        word.end > receipt.duration_seconds + 1,
    );

  if (invalidReceipt || invalidWordTiming) {
    rejected.push({
      id,
      reason: invalidReceipt ? 'invalid-or-empty-receipt' : 'invalid-word-timing',
    });
    continue;
  }

  save.run(
    id,
    receipt.sessionId,
    receipt.model,
    receipt.mediaSha256,
    receipt.duration_seconds,
    receipt.officialPage,
    receipt.language,
    receipt.text,
    JSON.stringify(receipt),
  );
  imported += 1;
}

console.log(
  JSON.stringify({
    imported,
    rejected,
    legacySkipped,
    total: database.prepare('SELECT count(*) n FROM transcripts').get().n,
    scope: 'Public ASR receipts; not verified quotations or alignments',
  }),
);
database.close();
