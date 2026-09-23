import {createWriteStream,renameSync} from 'node:fs';
import {finished} from 'node:stream/promises';
import {once} from 'node:events';

export async function writePublicEmbeddingInput(db,outputFile,{highWaterMark=64*1024}={}){
 if(!db||typeof db.prepare!=='function'||!outputFile)throw new Error('INVALID_EMBEDDING_EXPORT');
 const temporary=`${outputFile}.tmp`,stream=createWriteStream(temporary,{encoding:'utf8',highWaterMark});let publicPassages=0;
 try{
  const statement=db.prepare("SELECT id,payload,sha256,source_url,retrieved_at FROM records WHERE kind='speech' ORDER BY id");
  for(const row of statement.iterate()){
   const passage=JSON.parse(row.payload),line=JSON.stringify({id:row.id,text:passage.text,sha256:row.sha256,sourceUrl:passage.officialUrl||row.source_url,retrievedAt:row.retrieved_at,sessionId:passage.sessionId,personId:passage.personId,businessId:passage.businessId,language:passage.language})+'\n';
   if(!stream.write(line))await once(stream,'drain');publicPassages++;
  }
  stream.end();await finished(stream);renameSync(temporary,outputFile);return {publicPassages};
 }catch(error){stream.destroy();throw error;}
}
