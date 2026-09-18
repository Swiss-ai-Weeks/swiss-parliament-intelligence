"""Preserve full Cosmos embedding arrays, since the VSS completion route returns only counts."""
import json,time,sys
from pathlib import Path
import requests
for record in (sys.argv[1:] or ['374406','374407','374574']):
    assert record.isdigit()
    p=Path('session-output')/(record+'-vss.json');state=json.loads(p.read_text())
    output=Path('session-output')/(record+'-embeddings.json')
    if output.exists():continue
    r=requests.post('http://127.0.0.1:8017/v1/generate_video_embeddings',json={'id':state['upload']['sensorId'],'url':'https://par-pcache.simplex.tv/content/simvid_1.mp4?externalid='+record,'model':'cosmos-embed1-448p','chunk_duration':5},timeout=600)
    r.raise_for_status();result=r.json();assert result.get('chunk_responses')
    output.write_text(json.dumps(result));print(record,len(result['chunk_responses']),'embedding chunks preserved',flush=True)
