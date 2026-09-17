import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const id=process.argv.find(a=>a.startsWith('--session='))?.split('=')[1]||'5214';if(!/^\d{4}$/.test(id))throw Error('Invalid session');
const dir=`data/parliament/session-${id}`,jobs=JSON.parse(readFileSync(dir+'/media-jobs.json'));mkdirSync('data/media',{recursive:true});
const selected=[];for(const lang of ['de','fr','it']){const job=jobs.find(j=>j.language===lang&&j.durationHintSeconds>45&&j.durationHintSeconds<360&&j.stage==='source-verification-pending');if(job)selected.push(job);}
for(const job of selected){try{
 const r=await fetch(job.officialPage,{signal:AbortSignal.timeout(45000)});if(!r.ok)throw Error('Official page unavailable');const html=await r.text();writeFileSync(dir+'/'+job.id+'-source.html',html);
 const template=html.match(/"OnDemandDownloadUrl"\s*:\s*"([^"]+)"/)?.[1];if(!template)throw Error('No official download template');const url=JSON.parse('"'+template+'"').replace('{0}',job.id);const parsed=new URL(url);if(parsed.protocol!=='https:'||parsed.hostname!=='par-pcache.simplex.tv')throw Error('Unexpected media provider');
 const media=await fetch(url,{signal:AbortSignal.timeout(120000)});if(!media.ok)throw Error('Media download failed');if(!media.headers.get('content-type')?.includes('video'))throw Error('Not a video');const bytes=Buffer.from(await media.arrayBuffer());if(bytes.length>300000000)throw Error('Pilot media size limit');
 const name='parliament-'+job.id+'.mp4';writeFileSync('data/media/'+name,bytes);Object.assign(job,{stage:'downloaded',officialVideoUrl:url,mediaFile:name,mediaSha256:createHash('sha256').update(bytes).digest('hex'),downloadedAt:new Date().toISOString()});console.log(job.id,job.language,bytes.length,'bytes');
 }catch(e){job.stage='failed';job.error=e.message;console.error(job.id,e.message);}writeFileSync(dir+'/media-jobs.json',JSON.stringify(jobs,null,2));}
writeFileSync(dir+'/gpu-batch.json',JSON.stringify(selected.filter(j=>j.stage==='downloaded'),null,2));
