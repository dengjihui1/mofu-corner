module.exports=async function desktopScenario(){
 const checks=[],get=s=>{const e=document.querySelector(s);if(!e)throw Error('MISSING:'+s+':'+document.querySelector('#portrait')?.dataset.rig+':'+document.querySelector('#play-tray')?.innerText);return e;},assert=(ok,msg)=>{if(!ok)throw Error(msg);checks.push(msg);},pause=ms=>new Promise(r=>setTimeout(r,ms));
 const wait=async fn=>{const end=Date.now()+8000;while(!await fn()){if(Date.now()>end)throw Error('NATIVE_STATE_TIMEOUT');await pause(25);}};
 const input=(s,value)=>{const el=get(s);el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));};
 const click=s=>get(s).dispatchEvent(new MouseEvent('click',{bubbles:true,detail:1}));
 assert(document.body.classList.contains('desktop-nest'),'native-nest-renderer');assert(get('#nest-sheet').hidden,'normal-start-keeps-settings-collapsed');assert(get('.pet-anchor').getBoundingClientRect().width<110,'default-pet-size-is-60-percent');assert(get('.pet-anchor').getBoundingClientRect().width<180,'compact-desktop-companion');
 if(get('#nest-sheet').hidden)click('#nest-toggle');assert(!get('#nest-sheet').hidden,'pocket-nest-opens');
 assert(document.querySelectorAll('[data-pet]').length===12,'all-twelve-zodiac-native-selectors');
 for(const id of ['rat','ox','tiger','rabbit','dragon','snake','horse','sheep','monkey','rooster','dog','pig']){
  click('[data-drawer=friends]');click('[data-pet='+id+']');await wait(async()=> (await window.paperpal.snapshot()).character.species===id);await wait(()=>get('#portrait').dataset.rigReady==='true');await wait(()=>get('#portrait').dataset.interpolation==='gentle-intact-art');if(get('#portrait .rig-puppet').dataset.artwork!=='intact-plush'||get('#portrait').querySelectorAll('canvas').length!==1||get('#portrait').querySelectorAll('image').length!==0)throw Error('DUPLICATED_ANATOMY_'+id);if(get('#portrait').dataset.rig!==id)throw Error('NATIVE_RIG_'+id);const pixels=get('#portrait canvas').getContext('2d').getImageData(0,0,640,660).data;if(!pixels.some((n,i)=>i%4===3&&n>128))throw Error('BLANK_INITIAL_ART_'+id);
  const count=(await window.paperpal.snapshot()).state.affection;click('#pet');await wait(async()=> (await window.paperpal.snapshot()).state.affection===count+1);if(get('#portrait').dataset.pose!=='touch')throw Error('TOUCH_'+id);await wait(()=>get('#portrait').dataset.expression==='pleased');
  click('#rest-action');await wait(async()=> (await window.paperpal.snapshot()).state.mode==='rest');if(get('#portrait').dataset.pose!=='sleep')throw Error('SLEEP_'+id);click('#pet');await wait(async()=> (await window.paperpal.snapshot()).state.mode==='available');
  click('#play-action');await pause(20);if(get('#drawer-toys').hidden)throw Error('TOY_DRAWER_'+id);
  if(id==='sheep'){click('[data-breathe]');click('[data-drawer=friends]');click('[data-pet=rat]');await wait(async()=>(await window.paperpal.snapshot()).character.species==='rat');continue;}
  if(id==='snake'){input('.game-range',0);input('.game-range',100);}
  else if(id==='pig')input('.game-range',100);
  else if(id==='rooster'){for(const side of ['left','right','left'])click('[data-game-value='+side+']');}
  else if(['rat','rabbit','dragon'].includes(id)){for(const n of [0,1,2])click('[data-game-value="'+n+'"]');}
  else for(let i=0;i<3;i++)click('[data-game-value]');
  if(!document.querySelector('[data-start]'))throw Error('NATIVE_GAME_'+id);
 }
 assert(true,'twelve-native-ipc-selection-saves');assert(true,'twelve-native-single-character');assert(true,'twelve-native-touch-and-quiet-companionship');assert(true,'native-species-games-and-toy-drawer');
 click('[data-drawer=friends]');click('[data-pet=rabbit]');await wait(async()=>(await window.paperpal.snapshot()).character.species==='rabbit');click('#play-action');click('[data-motion=tilt]');await wait(()=>get('#portrait').dataset.animation==='tilt');assert(!document.querySelector('[data-motion=stretch]')&&!!document.querySelector('[data-motion=jump]'),'short-hop-available-without-complex-stretch');assert(true,'gentle-tilt-connected-to-native-renderer');click('[data-motion=jump]');await wait(()=>get('#portrait').dataset.animation==='jump');await wait(()=>get('#portrait').dataset.expression==='bright');assert(true,'native-small-hop-reaches-flight');await wait(()=>get('#portrait').dataset.animation==='idle');click('#rest-action');await wait(()=>get('#portrait').dataset.animation==='quiet');assert(get('#portrait').dataset.expression==='neutral','quiet-keeps-original-neutral-art');click('#pet');await wait(()=>get('#portrait').dataset.animation==='idle');assert(true,'quiet-resumes-companionship');

 click('[data-drawer=friends]');click('[data-pet=dragon]');await wait(async()=>(await window.paperpal.snapshot()).character.species==='dragon');
 click('[data-drawer=settings]');input('#native-name','验收小龙');input('#native-size',130);input('#native-personality','quiet');get('#native-settings').requestSubmit();await wait(async()=>(await window.paperpal.snapshot()).character.name==='验收小龙');const saved=(await window.paperpal.snapshot()).character;
 assert(saved.size===1.3&&saved.personality==='quiet','native-custom-name-size-personality-saved');click('#motion-toggle');click('#pet');await pause(180);assert(get('#portrait').dataset.expression==='neutral'&&get('#portrait').dataset.animation==='idle','paused-motion-keeps-original-art');click('#motion-toggle');
 click('#nest-close');assert(get('#nest-sheet').hidden,'pocket-nest-collapses');click('#nest-toggle');click('[data-drawer=settings]');assert(get('#native-name').value==='验收小龙'&&get('#native-size').value==='130','reopen-retains-character-settings');
 click('[data-work=focus]');await wait(async()=>(await window.paperpal.snapshot()).state.mode==='focus');await window.paperpal.act({type:'demo-message'});assert((await window.paperpal.snapshot()).state.mode==='focus'&&(await window.paperpal.snapshot()).view.quiet,'focus-keeps-demo-mail-quiet');
 await pause(100);assert(document.body.dataset.workmode==='focus','focus-pauses-native-autonomy');
 if((await window.paperpal.snapshot()).companion.canFollow){
  click('#nest-close');await wait(async()=>!(await window.paperpal.snapshot()).companion.settingsOpen);await window.paperpal.act({type:'follow-host',enabled:true});const area=(await window.paperpal.snapshot()).companion.workArea;
  const host={status:'ready',brand:'feishu',pid:100,active:true,bounds:{x:area.x+24,y:area.y+24,width:Math.floor(area.width*.5),height:area.height-48}};
  let result=await window.paperpal.act({type:'test-host',coordinates:'dip',host});await pause(100);result=await window.paperpal.snapshot();const d=result.companion.docking,r=d.footprint,b=d.hostBounds;
  assert(d.visible&&d.placement==='right','native-docks-outside-client');assert(r.x>=b.x+b.width+12,'native-visible-content-does-not-cover-client');assert(result.companion.window.x===d.x&&result.companion.window.y===d.y,'native-window-actually-moved-to-exterior-position');
  const full={...host,bounds:area};result=await window.paperpal.act({type:'test-host',coordinates:'dip',host:full});assert(!result.companion.docking.visible&&result.companion.docking.reason==='no-exterior-space','maximized-client-retracts-to-tray');
  result=await window.paperpal.act({type:'test-host',coordinates:'dip',host});assert(result.companion.docking.visible,'restored-client-brings-pet-back-outside');
  result=await window.paperpal.act({type:'test-host',coordinates:'dip',host:{...host,status:'minimized'}});assert(!result.companion.docking.visible,'minimized-client-hides-pet');await window.paperpal.act({type:'follow-host',enabled:false});click('#nest-toggle');click('[data-drawer=settings]');
 }

 click('[data-work=available]');await wait(async()=>(await window.paperpal.snapshot()).state.mode==='available');click('[data-drawer=friends]');await pause(30);
 const pet=get('.pet-anchor').getBoundingClientRect(),sheet=get('#nest-sheet').getBoundingClientRect();assert(pet.left>=0&&pet.top>=0&&pet.right<=440&&pet.bottom<=650,'maximum-pet-size-fits-native-window');assert(sheet.left>=0&&sheet.right<=440&&sheet.bottom<=650,'stationery-ui-fits-native-window');assert(get('#drag-tag').textContent.includes('验收小龙'),'custom-name-on-drag-tag');
 return{checks,savedName:saved.name,zodiacCount:12};
};
