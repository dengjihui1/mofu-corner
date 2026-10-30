export function inviteHandle(value){
 if(typeof value!=='string')return null;
 const handle=value.trim().replace(/^@/,'').toLowerCase();
 return /^[a-z][a-z0-9_]{2,23}$/.test(handle)?handle:null;
}
export function friendInviteUrl(origin,handle){
 const safe=inviteHandle(handle),url=new URL('/',origin);
 if(!safe||!['http:','https:'].includes(url.protocol))throw Error('邀请地址无效');
 url.searchParams.set('friend',safe);return url.href;
}
const node=(tag,cls,text)=>{const el=document.createElement(tag);el.className=cls;if(text!==undefined)el.textContent=text;return el;};
export function createFriendInvite({getMe,search,chooseSearch,openHome,openProfile,portrait,toast}){
 const initial=new URL(location.href);let handle=inviteHandle(initial.searchParams.get('friend')),hasInvite=initial.searchParams.has('friend'),attempt=0,resolvedFor='';
 const auth=document.getElementById('friend-invite-auth'),banner=document.getElementById('friend-invite'),title=document.getElementById('friend-invite-title'),note=document.getElementById('friend-invite-note'),retry=document.getElementById('friend-invite-retry');
 const share=document.getElementById('invite-share-dialog'),link=document.getElementById('invite-share-link'),shareNote=document.getElementById('invite-share-note'),copyButton=document.getElementById('invite-share-copy'),privacyButton=document.getElementById('invite-share-privacy');
 function authNotice(){auth.hidden=!hasInvite;auth.textContent=handle?'@'+handle+' 邀请你来坐坐，登录后查看。':'邀请地址不完整，可以向朋友再要一份。';}
 function dismiss(){hasInvite=false;handle=null;attempt++;auth.hidden=true;banner.hidden=true;const url=new URL(location.href);url.searchParams.delete('friend');history.replaceState(history.state,'',url.pathname+url.search+url.hash);}
 document.getElementById('friend-invite-dismiss').onclick=dismiss;
 function showShare(privateAccount=false){const me=getMe();if(!me)return;shareNote.textContent=privateAccount?'你已关闭被搜索，朋友暂时无法通过邀请找到你。':'把这张邀请递给朋友，一起在绒角住下。';link.hidden=privateAccount;copyButton.hidden=privateAccount;privacyButton.hidden=!privateAccount;link.value=friendInviteUrl(location.origin,me.handle);if(!share.open)share.showModal();if(!privateAccount){link.focus();link.select();}}
 async function copy(){const me=getMe();if(!me)return;if(!me.discoverable){showShare(true);return;}const url=friendInviteUrl(location.origin,me.handle);try{await navigator.clipboard.writeText(url);toast('邀请已复制，发给朋友吧。');if(share.open)share.close();}catch{showShare();}}
 copyButton.onclick=copy;privacyButton.onclick=()=>{share.close();openProfile();};link.onclick=()=>link.select();
 for(const button of document.querySelectorAll('[data-copy-invite]'))button.onclick=copy;
 for(const button of document.querySelectorAll('[data-open-home]'))button.onclick=()=>openHome();
 async function resume(){const me=getMe();auth.hidden=true;if(!hasInvite||!me||resolvedFor===me.id)return;resolvedFor=me.id;const request=++attempt;chooseSearch(handle||'');banner.hidden=false;retry.hidden=true;
  if(!handle){title.textContent='这张邀请没写完整';note.textContent='请朋友重新复制邀请链接。';return;}
  if(handle===me.handle.toLowerCase()){title.textContent='这是你的邀请链接';note.textContent='复制给朋友，一起来坐坐。';return;}
  title.textContent='正在打开邀请';note.textContent='@'+handle;
  try{const users=await search(handle);if(request!==attempt||getMe()?.id!==me.id||!hasInvite||!users)return;const person=users.find(p=>p.handle===handle);title.textContent=person?person.name+' 在绒角等你':'暂时找不到这位朋友';note.textContent=person?(person.friend?'已经是好友，可以去 TA 家坐坐。':'成为好友后，就能串门。'):'账号可能未开放搜索，或邀请地址已变更。';}
  catch{if(request!==attempt||getMe()?.id!==me.id)return;title.textContent='邀请暂时没打开';note.textContent='稍后再试，邀请会留在这里。';retry.hidden=false;}
 }
 retry.onclick=()=>{resolvedFor='';resume();};
 function empty(){const section=node('section','friend-welcome'),art=node('div','friend-welcome-art');art.append(portrait(getMe(),106));const actions=node('div','friend-welcome-actions'),invite=node('button','primary','复制邀请'),home=node('button','friend-home-link','布置我的家');invite.type=home.type='button';invite.onclick=copy;home.onclick=()=>openHome();actions.append(invite,home);section.append(node('p','friend-welcome-quiet','还没有好友'),art,node('h3','','让小屋热闹起来'),node('p','','邀请朋友，一起聊聊、串串门。'),actions);return section;}
 authNotice();
 return {resume,empty,copy,dismiss,updateKnown(friends){if(banner.hidden||!handle)return;const person=friends.find(p=>p.handle===handle);if(person){title.textContent=person.name+' 在绒角等你';note.textContent='已经是好友，可以去 TA 家坐坐。';}},reset(){attempt++;resolvedFor='';banner.hidden=true;share.close();authNotice();}};
}
