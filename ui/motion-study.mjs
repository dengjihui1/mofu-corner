import {RigPlayer} from './rig-motion.mjs?v=23';
import {ZODIAC_CONCEPTS} from './zodiac-data.mjs';
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),players=[];
const $=id=>document.getElementById(id);
let hero=null,current='rabbit',lastAction='touch',autonomous=true;
const paths={
 eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
 tilt:'<path d="M6 16c-3-5-2-10 3-12s10 1 11 6-1 9-7 10M4 7l-2 4 5 1"/><path d="m10 9 .1 0m6 2 .1 0m-6 3 3 1"/>',
 hand:'<path d="M8 12V7a1.5 1.5 0 0 1 3 0v4-7a1.5 1.5 0 0 1 3 0v7-5a1.5 1.5 0 0 1 3 0v6-3a1.5 1.5 0 0 1 3 0v6c0 4-3 7-7 7-3 0-5-2-7-5l-2-3c-1-2 1-3 2-2l2 2Z"/>',
 jump:'<path d="M4 20h16M8 16c-4-2-3-7 0-8M16 16c4-2 3-7 0-8M9 5l3-3 3 3M12 2v10"/>',
 stretch:'<path d="M5 20c0-7 3-10 7-10s7 3 7 10M12 7V2M3 7l3 3M21 7l-3 3"/><path d="m10 4 2-2 2 2"/>',
 moon:'<path d="M20 14A8.4 8.4 0 0 1 10 4a8.5 8.5 0 1 0 10 10Z"/><path d="M18 3v4M16 5h4"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>',
 spark:'<path d="M11 3c0 6-2 8-8 8 6 0 8 2 8 8 0-6 2-8 8-8-6 0-8-2-8-8Z"/><path d="M20 17v5M17.5 19.5h5"/>'
};
for(const el of document.querySelectorAll('[data-icon]'))el.innerHTML=`<svg viewBox="0 0 24 24">${paths[el.dataset.icon]}</svg>`;
function shelfState(){const shelf=$('cast');$('cast-prev').disabled=shelf.scrollLeft<3;$('cast-next').disabled=shelf.scrollLeft+shelf.clientWidth>=shelf.scrollWidth-3;}
function revealSelected(instant=false){const shelf=$('cast'),card=shelf.querySelector(`[data-species="${current}"]`);if(!card)return;const a=card.getBoundingClientRect(),b=shelf.getBoundingClientRect();if(a.left<b.left+5||a.right>b.right-5)shelf.scrollTo({left:shelf.scrollLeft+a.left-b.left-(shelf.clientWidth-a.width)/2,behavior:instant||reduced.matches?'instant':'smooth'});shelfState();}
function select(species,keyboard=false){
 for(const button of document.querySelectorAll('[data-action]'))button.setAttribute('aria-pressed','false');
 current=species;const concept=ZODIAC_CONCEPTS.find(p=>p.id===species);hero?.destroy();hero=new RigPlayer($('hero'),species,null,{enabled:()=>!reduced.matches,idleAllowed:()=>autonomous});$('hero-name').textContent=concept.name;$('hero-zodiac').textContent=concept.zodiac;$('species-select').value=species;$('hero').setAttribute('role','img');$('hero').setAttribute('aria-label',concept.name+'，'+concept.zodiac+'生肖伙伴');$('pet-touch').setAttribute('aria-label','摸摸'+concept.name);
 for(const el of document.querySelectorAll('[data-species]')){const active=el.dataset.species===species;el.setAttribute('aria-pressed',String(active));el.tabIndex=active?0:-1;}
 requestAnimationFrame(()=>revealSelected(keyboard));
}
for(const concept of ZODIAC_CONCEPTS){
 const option=document.createElement('option');option.value=concept.id;option.textContent=concept.name+' · '+concept.zodiac;$('species-select').append(option);
 const card=document.createElement('button');card.type='button';card.className='cell';card.dataset.species=concept.id;card.setAttribute('aria-label','选择'+concept.name);const host=document.createElement('div');host.className='puppet';const name=document.createElement('b');name.textContent=concept.name;const zodiac=document.createElement('span');zodiac.className='pet-zodiac';zodiac.textContent=concept.zodiac;name.append(zodiac);const mark=document.createElement('span');mark.className='selection-mark';mark.setAttribute('aria-hidden','true');mark.innerHTML='<svg viewBox="0 0 20 20"><path d="m5 10 3 3 7-7"/></svg>';card.append(host,name,mark);$('cast').append(card);const p=new RigPlayer(host,concept.id,null,{enabled:()=>false});cancelAnimationFrame(p.raf);players.push(p);card.onclick=()=>select(concept.id);
 // Freeze the static shelf into independent bitmaps. Resizing the page must not
 // depend on the shared WebGL back buffer or keep twelve unused rigs alive.
 host.dataset.thumbReady='false';p.ready.then(async()=>{p.lastDraw=null;p.draw();const img=new Image();img.className='thumbnail-art';img.alt='';img.src=p.canvas.toDataURL();await img.decode();p.destroy();host.append(img);host.dataset.thumbReady='true';});
 card.onkeydown=event=>{const i=ZODIAC_CONCEPTS.indexOf(concept);let next;if(event.key==='ArrowRight')next=(i+1)%12;else if(event.key==='ArrowLeft')next=(i+11)%12;else if(event.key==='Home')next=0;else if(event.key==='End')next=11;else return;event.preventDefault();const id=ZODIAC_CONCEPTS[next].id;select(id,true);$('cast').querySelector(`[data-species="${id}"]`).focus({preventScroll:true});};
}
function run(action,event){lastAction=action;const rate=Number($('speed').value);hero.play(action,{instant:reduced.matches||event?.detail===0,rate});for(const button of document.querySelectorAll('[data-action]'))button.setAttribute('aria-pressed',String(button.dataset.action===action));}
$('ambient-toggle').onclick=()=>{autonomous=!autonomous;$('ambient-toggle').setAttribute('aria-pressed',String(autonomous));$('ambient-toggle').lastElementChild.textContent=autonomous?'自己玩一会 · 开':'自己玩一会 · 关';hero.pause();};
$('species-select').onchange=event=>select(event.target.value);
for(const button of document.querySelectorAll('[data-action]'))button.onclick=event=>run(button.dataset.action,event);
$('replay').onclick=event=>run(lastAction,event);
$('pet-touch').onclick=event=>run('touch',event);
for(const [id,direction]of [['cast-prev',-1],['cast-next',1]])$(id).onclick=()=>{const shelf=$('cast');shelf.scrollBy({left:direction*shelf.clientWidth*.8,behavior:reduced.matches?'instant':'smooth'});};
$('cast').addEventListener('scroll',shelfState,{passive:true});new ResizeObserver(()=>{shelfState();revealSelected();}).observe($('cast'));
select('rabbit');
export {players,hero};
