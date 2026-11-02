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
 const {HOME_STYLES,styleLayout}=await import(pathToFileURL(join(publicRoot,'home-styles.mjs')));
 const {defaultLayout}=await import(pathToFileURL(join(publicRoot,'room-layout.mjs')));
 const initial={catalog:CATALOG,owned:CATALOG.filter(x=>x.price===0).map(x=>x.id),equipped:{...DEFAULT_HOME},layout:{revision:1,nodes:defaultLayout(DEFAULT_HOME,CATALOG)},balance:20,today:{minutes:0,presence:0,social:0},rules:HOME_RULES,ledger:[]};
 const html=`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${['postoffice','postoffice-home','home-cozy','home-editor','studio-base','studio-home'].map(x=>'<link rel="stylesheet" href="/'+x+'.css">').join('')}<title>小屋交互验收</title></head><body><header class="post-header"><h1>绒角</h1><span id="connection">在线</span></header><div id="me-avatar"></div><main class="letter-pane"></main><script type="module">
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
 server=createServer(async(req,res)=>{try{if(req.url==='/home-collection.json'){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({catalog:CATALOG}));return;}if(req.url==='/__home-test'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html);return;}const file=resolve(publicRoot,'.'+decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname));if(!file.startsWith(publicRoot+sep)){res.writeHead(404);res.end();return;}const body=await readFile(file),mime={'.html':'text/html; charset=utf-8','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'}[extname(file)]||'application/octet-stream';res.writeHead(200,{'Content-Type':mime});res.end(body);}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 win=new BrowserWindow({show:false,width:1240,height:900,webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false,offscreen:true}});
 win.webContents.on('console-message',e=>{if(e.level==='error'||e.level===3){errors.push(e.message);console.error('RENDERER',e.message);}});
 await win.loadURL(`http://127.0.0.1:${server.address().port}/__home-test`);
 const run=(fn,arg)=>win.webContents.executeJavaScript(`(${fn.toString()})(${arg===undefined?'':JSON.stringify(arg)})`).catch(e=>{console.error('FAILED EVAL',fn.toString(),arg);throw e;});
 async function wait(fn,arg){const until=Date.now()+12000;while(!await run(fn,arg)){if(Date.now()>until)throw Error('Timed out: '+fn.toString());await new Promise(r=>setTimeout(r,30));}}
 async function click(selector){await run(s=>document.querySelector(s).click(),selector);}
 async function change(selector,value,event='change'){await run(({selector,value,event})=>{const n=document.querySelector(selector);n.value=value;n.dispatchEvent(new Event(event,{bubbles:true}));},{selector,value,event});}
 async function edit(){await click('#home-design');await wait(()=>!!document.querySelector('#home-scene .is-editable'));}
 async function move(){await run(()=>document.querySelector('#home-scene [data-node="pet"]').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true})));}
 async function unloadBlocked(){return run(()=>{const e=new Event('beforeunload',{cancelable:true});window.dispatchEvent(e);return e.defaultPrevented;});}
 async function shot(name){await run(async()=>{await document.fonts.ready;await Promise.allSettled([...document.images].map(i=>i.decode()));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});await new Promise(r=>setTimeout(r,260));await writeFile(join(work,name+'.png'),(await win.webContents.capturePage()).toPNG());}
 await wait(()=>window.ready&&!!document.querySelector('#home-scene .mofu-room'));
 await click('[data-home-tab="shop"]');await change('#home-search','小雏菊','input');
 assert.equal(await run(()=>document.querySelectorAll('.home-product').length),CATALOG.filter(item=>item.name.includes('小雏菊')).length);
 assert.ok(await run(()=>[...document.querySelectorAll('.home-product')].every(x=>x.textContent.includes('小雏菊'))));
 await change('#home-search','不存在的家具','input');assert.ok(await run(()=>document.querySelector('.home-empty').textContent.includes('没有找到')));
 await click('#home-clear-filters');assert.equal(await run(()=>document.querySelectorAll('.home-product').length),CATALOG.length);checks.push('Search, empty state and clearing filters');
 await click('[data-home-tab="wardrobe"]');await change('#home-ownership','owned');assert.equal(await run(()=>document.querySelectorAll('.home-product').length),2);
 await change('#home-ownership','affordable');assert.equal(await run(()=>document.querySelectorAll('.home-product').length),CATALOG.filter(x=>['headwear','neckwear','carry'].includes(x.slot)&&x.price>0&&x.price<=20).length);
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
 await run(()=>{document.querySelector('.home-close').click();home.visit('刚关闭又串门');return true;});await wait(()=>!!fixture.visits['刚关闭又串门']);await run(async()=>{await new Promise(r=>setTimeout(r,50));fixture.visits['刚关闭又串门']();});await wait(()=>document.querySelector('.home-dialog').open&&document.querySelector('#home-title').textContent==='刚关闭又串门的家');
 checks.push('Out-of-order visits, closing during a visit, immediate re-entry and returning home invalidate only stale responses');
 await run(()=>home.open());await click('[data-home-tab="wardrobe"]');await click('[data-product-id="wear-bowtie"]');await shot('home-shop-desktop');
 await wait(()=>document.querySelector('#home-scene').getAttribute('aria-busy')==='false');
 const download=new Promise(resolve=>win.webContents.session.once('will-download',(_event,item)=>{item.setSavePath(join(work,'room-preview.png'));item.once('done',(_e,state)=>resolve(state));}));
 await click('#home-photo');assert.equal(await download,'completed');await wait(()=>fixture.toast==='照片收好啦。');assert.equal(await run(()=>document.querySelector('#home-photo').disabled),false);checks.push('Photo button downloads the visible preview and recovers from busy state');

 for(const width of [768,390]){win.setContentSize(width,844);await wait(w=>Math.abs(innerWidth-w)<=2,width);await run(()=>document.querySelector('.home-shop').scrollIntoView({block:'start'}));assert.equal(await run(()=>document.querySelector('.home-dialog').scrollWidth<=document.querySelector('.home-dialog').clientWidth+1),true);if(width===390){assert.ok(await run(()=>document.querySelector('.home-search').getBoundingClientRect().height>=44));assert.ok(await run(()=>document.querySelector('#home-ownership').getBoundingClientRect().height>=44));assert.equal(await run(()=>getComputedStyle(document.querySelector('.home-wear-preview')).display),'grid');assert.equal(await run(()=>document.querySelector('#home-products').scrollHeight<=document.querySelector('#home-products').clientHeight+1),true);assert.ok(await run(()=>document.querySelector('#home-selection').getBoundingClientRect().bottom<=innerHeight+1));assert.ok(await run(()=>document.querySelector('.home-wear-preview [data-item="wear-bowtie"]')));await shot('home-shop-mobile');}}
 checks.push('Tablet and 390px phone have no horizontal overflow; search and filter touch targets are 44px');

 // A theme stays a non-spending preview, including when its layout is edited.
 win.setContentSize(1240,900);await run(()=>{me.species='dog';fixture.state.layout.nodes.pet.x=41;return home.open();});
 await wait(()=>document.querySelector('#home-scene').getAttribute('aria-busy')==='false');
 const persisted=await run(()=>structuredClone(fixture.state)),dogImage=await run(()=>document.querySelector('#home-scene .room-pet img').src);
 const placements=()=>Object.fromEntries([...document.querySelectorAll('#home-scene [data-node]')].map(n=>[n.dataset.node,[n.style.left,n.style.top,n.style.transform,n.style.zIndex]]));
 const ownPositions=await run(placements);await edit();assert.deepEqual(await run(placements),ownPositions);await click('#home-design-cancel');
 await click('[data-home-tab="inspiration"]');assert.equal(await run(()=>document.querySelectorAll('.home-inspiration').length),5);
 await click('.home-inspiration');await wait(()=>document.querySelector('#home-scene').getAttribute('aria-busy')==='false');
 const themePositions=await run(placements),expected=styleLayout(HOME_STYLES[0],CATALOG);
 for(const [id,node]of Object.entries(expected)){assert.equal(themePositions[id][0],node.x+'%');assert.equal(themePositions[id][1],node.y+'%');}
 assert.equal(await run(()=>document.querySelector('#home-scene .room-pet img').src),dogImage);
 assert.equal(await run(()=>document.querySelectorAll('#home-scene .pet-wear').length),3);
 await shot('home-listening-preview');
 const writesBefore=await run(()=>fixture.calls.length);await edit();assert.deepEqual(await run(placements),themePositions);
 assert.equal(await run(()=>document.querySelector('#home-design-save').hidden),true);await move();assert.notDeepEqual(await run(placements),themePositions);
 assert.equal(await unloadBlocked(),false);await click('#home-design-reset');assert.deepEqual(await run(placements),themePositions);
 await click('#home-design-cancel');assert.equal(await run(()=>fixture.calls.length),writesBefore);assert.deepEqual(await run(()=>fixture.state),persisted);
 assert.equal(await run(()=>me.species),'dog');
 await click('#home-preview-reset');await wait(()=>document.querySelector('#home-scene').getAttribute('aria-busy')==='false');assert.deepEqual(await run(placements),ownPositions);
 checks.push('Five inspirations preserve saved placement and account species; theme editing and reset match the preview without purchases or saves');
 // Seed only the test wallet, then exercise explicit new-wardrobe purchases.
 await run(()=>{fixture.state.balance=120;return home.refresh();});await wait(()=>document.querySelector('#home-wallet b').textContent==='120');await click('[data-home-tab="wardrobe"]');
 const savedNodes=await run(()=>structuredClone(fixture.state.layout.nodes));
 for(const id of ['wear-knit-cap','wear-pinstripe','wear-canvas-bag']){
  await click('[data-product-id="'+id+'"]');await wait(item=>!!document.querySelector('#home-scene [data-item="'+item+'"]'),id);
  const before=await run(()=>fixture.state.balance);await click('#home-selection .primary');
  await wait(item=>Object.values(me.outfit).includes(item),id);
  assert.equal(await run(()=>fixture.state.balance),before-CATALOG.find(x=>x.id===id).price);assert.deepEqual(await run(()=>fixture.state.layout.nodes),savedNodes);
 }
 assert.equal(await run(()=>fixture.state.balance),48);assert.equal(await run(()=>me.species),'dog');
 assert.deepEqual(await run(()=>Object.values(me.outfit).sort()),['wear-canvas-bag','wear-knit-cap','wear-pinstripe']);
 checks.push('New headwear, scarf and bag preview before explicit purchase; wardrobe/identity update without changing saved furniture or species');
 await run(()=>home.stop());
 // Public showroom uses the same layout in display, edit, reset and shared hashes.
 await win.loadURL(`http://127.0.0.1:${server.address().port}/showroom.html`);
 await wait(()=>document.querySelector('#showroom-scene .mofu-room')&&document.querySelector('#showroom-scene').getAttribute('aria-busy')==='false');
 const showroomPositions=()=>Object.fromEntries([...document.querySelectorAll('#showroom-scene [data-node]')].map(n=>[n.dataset.node,[n.style.left,n.style.top,n.style.transform,n.style.zIndex]]));
 assert.equal(await run(()=>document.querySelector('#room-name').textContent),'下班听一张');
 assert.equal(await run(()=>document.querySelector('#room-price').textContent),'368 绒绒豆');
 const themeShowroom=await run(showroomPositions);assert.deepEqual(themeShowroom,themePositions);
 await shot('showroom-listening-desktop');
 for(const id of ['wear-knit-cap','wear-pinstripe','wear-canvas-bag']){await click('[data-item-id="'+id+'"]');assert.ok(await run(item=>document.querySelector('.room-pet.is-highlighted [data-item="'+item+'"]'),id));assert.notEqual(await run(()=>getComputedStyle(document.querySelector('.room-pet.is-highlighted')).outlineStyle),'none');}
 await click('#try-design');await wait(()=>!!document.querySelector('#showroom-scene .is-editable'));assert.deepEqual(await run(showroomPositions),themeShowroom);
 await run(()=>document.querySelector('#showroom-scene [data-node="pet"]').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true})));
 await click('#showroom-design-reset');assert.deepEqual(await run(showroomPositions),themeShowroom);await click('#try-design');
 await run(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.copied=text;}}});});
 await click('#share-room');assert.equal(new URL(await run(()=>window.copied)).hash,'#listening/rabbit');
 for(const room of HOME_STYLES.slice(1)){await run(hash=>{location.hash=hash;},room.id+'/'+room.species);await wait(name=>document.querySelector('#room-name').textContent===name&&document.querySelector('#showroom-scene').getAttribute('aria-busy')==='false',room.name);assert.equal(await run(()=>document.querySelector('#room-pet').value),room.species);}
 await run(()=>{location.hash='listening/rabbit';});await wait(()=>document.querySelector('#room-name').textContent==='下班听一张'&&document.querySelector('#showroom-scene').getAttribute('aria-busy')==='false');
 win.setContentSize(390,844);await wait(()=>innerWidth===390);assert.ok(await run(()=>document.documentElement.scrollWidth<=innerWidth+1));await run(()=>window.scrollTo(0,0));await shot('showroom-listening-phone');await run(()=>document.querySelector('[data-item-id="wear-knit-cap"]').scrollIntoView({block:'center'}));await click('[data-item-id="wear-knit-cap"]');await wait(()=>{const pet=document.querySelector('.room-pet.is-highlighted'),r=pet?.getBoundingClientRect();return r&&r.top>=0&&r.bottom<=innerHeight;});
 checks.push('Public default theme totals 368 beans; all three clothing cards locate real worn layers, editor/reset stay aligned, and all legacy share hashes remain valid');
 assert.deepEqual(errors,[]);console.log(JSON.stringify({homeUI:true,checks,screenshots:work}));

 win.destroy();server.close();app.exit(0);
})().catch(e=>{console.error(e.stack);win?.destroy();server?.close();app.exit(1);});
