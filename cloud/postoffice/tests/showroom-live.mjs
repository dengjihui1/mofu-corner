import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
const origin=process.env.MOFU_TEST_ORIGIN;if(!origin?.startsWith('https://'))throw Error('Set MOFU_TEST_ORIGIN');
let session;
async function call(path,body){const r=await fetch(origin+'/api'+path,{method:body?'POST':'GET',headers:{Origin:origin,'Content-Type':'application/json',...(session?{Cookie:session.cookie,'X-CSRF-Token':session.csrf}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(60000)});return {...await r.json(),status:r.status,cookie:r.headers.get('set-cookie')?.split(';')[0]};}
const password=randomBytes(20).toString('hex');
try{
 assert.equal((await fetch(origin+'/showroom.html')).status,200);
 const collection=await(await fetch(origin+'/home-collection.json')).json();assert.equal(collection.catalog.length,31);
 const registered=await call('/auth/register',{handle:'cozyqa_'+randomBytes(5).toString('hex'),password,name:'搭配验收',species:'rabbit',accepted:true});assert.equal(registered.status,201,registered.error);session=registered;
 const home=await call('/home');assert.deepEqual(home.catalog,collection.catalog);
 const bought=await call('/home/buy',{itemId:'art-bunting',price:0});assert.equal(bought.balance,2);assert.equal(bought.equipped.art,'art-bunting');
 assert.equal((await call('/home/buy',{itemId:'art-bunting'})).balance,2);
 assert.equal((await call('/home/equip',{itemId:'shelf-books'})).status,403);
 assert.equal((await call('/home/put-away',{slot:'shelf'})).status,200);
 assert.equal((await call('/home/put-away',{slot:'table'})).status,200);
 const stored=await call('/home/put-away',{slot:'art'});assert.equal(stored.equipped.art,undefined);assert.ok(stored.owned.includes('art-bunting'));
 assert.equal((await call('/home/equip',{itemId:'art-bunting'})).equipped.art,'art-bunting');
 console.log('PASS LIVE: public showroom, matching catalog, new decoration purchase, idempotency, ownership and new slots.');
}finally{if(session){assert.equal((await call('/account/delete',{password})).status,200);console.log('Synthetic showroom account removed.');}}
