export function safeConfirmationUrl(raw, origin, base) {
 try {
  const u=new URL(raw);
  if(u.origin!=='https://qtrgnmdxpigxgsmwzkcl.supabase.co'||u.pathname!=='/auth/v1/verify'||u.username||u.password||u.hash)return null;
  if(!['magiclink','signup','recovery','email'].includes(u.searchParams.get('type')))return null;
  if(!/^[a-zA-Z0-9_-]{20,256}$/.test(u.searchParams.get('token')||''))return null;
  if(u.searchParams.get('redirect_to')!==origin+base+'api/auth/callback')return null;
  return u.href;
 }catch{return null;}
}
