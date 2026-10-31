import {dressedAvatar} from './pet-outfit.mjs';
import {createRoomEditor} from './home-editor.mjs';
import {ROOM_SLOTS,WEAR_SLOTS,defaultLayout,defaultNode} from './room-layout.mjs';
import {HOME_STYLES} from './home-styles.mjs';
import {itemArt,roomScene} from './home-art.mjs';
import {saveRoomPostcard} from './room-postcard.mjs';
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const slots={all:'全部',wall:'墙纸',floor:'地板',rug:'地毯',seat:'座椅',plant:'花草',light:'灯具',art:'挂画',shelf:'书架',table:'茶几',chat:'聊天背景',headwear:'头饰',neckwear:'围巾',carry:'挎包'};
const reasonLabels={welcome:'搬家礼',presence:'在线陪伴',chat:'好友聊天',gesture:'宠物互动',purchase:'添置装饰'};
export function createHomeUI({getMe,api,post,toast,onAppearance=()=>{}}){
 let state=null,timer=null,epoch=0,dataRevision=0,tab='owned',category='all',selected=null,busy=false,visiting=null,inspiration=null,portraitKey='',sceneRevision=0,editing=null,editor=null,baseline='',conflict=false,leaveAction=null,photoBusy=false,query='',ownership='all',visitGeneration=0;
 const launcher=el('button','home-launch','我的家');launcher.type='button';launcher.hidden=true;
 const header=document.querySelector('.post-header'),actions=el('div','post-header-actions');actions.append(launcher,document.getElementById('connection'));header.append(actions);
 const dialog=el('dialog','home-dialog');dialog.setAttribute('aria-label','我的家与小商店');
 dialog.innerHTML=`<header class="home-heading"><div><h2 id="home-title">我的家</h2></div><div class="home-heading-actions"><button type="button" class="bean-wallet" id="home-wallet" aria-label="绒绒豆明细"><span class="bean-symbol" aria-hidden="true"></span><b>—</b><span>绒绒豆</span></button><button type="button" class="home-photo" id="home-photo">留张照片</button><button type="button" class="home-close" aria-label="关闭小屋">×</button></div></header><div id="home-error" class="home-error" role="status" hidden></div><div class="home-layout"><section class="home-stage-pane"><div class="home-design-bar"><button type="button" id="home-design">布置空间</button><div id="home-design-actions" hidden><button type="button" id="home-design-reset">重置摆放</button><button type="button" id="home-design-cancel">取消</button><button type="button" class="primary" id="home-design-save">保存布置</button></div></div><div id="home-scene"></div><div class="home-stage-caption"><span id="home-caption">正在打开小屋…</span><button type="button" id="home-preview-reset" hidden>退出试摆</button></div><div class="home-progress" id="home-progress"></div><details class="home-rules"><summary>获取绒绒豆</summary><p>第一次入住送 20 颗。保持登录联网，每 10 分钟 +2，每天最多 36 颗；多开窗口不加速，睡眠或断网不补计。当天和同一好友互相聊天各 +3，互送心心或摸头各 +1；好友奖励每天最多 12 颗。每天北京时间零点重置额度，余额不清零。</p><p>绒绒豆只用于装饰，无充值、转账或提现。购买后永久拥有，可反复换装。</p></details></section><section class="home-shop"><nav class="home-tabs" aria-label="小屋内容"><button type="button" data-home-tab="owned">收藏</button><button type="button" data-home-tab="shop">选物</button><button type="button" data-home-tab="wardrobe">穿搭</button><button type="button" data-home-tab="inspiration">灵感</button></nav><div class="home-browse" id="home-browse"><label class="home-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></svg><input id="home-search" type="search" placeholder="搜索名称或类别" aria-label="搜索装饰" maxlength="64" autocomplete="off"></label><select id="home-ownership" aria-label="装饰拥有状态"><option value="all">全部状态</option><option value="owned">已拥有</option><option value="affordable">可购买</option></select></div><div id="home-categories" class="home-categories" aria-label="装饰分类"></div><div class="home-result-line"><span id="home-result-count" role="status" aria-live="polite"></span><button type="button" id="home-clear-filters" hidden>清除筛选</button></div><div id="home-products" class="home-products" aria-label="装饰列表"></div><div id="home-selection" class="home-selection"></div></section><section class="home-editor-pane"><h3>调整布置</h3><div id="home-editor-tools" hidden></div></section></div><details class="home-ledger"><summary>收支记录</summary><div id="home-ledger-list"></div></details>`;
 document.body.append(dialog);
 const leaveDialog=el('dialog','home-leave-dialog');
 leaveDialog.setAttribute('aria-labelledby','home-leave-title');
 leaveDialog.innerHTML=`<h2 id="home-leave-title">保存这次布置？</h2><p id="home-leave-error" class="home-error" role="status" hidden></p><div class="home-leave-actions"><button type="button" id="home-leave-continue" autofocus>继续布置</button><button type="button" id="home-leave-discard">放弃修改</button><button type="button" id="home-leave-save" class="primary">保存并离开</button></div>`;
 document.body.append(leaveDialog);

 const $=id=>dialog.querySelector('#'+id),error=text=>{$('home-error').textContent=text||'';$('home-error').hidden=!text;};
 function isWorn(item){return ROOM_SLOTS.includes(item.slot)?Boolean(state.layout?.nodes[item.id]):state.equipped[item.slot]===item.id;}
 function fingerprint(nodes){return JSON.stringify(Object.keys(nodes).sort().map(id=>[id,Object.entries(nodes[id]).sort(([a],[b])=>a.localeCompare(b))]));}
 function dirty(){return !!editing&&fingerprint(editing.nodes)!==baseline;}
 function syncControls(){
  const on=!!editing,changed=dirty();
  dialog.classList.toggle('is-designing',on);
  dialog.querySelector('.home-shop').inert=on||busy;
  $('home-scene').inert=busy;$('home-editor-tools').inert=busy;
  $('home-design').hidden=on||!!visiting;$('home-design').disabled=busy||photoBusy;
  $('home-design-actions').hidden=!on;$('home-editor-tools').hidden=!on;
  $('home-design-save').disabled=busy||!changed;
  $('home-design-save').textContent=busy?'保存中…':conflict?'保存这份布置':'保存布置';
  $('home-design-cancel').disabled=busy;$('home-design-reset').disabled=busy;
  dialog.querySelector('.home-close').disabled=busy;
  $('home-photo').disabled=busy||photoBusy||on||!$('home-scene').querySelector('.mofu-room');
  $('home-photo').textContent=photoBusy?'拍照中…':'留张照片';
  for(const button of leaveDialog.querySelectorAll('button'))button.disabled=busy;
  leaveDialog.querySelector('#home-leave-save').textContent=busy?'保存中…':conflict?'保存当前这份':'保存并离开';
 }
 function editControls(){syncControls();}
 function endEdit(){error('');editor?.destroy();editor=null;editing=null;baseline='';conflict=false;sceneRevision++;editControls();render();}
 function closeHome(){visitGeneration++;dialog.close();}
 function requestLeave(action){
  if(busy)return;
  if(!editing||!dirty()){if(editing)endEdit();action();return;}
  if(leaveDialog.open)return;
  leaveAction=action;leaveDialog.querySelector('#home-leave-error').hidden=true;
  syncControls();leaveDialog.showModal();
 }
 async function saveLayout(){
  if(!editing||busy)return false;
  if(!dirty()){endEdit();return true;}
  const version=epoch,draft=editing;
  dataRevision++;busy=true;syncControls();error('');
  try{
   const next=await post('/home/layout',{nodes:structuredClone(draft.nodes),revision:draft.revision});
   if(version!==epoch||draft!==editing)return false;
   state=next;endEdit();toast('布置收好啦。');return true;
  }catch(e){
   if(version!==epoch||draft!==editing)return false;
   let message=e.message;
   if(e.status===409){
    try{
     const latest=await api('/home');
     if(version!==epoch||draft!==editing)return false;
     state=latest;editing.revision=latest.layout.revision;conflict=true;
     message='小屋在另一处更新过。当前摆放已保留，可保存这份布置。';
    }catch{message='暂时没能取回最新布置。当前摆放已保留，稍后再保存。';}
   }
   error(message);
   const notice=leaveDialog.querySelector('#home-leave-error');notice.textContent=message;notice.hidden=false;
   return false;
  }finally{if(version===epoch){busy=false;syncControls();render();}}
 }
 $('home-design').onclick=async()=>{
  if(busy||photoBusy||visiting||!state||editing)return;
  selected=null;inspiration=null;error('');
  const scene=roomScene(state.equipped,state.catalog,getMe(),state.layout.nodes),designRevision=++sceneRevision;
  editing={nodes:structuredClone(state.layout.nodes),revision:state.layout.revision};baseline=fingerprint(editing.nodes);conflict=false;
  editControls();await Promise.allSettled([...scene.querySelectorAll('img')].map(img=>img.decode()));
  if(!editing||!dialog.open||designRevision!==sceneRevision)return;
  $('home-scene').replaceChildren(scene);$('home-scene').setAttribute('aria-busy','false');
  editor=createRoomEditor(scene,$('home-editor-tools'),editing.nodes,state.catalog,{onChange:syncControls});
  $('home-caption').textContent='';$('home-preview-reset').hidden=true;syncControls();
 };
 $('home-design-cancel').onclick=()=>requestLeave(()=>{});
 $('home-design-reset').onclick=()=>{if(!busy){editor?.reset();syncControls();}};
 $('home-design-save').onclick=saveLayout;
 leaveDialog.querySelector('#home-leave-continue').onclick=()=>{leaveAction=null;leaveDialog.close();};
 leaveDialog.querySelector('#home-leave-discard').onclick=()=>{if(busy)return;const next=leaveAction;leaveAction=null;leaveDialog.close();endEdit();next?.();};
 leaveDialog.querySelector('#home-leave-save').onclick=async()=>{const next=leaveAction;if(await saveLayout()){leaveAction=null;leaveDialog.close();next?.();}};
 leaveDialog.addEventListener('cancel',e=>{if(busy)e.preventDefault();else leaveAction=null;});
 dialog.addEventListener('cancel',e=>{e.preventDefault();requestLeave(closeHome);});
 window.addEventListener('beforeunload',e=>{if(dirty()){e.preventDefault();e.returnValue='';}});
 $('home-photo').onclick=async()=>{
  if(busy||photoBusy||editing)return;
  const version=epoch;photoBusy=true;syncControls();error('');
  try{await saveRoomPostcard({scene:$('home-scene').firstElementChild,name:(visiting?.user||getMe()).name,preview:!!selected||!!inspiration});if(version===epoch)toast('照片收好啦。');}
  catch(e){if(version===epoch)error(e.message);}
  finally{if(version===epoch){photoBusy=false;syncControls();}}
 };
 function applyTheme(){const pane=document.querySelector('.letter-pane');if(pane)pane.dataset.homeTheme=state?.equipped.chat||'chat-paper';}
 function updateWallet(){if(state&&getMe()){const user=getMe();user.outfit=Object.fromEntries(WEAR_SLOTS.filter(slot=>state.equipped[slot]).map(slot=>[slot,state.equipped[slot]]));const key=JSON.stringify([user.id,user.species,user.outfit]);if(key!==portraitKey){portraitKey=key;onAppearance();const image=dressedAvatar(user.species,46,user.outfit);Promise.allSettled([...image.querySelectorAll('img')].map(i=>i.decode())).then(()=>{if(key===portraitKey&&getMe()?.id===user.id)document.getElementById('me-avatar')?.replaceChildren(image);});}}launcher.textContent='我的家'+(state?' · '+state.balance+' 豆':'');$('home-wallet').querySelector('b').textContent=state?.balance??'—';applyTheme();}
 function renderScene(){if(!state&&!visiting)return;const info=visiting||{user:getMe(),catalog:state.catalog,equipped:state.equipped,layout:state.layout};const equipped={...info.equipped,...(!visiting&&inspiration?inspiration.equipped:{})};if(selected&&!visiting)equipped[selected.slot]=selected.id;const nodes=structuredClone(inspiration?defaultLayout(inspiration.equipped,info.catalog):info.layout?.nodes||defaultLayout(info.equipped,info.catalog));if(selected&&ROOM_SLOTS.includes(selected.slot)&&!nodes[selected.id])nodes[selected.id]=defaultNode(selected.slot);const scene=roomScene(equipped,info.catalog,info.user,nodes),revision=++sceneRevision;const host=$('home-scene');host.setAttribute('aria-busy','true');Promise.allSettled([...scene.querySelectorAll('img')].map(img=>img.decode())).then(()=>{if(revision!==sceneRevision||!dialog.open)return;host.replaceChildren(scene);host.setAttribute('aria-busy','false');syncControls();});$('home-title').textContent=info.user.name+'的家';$('home-caption').textContent=visiting?'':inspiration?'搭配预览 · '+inspiration.name+' · 未购买不保存':selected?(WEAR_SLOTS.includes(selected.slot)?'试戴 · ':selected.slot==='chat'?'预览 · ':'试摆 · ')+selected.name:'';$('home-preview-reset').hidden=(!selected&&!inspiration)||!!visiting;$('home-preview-reset').textContent=selected&&WEAR_SLOTS.includes(selected.slot)?'退出试戴':'退出试摆';}
 function render({scene=true}={}){const priorFocus=document.activeElement,focusLabel=priorFocus?.getAttribute('aria-label')||priorFocus?.textContent;const priorProduct=priorFocus?.dataset?.productId;const priorScroll=$('home-products').scrollTop;updateWallet();syncControls();if(!dialog.open||editing||!state&&!visiting)return;if(scene)renderScene();const guest=!!visiting;dialog.classList.toggle('is-visiting',guest);$('home-design').hidden=guest; if(guest)return;
  for(const b of dialog.querySelectorAll('[data-home-tab]'))b.setAttribute('aria-pressed',String(b.dataset.homeTab===tab));
  $('home-categories').replaceChildren();for(const [id,name]of Object.entries(slots)){if(tab==='wardrobe'&&id!=='all'&&!WEAR_SLOTS.includes(id))continue;const b=el('button','',name);b.type='button';b.setAttribute('aria-pressed',String(category===id));b.onclick=()=>{category=id;$('home-products').scrollTop=0;render({scene:false});};$('home-categories').append(b);}
  const list=$('home-products');list.replaceChildren();list.classList.toggle('is-inspiration',tab==='inspiration');$('home-categories').hidden=tab==='inspiration';$('home-browse').hidden=tab==='inspiration';$('home-ownership').hidden=tab==='owned';
  if(tab==='inspiration')for(const room of HOME_STYLES){const b=el('button','home-inspiration');b.type='button';b.setAttribute('aria-label','试摆'+room.name);const words=el('div');words.append(el('b','',room.name),el('span','','整间试摆 · 不扣豆'));b.append(roomScene(room.equipped,state.catalog,{name:room.name,species:getMe().species}),words);b.onclick=()=>{inspiration=room;selected=null;tab='shop';category='all';render();};list.append(b);}
  const items=tab==='inspiration'?[]:state.catalog.filter(x=>(tab==='shop'||tab==='wardrobe'||state.owned.includes(x.id))&&(tab!=='wardrobe'||WEAR_SLOTS.includes(x.slot))&&(category==='all'||x.slot===category)&&(!inspiration||Object.values(inspiration.equipped).includes(x.id))&&(!query||[x.name,slots[x.slot]].join(' ').toLocaleLowerCase().includes(query.toLocaleLowerCase()))&&(tab==='owned'||ownership==='all'||ownership==='owned'&&state.owned.includes(x.id)||ownership==='affordable'&&!state.owned.includes(x.id)&&x.price<=state.balance));
  $('home-result-count').textContent=tab==='inspiration'?'':items.length+' 件';
  $('home-clear-filters').hidden=tab==='inspiration'||(!query&&ownership==='all'&&category==='all');
  if(!items.length&&tab!=='inspiration'){
   const empty=el('div','home-empty');empty.append(el('p','',query?'没有找到这件小物':ownership==='affordable'?'暂时没有可购买的小物':'这里还空着呢'));
   const b=el('button','soft-button',query||ownership!=='all'||category!=='all'?'清除筛选':'去小商店看看');b.type='button';
   b.onclick=()=>{if(query||ownership!=='all'||category!=='all')clearFilters();else{tab='shop';render({scene:false});}};
   empty.append(b);list.append(empty);
  }
  for(const item of items){
   const owned=state.owned.includes(item.id),worn=isWorn(item),preview=selected?.id===item.id&&!worn,b=el('button','home-product');
   const label=preview?(WEAR_SLOTS.includes(item.slot)?'试戴中':item.slot==='chat'?'预览中':'试摆中'):worn?(WEAR_SLOTS.includes(item.slot)?'已佩戴':item.slot==='chat'?'使用中':'已摆好'):owned?'已拥有':item.price+' 豆';
   b.type='button';b.dataset.productId=item.id;b.dataset.owned=String(owned);b.dataset.affordable=String(owned||state.balance>=item.price);b.disabled=busy;
   b.setAttribute('aria-pressed',String(selected?.id===item.id));b.setAttribute('aria-label',item.name+'，'+label);
   b.append(itemArt(item),el('b','',item.name),el('span','product-price'+(preview?' is-preview':''),label));
   b.onclick=()=>{selected=item;render();};list.append(b);
  }
  const detail=$('home-selection');detail.replaceChildren();detail.classList.toggle('has-wear-preview',!!selected&&WEAR_SLOTS.includes(selected.slot));if(selected&&WEAR_SLOTS.includes(selected.slot)){const portrait=el('div','home-wear-preview');portrait.setAttribute('aria-label','当前试戴效果');portrait.append(dressedAvatar(getMe().species,76,{...state.equipped,[selected.slot]:selected.id}));detail.append(portrait);}
  if(selected){const owned=state.owned.includes(selected.id),worn=isWorn(selected);const line=el('div','selection-copy');line.append(el('strong','',selected.name),el('span','',worn?(WEAR_SLOTS.includes(selected.slot)?'已佩戴':selected.slot==='chat'?'使用中':'已摆好'):owned?'已拥有':WEAR_SLOTS.includes(selected.slot)?'试戴中 · 尚未购买':selected.slot==='chat'?'预览中 · 尚未购买':'试摆中 · 尚未购买'));detail.append(line);if(selected.slot==='chat'){const sample=el('div','home-chat-preview');sample.style.background=selected.color;sample.setAttribute('aria-label','聊天背景预览');sample.append(el('span','','今天也来坐坐？'));detail.append(sample);}
   const b=el('button','primary',busy?'正在收好…':worn?'正在使用':owned?(WEAR_SLOTS.includes(selected.slot)?'戴上这件':selected.slot==='chat'?'使用背景':'摆进小屋'):state.balance<selected.price?'还差 '+(selected.price-state.balance)+' 豆':'买下并使用 · '+selected.price+' 豆');b.type='button';b.disabled=busy||worn||(!owned&&state.balance<selected.price);b.onclick=()=>act(owned?'/home/equip':'/home/buy',{itemId:selected.id},owned?(WEAR_SLOTS.includes(selected.slot)?'戴好啦。':'已经摆好了。'):'新装饰到家啦。');detail.append(b);
   if(worn&&[...ROOM_SLOTS,...WEAR_SLOTS].includes(selected.slot)){const away=el('button','home-put-away',WEAR_SLOTS.includes(selected.slot)?'摘下收好':'收进收藏');away.type='button';away.disabled=busy;away.onclick=()=>act('/home/put-away',{itemId:selected.id},'已收好，随时可以再摆。');detail.append(away);}
  }else detail.append(el('p','selection-hint',tab==='inspiration'?'选一间，试试整套搭配':tab==='wardrobe'?'选一件，给伙伴试戴':inspiration?'选一件，带回自己的家':'选一件，放进小屋看看'));
  const progress=$('home-progress');progress.replaceChildren();for(const [label,value,max]of [['在线陪伴',state.today.presence,state.rules.presenceCap],['好友互动',state.today.social,state.rules.socialCap]]){const row=el('div');const copy=el('div');copy.append(el('span','',label),el('span','',value+' / '+max+' 豆'));const meter=el('progress');meter.max=max;meter.value=value;meter.setAttribute('aria-label',label+'今日已获得');row.append(copy,meter);progress.append(row);}progress.append(el('small','',state.today.presence>=state.rules.presenceCap?'今天的陪伴奖励领满啦。':'今日已陪伴 '+state.today.minutes+' 分钟 · 每 10 分钟 +2 豆'));
  $('home-ledger-list').replaceChildren();for(const r of state.ledger){const row=el('div','ledger-row');const time=new Intl.DateTimeFormat('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(r.created);row.append(el('span','',reasonLabels[r.reason]||r.reason),el('time','',time),el('b','',r.delta>0?'+'+r.delta:String(r.delta)));$('home-ledger-list').append(row);}
  list.scrollTop=priorScroll;if(priorFocus&&!priorFocus.isConnected&&focusLabel){const target=[...dialog.querySelectorAll('button')].find(b=>priorProduct?b.dataset.productId===priorProduct:(b.getAttribute('aria-label')||b.textContent)===focusLabel);target?.focus({preventScroll:true});}
 }
 async function act(path,data,message){if(busy||editing)return;const version=epoch;dataRevision++;busy=true;error('');render();try{const next=await post(path,data);if(version!==epoch)return;state=next;selected=null;inspiration=null;toast(message);}catch(e){if(version===epoch)error(e.message);}finally{if(version===epoch){busy=false;render();}}}
 async function load(){if(busy)return;const version=epoch,request=++dataRevision;const next=await api('/home');if(version!==epoch||request!==dataRevision||!getMe())return;state=next;render();}
 async function pulse(version){if(version!==epoch||!getMe())return;try{if(busy)return;const request=++dataRevision,next=await post('/home/heartbeat');if(version!==epoch||request!==dataRevision||!getMe())return;state=next;render();}catch(e){if(dialog.open)error(e.message);}finally{if(version===epoch&&getMe())timer=setTimeout(()=>pulse(version),60000);}}
 async function open(){if(editing){requestLeave(open);return;}visitGeneration++;visiting=null;selected=null;inspiration=null;dialog.classList.remove('is-visiting');error('');if(!dialog.open)dialog.showModal();if(state)render();else $('home-scene').replaceChildren(el('p','home-loading','小屋正在开门…'));try{await load();}catch(e){error(e.message);}}
 launcher.onclick=open;dialog.querySelector('.home-close').onclick=()=>requestLeave(closeHome);dialog.addEventListener('close',()=>{if(dialog.open)return;if(editing)endEdit();selected=null;visiting=null;inspiration=null;applyTheme();});$('home-preview-reset').onclick=()=>{selected=null;inspiration=null;render();};
 for(const b of dialog.querySelectorAll('[data-home-tab]'))b.onclick=()=>{tab=b.dataset.homeTab;category='all';ownership='all';query='';$('home-search').value='';$('home-ownership').value='all';selected=null;inspiration=null;$('home-products').scrollTop=0;render();};
 function clearFilters(){query='';ownership='all';category='all';$('home-search').value='';$('home-ownership').value='all';$('home-products').scrollTop=0;render({scene:false});}
 $('home-clear-filters').onclick=clearFilters;
 $('home-search').oninput=()=>{query=$('home-search').value.trim();$('home-products').scrollTop=0;render({scene:false});};
 $('home-ownership').onchange=()=>{ownership=$('home-ownership').value;$('home-products').scrollTop=0;render({scene:false});};
 $('home-wallet').onclick=()=>{const ledger=dialog.querySelector('.home-ledger');ledger.open=!ledger.open;if(ledger.open)ledger.scrollIntoView({block:'nearest',behavior:'smooth'});};
 async function visit(id){
  if(editing){requestLeave(()=>visit(id));return;}
  error('');try{const version=epoch,request=++visitGeneration,other=await api('/home/visit/'+id);if(version!==epoch||request!==visitGeneration||!getMe())return;visiting=other;selected=null;inspiration=null;if(!dialog.open)dialog.showModal();render();}catch(e){toast(e.message);}
 }
 return {
  start(){this.stop();launcher.hidden=false;const version=epoch;pulse(version);},
  stop(){portraitKey='';epoch++;sceneRevision++;visitGeneration++;editor?.destroy();editor=null;editing=null;baseline='';conflict=false;leaveAction=null;leaveDialog.close();clearTimeout(timer);timer=null;busy=false;photoBusy=false;state=null;visiting=null;selected=null;inspiration=null;query='';ownership='all';category='all';$('home-search').value='';$('home-ownership').value='all';editControls();launcher.hidden=true;dialog.close();applyTheme();},
  open,refresh(){if(getMe())load().catch(()=>{});},visit,
 };
}
