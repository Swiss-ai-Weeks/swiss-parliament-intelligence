// Compares lexical retrieval with hybrid (lexical + E5 semantic) on topic questions that name no proposal.
// Relevance proxy: a selected passage counts as on-topic when its proposal title or its text contains one of
// the topic's official-language terms. Retrieval only: no answer generation, so the model cost is small.
// Usage: node --env-file-if-exists=.env scripts/evaluate-hybrid-retrieval.mjs
import {resolve} from 'node:path';
import {openParliament} from '../server/parliament.mjs';
import {answerParliament} from '../server/parliament-ai.mjs';
import {semanticSearch} from '../server/semantic-search.mjs';
import {embedQuery} from '../server/query-embedding.mjs';

const root=resolve(import.meta.dirname,'..');
const cases=[
 ['What did speakers say about childcare costs?',/accueil extrafamilial|garde d.enfants|kinderbetreuung|crèche|custodia/i],
 ['How should rising health insurance premiums be handled?',/prime|assurance-maladie|krankenkasse|premi/i],
 ['What was said about regulating the wolf?',/loup|wolf|lupo/i],
 ['What are the concerns about housing shortages and rents?',/logement|loyer|wohnung|miete|allogg/i],
 ['How should the AHV pension be financed?',/AVS|AHV|rente|vieillesse/i],
 ['What did Parliament say about cyberattacks?',/cyber/i],
 ['What was said about protecting bees and pesticides?',/abeille|pesticide|biene|pestizid|api /i],
 ['How can Switzerland reduce food waste?',/gaspillage|food waste|lebensmittelverschwendung|spreco/i]];
const store=openParliament(resolve(root,'data/parliament.sqlite'));
// Retrieval only: stub the model after retrieval so no answers are generated.
const env={...process.env};
const semantic=(text,opts)=>embedQuery(text).then(v=>semanticSearch(root,v,{...opts,env}));
const onTopic=(s,re)=>re.test((store.get('business',s.businessId)?.title||'')+' '+s.text);
const table=[];let totalLex=0,totalHyb=0;
for(const [question,topic] of cases){
 const row={question};
 for(const [mode,opts] of [['lexical',{}],['hybrid',{semantic}]]){
  const passages=await retrieve(question,opts);const hits=passages.filter(s=>onTopic(s,topic)).length;
  row[mode]=`${hits}/${passages.length}`;if(mode==='lexical')totalLex+=hits;else totalHyb+=hits;
 }
 table.push(row);console.log(JSON.stringify(row));
}
console.log(JSON.stringify({onTopicLexical:totalLex,onTopicHybrid:totalHyb,questions:cases.length}));
store.close();process.exit(0);

// Runs answerParliament up to evidence selection by failing the first generation call, which yields the
// selected passages with status sources-only.
async function retrieve(question,opts){
 const fetchImpl=async(url,o)=>{const name=JSON.parse(o.body).response_format?.json_schema?.name;if(name==='cited_answer')return {ok:false,status:503,json:async()=>({})};return fetch(url,o);};
 const a=await answerParliament(store,{question,language:'en',noBroaden:true},env,fetchImpl,{...opts});
 return a.passages||[];
}
