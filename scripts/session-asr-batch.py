"""Run on the existing NVIDIA environment with CUDA_VISIBLE_DEVICES=1.
Reuses its audited asr_test helpers; loads Parakeet only once for the batch.
"""
import json, sys, time
from pathlib import Path
from asr_test import load_model, extract_audio, get_media_duration, transcribe_file, write_json, DEFAULT_MODEL

jobs=json.loads(Path(sys.argv[1]).read_text())
out=Path('session-output');out.mkdir(exist_ok=True)
model=load_model(model_name=DEFAULT_MODEL,long_form=False)
for job in jobs:
    dest=out/(job['id']+'.json')
    if dest.exists():
        print('cached',job['id'],flush=True)
        continue
    try:
        started=time.monotonic()
        video=Path(job['mediaFile']);wav=out/(job['id']+'.wav')
        duration=get_media_duration(video)
        extract_audio(video_path=video,wav_path=wav)
        segments=transcribe_file(model=model,audio_path=wav,batch_size=1)
        if not segments: raise RuntimeError('No ASR segments')
        write_json(segments=segments,output_path=dest,video_path=video,model_name=DEFAULT_MODEL,duration=duration)
        print(json.dumps({'id':job['id'],'status':'transcribed','seconds':round(time.monotonic()-started,2),'duration':duration,'segments':len(segments)}),flush=True)
        wav.unlink()
    except Exception as exc:
        (out/(job['id']+'.error.json')).write_text(json.dumps({'id':job['id'],'error':str(exc)}))
        print('failed',job['id'],str(exc),flush=True)
