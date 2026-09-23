import test from 'node:test';
import assert from 'node:assert/strict';
import {createModelFetch,DEFAULT_CATALOG_MODEL} from '../model-endpoint.mjs';

test('forced catalog rewrites the model, key and thinking switch; other URLs pass through',async()=>{
 const calls=[];const fetchImpl=async(url,options)=>{calls.push({url,options});return {status:200,ok:true};};
 const f=createModelFetch({INFERENCE_BASE_URL:'http://127.0.0.1:4319/v1',NVIDIA_API_KEY:'k',INFERENCE_PROVIDER:'nvidia-catalog'},fetchImpl);
 await f('http://127.0.0.1:4319/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'local',messages:[]})});
 const body=JSON.parse(calls[0].options.body);
 assert.equal(calls[0].url,'https://integrate.api.nvidia.com/v1/chat/completions');
 assert.equal(body.model,DEFAULT_CATALOG_MODEL);assert.equal(body.chat_template_kwargs.enable_thinking,false);
 assert.equal(calls[0].options.headers.Authorization,'Bearer k');assert.equal(f.route().provider,'nvidia-catalog');
 await f('https://example.test/other',{});assert.equal(calls[1].url,'https://example.test/other');
});

test('an unreachable GPU endpoint falls back to the catalog',async()=>{
 const urls=[];const fetchImpl=async url=>{urls.push(url);if(url.startsWith('http://127.0.0.1'))throw new TypeError('fetch failed');return {status:200,ok:true};};
 const f=createModelFetch({INFERENCE_BASE_URL:'http://127.0.0.1:4319/v1',NVIDIA_API_KEY:'k'},fetchImpl);
 await f('http://127.0.0.1:4319/v1/chat/completions',{method:'POST',body:'{}'});
 assert.deepEqual(urls,['http://127.0.0.1:4319/v1/chat/completions','https://integrate.api.nvidia.com/v1/chat/completions']);
});

test('an overloaded catalog model is retried on the secondary model',async()=>{
 const models=[];const fetchImpl=async(url,options)=>{const m=JSON.parse(options.body).model;models.push(m);return {status:models.length===1?503:200,ok:models.length>1};};
 const f=createModelFetch({INFERENCE_BASE_URL:'http://127.0.0.1:4319/v1',NVIDIA_API_KEY:'k',INFERENCE_PROVIDER:'nvidia-catalog'},fetchImpl);
 const r=await f('http://127.0.0.1:4319/v1/chat/completions',{method:'POST',body:'{}'});
 assert.equal(r.status,200);assert.equal(models.length,2);assert.notEqual(models[0],models[1]);
});
