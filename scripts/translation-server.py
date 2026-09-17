"""Private GPU translation service. Start with CUDA_VISIBLE_DEVICES=1.
No application texts are logged. Uses NVIDIA's documented language-pair prompt.
"""
import json, threading, time
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
import torch
from huggingface_hub import model_info
from transformers import AutoTokenizer, AutoModelForCausalLM
from langdetect import detect_langs, DetectorFactory
DetectorFactory.seed=0
MODEL='nvidia/Riva-Translate-4B-Instruct-v2'
pin=Path('translation-model-revision.json')
saved=json.loads(pin.read_text()) if pin.exists() else {}
REVISION=saved.get('revision') if saved.get('model')==MODEL else model_info(MODEL).sha
Path('translation-model-revision.json').write_text(json.dumps({'model':MODEL,'revision':REVISION}))
tokenizer=AutoTokenizer.from_pretrained(MODEL,revision=REVISION)
model=AutoModelForCausalLM.from_pretrained(MODEL,revision=REVISION,torch_dtype=torch.bfloat16).to('cuda').eval()
lock=threading.Lock()
class Handler(BaseHTTPRequestHandler):
    def log_message(self,*args): pass
    def reply(self,status,data):
        raw=json.dumps(data,ensure_ascii=False).encode();self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(raw)));self.end_headers();self.wfile.write(raw)
    def do_GET(self):
        self.reply(200,{'status':'ready','model':MODEL,'revision':REVISION}) if self.path=='/health' else self.reply(404,{'error':'NOT_FOUND'})
    def do_POST(self):
        if self.path!='/translate':return self.reply(404,{'error':'NOT_FOUND'})
        try:
            size=int(self.headers.get('Content-Length','0'))
            if not 0<size<=30000:return self.reply(413,{'error':'REQUEST_SIZE'})
            data=json.loads(self.rfile.read(size));source=data['source'];target=data['target'];text=data['text']
            if source not in ['en','de','fr','it'] or target not in ['en','de','fr','it'] or not isinstance(text,str) or not 0<len(text)<=10000:return self.reply(400,{'error':'INVALID_REQUEST'})
            if not lock.acquire(blocking=False):return self.reply(429,{'error':'TRANSLATOR_BUSY'})
            try:
                start=time.monotonic()
                if source==target:translated=text
                else:
                    translated=text
                    # The evaluated model directions are any↔English. Make the pivot explicit.
                    directions=[(source,'en'),('en',target)] if source!='en' and target!='en' else [(source,target)]
                    for src,tgt in directions:
                        messages=[{'role':'system','content':src+'-'+tgt},{'role':'user','content':translated}]
                        prompt=tokenizer.apply_chat_template(messages,tokenize=False,add_generation_prompt=True)
                        inputs=tokenizer(prompt,return_tensors='pt').to('cuda')
                        if inputs.input_ids.shape[1]>5000:return self.reply(413,{'error':'TEXT_TOO_LONG'})
                        with torch.inference_mode():output=model.generate(**inputs,max_new_tokens=2500,do_sample=False,pad_token_id=tokenizer.eos_token_id)
                        translated=tokenizer.decode(output[0][inputs.input_ids.shape[1]:],skip_special_tokens=True).strip()
                        if output.shape[1]-inputs.input_ids.shape[1]>=2500:return self.reply(502,{'error':'TRANSLATION_TRUNCATED'})
                detected=detect_langs(translated)
                if len(translated)>80 and detected[0].lang!=target and detected[0].prob>.85:return self.reply(502,{'error':'TARGET_LANGUAGE_MISMATCH'})
                self.reply(200,{'text':translated,'source':source,'target':target,'pivot':'en' if source!='en' and target!='en' and source!=target else None,'detectedLanguage':detected[0].lang,'model':MODEL,'revision':REVISION,'latencyMs':round((time.monotonic()-start)*1000)})
            finally:lock.release()
        except Exception:self.reply(500,{'error':'TRANSLATION_FAILED'})
print('Riva Translate ready on 127.0.0.1:30082',flush=True)
ThreadingHTTPServer(('127.0.0.1',30082),Handler).serve_forever()
