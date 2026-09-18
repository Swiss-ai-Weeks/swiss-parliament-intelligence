"""Frozen seed evaluation: BM25, pinned multilingual E5, equal-weight RRF. No live writes."""
import json,sqlite3,time,hashlib,re,unicodedata,math
from collections import Counter
from pathlib import Path
import numpy as np
import torch
from transformers import AutoTokenizer,AutoModel
MODEL='intfloat/multilingual-e5-large';REV='3d7cfbdacd47fdda877c5cd8a79fbcc4f2a574f3'
source=Path('reviewed-input.jsonl');casesfile=Path('party-retrieval-cases.json')
docs={r['id']:r for r in map(json.loads,source.read_text().splitlines())}
cases=json.loads(casesfile.read_text())
db=sqlite3.connect('party-reviewed-embeddings.sqlite')
rows=db.execute('SELECT id,vector,source_hash,start_char,end_char FROM embeddings WHERE model=? AND revision=?',(MODEL,REV)).fetchall()
assert set(r[0] for r in rows)==set(docs)
assert all(docs[r[0]]['sha256']==r[2] for r in rows)
vectors=np.stack([np.frombuffer(r[1],dtype='<f4') for r in rows])
def terms(text):
 return re.findall(r'[^\W_]+',''.join(c for c in unicodedata.normalize('NFKD',text.lower()) if not unicodedata.combining(c)))
# Score the SAME chunks for both rankers, then collapse by document before RRF.
bags=[Counter(terms(docs[r[0]]['text'][r[3]:r[4]])) for r in rows]
lengths=[sum(b.values()) for b in bags];average=sum(lengths)/len(lengths)
df=Counter(t for b in bags for t in b)
def lexical(question):
 return [sum(math.log(1+(len(bags)-df[t]+.5)/(df[t]+.5))*b[t]*2.2/(b[t]+1.2*(.25+.75*lengths[i]/average)) for t in set(terms(question)) if b[t]) for i,b in enumerate(bags)]
def collapse(scores,positive=False):
 best={}
 for row,score in zip(rows,scores):
  if positive and score<=0:continue
  best[row[0]]=max(best.get(row[0],-float('inf')),float(score))
 return sorted(best,key=lambda d:(-best[d],d))
tokenizer=AutoTokenizer.from_pretrained(MODEL,revision=REV)
model=AutoModel.from_pretrained(MODEL,revision=REV,use_safetensors=True).cuda().eval()
results=[]
for case in cases:
 start=time.perf_counter();bm=collapse(lexical(case['question']),True);bmms=(time.perf_counter()-start)*1000
 start=time.perf_counter();batch=tokenizer('query: '+case['question'],return_tensors='pt',truncation=True,max_length=512).to('cuda')
 with torch.inference_mode():
  hidden=model(**batch).last_hidden_state;mask=batch['attention_mask'][...,None]
  query=torch.nn.functional.normalize((hidden*mask).sum(1)/mask.sum(1),p=2,dim=1).cpu().numpy()[0]
 scores=vectors@query;dense=collapse(scores);densems=(time.perf_counter()-start)*1000
 start=time.perf_counter();rrf={d:0. for d in docs}
 for ranking in [bm,dense]:
  for rank,d in enumerate(ranking,1):rrf[d]+=1/(60+rank)
 hybrid=sorted(rrf,key=lambda d:(-rrf[d],d));rrfms=(time.perf_counter()-start)*1000
 rankings={'bm25':bm,'dense':dense,'hybrid':hybrid};metrics={}
 for name,ranking in rankings.items():
  rank=next((i for i,d in enumerate(ranking,1) if d in case['relevant']),None)
  metrics[name]={'top3':ranking[:3],'hitAt1':rank==1,'hitAt3':rank is not None and rank<=3,'reciprocalRank':1/rank if rank else 0}
 results.append({**case,'rankings':metrics,'latencyMs':{'bm25':round(bmms,2),'dense':round(densems,2),'hybridTotal':round(bmms+densems+rrfms,2)},'topDenseScore':round(float(max(scores)),4)})
positive=[r for r in results if r['relevant']]
summary={name:{metric:round(sum(r['rankings'][name][metric] for r in positive)/len(positive),4) for metric in ['hitAt1','hitAt3','reciprocalRank']} for name in ['bm25','dense','hybrid']}
report={'model':MODEL,'revision':REV,'gpu':torch.cuda.get_device_name(0),'documents':len(docs),'chunks':len(rows),'corpusSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'casesSha256':hashlib.sha256(casesfile.read_bytes()).hexdigest(),'scope':'Agent-authored known-topic seed benchmark; no independent adjudication. BM25 has accent normalization only, no translation/stemming/stopwords. First query includes warm-up. All documents ranked; no tuned cutoff. Six unsupported probes diagnose similarity, NOT calibrated abstention. No production activation.','summary':summary,'results':results}
Path('party-hybrid-benchmark.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({'documents':len(docs),'chunks':len(rows),'supported':len(positive),'unsupported':len(results)-len(positive),'summary':summary}))
