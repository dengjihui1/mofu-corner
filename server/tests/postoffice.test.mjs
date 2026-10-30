import test from 'node:test';import {request} from 'node:http';import assert from 'node:assert/strict';import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join,resolve,dirname,basename} from 'node:path';
import {configuration} from '../config.mjs';import {createPostoffice} from '../application.mjs';
async function fixture(t){const dir=await mkdtemp(join(tmpdir(),'mofu-social-test-')),mails=[];const config=configuration({DATA_DIR:dir});const app=createPostoffice(config,{sendMail:async m=>mails.push(m)});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));config.origin=`http://127.0.0.1:${app.server.address().port}`;
 const call=async(path,{method='GET',body,session,origin=config.origin,csrf=true}={})=>{const res=await fetch(config.origin+path,{method,headers:{Origin:origin,'Content-Type':'application/json',...(session?{Cookie:session.cookie,...(csrf?{'X-CSRF-Token':session.csrf}:{})}:{})},body:body===undefined?undefined:JSON.stringify(body)});return{status:res.status,data:await res.json(),cookie:res.headers.get('set-cookie'),headers:res.headers};};
 const register=async(handle)=>{const data={handle,name:handle,email:handle+'@example.test',password:'LittlePet-password!23',accepted:true,species:handle==='bunny'?'rabbit':'rat'};const r=await call('/api/auth/register',{method:'POST',body:data});assert.equal(r.status,200);return data;};
 const verify=async data=>{const mail=mails.findLast(m=>m.to===data.email&&m.kind==='verify');assert.ok(mail);assert.equal((await call('/api/auth/verify',{method:'POST',body:{token:mail.token}})).status,200);};
 const login=async data=>{const r=await call('/api/auth/login',{method:'POST',body:data});assert.equal(r.status,200);assert.match(r.cookie,/HttpOnly/);assert.match(r.cookie,/SameSite=Strict/);return{...r.data,cookie:r.cookie.split(';')[0]};};
 const account=async h=>{const d=await register(h);await verify(d);return{data:d,session:await login(d)};};
 t.after(async()=>{await app.close();assert.equal(dirname(resolve(dir)),resolve(tmpdir()));assert.ok(basename(dir).startsWith('mofu-social-test-'));await rm(dir,{recursive:true,force:true});});return{app,config,call,register,verify,login,account,mails};}

test('public registration, verified login, real friend requests, private chat and live delivery',async t=>{
 const f=await fixture(t),alice=await f.register('mimi');assert.equal((await f.call('/api/auth/login',{method:'POST',body:alice})).status,403);await f.verify(alice);const a=await f.login(alice),{session:b}=await f.account('bunny'),{session:e}=await f.account('outsider');
 const post=(path,body,session=a,extras={})=>f.call(path,{method:'POST',body,session,...extras});
 assert.equal((await post('/api/profile',{name:'坏请求',species:'rat' },a,{origin:'https://evil.test'})).status,403);
 assert.equal((await post('/api/profile',{name:'坏请求',species:'rat'},a,{csrf:false})).status,403);
 const search=await f.call('/api/search?q=bunny',{session:a});assert.equal(search.data.users[0].handle,'bunny');assert.equal(search.data.users[0].email,undefined);
 const sendPath=`/api/conversations/${b.user.id}/messages`,id='message-id-123456';assert.equal((await post(sendPath,{kind:'text',text:'未成为好友',clientId:id})).status,403);
 assert.equal((await post('/api/requests',{userId:b.user.id})).status,201);const incoming=(await f.call('/api/requests',{session:b})).data.incoming;assert.equal(incoming.length,1);
 assert.equal((await post(`/api/requests/${incoming[0].id}/accept`,{},e)).status,404);assert.equal((await post(`/api/requests/${incoming[0].id}/accept`,{},b)).status,200);
 const abort=new AbortController();const events=await fetch(f.config.origin+'/api/events',{headers:{Cookie:b.cookie},signal:abort.signal});const reader=events.body.getReader();let received='';
 const incomingEvent=(async()=>{while(!received.includes('event: message')){const {value,done}=await reader.read();if(done)break;received+=new TextDecoder().decode(value);}return received;})();
 const sent=await post(sendPath,{kind:'text',text:'<img src=x onerror=alert(1)> 你好呀',clientId:id,sender:e.user.id});assert.equal(sent.status,201);assert.equal(sent.data.message.sender,a.user.id);
 assert.match(await incomingEvent,/你好呀/);abort.abort();assert.equal((await post(sendPath,{kind:'text',text:'retry',clientId:id})).data.message.id,sent.data.message.id);
 assert.equal((await f.call(`/api/conversations/${b.user.id}/messages`,{session:e})).status,403);
 assert.equal((await f.call('/api/friends',{session:b})).data.friends[0].unread,1);
 await post(`/api/conversations/${a.user.id}/read`,{id:sent.data.message.id},b);assert.equal((await f.call('/api/friends',{session:b})).data.friends[0].unread,0);
 assert.equal((await post(sendPath,{kind:'text',text:'a'.repeat(1001),clientId:'too-long-message-id'})).status,400);
 assert.equal((await post(sendPath,{kind:'heart',clientId:'heart-message-123'})).status,201);assert.equal((await post(sendPath,{kind:'pat',clientId:'pat-message-1234'})).status,429);
 assert.equal((await post('/api/reports',{userId:a.user.id,messageId:sent.data.message.id,reason:'测试举报'},b)).status,200);
 assert.equal(f.app.store.get('SELECT COUNT(*) AS n FROM reports').n,1);
 assert.equal((await post('/api/blocks',{userId:a.user.id},b)).status,200);assert.equal((await post(sendPath,{kind:'text',text:'blocked',clientId:'blocked-message-id'})).status,403);
 assert.equal((await f.call('/api/search?q=bunny',{session:a})).data.users.length,0);
 assert.equal((await f.call('/api/account/export',{session:a})).data.messages.length,2);
 assert.notEqual(f.app.store.get('SELECT password FROM users WHERE id=?',a.user.id).password,alice.password);
});

test('password reset is single use and invalidates earlier sessions; deletion removes account data',async t=>{
 const f=await fixture(t),{data,session}=await f.account('recover');
 assert.equal((await f.call('/api/auth/forgot',{method:'POST',body:{email:data.email}})).status,200);const mail=f.mails.findLast(m=>m.kind==='reset');
 const replacement='New-password-for-pet!';assert.equal((await f.call('/api/auth/reset',{method:'POST',body:{token:mail.token,password:replacement}})).status,200);
 assert.equal((await f.call('/api/auth/me',{session})).status,401);assert.equal((await f.call('/api/auth/reset',{method:'POST',body:{token:mail.token,password:replacement}})).status,400);
 const next=await f.login({...data,password:replacement});assert.equal((await f.call('/api/account/delete',{method:'POST',body:{password:'wrong'},session:next})).status,400);
 assert.equal((await f.call('/api/account/delete',{method:'POST',body:{password:replacement},session:next})).status,200);assert.equal((await f.call('/api/auth/me',{session:next})).status,401);
 assert.equal(f.app.store.get('SELECT COUNT(*) AS n FROM users').n,0);assert.equal(f.app.store.get('SELECT COUNT(*) AS n FROM sessions').n,0);
});

test('production cannot use unconfigured email delivery or an HTTP public address',()=>{
 assert.throws(()=>configuration({NODE_ENV:'production'}));assert.throws(()=>configuration({NODE_ENV:'production',PUBLIC_URL:'https://pet.example',MAIL_MODE:'outbox',SMTP_HOST:'smtp.example',MAIL_FROM:'hi@example.com',OPERATOR_NAME:'Example',SUPPORT_EMAIL:'help@example.com'}));
 const config=configuration({NODE_ENV:'production',PUBLIC_URL:'https://pet.example',SMTP_HOST:'smtp.example',MAIL_FROM:'hi@example.com',OPERATOR_NAME:'Example',SUPPORT_EMAIL:'help@example.com'});assert.equal(config.production,true);assert.equal(config.registration,true);
});


test('blocking and session revocation also stop requests whose bodies are still arriving',async t=>{
 const f=await fixture(t),{session:a}=await f.account('mimi'),{session:b}=await f.account('bunny');
 const post=(path,body,session=a)=>f.call(path,{method:'POST',body,session});
 await post('/api/requests',{userId:b.user.id});const r=(await f.call('/api/requests',{session:b})).data.incoming[0];await post('/api/requests/'+r.id+'/accept',{},b);
 async function delayed(path,payload,during){
  let arrived;const seen=new Promise(r=>arrived=r);const listener=req=>{if(req.url===path){f.app.server.off('request',listener);arrived();}};f.app.server.on('request',listener);
  const text=JSON.stringify(payload);let client;const result=new Promise((resolve,reject)=>{client=request(f.config.origin+path,{method:'POST',headers:{Origin:f.config.origin,'Content-Type':'application/json',Cookie:a.cookie,'X-CSRF-Token':a.csrf}},res=>{res.resume();res.on('end',()=>resolve(res.statusCode));});client.on('error',reject);});
  client.write(text.slice(0,10));await seen;await during();client.end(text.slice(10));return result;
 }
 assert.equal(await delayed('/api/conversations/'+b.user.id+'/messages',{kind:'text',text:'不应发出',clientId:'in-flight-message-123'},()=>post('/api/blocks',{userId:a.user.id},b)),403);
 assert.equal(f.app.store.get('SELECT COUNT(*) AS n FROM messages').n,0);
 assert.equal(await delayed('/api/profile',{name:'不应保存',species:'rat',discoverable:true},()=>post('/api/logout',{})),401);
 assert.equal(f.app.store.get('SELECT name FROM users WHERE id=?',a.user.id).name,'mimi');
});
