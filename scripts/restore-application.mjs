import {readFileSync} from 'node:fs';
import {decryptBackup} from '../server/backup.mjs';
const file=process.argv.find(a=>a.startsWith('--file='))?.slice(7);if(!file||!process.env.BACKUP_KEY_FILE)throw Error('Provide --file and BACKUP_KEY_FILE');
const archive=decryptBackup(readFileSync(file),readFileSync(process.env.BACKUP_KEY_FILE));
// Dry run is the default. Restore to an isolated Supabase project first; retain original auth user IDs.
if(!process.argv.includes('--apply'))console.log(JSON.stringify({status:'verified-dry-run',rows:archive.rows.length,createdAt:archive.createdAt}));
else{if(!process.env.RESTORE_SUPABASE_URL||!process.env.RESTORE_SERVICE_ROLE_KEY)throw Error('EXPLICIT_RESTORE_TARGET_REQUIRED');for(let i=0;i<archive.rows.length;i+=100){const key=process.env.RESTORE_SERVICE_ROLE_KEY;const r=await fetch(process.env.RESTORE_SUPABASE_URL+'/rest/v1/civic_user_items?on_conflict=user_id,kind,id',{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates'},body:JSON.stringify(archive.rows.slice(i,i+100))});if(!r.ok)throw Error('RESTORE_WRITE_FAILED; verify the schema and original auth user IDs exist');}console.log(JSON.stringify({status:'restored',rows:archive.rows.length}));}
