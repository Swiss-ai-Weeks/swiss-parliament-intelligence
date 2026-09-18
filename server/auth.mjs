import { randomBytes } from 'node:crypto';
export function createAuth(env=process.env,fetchImpl=fetch) {
  const sessions=new Map();
  const configured=Boolean(env.SUPABASE_URL&&env.SUPABASE_ANON_KEY);
  async function call(path,body,token) {
    const r=await fetchImpl(env.SUPABASE_URL+'/auth/v1/'+path,{method:body?'POST':'GET',signal:AbortSignal.timeout(12000),headers:{apikey:env.SUPABASE_ANON_KEY,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});
    if(!r.ok) throw Object.assign(new Error('AUTH_FAILED'),{status:r.status===429?429:401});
    return r.json();
  }
  return {configured,
    async login(email,password) {
      if(!configured) throw Object.assign(new Error('AUTH_NOT_CONFIGURED'),{status:503});
      const result=await call('token?grant_type=password',{email,password});
      const sid=randomBytes(32).toString('hex');
      const expires=Math.min(Number(result.expires_in)||3600,3600);
      for(const [id,s] of sessions) if(s.expiresAt<Date.now()) sessions.delete(id);
      sessions.set(sid,{user:result.user,token:result.access_token,expiresAt:Date.now()+expires*1000});
      return {sid,expires,user:{id:result.user.id,email:result.user.email}};
    },
    async signup(email,password) {if(!configured) throw Object.assign(new Error('AUTH_NOT_CONFIGURED'),{status:503});await call('signup',{email,password});return {status:'check-email'};},
    async user(cookie='') {
      const sid=cookie.match(/(?:^|;\s*)pilot_session=([a-f0-9]{64})(?:;|$)/)?.[1];
      const session=sessions.get(sid);
      if(!session||session.expiresAt<=Date.now()) {sessions.delete(sid);throw Object.assign(new Error('SIGN_IN_REQUIRED'),{status:401});}
      try {const user=await call('user',null,session.token); if(user.id!==session.user.id) throw new Error();return {id:user.id,email:user.email};}
      catch {sessions.delete(sid);throw Object.assign(new Error('SESSION_EXPIRED'),{status:401});}
    },
    logout(cookie='') {const sid=cookie.match(/(?:^|;\s*)pilot_session=([a-f0-9]{64})(?:;|$)/)?.[1];sessions.delete(sid);},
  };
}
