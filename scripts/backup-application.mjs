import {readFileSync,writeFileSync,mkdirSync,readdirSync,statSync,unlinkSync} from 'node:fs';
import {resolve,join,relative} from 'node:path';
import {encryptBackup,decryptBackup,exportApplicationData} from '../server/backup.mjs';
const keyFile=process.env.BACKUP_KEY_FILE,directory=resolve(process.env.BACKUP_DIRECTORY||'data/backups');
if(!keyFile)throw Error('BACKUP_KEY_FILE_REQUIRED: provision a protected 32-byte key outside the backup directory');
if(!relative(directory,resolve(keyFile)).startsWith('..'))throw Error('STORE_BACKUP_KEY_OUTSIDE_ARCHIVE_DIRECTORY');
const key=readFileSync(keyFile);if(key.length!==32)throw Error('INVALID_BACKUP_KEY');mkdirSync(directory,{recursive:true});
const rows=await exportApplicationData(process.env),encrypted=encryptBackup(rows,key);
// Verify every archive before publication or retention cleanup.
const restored=decryptBackup(encrypted,key);if(restored.rows.length!==rows.length)throw Error('RESTORE_VERIFICATION_FAILED');
const file=join(directory,'civic-'+new Date().toISOString().replace(/[:.]/g,'-')+'.enc');writeFileSync(file,encrypted,{flag:'wx',mode:0o600});
for(const name of readdirSync(directory)){if(!/^civic-[\dTZ-]+\.enc$/.test(name))continue;const target=join(directory,name);if(statSync(target).mtimeMs<Date.now()-30*86400000)unlinkSync(target);}
console.log(JSON.stringify({status:'encrypted-and-restore-verified',rows:rows.length,file,retentionDays:30}));
