import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { dossiers, evidence, sources } from './catalog.mjs';

export function createStore(file = 'data/pilot.sqlite') {
  if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS dossiers(id TEXT PRIMARY KEY, payload TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sources(id TEXT PRIMARY KEY, payload TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS evidence(id TEXT PRIMARY KEY, dossier_id TEXT NOT NULL REFERENCES dossiers(id), payload TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS saved(user_id TEXT NOT NULL, evidence_id TEXT NOT NULL REFERENCES evidence(id), created_at TEXT NOT NULL, PRIMARY KEY(user_id,evidence_id));`);
  for (const s of sources) db.prepare('INSERT OR REPLACE INTO sources VALUES(?,?)').run(s.id, JSON.stringify(s));
  for (const d of dossiers) db.prepare('INSERT OR REPLACE INTO dossiers VALUES(?,?)').run(d.id, JSON.stringify(d));
  // Do not overwrite operator-reviewed or imported evidence on restart.
  for (const e of evidence) db.prepare('INSERT OR IGNORE INTO evidence VALUES(?,?,?)').run(e.id,e.dossierId,JSON.stringify(e));
  const parse = row => row ? JSON.parse(row.payload) : null;
  const getEvidence = id => { const e = parse(db.prepare('SELECT payload FROM evidence WHERE id=?').get(id)); return e ? {...e,source:parse(db.prepare('SELECT payload FROM sources WHERE id=?').get(e.sourceId))} : null; };
  const listEvidence = id => db.prepare('SELECT id FROM evidence WHERE dossier_id=?').all(id).map(row=>getEvidence(row.id));
  return { db, getEvidence, listEvidence,
    listDossiers: () => db.prepare('SELECT payload FROM dossiers').all().map(parse).map(d => ({...d,sourceLanguages:[...new Set(listEvidence(d.id).map(e=>e.language))],coverage:listEvidence(d.id).some(e=>e.kind==='video')?'video-and-documents':'documents'})),
    getDossier: id => { const d=parse(db.prepare('SELECT payload FROM dossiers WHERE id=?').get(id)); if(!d)return null;const evidence=listEvidence(id);return {...d,evidence,sources:[...new Set([...d.sourceIds,...evidence.map(e=>e.sourceId)])].map(id=>parse(db.prepare('SELECT payload FROM sources WHERE id=?').get(id)))}; },
    saved: uid => db.prepare('SELECT evidence_id,created_at FROM saved WHERE user_id=? ORDER BY created_at DESC').all(uid).map(r=>({...getEvidence(r.evidence_id),savedAt:r.created_at})),
    save: (uid,id) => db.prepare('INSERT OR IGNORE INTO saved VALUES(?,?,?)').run(uid,id,new Date().toISOString()),
    remove: (uid,id) => db.prepare('DELETE FROM saved WHERE user_id=? AND evidence_id=?').run(uid,id),
    close:()=>db.close(),
  };
}
