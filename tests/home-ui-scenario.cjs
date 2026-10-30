const {app,BrowserWindow}=require('electron');
const {createServer}=require('node:http');
const {readFile,mkdir,mkdtemp,writeFile}=require('node:fs/promises');
const {resolve,join,extname,sep}=require('node:path');
const {pathToFileURL}=require('node:url');
const assert=require('node:assert/strict');
const root=resolve(__dirname,'..'),publicRoot=join(root,'cloud/postoffice/public');
let server,win;const errors=[],checks=[];
app.disableHardwareAcceleration();
(async()=>{
 const work=join(root,'.local/home-ui-review');await mkdir(work,{recursive:true});
 app.setPath('userData',await mkdtemp(join(work,'electron-')));await app.whenReady();
 const {CATALOG,DEFAULT_HOME,HOME_RULES}=await import(pathToFileURL(join(root,'cloud/postoffice/lib/home-catalog.mjs')));
 const {defaultLayout}=await import(pathToFileURL(join(publicRoot,'room-layout.mjs')));
 const initial={catalog:CATALOG,owned:CATALOG.filter(x=>x.price===0).map(x=>x.id),equipped:{...DEFAULT_HOME},layout:{revision:1,nodes:defaultLayout(DEFAULT_HOME,CATALOG)},balance:20,today:{minutes:0,presence:0,social:0},rules:HOME_RULES,ledger:[]};
 const html=`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${['postoffice','postoffice-home','home-cozy','home-editor'].map(x=>'<link rel="stylesheet" href="/'+x+'.css">').join('')}<title>小屋交互验收</title></head><body><header class="post-header"><h1>绒角</h1><span id="connection">在线</span></header><div id="me-avatar"></div><main class="letter-pane"></main><script type="module">
 import {createHomeUI} from '/postoffice-home.mjs';import {defaultNode,ROOM_SLOTS} from '/room-layout.mjs';
 window.fixture={state:${JSON.stringify(initial)},calls:[],conflict:false,hold:false,fail:false,delayVisits:false,visits:{}};
 window.me={id:'fixture-rabbit',name:'耳朵',species:'rabbit',outfit:{}};
 const copy=x=>structuredClone(x);const failure=(status,message)=>Object.assign(new Error(message),{status});
 async function api(path){if(path.startsWith('/home/visit/')){const id=path.split('/').at(-1);if(fixture.delayVisits)await new Promise(r=>fixture.visits[id]=r);return{user:{id,name:id,species:'dragon'},catalog:fixture.state.catalog,equipped:fixture.state.equipped,layout:copy(fixture.state.layout)};}return copy(fixture.state);}
 async function post(path,data){fixture.calls.push({path,data:copy(data)});if(path==='/home/layout'){
  if(fixture.hold)await new Promise(r=>fixture.release=r);
  if(fixture.fail){fixture.fail=false;throw failure(503,'暂时连接不上，请重试。');}
  if(fixture.conflict){fixture.conflict=false;fixture.state.layout.revision++;fixture.state.layout.nodes.pet.x=22;throw failure(409,'小屋有更新。');}
  if(data.revision!==fixture.state.layout.revision)throw failure(409,'小屋有更新。');
  fixture.state.layout={nodes:copy(data.nodes),revision:data.revision+1};
 }else if(path==='/home/buy'||path==='/home/equip'){
  const item=fixture.state.catalog.find(x=>x.id===data.itemId);if(!fixture.state.owned.includes(item.id)){if(item.price>fixture.state.balance)throw failure(409,'绒绒豆不足');fixture.state.balance-=item.price;fixture.state.owned.push(item.id);}
  fixture.state.equipped[item.slot]=item.id;if(ROOM_SLOTS.includes(item.slot))fixture.state.layout.nodes[item.id]=defaultNode(item.slot);
 }else if(path==='/home/put-away'){
  const item=fixture.state.catalog.find(x=>x.id===data.itemId);delete fixture.state.layout.nodes[item.id];if(fixture.state.equipped[item.slot]===item.id)delete fixture.state.equipped[item.slot];
 }return copy(fixture.state);}
 window.home=createHomeUI({getMe:()=>me,api,post,toast:text=>fixture.toast=text,onAppearance:()=>fixture.appearance=(fixture.appearance||0)+1});
 await home.open();window.ready=true;
 </script></body></html>`;
 server=createServer(async(req,res)=>{try{if(req.url==='/__home-test'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html);return;}const file=resolve(publicRoot,'.'+decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname));if(!file.startsWith(publicRoot+sep)){res.writeHead(404);res.end();return;}const body=await readFile(file),mime={'.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'}[extname(file)]||'application/octet-stream';res.writeHead(200,{'Content-Type':mime});res.end(body);}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 win=new BrowserWindow({show:false,width:1240,height:900,webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false}});
 win.webContents.on('console-message',e=>{if(e.level==='error'||e.level===3){errors.push(e.message);console.error('RENDERER',e.message);}});
 await win.loadURL(`http://127.0.0.1:${server.address().port}/__home-test`);
 const run=(fn,arg)=>win.webContents.executeJavaScript(`(${fn.toString()})(${arg===undefined?'':JSON.stringify(arg)})`).catch(e=>{console.error('FAILED EVAL',fn.toString(),arg);throw e;});
 async function wait(fn,arg){const until=Date.now()+12000;while(!await run(fn,arg)){if(Date.now()>until)throw Error('Timed out: '+fn.toString());await new Promise(r=>setTimeout(r,30));}}
 async function click(selector){await run(s=>document.querySelector(s).click(),selector);}
 async function change(selector,value,event='change'){await run(({selector,value,event})=>{const n=document.querySelector(selector);n.value=value;n.dispatchEvent(new Event(event,{bubbles:true}));},{selector,value,event});}
 async function edit(){await click('#home-design');await wait(()=>!!document.querySelector('#home-scene .is-editable'));}
 async function move(){await run(()=>document.querySelector('#home-scene [data-node="pet"]').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true})));}
 async function unloadBlocked(){return run(()=>{const e=new Event('beforeunload',{cancelable:true});window.dispatchEvent(e);return e.defaultPrevented;});}
 async function shot(name){await run(async()=>{await document.fonts.ready;await Promise.allSettled([...document.images].map(i=>i.decode()));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});await new Promise(r=>setTimeout(r,100));await writeFile(join(work,name+'.png'),(await win.webContents.capturePage()).toPNG());}
 await wait(()=>window.ready&&!!document.querySelector('#home-scene .mofu-room'));
 await click('[data-home-tab="shop"]');await change('#home-search','小雏菊','input');
 assert.equal(await run(()=>document.querySelectorAll('.home-product').length),3);
 assert.ok(await run(()=>[...document.querySelectorAll('.home-product')].every(x=>x.textContent.includes('小雏菊'))));
 await change('#home-search','不存在的家具','input');assert.ok(await run(()=>document.querySelector('.home-empty').textContent.includes('没有找到')));
 await click('#home-clear-filters');assert.equal(await run(()=>document.querySelectorAll('.home-product').length),CATALOG.length);checks.push('Search, empty state and clearing filters');
 await click('[data-home-tab="wardrobe"]');await change('#home-ownership','owned');assert.equal(await run(()=>document.querySelectorAll('.home-product').length),2);
 await change('#home-ownership','affordable');assert.equal(await run(()=>document.querySelectorAll('.home-product').length),2);
 await click('[data-product-id="wear-daisy"]');assert.equal(await run(()=>fixture.calls.filter(x=>x.path==='/home/buy').length),0);
 assert.ok(await run(()=>document.querySelector('[data-product-id="wear-daisy"]').textContent.includes('试戴中')));
 assert.equal(await run(()=>me.outfit.headwear),undefined);
 await click('#home-selection .primary');await wait(()=>fixture.state.balance===4&&document.querySelector('#home-wallet b').textContent==='4');
 assert.equal(await run(()=>me.outfit.headwear),'wear-daisy');assert.equal(await run(()=>fixture.calls.filter(x=>x.path==='/home/buy').length),1);checks.push('Owned/affordable filters, non-spending preview and explicit purchase synchronize outfit');
 await click('[data-home-tab="shop"]');await click('[data-product-id="light-moon"]');assert.ok(await run(()=>document.querySelector('#home-selection .primary').disabled));assert.ok(await run(()=>document.querySelector('#home-selection .primary').textContent.includes('56')));checks.push('Insufficient balance explains the exact shortfall');
 await click('#home-preview-reset');await edit();assert.equal(await run(()=>document.querySelector('#home-design-save').disabled),true);assert.equal(await unloadBlocked(),false);
 await run(()=>document.querySelector('.home-dialog').dispatchEvent(new Event('cancel',{cancelable:true})));await wait(()=>!document.querySelector('.home-dialog').open);assert.equal(await run(()=>document.querySelector('.home-leave-dialog').open),false);checks.push('Unchanged room exits without a confirmation');
 await run(()=>home.open());await edit();await move();assert.equal(await unloadBlocked(),true);
 await click('.home-close');assert.equal(await run(()=>document.querySelector('.home-leave-dialog').open),true);await shot('home-unsaved-dialog');await click('#home-leave-continue');assert.equal(await run(()=>document.querySelector('.home-dialog').open),true);
 await click('[data-edit="undo"]');assert.equal(await unloadBlocked(),false);assert.equal(await run(()=>document.querySelector('#home-design-save').disabled),true);
 await click('[data-edit="redo"]');assert.equal(await unloadBlocked(),true);checks.push('Dirty close protection, continue, and undo-to-baseline clear unload warning');
 const localX=await run(()=>document.querySelector('#home-scene [data-node="pet"]').style.left);
 await run(()=>fixture.conflict=true);await click('#home-design-save');await wait(()=>document.querySelector('#home-design-save').textContent==='保存这份布置');
 assert.equal(await run(()=>document.querySelector('#home-scene [data-node="pet"]').style.left),localX);assert.equal(await unloadBlocked(),true);
 await click('#home-design-save');await wait(()=>!document.querySelector('.home-dialog').classList.contains('is-designing'));
 const writes=await run(()=>fixture.calls.filter(x=>x.path==='/home/layout'));
 assert.equal(writes[1].data.revision,writes[0].data.revision+1);assert.deepEqual(writes[1].data.nodes,writes[0].data.nodes);assert.equal(await unloadBlocked(),false);checks.push('409 refreshes revision but preserves local draft; explicit retry succeeds');
 await edit();await move();await click('.home-close');await click('#home-leave-discard');await wait(()=>!document.querySelector('.home-dialog').open);assert.equal(await unloadBlocked(),false);
 await run(()=>home.open());await wait(()=>!!document.querySelector('#home-scene .mofu-room'));assert.equal(await run(()=>document.querySelector('#home-scene [data-node="pet"]').style.left),localX);checks.push('Discard restores persisted layout and clears dirty warning');
 await edit();await move();await run(()=>fixture.hold=true);await click('.home-close');await click('#home-leave-save');await wait(()=>typeof fixture.release==='function');
 assert.equal(await run(()=>[...document.querySelectorAll('.home-leave-dialog button')].every(x=>x.disabled)),true);assert.equal(await run(()=>document.querySelector('.home-close').disabled),true);
 assert.equal(await run(()=>{const e=new Event('cancel',{cancelable:true});document.querySelector('.home-leave-dialog').dispatchEvent(e);return e.defaultPrevented;}),true);
 await run(()=>{fixture.hold=false;fixture.release();});await wait(()=>!document.querySelector('.home-dialog').open);assert.equal(await unloadBlocked(),false);checks.push('Save-and-close waits for completion and blocks duplicate/discard/escape while busy');
 await run(()=>home.open());await edit();await move();await run(()=>fixture.fail=true);await click('.home-close');await click('#home-leave-save');await wait(()=>!document.querySelector('#home-leave-error').hidden);assert.equal(await run(()=>document.querySelector('.home-leave-dialog').open),true);assert.equal(await unloadBlocked(),true);await click('#home-leave-continue');await click('.home-close');await click('#home-leave-discard');checks.push('Failed save keeps draft and shows recovery inside confirmation');
 await run(()=>{fixture.delayVisits=true;home.visit('先点的家');home.visit('后点的家');return true;});
 await wait(()=>!!fixture.visits['先点的家']&&!!fixture.visits['后点的家']);await run(()=>fixture.visits['后点的家']());await wait(()=>document.querySelector('#home-title').textContent==='后点的家的家');
 await run(async()=>{fixture.visits['先点的家']();await new Promise(r=>setTimeout(r,20));});assert.equal(await run(()=>document.querySelector('#home-title').textContent),'后点的家的家');
 await run(()=>{home.visit('关闭后的迟回');return true;});await wait(()=>!!fixture.visits['关闭后的迟回']);await click('.home-close');await run(async()=>{fixture.visits['关闭后的迟回']();await new Promise(r=>setTimeout(r,20));});assert.equal(await run(()=>document.querySelector('.home-dialog').open),false);
 await run(()=>home.open());await run(()=>{home.visit('回家后的迟回');return true;});await wait(()=>!!fixture.visits['回家后的迟回']);await run(()=>home.open());await run(async()=>{fixture.visits['回家后的迟回']();await new Promise(r=>setTimeout(r,20));});assert.equal(await run(()=>document.querySelector('#home-title').textContent),'耳朵的家');
 checks.push('Out-of-order visits, closing during a visit and returning home invalidate stale responses');
 await run(()=>home.open());await click('[data-home-tab="wardrobe"]');await click('[data-product-id="wear-bowtie"]');await shot('home-shop-desktop');
 await wait(()=>document.querySelector('#home-scene').getAttribute('aria-busy')==='false');
 const download=new Promise(resolve=>win.webContents.session.once('will-download',(_event,item)=>{item.setSavePath(join(work,'room-preview.png'));item.once('done',(_e,state)=>resolve(state));}));
 await click('#home-photo');assert.equal(await download,'completed');await wait(()=>fixture.toast==='照片收好啦。');assert.equal(await run(()=>document.querySelector('#home-photo').disabled),false);checks.push('Photo button downloads the visible preview and recovers from busy state');

 for(const width of [768,390]){win.setContentSize(width,844);await wait(w=>Math.abs(innerWidth-w)<=2,width);await run(()=>document.querySelector('.home-shop').scrollIntoView({block:'start'}));assert.equal(await run(()=>document.querySelector('.home-dialog').scrollWidth<=document.querySelector('.home-dialog').clientWidth+1),true);if(width===390){assert.ok(await run(()=>document.querySelector('.home-search').getBoundingClientRect().height>=44));assert.ok(await run(()=>document.querySelector('#home-ownership').getBoundingClientRect().height>=44));assert.equal(await run(()=>getComputedStyle(document.querySelector('.home-wear-preview')).display),'grid');assert.ok(await run(()=>document.querySelector('.home-wear-preview [data-item="wear-bowtie"]')));await shot('home-shop-mobile');}}
 checks.push('Tablet and 390px phone have no horizontal overflow; search and filter touch targets are 44px');
 assert.deepEqual(errors,[]);await run(()=>home.stop());console.log(JSON.stringify({homeUI:true,checks,screenshots:work}));
 win.destroy();server.close();app.exit(0);
})().catch(e=>{console.error(e.stack);win?.destroy();server?.close();app.exit(1);});
