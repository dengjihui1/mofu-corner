import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {createClient} from '@libsql/client';
import {handle} from '../lib/api.mjs';
import {storage} from '../lib/storage.mjs';
const root=resolve('public'),client=createClient({url:'file::memory:'});
await client.executeMultiple('PRAGMA foreign_keys=ON;'+await readFile('migrations/0001_initial.sql','utf8'));
const database=storage(client),types={'.html':'text/html; charset=utf-8','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'};
const server=createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://127.0.0.1:4722');
 if(url.pathname.startsWith('/api/')){
  const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>16384){res.writeHead(413);res.end();return;}chunks.push(chunk);}
  const headers=new Headers(req.headers);headers.set('cf-connecting-ip',req.socket.remoteAddress||'unknown');
  const response=await handle(new Request(url,{method:req.method,headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks)}),database);
  res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;
 }
 const routes={'/':'/postoffice.html','/postoffice':'/postoffice.html','/privacy':'/privacy.html','/terms':'/terms.html'},file=resolve(root,'.'+(routes[url.pathname]||decodeURIComponent(url.pathname)));
 if(!file.startsWith(root+sep)||['/_headers','/_redirects'].includes(url.pathname)){res.writeHead(404);res.end();return;}
 const body=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(body);
 }catch{res.writeHead(404);res.end('Not found');}});
server.listen(4722,'127.0.0.1',()=>console.log('Local preview: http://127.0.0.1:4722 (isolated, temporary test data)'));
process.on('SIGINT',()=>server.close(()=>{client.close();process.exit();}));
