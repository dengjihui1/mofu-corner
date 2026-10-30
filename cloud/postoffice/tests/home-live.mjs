import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {mkdir,writeFile,readFile,unlink} from 'node:fs/promises';
const origin=process.env.MOFU_TEST_ORIGIN;
if(!origin||!/^https:\/\//.test(origin))throw Error('Set MOFU_TEST_ORIGIN to the deployment being tested.');
const fixture=new URL('../.local/home-live.json',import.meta.url),accounts=[];
async function call(path,a,body){const response=await fetch(origin+'/api'+path,{method:body?'POST':'GET',headers:{Origin:origin,'Content-Type':'application/json',...(a?{Cookie:a.cookie,'X-CSRF-Token':a.csrf}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(60000)});const result=await response.json();return {...result,status:response.status,cookie:response.headers.get('set-cookie')?.split(';')[0]};}
async function cleanup(list){for(const a of list){const logged=await call('/auth/login',null,{handle:a.handle,password:a.password});assert.equal(logged.status,200);assert.equal((await call('/account/delete',logged,{password:a.password})).status,200);}console.log('Synthetic home accounts removed.');}
if(process.argv.includes('--cleanup')){const saved=JSON.parse(await readFile(fixture,'utf8'));assert.equal(saved.origin,origin);await cleanup(saved.accounts);await unlink(fixture);process.exit(0);}
let keep=false;
try{
 for(const [name,species]of [['小米','rat'],['耳朵','rabbit']]){const handle='homeqa_'+randomBytes(5).toString('hex'),password=randomBytes(20).toString('hex'),a=await call('/auth/register',null,{handle,password,name,species,accepted:true});assert.equal(a.status,201,a.error);accounts.push({...a,handle,password});}
 const [a,b]=accounts;
 assert.equal((await call('/home',a)).balance,20);assert.equal((await call('/home',b)).balance,20);
 assert.equal((await call('/home/visit/'+a.user.id,b)).status,403);
 assert.equal((await call('/home/buy',a,{itemId:'plant-sprout',price:0})).balance,8);
 assert.equal((await call('/home/buy',a,{itemId:'plant-sprout'})).balance,8);
 assert.equal((await call('/home/equip',a,{itemId:'light-moon'})).status,403);
 assert.equal((await call('/home/buy',a,{itemId:'light-moon'})).status,409);
 assert.equal((await call('/home/heartbeat',a,{elapsed:999999999,beans:999})).today.presence,0);
 await call('/requests',a,{userId:b.user.id});const incoming=(await call('/requests',b)).incoming[0];assert.equal((await call('/requests/'+incoming.id+'/accept',b,{})).status,200);
 for(const [sender,recipient]of[[a,b],[b,a]])assert.equal((await call('/conversations/'+recipient.user.id+'/messages',sender,{kind:'text',text:'来我家坐坐呀。',clientId:randomUUID()})).status,200);
 assert.equal((await call('/home',a)).today.social,3);
 for(const [sender,recipient]of[[a,b],[b,a]])assert.equal((await call('/conversations/'+recipient.user.id+'/messages',sender,{kind:'heart',text:'',clientId:randomUUID()})).status,200);
 assert.equal((await call('/home',a)).today.social,4);assert.equal((await call('/home',b)).balance,24);
 const chat=await call('/home/buy',b,{itemId:'chat-garden'});assert.equal(chat.balance,0);assert.equal(chat.equipped.chat,'chat-garden');
 const room=await call('/home/visit/'+a.user.id,b);assert.equal(room.equipped.plant,'plant-sprout');assert.equal(room.balance,undefined);assert.equal(room.ledger,undefined);
 const exported=await call('/account/export',a);assert.equal(exported.home.inventory[0].item_id,'plant-sprout');
 console.log('PASS LIVE HOME: welcome, purchase, server price, duplicate retry, insufficient balance, ownership, ignored client clock, reciprocal rewards, chat theme, friend-only visit and export.');
 if(process.argv.includes('--inspect')){await mkdir(new URL('../.local/',import.meta.url),{recursive:true});await writeFile(fixture,JSON.stringify({origin,accounts:accounts.map(({handle,password,user})=>({handle,password,user}))}),{mode:0o600});keep=true;console.log('Temporary browser fixtures retained; run with --cleanup after UI checks.');}
}finally{if(!keep&&accounts.length)await cleanup(accounts);}
