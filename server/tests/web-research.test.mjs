import test from 'node:test';
import assert from 'node:assert/strict';
import {parseWebResponse,webResearch,webResearchIntent,webResearchConfigured} from '../web-research.mjs';

const response={output:[
 {type:'web_search_call',action:{type:'search',query:'Swiss parliament winter session 2026'}},
 {type:'message',content:[{type:'output_text',text:'The winter session starts on 30 November 2026 and the programme is not yet published.',annotations:[
  {type:'url_citation',url:'https://www.parlament.ch/en/ratsbetrieb/sessions',title:'Sessions'},
  {type:'url_citation',url:'https://www.parlament.ch/en/ratsbetrieb/sessions',title:'Sessions'},
  {type:'url_citation',url:'javascript:alert(1)',title:'bad'}]}]}]};

test('web responses keep text and unique https sources only',()=>{
 const parsed=parseWebResponse(response);
 assert.match(parsed.text,/30 November 2026/);
 assert.deepEqual(parsed.sources,[{url:'https://www.parlament.ch/en/ratsbetrieb/sessions',title:'Sessions',publisher:'parlament.ch'}]);
 assert.deepEqual(parsed.queries,['Swiss parliament winter session 2026']);
});

test('routing sends news and upcoming questions to the web, not record questions',()=>{
 for(const q of ['What is the latest news on the neutrality initiative?','What will the next session discuss?','Quelles sont les actualités sur la votation ?','Was steht in der nächsten Session an?'])assert.equal(webResearchIntent(q),true,q);
 for(const q of ['What did Walder Nicolas say about permits?','What are the arguments for and against the 10-million initiative?'])assert.equal(webResearchIntent(q),false,q);
});

test('web research is off without a key and model, and never calls out',async()=>{
 let calls=0;const fetchImpl=async()=>{calls++;throw new Error('no network');};
 assert.equal(webResearchConfigured({}),false);
 assert.equal((await webResearch({question:'latest news',env:{},fetchImpl})).status,'not-configured');
 assert.equal(calls,0);
});

test('web research returns a labelled result in the requested language, or refuses mixed language',async()=>{
 const env={OPENAI_API_KEY:'test',WEB_RESEARCH_MODEL:'fixture-model'};let body;
 const fetchImpl=async(url,o)=>{body=JSON.parse(o.body);assert.equal(url,'https://api.openai.com/v1/responses');return {ok:true,json:async()=>response};};
 const web=await webResearch({question:'When is the next session?',language:'en',env,fetchImpl});
 assert.equal(web.status,'ok');assert.equal(web.label,'beyond-the-parliamentary-record');assert.equal(body.tools[0].type,'web_search');
 const french=await webResearch({question:'Quand est la prochaine session ?',language:'fr',env,fetchImpl});
 assert.equal(french.status,'language-check-failed');
});
