import test from 'node:test';
import assert from 'node:assert/strict';
import {ACCESSORIES,accessoryBody,accessorySvg,normalizeOutfit,accessoryPlacements,compositionRects} from '../ui/pet-accessories.mjs';
import {REFERENCE_ART} from '../ui/rig-reference.mjs';
import {WEARABLES} from '../cloud/postoffice/public/wear-catalog.mjs';

test('shared artwork covers the published catalog with the same slots and colors',()=>{
 assert.deepEqual(ACCESSORIES,WEARABLES.map(({id,slot,color})=>({id,slot,color})));
 for(const item of WEARABLES){
  assert.ok(accessoryBody(item).length>40,item.id);
  assert.match(accessorySvg(item.id),/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
 }
});

test('untrusted and wrongly slotted outfit values cannot enter the renderer',()=>{
 assert.deepEqual(normalizeOutfit({headwear:'wear-bow',neckwear:'wear-satchel',carry:'javascript:alert(1)',extra:'wear-daisy'}),{headwear:'wear-bow'});
 assert.deepEqual(normalizeOutfit(null),{});
 assert.equal(accessorySvg('<script>'),'');
 assert.deepEqual(accessoryPlacements('unknown',{headwear:'wear-bow'}),[]);
 assert.deepEqual(accessoryPlacements('__proto__',{headwear:'wear-bow'}),[]);
});

test('all zodiac ornaments keep square proportions and leave the whole eye outline clear',()=>{
 for(const [species,ref] of Object.entries(REFERENCE_ART)){
  for(const item of ACCESSORIES){
   const [p]=accessoryPlacements(species,{[item.slot]:item.id});
   assert.ok(p,`${species}: ${item.id}`);
   for(const key of ['x','y','width','height','rotation'])assert.ok(Number.isFinite(p[key]));
   assert.ok(p.x>=0&&p.y>=0&&p.x+p.width<=1&&p.y+p.height<=1,`${species}: ${item.id} stays in the crop`);
   assert.ok(Math.abs(p.width*ref.rect[2]-p.height*ref.rect[3])<1e-9,'preserve square SVG proportions');
   const a=-p.rotation*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
   for(const eye of ref.eyes)for(let n=0;n<24;n++){
    const angle=n/24*Math.PI*2;
    const ex=eye.cx+Math.cos(angle)*eye.rx*1.05,ey=eye.cy+Math.sin(angle)*eye.ry*1.05;
    const dx=(ex-p.x-p.width/2)*ref.rect[2],dy=(ey-p.y-p.height/2)*ref.rect[3];
    const x=dx*c-dy*s,y=dx*s+dy*c;
    assert.ok(Math.abs(x)>p.width*ref.rect[2]/2||Math.abs(y)>p.height*ref.rect[3]/2,`${species}: ${item.id} touches an eye`);
   }
   const [px]=compositionRects(species,{[item.slot]:item.id});
   assert.equal(px.x,p.x*ref.rect[2]);assert.equal(px.y,p.y*ref.rect[3]);
   assert.ok(Math.abs(px.width-px.height)<1e-9);
  }
 }
});
