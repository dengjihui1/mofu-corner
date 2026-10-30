import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {mkdir,mkdtemp,rm} from 'node:fs/promises';
import {dirname,join,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(dirname(fileURLToPath(import.meta.url))),work=join(root,'.local','account-renderer-validation');
await mkdir(work,{recursive:true});const folder=await mkdtemp(join(work,'run-'));
const env={...process.env,MOFU_RENDERER_TEST:folder};delete env.ELECTRON_RUN_AS_NODE;
try{
 const result=await new Promise((resolve,reject)=>{
  const child=spawn(createRequire(import.meta.url)('electron'),[join(root,'tests/account-renderer.cjs')],{cwd:root,env,windowsHide:true});let out='',err='';
  const timer=setTimeout(()=>{child.kill();reject(Error('Native account renderer timed out'));},60000);
  child.stdout.on('data',chunk=>out+=chunk);child.stderr.on('data',chunk=>err+=chunk);
  child.on('error',error=>{clearTimeout(timer);reject(error);});
  child.on('exit',code=>{clearTimeout(timer);if(code!==0)return reject(Error(err||out||'Renderer process failed'));const line=out.split(/\r?\n/).find(value=>value.startsWith('{"accountRenderer"'));if(!line)return reject(Error('No renderer report: '+out));resolve(JSON.parse(line));});
 });
 console.log(JSON.stringify(result,null,2));
}finally{
 const target=resolve(folder);if(!target.startsWith(resolve(work)+sep))throw Error('Unsafe cleanup target');
 await rm(target,{recursive:true,force:true,maxRetries:3,retryDelay:100});
}
