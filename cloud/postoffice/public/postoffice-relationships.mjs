import {avatar,icon} from './postoffice-avatars.mjs';
import {RELATIONSHIPS,ROLE_LABELS,relationshipType} from './relationships.mjs';
const $=id=>document.getElementById(id);
const node=(tag,cls,text)=>{const el=document.createElement(tag);el.className=cls||'';if(text!==undefined)el.textContent=text;return el;};

export function createRelationshipUI({getMe,getFriends,post,refresh,toast,confirm}) {
  let peerId=null,selected=null,myRole=null,signature='',busy=false;
  const peer=()=>getFriends().find(p=>p.id===peerId);
  const error=text=>{$('relationship-error').textContent=text||'';$('relationship-error').hidden=!text;};
  const typeOf=p=>relationshipType((p.relationshipRequest||p.relationship)?.kind);
  function badge(p){
    const type=relationshipType(p.relationship?.kind),badge=node('span','relation-badge');
    if(type){badge.append(icon(type.icon),node('span','',type.label));}
    else{badge.classList.add('pending');badge.append(icon('mail'),node('span','',p.relationshipRequest?.incoming?'关系邀请':'待确认'));}
    return badge;
  }
  function person(user,role,mine){const el=node('div','relationship-person');el.append(avatar(user.species,84),node('b','',mine?'我':user.name));if(role)el.append(node('small','',ROLE_LABELS[role]));return el;}
  function render(){
    const p=peer();if(!p){$('relationship-dialog').close();return;}
    const next=JSON.stringify([p.id,p.relationship,p.relationshipRequest]);
    if(next!==signature){signature=next;selected=p.relationship?.kind||null;myRole=p.relationship?.myRole||null;error('');}
    const current=p.relationship,request=p.relationshipRequest,type=typeOf(p)||relationshipType(selected),roles=request||current;
    const seal=node('span','relationship-seal');seal.append(icon(type?.icon||'flower'));
    $('relationship-pair').replaceChildren(person(getMe(),roles?.myRole,true),seal,person(p,roles?.peerRole,false));
    $('relationship-status').textContent=request?(request.incoming?p.name+' 想和你绑定「'+type.label+'」':'「'+type.label+'」邀请已寄出'):(current?'我们是'+type.label:'给你们一个特别的称呼');
    $('relationship-note').textContent=request?(request.incoming?'确认后，仅你们两人可见。':'等对方确认 · 7 天内有效'):(current?'绑定于 '+new Date(current.created).toLocaleDateString('zh-CN'):'对方确认后生效，仅你们两人可见。');
    $('relationship-existing').hidden=!(request&&current);
    if(request&&current)$('relationship-existing').textContent='当前关系：'+relationshipType(current.kind).label;
    $('relationship-choices').hidden=!!request;$('relationship-roles').hidden=true;
    $('relationship-choices').replaceChildren();
    if(!request){
      for(const item of RELATIONSHIPS){const b=node('button','relationship-choice');b.type='button';b.dataset.relationship=item.id;b.setAttribute('aria-pressed',String(selected===item.id));b.append(icon(item.icon),node('span','',item.label));b.disabled=busy;b.onclick=()=>{selected=item.id;myRole=current?.kind===selected?current.myRole:null;render();};$('relationship-choices').append(b);}
      const chosen=relationshipType(selected);
      if(chosen?.roles){$('relationship-roles').hidden=false;$('relationship-role-options').replaceChildren();for(const role of chosen.roles){const b=node('button','relationship-role',ROLE_LABELS[role]);b.type='button';b.dataset.role=role;b.setAttribute('aria-pressed',String(myRole===role));b.disabled=busy;b.onclick=()=>{myRole=role;render();};$('relationship-role-options').append(b);}}
    }
    $('relationship-submit').hidden=!!request;$('relationship-accept').hidden=!request?.incoming;$('relationship-decline').hidden=!request?.incoming;$('relationship-cancel').hidden=!request||request.incoming;
    const chosen=relationshipType(selected),same=current?.kind===selected&&current.myRole===myRole;
    $('relationship-submit').textContent=same?'已绑定'+chosen.label:chosen?'邀请绑定'+chosen.label:'先选一个关系';
    $('relationship-submit').disabled=busy||!chosen||!!(chosen.roles&&!myRole)||same;
    for(const id of ['relationship-accept','relationship-decline','relationship-cancel','relationship-remove'])$(id).disabled=busy;
    $('relationship-remove').hidden=!current;
  }
  async function action(path,payload,message){if(busy)return;busy=true;render();error('');try{await post(path,payload);await refresh();if(message)toast(message);}catch(e){await refresh().catch(()=>{});error(e.message||'操作未完成，请重试。');}finally{busy=false;render();}}
  function open(id){peerId=id;signature='';if(!peer())return;render();$('relationship-dialog').showModal();}
  $('relationship-submit').onclick=()=>action('/relationships/'+peerId+'/propose',{kind:selected,myRole},'关系邀请寄出啦。');
  for(const kind of ['accept','decline','cancel'])$('relationship-'+kind).onclick=()=>{const r=peer()?.relationshipRequest;if(r)action('/relationship-requests/'+r.id+'/'+kind,{},kind==='accept'?'关系绑定好啦。':kind==='cancel'?'已撤回邀请。':'已婉拒邀请。');};
  $('relationship-remove').onclick=()=>{const p=peer();if(!p?.relationship)return;const id=p.id,relationshipId=p.relationship.id;confirm('解除'+relationshipType(p.relationship.kind).label+'关系？','双方恢复为普通好友，仍可聊天。',async()=>{await post('/relationships/'+id+'/remove',{relationshipId});await refresh();toast('已解除绑定。');});};
  function update(active){
    const p=getFriends().find(p=>p.id===active),button=$('relationship-open');button.hidden=!p;
    if(p){if(p.relationship||p.relationshipRequest)button.replaceChildren(badge(p));else button.replaceChildren(icon('flower'),node('span','','绑定关系'));button.classList.toggle('has-invitation',!!p.relationshipRequest?.incoming);button.setAttribute('aria-label','与'+p.name+'的关系：'+(relationshipType(p.relationship?.kind)?.label||'普通好友'));button.onclick=()=>open(p.id);}
    if($('relationship-dialog').open)render();
  }
  function requestCards(){return getFriends().filter(p=>p.relationshipRequest).sort((a,b)=>Number(b.relationshipRequest.incoming)-Number(a.relationshipRequest.incoming)).map(p=>{const card=node('div','request-card relationship-request'),line=node('div','request-person'),detail=node('span'),r=p.relationshipRequest;line.append(avatar(p.species,42));detail.append(node('b','',p.name),node('small','',(r.incoming?'邀请你绑定':'已邀请绑定')+' · '+relationshipType(r.kind).label));line.append(detail);const button=node('button','accept',r.incoming?'查看邀请':'查看进度'),actions=node('div','request-actions');button.type='button';button.onclick=()=>open(p.id);actions.append(button);card.append(line,actions);return card;});}
  return {update,badge,requestCards};
}
