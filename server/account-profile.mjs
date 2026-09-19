export function firstName(metadata={}) {return String(metadata.first_name||metadata.given_name||metadata.display_name||metadata.full_name||'').trim().split(/\s+/)[0].slice(0,60);}
export function avatar(metadata={}) {
 const value=metadata.pilot_avatar;
 if(value==='')return '';
 if(typeof value==='string'&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value)&&value.length<=130000)return value;
 const external=metadata.avatar_url||metadata.picture;
 try{const url=new URL(external);return url.protocol==='https:'&&!url.username&&!url.password?url.href:'';}catch{return '';}
}
export function profileInput(input) {
 const bad=()=>{throw Object.assign(new Error('INVALID_PROFILE'),{status:400});};
 if(typeof input.firstName!=='string'||!input.firstName.trim()||input.firstName.length>60||/[<>\x00-\x1f]/.test(input.firstName))bad();
 const result={first_name:input.firstName.trim()};
 if(input.avatar!==undefined){
  if(input.avatar==='')result.pilot_avatar='';
  else{
   if(typeof input.avatar!=='string'||input.avatar.length>130000)bad();
   const m=input.avatar.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/);if(!m)bad();
   const b=Buffer.from(m[2],'base64');
   if(!(m[1]==='png'&&b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||m[1]==='jpeg'&&b[0]===255&&b[1]===216&&b[2]===255||m[1]==='webp'&&b.subarray(0,4).toString()==='RIFF'&&b.subarray(8,12).toString()==='WEBP'))bad();
   result.pilot_avatar=input.avatar;
  }
 }
 return result;
}
export function requiresMfa(user,token){
 if(!user.factors?.some(f=>f.status==='verified'))return false;
 try{return JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString()).aal!=='aal2';}catch{return true;}
}
