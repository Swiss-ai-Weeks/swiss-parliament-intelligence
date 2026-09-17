import {openParliament} from '../server/parliament.mjs';
import {syncPerson} from '../server/profile-import.mjs';
const id=process.argv.find(a=>a.startsWith('--person='))?.split('=')[1]||'10820';const store=openParliament();
try{const p=await syncPerson(store,id);console.log(JSON.stringify({id:p.id,name:p.name,votes:p.votes.length,contacts:p.contacts.length,portrait:!!p.portraitUrl,coverage:p.voteHistory},null,2));}finally{store.close();}
