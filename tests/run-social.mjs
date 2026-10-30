import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {configuration} from '../server/config.mjs';
import {createPostoffice} from '../server/application.mjs';
const root=dirname(dirname(fileURLToPath(import.meta.url)));
const work=join(root,'.local','social-validation');await mkdir(work,{recursive:true});
const data=await mkdtemp(join(work,'run-')),mails=[];
const config=configuration({DATA_DIR:join(data,'service')});
const service=createPostoffice(config,{sendMail:async m=>mails.push(m)});
await new Promise(r=>service.server.listen(0,'127.0.0.1',r));
config.origin=`http://127.0.0.1:${service.server.address().port}`;
async function post(path,body){const r=await fetch(config.origin+'/api'+path,{method:'POST',headers:{Origin:config.origin,'Content-Type':'application/json'},body:JSON.stringify(body)});const result=await r.json();if(!r.ok)throw Error(JSON.stringify(result));return {...result,cookie:r.headers.get('set-cookie')?.split(';')[0]};}
try{
 const users=[];
 for(const [handle,name,species]of [['mimi_test','小米','rat'],['cloud_test','云朵','dragon']]){
  const credentials={handle,name,species,email:handle+'@example.test',password:'Local-test-password!26',accepted:true};
  await post('/auth/register',credentials);await post('/auth/verify',{token:mails.at(-1).token});
  users.push({...credentials,...await post('/auth/login',credentials)});
 }
 const shots=join(root,'design','current');await mkdir(shots,{recursive:true});
 await writeFile(join(data,'fixture.json'),JSON.stringify({origin:config.origin,users,shots}),{mode:0o600});
 const electron=createRequire(import.meta.url)('electron');
 const env={...process.env,MOFU_SOCIAL_TEST:data,MOFUCORNER_SOCIAL_URL:config.origin};delete env.ELECTRON_RUN_AS_NODE;
 const result=await new Promise((resolve,reject)=>{
  const child=spawn(electron,[join(root,'tests','social-scenario.cjs')],{env,windowsHide:true});let stdout='',stderr='';
  const timer=setTimeout(()=>{child.kill();reject(Error('Social desktop test timed out'));},60000);timer.unref();
  child.stdout.on('data',b=>stdout+=b);child.stderr.on('data',b=>stderr+=b);child.on('error',reject);
  child.on('exit',code=>{clearTimeout(timer);if(code!==0)return reject(Error(stderr||stdout));const line=stdout.split(/\r?\n/).find(v=>v.startsWith('{"social"'));if(!line)return reject(Error('No social desktop result: '+stdout));resolve(JSON.parse(line));});
 });
 const report={date:new Date().toISOString(),method:'Fresh local HTTP service, two verified test accounts, isolated Electron session, real renderer + preload + SSE',...result};
 await writeFile(join(root,'docs','social-validation.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await service.close();}
