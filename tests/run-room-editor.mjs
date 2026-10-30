import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {mkdir,mkdtemp,rm} from 'node:fs/promises';
import {dirname,join,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(dirname(fileURLToPath(import.meta.url))),work=join(root,'.local','room-editor-validation');
await mkdir(work,{recursive:true});const folder=await mkdtemp(join(work,'run-')),env={...process.env,MOFU_EDITOR_TEST:folder};delete env.ELECTRON_RUN_AS_NODE;
try{
 const result=await new Promise((resolve,reject)=>{const child=spawn(createRequire(import.meta.url)('electron'),[join(root,'tests/room-editor.cjs')],{cwd:root,env,windowsHide:true});let out='',err='';const timer=setTimeout(()=>{child.kill();reject(Error('Room editor test timed out'));},50000);child.stdout.on('data',b=>out+=b);child.stderr.on('data',b=>err+=b);child.on('error',e=>{clearTimeout(timer);reject(e);});child.on('exit',code=>{clearTimeout(timer);if(code!==0)return reject(Error(err||out));const line=out.split(/\r?\n/).find(s=>s.startsWith('{"roomEditor"'));if(!line)return reject(Error('No room editor test report'));resolve(JSON.parse(line));});});console.log(JSON.stringify(result,null,2));
}finally{const target=resolve(folder);if(!target.startsWith(resolve(work)+sep))throw Error('Unsafe cleanup target');await rm(target,{recursive:true,force:true,maxRetries:3,retryDelay:100});}
