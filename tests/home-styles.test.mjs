import test from 'node:test';
import assert from 'node:assert/strict';
import {HOME_STYLES,styleLayout} from '../cloud/postoffice/public/home-styles.mjs';
import {defaultLayout} from '../cloud/postoffice/public/room-layout.mjs';
import {CATALOG} from '../cloud/postoffice/lib/home-catalog.mjs';

test('listening is the default; existing four hash identities and layouts remain compatible',()=>{
 assert.deepEqual(HOME_STYLES.map(x=>x.id),['listening','breakfast','berry','forest','moon']);
 const [listening,...prior]=HOME_STYLES;
 assert.equal(listening.species,'rabbit');assert.equal(listening.equipped.plant,undefined);
 assert.equal(Object.values(listening.equipped).reduce((sum,id)=>sum+CATALOG.find(x=>x.id===id).price,0),368);
 for(const room of HOME_STYLES)for(const [slot,id]of Object.entries(room.equipped))assert.equal(CATALOG.find(x=>x.id===id)?.slot,slot);
 for(const room of prior)assert.deepEqual(styleLayout(room,CATALOG),defaultLayout(room.equipped,CATALOG));
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
