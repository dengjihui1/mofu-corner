import {GEOMETRY,placeNode,defaultNode,alignNode} from './room-layout.mjs';
const clone=value=>structuredClone(value);
export function createRoomEditor(stage,tools,nodes,catalog,{onChange=()=>{}}={}){
 let selected='pet',history=[],future=[],drag=null,adjustment=null,disposed=false,snap=true,lastValue=JSON.stringify(nodes);
 const view=stage.ownerDocument.defaultView;
 stage.setAttribute('role','group');stage.classList.add('is-editable');tools.classList.add('room-editor-tools');
 tools.innerHTML='<div class="editor-selection"><label>正在摆放<select aria-label="选择摆放物品"></select></label><div class="editor-history"><button type="button" data-edit="undo" title="撤销 · Ctrl / ⌘ Z" aria-keyshortcuts="Control+z Meta+z">撤销</button><button type="button" data-edit="redo" title="重做 · Ctrl / ⌘ Shift Z" aria-keyshortcuts="Control+Shift+z Meta+Shift+z Control+y">重做</button></div></div><div class="editor-adjust"><label>大小<input type="range" aria-label="装饰大小" min="55" max="150" value="100"></label><label>角度<input type="range" aria-label="装饰角度" min="-35" max="35" value="0"></label></div><div class="editor-actions"><button type="button" data-edit="back">往后放</button><button type="button" data-edit="front">往前放</button><button type="button" data-edit="flip">翻转</button><button type="button" data-edit="remove" title="收起 · Delete">收起</button></div><div class="editor-assist"><button type="button" data-edit="snap" aria-pressed="true" title="靠近时对齐；按住 Alt 自由移动">对齐</button><span class="editor-hint">方向键微调</span></div>';
 const pick=tools.querySelector('select'),ranges=tools.querySelectorAll('input'),elements=new Map([...stage.querySelectorAll('[data-node]')].map(n=>[n.dataset.node,n]));
 const label=id=>id==='pet'?'我的伙伴':catalog.find(x=>x.id===id)?.name||id;
 const capture=()=>({nodes:clone(nodes),selected});
 const guides=['x','y'].map(axis=>{const el=document.createElement('i');el.className='room-alignment-guide axis-'+axis;el.setAttribute('aria-hidden','true');el.hidden=true;stage.append(el);return el;});
 function showGuides(value={}){guides.forEach((el,i)=>{const n=value[i?'y':'x'];el.hidden=n==null;if(n!=null)el.style[i?'top':'left']=n+'%';});}
 function notify(){const value=JSON.stringify(nodes);if(value!==lastValue){lastValue=value;onChange(nodes);}}
 function constrain(id){const n=nodes[id],el=elements.get(id),[,,w,h]=GEOMETRY[el.dataset.slot],aspect=stage.clientHeight/stage.clientWidth||.625,r=Math.abs(n.rotation)*Math.PI/180;const mx=Math.min(45,Math.max(5,(w*Math.cos(r)+h*aspect*Math.sin(r))*n.scale/2)),my=Math.min(45,Math.max(5,(h*Math.cos(r)+w/aspect*Math.sin(r))*n.scale/2));n.x=Math.max(mx,Math.min(100-mx,n.x));n.y=Math.max(my,Math.min(100-my,n.y));}
 function paint(){for(const [id,el]of elements){el.hidden=!nodes[id];el.classList.toggle('is-selected',Boolean(nodes[id])&&id===selected);el.setAttribute('aria-pressed',String(Boolean(nodes[id])&&id===selected));if(nodes[id])placeNode(el,nodes[id],el.dataset.slot);}notify();}
 function controls(){pick.replaceChildren();for(const id of Object.keys(nodes)){const o=document.createElement('option');o.value=id;o.textContent=label(id);pick.append(o);}pick.value=selected;const n=nodes[selected];ranges[0].value=Math.round(n.scale*100);ranges[1].value=n.rotation;tools.querySelector('[data-edit=remove]').disabled=selected==='pet';tools.querySelector('[data-edit=undo]').disabled=!history.length;tools.querySelector('[data-edit=redo]').disabled=!future.length;}
 function remember(before){if(JSON.stringify(before.nodes)===JSON.stringify(nodes))return;history.push(before);if(history.length>40)history.shift();future=[];}
 function finishAdjustment(){if(adjustment){remember(adjustment);adjustment=null;}}
 function select(id){if(drag||!nodes[id])return;finishAdjustment();selected=id;paint();controls();}
 function replace(next){for(const key of Object.keys(nodes))delete nodes[key];Object.assign(nodes,clone(next.nodes));selected=nodes[next.selected]?next.selected:'pet';paint();controls();}
 function commit(fn){if(drag)return;finishAdjustment();const before=capture();fn();remember(before);paint();controls();}
 function finishDrag(cancel=false){if(!drag)return;const previous=drag;drag=null;const el=elements.get(previous.id);el.classList.remove('is-dragging');if(el.hasPointerCapture(previous.pointer))el.releasePointerCapture(previous.pointer);showGuides();if(cancel)replace(previous.start);else{remember(previous.start);controls();}}
 function undo(){if(drag){finishDrag(true);return;}finishAdjustment();if(history.length){future.push(capture());replace(history.pop());}}
 function redo(){if(drag)return;finishAdjustment();if(future.length){history.push(capture());replace(future.pop());}}
 function remove(){if(selected!=='pet')commit(()=>{delete nodes[selected];selected='pet';});}
 for(const [id,el]of elements){el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label','移动'+label(id));
  el.onpointerdown=e=>{if(disposed||drag||e.button!==0||e.isPrimary===false||!nodes[id])return;e.preventDefault();select(id);el.focus({preventScroll:true});const r=stage.getBoundingClientRect(),width=stage.clientWidth*r.width/stage.offsetWidth,height=stage.clientHeight*r.height/stage.offsetHeight;if(!width||!height)return;drag={id,pointer:e.pointerId,x:e.clientX,y:e.clientY,start:capture(),width,height};try{el.setPointerCapture(e.pointerId);}catch{drag=null;return;}el.classList.add('is-dragging');};
  el.onpointermove=e=>{if(!drag||drag.id!==id||drag.pointer!==e.pointerId)return;const old=drag.start.nodes[id];nodes[id].x=old.x+(e.clientX-drag.x)/drag.width*100;nodes[id].y=old.y+(e.clientY-drag.y)/drag.height*100;constrain(id);let lines={};if(snap&&!e.altKey){const aligned=alignNode(nodes[id],Object.entries(nodes).filter(([key])=>key!==id).map(([,n])=>n),{x:500/drag.width,y:500/drag.height});nodes[id].x=aligned.x;nodes[id].y=aligned.y;constrain(id);lines={x:nodes[id].x===aligned.x?aligned.guides.x:null,y:nodes[id].y===aligned.y?aligned.guides.y:null};}showGuides(lines);paint();};
  el.onpointerup=e=>{if(drag?.id===id&&drag.pointer===e.pointerId)finishDrag();};
  el.onpointercancel=e=>{if(drag?.id===id&&drag.pointer===e.pointerId)finishDrag(true);};
  el.onlostpointercapture=e=>{if(drag?.id===id&&drag.pointer===e.pointerId)finishDrag(true);};
  el.onkeydown=e=>{if(e.ctrlKey||e.metaKey)return;const offsets={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(e.key==='Enter'||e.key===' '){e.preventDefault();select(id);}else if(offsets[e.key]){e.preventDefault();select(id);commit(()=>{const [x,y]=offsets[e.key],step=e.shiftKey?5:e.altKey?.25:1;nodes[id].x+=x*step;nodes[id].y+=y*step;constrain(id);});}};
 }
 function shortcuts(e){if(disposed||e.target.closest('textarea,select,input:not([type=range]),[contenteditable=true]'))return;const key=e.key.toLowerCase();if((e.ctrlKey||e.metaKey)&&(key==='z'||key==='y')){e.preventDefault();e.stopPropagation();if(key==='y'||e.shiftKey)redo();else undo();}else if(e.key==='Escape'&&drag){e.preventDefault();e.stopPropagation();finishDrag(true);}else if((e.key==='Delete'||e.key==='Backspace')&&stage.contains(e.target)){e.preventDefault();remove();}}
 stage.addEventListener('keydown',shortcuts);tools.addEventListener('keydown',shortcuts);
 const cancelOnBlur=()=>finishDrag(true);view.addEventListener('blur',cancelOnBlur);
 pick.onchange=()=>select(pick.value);
 for(const [i,input]of [...ranges].entries()){input.oninput=()=>{if(drag)return;adjustment??=capture();nodes[selected][i?'rotation':'scale']=Number(input.value)/(i?1:100);constrain(selected);paint();};input.onchange=input.onblur=()=>{finishAdjustment();controls();};}
 tools.querySelector('[data-edit=undo]').onclick=undo;tools.querySelector('[data-edit=redo]').onclick=redo;
 tools.querySelector('[data-edit=back]').onclick=()=>commit(()=>{nodes[selected].z=Math.max(0,nodes[selected].z-1);});
 tools.querySelector('[data-edit=front]').onclick=()=>commit(()=>{nodes[selected].z=Math.min(60,Math.max(...Object.values(nodes).map(n=>n.z))+1);});
 tools.querySelector('[data-edit=flip]').onclick=()=>commit(()=>{nodes[selected].flip=!nodes[selected].flip;});
 tools.querySelector('[data-edit=remove]').onclick=remove;
 tools.querySelector('[data-edit=snap]').onclick=e=>{snap=!snap;e.currentTarget.setAttribute('aria-pressed',String(snap));if(!snap)showGuides();};
 paint();controls();
 return {reset(){finishDrag();commit(()=>{for(const [id,el]of elements)if(nodes[id])nodes[id]=defaultNode(el.dataset.slot);});},destroy(){finishDrag();finishAdjustment();disposed=true;view.removeEventListener('blur',cancelOnBlur);stage.removeEventListener('keydown',shortcuts);tools.removeEventListener('keydown',shortcuts);for(const el of elements.values()){el.onpointerdown=el.onpointermove=el.onpointerup=el.onpointercancel=el.onlostpointercapture=el.onkeydown=null;el.classList.remove('is-selected','is-dragging');}guides.forEach(el=>el.remove());stage.classList.remove('is-editable');tools.classList.remove('room-editor-tools');tools.replaceChildren();}};
}
