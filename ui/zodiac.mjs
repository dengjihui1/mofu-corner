import { ZODIAC_CONCEPTS } from './zodiac-data.mjs';
import { PERSONALITIES, PlaySession } from './zodiac-personalities.mjs';
import { mascot } from './mascot.mjs';
import {RigPlayer} from './rig-motion.mjs?v=23';
import {RIG_ASSETS} from './rig-assets.mjs?v=1';
let rig=null;
const nativeMode=new URLSearchParams(location.search).get('desktop')==='1';
const classic={id:'otter',zodiac:null,name:'折折',tag:'抱着邮包，慢慢来',shape:'圆圆耳 · 扁尾巴 · 小邮包',personality:'经典邮差小獭也住进了随身小窝。',colors:['#91a185','#fff4e6','#d99b79']};
const $ = id => document.getElementById(id);
const storeKey='paperpal.zodiac.experience.v2';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const session=new PlaySession();
const timers=new Set(), animations=new Set();
let selected=ZODIAC_CONCEPTS.find(p=>p.id==='dragon'), hovering=false, quiet=false, nextIdle=Date.now()+9000;
let memory={selected:'dragon',plays:{},touches:{}};
try{const value=JSON.parse(localStorage.getItem(storeKey));if(value&&typeof value==='object'){if(PERSONALITIES[value.selected])memory.selected=value.selected;for(const type of ['plays','touches'])for(const id of Object.keys(PERSONALITIES)){const n=value[type]?.[id];if(Number.isInteger(n)&&n>=0)memory[type][id]=Math.min(9999,n);}}}catch{}
const paths={
 heart:'<path d="M12 20S3 14.4 3 8.5a4.5 4.5 0 0 1 9-1 4.5 4.5 0 0 1 9 1C21 14.4 12 20 12 20Z"/>',
 hand:'<path d="M8 12V6a1.5 1.5 0 0 1 3 0v5-7a1.5 1.5 0 0 1 3 0v7-5a1.5 1.5 0 0 1 3 0v6-3a1.5 1.5 0 0 1 3 0v6c0 4-3 7-7 7-3 0-5-2-7-5l-2-3c-1-2 1-3 2-2l2 2"/>',
 moon:'<path d="M20 14A8.5 8.5 0 0 1 10 4a8.5 8.5 0 1 0 10 10Z"/><path d="m18 3 1 2 2 1-2 1-1 2-1-2-2-1 2-1Z"/>',
 seed:'<path d="M12 3c6 4 9 9 6 14-2 4-8 5-11 1C3 13 6 7 12 3Z"/><path d="M12 4v15"/>',
 cushion:'<rect x="3" y="5" width="18" height="14" rx="5"/><path d="m7 9 2 2m8-2-2 2M7 15l2-2m8 2-2-2"/>',
 pillow:'<rect x="3" y="5" width="18" height="14" rx="5"/><path d="M7 9h10M7 15h10"/>',
 paw:'<ellipse cx="12" cy="15.5" rx="5" ry="4.5"/><ellipse cx="5" cy="9" rx="2" ry="2.5"/><ellipse cx="10" cy="5.5" rx="2" ry="2.5"/><ellipse cx="15" cy="5.5" rx="2" ry="2.5"/><ellipse cx="20" cy="9" rx="2" ry="2.5"/>',
 cloud:'<path d="M7 18a5 5 0 1 1 0-10 6 6 0 0 1 11-1 5.5 5.5 0 0 1 1 11H7Z"/>',
 ball:'<circle cx="12" cy="12" r="9"/><path d="M5 6c6 1 6 11 14 12M6 19c0-7 10-9 12-14"/>',
 leaf:'<path d="M21 3C7 2 1 9 5 16s16 5 16-13Z"/><path d="M4 21 17 8M9 16v-5m4 1h5"/>',
 feather:'<path d="M5 19 18 6M9 15c-9-9 6-17 11-11 5 7-3 19-11 11Z"/><path d="m9 15 6 1m-2-5 6 1"/>',
 hoof:'<path d="M7 4h10l3 14c-5 3-11 3-16 0L7 4Z"/><path d="M12 10v11"/>',
 check:'<path d="m5 12 4 4L20 5"/>',
};
const icon=key=>`<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true">${paths[key]||paths.heart}</svg>`;
const profile=()=>PERSONALITIES[selected.id];
const motionAllowed=()=>!quiet&&!reduced.matches&&!document.hidden&&(!nativeMode||!document.body.dataset.workmode||document.body.dataset.workmode==='available');
new ResizeObserver(()=>{
  const picker=$('cast'),active=picker.querySelector('[aria-pressed="true"]');
  if(!active||picker.scrollWidth<=picker.clientWidth)return;
  const a=active.getBoundingClientRect(),b=picker.getBoundingClientRect();
  if(a.left<b.left)picker.scrollLeft+=a.left-b.left-6;
  else if(a.right>b.right)picker.scrollLeft+=a.right-b.right+6;
}).observe($('cast'));
function persist(){try{localStorage.setItem(storeKey,JSON.stringify(memory));}catch{}}
function remember(type){memory[type][selected.id]=Math.min(9999,(memory[type][selected.id]||0)+1);persist();renderMemory();}
function renderMemory(){const p=profile(),plays=memory.plays[selected.id]||0,touches=memory.touches[selected.id]||0;$('memory-text').textContent=plays||touches?p.habit:`${selected.name}还在悄悄观察你。一起玩一次，就能发现它的小习惯。`;$('memory-count').textContent=plays||touches?`本机记得：${touches}次摸摸，${plays}次一起玩。`:'小小的陪伴，慢慢熟悉。';}
function later(fn,ms){const serial=session.serial,id=selected.id;const timer=setTimeout(()=>{timers.delete(timer);if(serial===session.serial&&selected.id===id)fn();},ms);timers.add(timer);return timer;}
function cancel(){rig?.cancel();for(const timer of timers)clearTimeout(timer);timers.clear();for(const animation of animations)animation.cancel();animations.clear();$('effects').replaceChildren();$('pet-aim').style.transform='';$('pet').style.opacity='';nextIdle=Date.now()+12000;}
function animate(target,frames,duration,event){if(!motionAllowed()||event?.detail===0)return null;const animation=target.animate(frames,{duration,easing:'cubic-bezier(.22,.8,.28,1)',fill:'none'});animations.add(animation);animation.finished.then(()=>animations.delete(animation),()=>animations.delete(animation));return animation;}
function makeArt(item,pose='idle'){
  if(item.id==='otter'){const wrap=document.createElement('span');wrap.className='art classic-art';wrap.innerHTML=mascot;return wrap;}
  const wrap=document.createElement('span');wrap.className='art';wrap.setAttribute('aria-hidden','true');const img=new Image();img.alt='';img.draggable=false;
  if(nativeMode){const p=PERSONALITIES[item.id],col={idle:0,touch:1,play:2,sleep:3}[pose],rows={a:[[0,395],[395,321],[716,370]],b:[[0,425],[425,353],[778,308]],c:[[0,401],[401,345],[746,340]],d:[[0,396],[396,350],[746,340]]},[top,height]=rows[p.group][p.row],side=Math.max(362,height);const crop=document.createElement('span');Object.assign(crop.style,{position:'absolute',overflow:'hidden',left:`${(side-362)/2/side*100}%`,top:`${(side-height)/2/side*100}%`,width:`${362/side*100}%`,height:`${height/side*100}%`});img.src=`assets/desktop-zodiac-${p.group}-v1.png`;Object.assign(img.style,{width:'400%',height:`${1086/height*100}%`,left:`${-col*100}%`,top:`${-top/height*100}%`});crop.append(img);wrap.append(crop);return wrap;}
  else if(pose==='idle'){const [x,y,w,h]=item.rect,side=Math.max(w,h);img.src='assets/zodiac-lineup-v1.png';Object.assign(img.style,{width:`${1448/side*100}%`,height:`${1086/side*100}%`,left:`${(-x+(side-w)/2)/side*100}%`,top:`${(-y+(side-h)/2)/side*100}%`});}
  else{const p=PERSONALITIES[item.id],col={touch:0,play:1,sleep:2}[pose];img.src=`assets/zodiac-poses-${p.group}-v1.png`;Object.assign(img.style,{width:'300%',height:'300%',left:`${-col*100}%`,top:`${-p.row*100}%`});}
  img.addEventListener('error',()=>{if(wrap.isConnected&&pose!=='idle'){$('portrait').replaceChildren(makeArt(selected));$('speech').textContent='姿态图暂时没加载好，可以重新打开页面再试。';}},{once:true});wrap.append(img);return wrap;
}
function pose(value,event){
 const host=$('portrait');
 if(RIG_ASSETS[selected.id]){
  if(!rig||rig.species!==selected.id){rig?.destroy();rig=new RigPlayer(host,selected.id,RIG_ASSETS[selected.id],{enabled:()=>!quiet&&!reduced.matches&&!document.hidden&&!['focus','meeting'].includes(document.body.dataset.workmode),idleAllowed:()=>!hovering&&session.mode==='idle'&&motionAllowed(),personality:()=>document.body.dataset.personality||'gentle'});}
  const instant=reduced.matches||quiet;
  if(value==='sleep')rig.play('sleep',{instant});
  else if(value==='idle'&&rig.sleeping)rig.play('wake',{instant});
  else if(value==='touch')rig.play('touch',{instant});
 }else{rig?.destroy();rig=null;host.replaceChildren(makeArt(selected,value));animate(host,[{opacity:.55},{opacity:1}],170,event);}
 host.dataset.pose=value;
}
function say(text,badge){$('speech').textContent=text;if(badge)$('state-badge').textContent=badge;document.querySelector('.theater').dataset.mode=session.mode;}
function effect(key='heart',event){if(!motionAllowed()||event?.detail===0)return;const offsets=[[-30,-12],[12,6],[42,-2]];for(let i=0;i<3;i++){const el=document.createElement('span');el.className='effect';el.innerHTML=icon(key);el.style.left=`calc(50% + ${offsets[i][0]}px)`;el.style.top=`${174+offsets[i][1]}px`;$('effects').append(el);const animation=animate(el,[{transform:'translateY(0) scale(.9)',opacity:0},{transform:`translate(${i*6-6}px,-22px) scale(1)`,opacity:.8,offset:.3},{transform:`translate(${i*10-10}px,-53px) scale(.95)`,opacity:0}],1100+i*100,event);if(animation)animation.finished.then(()=>el.remove(),()=>el.remove());else el.remove();}}
function gesture(event){rig?.play(session.mode==='touch'?'touch':'tilt',{instant:quiet||reduced.matches});}
function idleTray(){const p=profile();$('play-tray').innerHTML=`<div class="tray-empty"><span class="tray-icon">${icon(p.toy)}</span><p>${p.instruction}</p><button data-start type="button">${p.play}</button></div>`;$('touch-hint').textContent=`点点${selected.name}，它会回应你的。`;}
function setButtons(){const p=profile();$('touch-action').innerHTML=icon('hand')+p.touch;$('play-action').innerHTML=icon(p.toy)+p.play;$('rest-action').innerHTML=icon(session.mode==='sleep'?'heart':'moon')+(session.mode==='sleep'?'恢复陪伴':'安静陪伴');$('play-action').dataset.active=String(session.mode==='play');$('rest-action').dataset.active=String(session.mode==='sleep');$('pet').setAttribute('aria-label',session.mode==='sleep'?`恢复陪伴${selected.name}`:`${p.touch}，${selected.name}会回应你`);}
function touch(event){document.dispatchEvent(new CustomEvent('paperpal:touch'));cancel();if(session.mode==='sleep'){session.wake();pose('idle',event);say('我在这里，继续陪着你。','自在陪伴');idleTray();}else{const line=session.touch();pose('touch',event);say(line,'喜欢摸摸');remember('touches');gesture(event,.7);effect('heart',event);idleTray();later(()=>{session.wake();pose('idle',event);say(profile().greeting,'自在陪伴');setButtons();},3400);}setButtons();}
function rest(event){if(session.mode==='sleep'){touch(event);return;}cancel();session.sleep();pose('sleep',event);say('我把动作收好，安静陪着你。','安静陪伴');$('touch-hint').textContent='点点它，或选择其他互动，都可以恢复陪伴。';$('play-tray').innerHTML=`<div class="tray-empty"><span class="tray-icon">${icon('moon')}</span><p>小伙伴安静陪着你。</p><button data-wake type="button">恢复陪伴${selected.name}</button></div>`;setButtons();}
function select(id,event){const item=ZODIAC_CONCEPTS.find(p=>p.id===id)||(id==='otter'?classic:null);if(!item)return;cancel();selected=item;session.select(id);const p=profile();memory.selected=id;persist();document.documentElement.style.setProperty('--accent',p.accent);for(const key of ['name','personality','shape'])$(key).textContent=item[key];$('trait').textContent=p.trait;$('species').textContent=`${item.zodiac} · 生肖伙伴`;$('scene-title').textContent=`${item.name}的陪伴小角落`;$('palette').replaceChildren(...item.colors.map(color=>{const swatch=document.createElement('span');swatch.className='swatch';swatch.style.background=color;swatch.title=color;swatch.setAttribute('role','img');swatch.setAttribute('aria-label',color);return swatch;}));document.querySelectorAll('[data-pet]').forEach(button=>{const active=button.dataset.pet===id;button.setAttribute('aria-pressed',String(active));button.tabIndex=active?0:-1;});$('design-details').hidden=true;$('details-toggle').setAttribute('aria-expanded','false');pose('idle',event);say(p.greeting,'自在陪伴');idleTray();setButtons();renderMemory();try{history.replaceState(null,'',`#${id}`);}catch{}const picker=$('cast'),active=document.querySelector(`[data-pet="${id}"]`);if(picker.scrollWidth>picker.clientWidth){requestAnimationFrame(()=>{const a=active.getBoundingClientRect(),b=picker.getBoundingClientRect();if(a.left<b.left)picker.scrollLeft+=a.left-b.left-6;else if(a.right>b.right)picker.scrollLeft+=a.right-b.right+6;});}const preload=new Image();preload.src=nativeMode?`assets/desktop-zodiac-${p.group}-v1.png`:`assets/zodiac-poses-${p.group}-v1.png`;document.dispatchEvent(new CustomEvent('paperpal:selection',{detail:{id,event}}));}

function heading(){const game=session.game,goal=game==='roll'?2:['stretch','breathe'].includes(game)?1:3;return `<div class="game-heading"><b>${profile().play}</b><span>${Array.from({length:goal},(_,i)=>`<i class="step-dot ${i<session.progress?'done':''}"></i>`).join('')}</span></div><p class="game-instruction">${profile().instruction}</p>`;}
function toy(label,key,value,extra=''){return `<button type="button" class="toy-button ${extra}" data-game-value="${value}" aria-label="${label}">${icon(key)}</button>`;}
function start(event){const refocus=$('play-tray').contains(document.activeElement);cancel();const game=session.start();pose('play',event);say(profile().instruction,'一起玩一会');if(!rig)gesture(event,.75);$('touch-hint').textContent='随时可以摸摸、休息，或换一个小伙伴。';const head=heading();let controls='';
  if(game==='seeds'||game==='clouds'||game==='hop')controls=Array.from({length:3},(_,i)=>toy(game==='seeds'?`找到第${i+1}颗谷粒`:game==='hop'?`跳到第${i+1}朵云`:`收集第${i+1}朵小云`,profile().toy,i)).join('');
  else if(game==='roll'||game==='stretch')controls=`<span class="game-caption">${game==='roll'?'左边':'慢慢来'}</span><input class="game-range" type="range" min="0" max="100" value="50" aria-label="${game==='roll'?'滚球位置，先到左端再到右端':'舒展程度，拉到最右端完成'}"><span class="game-caption">${game==='roll'?'右边':'刚刚好'}</span><span class="ball-marker" aria-hidden="true">${icon(profile().toy)}</span>`;
  else if(game==='wings')controls=toy('伸展左翅膀','feather','left')+toy('伸展右翅膀','feather','right');
  else if(game==='breathe')controls=`<span class="breath-circle" aria-hidden="true"></span><button class="toy-button toy-wide" type="button" data-breathe>开始一次呼吸</button>`;
  else if(game==='peekaboo')controls=`<button class="game-leaf" type="button" data-game-value="peek">${icon('leaf')}点开叶子，找到桃桃</button>`;
  else controls=`<button type="button" class="toy-button toy-wide" data-game-value="go">${icon(profile().toy)}${{cushion:'轻轻推一下',highfive:'碰一下小爪',steps:'哒，踏一步',fetch:'把球抛过去'}[game]||'一起玩'}</button>`;
  $('play-tray').innerHTML=head+`<div class="game-area ${game==='roll'||game==='stretch'?'range-game':''}">${controls}</div><p class="game-help">${game==='wings'?'左 · 右 · 左':game==='roll'?'先到左端，再到右端':game==='peekaboo'?'它藏起来了，试着找到它。':'每个小动作，都会收到回应。'}</p>`;
  if(game==='peekaboo')$('pet').style.opacity='.1';setButtons();if(refocus)$('play-tray').querySelector('button,input')?.focus({preventScroll:true});
}
function finish(event){const refocus=$('play-tray').contains(document.activeElement);remember('plays');pose('play',event);say(profile().success,'开心一下');effect('heart',event);$('play-tray').innerHTML=`<div class="game-complete"><p>${profile().success}</p><button type="button" data-start>再陪它玩一次</button></div>`;setButtons();if(refocus)$('play-tray').querySelector('[data-start]')?.focus({preventScroll:true});later(()=>{if(session.mode==='done'){session.wake();pose('idle',event);say(profile().greeting,'自在陪伴');setButtons();}},5000);}
function gameValue(value,event,target){if(session.mode!=='play')return;const game=session.game;
  if(['seeds','clouds','hop'].includes(game)&&target?.disabled)return;
  if(['seeds','clouds','hop'].includes(game)&&target){target.disabled=true;target.setAttribute('aria-pressed','true');}
  if(game==='peekaboo'){$('pet').style.opacity='1';say('呀，被你找到啦！再来一次？','找到桃桃');if(target)target.textContent=session.progress===2?'最后一次，找到桃桃':'桃桃又躲好了，点开叶子';}
  const before=session.progress,done=session.advance(value);if(session.progress===before&&!done){say(game==='wings'?'这一次先伸另一边的小翅膀。':profile().instruction,'慢慢来');return;}
  gesture(event,game==='steps'?.45:.65);if(game==='fetch')effect('ball',event);else if(game==='clouds')effect('cloud',event);else if(game==='highfive')effect('paw',event);
  if(done){$('pet').style.opacity='';finish(event);return;}
  $('play-tray').querySelector('.game-heading').outerHTML=heading().split('<p class="game-instruction">')[0];
  const lines={seeds:`找到第${session.progress}颗了，眼睛亮了一点。`,clouds:`小云收好啦，还有${3-session.progress}朵。`,hop:`轻轻落地，再向你靠近一步。`,cushion:['靠垫动了一点点。','再推一下，就快到啦。'][session.progress-1],highfive:'啪！小爪子给你一点勇气。',steps:['哒，第一步。','哒，第二步。'][session.progress-1],fetch:'叼回来啦！还想再陪你玩一轮。',wings:session.progress===1?'左边伸好了，再伸右边。':'右边也好了，最后再伸一次左边。',roll:'左边接到了，现在慢慢滚向右边。'};
  if(game!=='peekaboo')say(lines[game]||profile().instruction,'一起玩一会');
  if(game==='peekaboo')later(()=>{if(session.mode==='play'){$('pet').style.opacity='.1';say('尾巴藏不住啦，你发现了吗？','躲猫猫');}},900);
}
function breathe(event){if(session.game!=='breathe')return;cancel();pose('play',event);say('吸气——慢慢把小肚子装满。','一起吸气');const circle=$('play-tray').querySelector('.breath-circle');const button=$('play-tray').querySelector('[data-breathe]');if(button)button.textContent='重新开始这次呼吸';animate(circle,[{transform:'scale(1)'},{transform:'scale(1.32)'}],2800,event);later(()=>{say('呼气——让肩膀也松下来。','慢慢呼气');animate(circle,[{transform:'scale(1.32)'},{transform:'scale(1)'}],3300,event);},2800);later(()=>{if(session.advance('done'))finish(event);},6200);}

for(const item of ZODIAC_CONCEPTS){const button=document.createElement('button');button.type='button';button.className='friend';button.dataset.pet=item.id;button.setAttribute('aria-label',`选择${item.zodiac}，${item.name}`);const thumb=document.createElement('span');thumb.className='thumb';const thumbnail=new RigPlayer(thumb,item.id,null,{enabled:()=>false});cancelAnimationFrame(thumbnail.raf);const name=document.createElement('b');name.textContent=item.name;const zodiac=document.createElement('small');zodiac.textContent=item.zodiac;name.append(zodiac);button.append(thumb,name);button.addEventListener('click',event=>select(item.id,event));button.addEventListener('keydown',event=>{const index=ZODIAC_CONCEPTS.indexOf(item),map={ArrowRight:1,ArrowLeft:-1,ArrowDown:2,ArrowUp:-2};let next;if(event.key==='Home')next=0;else if(event.key==='End')next=11;else if(map[event.key])next=(index+map[event.key]+12)%12;else return;event.preventDefault();select(ZODIAC_CONCEPTS[next].id,{detail:0});const target=document.querySelector(`[data-pet="${selected.id}"]`);target.focus({preventScroll:true});target.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});});$('cast').append(button);}
$('touch-action').addEventListener('click',touch);$('pet').addEventListener('click',touch);$('play-action').addEventListener('click',start);$('rest-action').addEventListener('click',rest);
$('play-tray').addEventListener('click',event=>{const target=event.target.closest('button');if(!target||target.disabled)return;if(target.hasAttribute('data-start'))start(event);else if(target.hasAttribute('data-wake'))touch(event);else if(target.hasAttribute('data-breathe'))breathe(event);else if(target.hasAttribute('data-game-value'))gameValue(target.dataset.gameValue,event,target);});
$('play-tray').addEventListener('input',event=>{if(!event.target.matches('.game-range')||session.mode!=='play')return;const value=Number(event.target.value),marker=$('play-tray').querySelector('.ball-marker');if(marker&&motionAllowed())marker.style.transform=`rotate(${value*2}deg)`;if(session.game==='roll'){if(value<=5)gameValue('left',event);else if(value>=95)gameValue('right',event);}else gameValue(value,event);});
$('details-toggle').addEventListener('click',()=>{const open=$('design-details').hidden;$('design-details').hidden=!open;$('details-toggle').setAttribute('aria-expanded',String(open));});
function motionStatus(){const allowed=!quiet&&!reduced.matches;$('motion-toggle').setAttribute('aria-pressed',String(allowed));$('motion-toggle').textContent=reduced.matches?'系统已减少动态':quiet?'小动作已暂停':'小动作已开启';if(!allowed){rig?.pause();for(const animation of animations)animation.cancel();animations.clear();$('effects').replaceChildren();$('pet-aim').style.transform='';}}
$('motion-toggle').addEventListener('click',()=>{quiet=!quiet;motionStatus();});reduced.addEventListener('change',motionStatus);
$('pet').addEventListener('pointerenter',()=>{hovering=true;});$('pet').addEventListener('pointerleave',()=>{hovering=false;$('pet-aim').style.transform='';nextIdle=Date.now()+9000;});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancel();if(session.game==='breathe')say('等你回来，再开始一次慢慢呼吸。','休息一下');}else nextIdle=Date.now()+10000;});
for(const button of document.querySelectorAll('[data-quick]')){button.innerHTML=icon({touch:'hand',play:'heart',rest:'moon'}[button.dataset.quick])+button.textContent;button.addEventListener('click',event=>({touch,play:start,rest}[button.dataset.quick])(event));}document.querySelector('.memory-icon').innerHTML=icon('heart');motionStatus();select(PERSONALITIES[location.hash.slice(1)]?location.hash.slice(1):memory.selected,{detail:0});

export {select,touch,rest,start,session};
export function nativeCharacter(value){
 if(selected.id!==value.species)select(value.species,{detail:0});
 selected={...selected,name:value.name};$('name').textContent=value.name;$('scene-title').textContent=value.name+'的随身小窝';
 document.title='纸伴 PaperPal · '+value.name+'的随身小窝';
 document.documentElement.style.setProperty('--desktop-size',value.size);
 document.body.dataset.personality=value.personality;
 $('pet').setAttribute('aria-label',profile().touch+'，'+value.name+'会回应你');
}
export function nativeModeChange(mode){
 if(mode==='rest'){if(session.mode!=='sleep')rest({detail:0});}
 else if(mode!=='available'){cancel();session.wake();pose('idle',{detail:0});say(mode==='focus'?'你专心，我帮你守住这一小会儿。':'我把声音收好，安静陪你。',mode==='focus'?'专注陪伴':'会议中');setButtons();}
 else if(session.mode==='sleep'){touch({detail:0});}
 document.body.dataset.workmode=mode;
}

const motionActions=document.createElement('div');motionActions.className='motion-actions';motionActions.setAttribute('aria-label','轻轻互动');
motionActions.innerHTML='<button type="button" data-motion="blink">眨眨眼</button><button type="button" data-motion="tilt">歪歪头</button><button type="button" data-motion="jump">轻轻跳</button><button type="button" data-motion="happy">笑一个</button>';
$('play-tray').after(motionActions);
motionActions.addEventListener('click',event=>{const button=event.target.closest('[data-motion]');if(!button)return;const name=button.dataset.motion;if(name==='sleep'){document.querySelector('#rest-action').dispatchEvent(new MouseEvent('click',{bubbles:true,detail:1}));return;}cancel();if(session.mode==='sleep'){session.wake();document.dispatchEvent(new CustomEvent('paperpal:awake'));}else session.wake();pose('idle',event);rig?.play(name,{instant:quiet||reduced.matches});say(({blink:'眨眨眼，看到你啦。',tilt:'偏过头，听你说。',jump:'轻轻一跳，落回你身边。',happy:'看见你就很开心。'})[name],'轻轻互动');});
