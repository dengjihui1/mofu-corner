import assert from 'node:assert/strict';
const origin=process.env.MOFU_TEST_ORIGIN;if(!origin?.startsWith('https://'))throw Error('Set MOFU_TEST_ORIGIN to the deployed site');
const password='Design-QA-'+crypto.randomUUID(),accounts=[];
async function call(path,session,body){const response=await fetch(origin+'/api'+path,{method:body?'POST':'GET',headers:{Origin:origin,'Content-Type':'application/json',...(session?{Cookie:session.cookie,'X-CSRF-Token':session.csrf}:{})},body:body?JSON.stringify(body):undefined});const data=await response.json();return {...data,status:response.status,cookie:response.headers.get('set-cookie')?.split(';')[0]};}
try{
 for(const [i,species]of ['rabbit','dog'].entries()){const r=await call('/auth/register',null,{handle:'qa_design_'+crypto.randomUUID().slice(0,8),name:'布置验收'+i,password,accepted:true,species});assert.equal(r.status,201);accounts.push(r);}
 const [a,b]=accounts;assert.equal((await call('/profile',a,{name:'改昵称',species:'dog',discoverable:true})).status,409);assert.equal((await call('/profile',a,{name:'改昵称',discoverable:true})).status,200);assert.equal((await call('/auth/me',a)).user.species,'rabbit');
 let room=await call('/home',a);assert.equal(room.status,200);assert.equal(room.catalog.length,37);
 room=await call('/home/buy',a,{itemId:'plant-sprout',price:0});assert.equal(room.balance,8);
 room=await call('/home/equip',a,{itemId:'wear-bow'});assert.equal(room.equipped.headwear,'wear-bow');
 const nodes=structuredClone(room.layout.nodes);nodes['plant-sprout']={x:78,y:80,scale:.85,rotation:6,z:30,flip:true};nodes.pet.x=44;
 const saved=await call('/home/layout',a,{nodes,revision:room.layout.revision});assert.equal(saved.status,200);assert.deepEqual((await call('/home',a)).layout.nodes,nodes);assert.equal(saved.balance,8);
 assert.equal((await call('/home/layout',a,{nodes,revision:room.layout.revision})).status,409);
 assert.equal((await call('/home/layout',a,{nodes:{...nodes,'light-moon':nodes['plant-sprout']},revision:saved.layout.revision})).status,403);
 assert.equal((await call('/home/layout',a,{nodes:{...nodes,pet:{...nodes.pet,x:999}},revision:saved.layout.revision})).status,400);
 assert.equal((await call('/home/visit/'+a.user.id,b)).status,403);
 await call('/requests',a,{userId:b.user.id});const req=(await call('/requests',b)).incoming.find(x=>x.user_id===a.user.id);assert.ok(req);await call('/requests/'+req.id+'/accept',b,{});
 const visit=await call('/home/visit/'+a.user.id,b);assert.deepEqual(visit.layout.nodes,nodes);assert.equal(visit.equipped.headwear,'wear-bow');assert.equal(visit.balance,undefined);
 const friend=(await call('/friends',b)).friends.find(x=>x.id===a.user.id);assert.equal(friend.outfit.headwear,'wear-bow');
 const purchased=await call('/home/buy',b,{itemId:'wear-daisy',price:0});assert.equal(purchased.balance,4);assert.equal(purchased.equipped.headwear,'wear-daisy');assert.equal((await call('/home/buy',b,{itemId:'wear-daisy'})).balance,4);
 await call('/home/put-away',a,{itemId:'wear-bow'});assert.equal((await call('/home',a)).equipped.headwear,undefined);assert.deepEqual((await call('/home',a)).layout.nodes,nodes);
 console.log('PASS LIVE DESIGN: fixed zodiac, nickname edits, free/paid wardrobe, authoritative pricing, persisted placement, stale-save rejection, ownership validation, friend visits and dressed social portraits.');
}finally{for(const account of accounts){const r=await call('/account/delete',account,{password});assert.equal(r.status,200);}console.log('Synthetic QA accounts removed.');}
