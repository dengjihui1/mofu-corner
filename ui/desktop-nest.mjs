import {RIG_ASSETS} from './rig-assets.mjs';
import {REFERENCE_ART} from './rig-reference.mjs';
import {createSnapshotGate} from '../src/snapshot-order.mjs';
const acceptSnapshot=createSnapshotGate();
import {createCharacter,DEFAULT_CHARACTER,CATALOG,validateCharacter} from '../src/character.mjs';
const $=id=>document.getElementById(id),bridge=window.paperpal;
$('drawer-friends').append(document.querySelector('.friends'),document.querySelector('.companion-panel'));
$('drawer-toys').append($('play-tray'));
if(!bridge)document.body.classList.add('desktop-preview');
const controller=await import('./zodiac.mjs?v=desktop29');$('drawer-toys').append(document.querySelector('.motion-actions'));document.querySelector('.motion-actions').append($('motion-toggle'));$('motion-toggle').hidden=false;
let current={...DEFAULT_CHARACTER},snapshot=null,settingsDirty=false,syncing=false,saving=false,revision=0,saveQueue=Promise.resolve(),lastMode=null,lastTouch=0,pendingTouches=0,hintUntil=Date.now()+3000;
try{if(bridge){snapshot=await bridge.snapshot();current=snapshot.character;}else{const saved=localStorage.getItem('paperpal.desktop-preview');if(saved)current=validateCharacter(JSON.parse(saved));}}catch{}
function configureForm(){if(settingsDirty)return;$('native-name').value=current.name;$('native-size').value=current.size*100;$('native-size-label').textContent=Math.round(current.size*100)+'%';$('native-personality').value=current.personality;syncCareControls();}
function syncCareControls(){document.querySelectorAll('.personality-options [data-personality]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.personality===$('native-personality').value)));$('native-size').style.setProperty('--size-fill',((Number($('native-size').value)-55)/75*100)+'%');}
let portraitSpecies;
function renderBaby(){ $('nest-title').textContent=current.name+'的小窝';$('nest-baby').setAttribute('aria-label','摸摸'+current.name);if(portraitSpecies===current.species)return;$('nest-greeting').textContent='' ;portraitSpecies=current.species;const target=$('baby-portrait'),ref=REFERENCE_ART[current.species],asset=RIG_ASSETS[current.species];target.replaceChildren();if(ref&&asset){const [x,y,w,h]=ref.rect,img=new Image();img.src=asset.src;img.alt='';target.style.aspectRatio=w+'/'+h;img.onload=()=>{img.style.cssText=`position:absolute;width:${img.naturalWidth/w*100}%;height:${img.naturalHeight/h*100}%;max-width:none;left:${-x/w*100}%;top:${-y/h*100}%`;};target.append(img);}else{target.append(document.querySelector('#portrait').cloneNode(true));target.querySelector('[id]')?.removeAttribute('id');}}
function renderCharacter(){syncing=true;controller.nativeCharacter(current);syncing=false;$('nest-stamp').textContent=CATALOG.find(c=>c.id===current.species)?.zodiac||'獭';$('drag-tag').textContent=current.name+' · 拖动搬家';configureForm();renderBaby();}
function drawer(name){for(const section of ['friends','toys','settings'])$('drawer-'+section).hidden=section!==name;document.querySelectorAll('[data-drawer]').forEach(button=>button.setAttribute('aria-selected',String(button.dataset.drawer===name)));document.body.dataset.drawer=name;}
function open(name='friends'){if($('nest-sheet').hidden){$('nest-sheet').hidden=false;if(!matchMedia('(prefers-reduced-motion: reduce)').matches)$('nest-sheet').animate([{opacity:.4,transform:'translateY(7px) rotate(-1deg)'},{opacity:1,transform:'none'}],{duration:210,easing:'cubic-bezier(.22,1,.36,1)'});}$('nest-toggle').setAttribute('aria-expanded','true');$('nest-toggle').querySelector('span').textContent='收起';drawer(name);bridge?.modal(true);}
function close(){if(settingsDirty){settingsDirty=false;renderCharacter();}$('nest-sheet').hidden=true;$('nest-toggle').setAttribute('aria-expanded','false');$('nest-toggle').querySelector('span').textContent='小窝';bridge?.modal(false);$('nest-toggle').focus({preventScroll:true});}
async function save(value){const version=++revision;saving=true;saveQueue=saveQueue.catch(()=>{}).then(async()=>{try{const result=bridge?await bridge.act({type:'character-save',character:value}):null;if(result?.settingsError)throw Error('SAVE_FAILED');if(!bridge)localStorage.setItem('paperpal.desktop-preview',JSON.stringify(value));if(version===revision){current=result?.character||value;settingsDirty=false;renderCharacter();$('native-saved').textContent='已保存';}return true;}catch{$('native-saved').textContent='未能保存，请重试';$('native-status').textContent='保存没有成功，请检查本机目录写入权限。';return false;}finally{if(version===revision)saving=false;}});return saveQueue;}
function updateMailCount(count){const n=Math.min(99,Math.max(0,Number(count)||0));$('postoffice-unread').textContent=n;$('postoffice-unread').hidden=!n;$('native-postoffice').setAttribute('aria-label','小邮局'+(n?'，'+n+'条未读':''));}
function applySnapshot(value){if(!acceptSnapshot(value))return;const interaction=value.state.lastInteraction;snapshot=value;updateMailCount(value.postofficeUnread);if(!saving&&!settingsDirty&&JSON.stringify(current)!==JSON.stringify(value.character)){current=value.character;renderCharacter();}if(lastMode!==value.state.mode){lastMode=value.state.mode;syncing=true;controller.nativeModeChange(lastMode);syncing=false;}$('native-follow').disabled=!value.companion.canFollow;$('native-follow').setAttribute('aria-label','跟随飞书 / Lark · '+(value.companion.followHost?'已开启':'未开启')+(value.companion.platform?.windowFollowing==='experimental'?'（Mac 试用）':''));$('native-follow').title=value.companion.followHost?'关闭跟随':'开启跟随并收起';$('native-follow').setAttribute('aria-pressed',String(value.companion.followHost));document.body.dataset.dock=value.companion.docking?.placement||'desktop';const status=value.companion.host.status;$('native-status').textContent=value.state.until?'专注还剩 '+value.view.minutesLeft+' 分钟。':value.companion.followHost&&value.companion.docking?.reason==='no-exterior-space'?'窗口外空间不足，已收进托盘；窗口恢复后会自动出来。':value.companion.followHost&&!$('nest-sheet').hidden?'收起后跟随窗口':value.companion.followHost?({ready:'停在窗口外侧，切走时安静退后。',minimized:'客户端已收起，小伙伴也退后。',searching:'正在寻找客户端窗口。'}[status]||'暂未找到客户端，已收进托盘。'):'';document.querySelectorAll('[data-work]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.work===value.state.mode)));if(interaction&&interaction.at>lastTouch){lastTouch=interaction.at;if(!pendingTouches){syncing=true;controller.touch({detail:0});syncing=false;}}}
renderCharacter();if(snapshot)applySnapshot(snapshot);
document.addEventListener('paperpal:selection',event=>{if(syncing)return;const next=createCharacter({species:event.detail.id,size:current.size,personality:current.personality});save(next);hintUntil=Date.now()+2400;});
document.addEventListener('paperpal:touch',()=>{if(syncing||!bridge)return;pendingTouches++;if(snapshot?.state.mode==='rest')bridge.act({type:'mode',mode:'available'}).then(applySnapshot);bridge.act({type:'interact',kind:'pet'}).then(value=>{applySnapshot(value);pendingTouches--;},()=>pendingTouches--);});
$('nest-toggle').onclick=()=>{$('nest-sheet').hidden?open():close();};$('nest-close').onclick=close;
document.querySelectorAll('[data-drawer]').forEach(button=>button.onclick=()=>drawer(button.dataset.drawer));
$('play-action').addEventListener('click',()=>{open('toys');if(bridge&&snapshot?.state.mode!=='available')bridge.act({type:'mode',mode:'available'}).then(applySnapshot);},true);
$('rest-action').addEventListener('click',()=>{const mode=controller.session.mode==='sleep'?'available':'rest';if(bridge)bridge.act({type:'mode',mode}).then(applySnapshot);},true);
$('native-settings').addEventListener('input',()=>{settingsDirty=true;$('native-size-label').textContent=$('native-size').value+'%';syncCareControls();document.documentElement.style.setProperty('--desktop-size',Number($('native-size').value)/100);});
$('native-settings').onsubmit=async event=>{event.preventDefault();$('native-save').disabled=true;try{if(await save(validateCharacter({...current,name:$('native-name').value,size:Number($('native-size').value)/100,personality:$('native-personality').value})))close();}catch{$('native-status').textContent='小名需要1–16个字。';}finally{$('native-save').disabled=false;}};
$('nest-baby').onclick=()=>{controller.touch({detail:1});$('nest-greeting').textContent='嗯～最喜欢你摸摸啦。';};
document.querySelectorAll('.personality-options [data-personality]').forEach(button=>button.onclick=()=>{$('native-personality').value=button.dataset.personality;$('native-personality').dispatchEvent(new Event('input',{bubbles:true}));});
$('native-classic').onclick=()=>controller.select('otter',{detail:1});
document.querySelectorAll('[data-work]').forEach(button=>button.onclick=()=>{const mode=button.dataset.work;if(bridge)bridge.act({type:'mode',mode,minutes:25}).then(applySnapshot);else controller.nativeModeChange(mode);});
$('native-follow').onclick=async()=>{if(!bridge)return;const enabled=!snapshot.companion.followHost;$('native-follow').disabled=true;try{const result=await bridge.act({type:'follow-host',enabled});applySnapshot(result);if(result.companion.followHost)close();}catch{$('native-status').textContent='切换失败，请重试。';}finally{$('native-follow').disabled=!snapshot.companion.canFollow;}};if(!bridge){$('native-follow').disabled=true;$('native-status').textContent='桌面版可开启窗口跟随';}
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('nest-sheet').hidden){event.preventDefault();close();}});
$('pet').addEventListener('pointerenter',()=>{hintUntil=Date.now()+10000;});$('pet').addEventListener('pointerleave',()=>{hintUntil=Math.min(hintUntil,Date.now()+800);});
new MutationObserver(()=>{hintUntil=Date.now()+3500;}).observe($('speech'),{childList:true,characterData:true,subtree:true});
setInterval(()=>{const show=Date.now()<hintUntil&&$('nest-sheet').hidden;const value=String(show);if(document.body.dataset.hint!==value)document.body.dataset.hint=value;},150);
if(bridge){
 bridge.listen(applySnapshot);bridge.onConfigure(()=>open('settings'));bridge.onCollapse(()=>close());let previous='',lastLayout='',frame=0;
 const rect=(el,pad=6)=>{const b=el.getBoundingClientRect(),x=Math.max(0,Math.floor(b.left-pad)),y=Math.max(0,Math.floor(b.top-pad));return{x,y,width:Math.min(440,Math.ceil(b.right+pad))-x,height:Math.min(650,Math.ceil(b.bottom+pad))-y};};
 const union=items=>{const x=Math.min(...items.map(r=>r.x)),y=Math.min(...items.map(r=>r.y));return{x,y,width:Math.max(...items.map(r=>r.x+r.width))-x,height:Math.max(...items.map(r=>r.y+r.height))-y};};
 const shape=()=>{frame=0;const bodyRects=['.pet-anchor','#drag-tag','#nest-toggle'].map(s=>rect(document.querySelector(s),s==='.pet-anchor'?12:6));
  const pet=document.querySelector('.pet-anchor').getBoundingClientRect(),bubble={x:271,y:Math.max(0,Math.floor(pet.top-120)),width:134,height:116};
  const layout={body:union(bodyRects),side:union([...bodyRects,bubble])},layoutKey=JSON.stringify(layout);if(layoutKey!==lastLayout){lastLayout=layoutKey;bridge.layout(layout);}
  const rects=[...bodyRects];if(!$('nest-sheet').hidden)rects.push(rect($('nest-sheet'),7));if(document.body.dataset.hint==='true'&&document.body.dataset.dock!=='bottom')rects.push(rect($('speech'),7));
  const key=JSON.stringify(rects);if(key!==previous){previous=key;bridge.shape(rects);}
 };
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(shape);};
 new MutationObserver(schedule).observe(document.body,{attributes:true,childList:true,subtree:true,attributeFilter:['hidden','style','data-hint','data-dock','class']});
 new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['style']});shape();
}

if(new URLSearchParams(location.search).get('configure')==='1'||!bridge)open('friends');
bridge?.ready(!$('nest-sheet').hidden);

document.addEventListener('paperpal:awake',()=>{if(bridge&&snapshot?.state.mode==='rest')bridge.act({type:'mode',mode:'available'}).then(applySnapshot);});

$('native-postoffice').onclick=async()=>{if(bridge){await bridge.openPostoffice();close();}};if(!bridge){$('native-postoffice').disabled=true;$('native-postoffice').title='桌面版可打开小邮局';}
bridge?.onPostoffice(value=>{updateMailCount(value.unread);if(value.kind&&!value.quiet&&$('nest-sheet').hidden){if(value.kind!=='text'){syncing=true;controller.touch({detail:0});syncing=false;}$('speech').textContent=(value.name||'好友')+({text:'寄来了一封信',heart:'送来一颗小心心',pat:'轻轻摸摸你的头'}[value.kind]||'来找你啦');hintUntil=Date.now()+5500;}});
