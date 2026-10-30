import assert from 'node:assert/strict';
import {createClient} from '@libsql/client';
import {readFileSync,readdirSync} from 'node:fs';
import {storage} from '../lib/storage.mjs';
import {store} from '../lib/social.mjs';
import {homeRoute,homeState,heartbeat,rewardSocial,homeDay} from '../lib/home.mjs';
const db=createClient({url:'file::memory:'});await db.execute('PRAGMA foreign_keys=ON');
for(const name of readdirSync(new URL('../migrations/',import.meta.url)).filter(x=>x.endsWith('.sql')).sort())await db.executeMultiple(readFileSync(new URL('../migrations/'+name,import.meta.url),'utf8'));
const s=store(storage(db)),now=Date.parse('2026-10-30T01:00:00Z');
async function user(id){await s.run('INSERT INTO users(id,handle,name,species,password,created,seen) VALUES(?,?,?,?,?,?,?)',id,id,id,'rabbit','fixture',now,now);await s.run('INSERT INTO sessions(hash,user_id,csrf,expires) VALUES(?,?,?,?)',id,id,'fixture',now+10*86400000);return{id,name:id,species:'rabbit',sessionHash:id};}
async function rejects(fn,status){await assert.rejects(fn,e=>e.status===status);}
try{
 const a=await user('alice'),b=await user('bob');
 await Promise.all(Array.from({length:5},()=>homeState(s,a,now)));assert.equal((await homeState(s,a,now)).balance,20,'welcome is once per account');
 await rejects(()=>homeRoute(s,a,'/home/equip','POST',{itemId:'light-moon'},now),403);
 await rejects(()=>homeRoute(s,a,'/home/buy','POST',{itemId:'not-real',price:0},now),400);
 const bought=await homeRoute(s,a,'/home/buy','POST',{itemId:'plant-sprout',price:0},now);assert.equal(bought.balance,8,'client price is ignored');assert.equal(bought.equipped.plant,'plant-sprout');
 const again=await homeRoute(s,a,'/home/buy','POST',{itemId:'plant-sprout'},now);assert.equal(again.balance,8);
 await rejects(()=>homeRoute(s,a,'/home/buy','POST',{itemId:'light-mushroom'},now),409);
 const away=await homeRoute(s,a,'/home/put-away','POST',{slot:'plant'},now);assert.equal(away.equipped.plant,undefined);assert.ok(away.owned.includes('plant-sprout'));
 await homeRoute(s,a,'/home/equip','POST',{itemId:'plant-sprout'},now);
 const race=await user('race');await homeState(s,race,now);await Promise.allSettled(['plant-sprout','rug-cloud'].map(itemId=>homeRoute(s,race,'/home/buy','POST',{itemId},now)));
 const raced=await homeState(s,race,now);assert.ok(raced.balance>=0);assert.equal(raced.owned.filter(x=>['plant-sprout','rug-cloud'].includes(x)).length,1);
 await heartbeat(s,b,now);for(let i=1;i<=10;i++)await heartbeat(s,b,now+i*60000);
 assert.equal((await homeState(s,b,now+600000)).balance,22);await Promise.all(Array.from({length:5},()=>heartbeat(s,b,now+600000)));assert.equal((await homeState(s,b,now+600000)).today.minutes,10);
 await heartbeat(s,b,now+3600000);assert.equal((await homeState(s,b,now+3600000)).today.minutes,10,'offline gaps not rewarded');
 for(let i=1;i<=200;i++)await heartbeat(s,b,now+3600000+i*60000);
 assert.equal((await homeState(s,b,now+15600000)).today.presence,36);
 const midnight=Date.parse('2026-10-31T00:00:00+08:00');await heartbeat(s,b,midnight-30000);await heartbeat(s,b,midnight+30000);
 assert.equal((await s.get('SELECT elapsed_ms FROM home_presence WHERE user_id=?',b.id)).elapsed_ms,30000);assert.equal((await homeState(s,b,midnight+30000)).today.presence,0);
 await s.run('INSERT INTO friendships(a,b,created) VALUES(?,?,?)',a.id,b.id,now);
 await s.run("INSERT INTO messages(sender,recipient,kind,body,client_id,created) VALUES(?,?,'text','hello','a1',?)",a.id,b.id,now);
 await rewardSocial(s,a.id,b.id,'text',now);assert.equal((await homeState(s,a,now)).today.social,0,'one-way spam earns nothing');
 await s.run("INSERT INTO messages(sender,recipient,kind,body,client_id,created) VALUES(?,?,'text','hi','b1',?)",b.id,a.id,now);
 await Promise.all(Array.from({length:4},()=>rewardSocial(s,a.id,b.id,'text',now)));
 assert.equal((await homeState(s,a,now)).today.social,3);assert.equal((await homeState(s,b,now)).today.social,3);
 for(const [sender,recipient]of[[a.id,b.id],[b.id,a.id]])await s.run("INSERT INTO messages(sender,recipient,kind,body,client_id,created) VALUES(?,?,'heart','','gesture',?)",sender,recipient,now);
 await rewardSocial(s,a.id,b.id,'heart',now);assert.equal((await homeState(s,a,now)).today.social,4);
 const guest=await homeRoute(s,b,'/home/visit/alice','GET',{},now);assert.equal(guest.equipped.plant,'plant-sprout');assert.equal(guest.balance,undefined);assert.equal(guest.ledger,undefined);
 await rejects(()=>homeRoute(s,race,'/home/visit/alice','GET',{},now),403);
 for(let i=0;i<4;i++){const peer=await user('peer'+i);await s.run('INSERT INTO friendships(a,b,created) VALUES(?,?,?)',a.id,peer.id,now);for(const [sender,recipient]of[[a.id,peer.id],[peer.id,a.id]])await s.run("INSERT INTO messages(sender,recipient,kind,body,client_id,created) VALUES(?,?,'text','hello',?,?)",sender,recipient,'cap'+i,now);await rewardSocial(s,a.id,peer.id,'text',now);}
 assert.equal((await homeState(s,a,now)).today.social,10);
 for(let i=0;i<3;i++){for(const [sender,recipient]of[[a.id,'peer'+i],['peer'+i,a.id]])await s.run("INSERT INTO messages(sender,recipient,kind,body,client_id,created) VALUES(?,?,'pat','',?,?)",sender,recipient,'pat'+i,now);await rewardSocial(s,a.id,'peer'+i,'pat',now);}
 assert.equal((await homeState(s,a,now)).today.social,12,'daily cap holds across different friends and kinds');
 await s.run('INSERT INTO blocks(owner,target,created) VALUES(?,?,?)',b.id,a.id,now);await rejects(()=>homeRoute(s,b,'/home/visit/alice','GET',{},now),403);
 await heartbeat(s,a,now);
 await s.run('DELETE FROM users WHERE id=?',a.id);for(const table of ['bean_ledger','home_inventory','home_equipment','home_presence'])assert.equal((await s.get('SELECT COUNT(*) AS n FROM '+table+' WHERE user_id=?',a.id)).n,0);
 console.log('PASS HOME: one-time grant, authoritative prices, atomic purchases, duplicate/multi-window protection, online cap, offline gap, midnight, reciprocal rewards, daily social cap, private visits and deletion cascades.');
}finally{db.close();}
