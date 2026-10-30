import assert from 'node:assert/strict';
import {createClient} from '@libsql/client';
import {readFileSync,readdirSync} from 'node:fs';
import {handle} from '../lib/api.mjs';
import {storage as adapt} from '../lib/storage.mjs';
const db=createClient({url:'file::memory:'});
await db.execute('PRAGMA foreign_keys=ON');
for(const name of readdirSync(new URL('../migrations/',import.meta.url)).filter(x=>x.endsWith('.sql')).sort())await db.executeMultiple(readFileSync(new URL('../migrations/'+name,import.meta.url),'utf8'));
const storage=adapt(db);
const origin='https://example.test';
async function call(path,{session,body,origin:from=origin}={}){const res=await handle(new Request(origin+'/api'+path,{method:body?'POST':'GET',headers:{Origin:from,'Content-Type':'application/json',...(session?{Cookie:session.cookie,'X-CSRF-Token':session.csrf}:{})},body:body?JSON.stringify(body):undefined}),storage);return {status:res.status,...await res.json(),cookie:res.headers.get('set-cookie')?.split(';')[0]};}
const password='Local-test-Password!2026';
try{
 const a=await call('/auth/register',{body:{handle:'bunny_one',name:'耳朵',password,accepted:true,species:'rabbit'}}),b=await call('/auth/register',{body:{handle:'cloud_two',name:'云朵',password,accepted:true,species:'rabbit'}}),c=await call('/auth/register',{body:{handle:'outside_three',name:'第三人',password,accepted:true,species:'rabbit'}});assert.equal(a.status,201);assert.equal(b.status,201);assert.equal(c.status,201);assert.ok(a.recoveryCode);
 assert.equal((await call('/auth/register',{body:{handle:'no_pet',name:'未选',password,accepted:true}})).status,400);
 assert.equal((await call('/auth/register',{body:{handle:'bad_pet',name:'错误',password,accepted:true,species:'alien'}})).status,400);
 assert.equal((await call('/profile',{session:a,body:{name:'耳朵',species:'dog',discoverable:true}})).status,409);
 assert.equal((await call('/profile',{session:a,body:{name:'耳朵新昵称',discoverable:true}})).status,200);
 assert.equal((await call('/auth/me',{session:a})).user.species,'rabbit');
 assert.equal((await call('/auth/me')).status,401);assert.equal((await call('/requests',{session:a,body:{userId:b.user.id},origin:'https://evil.test'})).status,403);
 assert.equal((await call('/requests',{session:a,body:{userId:b.user.id}})).status,200);const rq=(await call('/requests',{session:b})).incoming[0];assert.equal((await call('/requests/'+rq.id+'/accept',{session:c,body:{}})).status,404);assert.equal((await call('/requests/'+rq.id+'/accept',{session:b,body:{}})).status,200);
 const synced=await call('/sync',{session:a});assert.equal(synced.friends.length,1);assert.deepEqual(synced.requests,{incoming:[],outgoing:[]});
 const sent=await call('/conversations/'+b.user.id+'/messages',{session:a,body:{kind:'text',text:'你好，云朵',clientId:'test-message-1'}});assert.equal(sent.message.body,'你好，云朵');assert.equal((await call('/conversations/'+a.user.id+'/messages',{session:b})).messages.length,1);assert.equal((await call('/conversations/'+a.user.id+'/messages',{session:c})).status,403);
 const duplicate=await call('/conversations/'+b.user.id+'/messages',{session:a,body:{kind:'text',text:'你好，云朵',clientId:'test-message-1'}});assert.equal(duplicate.message.id,sent.message.id);
 let rel=await call('/relationships/'+b.user.id+'/propose',{session:a,body:{kind:'father_son',myRole:'son'}});assert.equal(rel.request.myRole,'son');assert.equal((await call('/relationship-requests/'+rel.request.id+'/accept',{session:a,body:{}})).status,404);assert.equal((await call('/relationship-requests/'+rel.request.id+'/accept',{session:b,body:{}})).status,200);assert.equal((await call('/friends',{session:b})).friends[0].relationship.myRole,'father');
 await call('/blocks',{session:b,body:{userId:a.user.id}});assert.equal((await call('/conversations/'+b.user.id+'/messages',{session:a,body:{kind:'text',text:'禁止发送',clientId:'blocked-message'}})).status,403);assert.equal((await db.execute('SELECT COUNT(*) AS n FROM relationships')).rows[0].n,0);
 const reset=await call('/auth/recover',{body:{handle:'bunny_one',recoveryCode:a.recoveryCode,password:password+'new'}});assert.equal(reset.status,200);assert.notEqual(reset.recoveryCode,a.recoveryCode);assert.equal((await call('/auth/me',{session:a})).status,401);assert.equal((await call('/auth/recover',{body:{handle:'bunny_one',recoveryCode:a.recoveryCode,password}})).status,400);
 const login=await call('/auth/login',{body:{handle:'bunny_one',password:password+'new'}});assert.equal(login.status,200);assert.equal((await call('/account/export',{session:login})).messages.length,1);assert.equal((await call('/account/delete',{session:login,body:{password:password+'new'}})).status,200);assert.equal((await call('/auth/me',{session:login})).status,401);assert.equal((await db.execute('SELECT COUNT(*) AS n FROM messages')).rows[0].n,0);
 const logged=await call('/auth/login',{body:{handle:'cloud_two',password}});assert.equal((await call('/auth/logout',{session:logged,body:{}})).status,200);assert.equal((await call('/auth/me',{session:logged})).status,401);
 console.log('PASS: registration, session/CSRF, mutual friends, private messages, deduplication, relationship roles, blocking, recovery rotation, session revocation, export, account deletion and logout.');
}finally{db.close();}
