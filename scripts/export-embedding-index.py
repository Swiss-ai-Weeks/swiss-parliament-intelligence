"""Exports a validated embeddings SQLite into a compact serving index for CPU search.

Writes, next to OUTPUT_PREFIX:
  .i8        N x 1024 int8 vectors (round(v * 127)); cosine ranking is preserved to within quantisation error
  .ids.jsonl one line per vector: [passageId, chunk, startChar, endChar]
  .json      manifest: model, revision, count, dimensions, source SHA-256, per-file SHA-256
Usage: python export-embedding-index.py EMBEDDINGS.sqlite OUTPUT_PREFIX
"""
import hashlib, json, sqlite3, sys
import numpy as np

source, prefix = sys.argv[1:3]
db = sqlite3.connect(source)
model, revision, dims = db.execute('SELECT model, revision, dimensions FROM embeddings LIMIT 1').fetchone()
count = db.execute('SELECT count(*) FROM embeddings').fetchone()[0]
vectors = np.lib.format.open_memmap(prefix + '.tmp.npy', mode='w+', dtype=np.int8, shape=(count, dims))
with open(prefix + '.ids.jsonl', 'w', encoding='utf-8') as ids:
    for i, (pid, chunk, start, end, blob) in enumerate(db.execute('SELECT id, chunk, start_char, end_char, vector FROM embeddings ORDER BY rowid')):
        v = np.frombuffer(blob, dtype='<f4')
        vectors[i] = np.clip(np.rint(v * 127), -127, 127).astype(np.int8)
        ids.write(json.dumps([pid, chunk, start, end]) + '\n')
vectors.flush()
np.asarray(vectors).tofile(prefix + '.i8')
del vectors
import os; os.remove(prefix + '.tmp.npy')


def sha(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for block in iter(lambda: f.read(1 << 22), b''):
            h.update(block)
    return h.hexdigest()


receipt = json.loads(db.execute("SELECT value FROM run_metadata WHERE key='receipt'").fetchone()[0])
manifest = {'model': model, 'revision': revision, 'dimensions': dims, 'count': count, 'quantisation': 'int8 = round(float32 * 127)',
            'queryModel': 'Xenova/multilingual-e5-large (ONNX export of the same weights; prefix "query: ")',
            'embeddingReceipt': receipt, 'files': {'vectors': sha(prefix + '.i8'), 'ids': sha(prefix + '.ids.jsonl')}}
with open(prefix + '.json', 'w') as f:
    json.dump(manifest, f, indent=2)
print(json.dumps({k: manifest[k] for k in ('count', 'dimensions', 'files')}))
