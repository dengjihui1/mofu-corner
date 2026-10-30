import {createServer} from 'node:http';
import {randomUUID} from 'node:crypto';
import {readFile,stat} from 'node:fs/promises';
import {resolve,join,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {openStore,SPECIES,publicUser,pair} from './store.mjs';
import {passwordHash,passwordMatches,validPassword,token,digest,sessionCookie,cookieToken,RateLimit} from './auth.mjs';
import {mailer} from './mail.mjs';
const uiRoot=resolve(fileURLToPath(new URL('../ui/',import.meta.url)));
const fail=(status,message)=>{throw Object.assign(Error(message),{status});};
const clean=(value,max)=>{if(typeof value!=='string')fail(400,'请填写完整');const s=value.trim();if(!s||s.length>max||/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(s))fail(400,'内容长度或格式不正确');return s;};
const emailOf=value=>{const email=clean(value,254).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail(400,'请填写有效邮箱');return email;};
const handleOf=value=>{const h=clean(value,24).toLowerCase();if(!/^[a-z][a-z0-9_]{2,23}$/.test(h))fail(400,'绒角号需 3–24 位，以字母开头，可用字母、数字和下划线');return h;};
async function body(req){let size=0,parts=[];for await(const part of req){size+=part.length;if(size>16384)fail(413,'内容太长了');parts.push(part);}try{const value=JSON.parse(Buffer.concat(parts).toString());if(!value||typeof value!=='object'||Array.isArray(value))throw Error();return value;}catch{fail(400,'请求格式不正确');}}
export function createPostoffice(config,{sendMail=mailer(config)}={}){
 const store=openStore(config.dataDir),{get,all,run,transaction}=store,limits=new RateLimit(),streams=new Map();
 const now=()=>Date.now(),user=id=>get('SELECT * FROM users WHERE id=?',id),blocked=(a,b)=>!!get('SELECT 1 FROM blocks WHERE (owner=? AND target=?) OR (owner=? AND target=?)',a,b,b,a);
 const friends=(a,b)=>!!get('SELECT 1 FROM friendships WHERE a=? AND b=?',...pair(a,b));
 const peers=id=>all('SELECT CASE WHEN a=? THEN b ELSE a END AS id FROM friendships WHERE a=? OR b=?',id,id,id).map(r=>r.id);
 const emit=(id,type,data)=>{for(const c of streams.get(id)||[]){if(c.res.writableLength>65536){c.res.destroy();continue;}c.res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);}};
 const presence=id=>{for(const peer of peers(id))emit(peer,'presence',{id,online:(streams.get(id)?.size||0)>0});};
 const endSessions=id=>{run('DELETE FROM sessions WHERE user_id=?',id);for(const c of streams.get(id)||[]){c.res.write('event: logout\ndata: {}\n\n');c.res.end();}};
 const requireFriend=(a,b)=>{if(a===b||!friends(a,b)||blocked(a,b)||!user(b)||user(b).banned)fail(403,'双方成为好友后才能互动');};
 const sessionFor=req=>{const raw=cookieToken(req);if(!/^[\w-]{43}$/.test(raw))return null;return get('SELECT s.hash,s.csrf,s.expires,u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.hash=? AND s.expires>? AND u.verified=1 AND u.banned=0',digest(raw),now());};
 const createSession=(res,u)=>{const raw=token(),csrf=token();run('INSERT INTO sessions(hash,user_id,csrf,expires) VALUES(?,?,?,?)',digest(raw),u.id,csrf,now()+14*86400000);run('DELETE FROM sessions WHERE user_id=? AND hash NOT IN (SELECT hash FROM sessions WHERE user_id=? ORDER BY expires DESC LIMIT 5)',u.id,u.id);res.setHeader('Set-Cookie',sessionCookie(raw,config.production));return{user:{...publicUser(u),email:u.email,discoverable:!!u.discoverable},csrf};};
 const sendToken=async(u,kind)=>{const raw=token();transaction(()=>{run('DELETE FROM tokens WHERE user_id=? AND kind=?',u.id,kind);run('INSERT INTO tokens VALUES(?,?,?,?)',digest(raw),u.id,kind,now()+30*60000);});try{await sendMail({to:u.email,kind,token:raw});}catch{fail(503,'邮件暂时没有寄出，请稍后重试');}};
 const json=(res,data,status=200)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 const safeUser=u=>({...publicUser(u),online:(streams.get(u.id)?.size||0)>0});
 function requestList(id){return{incoming:all('SELECT r.id,r.created,u.id AS user_id,u.handle,u.name,u.species FROM requests r JOIN users u ON u.id=r.sender WHERE r.recipient=? AND u.banned=0 ORDER BY r.created DESC LIMIT 100',id),outgoing:all('SELECT r.id,r.created,u.id AS user_id,u.handle,u.name,u.species FROM requests r JOIN users u ON u.id=r.recipient WHERE r.sender=? ORDER BY r.created DESC LIMIT 100',id)};}
 async function route(req,res,url){
  const path=url.pathname,method=req.method,ip=config.trustProxy?(req.headers['x-forwarded-for']||req.socket.remoteAddress).split(',')[0].trim():req.socket.remoteAddress;
  limits.take(`all:${ip}`,300);
  if(method==='GET'&&path==='/api/health'){json(res,{ok:true,service:'mofucorner-postoffice'});return;}
  if(method==='GET'&&path==='/api/config'){json(res,{registration:config.registration,development:!config.production,localMail:config.mailMode==='outbox',operator:config.operator,support:config.support,retentionDays:config.retentionDays});return;}
  const mutating=!['GET','HEAD'].includes(method);
  if(mutating){if(req.headers.origin!==config.origin)fail(403,'请从邮局页面操作');if(!String(req.headers['content-type']).startsWith('application/json'))fail(415,'请使用 JSON 请求');}
  if(path.startsWith('/api/auth/')){
   if(method==='GET'&&path==='/api/auth/me'){const u=sessionFor(req);if(!u)fail(401,'请先登录');json(res,{user:{...publicUser(u),email:u.email,discoverable:!!u.discoverable},csrf:u.csrf});return;}
   if(method!=='POST')fail(405,'不支持此操作');
   limits.take(`auth:${ip}`,60,10*60000);const data=await body(req);
   if(path==='/api/auth/register'){
    if(!config.registration)fail(403,'暂时停止新账号注册');if(data.accepted!==true)fail(400,'请先阅读并同意服务条款和隐私说明');
    const email=emailOf(data.email),handle=handleOf(data.handle),name=clean(data.name,20),species=SPECIES.includes(data.species)?data.species:'rabbit';
    if(!validPassword(data.password))fail(400,'密码需要 10–128 个字符');limits.take(`register:${ip}`,20,3600000);
    if(get('SELECT id FROM users WHERE handle=?',handle))fail(409,'这个绒角号已经有人用了');
    const hashed=await passwordHash(data.password),id=randomUUID(),registeredMessage='如果邮箱可以使用，验证邮件会寄到邮箱；已有账号可登录或找回密码。';
    if(get('SELECT id FROM users WHERE email=?',email)){json(res,{message:registeredMessage});return;}try{run('INSERT INTO users(id,handle,email,name,species,password,created) VALUES(?,?,?,?,?,?,?)',id,handle,email,name,species,hashed,now());}catch(e){if(String(e.code).includes('SQLITE'))fail(409,'账号信息已被使用，请换一个绒角号或找回密码');throw e;}
    await sendToken(user(id),'verify');json(res,{message:registeredMessage});return;
   }
   if(path==='/api/auth/login'){
    const email=emailOf(data.email);limits.take(`login:${digest(email)}`,10,15*60000);if(typeof data.password!=='string'||data.password.length>128)fail(400,'密码格式不正确');
    const u=get('SELECT * FROM users WHERE email=?',email);const ok=u?await passwordMatches(data.password,u.password):(await passwordHash(data.password),false);
    if(!ok||u.banned)fail(401,'邮箱或密码不正确，或账号暂不可用');if(!u.verified)fail(403,'请先打开验证邮件完成邮箱验证');json(res,createSession(res,u));return;
   }
   if(path==='/api/auth/verify'){
    const t=get("SELECT * FROM tokens WHERE hash=? AND kind='verify' AND expires>?",digest(clean(data.token,128)),now());if(!t)fail(400,'验证链接已过期或已使用，请重新发送');
    transaction(()=>{run('UPDATE users SET verified=1 WHERE id=?',t.user_id);run('DELETE FROM tokens WHERE hash=?',t.hash);});json(res,{message:'邮箱验证成功，可以登录啦。'});return;
   }
   if(['/api/auth/resend','/api/auth/forgot'].includes(path)){
    const email=emailOf(data.email);limits.take(`mail:${digest(email)}`,3,3600000);const u=get('SELECT * FROM users WHERE email=?',email),kind=path.endsWith('resend')?'verify':'reset';
    if(u&&!u.banned&&(kind==='verify'?!u.verified:u.verified))await sendToken(u,kind);
    json(res,{message:'如果账号符合条件，邮件会寄到该邮箱。'});return;
   }
   if(path==='/api/auth/reset'){
    if(!validPassword(data.password))fail(400,'密码需要 10–128 个字符');const t=get("SELECT * FROM tokens WHERE hash=? AND kind='reset' AND expires>?",digest(clean(data.token,128)),now());if(!t)fail(400,'重设链接已过期或已使用');
    const hashed=await passwordHash(data.password);transaction(()=>{if(!get('SELECT 1 FROM tokens WHERE hash=?',t.hash))fail(400,'重设链接已使用');run('UPDATE users SET password=? WHERE id=?',hashed,t.user_id);run('DELETE FROM tokens WHERE user_id=?',t.user_id);});endSessions(t.user_id);json(res,{message:'密码已更新，请重新登录。'});return;
   }
   fail(404,'没有找到这个操作');
  }
  const me=sessionFor(req);if(!me)fail(401,'请先登录');if(mutating&&req.headers['x-csrf-token']!==me.csrf)fail(403,'登录状态需要刷新，请重新打开邮局');

  const authenticatedBody=async()=>{const data=await body(req);if(!sessionFor(req))fail(401,'请重新登录');return data;};
  if(method==='POST'&&path==='/api/logout'){run('DELETE FROM sessions WHERE hash=?',me.hash);for(const c of streams.get(me.id)||[])if(c.hash===me.hash)c.res.end();res.setHeader('Set-Cookie',sessionCookie('',config.production,0));json(res,{ok:true});return;}
  if(method==='GET'&&path==='/api/events'){
   const connections=streams.get(me.id)||new Set();if(connections.size>=5)fail(429,'打开的邮局太多了，请关闭一个窗口');
   res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-transform','Connection':'keep-alive','X-Accel-Buffering':'no'});res.write('event: ready\ndata: {}\n\n');
   const c={res,hash:me.hash};connections.add(c);streams.set(me.id,connections);if(connections.size===1)presence(me.id);
   const timer=setInterval(()=>{if(!sessionFor(req)){res.write('event: logout\ndata: {}\n\n');res.end();}else res.write(': heartbeat\n\n');},15000);timer.unref();
   res.on('close',()=>{clearInterval(timer);connections.delete(c);if(!connections.size){streams.delete(me.id);presence(me.id);}});return;
  }
  if(method==='GET'&&path==='/api/friends'){
   const list=peers(me.id).map(id=>user(id)).filter(u=>u&&!u.banned&&!blocked(me.id,u.id)).map(u=>{const last=get('SELECT * FROM messages WHERE (sender=? AND recipient=?) OR (sender=? AND recipient=?) ORDER BY id DESC LIMIT 1',me.id,u.id,u.id,me.id),read=get('SELECT message_id FROM reads WHERE owner=? AND peer=?',me.id,u.id)?.message_id||0,unread=get('SELECT COUNT(*) AS n FROM messages WHERE sender=? AND recipient=? AND id>?',u.id,me.id,read).n;return{...safeUser(u),last:last||null,unread};});list.sort((a,b)=>(b.last?.created||0)-(a.last?.created||0));json(res,{friends:list});return;
  }
  if(method==='GET'&&path==='/api/search'){
   limits.take(`search:${me.id}`,30);const q=handleOf(url.searchParams.get('q')||'');
   const found=all('SELECT * FROM users WHERE verified=1 AND banned=0 AND discoverable=1 AND handle=? AND id<>? LIMIT 1',q,me.id).filter(u=>!blocked(me.id,u.id)).map(u=>({...safeUser(u),friend:friends(me.id,u.id),pending:!!get('SELECT 1 FROM requests WHERE (sender=? AND recipient=?) OR (sender=? AND recipient=?)',me.id,u.id,u.id,me.id)}));json(res,{users:found});return;
  }
  if(method==='GET'&&path==='/api/requests'){json(res,requestList(me.id));return;}
  if(method==='POST'&&path==='/api/requests'){
   limits.take(`request:${me.id}`,12,3600000);const data=await authenticatedBody(),u=user(clean(data.userId,50));
   if(!u||!u.verified||u.banned||!u.discoverable||u.id===me.id||blocked(me.id,u.id))fail(404,'暂时找不到这位朋友');
   if(friends(me.id,u.id))fail(409,'你们已经是好友啦');if(get('SELECT 1 FROM requests WHERE (sender=? AND recipient=?) OR (sender=? AND recipient=?)',me.id,u.id,u.id,me.id))fail(409,'好友申请已经在路上了');
   if(peers(me.id).length>=200||peers(u.id).length>=200)fail(409,'好友数量已达上限');
   run('INSERT INTO requests VALUES(?,?,?,?)',randomUUID(),me.id,u.id,now());emit(u.id,'requests',{});json(res,{ok:true},201);return;
  }
  const requestMatch=path.match(/^\/api\/requests\/([\w-]+)\/(accept|decline)$/);
  if(method==='POST'&&requestMatch){await authenticatedBody();const r=get('SELECT * FROM requests WHERE id=? AND recipient=?',requestMatch[1],me.id);if(!r)fail(404,'这条申请已处理');
   if(requestMatch[2]==='accept'){if(blocked(me.id,r.sender)||!user(r.sender)||user(r.sender).banned)fail(403,'暂时不能添加这位朋友');if(peers(me.id).length>=200||peers(r.sender).length>=200)fail(409,'好友数量已达上限');transaction(()=>{run('INSERT OR IGNORE INTO friendships VALUES(?,?,?)',...pair(me.id,r.sender),now());run('DELETE FROM requests WHERE (sender=? AND recipient=?) OR (sender=? AND recipient=?)',me.id,r.sender,r.sender,me.id);});emit(r.sender,'friends',{});}else run('DELETE FROM requests WHERE id=?',r.id);
   emit(me.id,'friends',{});json(res,{ok:true});return;
  }
  const chat=path.match(/^\/api\/conversations\/([\w-]+)\/(messages|read)$/);
  if(chat){const peer=chat[1];requireFriend(me.id,peer);
   if(method==='GET'&&chat[2]==='messages'){
    const before=Math.max(0,Number(url.searchParams.get('before'))||0),after=Math.max(0,Number(url.searchParams.get('after'))||0);
    const rows=all(`SELECT * FROM messages WHERE ((sender=? AND recipient=?) OR (sender=? AND recipient=?)) AND id>? ${before?'AND id<?':''} ORDER BY id ${after?'ASC':'DESC'} LIMIT 60`,me.id,peer,peer,me.id,after,...(before?[before]:[]));if(!after)rows.reverse();json(res,{messages:rows,hasMore:rows.length===60});return;
   }
   if(method==='POST'&&chat[2]==='messages'){
    limits.take(`send:${me.id}`,50);const data=await authenticatedBody();requireFriend(me.id,peer);const kind=['text','heart','pat'].includes(data.kind)?data.kind:fail(400,'暂不支持这种互动'),clientId=clean(data.clientId,64);
    if(!/^[\w-]{12,64}$/.test(clientId))fail(400,'信件编号不正确');const old=get('SELECT * FROM messages WHERE sender=? AND client_id=?',me.id,clientId);if(old){if(old.recipient!==peer)fail(409,'信件编号冲突');json(res,{message:old});return;}
    const text=kind==='text'?clean(data.text,1000):'';if(kind!=='text')limits.take(`gesture:${me.id}:${peer}`,1,8000);
    const result=run('INSERT INTO messages(sender,recipient,kind,body,client_id,created) VALUES(?,?,?,?,?,?)',me.id,peer,kind,text,clientId,now()),message=get('SELECT * FROM messages WHERE id=?',Number(result.lastInsertRowid));
    emit(peer,'message',{peer:me.id,message,from:publicUser(me)});emit(me.id,'message',{peer,message,from:publicUser(me)});json(res,{message},201);return;
   }
   if(method==='POST'&&chat[2]==='read'){const data=await authenticatedBody();requireFriend(me.id,peer);const max=get('SELECT MAX(id) AS n FROM messages WHERE (sender=? AND recipient=?) OR (sender=? AND recipient=?)',me.id,peer,peer,me.id).n||0,id=Math.min(max,Math.max(0,Number(data.id)||0));run('INSERT INTO reads VALUES(?,?,?) ON CONFLICT(owner,peer) DO UPDATE SET message_id=MAX(message_id,excluded.message_id)',me.id,peer,id);emit(me.id,'read',{peer,id});json(res,{ok:true});return;}
  }
  if(method==='POST'&&path==='/api/friends/remove'){const data=await authenticatedBody(),id=clean(data.userId,50);run('DELETE FROM friendships WHERE a=? AND b=?',...pair(me.id,id));emit(id,'friends',{});emit(me.id,'friends',{});json(res,{ok:true});return;}
  if(method==='GET'&&path==='/api/blocks'){json(res,{users:all('SELECT u.* FROM blocks b JOIN users u ON u.id=b.target WHERE b.owner=?',me.id).map(publicUser)});return;}
  if(method==='POST'&&path==='/api/blocks'){const data=await authenticatedBody(),id=clean(data.userId,50);if(id===me.id||!user(id))fail(400,'无法屏蔽这个账号');transaction(()=>{run('INSERT OR IGNORE INTO blocks VALUES(?,?,?)',me.id,id,now());run('DELETE FROM friendships WHERE a=? AND b=?',...pair(me.id,id));run('DELETE FROM requests WHERE (sender=? AND recipient=?) OR (sender=? AND recipient=?)',me.id,id,id,me.id);});emit(id,'friends',{});emit(me.id,'friends',{});json(res,{ok:true});return;}
  if(method==='POST'&&path==='/api/blocks/remove'){const data=await authenticatedBody();run('DELETE FROM blocks WHERE owner=? AND target=?',me.id,clean(data.userId,50));json(res,{ok:true});return;}
  if(method==='POST'&&path==='/api/reports'){
   limits.take(`report:${me.id}`,10,86400000);const data=await authenticatedBody(),target=clean(data.userId,50),reason=clean(data.reason,500);if(target===me.id||!user(target))fail(404,'找不到这个账号');
   const message=data.messageId?get('SELECT * FROM messages WHERE id=? AND ((sender=? AND recipient=?) OR (sender=? AND recipient=?))',Number(data.messageId),me.id,target,target,me.id):null;
   if(!friends(me.id,target)&&!message&&!get('SELECT 1 FROM requests WHERE sender=? AND recipient=?',target,me.id))fail(403,'只能举报与你有互动的账号');
   run('INSERT INTO reports(id,reporter,target,message_id,reason,evidence,created) VALUES(?,?,?,?,?,?,?)',randomUUID(),me.id,target,message?.id||null,reason,message?.body||'',now());json(res,{ok:true});return;
  }
  if(method==='POST'&&path==='/api/profile'){const data=await authenticatedBody(),name=clean(data.name,20);if(!SPECIES.includes(data.species))fail(400,'请选择已有伙伴');run('UPDATE users SET name=?,species=?,discoverable=? WHERE id=?',name,data.species,data.discoverable===true?1:0,me.id);for(const id of peers(me.id))emit(id,'friends',{});json(res,{user:{...publicUser(user(me.id)),email:me.email,discoverable:data.discoverable===true}});return;}
  if(method==='GET'&&path==='/api/account/export'){json(res,{exportedAt:new Date().toISOString(),profile:{...publicUser(me),email:me.email},friends:peers(me.id).map(id=>publicUser(user(id))),messages:all('SELECT * FROM messages WHERE sender=? OR recipient=? ORDER BY id',me.id,me.id),requests:requestList(me.id)});return;}
  if(method==='POST'&&path==='/api/account/delete'){limits.take(`sensitive:${me.id}`,5,15*60000);const data=await authenticatedBody();if(typeof data.password!=='string'||data.password.length>128||!await passwordMatches(data.password,me.password))fail(400,'密码不正确');if(!sessionFor(req))fail(401,'请重新登录');const ids=peers(me.id);endSessions(me.id);run('DELETE FROM users WHERE id=?',me.id);for(const id of ids)emit(id,'friends',{});res.setHeader('Set-Cookie',sessionCookie('',config.production,0));json(res,{ok:true});return;}
  fail(404,'没有找到这个操作');
 }
 const server=createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
  if(config.production)res.setHeader('Strict-Transport-Security','max-age=31536000');
  try{
   const url=new URL(req.url,config.origin);if(url.pathname.startsWith('/api/')){await route(req,res,url);return;}
   if(req.method!=='GET'&&req.method!=='HEAD')fail(405,'不支持此操作');
   const named={'/':'postoffice.html','/postoffice.html':'postoffice.html','/postoffice.css':'postoffice.css','/postoffice.mjs':'postoffice.mjs','/postoffice-avatars.mjs':'postoffice-avatars.mjs','/rig-assets.mjs':'rig-assets.mjs','/rig-reference.mjs':'rig-reference.mjs','/mascot.mjs':'mascot.mjs','/privacy':'postoffice-legal.html','/terms':'postoffice-legal.html','/postoffice-legal.mjs':'postoffice-legal.mjs'};
   let name=named[url.pathname];if(!name&&/^\/assets\/[\w.-]+\.(png|webp|svg|jpg)$/.test(url.pathname))name=url.pathname.slice(1);if(!name)fail(404,'没有找到这个页面');
   const file=resolve(uiRoot,name);if(!file.startsWith(uiRoot+sep))fail(404,'没有找到这个页面');const info=await stat(file);if(!info.isFile())fail(404,'没有找到这个页面');
   const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.jpg':'image/jpeg'};
   res.writeHead(200,{'Content-Type':types[extname(file)],'Cache-Control':name.startsWith('assets/')?'public, max-age=86400':'no-cache'});if(req.method==='HEAD')res.end();else res.end(await readFile(file));
  }catch(error){if(res.headersSent){res.end();return;}const status=error.status||(error.code==='ENOENT'?404:500);if(status===500)console.error('POSTOFFICE_ERROR',error.code||error.name);json(res,{error:status===500?'邮局暂时忙碌，请稍后重试':error.message},status);}
 });
 server.requestTimeout=15000;server.headersTimeout=10000;
 const cleanup=()=>{const time=now();run('DELETE FROM sessions WHERE expires<?',time);run('DELETE FROM tokens WHERE expires<?',time);run('DELETE FROM messages WHERE created<?',time-config.retentionDays*86400000);run('DELETE FROM requests WHERE created<?',time-30*86400000);run('DELETE FROM reports WHERE created<?',time-config.retentionDays*86400000);run('DELETE FROM users WHERE verified=0 AND created<?',time-7*86400000);};cleanup();const cleanupTimer=setInterval(cleanup,3600000);cleanupTimer.unref();
 return{server,store,close:async()=>{clearInterval(cleanupTimer);for(const set of streams.values())for(const c of set)c.res.end();await new Promise(r=>server.close(r));store.close();}};
}
