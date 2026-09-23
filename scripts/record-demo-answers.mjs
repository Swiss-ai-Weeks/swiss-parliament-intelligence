// Runs the prepared demo questions against the live model and records verified answers to
// config/demo-answers.json. Usage: node --env-file-if-exists=.env scripts/record-demo-answers.mjs [--runs=2] [--only=id]
import {readFileSync,writeFileSync,existsSync,renameSync} from 'node:fs';
import {resolve} from 'node:path';
import {openParliament} from '../server/parliament.mjs';
import {answerParliament} from '../server/parliament-ai.mjs';
import {readArchiveCoverage} from '../server/archive-coverage.mjs';

const root=resolve(import.meta.dirname,'..'),arg=name=>process.argv.find(a=>a.startsWith(`--${name}=`))?.split('=')[1];
const runs=Number(arg('runs')||2),only=arg('only');
if(!process.env.INFERENCE_BASE_URL||!process.env.INFERENCE_MODEL)throw new Error('LIVE_MODEL_REQUIRED');
const {questions}=JSON.parse(readFileSync(resolve(root,'config/demo-questions.json'),'utf8'));
const target=resolve(root,'config/demo-answers.json');
const previous=existsSync(target)?JSON.parse(readFileSync(target,'utf8')).answers:[];
const c=readArchiveCoverage(root),coverage=c.status==='declared'?{textSessions:c.totals.sessionsWithText,totalSessions:c.totals.sessions,fromYear:c.totals.firstYearWithText,toYear:c.boundary.toYear}:null;
const store=openParliament(resolve(root,'data/parliament.sqlite'));
const answers=new Map(previous.map(a=>[a.id,a])),report=[];
for(const q of questions.filter(q=>!only||q.id===only)){
 let kept=null;const attempts=[];
 for(let i=0;i<runs;i++){
  const started=performance.now(),answer=await answerParliament(store,{question:q.question,language:q.language},process.env,fetch,{coverage});
  const seconds=Math.round(performance.now()-started)/1000,videos=(answer.citations||[]).filter(x=>x.video).length;
  attempts.push({status:answer.status,synthesis:answer.synthesis?.status||null,citations:answer.citations?.length||0,videos,seconds});
  const good=q.expect==='refused'?answer.status==='refused':answer.status==='ok'&&answer.answer?.lead;
  if(good&&(!kept||videos>((kept.answer.citations||[]).filter(x=>x.video).length)))kept={id:q.id,question:q.question,language:q.language,recordedAt:new Date().toISOString(),model:process.env.INFERENCE_MODEL,seconds,answer};
 }
 if(kept)answers.set(q.id,kept);
 report.push({id:q.id,recorded:Boolean(kept),attempts});
}
store.close();
const temporary=target+'.tmp';writeFileSync(temporary,JSON.stringify({generatedAt:new Date().toISOString(),note:'Live answers recorded for demonstration fallback only; replayed with a visible label when the model is unavailable.',answers:[...answers.values()]},null,1));renameSync(temporary,target);
console.log(JSON.stringify(report,null,1));
