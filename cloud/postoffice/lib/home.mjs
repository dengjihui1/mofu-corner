import {readLayout,addPlacement,removePlacement,saveLayout} from './home-layout.mjs';
import {randomUUID} from 'node:crypto';
import {CATALOG,DEFAULT_HOME,HOME_RULES} from './home-catalog.mjs';
const bad=(status,message)=>{throw Object.assign(Error(message),{status});};
export const homeDay=now=>new Date(now+8*3600000).toISOString().slice(0,10);
const dayStart=day=>Date.parse(day+'T00:00:00+08:00');
const balanceSQL='COALESCE((SELECT SUM(delta) FROM bean_ledger WHERE user_id=?),0)';
async function welcome(s,id,now){await s.run("INSERT OR IGNORE INTO bean_ledger(user_id,event_key,reason,delta,day,created) SELECT ?,'welcome','welcome',20,?,? WHERE EXISTS(SELECT 1 FROM users WHERE id=? AND banned=0)",id,homeDay(now),now,id);}
export async function homeState(s,me,now=Date.now()){
 await welcome(s,me.id,now);const day=homeDay(now);
 const [money,inventory,equipment,presence,earned,ledger]=await Promise.all([
  s.get('SELECT '+balanceSQL+' AS balance',me.id),s.all('SELECT item_id FROM home_inventory WHERE user_id=?',me.id),s.all('SELECT slot,item_id FROM home_equipment WHERE user_id=?',me.id),
  s.get('SELECT elapsed_ms FROM home_presence WHERE user_id=? AND day=?',me.id,day),s.all("SELECT reason,SUM(delta) AS total FROM bean_ledger WHERE user_id=? AND day=? AND reason IN('presence','chat','gesture') GROUP BY reason",me.id,day),
  s.all('SELECT reason,delta,created,event_key FROM bean_ledger WHERE user_id=? ORDER BY id DESC LIMIT 20',me.id)]);
 return {layout:await readLayout(s,me.id),balance:Number(money.balance),catalog:CATALOG,owned:[...CATALOG.filter(x=>!x.price).map(x=>x.id),...inventory.map(x=>x.item_id)],equipped:{...DEFAULT_HOME,...Object.fromEntries(equipment.map(x=>[x.slot,x.item_id]))},today:{minutes:Math.floor((presence?.elapsed_ms||0)/60000),presence:earned.find(x=>x.reason==='presence')?.total||0,social:earned.filter(x=>x.reason!=='presence').reduce((n,x)=>n+x.total,0)},ledger,rules:HOME_RULES};
}
export async function heartbeat(s,me,now=Date.now()){
 const day=homeDay(now),start=dayStart(day);
 // One clock per account. Replayed/multi-window calls cannot advance it faster than server time.
 await s.batch([
  [`INSERT INTO home_presence(user_id,day,last_at,elapsed_ms) VALUES(?,?,?,0) ON CONFLICT(user_id) DO UPDATE SET
   elapsed_ms=MIN(10800000,CASE WHEN home_presence.day=excluded.day THEN home_presence.elapsed_ms ELSE 0 END +
    CASE WHEN excluded.last_at-home_presence.last_at BETWEEN 45000 AND 150000 THEN MIN(excluded.last_at-home_presence.last_at,excluded.last_at-?) ELSE 0 END),
   day=excluded.day,last_at=excluded.last_at WHERE excluded.last_at-home_presence.last_at>=45000`,me.id,day,now,start],
  [`INSERT OR IGNORE INTO bean_ledger(user_id,event_key,reason,delta,day,created)
   SELECT user_id,'presence:'||day||':'||CAST(elapsed_ms/600000 AS INTEGER),'presence',
    2*CAST(elapsed_ms/600000 AS INTEGER)-COALESCE((SELECT SUM(delta) FROM bean_ledger WHERE user_id=? AND day=? AND reason='presence'),0),day,?
   FROM home_presence WHERE user_id=? AND day=? AND 2*CAST(elapsed_ms/600000 AS INTEGER)>COALESCE((SELECT SUM(delta) FROM bean_ledger WHERE user_id=? AND day=? AND reason='presence'),0)`,me.id,day,now,me.id,day,me.id,day]
 ]);
 return homeState(s,me,now);
}
export async function rewardSocial(s,sender,recipient,kind,now=Date.now()){
 const day=homeDay(now),start=dayStart(day),reason=kind==='text'?'chat':'gesture',amount=kind==='text'?3:1;
 const kindFilter=kind==='text'?"kind='text'":"kind IN('heart','pat')";
 const rows=[sender,recipient].map((id,i)=>{const peer=i?sender:recipient;return [`INSERT OR IGNORE INTO bean_ledger(user_id,event_key,reason,delta,day,created)
  SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM messages WHERE sender=? AND recipient=? AND created>=? AND created<? AND ${kindFilter})
  AND EXISTS(SELECT 1 FROM messages WHERE sender=? AND recipient=? AND created>=? AND created<? AND ${kindFilter})
  AND EXISTS(SELECT 1 FROM friendships WHERE a=? AND b=?)
  AND NOT EXISTS(SELECT 1 FROM blocks WHERE (owner=? AND target=?) OR (owner=? AND target=?))
  AND COALESCE((SELECT SUM(delta) FROM bean_ledger WHERE user_id=? AND day=? AND reason IN('chat','gesture')),0)<=?`,
  id,`social:${day}:${reason}:${peer}`,reason,amount,day,now,sender,recipient,start,start+86400000,recipient,sender,start,start+86400000,...[sender,recipient].sort(),sender,recipient,recipient,sender,id,day,12-amount];});
 await s.batch(rows);
}
export async function homeRoute(s,me,path,method,data,now=Date.now()){
 if(path==='/home'&&method==='GET')return homeState(s,me,now);
 if(path==='/home/heartbeat'&&method==='POST')return heartbeat(s,me,now);
 if(path==='/home/layout'&&method==='POST'){await saveLayout(s,me,data,now);return homeState(s,me,now);}
 if(path==='/home/buy'&&method==='POST'){
  const item=CATALOG.find(x=>x.id===data.itemId);if(!item||!item.price)bad(400,'请选择商店里的装饰');
  await welcome(s,me.id,now);await readLayout(s,me.id);const order=randomUUID();
  await s.batch([
   [`INSERT OR IGNORE INTO home_inventory(user_id,item_id,purchase_id,price,acquired) SELECT ?,?,?,?,? WHERE ${balanceSQL}>=? AND EXISTS(SELECT 1 FROM sessions WHERE hash=? AND user_id=? AND expires>?)`,me.id,item.id,order,item.price,now,me.id,item.price,me.sessionHash,me.id,now],
   ["INSERT OR IGNORE INTO bean_ledger(user_id,event_key,reason,delta,day,created) SELECT user_id,'buy:'||item_id,'purchase',-price,?,? FROM home_inventory WHERE purchase_id=?",homeDay(now),now,order],
   ['INSERT INTO home_equipment(user_id,slot,item_id) SELECT user_id,?,item_id FROM home_inventory WHERE purchase_id=? ON CONFLICT(user_id,slot) DO UPDATE SET item_id=excluded.item_id',item.slot,order],
   ...addPlacement(me.id,item,order)
  ]);
  if(!await s.get('SELECT 1 FROM home_inventory WHERE user_id=? AND item_id=?',me.id,item.id))bad(409,'绒绒豆还不够，再陪伴一会儿吧');
  return homeState(s,me,now);
 }
 if(path==='/home/equip'&&method==='POST'){
  const item=CATALOG.find(x=>x.id===data.itemId);
  if(!item)bad(400,'找不到这件装饰');
  if(item.price&&!await s.get('SELECT 1 FROM home_inventory WHERE user_id=? AND item_id=?',me.id,item.id))bad(403,'先把这件装饰带回家吧');
  await readLayout(s,me.id);await s.batch([['INSERT INTO home_equipment(user_id,slot,item_id) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM sessions WHERE hash=? AND user_id=? AND expires>?) ON CONFLICT(user_id,slot) DO UPDATE SET item_id=excluded.item_id',me.id,item.slot,item.id,me.sessionHash,me.id,now],...addPlacement(me.id,item,null,{hash:me.sessionHash,now})]);
  return homeState(s,me,now);
 }
 if(path==='/home/put-away'&&method==='POST'){
  const itemId=data.itemId||(await s.get('SELECT item_id FROM home_equipment WHERE user_id=? AND slot=?',me.id,data.slot))?.item_id;const row=CATALOG.find(x=>x.id===itemId);if(!row&&!data.itemId)return homeState(s,me,now);
  if(!row||!['rug','seat','plant','light','art','shelf','table','headwear','neckwear','carry'].includes(row.slot))bad(400,'这件基础装饰不能收起');
  await readLayout(s,me.id);await s.batch([['DELETE FROM home_equipment WHERE user_id=? AND slot=? AND item_id=?',me.id,row.slot,row.id],removePlacement(me.id,row.id)]);return homeState(s,me,now);
 }
 const visit=path.match(/^\/home\/visit\/([\w-]+)$/);
 if(visit&&method==='GET'){
  const id=visit[1];if(!await s.get('SELECT 1 FROM friendships WHERE a=? AND b=?',...[me.id,id].sort())||await s.get('SELECT 1 FROM blocks WHERE (owner=? AND target=?) OR (owner=? AND target=?)',me.id,id,id,me.id))bad(403,'成为好友后才能来串门');
  const user=await s.get('SELECT name,species FROM users WHERE id=? AND banned=0',id);if(!user)bad(404,'这间小屋暂时没有开放');
  const rows=await s.all('SELECT slot,item_id FROM home_equipment WHERE user_id=?',id);
  return {layout:await readLayout(s,id),user,catalog:CATALOG,equipped:{...DEFAULT_HOME,...Object.fromEntries(rows.map(r=>[r.slot,r.item_id]))}};
 }
 bad(404,'没有找到这个小屋操作');
}
export async function exportHome(s,id){return {layout:await readLayout(s,id),ledger:await s.all('SELECT reason,delta,day,created FROM bean_ledger WHERE user_id=? ORDER BY id',id),inventory:await s.all('SELECT item_id,price,acquired FROM home_inventory WHERE user_id=?',id),equipped:await s.all('SELECT slot,item_id FROM home_equipment WHERE user_id=?',id),presence:await s.get('SELECT day,elapsed_ms,last_at FROM home_presence WHERE user_id=?',id)};}
