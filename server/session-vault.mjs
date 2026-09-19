import {DatabaseSync} from 'node:sqlite';
import {randomBytes,createCipheriv,createDecipheriv} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {dirname} from 'node:path';
export function sessionVault(file=':memory:'){
 let key=randomBytes(32);if(file!==':memory:'){mkdirSync(dirname(file),{recursive:true});const keyFile=file+'.key';if(!existsSync(keyFile))writeFileSync(keyFile,key,{mode:0o600,flag:'wx'});key=readFileSync(keyFile);}
 const db=new DatabaseSync(file);db.exec('CREATE TABLE IF NOT EXISTS sessions(id TEXT PRIMARY KEY,value TEXT NOT NULL,expires INTEGER NOT NULL)');
 return {set(id,value,expires){const iv=randomBytes(12),c=createCipheriv('aes-256-gcm',key,iv),payload=Buffer.concat([c.update(JSON.stringify(value)),c.final()]);db.prepare('INSERT OR REPLACE INTO sessions VALUES(?,?,?)').run(id,Buffer.concat([iv,c.getAuthTag(),payload]).toString('base64'),expires);},get(id){const row=db.prepare('SELECT * FROM sessions WHERE id=?').get(id||'');if(!row)return null;if(row.expires<Date.now()){this.delete(id);return null;}const b=Buffer.from(row.value,'base64'),d=createDecipheriv('aes-256-gcm',key,b.subarray(0,12));d.setAuthTag(b.subarray(12,28));return JSON.parse(Buffer.concat([d.update(b.subarray(28)),d.final()]).toString());},delete(id){db.prepare('DELETE FROM sessions WHERE id=?').run(id||'');},deleteUser(userId){for(const row of db.prepare('SELECT id FROM sessions').all()){if(this.get(row.id)?.user?.id===userId)this.delete(row.id);}},close(){db.close();}};
}
