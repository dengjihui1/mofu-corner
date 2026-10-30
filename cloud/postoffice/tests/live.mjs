import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
const origin=process.env.MOFU_TEST_ORIGIN;
if(!origin||!/^https:\/\//.test(origin))throw Error('Set MOFU_TEST_ORIGIN to the deployment being tested.');
const accounts=[];
async function call(path,{session,body,from=origin}={}){
 const response=await fetch(origin+'/api'+path,{method:body?'POST':'GET',headers:{Origin:from,'Content-Type':'application/json',...(session?{Cookie:session.cookie,'X-CSRF-Token':session.csrf}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(60000)});
 const text=await response.text();let data;try{data=JSON.parse(text);}catch{throw Error(`Non-JSON API response: ${response.status} ${path}`);}
 return {status:response.status,...data,cookie:response.headers.get('set-cookie')?.split(';')[0]};
}
try{
 assert.equal((await call('/health')).ok,true);
 for(const [name,species] of [['验收小兔','rabbit'],['验收云朵','dragon']]){
  const handle='qa_'+randomBytes(6).toString('hex'),password=randomBytes(20).toString('hex');
  const user=await call('/auth/register',{body:{handle,password,name,species,accepted:true}});
  assert.equal(user.status,201,JSON.stringify({status:user.status,error:user.error}));accounts.push({...user,handle,password});
 }
 let [a,b]=accounts;
 assert.equal((await call('/auth/me')).status,401);
 assert.equal((await call('/requests',{session:a,body:{userId:b.user.id},from:'https://invalid.example'})).status,403);
 assert.equal((await call('/requests',{session:a,body:{userId:b.user.id}})).status,200);
 const request=(await call('/requests',{session:b})).incoming[0];
 assert.equal((await call('/requests/'+request.id+'/accept',{session:b,body:{}})).status,200);
 assert.equal((await call('/sync',{session:a})).friends.length,1);
 const clientId=randomUUID();
 const sent=await call('/conversations/'+b.user.id+'/messages',{session:a,body:{kind:'text',text:'你好，云朵，公网聊天验收。',clientId}});
 assert.equal(sent.status,200);assert.equal((await call('/conversations/'+a.user.id+'/messages',{session:b})).messages[0].body,sent.message.body);
 assert.equal((await call('/conversations/'+b.user.id+'/messages',{session:a,body:{kind:'text',text:'你好，云朵，公网聊天验收。',clientId}})).message.id,sent.message.id);
 const proposed=await call('/relationships/'+b.user.id+'/propose',{session:a,body:{kind:'father_son',myRole:'son'}});
 assert.equal(proposed.status,200);assert.equal((await call('/relationship-requests/'+proposed.request.id+'/accept',{session:b,body:{}})).status,200);
 assert.equal((await call('/friends',{session:b})).friends[0].relationship.myRole,'father');
 const nextPassword=randomBytes(20).toString('hex');
 const recovered=await call('/auth/recover',{body:{handle:a.handle,password:nextPassword,recoveryCode:a.recoveryCode}});assert.equal(recovered.status,200);a.password=nextPassword;
 assert.equal((await call('/auth/me',{session:a})).status,401);
 const relogin=await call('/auth/login',{body:{handle:a.handle,password:a.password}});assert.equal(relogin.status,200);Object.assign(a,relogin);
 assert.equal((await call('/account/export',{session:a})).messages.length,1);
 assert.equal((await call('/auth/logout',{session:a,body:{}})).status,200);assert.equal((await call('/auth/me',{session:a})).status,401);
 Object.assign(a,await call('/auth/login',{body:{handle:a.handle,password:a.password}}));
 assert.equal((await call('/account/delete',{session:a,body:{password:a.password}})).status,200);a.deleted=true;
 assert.equal((await call('/account/export',{session:b})).messages.length,0,'Remote database must enforce deletion cascades');
 console.log('PASS LIVE: register, CSRF, friends, sync, chat, deduplication, relationship roles, recovery, session revocation, logout, export and deletion cascades.');
}finally{
 for(const a of accounts)if(!a.deleted){const result=await call('/account/delete',{session:a,body:{password:a.password}});if(result.status!==200)throw Error('Synthetic account cleanup failed: '+a.handle);}
 console.log('Synthetic test accounts removed.');
}
