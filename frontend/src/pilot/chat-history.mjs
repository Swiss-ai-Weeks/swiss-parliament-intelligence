export const CHAT_HISTORY_KEY='swiss-pilot-chats-v1';
export function newConversation(scope=null){return {id:globalThis.crypto.randomUUID(),scope,messages:[],updatedAt:new Date().toISOString()};}
export function loadConversations(storage){
 try{const rows=JSON.parse(storage.getItem(CHAT_HISTORY_KEY)||'[]');return Array.isArray(rows)?rows.filter(c=>typeof c.id==='string'&&Array.isArray(c.messages)).slice(0,20):[];}catch{return [];}
}
export function saveConversations(storage,rows){
 try{storage.setItem(CHAT_HISTORY_KEY,JSON.stringify(rows.filter(c=>c.messages.length).slice(0,20).map(c=>({...c,messages:c.messages.slice(-40)}))));return true;}catch{return false;}
}
export function appendMessage(rows,id,message){return rows.map(c=>c.id===id?{...c,messages:[...c.messages,message].slice(-40),updatedAt:new Date().toISOString()}:c);}
