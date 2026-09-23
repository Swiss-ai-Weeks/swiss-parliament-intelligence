// In-app navigation used by chat, citations and cards; SwissPilot listens for civic-navigate.
export function openProfile(personId,tab){window.dispatchEvent(new CustomEvent('civic-navigate',{detail:'?view=profile&person='+encodeURIComponent(personId)+(tab?'&tab='+tab:'')}));}
