import {DatabaseSync} from 'node:sqlite';
import {writePublicEmbeddingInput} from '../server/public-embedding-export.mjs';
const db=new DatabaseSync('data/parliament.sqlite',{readOnly:true});
try{console.log(JSON.stringify(await writePublicEmbeddingInput(db,'data/public-embedding-input.jsonl')));}finally{db.close();}
