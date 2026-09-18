// A conservative veto, not a complete semantic-entailment evaluator.
// Reported motions must not become a claim that the reporting speaker authored them.
export function unsupportedProposalAttribution(claim,source){
 const q=String(source||'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
 const c=String(claim||'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
 return /\b(motion|mozione|vorstoss|antrag|atto parlamentare)\b/.test(q)&&/\b(proposed|propose|proposes|propon|vorgeschlagen)\w*/.test(c)&&!/\b(je propose|nous proposons|propongo|proponiamo|ich beantrage|wir beantragen|ho presentato|j.ai depose)\b/.test(q);
}
