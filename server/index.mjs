import {feedbackService} from './feedback.mjs';
import {allowedRequestOrigin} from './request-origin.mjs';
import {officialRecording} from './official-recording.mjs';
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStore } from './store.mjs';
import { createAuth } from './auth.mjs';
import {discover} from './discovery.mjs';
import {workspaceService} from './workspace.mjs';
import {readChamber} from './chambers.mjs';
import {accountStore} from './account-store.mjs';
import { research, markdownBrief, languages, actions } from './research.mjs';
import {openParliament} from './parliament.mjs';
import {answerParliament,compareStatements} from './parliament-ai.mjs';
import {syncPerson} from './profile-import.mjs';
import {draftMessage} from './message-draft.mjs';
import {translatePassage} from './translation.mjs';
import {searchVideo} from './video-search.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const fail=(code,status=400)=>Object.assign(new Error(code),{status});
async function body(req,limit=16384) {
  if(!String(req.headers['content-type']||'').startsWith('application/json')) throw fail('JSON_REQUIRED',415);
  let bytes=0;const chunks=[];for await(const c of req){bytes+=c.length;if(bytes>limit)throw fail('BODY_TOO_LARGE',413);chunks.push(c);}
  try {return JSON.parse(Buffer.concat(chunks).toString());}catch{throw fail('INVALID_JSON');}
}
export function createServer({store=createStore(path.join(root,'data/pilot.sqlite')),env=process.env,fetchImpl=fetch,authFile=':memory:'}={}) {
  const feedback=feedbackService(env,fetchImpl);
  const publicBase=(env.PUBLIC_BASE_PATH||'').replace(/\/$/,'');
  if(publicBase&&!/^\/[A-Za-z0-9_-]+$/.test(publicBase))throw new Error('INVALID_PUBLIC_BASE_PATH');
  const auth=createAuth(env,fetchImpl,{file:authFile}),items=accountStore(env,fetchImpl);const rates=new Map();
  const cookie=(name,value,age)=>`${name}=${value}; HttpOnly; SameSite=Lax; Path=${publicBase||'/'}; Max-Age=${age}${env.PUBLIC_ORIGIN?.startsWith('https:')?'; Secure':''}`;
  const signed=(res,result)=>json(res,200,{...result.user,status:result.status||'signed-in'},{'Set-Cookie':cookie('pilot_session',result.sid,result.expires)});
  let profileImportBusy=false;
  let parliament;const par=()=>parliament||(parliament=openParliament(path.join(root,'data/parliament.sqlite')));
  const workspace=workspaceService({par,fetchImpl,directory:path.join(root,'data/workspace')});
  const json=(res,status,data,headers={})=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers});res.end(JSON.stringify(data));};
  const server=http.createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
    try {
      const url=new URL(req.url,'http://localhost');
      if(publicBase&&url.pathname.split('/')[1]?.toLowerCase()===publicBase.slice(1).toLowerCase()&&!url.pathname.startsWith(publicBase)){res.writeHead(308,{Location:publicBase+url.pathname.slice(publicBase.length)+url.search});return res.end();}
      if(publicBase && url.pathname===publicBase){res.writeHead(308,{Location:publicBase+'/'+url.search});return res.end();}
      if(publicBase && !url.pathname.startsWith(publicBase+'/'))throw fail('NOT_FOUND',404);
      const p=url.pathname.slice(publicBase.length);
      if(req.method!=='GET' && !allowedRequestOrigin(req.headers.origin,env)) throw fail('ORIGIN_DENIED',403);
      if(req.method!=='GET') {const key=req.socket.remoteAddress;const now=Date.now();for(const [k,v]of rates)if(v.until<now)rates.delete(k);const rate=rates.get(key)||{count:0,until:now+60000};rate.count++;rates.set(key,rate);if(rate.count>40)throw fail('RATE_LIMITED',429);}
      if(p==='/api/feedback/challenge'&&req.method==='GET')return json(res,200,feedback.challenge(req.socket.remoteAddress));
      if(p==='/api/feedback'&&req.method==='POST')return json(res,200,await feedback.send(await body(req),req.socket.remoteAddress));
      if(p==='/api/discovery/search'&&req.method==='POST'){const b=await body(req);if(typeof b.question!=='string'||b.question.length>500)throw fail('INVALID_SEARCH');return json(res,200,discover(store,par(),b));}
      if(p==='/api/dashboard'&&req.method==='GET')return json(res,200,await workspace.dashboard());
      if(p==='/api/agenda'&&req.method==='GET')return json(res,200,await workspace.agenda());
      if(p==='/api/feed'&&req.method==='GET')return json(res,200,workspace.feed());
      if(p==='/api/broadcast'&&req.method==='GET')return json(res,200,workspace.broadcast());
      if(p==='/api/health'&&req.method==='GET')return json(res,200,{status:'ok',auth:auth.configured,ai:env.DEMO_REPLAY_FILE?'recorded-replay':env.INFERENCE_BASE_URL&&env.INFERENCE_MODEL?'configured-not-verified':'editorial-extracts',identity:'concept',videoCount:store.listDossiers().reduce((n,d)=>n+store.listEvidence(d.id).filter(e=>e.kind==='video').length,0)});
      if(p==='/api/dossiers'&&req.method==='GET')return json(res,200,store.listDossiers());
      if(p.startsWith('/api/chambers/')&&req.method==='GET')return json(res,200,readChamber(p.slice(14),url.searchParams.get('version')||undefined));
      if(p==='/api/parliament'&&req.method==='GET')return json(res,200,{...par().overview(),businesses:par().listBusinesses(),people:par().people()});
      if(p==='/api/parliament/profile-refresh'&&req.method==='POST'){const b=await body(req);if(typeof b.personId!=='string'||!/^\d{1,6}$/.test(b.personId)||!par().person(b.personId))throw fail('UNKNOWN_PERSON',404);if(profileImportBusy)throw fail('IMPORT_BUSY',409);profileImportBusy=true;try{return json(res,200,await syncPerson(par(),b.personId,{fetchImpl,rawDir:path.join(root,'data/parliament/raw')}));}catch{throw fail('OFFICIAL_PROFILE_IMPORT_FAILED',502);}finally{profileImportBusy=false;}}
      if(p==='/api/parliament/draft'&&req.method==='POST'){const b=await body(req);if(typeof b.topic!=='string'||!b.topic.trim()||b.topic.length>1500||!languages.includes(b.language||'en'))throw fail('INVALID_REQUEST');const person=par().person(b.personId);if(!person)throw fail('NOT_FOUND',404);try{return json(res,200,await draftMessage(person,b,env,fetchImpl));}catch{throw fail('DRAFT_MODEL_UNAVAILABLE',502);}}
      if(p.startsWith('/api/parliament/business/')&&req.method==='GET'){const d=par().business(p.split('/').pop());if(!d)throw fail('NOT_FOUND',404);return json(res,200,d);}
      if(p.startsWith('/api/parliament/person/')&&req.method==='GET'){const d=par().person(p.split('/').pop());if(!d)throw fail('NOT_FOUND',404);return json(res,200,d);}
      if(p==='/api/parliament/read'&&req.method==='GET')return json(res,200,par().readDebate(Object.fromEntries(url.searchParams)));
      if(p==='/api/parliament/recording'&&req.method==='GET'){const speech=par().get('speech',url.searchParams.get('id')||'');if(!speech)throw fail('NOT_FOUND',404);return json(res,200,speech.video?{status:'available',scope:'aligned-passage',clip:speech.video}:await officialRecording(speech,fetchImpl));}
      if(p==='/api/parliament/context'&&req.method==='GET'){const context=par().passageContext(url.searchParams.get('id')||'');if(!context)throw fail('NOT_FOUND',404);return json(res,200,context);}
      if(p==='/api/parliament/search'&&req.method==='GET')return json(res,200,par().search((url.searchParams.get('q')||'').slice(0,500),{businessId:url.searchParams.get('business'),personId:url.searchParams.get('person'),limit:20}));
      if(p==='/api/parliament/video-search'&&req.method==='POST'){const b=await body(req);if(typeof b.query!=='string'||!b.query.trim()||b.query.length>500||!['spoken','visual'].includes(b.mode))throw fail('INVALID_REQUEST');for(const k of ['personId','businessId'])if(b[k]!==undefined&&(typeof b[k]!=='string'||!/^\d+$/.test(b[k])))throw fail('INVALID_SCOPE');try{return json(res,200,await searchVideo({root:path.join(root,'data/parliament'),store:par(),query:b.query,mode:b.mode,personId:b.personId,businessId:b.businessId,env,fetchImpl}));}catch{throw fail('VIDEO_SEARCH_UNAVAILABLE',502);}}
      if(p==='/api/parliament/translate'&&req.method==='POST'){const b=await body(req);if(typeof b.evidenceId!=='string'||!languages.includes(b.language))throw fail('INVALID_REQUEST');const passage=par().get('speech',b.evidenceId);if(!passage)throw fail('NOT_FOUND',404);try{return json(res,200,await translatePassage(passage,b.language,env,fetchImpl));}catch(e){throw fail(e.status===429?'TRANSLATOR_BUSY':'TRANSLATION_UNAVAILABLE',e.status===429?429:502);}}
      if(p==='/api/parliament/ask'&&req.method==='POST'){const b=await body(req);if(typeof b.question!=='string'||!b.question.trim()||b.question.length>500||!languages.includes(b.language||'en'))throw fail('INVALID_REQUEST');try{return json(res,200,await answerParliament(par(),b,env,fetchImpl));}catch{throw fail('MODEL_UNAVAILABLE_OR_INVALID_OUTPUT',502);}}
      if(p==='/api/parliament/compare'&&req.method==='POST'){const b=await body(req);if(!Array.isArray(b.ids)||b.ids.length!==2||!languages.includes(b.language||'en'))throw fail('INVALID_REQUEST');const pair=b.ids.map(id=>par().get('speech',id));if(pair.some(x=>!x))throw fail('NOT_FOUND',404);try{return json(res,200,await compareStatements(...pair,b.language||'en',env,fetchImpl));}catch{throw fail('MODEL_UNAVAILABLE_OR_INVALID_OUTPUT',502);}}
      if(p.startsWith('/api/dossiers/')&&req.method==='GET'){const d=store.getDossier(decodeURIComponent(p.slice(14)));if(!d)throw fail('NOT_FOUND',404);return json(res,200,d);}
      if(p.startsWith('/api/evidence/')&&req.method==='GET'){const e=store.getEvidence(decodeURIComponent(p.slice(14)));if(!e)throw fail('NOT_FOUND',404);return json(res,200,e);}
      if(['/api/ask','/api/brief'].includes(p)&&req.method==='POST') {
        const b=await body(req);if(!languages.includes(b.language||'en')||!actions.includes(b.action||'explain')||typeof(b.question||'')!=='string'||(b.question||'').length>1000)throw fail('INVALID_REQUEST');
        const d=store.getDossier(b.dossierId);if(!d)throw fail('NOT_FOUND',404);
        if(p==='/api/brief'){if(!Array.isArray(b.evidenceIds)||b.evidenceIds.length<1||b.evidenceIds.length>30)throw fail('SELECT_EVIDENCE');const items=b.evidenceIds.map(id=>d.evidence.find(e=>e.id===id));if(items.some(e=>!e))throw fail('EVIDENCE_OUTSIDE_DOSSIER');return json(res,200,{markdown:markdownBrief(d,items,b.language)});}
        try{return json(res,200,await research(d,b,env,fetchImpl));}catch{throw fail('MODEL_UNAVAILABLE_OR_INVALID_OUTPUT',502);}
      }
      if(['/api/auth/login','/api/auth/signup'].includes(p)&&req.method==='POST') {
        const b=await body(req);if(typeof b.email!=='string'||!b.email.includes('@')||b.email.length>254||typeof b.password!=='string'||b.password.length<8||b.password.length>256)throw fail('INVALID_CREDENTIALS');
        if(b.name!==undefined&&(typeof b.name!=='string'||b.name.length>100))throw fail('INVALID_NAME');
        const result=p.endsWith('signup')?await auth.signup(b.email,b.password,b.name):await auth.login(b.email,b.password);
        return result.sid?signed(res,result):json(res,200,{status:result.status},{'Set-Cookie':cookie('pilot_oauth',result.flowId,3600)});
      }
      if(p==='/api/auth/providers'&&req.method==='GET')return json(res,200,await auth.providers());
      if(p==='/api/auth/recover'&&req.method==='POST'){const b=await body(req);if(typeof b.email!=='string'||!b.email.includes('@')||b.email.length>254)throw fail('INVALID_EMAIL');const r=await auth.recover(b.email);return json(res,200,{status:r.status},{'Set-Cookie':cookie('pilot_oauth',r.flowId,3600)});}
      if(p==='/api/auth/password'&&req.method==='POST'){const b=await body(req);if(typeof b.password!=='string'||b.password.length<8||b.password.length>256)throw fail('INVALID_PASSWORD');return json(res,200,await auth.password(req.headers.cookie,b.password));}
      if(p==='/api/auth/provider'&&req.method==='POST'){const b=await body(req);if(!['google','apple','discord','sso'].includes(b.provider))throw fail('INVALID_PROVIDER');if(!(await auth.providers())[b.provider])throw fail('PROVIDER_NOT_CONFIGURED',503);const r=b.provider==='sso'?await auth.sso():await auth.oauth(b.provider);return json(res,200,{url:r.url},{'Set-Cookie':cookie('pilot_oauth',r.id,600)});}
      if(p==='/api/auth/google'&&req.method==='POST'){if(!(await auth.providers()).google)throw fail('GOOGLE_NOT_CONFIGURED',503);const r=await auth.oauth();return json(res,200,{url:r.url},{'Set-Cookie':cookie('pilot_oauth',r.id,600)});}
      if(p==='/api/auth/callback'&&req.method==='GET'){const state=req.headers.cookie?.match(/(?:^|;\s*)pilot_oauth=([a-f0-9]{64})(?:;|$)/)?.[1];let cookies=[cookie('pilot_oauth','',0)],status='cancelled';try{if(state&&url.searchParams.get('code')){const r=await auth.exchange(url.searchParams.get('code'),state);cookies.push(cookie('pilot_session',r.sid,r.expires));status=r.mode==='recovery'?'reset':'complete';}}catch{status='failed';}res.writeHead(303,{Location:`${publicBase}/?view=dashboard&auth=${status}`,'Set-Cookie':cookies});return res.end();}
      if(p==='/api/auth/logout'&&req.method==='POST'){auth.logout(req.headers.cookie);return json(res,200,{status:'signed-out'},{'Set-Cookie':`pilot_session=; HttpOnly; SameSite=Lax; Path=${publicBase||'/'}; Max-Age=0`});}
      if(p==='/api/me'&&req.method==='GET')return json(res,200,await auth.user(req.headers.cookie));
      if(p.startsWith('/api/me/items/')&&['GET','POST','DELETE'].includes(req.method)){const s=await auth.session(req.headers.cookie),kind=p.slice('/api/me/items/'.length),b=req.method==='GET'?{}:await body(req,190000),id=req.method==='GET'?url.searchParams.get('id')||undefined:b.id;if(b.accountId&&b.accountId!==s.user.id)throw fail('ACCOUNT_CHANGED',409);if(req.method!=='GET'&&!id)throw fail('ITEM_ID_REQUIRED');return json(res,200,await items(s,kind,id,req.method,b.payload));}
      if(p==='/api/me/saved'){
        const session=await auth.session(req.headers.cookie),user=session.user;
        // Import only this authenticated user's legacy saves. IDs and ownership remain intact.
        const legacy=store.saved(user.id);for(const e of legacy){await items(session,'saved',e.id,'POST',{evidenceId:e.id,savedAt:e.savedAt});store.remove(user.id,e.id);}
        if(['POST','DELETE'].includes(req.method)){const b=await body(req);if(!store.getEvidence(b.evidenceId))throw fail('NOT_FOUND',404);await items(session,'saved',b.evidenceId,req.method,{evidenceId:b.evidenceId,savedAt:new Date().toISOString()});}
        if(['GET','POST','DELETE'].includes(req.method)){const rows=await items(session,'saved');return json(res,200,rows.map(r=>({...store.getEvidence(r.id),savedAt:r.payload.savedAt})).filter(e=>e.id));}
      }
      if(p.startsWith('/api/'))throw fail('NOT_FOUND',404);
      if(req.method!=='GET')throw fail('METHOD_NOT_ALLOWED',405);
      const base=p.startsWith('/media/')?path.join(root,'data/media'):path.join(root,'frontend/dist/client');
      const rel=p.startsWith('/media/')?p.slice(7):p.slice(1);
      let file=path.resolve(base,decodeURIComponent(rel||'index.html'));if(file!==base&&!file.startsWith(base+path.sep))throw fail('NOT_FOUND',404);
      try {if(!(await stat(file)).isFile())throw new Error();}catch{if(p.startsWith('/media/'))throw fail('NOT_FOUND',404);file=path.join(base,'index.html');}
      const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.png':'image/png','.woff2':'font/woff2','.mp4':'video/mp4','.vtt':'text/vtt','.json':'application/json'};
      const data=await readFile(file);const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);const headers={'Content-Type':types[path.extname(file)]||'application/octet-stream','Accept-Ranges':'bytes'};
      if(range){const start=Number(range[1]);const end=Math.min(range[2]?Number(range[2]):data.length-1,data.length-1);if(start>end||start>=data.length) {res.writeHead(416,{'Content-Range':`bytes */${data.length}`});return res.end();}res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${data.length}`,'Content-Length':end-start+1});return res.end(data.subarray(start,end+1));}
      res.writeHead(200,headers);res.end(data);
    }catch(error){json(res,error.status||500,{error:error.status?error.message:'INTERNAL_ERROR'});}
  });
  const agendaTimer=setInterval(()=>workspace.agenda().catch(()=>{}),3600000);agendaTimer.unref();
  server.on('close',()=>{clearInterval(agendaTimer);parliament?.close();auth.close();});
  return {server,store};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const {server}=createServer({authFile:path.join(root,'data/sessions.sqlite')});server.listen(Number(process.env.PORT||4318),process.env.HOST||'127.0.0.1',()=>console.log('Swiss pilot API http://127.0.0.1:'+(process.env.PORT||4318)));}
