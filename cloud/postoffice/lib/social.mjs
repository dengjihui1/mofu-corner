import {rewardSocial} from './home.mjs';
import {randomUUID} from 'node:crypto';
import {relationshipType} from './relationship-types.ts';
export const fail=(status,message)=>{throw Object.assign(Error(message),{status});};
export const clean=(value,max)=>{if(typeof value!=='string'||!value.trim()||value.trim().length>max||/[\x00-\x1f]/.test(value))fail(400,'内容长度或格式不正确');return value.trim();};
export const species=['rat','ox','tiger','rabbit','dragon','snake','horse','sheep','monkey','rooster','dog','pig','otter'];
export const publicUser=u=>({id:u.id,handle:u.handle,name:u.name,species:u.species,outfit:JSON.parse(u.outfit_json||'{}'),online:u.seen>Date.now()-45000});
export const pair=(a,b)=>[a,b].sort();
export function store(db){const statement=(sql,...args)=>db.prepare(sql).bind(...args);return {statement,get:(sql,...args)=>statement(sql,...args).first(),all:async(sql,...args)=>(await statement(sql,...args).all()).results,run:(sql,...args)=>statement(sql,...args).run(),batch:rows=>db.batch(rows.map(([sql,...args])=>statement(sql,...args)))};}
export async function limit(s,key,max,period=60000){const n=Date.now(),r=await s.get('INSERT INTO limits(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires<=? THEN 1 ELSE count+1 END,expires=CASE WHEN expires<=? THEN excluded.expires ELSE expires END RETURNING count',key,n+period,n,n);if(r.count>max)fail(429,'操作有点快，稍后再试');}
export async function social(s,me,path,method,data,url){
 const now=Date.now(),week=7*86400000,retention=now-180*86400000,{get,all,run,batch}=s;
 const blocked=(a,b)=>get('SELECT 1 FROM blocks WHERE (owner=? AND target=?) OR (owner=? AND target=?)',a,b,b,a);
 const isFriend=(a,b)=>get('SELECT 1 FROM friendships WHERE a=? AND b=?',...pair(a,b));
 const friend=async id=>{if(id===me.id||!await isFriend(me.id,id)||await blocked(me.id,id)||!await get('SELECT 1 FROM users WHERE id=? AND banned=0',id))fail(403,'双方成为好友后才能互动');};
 const relationView=r=>{if(!r)return null;const other=relationshipType(r.kind)?.roles?.find(x=>x!==r.a_role)||null;return {id:r.id,kind:r.kind,myRole:me.id===r.a?r.a_role:other,peerRole:me.id===r.a?other:r.a_role,created:r.created,...(r.sender?{incoming:r.recipient===me.id,expires:r.created+week}:{})};};
 const relations=async id=>({relationship:relationView(await get('SELECT * FROM relationships WHERE a=? AND b=?',...pair(me.id,id))),relationshipRequest:relationView(await get('SELECT * FROM relationship_requests WHERE a=? AND b=? AND created>?',...pair(me.id,id),now-week))});
 const requestList=async()=>({incoming:await all('SELECT r.id,r.created,u.id AS user_id,u.handle,u.name,u.species FROM requests r JOIN users u ON u.id=r.sender WHERE r.recipient=? AND u.banned=0 AND r.created>?',me.id,now-30*86400000),outgoing:await all('SELECT r.id,r.created,u.id AS user_id,u.handle,u.name,u.species FROM requests r JOIN users u ON u.id=r.recipient WHERE r.sender=? AND r.created>?',me.id,now-30*86400000)});
 const contacts=()=>all('SELECT u.*,(SELECT json_group_object(slot,item_id) FROM home_equipment WHERE user_id=u.id AND slot IN(\'headwear\',\'neckwear\',\'carry\')) AS outfit_json FROM friendships f JOIN users u ON u.id=CASE WHEN f.a=? THEN f.b ELSE f.a END WHERE (f.a=? OR f.b=?) AND u.banned=0',me.id,me.id,me.id);
 const guard=`EXISTS(SELECT 1 FROM friendships WHERE a=? AND b=?) AND NOT EXISTS(SELECT 1 FROM blocks WHERE (owner=? AND target=?) OR (owner=? AND target=?)) AND EXISTS(SELECT 1 FROM users WHERE id=? AND banned=0) AND EXISTS(SELECT 1 FROM sessions WHERE hash=? AND expires>?)`;
 const guardArgs=id=>[...pair(me.id,id),me.id,id,id,me.id,id,me.sessionHash,now];
 if(method==='GET'&&path==='/friends'){
  const rows=await all(`SELECT u.*,(SELECT json_group_object(slot,item_id) FROM home_equipment WHERE user_id=u.id AND slot IN(\'headwear\',\'neckwear\',\'carry\')) AS outfit_json,f.a AS fa,f.b AS fb,r.id AS rid,r.kind AS rk,r.a_role AS rr,r.created AS rc,p.id AS pid,p.kind AS pk,p.a_role AS pr,p.created AS pc,p.sender AS ps,p.recipient AS pt,
   (SELECT json_object('id',m.id,'sender',m.sender,'recipient',m.recipient,'kind',m.kind,'body',m.body,'created',m.created) FROM messages m WHERE ((m.sender=? AND m.recipient=u.id) OR (m.sender=u.id AND m.recipient=?)) AND m.created>? ORDER BY m.id DESC LIMIT 1) AS last,
   (SELECT COUNT(*) FROM messages m WHERE m.sender=u.id AND m.recipient=? AND m.created>? AND m.id>COALESCE((SELECT message_id FROM reads WHERE owner=? AND peer=u.id),0)) AS unread
   FROM friendships f JOIN users u ON u.id=CASE WHEN f.a=? THEN f.b ELSE f.a END
   LEFT JOIN relationships r ON r.a=f.a AND r.b=f.b LEFT JOIN relationship_requests p ON p.a=f.a AND p.b=f.b AND p.created>?
   WHERE (f.a=? OR f.b=?) AND u.banned=0 AND NOT EXISTS(SELECT 1 FROM blocks WHERE (owner=? AND target=u.id) OR (owner=u.id AND target=?))`,me.id,me.id,retention,me.id,retention,me.id,me.id,now-week,me.id,me.id,me.id,me.id);
  return {friends:rows.map(u=>({...publicUser(u),last:u.last?JSON.parse(u.last):null,unread:u.unread,
   relationship:relationView(u.rid?{id:u.rid,a:u.fa,b:u.fb,kind:u.rk,a_role:u.rr,created:u.rc}:null),
   relationshipRequest:relationView(u.pid?{id:u.pid,a:u.fa,b:u.fb,kind:u.pk,a_role:u.pr,created:u.pc,sender:u.ps,recipient:u.pt}:null)})).sort((a,b)=>(b.last?.created||0)-(a.last?.created||0))};
 }
 if(method==='GET'&&path==='/requests')return requestList();
 if(method==='GET'&&path==='/search'){
  await limit(s,'search:'+me.id,30);const q=String(url.searchParams.get('q')||'').toLowerCase();if(!/^[a-z][a-z0-9_]{2,23}$/.test(q))fail(400,'请输入完整绒角号');const u=await get('SELECT * FROM users WHERE handle=? AND id<>? AND banned=0 AND discoverable=1',q,me.id);if(!u||await blocked(me.id,u.id))return {users:[]};return {users:[{...publicUser(u),friend:!!await isFriend(me.id,u.id),pending:!!await get('SELECT 1 FROM requests WHERE (sender=? AND recipient=?) OR (sender=? AND recipient=?)',me.id,u.id,u.id,me.id)}]};
 }
 if(method==='POST'&&path==='/requests'){
  await limit(s,'request:'+me.id,12,3600000);const id=clean(data.userId,50);if(id===me.id||!await get('SELECT 1 FROM users WHERE id=? AND discoverable=1 AND banned=0',id)||await blocked(me.id,id))fail(404,'找不到这个账号');if(await isFriend(me.id,id))return {ok:true};
  if((await get('SELECT COUNT(*) AS n FROM friendships WHERE a=? OR b=?',me.id,me.id)).n>=200)fail(409,'好友数量已达上限');
  const r=await run('INSERT INTO requests(id,sender,recipient,created) SELECT ?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM requests WHERE (sender=? AND recipient=?) OR (sender=? AND recipient=?)) AND NOT EXISTS(SELECT 1 FROM blocks WHERE (owner=? AND target=?) OR (owner=? AND target=?))',randomUUID(),me.id,id,now,me.id,id,id,me.id,me.id,id,id,me.id);if(!r.meta.changes)fail(409,'已经有待处理的好友申请');return {ok:true};
 }
 const request=path.match(/^\/requests\/([\w-]+)\/(accept|decline)$/);
 if(method==='POST'&&request){
  const r=await get('SELECT * FROM requests WHERE id=? AND recipient=? AND created>?',request[1],me.id,now-30*86400000);if(!r)fail(404,'申请已处理');
  if(request[2]==='accept'){
   for(const id of [me.id,r.sender])if((await get('SELECT COUNT(*) AS n FROM friendships WHERE a=? OR b=?',id,id)).n>=200)fail(409,'好友数量已达上限');
   await batch([['INSERT OR IGNORE INTO friendships(a,b,created) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM requests WHERE id=? AND recipient=?) AND NOT EXISTS(SELECT 1 FROM blocks WHERE (owner=? AND target=?) OR (owner=? AND target=?)) AND EXISTS(SELECT 1 FROM users WHERE id=? AND banned=0)',...pair(me.id,r.sender),now,r.id,me.id,me.id,r.sender,r.sender,me.id,r.sender],['DELETE FROM requests WHERE id=? AND recipient=?',r.id,me.id]]);
  }else await run('DELETE FROM requests WHERE id=? AND recipient=?',r.id,me.id);return {ok:true};
 }
 const chat=path.match(/^\/conversations\/([\w-]+)\/(messages|read)$/);
 if(chat){const id=chat[1];await friend(id);
  if(method==='GET'&&chat[2]==='messages'){const before=Number(url.searchParams.get('before'))||Number.MAX_SAFE_INTEGER,after=Math.max(0,Number(url.searchParams.get('after'))||0);const rows=await all('SELECT * FROM messages WHERE ((sender=? AND recipient=?) OR (sender=? AND recipient=?)) AND id<? AND id>? AND created>? ORDER BY id '+(url.searchParams.has('after')?'ASC':'DESC')+' LIMIT 61',me.id,id,id,me.id,before,after,retention);return {messages:url.searchParams.has('after')?rows.slice(0,60):rows.slice(0,60).reverse(),hasMore:rows.length>60};}
  if(method==='POST'&&chat[2]==='messages'){
   const kind=data.kind,clientId=clean(data.clientId,80);if(!['text','heart','pat'].includes(kind))fail(400,'未知互动');let text='';if(kind==='text'){if(typeof data.text!=='string'||!data.text.trim()||data.text.trim().length>1000||/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(data.text))fail(400,'来信需要 1–1000 个字符');text=data.text.trim();}
   const duplicate=await get('SELECT * FROM messages WHERE sender=? AND client_id=?',me.id,clientId);if(duplicate){if(duplicate.recipient!==id||duplicate.kind!==kind||duplicate.body!==text)fail(409,'发送标识已使用');await rewardSocial(s,me.id,id,kind);return {message:duplicate};}
   await limit(s,'message:'+me.id,40);if(kind!=='text')await limit(s,'gesture:'+me.id+':'+id,1,8000);
   const message=await get(`INSERT INTO messages(sender,recipient,kind,body,client_id,created) SELECT ?,?,?,?,?,? WHERE ${guard} RETURNING *`,me.id,id,kind,text,clientId,now,...guardArgs(id));if(!message)fail(403,'好友状态已变化');await rewardSocial(s,me.id,id,kind);return {message};
  }
  if(method==='POST'&&chat[2]==='read'){const max=(await get('SELECT MAX(id) AS n FROM messages WHERE (sender=? AND recipient=?) OR (sender=? AND recipient=?)',me.id,id,id,me.id)).n||0;await run('INSERT INTO reads(owner,peer,message_id) VALUES(?,?,?) ON CONFLICT(owner,peer) DO UPDATE SET message_id=MAX(message_id,excluded.message_id)',me.id,id,Math.min(max,Math.max(0,Number(data.id)||0)));return {ok:true};}
 }
 const proposal=path.match(/^\/relationships\/([\w-]+)\/(propose|remove)$/),reply=path.match(/^\/relationship-requests\/([\w-]+)\/(accept|decline|cancel)$/);
 if(method==='POST'&&proposal){const id=proposal[1],[a,b]=pair(me.id,id);await friend(id);
  if(proposal[2]==='remove'){const current=await get('SELECT id FROM relationships WHERE a=? AND b=?',a,b);if(!current||current.id!==data.relationshipId)fail(409,'关系已变化，请刷新');await batch([['DELETE FROM relationship_requests WHERE a=? AND b=? AND EXISTS(SELECT 1 FROM relationships WHERE id=?)',a,b,current.id],['DELETE FROM relationships WHERE id=?',current.id]]);return {ok:true};}
  await limit(s,'relationship:'+me.id,12,3600000);const type=relationshipType(data.kind);if(!type)fail(400,'请选择已有关系');if(type.roles?!type.roles.includes(data.myRole):data.myRole!=null)fail(400,'请选择自己的身份');const role=type.roles?(me.id===a?data.myRole:type.roles.find(x=>x!==data.myRole)):null,current=await get('SELECT * FROM relationships WHERE a=? AND b=?',a,b);if(current?.kind===type.id&&current.a_role===role)fail(409,'已经绑定这段关系');
  const rid=randomUUID();await batch([['DELETE FROM relationship_requests WHERE a=? AND b=? AND created<=?',a,b,now-week],[`INSERT OR IGNORE INTO relationship_requests(id,a,b,sender,recipient,kind,a_role,created) SELECT ?,?,?,?,?,?,?,? WHERE ${guard}`,rid,a,b,me.id,id,type.id,role,now,...guardArgs(id)]]);const created=await get('SELECT * FROM relationship_requests WHERE id=?',rid);if(!created)fail(409,'请先处理当前邀请');return {request:relationView(created)};
 }
 if(method==='POST'&&reply){const actor=reply[2]==='cancel'?'sender':'recipient',r=await get('SELECT * FROM relationship_requests WHERE id=? AND '+actor+'=?',reply[1],me.id);if(!r)fail(404,'邀请已处理');const id=me.id===r.a?r.b:r.a;await friend(id);if(r.created<=now-week)fail(410,'邀请已过期');
  if(reply[2]==='accept')await batch([['INSERT INTO relationships(id,a,b,kind,a_role,created) SELECT ?,a,b,kind,a_role,? FROM relationship_requests WHERE id=? AND recipient=? AND created>? ON CONFLICT(a,b) DO UPDATE SET id=excluded.id,kind=excluded.kind,a_role=excluded.a_role,created=excluded.created',randomUUID(),now,r.id,me.id,now-week],['DELETE FROM relationship_requests WHERE id=? AND recipient=?',r.id,me.id]]);else await run('DELETE FROM relationship_requests WHERE id=? AND '+actor+'=?',r.id,me.id);return {ok:true};
 }
 if(method==='POST'&&path==='/friends/remove'){await run('DELETE FROM friendships WHERE a=? AND b=?',...pair(me.id,clean(data.userId,50)));return {ok:true};}
 if(method==='GET'&&path==='/blocks')return {users:(await all('SELECT u.*,(SELECT json_group_object(slot,item_id) FROM home_equipment WHERE user_id=u.id AND slot IN(\'headwear\',\'neckwear\',\'carry\')) AS outfit_json FROM blocks b JOIN users u ON b.target=u.id WHERE b.owner=?',me.id)).map(publicUser)};
 if(method==='POST'&&path==='/blocks'){const id=clean(data.userId,50);if(id===me.id||!await get('SELECT 1 FROM users WHERE id=?',id))fail(400,'无法屏蔽');await batch([['INSERT OR IGNORE INTO blocks(owner,target,created) VALUES(?,?,?)',me.id,id,now],['DELETE FROM friendships WHERE a=? AND b=?',...pair(me.id,id)],['DELETE FROM requests WHERE (sender=? AND recipient=?) OR (sender=? AND recipient=?)',me.id,id,id,me.id]]);return {ok:true};}
 if(method==='POST'&&path==='/blocks/remove'){await run('DELETE FROM blocks WHERE owner=? AND target=?',me.id,clean(data.userId,50));return {ok:true};}
 if(method==='POST'&&path==='/reports'){await limit(s,'report:'+me.id,10,86400000);const id=clean(data.userId,50),reason=clean(data.reason,500),message=await get('SELECT * FROM messages WHERE id=? AND ((sender=? AND recipient=?) OR (sender=? AND recipient=?))',Number(data.messageId)||0,me.id,id,id,me.id);if(!await isFriend(me.id,id)&&!message&&!await get('SELECT 1 FROM requests WHERE sender=? AND recipient=?',id,me.id))fail(403,'只能举报有互动的账号');await run('INSERT INTO reports(id,reporter,target,message_id,reason,evidence,created) VALUES(?,?,?,?,?,?,?)',randomUUID(),me.id,id,message?.id||null,reason,message?.body||'',now);return {ok:true};}
 if(method==='POST'&&path==='/profile'){const name=clean(data.name,20);if(data.species!==undefined&&data.species!==me.species)fail(409,'生肖在注册时已确定，不能更换；可以给伙伴换装。');await run('UPDATE users SET name=?,discoverable=? WHERE id=?',name,data.discoverable===true?1:0,me.id);return {user:{...publicUser({...me,name}),email:me.email,discoverable:data.discoverable===true}};}
 if(method==='GET'&&path==='/account/export'){const friends=[];for(const u of await contacts())friends.push({...publicUser(u),...await relations(u.id)});return {exportedAt:new Date().toISOString(),profile:publicUser(me),friends,requests:await requestList(),messages:await all('SELECT * FROM messages WHERE (sender=? OR recipient=?) AND created>? ORDER BY id',me.id,me.id,retention)};}
 fail(404,'没有找到这个操作');
}
