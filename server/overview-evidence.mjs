// Overview requests have no topic keywords; retrieve only within an explicit selection.
export function overviewEvidence(input, collection = []) {
 if (!input.businessId && !input.personId) return null;
 const personOverview=input.personId&&/^what (issues|topics) has .{1,150} discussed\?$/i.test(input.question.trim());
 if (!personOverview&&!/^(summarize the selected (proposal|person)'s available debate passages\.|résume les interventions disponibles pour (cet objet|cette personne)\.|what does the imported record tell us about this topic\?)$/i.test(input.question.trim())) return null;
 const usable=collection.filter(s=>s.text?.length>=80&&s.text.length<7000);
 const chosen=[],speakers=new Set();
 for(const s of usable){if(speakers.has(s.personId||s.speaker))continue;chosen.push(s);speakers.add(s.personId||s.speaker);if(chosen.length===3)break;}
 for(const s of usable){if(chosen.length===3)break;if(!chosen.some(p=>p.id===s.id))chosen.push(s);}
 return chosen;
}
