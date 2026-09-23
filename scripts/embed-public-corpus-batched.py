"""Batched GPU index of official text; same output contract as embed-public-corpus.py.

The original script embeds one passage at a time (~77 passages/s). This version tokenises thousands of
passages at once, sorts overflow windows by length, runs large bf16 micro-batches and commits per chunk,
so ~1.1M passages fit in well under an hour on one H100. Rows, pooling, prefix, window stride, text
offsets, metadata and the resumable `completed` table are unchanged, so validate-public-embeddings.mjs
applies as before.

Usage: python embed-public-corpus-batched.py INPUT.jsonl OUTPUT.sqlite [--chunk 8192] [--batch 256]
"""
import argparse, hashlib, json, sqlite3, sys, time
from pathlib import Path
import torch
from transformers import AutoModel, AutoTokenizer

MODEL = 'intfloat/multilingual-e5-large'
REVISION = '3d7cfbdacd47fdda877c5cd8a79fbcc4f2a574f3'
PREFIX = 'passage: '

parser = argparse.ArgumentParser()
parser.add_argument('source'); parser.add_argument('destination')
parser.add_argument('--chunk', type=int, default=8192); parser.add_argument('--batch', type=int, default=256)
args = parser.parse_args()

tokenizer = AutoTokenizer.from_pretrained(MODEL, revision=REVISION)
model = AutoModel.from_pretrained(MODEL, revision=REVISION, use_safetensors=True).to('cuda').eval()
revision = model.config._commit_hash
if revision != REVISION:
    sys.exit(f'REVISION_MISMATCH {revision}')

db = sqlite3.connect(args.destination)
db.executescript('''PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;
CREATE TABLE IF NOT EXISTS embeddings (id TEXT,chunk INTEGER,source_hash TEXT,model TEXT,revision TEXT,dimensions INTEGER,start_char INTEGER,end_char INTEGER,vector BLOB,metadata TEXT,PRIMARY KEY(id,chunk));
CREATE TABLE IF NOT EXISTS completed (id TEXT PRIMARY KEY,source_hash TEXT,model TEXT,revision TEXT,chunks INTEGER);
CREATE TABLE IF NOT EXISTS run_metadata (key TEXT PRIMARY KEY,value TEXT);''')
known = {row[0]: row[1] for row in db.execute('SELECT id, source_hash FROM completed WHERE model=? AND revision=?', (MODEL, revision))}


def embed_chunk(rows):
    texts = [PREFIX + r['text'] for r in rows]
    enc = tokenizer(texts, max_length=512, truncation=True, stride=64, return_overflowing_tokens=True,
                    return_offsets_mapping=True, padding=False)
    owners = enc['overflow_to_sample_mapping']
    windows = list(range(len(enc['input_ids'])))
    windows.sort(key=lambda i: len(enc['input_ids'][i]))  # length-sorted micro-batches waste little padding
    vectors = [None] * len(windows)
    with torch.inference_mode():
        for start in range(0, len(windows), args.batch):
            idx = windows[start:start + args.batch]
            batch = tokenizer.pad({'input_ids': [enc['input_ids'][i] for i in idx],
                                   'attention_mask': [enc['attention_mask'][i] for i in idx]}, return_tensors='pt')
            batch = {k: v.to('cuda') for k, v in batch.items()}
            with torch.autocast('cuda', dtype=torch.bfloat16):
                hidden = model(**batch).last_hidden_state
                mask = batch['attention_mask'][..., None]
                pooled = (hidden * mask).sum(1) / mask.sum(1)
            normed = torch.nn.functional.normalize(pooled.float(), p=2, dim=1).cpu().numpy()
            for j, i in enumerate(idx):
                vectors[i] = normed[j]
    per_row = {}
    for w, owner in enumerate(owners):
        meaningful = [(max(0, a - len(PREFIX)), max(0, b - len(PREFIX))) for a, b in enc['offset_mapping'][w] if b > a and b > len(PREFIX)]
        start_char = min(a for a, b in meaningful); end_char = max(b for a, b in meaningful)
        per_row.setdefault(owner, []).append((vectors[w], start_char, end_char))
    with db:
        for owner, windows_of_row in per_row.items():
            r = rows[owner]
            meta = json.dumps({k: v for k, v in r.items() if k != 'text'}, ensure_ascii=False)
            db.execute('DELETE FROM embeddings WHERE id=?', (r['id'],))
            db.executemany('INSERT INTO embeddings VALUES(?,?,?,?,?,?,?,?,?,?)', [
                (r['id'], c, r['sha256'], MODEL, revision, len(v), s, e, v.astype('<f4').tobytes(), meta)
                for c, (v, s, e) in enumerate(windows_of_row)])
            db.execute('INSERT OR REPLACE INTO completed VALUES(?,?,?,?,?)', (r['id'], r['sha256'], MODEL, revision, len(windows_of_row)))


started = time.time(); done = skipped = 0; pending = []
with open(args.source, encoding='utf-8') as source:
    for line in source:
        if not line.strip():
            continue
        row = json.loads(line)
        if known.get(row['id']) == row['sha256']:
            skipped += 1; continue
        pending.append(row)
        if len(pending) >= args.chunk:
            embed_chunk(pending); done += len(pending); pending = []
            elapsed = time.time() - started
            print(json.dumps({'embedded': done, 'skipped': skipped, 'seconds': round(elapsed), 'perSecond': round(done / max(elapsed, 1), 1)}), flush=True)
if pending:
    embed_chunk(pending); done += len(pending)

digest = hashlib.sha256()
with open(args.source, 'rb') as f:
    for block in iter(lambda: f.read(1 << 20), b''):
        digest.update(block)
total = db.execute('SELECT count(*) FROM completed').fetchone()[0]
with db:
    db.execute('INSERT OR REPLACE INTO run_metadata VALUES(?,?)', ('receipt', json.dumps({
        'model': MODEL, 'revision': revision, 'sourceSha256': digest.hexdigest(), 'passages': total,
        'seconds': round(time.time() - started), 'gpu': torch.cuda.get_device_name(0), 'script': 'embed-public-corpus-batched.py'})))
print(json.dumps({'status': 'complete', 'embedded': done, 'skipped': skipped, 'passages': total,
                  'chunks': db.execute('SELECT count(*) FROM embeddings').fetchone()[0], 'seconds': round(time.time() - started)}), flush=True)
db.close()
