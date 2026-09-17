"""Run on the GPU host; preserve upload and processing receipts for one official recording."""
import json,time,uuid,sys,hashlib
from pathlib import Path
import requests
record=sys.argv[1] if len(sys.argv)>1 else '374406'
assert record.isdigit()
media=Path('parliament-'+record+'.mp4');out=Path('session-output');out.mkdir(exist_ok=True)
receipt=out/(record+'-vss.json')
state=json.loads(receipt.read_text()) if receipt.exists() else {'record':record,'sha256':hashlib.sha256(media.read_bytes()).hexdigest()}
assert state['sha256']==hashlib.sha256(media.read_bytes()).hexdigest()
def save():receipt.write_text(json.dumps(state,indent=2))
if 'upload' not in state:
    with media.open('rb') as f:
        r=requests.post('http://172.16.0.237:30888/vst/api/v1/storage/file',files={'mediaFile':(media.name,f,'video/mp4')},data={'filename':media.name,'metadata':json.dumps({'timestamp':'2026-06-01T00:00:00'})},headers={'nvstreamer-chunk-number':'1','nvstreamer-total-chunks':'1','nvstreamer-is-last-chunk':'true','nvstreamer-identifier':str(uuid.uuid4()),'nvstreamer-file-name':media.name},timeout=180)
    r.raise_for_status();state['upload']=r.json();save()
sensor=state['upload']['sensorId'];start=time.monotonic()
r=requests.post('http://127.0.0.1:8000/api/v1/videos/'+sensor+'/complete',json={**state['upload'],'filename':media.name},timeout=660)
state['httpStatus']=r.status_code;state['latencySeconds']=round(time.monotonic()-start,2)
try:state['processing']=r.json()
except ValueError:state['error']=r.text[:2000]
save();print(json.dumps(state,indent=2));r.raise_for_status()
