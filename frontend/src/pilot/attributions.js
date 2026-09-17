const french={
 'Federal vote record':'Résultat officiel de la votation',
 'Federal Council and Parliament':'Conseil fédéral et Parlement',
 'Referendum committees, official booklet pp. 28–29':'Comités référendaires · brochure officielle, p. 28–29',
 'Initiative committee, official voting explanations':'Comité d’initiative · explications officielles',
 'Federal Council, official voting explanations':'Conseil fédéral · explications officielles',
 'Federal Social Insurance Office':'Office fédéral des assurances sociales',
 'Initiative proponents, described by OFAS':'Auteurs de l’initiative · présentation de l’OFAS',
 'Federal Tax Administration':'Administration fédérale des contributions',
 'Supporters, official voting explanations':'Partisans · explications officielles',
 'Opponents, official voting explanations':'Opposants · explications officielles',
 'Federal environment department':'Département fédéral de l’environnement',
};
export const attribution=(text,lang)=>lang==='fr'?(french[text]||text):text;
