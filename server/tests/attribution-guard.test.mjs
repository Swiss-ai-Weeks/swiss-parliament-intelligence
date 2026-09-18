import test from 'node:test';import assert from 'node:assert/strict';import {unsupportedProposalAttribution} from '../attribution-guard.mjs';
test('reported motion is not the reporting speaker’s proposal',()=>{
 assert.equal(unsupportedProposalAttribution('Giorgio Fonio proposed a motion to protect SMEs.','La mozione Stark pone l’obiettivo di tutelare le PMI.'),true);
 assert.equal(unsupportedProposalAttribution('Giorgio Fonio describes the Stark motion.','La mozione Stark pone l’obiettivo di tutelare le PMI.'),false);
 assert.equal(unsupportedProposalAttribution('The speaker proposed a motion.','Propongo una mozione per le PMI.'),false);
});
