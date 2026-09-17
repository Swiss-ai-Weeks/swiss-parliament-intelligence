"""Language-constrained NVIDIA Canary ASR; keep receipts separate from Parakeet."""
import json,sys,time,hashlib
from pathlib import Path
from nemo.collections.asr.models import ASRModel
from asr_test import extract_audio,get_media_duration
model=ASRModel.from_pretrained(model_name='nvidia/canary-1b-v2').cuda().eval()
jobs=json.loads(Path(sys.argv[1]).read_text());out=Path('session-output');out.mkdir(exist_ok=True)
for job in jobs:
    dest=out/(job['id']+'-canary.json');media=Path(job['mediaFile'])
    sha=hashlib.sha256(media.read_bytes()).hexdigest()
    assert sha==job['mediaSha256']
    if dest.exists() and json.loads(dest.read_text()).get('mediaSha256')==sha:continue
    started=time.monotonic();wav=out/(job['id']+'-canary.wav')
    try:
        extract_audio(video_path=media,wav_path=wav)
        result=model.transcribe([str(wav)],source_lang=job['language'],target_lang=job['language'],timestamps=True,batch_size=1)[0]
        words=[{'word':w['word'],'start':float(w['start']),'end':float(w['end'])} for w in result.timestamp['word']]
        data={'model':'nvidia/canary-1b-v2','mediaSha256':sha,'language':job['language'],'duration_seconds':get_media_duration(media),'text':result.text,'segments':[{'text':result.text,'words':words}],'processingSeconds':round(time.monotonic()-started,2)}
        dest.write_text(json.dumps(data,ensure_ascii=False));print(job['id'],job['language'],len(words),'words',data['processingSeconds'],'seconds',flush=True)
    except Exception as e:
        (out/(job['id']+'-canary-error.json')).write_text(json.dumps({'error':str(e)}));print(job['id'],type(e).__name__,str(e),flush=True)
