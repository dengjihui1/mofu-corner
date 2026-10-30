import {REFERENCE_ART} from './rig-reference.mjs';

// Pure shared artwork: no DOM or asset URLs. Both renderers consume these placements.
export const ACCESSORY_SLOTS=Object.freeze(['headwear','neckwear','carry']);
export const ACCESSORIES=Object.freeze([
 {id:'wear-bow',slot:'headwear',color:'#dec192'},
 {id:'wear-daisy',slot:'headwear',color:'#f2df9b'},
 {id:'wear-beret',slot:'headwear',color:'#c8929d'},
 {id:'wear-bandana',slot:'neckwear',color:'#a8b8a1'},
 {id:'wear-bowtie',slot:'neckwear',color:'#c5a2ad'},
 {id:'wear-satchel',slot:'carry',color:'#cba77e'},
].map(Object.freeze));
const byId=new Map(ACCESSORIES.map(item=>[item.id,item]));

export function normalizeOutfit(input){
 const outfit={};
 for(const slot of ACCESSORY_SLOTS){
  const id=input&&typeof input==='object'?input[slot]:null;
  if(typeof id==='string'&&byId.get(id)?.slot===slot)outfit[slot]=id;
 }
 return outfit;
}
export function accessoryBody(value){
 const item=byId.get(typeof value==='string'?value:value?.id);
 if(!item)return '';
 const c=item.color;let body='';
 if(item.id==='wear-bow'||item.id==='wear-bowtie')body=`<path d="M46 46Q8 12 12 51Q7 85 46 57M54 46Q92 12 88 51Q93 85 54 57" fill="${c}" stroke="#a78373" stroke-width="2"/><path d="M38 59L32 86L47 79L54 88L63 60" fill="${c}"/><rect x="42" y="41" width="16" height="22" rx="7" fill="#f4dfc6"/><path d="M19 42L39 50M63 50L82 43" stroke="#fff1df" stroke-width="2"/>`;
 if(item.id==='wear-daisy')body=`<g fill="#fff9e8" stroke="#dfc8a4" stroke-width="1.5"><ellipse cx="50" cy="50" rx="12" ry="39"/><ellipse cx="50" cy="50" rx="39" ry="12"/><ellipse cx="50" cy="50" rx="12" ry="39" transform="rotate(45 50 50)"/><ellipse cx="50" cy="50" rx="12" ry="39" transform="rotate(-45 50 50)"/></g><circle cx="50" cy="50" r="15" fill="${c}"/><circle cx="45" cy="46" r="3" fill="#fff4ca"/>`;
 if(item.id==='wear-beret')body=`<path d="M57 23Q62 9 52 9" stroke="#a9707f" stroke-width="6" stroke-linecap="round" fill="none"/><path d="M9 62Q-2 35 29 26Q78 7 91 43Q104 62 75 71L27 78Z" fill="${c}"/><path d="M22 69Q49 62 79 63L80 74Q49 74 26 83Z" fill="#ac7584"/><path d="M19 46Q29 33 48 32" fill="none" stroke="#e9bdc4" stroke-width="3" stroke-linecap="round"/>`;
 if(item.id==='wear-bandana')body=`<path d="M12 28Q48 45 87 27L53 88Z" fill="${c}" stroke="#7f927d" stroke-width="2"/><path d="M18 37L64 70M36 37L74 55M22 54L68 33M38 73L84 40" stroke="#e7edda" stroke-width="3"/><path d="M41 56Q40 46 48 49L52 53Q62 43 65 53Q66 60 52 70Z" fill="#f5e5d3"/>`;
 if(item.id==='wear-satchel')body=`<path d="M20 29Q32 33 46 43L76 72" fill="none" stroke="#75563f" stroke-opacity=".16" stroke-width="6" stroke-linecap="round" transform="translate(1 2)"/><path d="M20 29Q32 33 46 43L76 72" fill="none" stroke="#b28a63" stroke-width="4.5" stroke-linecap="round"/><path d="M20 28Q33 32 47 42L77 71" fill="none" stroke="#e4c6a1" stroke-width="1.2" stroke-linecap="round"/><rect x="46" y="55" width="46" height="34" rx="8" fill="#74513e" opacity=".14"/><rect x="45" y="53" width="46" height="34" rx="8" fill="${c}" stroke="#ab8666" stroke-width="1.5"/><path d="M46 55L68 70L90 55" fill="#edd6b8" stroke="#b89574" stroke-width="1.5"/><path d="M49 77V80Q49 83 52 83H84" fill="none" stroke="#e0bc94" stroke-width="1.2"/><circle cx="68" cy="70" r="3.5" fill="#c69498"/>`;
 return body;
}
export function accessorySvg(id){
 const body=accessoryBody(id);
 return body?`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">${body}</svg>`:'';
}

// cx, cy, width, angle, measured on the intact crop including the existing tilt.
// Hats above eyes, scarves below chin, bags on the side of the torso.
const anchors={
 rabbit:{headwear:[.59,.325,.22,12],beret:[.40,.315,.35,7],neckwear:[.43,.73,.28,7],carry:[.70,.82,.25,7]},
 rat:{headwear:[.64,.245,.21,12],beret:[.45,.205,.36,7],neckwear:[.48,.70,.24,8],carry:[.65,.80,.24,5]},
 ox:{headwear:[.53,.225,.21,10],beret:[.40,.18,.32,8],neckwear:[.41,.68,.24,5],carry:[.68,.76,.24,5]},
 tiger:{headwear:[.62,.20,.21,15],beret:[.43,.16,.30,12],neckwear:[.46,.70,.24,10],carry:[.65,.80,.23,7]},
 dragon:{headwear:[.58,.285,.21,8],beret:[.40,.23,.35,8],neckwear:[.41,.73,.23,7],carry:[.62,.78,.23,4]},
 snake:{headwear:[.59,.12,.19,10],beret:[.43,.12,.24,10],neckwear:[.34,.56,.24,12],carry:[.63,.77,.26,4]},
 horse:{headwear:[.48,.245,.19,12],beret:[.32,.17,.29,10],neckwear:[.34,.68,.23,7],carry:[.61,.73,.23,5]},
 sheep:{headwear:[.56,.235,.20,10],beret:[.40,.175,.30,8],neckwear:[.40,.71,.25,7],carry:[.65,.77,.23,4]},
 monkey:{headwear:[.66,.225,.20,16],beret:[.48,.145,.28,12],neckwear:[.50,.70,.24,12],carry:[.71,.78,.23,5]},
 rooster:{headwear:[.57,.235,.17,2],beret:[.43,.21,.28,3],neckwear:[.36,.67,.24,2],carry:[.58,.76,.23,2]},
 dog:{headwear:[.28,.18,.20,-15],beret:[.39,.14,.25,-10],neckwear:[.44,.64,.24,-10],carry:[.65,.76,.23,-5]},
 pig:{headwear:[.58,.225,.21,12],beret:[.39,.18,.30,9],neckwear:[.42,.73,.25,8],carry:[.70,.77,.24,6]},
};

/** Normalized crop left/top rectangles; rotate around their center. */
export function accessoryPlacements(species,input){
 const reference=REFERENCE_ART[species],points=Object.hasOwn(anchors,species)?anchors[species]:null;
 if(!reference||!points)return [];
 const outfit=normalizeOutfit(input);
 return ACCESSORY_SLOTS.flatMap(slot=>{
  const id=outfit[slot];if(!id)return [];
  let [cx,cy,baseWidth,rotation]=points[id==='wear-beret'?'beret':slot];
  const width=baseWidth*(id==='wear-daisy'?.87:id==='wear-bowtie'?.80:id==='wear-satchel'?1.45:1);
  const ratio=reference.rect[2]/reference.rect[3],height=width*ratio;
  if(id==='wear-satchel'){
   // Extra canvas reaches the shoulder, while the pouch keeps its measured anchor.
   cx+=.005*baseWidth-.18*width;cy+=.16*baseWidth*ratio-.20*height;
  }
  return [{id,slot,x:cx-width/2,y:cy-height/2,width,height,rotation}];
 });
}
/** Pixel rectangles for a canvas compositor; defaults to the reference crop size. */
export function compositionRects(species,input,width,height){
 const rect=REFERENCE_ART[species]?.rect;if(!rect)return [];
 width=width??rect[2];height=height??rect[3];
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return [];
 return accessoryPlacements(species,input).map(p=>({...p,x:p.x*width,y:p.y*height,width:p.width*width,height:p.height*height}));
}
