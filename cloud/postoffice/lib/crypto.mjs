import {randomBytes,scrypt as derive,timingSafeEqual,createHash} from 'node:crypto';
import {promisify} from 'node:util';
const scrypt=promisify(derive);let hashing=0;
export const token=()=>randomBytes(32).toString('base64url');
export const digest=value=>createHash('sha256').update(value).digest('hex');
export function validPassword(value){return typeof value==='string'&&value.length>=10&&value.length<=128;}
export async function passwordHash(value,salt=randomBytes(16).toString('hex')){
 if(hashing>=1)throw Object.assign(Error('稍等一下再试'),{status:429});
 hashing++;try{const key=await scrypt(value,salt,64,{N:32768,r:8,p:3,maxmem:64*1024*1024});return `scrypt$32768$8$3$${salt}$${key.toString('hex')}`;}finally{hashing--;}
}
export async function passwordMatches(value,stored){
 const parts=String(stored).split('$');if(parts.length!==6||parts[0]!=='scrypt')return false;
 const actual=await passwordHash(value,parts[4]);const a=Buffer.from(actual),b=Buffer.from(stored);return a.length===b.length&&timingSafeEqual(a,b);
}
export function sessionCookie(value,secure,maxAge=60*60*24*14){return `mofu_session=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure?'; Secure':''}`;}
export function cookieToken(req){return (req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith('mofu_session='))?.slice(13)||'';}
