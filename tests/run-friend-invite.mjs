// Isolated service + real Electron preload. No user data, DOM injection or user windows.
import {createServer} from 'node:http';
import {mkdtemp,mkdir,readFile,readdir,writeFile,rm} from 'node:fs/promises';
import {join,dirname,resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {handle} from '../cloud/postoffice/lib/api.mjs';
import {storage} from '../cloud/postoffice/lib/storage.mjs';
const root=dirname(dirname(fileURLToPath(import.meta.url))),cloud=join(root,'cloud','postoffice'),publicRoot=join(cloud,'public'),work=join(root,'.local','friend-invite-validation');
await mkdir(work,{recursive:true});const folder=await mkdtemp(join(work,'run-'));
const require=createRequire(import.meta.url),requireCloud=createRequire(join(cloud,'package.json')),{createClient}=requireCloud('@libsql/client'),db=createClient({url:'file::memory:'});
await db.execute('PRAGMA foreign_keys=ON');for(const file of (await readdir(join(cloud,'migrations'))).filter(x=>x.endsWith('.sql')).sort())await db.executeMultiple(await readFile(join(cloud,'migrations',file),'utf8'));
const store=storage(db),control=randomUUID(),sessions=[];let active=-1,origin,offline=false,failedSync=0;
const types={'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.json':'application/json'};
const server=createServer(async(req,res)=>{try{const url=new URL(req.url,origin);
 if(url.pathname==='/fixture-session'){if(req.headers['x-fixture-token']!==control){res.writeHead(403);res.end();return;}active=Number(url.searchParams.get('index'));res.writeHead(204);res.end();return;}
 if(url.pathname==='/fixture-network'){if(req.headers['x-fixture-token']!==control){res.writeHead(403);res.end();return;}if(url.searchParams.has('offline'))offline=url.searchParams.get('offline')==='1';res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({failedSync}));return;}
 if(url.pathname.startsWith('/api/')){if(offline){if(url.pathname==='/api/sync')failedSync++;res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Test network unavailable'}));return;}const chunks=[];for await(const x of req)chunks.push(x);const response=await handle(new Request(url,{method:req.method,headers:req.headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks)}),store);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;}
 const route=url.pathname==='/'?'/postoffice.html':url.pathname,file=resolve(publicRoot,'.'+route);if(!file.startsWith(publicRoot+sep)){res.writeHead(404);res.end();return;}const body=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store',...(url.pathname==='/'&&sessions[active]?{'Set-Cookie':sessions[active].cookie+'; Path=/; HttpOnly; SameSite=Strict'}:{})});res.end(body);
 }catch{res.writeHead(500);res.end('Fixture error');}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));origin='http://127.0.0.1:'+server.address().port;
try{
 for(const [id,species]of [['host','rabbit'],['guest','dog'],['private','dragon']]){const response=await fetch(origin+'/api/auth/register',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({handle:'invite_'+id,password:'Fixture-Password-2026!',name:({host:'小兔松饼',guest:'卷卷',private:'云朵'})[id],species,accepted:true})});const body=await response.json();if(response.status!==201)throw Error('Fixture registration failed');sessions.push({...body,cookie:response.headers.get('set-cookie').split(';')[0]});}
 await writeFile(join(folder,'fixture.json'),JSON.stringify({origin,control,sessions}),{mode:0o600});const env={...process.env,MOFU_INVITE_TEST:folder};delete env.ELECTRON_RUN_AS_NODE;
 const result=await new Promise((resolve,reject)=>{const child=spawn(require('electron'),[join(root,'tests','friend-invite-scenario.cjs')],{env,windowsHide:true});let out='',err='';const timer=setTimeout(()=>{child.kill();reject(Error('Friend invite scenario timed out'));},90000);child.stdout.on('data',b=>out+=b);child.stderr.on('data',b=>err+=b);child.on('error',reject);child.on('exit',code=>{clearTimeout(timer);if(code!==0)return reject(Error(err||out));const line=out.split(/\r?\n/).find(s=>s.startsWith('{"friendInvite"'));if(!line)return reject(Error('No test report'));resolve(JSON.parse(line));});});console.log(JSON.stringify(result,null,2));
}finally{await new Promise(r=>server.close(r));db.close();const target=resolve(folder);if(!target.startsWith(resolve(work)+sep))throw Error('Unsafe cleanup target');await rm(target,{recursive:true,force:true});}
