import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,dirname,extname,sep,join} from 'node:path';
import {tmpdir} from 'node:os';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),publicRoot=join(root,'cloud/postoffice/public');
const profile=await mkdtemp(join(tmpdir(),'mofu-postcard-')),types={'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'};
const csp=(await readFile(join(publicRoot,'_headers'),'utf8')).split(/\r?\n/).find(x=>x.trim().startsWith('Content-Security-Policy:')).split(':').slice(1).join(':').trim();
const server=createServer(async(req,res)=>{try{const path=resolve(publicRoot,'.'+new URL(req.url,'http://test').pathname);if(!path.startsWith(publicRoot+sep))throw Error();const data=await readFile(path);res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Content-Security-Policy':csp});res.end(data);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
try{const env={...process.env,MOFU_POSTCARD_PROFILE:profile,MOFU_POSTCARD_URL:`http://127.0.0.1:${server.address().port}/showroom.html#berry/rabbit`};delete env.ELECTRON_RUN_AS_NODE;
 await new Promise((resolve,reject)=>{const child=spawn(createRequire(import.meta.url)('electron'),[join(root,'tests/room-postcard.cjs')],{env,stdio:'inherit',windowsHide:true});const timer=setTimeout(()=>{child.kill();reject(Error('Postcard test timed out'));},30000);child.on('error',reject);child.on('exit',code=>{clearTimeout(timer);code===0?resolve():reject(Error('Postcard test failed'));});});
}finally{await new Promise(r=>server.close(r));if(!resolve(profile).startsWith(resolve(tmpdir())+sep)||!profile.includes('mofu-postcard-'))throw Error('Invalid test profile');await rm(profile,{recursive:true,force:true,maxRetries:3});}
