// Official roll-call decision codes (Voting service) rendered for readers.
const DECISIONS={1:['yes','Yes','Oui'],2:['no','No','Non'],3:['abstain','Abstained','Abstention'],4:['present','Present (did not vote)','Présent (sans vote)'],5:['absent','Did not take part','N’a pas participé'],6:['excused','Excused','Excusé'],7:['president','Chair did not vote','Présidence (pas de vote)']};
export function decision(vote,language='en'){const d=DECISIONS[Number(vote.decisionCode)];return d?{kind:d[0],label:d[language==='fr'?2:1]}:{kind:'other',label:vote.decisionText||'—'};}
export const DECISION_FILTERS=[['all','All','Tous'],['yes','Yes','Oui'],['no','No','Non'],['abstain','Abstained','Abstention'],['absent','Did not take part','Absent']];
