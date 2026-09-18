"""GPU batch index of official text only; resumable SQLite vectors and source hashes."""
import json,sys,sqlite3,time,hashlib
from pathlib import Path
import torch
from transformers import AutoTokenizer,AutoModel
MODEL='intfloat/multilingual-e5-large'
REVISION='3d7cfbdacd47fdda877c5cd8a79fbcc4f2a574f3'
source,destination=sys.argv[1:3]
tokenizer=AutoTokenizer.from_pretrained(MODEL,revision=REVISION)
model=AutoModel.from_pretrained(MODEL,revision=REVISION,use_safetensors=True).to('cuda').eval()
revision=model.config._commit_hash
db=sqlite3.connect(destination)
db.executescript('''CREATE TABLE IF NOT EXISTS embeddings (id TEXT,chunk INTEGER,source_hash TEXT,model TEXT,revision TEXT,dimensions INTEGER,start_char INTEGER,end_char INTEGER,vector BLOB,metadata TEXT,PRIMARY KEY(id,chunk));
CREATE TABLE IF NOT EXISTS completed (id TEXT PRIMARY KEY,source_hash TEXT,model TEXT,revision TEXT,chunks INTEGER);
CREATE TABLE IF NOT EXISTS run_metadata (key TEXT PRIMARY KEY,value TEXT);''')
rows=[json.loads(x) for x in Path(source).read_text().splitlines() if x.strip()]
started=time.time();done=0
for row in rows:
    known=db.execute('SELECT source_hash,model,revision FROM completed WHERE id=?',(row['id'],)).fetchone()
    if known==(row['sha256'],MODEL,revision):done+=1;continue
    text=row['text'];prefix='passage: '
    tokens=tokenizer(prefix+text,max_length=512,truncation=True,stride=64,return_overflowing_tokens=True,return_offsets_mapping=True,padding=True,return_tensors='pt')
    offsets=tokens.pop('offset_mapping');tokens.pop('overflow_to_sample_mapping')
    vectors=[]
    with torch.inference_mode():
        for i in range(0,len(tokens['input_ids']),16):
            batch={k:v[i:i+16].to('cuda') for k,v in tokens.items()}
            with torch.autocast('cuda',dtype=torch.bfloat16):
                hidden=model(**batch).last_hidden_state
                mask=batch['attention_mask'][...,None];pooled=(hidden*mask).sum(1)/mask.sum(1)
            vectors.extend(torch.nn.functional.normalize(pooled.float(),p=2,dim=1).cpu().numpy())
    with db:
        db.execute('DELETE FROM embeddings WHERE id=?',(row['id'],))
        for i,vector in enumerate(vectors):
            meaningful=[(max(0,int(a)-len(prefix)),max(0,int(b)-len(prefix))) for a,b in offsets[i] if b>a and b>len(prefix)]
            start=min(a for a,b in meaningful);end=max(b for a,b in meaningful)
            db.execute('INSERT INTO embeddings VALUES(?,?,?,?,?,?,?,?,?,?)',(row['id'],i,row['sha256'],MODEL,revision,len(vector),start,end,vector.astype('<f4').tobytes(),json.dumps({k:v for k,v in row.items() if k!='text'},ensure_ascii=False)))
        db.execute('INSERT OR REPLACE INTO completed VALUES(?,?,?,?,?)',(row['id'],row['sha256'],MODEL,revision,len(vectors)))
    done+=1
    if done%100==0:print(json.dumps({'completed':done,'total':len(rows),'seconds':round(time.time()-started)}),flush=True)
with db:
    db.execute('INSERT OR REPLACE INTO run_metadata VALUES(?,?)',('receipt',json.dumps({'model':MODEL,'revision':revision,'sourceSha256':hashlib.sha256(Path(source).read_bytes()).hexdigest(),'passages':len(rows),'seconds':round(time.time()-started),'gpu':torch.cuda.get_device_name(0)})))
print(json.dumps({'status':'complete','passages':done,'chunks':db.execute('SELECT count(*) FROM embeddings').fetchone()[0]}),flush=True)
db.close()
