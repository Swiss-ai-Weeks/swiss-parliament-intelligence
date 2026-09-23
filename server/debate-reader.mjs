// Read authoritative text without depending on any model or video provider.
// Every scoped read starts from an index (business links, person, session or date): the speech table holds
// over a million rows and node:sqlite is synchronous, so a scan would stall every other request.
const counts = new WeakMap();
function cachedCount(db, sql) {
  const hit = counts.get(db);
  if (hit && Date.now() - hit.at < 600000) return hit.n;
  const n = db.prepare(sql).get().n;
  counts.set(db, { at: Date.now(), n });
  return n;
}

export function readDebate(db, decode, filters = {}) {
  const { business, person, session, language, date, q = '', offset = 0 } = filters;
  const clauses = ["r.kind='speech'"], params = [];
  let from = 'records r';
  if (business) { clauses.push('r.id IN (SELECT id FROM speech_business_links WHERE business=?)'); params.push(String(business)); }
  else if (person) from = 'records AS r INDEXED BY records_speech_person';
  else if (session) from = 'records AS r INDEXED BY records_speech_session';
  else from = 'records AS r INDEXED BY records_speech_date';
  if (session) { clauses.push("json_extract(r.payload,'$.sessionId')=?"); params.push(String(session)); }
  if (language) { clauses.push("json_extract(r.payload,'$.language')=?"); params.push(language); }
  const scope = clauses.join(' AND '), scopeParams = [...params];
  if (person) { clauses.push("json_extract(r.payload,'$.personId')=?"); params.push(String(person)); }
  // A date range (not substr) so the date index applies.
  if (date) { clauses.push("json_extract(r.payload,'$.date')>=? AND json_extract(r.payload,'$.date')<?"); params.push(String(date).slice(0, 10), String(date).slice(0, 10) + 'U'); }
  if (q.trim()) { clauses.push("instr(lower(json_extract(r.payload,'$.text')),lower(?))>0"); params.push(q.trim().slice(0, 500)); }
  const where = clauses.join(' AND ');
  // Speaker choices only within a business or session; listing every speaker in the archive needs a full scan.
  const facets = business || session
    ? db.prepare(`SELECT DISTINCT json_extract(r.payload,'$.personId') id, json_extract(r.payload,'$.speaker') name FROM ${business ? 'records r' : 'records AS r INDEXED BY records_speech_session'} WHERE ${scope} ORDER BY name`).all(...scopeParams)
    : [];
  // The unfiltered count walks the whole archive: remember it for ten minutes.
  const unfiltered = params.length === 0, countSql = `SELECT count(*) n FROM ${from} WHERE ${where}`;
  const total = unfiltered ? cachedCount(db, countSql) : db.prepare(countSql).get(...params).n;
  const start = Math.max(0, Math.min(1000000, Number.parseInt(offset, 10) || 0));
  const rows = db.prepare(`SELECT r.* FROM ${from} WHERE ${where} ORDER BY json_extract(r.payload,'$.date'), CAST(json_extract(r.payload,'$.transcriptId') AS INTEGER), CAST(substr(r.id,instr(r.id,'-')+1) AS INTEGER), r.id LIMIT 20 OFFSET ?`).all(...params, start);
  const passages = rows.map(decode);
  const speakers = facets.length || !person || !passages[0] ? facets : [{ id: String(person), name: passages[0].speaker }];
  return { passages, total, offset: start, nextOffset: start + rows.length < total ? start + rows.length : null, speakers };
}

export function passageContext(db, decode, id) {
  const row = db.prepare("SELECT * FROM records WHERE kind='speech' AND id=?").get(id);
  if (!row) return null;
  const selected = decode(row);
  // Adjacent paragraphs must belong to the same official intervention.
  const rows = db.prepare("SELECT * FROM records INDEXED BY records_speech_transcript WHERE kind='speech' AND json_extract(payload,'$.transcriptId')=? ORDER BY CAST(substr(id,instr(id,'-')+1) AS INTEGER)").all(selected.transcriptId);
  const index = rows.findIndex(r => r.id === id);
  const record=(kind,key)=>key?db.prepare('SELECT * FROM records WHERE kind=? AND id=?').get(kind,String(key)):null;
  const person=record('person',selected.personId),business=record('business',selected.businessId);
  return { selectedId: id, total: rows.length, passages: rows.slice(Math.max(0, index - 2), index + 3).map(decode),person:person?decode(person):null,business:business?decode(business):null };
}
