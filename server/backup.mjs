import {createCipheriv,createDecipheriv,randomBytes,createHash} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
const magic=Buffer.from('SWISSCIVIC1');
export function encryptBackup(rows,key){
 if(!Buffer.isBuffer(key)||key.length!==32)throw Error('BACKUP_KEY_MUST_BE_32_BYTES');
 if(!Array.isArray(rows)||rows.some(r=>!r.user_id||!r.kind||!r.id||!r.payload))throw Error('INVALID_APPLICATION_DATA');
 // Allowlist application data only. Auth tokens, sessions and environment secrets never enter the archive.
 const data=rows.map(({user_id,kind,id,payload,updated_at})=>({user_id,kind,id,payload,updated_at})),json=JSON.stringify(data);
 const envelope=JSON.stringify({schemaVersion:1,createdAt:new Date().toISOString(),sha256:createHash('sha256').update(json).digest('hex'),rows:data});
 const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(magic);const ciphertext=Buffer.concat([cipher.update(gzipSync(envelope)),cipher.final()]);return Buffer.concat([magic,iv,cipher.getAuthTag(),ciphertext]);
}
export function decryptBackup(bytes,key){
 if(!bytes.subarray(0,magic.length).equals(magic))throw Error('INVALID_BACKUP_FORMAT');const start=magic.length,decipher=createDecipheriv('aes-256-gcm',key,bytes.subarray(start,start+12));decipher.setAAD(magic);decipher.setAuthTag(bytes.subarray(start+12,start+28));const envelope=JSON.parse(gunzipSync(Buffer.concat([decipher.update(bytes.subarray(start+28)),decipher.final()])).toString());if(envelope.schemaVersion!==1||createHash('sha256').update(JSON.stringify(envelope.rows)).digest('hex')!==envelope.sha256)throw Error('BACKUP_CHECKSUM_MISMATCH');return envelope;
}
export async function exportApplicationData(env,fetchImpl=fetch){
 if(!env.SUPABASE_SERVICE_ROLE_KEY||!env.SUPABASE_URL)throw Error('BACKUP_ADMIN_CREDENTIAL_REQUIRED');
 const rows=[];for(let offset=0;offset<1000000;offset+=500){const r=await fetchImpl(env.SUPABASE_URL+'/rest/v1/civic_user_items?select=user_id,kind,id,payload,updated_at&order=user_id,kind,id&limit=500&offset='+offset,{headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY},signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('BACKUP_EXPORT_FAILED');const page=await r.json();if(!Array.isArray(page))throw Error('INVALID_BACKUP_RESPONSE');rows.push(...page);if(page.length<500)return rows;}throw Error('BACKUP_PAGE_LIMIT');
}
