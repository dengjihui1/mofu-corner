import {CATALOG,DEFAULT_HOME} from './home-catalog.mjs';
import {ROOM_SLOTS,defaultLayout,defaultNode} from '../public/room-layout.mjs';
const fail=(status,message)=>{throw Object.assign(Error(message),{status});};
export async function readLayout(s,id){
 let row=await s.get('SELECT nodes,revision FROM home_layout WHERE user_id=?',id);
 if(!row){const rows=await s.all('SELECT slot,item_id FROM home_equipment WHERE user_id=?',id);const nodes=defaultLayout({...DEFAULT_HOME,...Object.fromEntries(rows.map(r=>[r.slot,r.item_id]))},CATALOG);await s.run('INSERT OR IGNORE INTO home_layout(user_id,nodes) SELECT ?,? WHERE EXISTS(SELECT 1 FROM users WHERE id=?)',id,JSON.stringify(nodes),id);row=await s.get('SELECT nodes,revision FROM home_layout WHERE user_id=?',id);}
 return {nodes:JSON.parse(row?.nodes||'{}'),revision:Number(row?.revision||0)};
}
export function addPlacement(id,item,order,session){
 if(!ROOM_SLOTS.includes(item.slot))return [];
 const path='$.'+'"'+item.id+'"';
 return [['UPDATE home_layout SET nodes=json_set(nodes,?,json(?)),revision=revision+1 WHERE user_id=? AND json_type(nodes,?) IS NULL'+(order?' AND EXISTS(SELECT 1 FROM home_inventory WHERE purchase_id=?)':'')+(session?' AND EXISTS(SELECT 1 FROM sessions WHERE hash=? AND user_id=? AND expires>?)':''),path,JSON.stringify(defaultNode(item.slot)),id,path,...(order?[order]:[]),...(session?[session.hash,id,session.now]:[])]];
}
export function removePlacement(id,itemId){return ['UPDATE home_layout SET nodes=json_remove(nodes,?),revision=revision+1 WHERE user_id=?','$.'+'"'+itemId+'"',id];}
export async function saveLayout(s,me,data,now){
 if(!Number.isSafeInteger(data.revision)||data.revision<0||!data.nodes||Array.isArray(data.nodes)||typeof data.nodes!=='object')fail(400,'布置格式不正确');
 const entries=Object.entries(data.nodes);if(entries.length>40||!Object.hasOwn(data.nodes,'pet'))fail(400,'请给伙伴留一个位置');
 const owned=new Set((await s.all('SELECT item_id FROM home_inventory WHERE user_id=?',me.id)).map(x=>x.item_id));const clean={};
 for(const [id,n]of entries){const item=CATALOG.find(x=>x.id===id);if(id!=='pet'&&(!item||!ROOM_SLOTS.includes(item.slot)))fail(400,'这件物品不能放进房间');if(item?.price&&!owned.has(id))fail(403,'只能摆放自己拥有的装饰');
  if(!n||Array.isArray(n)||typeof n!=='object'||typeof n.flip!=='boolean')fail(400,'摆放参数不正确');
  for(const [key,min,max]of [['x',5,95],['y',5,95],['scale',0.55,1.5],['rotation',-35,35],['z',0,60]])if(typeof n[key]!=='number'||!Number.isFinite(n[key])||n[key]<min||n[key]>max)fail(400,'请将装饰留在小屋内');
  if(!Number.isInteger(n.z))fail(400,'摆放层次不正确');
  clean[id]={x:n.x,y:n.y,scale:n.scale,rotation:n.rotation,z:n.z,flip:n.flip};
 }
 await readLayout(s,me.id);
 const result=await s.run('UPDATE home_layout SET nodes=?,revision=revision+1 WHERE user_id=? AND revision=? AND EXISTS(SELECT 1 FROM sessions WHERE hash=? AND user_id=? AND expires>?)',JSON.stringify(clean),me.id,data.revision,me.sessionHash,me.id,now);
 if(!result.meta.changes)fail(409,'小屋已在另一处更新。你的草稿还在，请取消后重新布置。');
}
