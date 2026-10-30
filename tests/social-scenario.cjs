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
  async function wait(fn,arg){const end=Date.now()+10000;while(!await run(fn,arg)){if(Date.now()>end)throw Error('UI state timed out: '+String(fn)+' '+JSON.stringify(await run(()=>({width:innerWidth,height:innerHeight}))));await new Promise(r=>setTimeout(r,40));}}
  async function shot(name){await wait(()=>document.querySelector('#toast')?.hidden!==false);await run(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});await new Promise(r=>setTimeout(r,180));await fs.writeFile(path.join(shots,name+'.png'),(await win.webContents.capturePage()).toPNG());}
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
  await run(()=>document.querySelector('#relationship-open').click());await wait(()=>document.querySelector('#relationship-dialog').open);
  await run(()=>document.querySelector('[data-relationship=besties]').click());await shot('postoffice-relationship-choose');
  await run(()=>document.querySelector('#relationship-submit').click());await wait(()=>!document.querySelector('#relationship-cancel').hidden);
  let relation=(await peerApi('/friends')).friends[0];assert.equal(relation.relationship,null);assert.equal(relation.relationshipRequest.incoming,true);
  await peerApi('/relationship-requests/'+relation.relationshipRequest.id+'/accept',{});
  await wait(()=>document.querySelector('#relationship-status').textContent==='我们是闺蜜');await shot('postoffice-relationship');
  await peerApi('/relationships/'+a.user.id+'/propose',{kind:'couple'});
  await wait(()=>!document.querySelector('#relationship-accept').hidden);await run(()=>{document.querySelector('[data-close=relationship-dialog]').click();document.querySelector('[data-view=requests]').click();});await wait(()=>document.querySelector('.relationship-request .accept')?.textContent==='查看邀请');await run(()=>document.querySelector('.relationship-request .accept').click());await shot('postoffice-relationship-invite');
  await run(()=>document.querySelector('#relationship-decline').click());await wait(()=>document.querySelector('#relationship-status').textContent==='我们是闺蜜');
  await peerApi('/relationships/'+a.user.id+'/propose',{kind:'couple'});await wait(()=>!document.querySelector('#relationship-accept').hidden);await run(()=>document.querySelector('#relationship-accept').click());await wait(()=>document.querySelector('#relationship-status').textContent==='我们是情侣');assert.equal((await peerApi('/friends')).friends[0].relationship.kind,'couple');
  await run(()=>document.querySelector('[data-relationship=father_son]').click());assert.equal(await run(()=>document.querySelector('#relationship-submit').disabled),true);
  await run(()=>document.querySelector('[data-role=son]').click());await run(()=>document.querySelector('#relationship-submit').click());await wait(()=>!document.querySelector('#relationship-cancel').hidden);
  relation=(await peerApi('/friends')).friends[0];assert.equal(relation.relationshipRequest.myRole,'father');
  await peerApi('/relationship-requests/'+relation.relationshipRequest.id+'/accept',{});await wait(()=>document.querySelector('#relationship-status').textContent==='我们是父子');
  assert.ok(await run(()=>document.querySelector('#relationship-pair').textContent.includes('儿子')));checks.push('relationship invitation, recipient consent, decline, badges, and directional family roles');
  await run(()=>document.querySelector('[data-relationship=couple]').click());await run(()=>document.querySelector('#relationship-submit').click());await wait(()=>!document.querySelector('#relationship-cancel').hidden);
  await run(()=>document.querySelector('#relationship-cancel').click());await wait(()=>document.querySelector('#relationship-status').textContent==='我们是父子');
  await run(()=>document.querySelector('[data-relationship=besties]').click());await run(()=>document.querySelector('#relationship-submit').click());await wait(()=>!document.querySelector('#relationship-cancel').hidden);
  relation=(await peerApi('/friends')).friends[0];await peerApi('/relationship-requests/'+relation.relationshipRequest.id+'/accept',{});await wait(()=>document.querySelector('#relationship-status').textContent==='我们是闺蜜');
  win.setContentSize(390,760);await wait(()=>Math.abs(innerWidth-390)<=2);assert.ok(await run(()=>document.querySelector('#relationship-dialog').scrollWidth<=document.querySelector('#relationship-dialog').clientWidth));await shot('postoffice-relationship-narrow');
  win.setContentSize(940,700);
  await run(()=>document.querySelector('#relationship-remove').click());await wait(()=>document.querySelector('#confirm-dialog').open);await run(()=>document.querySelector('#confirm-submit').click());await wait(()=>!document.querySelector('#confirm-dialog').open);await wait(()=>document.querySelector('#relationship-status').textContent==='给你们一个特别的称呼');
  assert.equal((await peerApi('/friends')).friends[0].relationship,null);
  await run(()=>document.querySelector('[data-relationship=besties]').click());await run(()=>document.querySelector('#relationship-submit').click());await wait(()=>!document.querySelector('#relationship-cancel').hidden);relation=(await peerApi('/friends')).friends[0];await peerApi('/relationship-requests/'+relation.relationshipRequest.id+'/accept',{});await wait(()=>document.querySelector('#relationship-status').textContent==='我们是闺蜜');
  if(process.env.MOFU_TASTE_SKILL){
   const url=require('node:url'),base=process.env.MOFU_TASTE_SKILL;
   const {probe,app:appProbe}=await import(url.pathToFileURL(path.join(base,'scripts/lib/probe.mjs')).href),{judge,judgeApp,APP_SKIP}=await import(url.pathToFileURL(path.join(base,'scripts/lib/rules.mjs')).href),audits=[];
   for(const width of [1440,768,390]){win.setContentSize(width,900);await wait(w=>Math.abs(innerWidth-w)<=2,width);await new Promise(r=>setTimeout(r,150));const metrics=await run(probe),appMetrics=await run(appProbe);audits.push({width,findings:[...judge(metrics,{width,allow:['covered-text']}).filter(f=>!APP_SKIP.has(f.id)),...judgeApp(appMetrics,metrics,{width})]});}
   await fs.writeFile(path.join(root,'.taste-skill','relationship-audit.json'),JSON.stringify(audits,null,2));assert.deepEqual(audits.flatMap(a=>a.findings.filter(f=>f.level==='FAIL')),[]);win.setContentSize(940,700);
  }
  await run(()=>{document.querySelector('#relationship-dialog').close();document.querySelector('[data-view=friends]').click();});checks.push('relationship inbox, withdrawal, mutual unbinding and compact dialog remain usable');
  await run(()=>{const input=document.querySelector('#message-text');input.value='你好呀，云朵。一起在桌面上住下来吧！';input.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#composer').requestSubmit();});
  await wait(()=>document.querySelectorAll('.message').length===1);
  assert.equal((await peerApi('/conversations/'+a.user.id+'/messages')).messages[0].body,'你好呀，云朵。一起在桌面上住下来吧！');checks.push('search, friend request, recipient approval, and UI text delivery');
  win.close();assert.equal(win.isDestroyed(),false);assert.equal(win.isVisible(),false);events.length=0;
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
  await run(()=>document.querySelector('.person-row').click());await wait(()=>document.querySelectorAll('.message').length===4);assert.equal(await run(()=>document.querySelector('#relationship-open').textContent),'闺蜜');checks.push('session, relationship badge and stored messages survive reload');
  await run(()=>{window.mofuPostoffice.configure().catch(()=>{});return true;});await wait(()=>document.querySelector('#postoffice-url')?.value.startsWith('http://127.0.0.1:'));assert.ok(win.webContents.getURL().startsWith('file:'));checks.push('switching post offices opens the local connection page');
  assert.deepEqual(consoleErrors,[]);checks.push('no renderer console errors');
  console.log(JSON.stringify({social:true,checks:checks.length,results:checks,screenshots:['postoffice-login','postoffice-search','postoffice-chat','postoffice-profile','postoffice-narrow','postoffice-relationship-choose','postoffice-relationship','postoffice-relationship-invite','postoffice-relationship-narrow']}));controller.dispose();app.exit(0);
 }catch(e){console.error(e.stack);controller?.dispose();app.exit(1);}
});
