import {createClient} from '@libsql/client';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
if(!process.env.TURSO_DATABASE_URL||!process.env.TURSO_AUTH_TOKEN)throw Error('Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN securely before migrating.');
const client=createClient({url:process.env.TURSO_DATABASE_URL,authToken:process.env.TURSO_AUTH_TOKEN});
try{
 await client.execute('CREATE TABLE IF NOT EXISTS _mofu_migrations(name TEXT PRIMARY KEY,hash TEXT NOT NULL)');
 for(const name of (await readdir(new URL('../migrations/',import.meta.url))).filter(x=>x.endsWith('.sql')).sort()){
 const source=(await readFile(new URL('../migrations/'+name,import.meta.url),'utf8')).replace(/\r\n/g,'\n'),hash=createHash('sha256').update(source).digest('hex');
 const prior=(await client.execute({sql:'SELECT hash FROM _mofu_migrations WHERE name=?',args:[name]})).rows[0];
 if(prior){if(prior.hash!==hash)throw Error('Applied migration differs; add a new migration instead.');console.log(name+' already applied.');}
 else{const statements=source.split(';').map(s=>s.trim()).filter(Boolean).map(sql=>({sql,args:[]}));statements.push({sql:'INSERT INTO _mofu_migrations(name,hash) VALUES(?,?)',args:[name,hash]});await client.batch(statements,'write');console.log(name+' applied atomically.');}
 }
}finally{client.close();}
