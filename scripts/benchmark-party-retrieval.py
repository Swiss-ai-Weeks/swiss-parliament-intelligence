"""Bounded staging smoke test, not an independently adjudicated retrieval evaluation."""
import json,sqlite3,time,sys
from pathlib import Path
import numpy as np
import torch
from transformers import AutoTokenizer,AutoModel
MODEL='intfloat/multilingual-e5-large';REV='3d7cfbdacd47fdda877c5cd8a79fbcc4f2a574f3'
db=sqlite3.connect('party-staging-embeddings.sqlite')
rows=db.execute('SELECT id,vector FROM embeddings WHERE model=? AND revision=?',(MODEL,REV)).fetchall()
vectors=np.stack([np.frombuffer(r[1],dtype='<f4') for r in rows])
tokenizer=AutoTokenizer.from_pretrained(MODEL,revision=REV)
model=AutoModel.from_pretrained(MODEL,revision=REV,use_safetensors=True).cuda().eval()
cases=[
 ('sp-programme',['History of the Socialist Party programme','Histoire du programme du Parti socialiste','Geschichte des sozialdemokratischen Parteiprogramms']),
 ('udc-formation',['Education research and private innovation','Formation recherche et innovation privée','Bildung Forschung und private Innovation']),
 ('plr-exterieur',['Bilateral relations with the European Union','Relations bilatérales avec l’Union européenne','Bilaterale Beziehungen zur Europäischen Union']),
 ('centre-valeurs',['Freedom solidarity responsibility and national cohesion','Liberté solidarité responsabilité et cohésion nationale','Freiheit Solidarität Verantwortung und nationaler Zusammenhalt']),
 ('verts-portrait',['Ecology human rights and sustainable economy','Écologie droits humains et économie durable','Ökologie Menschenrechte und nachhaltige Wirtschaft'])
]
out=[]
for expected,questions in cases:
 for language,question in zip(['en','fr','de'],questions):
  start=time.time();batch=tokenizer('query: '+question,return_tensors='pt',truncation=True,max_length=512).to('cuda')
  with torch.inference_mode():
   hidden=model(**batch).last_hidden_state;mask=batch['attention_mask'][...,None]
   query=torch.nn.functional.normalize((hidden*mask).sum(1)/mask.sum(1),p=2,dim=1).cpu().numpy()[0]
  scores=vectors@query;ranked=[]
  for i in np.argsort(-scores):
   if rows[i][0] not in [r['id'] for r in ranked]:ranked.append({'id':rows[i][0],'score':round(float(scores[i]),4)})
  out.append({'question':question,'language':language,'expectedDocument':expected,'top3':ranked[:3],'hitAt1':ranked[0]['id']==expected,'hitAt3':expected in [r['id'] for r in ranked[:3]],'ms':round((time.time()-start)*1000)})
report={'model':MODEL,'revision':REV,'gpu':torch.cuda.get_device_name(0),'scope':'15 known-topic seed queries over six staged documents; not a broad retrieval benchmark or human review','results':out}
Path('party-retrieval-smoke.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({'queries':len(out),'hitAt1':sum(r['hitAt1'] for r in out),'hitAt3':sum(r['hitAt3'] for r in out)}))
