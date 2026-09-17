const report={at:new Date().toISOString(),services:[]};
for(const [service,url] of [['VSS',process.env.VSS_HEALTH_URL],['Riva HTTP gateway',process.env.RIVA_HEALTH_URL],['NVIDIA inference',process.env.INFERENCE_BASE_URL?process.env.INFERENCE_BASE_URL.replace(/\/$/,'')+'/models':null]]){
 if(!url){report.services.push({service,state:'not-configured'});continue;}
 try{const r=await fetch(url,{signal:AbortSignal.timeout(10000),headers:service==='NVIDIA inference'&&process.env.INFERENCE_API_KEY?{Authorization:'Bearer '+process.env.INFERENCE_API_KEY}:{}});report.services.push({service,state:r.ok?'reachable':'failed',httpStatus:r.status});}catch{report.services.push({service,state:'unreachable'});}
}
console.log(JSON.stringify(report,null,2));if(report.services.some(s=>s.state!=='reachable'))process.exitCode=1;
