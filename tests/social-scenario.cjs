const {app}=require('electron'),fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict'),{randomUUID}=require('node:crypto');
const root=path.dirname(__dirname),data=process.env.MOFU_SOCIAL_TEST;
if(!data)throw Error('Isolated social test directory is required');
app.setPath('userData',path.join(data,'electron'));
app.disableHardwareAcceleration();
const checks=[],events=[],consoleErrors=[];
let controller;
app.whenReady().then(async()=>{
 try{
  const {origin,users:[a,b],shots}=JSON.parse(await fs.readFile(path.join(data,'fixture.json'),'utf8'));
  controller=await require('../desktop/postoffice.cjs')({root,dataRoot:data,allowedPet:()=>false,onEvent:e=>events.push(e),smoke:true});
  await controller.open({show:false});const win=controller.getWindow();win.setContentSize(940,700);
  win.webContents.on('console-message',(_,details)=>{if(details.level==='error')consoleErrors.push(details.message);});
  const run=(fn,arg)=>win.webContents.executeJavaScript(`(${fn.toString()})(${arg===undefined?'':JSON.stringify(arg)})`);
  async function wait(fn){const end=Date.now()+10000;while(!await run(fn)){if(Date.now()>end)throw Error('UI state timed out: '+String(fn)+' '+JSON.stringify(await run(()=>({width:innerWidth,height:innerHeight}))));await new Promise(r=>setTimeout(r,40));}}
  async function shot(name){await run(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});await new Promise(r=>setTimeout(r,180));await fs.writeFile(path.join(shots,name+'.png'),(await win.webContents.capturePage()).toPNG());}
  async function peerApi(endpoint,body){const r=await fetch(origin+'/api'+endpoint,{method:body?'POST':'GET',headers:{Origin:origin,'Content-Type':'application/json',Cookie:b.cookie,'X-CSRF-Token':b.csrf},body:body?JSON.stringify(body):undefined});const value=await r.json();assert.ok(r.ok,JSON.stringify(value));return value;}
  await wait(()=>!!document.querySelector('#postman-art img'));
  await shot('postoffice-login');
  assert.equal(await run(()=>typeof window.require),'undefined');assert.equal(await run(()=>typeof window.process),'undefined');
  const denied=await run(async()=>({config:await window.mofuPostoffice.config(),connect:await window.mofuPostoffice.connect('http://127.0.0.1:1')}));
  assert.equal(denied.config,null);assert.ok(denied.connect.error);checks.push('remote renderer is sandboxed; cannot read or overwrite desktop connection settings');
  await run(user=>{document.querySelector('#auth-email').value=user.email;document.querySelector('#auth-password').value=user.password;document.querySelector('#auth-form').requestSubmit();},a);
  await wait(()=>!document.querySelector('#postoffice').hidden);checks.push('verified account signs in through real native UI');
  await run(()=>{document.querySelector('[data-view=search]').click();document.querySelector('#friend-search').value='cloud_test';document.querySelector('#search-form').requestSubmit();});
  await wait(()=>document.querySelector('#people-list .accept')?.textContent==='加为好友');await shot('postoffice-search');
  await run(()=>document.querySelector('#people-list .accept').click());
  await wait(()=>document.querySelector('#people-list .accept')?.textContent==='申请已寄出');
  const incoming=await peerApi('/requests');assert.equal(incoming.incoming[0].handle,'mimi_test');
  await peerApi('/requests/'+incoming.incoming[0].id+'/accept',{});
  await run(()=>document.querySelector('[data-view=friends]').click());await wait(()=>!!document.querySelector('.person-row'));
  await run(()=>document.querySelector('.person-row').click());await wait(()=>!document.querySelector('#conversation').hidden);
  await run(()=>{const input=document.querySelector('#message-text');input.value='你好呀，云朵。一起在桌面上住下来吧！';input.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#composer').requestSubmit();});
  await wait(()=>document.querySelectorAll('.message').length===1);
  assert.equal((await peerApi('/conversations/'+a.user.id+'/messages')).messages[0].body,'你好呀，云朵。一起在桌面上住下来吧！');checks.push('search, friend request, recipient approval, and UI text delivery');
  win.close();assert.equal(win.isDestroyed(),false);assert.equal(win.isVisible(),false);
  await peerApi('/conversations/'+a.user.id+'/messages',{kind:'heart',clientId:randomUUID()});
  await wait(()=>[...document.querySelectorAll('.message')].some(n=>n.textContent.includes('收到一颗小心心')));
  assert.ok(events.some(e=>e.kind==='heart'&&e.name==='云朵'));const badgeDeadline=Date.now()+5000;while(!events.some(e=>e.unread>0)&&Date.now()<badgeDeadline)await new Promise(r=>setTimeout(r,40));assert.ok(events.some(e=>e.unread>0));checks.push('closing chat hides it; incoming SSE reaches native pet notification bridge');
  await peerApi('/conversations/'+a.user.id+'/messages',{kind:'text',text:'收到啦，今天也给你带来一朵小云。',clientId:randomUUID()});
  await wait(()=>document.querySelectorAll('.message').length===3);await shot('postoffice-chat');
  await run(()=>document.querySelector('#me-button').click());await wait(()=>document.querySelector('#profile-dialog').open);await shot('postoffice-profile');
  await run(()=>document.querySelector('#profile-dialog').close());
  win.setContentSize(390,760);await wait(()=>Math.abs(innerWidth-390)<=2);
  assert.ok(await run(()=>document.body.scrollWidth<=innerWidth));assert.ok(await run(()=>document.querySelector('#composer').getBoundingClientRect().bottom<=innerHeight));
  await run(()=>document.querySelector('#back-list').click());await wait(()=>document.querySelector('#postoffice').dataset.conversation==='false');await shot('postoffice-narrow');checks.push('390px window has no horizontal overflow and returns to friend list');
  await peerApi('/conversations/'+a.user.id+'/messages',{kind:'text',text:'<img src=x onerror="window.badMarkup=true">',clientId:randomUUID()});
  await wait(()=>document.querySelectorAll('.message').length===4);
  assert.equal(await run(()=>!!window.badMarkup||!!document.querySelector('#messages img[src=x]')),false);checks.push('incoming HTML is rendered as plain text');
  win.setContentSize(940,700);await win.webContents.reload();await wait(()=>!document.querySelector('#postoffice').hidden);await wait(()=>!!document.querySelector('.person-row'));
  await run(()=>document.querySelector('.person-row').click());await wait(()=>document.querySelectorAll('.message').length===4);checks.push('session and stored messages survive reload');
  await run(()=>{window.mofuPostoffice.configure().catch(()=>{});return true;});await wait(()=>document.querySelector('#postoffice-url')?.value.startsWith('http://127.0.0.1:'));assert.ok(win.webContents.getURL().startsWith('file:'));checks.push('switching post offices opens the local connection page');
  assert.deepEqual(consoleErrors,[]);checks.push('no renderer console errors');
  console.log(JSON.stringify({social:true,checks:checks.length,results:checks,screenshots:['postoffice-login','postoffice-search','postoffice-chat','postoffice-profile','postoffice-narrow']}));controller.dispose();app.exit(0);
 }catch(e){console.error(e.stack);controller?.dispose();app.exit(1);}
});
