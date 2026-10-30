// Real desktop page + production preload; only the main-process state is a fixture.
const {app,BrowserWindow,ipcMain}=require('electron');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const assert=require('node:assert/strict');
const {accountCharacter,canSaveCharacter}=require('../src/account-sync.cjs');
const root=path.resolve(__dirname,'..'),profile=process.env.MOFU_RENDERER_TEST;
if(!profile)throw Error('Run with tests/run-account-renderer.mjs');
app.setPath('userData',profile);
if(process.env.PAPERPAL_TEST_SOFTWARE_GL==='1'){
 app.commandLine.appendSwitch('use-gl','angle');app.commandLine.appendSwitch('use-angle','swiftshader-webgl');app.commandLine.appendSwitch('enable-unsafe-swiftshader');
}
let window;
app.whenReady().then(async()=>{try{
 if(process.platform==='darwin')app.dock?.hide();
 const {createState,presentation,reduce}=await import(pathToFileURL(path.join(root,'src/state.mjs')).href);
 const {createCharacter,validateCharacter}=await import(pathToFileURL(path.join(root,'src/character.mjs')).href);
 let state={...createState(),mode:'focus'},character=createCharacter({species:'rabbit',size:.6,personality:'gentle'}),account={id:'renderer-a',species:'rabbit',outfit:{headwear:'wear-bow'}},sequence=0,settingsOpen=false,saveCount=0;
 const errors=[],checks=[];
 window=new BrowserWindow({show:false,width:440,height:650,frame:false,transparent:true,webPreferences:{preload:path.join(root,'desktop/preload.cjs'),offscreen:true,backgroundThrottling:false,sandbox:true,contextIsolation:true,nodeIntegration:false}});
 window.webContents.on('console-message',event=>{if(event.level==='error')errors.push(event.message);});
 window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 const allowed=event=>event.sender===window.webContents&&event.senderFrame===window.webContents.mainFrame;
 const snapshot=()=>({sequence:++sequence,state,view:presentation(state),character,account,postofficeUnread:0,demo:false,brand:'feishu',error:'',companion:{followHost:false,host:{status:'desktop'},platform:{windowFollowing:'unavailable'},docking:{placement:'desktop'},settingsOpen,window:{x:0,y:0,width:440,height:650},workArea:{x:0,y:0,width:1440,height:900},canFollow:false}});
 const publish=()=>window.webContents.send('paperpal:update',snapshot());
 const pushAccount=value=>{account=value;character=accountCharacter(character,account,createCharacter);publish();};
 ipcMain.handle('paperpal:get',event=>allowed(event)?snapshot():null);
 ipcMain.handle('paperpal:action',(event,action)=>{
  if(!allowed(event))return null;
  if(action.type==='character-save'){
   if(!canSaveCharacter(action.character,account))return {...snapshot(),settingsError:'BOUND_SPECIES'};
   character=accountCharacter(validateCharacter(action.character),account,createCharacter);saveCount++;
  }else state=reduce(state,action);
  publish();return snapshot();
 });
 ipcMain.handle('paperpal:open-postoffice',()=>({ok:true}));
 ipcMain.on('paperpal:modal',(event,value)=>{if(allowed(event))settingsOpen=value;});
 const ready=new Promise(resolve=>ipcMain.once('paperpal:ready',resolve));
 await window.loadFile(path.join(root,'ui/desktop.html'),{query:{desktop:'1'}});await ready;
 const run=(fn,arg)=>window.webContents.executeJavaScript(`(${fn.toString()})(${JSON.stringify(arg)})`);
 const read=()=>run(()=>{
  const stamp=selector=>{const c=document.querySelector(selector);if(!c)return null;const pixels=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let hash=2166136261,opaque=0;for(let i=0;i<pixels.length;i++){hash=Math.imul(hash^pixels[i],16777619);if(i%4===3&&pixels[i]>128)opaque++;}const samples=[];for(let y=0;y<64;y++)for(let x=0;x<64;x++){const offset=(Math.min(c.height-1,Math.floor((y+.5)*c.height/64))*c.width+Math.min(c.width-1,Math.floor((x+.5)*c.width/64)))*4,alpha=pixels[offset+3]/255;for(let channel=0;channel<3;channel++)samples.push(Math.round(pixels[offset+channel]*alpha));samples.push(pixels[offset+3]);}return{hash:(hash>>>0).toString(16),opaque,width:c.width,height:c.height,samples};};
  return {rig:document.querySelector('#portrait').dataset.rig,ready:document.querySelector('#portrait').dataset.rigReady,bound:document.body.dataset.accountBound,main:stamp('#portrait canvas'),baby:stamp('#baby-portrait canvas'),disabled:[...document.querySelectorAll('[data-pet]')].filter(b=>b.disabled).map(b=>b.dataset.pet),size:document.querySelector('#native-size').value,desktopSize:Number(document.documentElement.style.getPropertyValue('--desktop-size')),closed:document.querySelector('#nest-sheet').hidden};
 });
 const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const compact=value=>JSON.stringify(value,(key,value)=>key==='samples'?undefined:value);
 const wait=async(predicate,label)=>{const end=Date.now()+12000;let value;do{value=await read();if(predicate(value))return value;await pause(30);}while(Date.now()<end);throw Error(label+': '+compact(value));};
 const painted=value=>value.ready==='true'&&value.main?.opaque>1000&&value.baby?.opaque>1000;
 // GPU/CPU canvas readback can round edge channels differently. Compare visible
 // differences, not bit-identical PNGs, while still requiring changes in both canvases.
 const difference=(a,b)=>{if(a.width!==b.width||a.height!==b.height)return Infinity;let pixels=0;for(let i=0;i<a.samples.length;i+=4){let delta=0;for(let c=0;c<4;c++)delta+=Math.abs(a.samples[i+c]-b.samples[i+c]);if(delta>24)pixels++;}return pixels;};
 const same=(a,b)=>difference(a.main,b.main)<=5&&difference(a.baby,b.baby)<=5;
 const changed=(a,b)=>difference(a.main,b.main)>8&&difference(a.baby,b.baby)>8;
 const check=(condition,label)=>{assert.ok(condition,label);checks.push(label);};
 const click=selector=>run(s=>document.querySelector(s).dispatchEvent(new MouseEvent('click',{bubbles:true,detail:1})),selector);
 const initial=await wait(v=>painted(v)&&v.rig==='rabbit'&&v.bound==='true','initial bound rabbit');
 check(initial.disabled.length===11&&!initial.disabled.includes('rabbit'),'bound-account-disables-other-eleven-species');
 await click('[data-pet=dog]');
 check((await read()).rig==='rabbit'&&saveCount===0,'programmatic-other-species-click-is-rejected');
 const denied=await run(async()=>window.paperpal.act({type:'character-save',character:{...(await window.paperpal.snapshot()).character,species:'dog'}}));
 check(denied.settingsError==='BOUND_SPECIES'&&character.species==='rabbit','actual-preload-rejects-bound-species-save');

 pushAccount({...account,outfit:{}});
 const rabbitBare=await wait(v=>painted(v)&&changed(v,initial),'remove initial rabbit bow');
 checks.push('removing-wardrobe-changes-both-main-and-header-pixels');
 pushAccount({...account,outfit:{headwear:'wear-bow'}});
 await wait(v=>painted(v)&&same(v,initial),'restore initial rabbit bow');
 checks.push('initial-accessories-were-painted-in-static-mode');
 pushAccount({...account,outfit:{headwear:'wear-beret',neckwear:'wear-bandana',carry:'wear-satchel'}});
 const fullOutfit=await wait(v=>painted(v)&&changed(v,initial)&&changed(v,rabbitBare),'full rabbit wardrobe');
 checks.push('all-wearable-slots-reach-main-and-header-canvases');
 pushAccount({...account,outfit:{headwear:'wear-daisy'}});
 pushAccount({...account,outfit:{headwear:'wear-beret',neckwear:'wear-bandana',carry:'wear-satchel'}});
 await pause(100);await wait(v=>painted(v)&&same(v,fullOutfit),'rapid wardrobe return');
 checks.push('rapid-outfit-return-keeps-latest-render-in-both-portraits');

 await click('#nest-toggle');await click('[data-drawer=settings]');
 await run(()=>{const input=document.querySelector('#native-size');input.value='90';input.dispatchEvent(new Event('input',{bubbles:true}));});
 check((await read()).desktopSize===.9,'unsaved-size-draft-is-previewed');
 pushAccount({...account,outfit:{headwear:'wear-bow'}});
 const draft=await wait(v=>painted(v)&&same(v,initial),'wardrobe while size dirty');
 check(draft.size==='90'&&draft.desktopSize===.9,'web-wardrobe-preserves-unsaved-size-draft');
 await click('#nest-close');
 const closed=await read();
 check(closed.closed&&closed.size==='60'&&closed.desktopSize===.6&&saveCount===0,'closing-restores-unsaved-size-after-web-wardrobe');

 pushAccount({id:'renderer-b',species:'dog',outfit:{headwear:'wear-daisy',carry:'wear-satchel'}});
 const dogDressed=await wait(v=>painted(v)&&v.rig==='dog'&&changed(v,initial),'switch to second account');
 check(dogDressed.disabled.length===11&&!dogDressed.disabled.includes('dog'),'account-switch-updates-rig-header-and-species-lock');
 pushAccount({...account,outfit:{}});
 const dogBare=await wait(v=>painted(v)&&changed(v,dogDressed),'dog bare reference');
 pushAccount({...account,outfit:{headwear:'wear-daisy',carry:'wear-satchel'}});
 await wait(v=>painted(v)&&same(v,dogDressed),'dress dog before logout');
 pushAccount(null);
 const loggedOut=await wait(v=>painted(v)&&v.bound==='false'&&same(v,dogBare),'logout clears wardrobe');
 check(loggedOut.disabled.length===0,'logout-clears-both-canvases-and-unlocks-species');
 await click('[data-pet=rat]');
 await wait(v=>painted(v)&&v.rig==='rat','local selection after logout');
 check(character.species==='rat'&&saveCount===1,'logout-allows-local-species-selection-through-preload');
 assert.deepEqual(errors,[],'renderer console errors');
 check(!window.isVisible(),'test-never-displays-a-user-window');
 console.log(JSON.stringify({accountRenderer:'passed',realDesktopPage:true,realPreload:true,offscreen:true,checks}));
 window.destroy();app.quit();
}catch(error){console.error(error.stack);window?.destroy();app.exit(1);}});
