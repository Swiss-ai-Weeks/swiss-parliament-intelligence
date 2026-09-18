import test from 'node:test';
import assert from 'node:assert/strict';
import {unsupportedCollectiveClaim,topicSearchText} from '../answer-policy.mjs';
import {research} from '../research.mjs';
import {reviewClaims} from '../claim-review.mjs';
const speech={id:'speech-1',text:'Je soutiens le projet sous réserve de garanties.',kind:'document',sourceKind:'parliamentary-speech',speaker:'Example Speaker',speakerRole:'rapporteur',date:'2024-03-14',language:'fr'};
test('individual speech cannot become a collective position in four languages',()=>{
 for(const text of ['Parliament supports this proposal.','Le Parlement soutient ce projet.','Das Parlament unterstützt den Vorschlag.','Il Parlamento sostiene la proposta.'])assert.equal(unsupportedCollectiveClaim(text,speech),true);
 assert.equal(unsupportedCollectiveClaim('Example Speaker supports the proposal subject to safeguards.',speech),false);
 assert.equal(unsupportedCollectiveClaim('Parliament supports this proposal.',{sourceKind:'official-roll-call'}),false);
});
test('institution names do not drown out the actual retrieval topic',()=>{
 assert.equal(topicSearchText('Parlement, protection des données'),'protection des données');
 assert.equal(topicSearchText('Parlamento; protezione dei dati'),'protezione dei dati');
 assert.equal(topicSearchText('Parlament Datenschutz'),'Datenschutz');
});
test('generation carries source role and date and withholds collective speech generalization',async()=>{
 let request;const fetcher=async(url,options)=>{request=JSON.parse(options.body);return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({claims:[{text:'Parliament supports this proposal.',evidenceId:speech.id}]})}}]})};};
 const answer=await research({id:'x',title:{en:'Test'},evidence:[speech]},{question:'What did the speaker say?'},{INFERENCE_BASE_URL:'https://example.test',INFERENCE_MODEL:'test'},fetcher,[speech]);
 assert.equal(answer.status,'insufficient-evidence');assert.equal(answer.withheldClaims,1);
 const payload=JSON.parse(request.messages.at(-1).content);assert.equal(payload.evidence[0].speakerRole,'rapporteur');assert.equal(payload.evidence[0].date,'2024-03-14');
});
test('source review receives the question and speaker context without altering quotes',async()=>{
 let request;const claim={text:'A claim',quote:speech.text,evidenceId:speech.id};
 await reviewClaims([claim],{INFERENCE_BASE_URL:'https://example.test',INFERENCE_MODEL:'test'},async(url,options)=>{request=JSON.parse(options.body);return {ok:true,json:async()=>({choices:[{message:{content:'{"0":false}'}}]})};},{question:'What did the committee recommend?',evidence:[speech]});
 const row=JSON.parse(request.messages.at(-1).content)[0];assert.equal(row.source,speech.text);assert.equal(row.sourceMetadata[0].speakerRole,'rapporteur');assert.equal(row.question,'What did the committee recommend?');
});
