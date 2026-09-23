export function buildProfileCoverage(store){
 const speeches=store.speechCounts?store.speechCounts.byPerson():new Map(),votes=store.votingCounts?store.votingCounts.byPerson():new Map();
 if(!store.speechCounts){
  for(const speech of store.speeches())if(speech.personId)speeches.set(String(speech.personId),(speeches.get(String(speech.personId))||0)+1);
  for(const vote of store.votings())if(vote.personId)votes.set(String(vote.personId),(votes.get(String(vote.personId))||0)+1);
 }
 const profiles=store.people().map(person=>{
  const id=String(person.id),missing=[];
  if(person.profileCoverage!=='enriched-official-profile')missing.push('official-detail');
  if(!person.portraitIdentityVerified)missing.push('verified-portrait');
  if(!Array.isArray(person.membershipHistory)||!person.membershipHistory.length)missing.push('membership-history');
  if(!person.voteHistory||person.voteHistory.status!=='complete-service-query')missing.push('complete-vote-query');
  const speechCount=speeches.get(id)||0,voteCount=votes.get(id)||0;
  return {id,name:person.name,active:Boolean(person.active),profileCoverage:person.profileCoverage||'derived-record-only',speechCount,voteCount,hasVerifiedPortrait:Boolean(person.portraitIdentityVerified),missing,priority:(person.active?100000:0)+Math.min(speechCount,9999)*10+Math.min(voteCount,9999)};
 }).sort((a,b)=>b.priority-a.priority||a.name.localeCompare(b.name));
 const enriched=profiles.filter(profile=>profile.profileCoverage==='enriched-official-profile').length;
 return {generatedAt:new Date().toISOString(),totals:{profiles:profiles.length,active:profiles.filter(profile=>profile.active).length,enriched,pending:profiles.length-enriched,verifiedPortraits:profiles.filter(profile=>profile.hasVerifiedPortrait).length},profiles};
}
