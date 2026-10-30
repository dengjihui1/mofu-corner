// Shared geometry: positions are percentages, never viewport pixels.
export const ROOM_SLOTS = ['rug','seat','plant','light','art','shelf','table'];
export const WEAR_SLOTS = ['headwear','neckwear','carry'];
export const GEOMETRY = {
 pet:[57,65,23,44,20],rug:[50,81,57,23,1],seat:[42,66,30,37,10],
 plant:[16,78,18,30,14],light:[84,60,18,37,8],art:[26,33,16,24,3],
 shelf:[24,58,27,31,6],table:[77,81,24,28,25]
};
export function defaultNode(slot){const [x,y,,,z]=GEOMETRY[slot];return{x,y,scale:1,rotation:0,z,flip:false};}
export function defaultLayout(equipped,catalog){const nodes={pet:defaultNode('pet')};for(const id of Object.values(equipped)){const item=catalog.find(x=>x.id===id);if(item&&ROOM_SLOTS.includes(item.slot))nodes[id]=defaultNode(item.slot);}return nodes;}
export function placeNode(element,node,slot){const [, ,w,h]=GEOMETRY[slot];Object.assign(element.style,{left:node.x+'%',top:node.y+'%',right:'auto',bottom:'auto',width:w+'%',height:h+'%',zIndex:String(node.z),transformOrigin:'center',transform:`translate(-50%,-50%) rotate(${node.rotation}deg) scale(${node.flip?-node.scale:node.scale},${node.scale})`});}
