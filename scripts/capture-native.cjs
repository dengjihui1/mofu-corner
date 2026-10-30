const fs=require('node:fs/promises'),path=require('node:path');
module.exports=async(win,output)=>{
 if(!output)throw Error('Missing documentation output directory');
 const run=(fn,arg)=>win.webContents.executeJavaScript(`(${fn.toString()})(${arg===undefined?'':JSON.stringify(arg)})`);
 const wait=async(fn)=>{const end=Date.now()+12000;while(!await run(fn)){if(Date.now()>end)throw Error('DOC_STATE_TIMEOUT');await new Promise(r=>setTimeout(r,35));}};
 async function shot(name,clip={x:14,y:14,width:412,height:502}){await run(()=>document.fonts.ready.then(()=>true));await run(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await new Promise(r=>setTimeout(r,240));win.webContents.invalidate();await new Promise(r=>setTimeout(r,100));const frame=await win.webContents.capturePage();await fs.writeFile(path.join(output,name+'.png'),frame.crop(clip).toPNG());}
 await wait(()=>document.querySelector('#portrait').dataset.rigReady==='true');
 await run(()=>document.querySelector('#nest-toggle').click());
 await new Promise(r=>setTimeout(r,240));
 await shot('native-partners');
 await run(()=>document.querySelector('[data-drawer=settings]').click());
 await shot('native-settings');
 await run(()=>document.querySelector('[data-work=focus]').click());
 await wait(()=>document.body.dataset.workmode==='focus');
 await shot('native-focus');
 await run(()=>document.querySelector('[data-work=meeting]').click());
 await wait(()=>document.body.dataset.workmode==='meeting');await shot('native-meeting');
 await run(()=>document.querySelector('[data-work=rest]').click());
 await wait(()=>document.body.dataset.workmode==='rest');await shot('native-rest');
 await run(()=>document.querySelector('[data-work=available]').click());
 await wait(()=>document.body.dataset.workmode==='available');
 await run(()=>document.querySelector('#play-action').click());
 await wait(()=>!!document.querySelector('[data-game-value="0"]'));
 await run(()=>document.querySelector('[data-game-value="0"]').click());
 await shot('native-rabbit-game');
 await run(()=>{document.querySelector('[data-drawer=friends]').click();document.querySelector('[data-pet=snake]').click();});
 await wait(()=>document.querySelector('#portrait').dataset.rig==='snake'&&document.querySelector('#portrait').dataset.rigReady==='true');
 await run(()=>document.querySelector('#play-action').click());
 await wait(()=>!!document.querySelector('.game-range'));
 await shot('native-snake-game');
 for(const species of ['rat','ox','tiger','rabbit','dragon','snake','horse','sheep','monkey','rooster','dog','pig']){
   await run(id=>{document.body.dataset.docSpecies=id;document.querySelector('[data-drawer=friends]').click();document.querySelector('[data-pet='+id+']').click();},species);
   await wait(async()=>{const s=await window.paperpal.snapshot();return s.character.species===document.body.dataset.docSpecies&&document.querySelector('#native-name').value===document.querySelector('#name').textContent&&document.querySelector('#portrait').dataset.rigReady==='true';});
   await run(()=>document.querySelector('#play-action').click());
   await wait(()=>!!document.querySelector('.game-area'));
   await run(()=>{const range=document.querySelector('.game-range'),breath=document.querySelector('[data-breathe]');if(range){if(document.body.dataset.docSpecies==='snake'){range.value=0;range.dispatchEvent(new Event('input',{bubbles:true}));}range.value=60;range.dispatchEvent(new Event('input',{bubbles:true}));}else if(breath)breath.click();else document.querySelector('[data-game-value]')?.click();});
   await shot('game-'+species);
 }
 await run(()=>{document.querySelector('[data-drawer=friends]').click();document.querySelector('[data-pet=otter]')?.click();});
 // The classic companion has its own visible selector in the footer.
 await run(()=>document.querySelector('#native-classic').click());
 await wait(async()=>document.querySelector('#name').textContent==='折折'&&(await window.paperpal.snapshot()).character.species==='otter'&&document.querySelector('#native-name').value==='折折');
 await shot('native-classic');
 await run(()=>{document.querySelector('[data-drawer=friends]').click();document.querySelector('[data-pet=rabbit]').click();});
 await wait(async()=>document.querySelector('#portrait').dataset.rig==='rabbit'&&document.querySelector('#portrait').dataset.rigReady==='true'&&(await window.paperpal.snapshot()).character.species==='rabbit'&&document.querySelector('#native-name').value==='耳朵');
 await run(()=>{document.querySelector('[data-drawer=settings]').click();const n=document.querySelector('#native-name');n.value='棉花糖';n.dispatchEvent(new Event('input',{bubbles:true}));const size=document.querySelector('#native-size');size.value='70';size.dispatchEvent(new Event('input',{bubbles:true}));const p=document.querySelector('#native-personality');p.value='playful';p.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#native-settings').requestSubmit();});
 await wait(()=>document.querySelector('#drag-tag').textContent.includes('棉花糖'));
 await wait(()=>document.querySelector('#nest-sheet').hidden);
 await run(()=>{document.querySelector('#nest-toggle').click();document.querySelector('[data-drawer=settings]').click();});
 await shot('native-customized');
 await run(()=>{document.querySelector('[data-drawer=friends]').click();document.querySelector('[data-pet=rat]').click();});
 await wait(async()=>(await window.paperpal.snapshot()).character.species==='rat'&&document.querySelector('#nest-title').textContent==='小米的小窝');
 await run(()=>document.querySelector('[data-drawer=settings]').click());
 await shot('native-rat-settings');
};
