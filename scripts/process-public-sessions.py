"""Resumable official recording queue; CUDA_VISIBLE_DEVICES selects the batch GPU."""
import json,sys,time,hashlib,re,shutil,subprocess,sqlite3
from pathlib import Path
from urllib.parse import urlparse
import requests
from nemo.collections.asr.models import ASRModel
jobs=json.loads(Path(sys.argv[1]).read_text());out=Path('session-output');out.mkdir(exist_ok=True)
db=sqlite3.connect('public-processing.sqlite')
db.execute('CREATE TABLE IF NOT EXISTS jobs(id TEXT PRIMARY KEY,session TEXT,state TEXT,receipt TEXT,error TEXT,updated TEXT)')
model=ASRModel.from_pretrained(model_name='nvidia/canary-1b-v2').cuda().eval()
for index,job in enumerate(jobs):
    ident=job['id'];assert ident.isdigit();session=job['sessionId'];receipt=out/(ident+'-canary.json');media=Path('parliament-'+ident+'.mp4')
    try:
        if receipt.exists():
            try:previous=json.loads(receipt.read_text())
            except (ValueError,OSError):previous={}
            if previous.get('mediaSha256') and previous.get('segments'):
                with db:db.execute('INSERT OR REPLACE INTO jobs VALUES(?,?,?,?,?,datetime("now"))',(ident,session,'complete',str(receipt),None))
                continue
        if job['language'] not in ['de','fr','it','en']:raise ValueError('UNSUPPORTED_LANGUAGE')
        if shutil.disk_usage('.').free<40*1024**3:raise RuntimeError('DISK_RESERVE_REACHED')
        if not media.exists():
            page=job['officialPage'];assert urlparse(page).hostname=='www.parlament.ch'
            r=requests.get(page,timeout=60);r.raise_for_status()
            match=re.search(r'"OnDemandDownloadUrl"\s*:\s*"([^"\n]+)"',r.text)
            if not match:raise ValueError('NO_OFFICIAL_RECORDING')
            url=json.loads('"'+match.group(1)+'"').replace('{0}',ident);parsed=urlparse(url)
            assert parsed.scheme=='https' and parsed.hostname=='par-pcache.simplex.tv'
            (out/(ident+'-source.html')).write_text(r.text)
            with requests.get(url,stream=True,timeout=(20,90)) as video:
                video.raise_for_status();assert 'video' in video.headers.get('content-type','')
                count=0;temp=media.with_suffix('.part')
                with temp.open('wb') as f:
                    for chunk in video.iter_content(1024*1024):
                        count+=len(chunk)
                        if count>2*1024**3:raise ValueError('RECORDING_SIZE_LIMIT')
                        f.write(chunk)
                temp.replace(media)
        sha=hashlib.file_digest(media.open('rb'),'sha256').hexdigest()
        duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(media)]))
        words=[];texts=[];start=time.time()
        # Bounded audio windows preserve the entire recording timeline.
        for offset in range(0,int(duration)+1,300):
            if duration-offset<.1:break
            wav=out/(ident+'-window.wav')
            subprocess.run(['ffmpeg','-v','error','-y','-ss',str(offset),'-i',str(media),'-t','300','-ac','1','-ar','16000',str(wav)],check=True)
            result=model.transcribe([str(wav)],source_lang=job['language'],target_lang=job['language'],timestamps=True,batch_size=1)[0]
            texts.append(result.text)
            words.extend({'word':w['word'],'start':float(w['start'])+offset,'end':float(w['end'])+offset} for w in result.timestamp['word'])
            wav.unlink()
        payload={'model':'nvidia/canary-1b-v2','mediaSha256':sha,'language':job['language'],'duration_seconds':duration,'text':' '.join(texts),'segments':[{'text':' '.join(texts),'words':words}],'processingSeconds':round(time.time()-start,2),'sessionId':session,'officialPage':job['officialPage']}
        temp_receipt=receipt.with_suffix('.tmp')
        temp_receipt.write_text(json.dumps(payload,ensure_ascii=False))
        temp_receipt.replace(receipt)
        with db:db.execute('INSERT OR REPLACE INTO jobs VALUES(?,?,?,?,?,datetime("now"))',(ident,session,'complete',str(receipt),None))
        print(json.dumps({'id':ident,'session':session,'completedQueuePosition':index+1,'total':len(jobs),'words':len(words)}),flush=True)
    except Exception as e:
        with db:db.execute('INSERT OR REPLACE INTO jobs VALUES(?,?,?,?,?,datetime("now"))',(ident,session,'failed',None,str(e)[:300]))
        print(json.dumps({'id':ident,'error':str(e)[:300]}),flush=True)
        if str(e)=='DISK_RESERVE_REACHED':break
db.close()
