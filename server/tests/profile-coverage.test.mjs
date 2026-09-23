import test from 'node:test';
import assert from 'node:assert/strict';
import {buildProfileCoverage} from '../profile-coverage.mjs';

test('profile coverage prioritizes active public officials and names every missing stage',()=>{
 const people=[{id:'1',name:'Active Example',active:true,profileCoverage:'official-directory',portraitIdentityVerified:false,membershipHistory:[]},{id:'2',name:'Enriched Example',active:false,profileCoverage:'enriched-official-profile',portraitIdentityVerified:true,membershipHistory:[{start:'2020'}],voteHistory:{status:'complete-service-query'}}];
 const report=buildProfileCoverage({people:()=>people,speeches:()=>[{personId:'1'},{personId:'1'}],votings:()=>[{personId:'2'}]});
 assert.equal(report.totals.profiles,2);assert.equal(report.totals.enriched,1);assert.equal(report.profiles[0].id,'1');assert.deepEqual(report.profiles[0].missing,['official-detail','verified-portrait','membership-history','complete-vote-query']);
});
