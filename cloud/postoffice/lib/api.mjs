import {homeRoute,exportHome} from './home.mjs';
import {randomUUID,randomBytes} from 'node:crypto';
import {passwordHash,passwordMatches,validPassword,token,digest,sessionCookie} from './crypto.mjs';
import {store,limit,social,publicUser,clean,fail,species} from './social.mjs';
const handleOf=v=>{const h=clean(v,24).toLowerCase();if(!/^[a-z][a-z0-9_]{2,23}$/.test(h))fail(400,'绒角号需 3–24 位，以字母开头，可用数字和下划线');return h;};
const recovery=()=>randomBytes(20).toString('hex').match(/.{8}/g).join('-');
const recoveryHash=v=>digest(String(v||'').replaceAll('-','').trim().toLowerCase());
const readBuckets=new Map();
function readLimit(key){const now=Date.now();if(readBuckets.size>10000){for(const [k,v] of readBuckets)if(v.until<=now)readBuckets.delete(k);if(readBuckets.size>10000)fail(503,'邮局繁忙，请稍后再试');}const old=readBuckets.get(key),value=old&&old.until>now?old:{count:0,until:now+60000};value.count++;readBuckets.set(key,value);if(value.count>1200)fail(429,'操作有点快，请稍后再试');}
const cookie=req=>req.headers.get('cookie')?.split(';').map(v=>v.trim()).find(v=>v.startsWith('mofu_session='))?.slice(13)||'';
export async function handle(request,db){
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
 const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
 try{
  if(!db)fail(503,'邮局正在准备，请稍后再来');const s=store(db),{get,run,batch}=s,url=new URL(request.url),path=url.pathname.slice(4),method=request.method,now=Date.now();
  if(method==='GET'&&path==='/health'){await get('SELECT 1 AS ok');return json({ok:true,service:'mofucorner-postoffice',storage:'libSQL'});}
  if(method==='GET'&&path==='/config')return json({registration:true,relationships:true,home:true,authMode:'handle-recovery',transport:'poll',retentionDays:180,development:false,operator:'绒角小邮局',support:''});
  const ip=digest(request.headers.get('cf-connecting-ip')||'unknown');if(method==='GET')readLimit(ip);else await limit(s,'all:'+ip,240);
  let data={};if(!['GET','HEAD'].includes(method)){
   if(request.headers.get('origin')!==url.origin)fail(403,'请从邮局页面操作');if(!request.headers.get('content-type')?.startsWith('application/json'))fail(415,'请使用 JSON 请求');
   const reader=request.body?.getReader(),parts=[];let size=0;if(reader)while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>16384){await reader.cancel();fail(413,'内容太长了');}parts.push(value);}
   try{data=JSON.parse(Buffer.concat(parts).toString());if(!data||Array.isArray(data)||typeof data!=='object')throw Error();}catch{fail(400,'请求格式不正确');}
  }
  const raw=cookie(request),sessionHash=digest(raw);
  const session=()=>get('SELECT u.*,(SELECT json_group_object(slot,item_id) FROM home_equipment WHERE user_id=u.id AND slot IN(\'headwear\',\'neckwear\',\'carry\')) AS outfit_json,s.hash AS sessionHash,s.csrf FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.hash=? AND s.expires>? AND u.banned=0',sessionHash,Date.now());
  const profile=u=>({...publicUser(u),discoverable:!!u.discoverable});
  const createSession=async u=>{const raw=token(),csrf=token();await batch([['DELETE FROM sessions WHERE user_id=? AND hash NOT IN(SELECT hash FROM sessions WHERE user_id=? ORDER BY expires DESC LIMIT 4)',u.id,u.id],['INSERT INTO sessions(hash,user_id,csrf,expires) VALUES(?,?,?,?)',digest(raw),u.id,csrf,now+14*86400000]]);headers['Set-Cookie']=sessionCookie(raw,url.protocol==='https:');return {user:profile(u),csrf};};
  if(path==='/auth/register'&&method==='POST'){
   await limit(s,'register:'+ip,8,3600000);if(data.accepted!==true)fail(400,'请先同意服务条款和隐私说明');const handle=handleOf(data.handle),name=clean(data.name,20);if(!validPassword(data.password))fail(400,'密码需要 10–128 个字符');
   if(!species.filter(x=>x!=='otter').includes(data.species))fail(400,'请选择你的生肖伙伴，选定后不能更换');
   if(await get('SELECT 1 FROM users WHERE handle=?',handle))fail(409,'这个绒角号已有人使用');const hash=await passwordHash(data.password),code=recovery(),id=randomUUID();
   const result=await run('INSERT OR IGNORE INTO users(id,handle,name,species,password,recovery_hash,verified,created,seen) VALUES(?,?,?,?,?,?,1,?,?)',id,handle,name,data.species,hash,recoveryHash(code),now,now);if(!result.meta.changes)fail(409,'这个绒角号已有人使用');
   const u=await get('SELECT * FROM users WHERE id=?',id);return json({...await createSession(u),recoveryCode:code},201);
  }
  if(path==='/auth/login'&&method==='POST'){
   await limit(s,'login-ip:'+ip,15,15*60000);const h=handleOf(data.handle);await limit(s,'login-account:'+h,20,15*60000);if(!validPassword(data.password))fail(400,'绒角号或密码不正确');const u=await get('SELECT u.*,(SELECT json_group_object(slot,item_id) FROM home_equipment WHERE user_id=u.id AND slot IN(\'headwear\',\'neckwear\',\'carry\')) AS outfit_json FROM users u WHERE handle=? AND banned=0',h);
   if(!u){await passwordHash(data.password,'00000000000000000000000000000000');fail(400,'绒角号或密码不正确');}if(!await passwordMatches(data.password,u.password))fail(400,'绒角号或密码不正确');
   if(!await get('SELECT 1 FROM users WHERE id=? AND password=? AND banned=0',u.id,u.password))fail(401,'账号状态已变化，请重新登录');return json(await createSession(u));
  }
  if(path==='/auth/recover'&&method==='POST'){
   await limit(s,'recover:'+ip,8,3600000);const h=handleOf(data.handle);if(!validPassword(data.password))fail(400,'新密码需要 10–128 个字符');const oldHash=recoveryHash(data.recoveryCode),u=await get('SELECT * FROM users WHERE handle=? AND recovery_hash=? AND banned=0',h,oldHash);if(!u)fail(400,'绒角号或恢复码不正确');
   const hash=await passwordHash(data.password),code=recovery();const results=await batch([['DELETE FROM sessions WHERE user_id=(SELECT id FROM users WHERE id=? AND recovery_hash=?)',u.id,oldHash],['UPDATE users SET password=?,recovery_hash=? WHERE id=? AND recovery_hash=? AND banned=0 RETURNING id',hash,recoveryHash(code),u.id,oldHash]]);if(!results[1].results.length)fail(400,'恢复码已使用，请使用最新恢复码');headers['Set-Cookie']=sessionCookie('',url.protocol==='https:',0);return json({ok:true,recoveryCode:code});
  }
  const me=await session();if(!me)fail(401,'请先登录');if(method!=='GET'&&request.headers.get('x-csrf-token')!==me.csrf)fail(403,'请刷新页面再操作');
  if(method==='GET'&&path==='/auth/me')return json({user:profile(me),csrf:me.csrf});
  if(method==='POST'&&path==='/auth/logout'){await run('DELETE FROM sessions WHERE hash=?',sessionHash);headers['Set-Cookie']=sessionCookie('',url.protocol==='https:',0);return json({ok:true});}
  if(method==='POST'&&(path==='/account/delete'||path==='/account/recovery')){
   await limit(s,'sensitive:'+me.id,5,15*60000);if(!validPassword(data.password)||!await passwordMatches(data.password,me.password))fail(400,'密码不正确');if(!await session())fail(401,'请重新登录');
   if(path==='/account/delete'){await run('DELETE FROM users WHERE id=? AND EXISTS(SELECT 1 FROM sessions WHERE hash=?)',me.id,sessionHash);headers['Set-Cookie']=sessionCookie('',url.protocol==='https:',0);return json({ok:true});}
   const code=recovery(),changed=await run('UPDATE users SET recovery_hash=? WHERE id=? AND EXISTS(SELECT 1 FROM sessions WHERE hash=? AND expires>?)',recoveryHash(code),me.id,sessionHash,Date.now());if(!changed.meta.changes)fail(401,'请重新登录');return json({recoveryCode:code});
  }
  if(path==='/home'||path.startsWith('/home/'))return json(await homeRoute(s,me,path,method,data,now));
  if(me.seen<now-30000)await run('UPDATE users SET seen=? WHERE id=?',now,me.id);
  if((path==='/friends'||path==='/sync')&&method==='GET'){
   const lease=await get("INSERT INTO limits(key,count,expires) VALUES('maintenance',0,?) ON CONFLICT(key) DO UPDATE SET expires=excluded.expires WHERE expires<=? RETURNING key",now+3600000,now);
   if(lease)await batch([['DELETE FROM sessions WHERE expires<=?',now],['DELETE FROM limits WHERE expires<=?',now],['DELETE FROM requests WHERE created<=?',now-30*86400000],['DELETE FROM relationship_requests WHERE created<=?',now-7*86400000],['DELETE FROM messages WHERE created<=?',now-180*86400000],['DELETE FROM reports WHERE created<=?',now-180*86400000]]);
  }
  if(path==='/sync'&&method==='GET'){
   const [contacts,requests]=await Promise.all([social(s,me,'/friends','GET',{},url),social(s,me,'/requests','GET',{},url)]);
   return json({...contacts,requests,user:profile(me)});
  }
  const result=await social(s,me,path,method,data,url);if(path==='/account/export')result.home=await exportHome(s,me.id);return json(result);
 }catch(e){const status=e.status||500;if(status===500)console.error('POSTOFFICE_ERROR',e.name);return json({error:status===500?'邮局暂时忙碌，请稍后重试':e.message},status);}
}
