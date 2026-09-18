import test from 'node:test';
import assert from 'node:assert/strict';
import {openParliament} from '../parliament.mjs';

test('reader paginates in paragraph order, scopes secondary proposals, and reads adjacent context',()=>{
 const store=openParliament(':memory:');
 try {
  for(let i=0;i<25;i++){
   const p={id:`123-${i}`,transcriptId:'123',businessId:'first',businessIds:['first','second'],personId:'7',speaker:'Speaker',sessionId:'5215',language:'fr',date:'2026-09-18T08:00:00Z',text:`Paragraphe ${i} protection`};
   store.db.prepare('INSERT INTO records VALUES(?,?,?,?,?,?)').run('speech',p.id,JSON.stringify(p),'https://ws.parlament.ch/source','2026-09-18','hash');
  }
  const first=store.readDebate({business:'second',session:'5215',person:'7',language:'fr',date:'2026-09-18',q:'protection'});
  assert.equal(first.total,25);assert.equal(first.passages.length,20);assert.equal(first.nextOffset,20);assert.equal(first.passages[10].id,'123-10');
  const last=store.readDebate({offset:20});assert.equal(last.passages.length,5);assert.equal(last.nextOffset,null);
  assert.equal(store.readDebate({language:'de'}).total,0);
  assert.equal(store.readDebate({q:"' OR 1=1 --"}).total,0);
  assert.deepEqual(store.passageContext('123-10').passages.map(p=>p.id),['123-8','123-9','123-10','123-11','123-12']);
  assert.equal(store.passageContext('123-0').passages.length,3);
  assert.equal(store.passageContext('missing'),null);
 } finally {store.close();}
});
