import test from 'node:test';
import assert from 'node:assert/strict';
import {matchProposals,searchProposals} from '../proposal-search.mjs';

const businesses=[
 {id:'20250026',title:'« Pas de Suisse à 10 millions ! (initiative pour la durabilité) ». Initiative populaire',statusGroup:'proceedings',modified:'2026-01-01',passageCount:1149},
 {id:'20240092',title:'«Sauvegarder la neutralité suisse (initiative sur la neutralité)». Initiative populaire',statusGroup:'proceedings',modified:'2026-03-01',passageCount:1172},
 {id:'20180010',title:'Millions pour la recherche',statusGroup:'concluded',modified:'2018-01-01',passageCount:0}];

test('all meaningful words must match, with plurals, accents and proposal numbers',()=>{
 assert.deepEqual(matchProposals(businesses,'suisse 10 million').map(b=>b.id),['20250026']);
 assert.deepEqual(matchProposals(businesses,'neutralite').map(b=>b.id),['20240092']);
 assert.deepEqual(matchProposals(businesses,'25.026').map(b=>b.id),['20250026']);
 assert.equal(matchProposals(businesses,'millions',{stage:'concluded'}).length,1);
});

test('an English query with no French match retries once with translated terms',async()=>{
 const store={listBusinesses:()=>businesses};
 const fetchImpl=async()=>({ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({fr:'neutralité',de:'Neutralität',it:'neutralità'})}}]})});
 const out=await searchProposals(store,{q:'neutrality initiative'},{INFERENCE_BASE_URL:'https://example.test/v1',INFERENCE_MODEL:'fixture'},fetchImpl);
 assert.equal(out.translatedQuery,'neutralité');assert.deepEqual(out.results.map(r=>r.id),['20240092']);assert.equal(out.results[0].number,'24.092');
});
