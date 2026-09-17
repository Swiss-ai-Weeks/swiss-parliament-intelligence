import test from 'node:test';import assert from 'node:assert/strict';
import {alignParagraph,alignEditedParagraph,tokens} from '../word-alignment.mjs';
const text='La protection des données doit rester une priorité pour chaque personne dans notre pays.';
const words=tokens(text).map((word,i)=>({word,start:i,end:i+.5}));
test('edited-text alignment tolerates a spelling error but rejects duplicate spans',()=>{const altered=words.map((w,i)=>i===1?{...w,word:'protectio'}:w);assert.ok(alignEditedParagraph(text,altered,20));assert.equal(alignEditedParagraph(text,[...words,...words.map(w=>({...w,start:w.start+20,end:w.end+20}))],40),null);assert.equal(alignEditedParagraph(text,words.map(w=>({...w,word:'autre'})),20),null);});
test('alignment needs unique start and end anchors and valid media bounds',()=>{
 assert.deepEqual(alignParagraph(text,words,20),{start:0,end:13.5,matchedFraction:1});
 assert.equal(alignParagraph(text,[...words,...words],40),null);
 assert.equal(alignParagraph(text,words,3),null);
 assert.equal(alignParagraph('Une phrase trop courte',words,20),null);
});
test('matching outer anchors cannot validate unrelated middle content',()=>{
 const altered=words.map((w,i)=>i>4&&i<10?{...w,word:'inconnu'}:w);assert.equal(alignParagraph(text,altered,20),null);
});
