import {GEOMETRY,placeNode,defaultNode} from './room-layout.mjs';
const clone=value=>structuredClone(value);
export function createRoomEditor(stage,tools,nodes,catalog){
 let selected='pet',history=[],drag=null,disposed=false;
 stage.setAttribute('role','group');stage.classList.add('is-editable');
 tools.innerHTML=`<div class="editor-selection"><label>正在摆放<select aria-label="选择摆放物品"></select></label><button type="button" data-edit="undo">撤销</button></div><div class="editor-adjust"><label>大小<input type="range" aria-label="装饰大小" min="55" max="150" value="100"></label><label>角度<input type="range" aria-label="装饰角度" min="-35" max="35" value="0"></label></div><div class="editor-actions"><button type="button" data-edit="back">往后放</button><button type="button" data-edit="front">往前放</button><button type="button" data-edit="flip">翻转</button><button type="button" data-edit="remove">收起</button></div><p class="editor-hint">拖动摆放 · 方向键微调</p>`;
 const pick=tools.querySelector('select'),ranges=tools.querySelectorAll('input'),elements=new Map([...stage.querySelectorAll('[data-node]')].map(n=>[n.dataset.node,n]));
 const label=id=>id==='pet'?'我的伙伴':catalog.find(x=>x.id===id)?.name||id;
 function constrain(id){const n=nodes[id],el=elements.get(id),[, ,w,h]=GEOMETRY[el.dataset.slot],aspect=stage.clientHeight/stage.clientWidth,r=Math.abs(n.rotation)*Math.PI/180;const mx=Math.min(45,Math.max(5,(w*Math.cos(r)+h*aspect*Math.sin(r))*n.scale/2)),my=Math.min(45,Math.max(5,(h*Math.cos(r)+w/aspect*Math.sin(r))*n.scale/2));n.x=Math.max(mx,Math.min(100-mx,n.x));n.y=Math.max(my,Math.min(100-my,n.y));}
 function paint(){for(const [id,el]of elements){el.hidden=!nodes[id];if(nodes[id]){placeNode(el,nodes[id],el.dataset.slot);el.classList.toggle('is-selected',id===selected);el.setAttribute('aria-pressed',String(id===selected));}}}
 function controls(){pick.replaceChildren();for(const id of Object.keys(nodes)){const o=document.createElement('option');o.value=id;o.textContent=label(id);pick.append(o);}pick.value=selected;const n=nodes[selected];ranges[0].value=Math.round(n.scale*100);ranges[1].value=n.rotation;tools.querySelector('[data-edit=remove]').disabled=selected==='pet';tools.querySelector('[data-edit=undo]').disabled=!history.length;}
 function select(id){if(!nodes[id])return;selected=id;paint();controls();}
 function remember(before){history.push(before);if(history.length>40)history.shift();}
 function commit(fn){const before=clone(nodes);fn();remember(before);paint();controls();}
 function replace(next){for(const key of Object.keys(nodes))delete nodes[key];Object.assign(nodes,clone(next));if(!nodes[selected])selected='pet';paint();controls();}
 for(const [id,el]of elements){el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label','移动'+label(id));
  el.onpointerdown=e=>{if(disposed||e.button!==0)return;e.preventDefault();select(id);el.focus({preventScroll:true});const r=stage.getBoundingClientRect();drag={id,pointer:e.pointerId,x:e.clientX,y:e.clientY,start:clone(nodes),width:r.width,height:r.height};el.setPointerCapture(e.pointerId);el.classList.add('is-dragging');};
  el.onpointermove=e=>{if(!drag||drag.id!==id||drag.pointer!==e.pointerId)return;const old=drag.start[id];nodes[id].x=old.x+(e.clientX-drag.x)/drag.width*100;nodes[id].y=old.y+(e.clientY-drag.y)/drag.height*100;constrain(id);paint();};
  el.onpointerup=e=>{if(!drag||drag.pointer!==e.pointerId)return;remember(drag.start);drag=null;el.classList.remove('is-dragging');if(el.hasPointerCapture(e.pointerId))el.releasePointerCapture(e.pointerId);controls();};
  el.onpointercancel=()=>{if(drag){replace(drag.start);drag=null;}el.classList.remove('is-dragging');};
  el.onkeydown=e=>{const offsets={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(e.key==='Enter'||e.key===' '){e.preventDefault();select(id);}else if(offsets[e.key]){e.preventDefault();select(id);commit(()=>{const [x,y]=offsets[e.key],step=e.shiftKey?5:1;nodes[id].x+=x*step;nodes[id].y+=y*step;constrain(id);});}};
 }
 pick.onchange=()=>select(pick.value);
 for(const [i,input]of [...ranges].entries()){let before;input.oninput=()=>{before??=clone(nodes);nodes[selected][i?'rotation':'scale']=Number(input.value)/(i?1:100);constrain(selected);paint();};input.onchange=()=>{if(before)remember(before);before=null;controls();};}
 tools.querySelector('[data-edit=undo]').onclick=()=>{if(history.length)replace(history.pop());};
 tools.querySelector('[data-edit=back]').onclick=()=>commit(()=>{nodes[selected].z=Math.max(0,nodes[selected].z-1);});
 tools.querySelector('[data-edit=front]').onclick=()=>commit(()=>{nodes[selected].z=Math.min(60,Math.max(...Object.values(nodes).map(n=>n.z))+1);});
 tools.querySelector('[data-edit=flip]').onclick=()=>commit(()=>{nodes[selected].flip=!nodes[selected].flip;});
 tools.querySelector('[data-edit=remove]').onclick=()=>commit(()=>{if(selected!=='pet'){delete nodes[selected];selected='pet';}});
 paint();controls();
 return {reset(){commit(()=>{for(const [id,el]of elements)if(nodes[id])nodes[id]=defaultNode(el.dataset.slot);});},destroy(){disposed=true;for(const el of elements.values()){el.onpointerdown=el.onpointermove=el.onpointerup=el.onpointercancel=el.onkeydown=null;}stage.classList.remove('is-editable');tools.replaceChildren();}};
}
