import {mkdirSync,renameSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {openParliament} from '../server/parliament.mjs';
import {buildProfileCoverage} from '../server/profile-coverage.mjs';

const root=resolve(import.meta.dirname,'..'),file=resolve(root,'data/parliament/profile-backlog.json');mkdirSync(resolve(root,'data/parliament'),{recursive:true});
const store=openParliament(resolve(root,'data/parliament.sqlite'));
try{const report=buildProfileCoverage(store),temporary=`${file}.tmp`;writeFileSync(temporary,JSON.stringify(report,null,2));renameSync(temporary,file);console.log(JSON.stringify({...report.totals,file},null,2));}finally{store.close();}
