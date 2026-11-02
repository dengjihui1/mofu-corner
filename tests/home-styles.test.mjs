import test from 'node:test';
import assert from 'node:assert/strict';
import {HOME_STYLES,styleLayout} from '../cloud/postoffice/public/home-styles.mjs';
import {defaultLayout} from '../cloud/postoffice/public/room-layout.mjs';
import {CATALOG} from '../cloud/postoffice/lib/home-catalog.mjs';

test('all five inspiration identities resolve to owned catalog slots and distinct valid layouts',()=>{
 assert.deepEqual(HOME_STYLES.map(x=>x.id),['listening','breakfast','berry','forest','moon']);
 const [listening,...prior]=HOME_STYLES;
 assert.equal(listening.species,'rabbit');assert.equal(listening.equipped.plant,undefined);
 assert.equal(Object.values(listening.equipped).reduce((sum,id)=>sum+CATALOG.find(x=>x.id===id).price,0),368);
 for(const room of HOME_STYLES)for(const [slot,id]of Object.entries(room.equipped))assert.equal(CATALOG.find(x=>x.id===id)?.slot,slot);
 for(const room of prior){
  const layout=styleLayout(room,CATALOG);
  assert.notDeepEqual(layout,defaultLayout(room.equipped,CATALOG),'each scene has its own composition');
  for(const [id,node]of Object.entries(layout)){
   assert.ok(id==='pet'||Object.values(room.equipped).includes(id));
   assert.ok(node.x>=0&&node.x<=100&&node.y>=0&&node.y<=100);
   assert.ok(node.scale>=.5&&node.scale<=1.8);
  }
 }
 assert.equal(new Set(prior.map(room=>room.equipped.shelf)).size,4);
 assert.equal(new Set(prior.map(room=>room.equipped.table)).size,4);
 const nodes=styleLayout(listening,CATALOG);
 assert.ok(nodes['shelf-records'].x<nodes.pet.x&&nodes['table-magazines'].y>nodes['seat-lounge'].y);
 assert.ok(nodes['art-blue-note'].x>50,'art leaves the left window clear');
 assert.equal(Object.keys(nodes).length,7,'six room objects plus the pet; clothing is not room furniture');
});

test('style layouts are fresh copies and do not add unavailable or unrelated objects',()=>{
 const room=HOME_STYLES[0],before=JSON.stringify(room);
 const nodes=styleLayout(room,CATALOG);nodes.pet.x=9;delete nodes['shelf-records'];
 assert.equal(JSON.stringify(room),before);assert.notEqual(styleLayout(room,CATALOG).pet.x,9);
 const partial=CATALOG.filter(x=>x.id!=='shelf-records');
 const layout=styleLayout({...room,layout:{...room.layout,'plant-sprout':{x:9,y:9}}},partial);
 assert.equal(layout['shelf-records'],undefined);assert.equal(layout['plant-sprout'],undefined);
 assert.ok(layout.pet);assert.equal(layout['seat-lounge'].rotation,0);
});
