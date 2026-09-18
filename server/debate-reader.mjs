// Read authoritative text without depending on any model or video provider.
export function readDebate(db, decode, filters = {}) {
  const { business, person, session, language, date, q = '', offset = 0 } = filters;
  const clauses = ["r.kind='speech'"], params = [];
  for (const [field, value] of [['sessionId', session], ['language', language]]) {
    if (value) { clauses.push(`json_extract(r.payload,'$.${field}')=?`); params.push(value); }
  }
  if (business) {
    clauses.push("(json_extract(r.payload,'$.businessId')=? OR EXISTS (SELECT 1 FROM json_each(r.payload,'$.businessIds') WHERE value=?))");
    params.push(business, business);
  }
  const scope = clauses.join(' AND ');
  const facets = db.prepare(`SELECT DISTINCT json_extract(r.payload,'$.personId') id, json_extract(r.payload,'$.speaker') name FROM records r WHERE ${scope} ORDER BY name`).all(...params);
  if (person) { clauses.push("json_extract(r.payload,'$.personId')=?"); params.push(person); }
  if (date) { clauses.push("substr(json_extract(r.payload,'$.date'),1,10)=?"); params.push(date); }
  if (q.trim()) { clauses.push("instr(lower(json_extract(r.payload,'$.text')),lower(?))>0"); params.push(q.trim().slice(0, 500)); }
  const where = clauses.join(' AND ');
  const total = db.prepare(`SELECT count(*) n FROM records r WHERE ${where}`).get(...params).n;
  const start = Math.max(0, Math.min(1000000, Number.parseInt(offset, 10) || 0));
  const rows = db.prepare(`SELECT r.* FROM records r WHERE ${where} ORDER BY json_extract(r.payload,'$.date'), CAST(json_extract(r.payload,'$.transcriptId') AS INTEGER), CAST(substr(r.id,instr(r.id,'-')+1) AS INTEGER), r.id LIMIT 20 OFFSET ?`).all(...params, start);
  return { passages: rows.map(decode), total, offset: start, nextOffset: start + rows.length < total ? start + rows.length : null, speakers: facets };
}

export function passageContext(db, decode, id) {
  const row = db.prepare("SELECT * FROM records WHERE kind='speech' AND id=?").get(id);
  if (!row) return null;
  const selected = decode(row);
  // Adjacent paragraphs must belong to the same official intervention.
  const rows = db.prepare("SELECT * FROM records WHERE kind='speech' AND json_extract(payload,'$.transcriptId')=? ORDER BY CAST(substr(id,instr(id,'-')+1) AS INTEGER)").all(selected.transcriptId);
  const index = rows.findIndex(r => r.id === id);
  const record=(kind,key)=>key?db.prepare('SELECT * FROM records WHERE kind=? AND id=?').get(kind,String(key)):null;
  const person=record('person',selected.personId),business=record('business',selected.businessId);
  return { selectedId: id, total: rows.length, passages: rows.slice(Math.max(0, index - 2), index + 3).map(decode),person:person?decode(person):null,business:business?decode(business):null };
}
