import {DatabaseSync,backup} from 'node:sqlite';
import {mkdirSync} from 'node:fs';import {join} from 'node:path';
export const SPECIES=['rat','ox','tiger','rabbit','dragon','snake','horse','sheep','monkey','rooster','dog','pig','otter'];
export function openStore(dir){
 mkdirSync(dir,{recursive:true,mode:0o700});const db=new DatabaseSync(join(dir,'postoffice.sqlite'),{timeout:5000});
 db.exec(`PRAGMA journal_mode=WAL;PRAGMA foreign_keys=ON;PRAGMA busy_timeout=5000;
 CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,handle TEXT UNIQUE NOT NULL,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL,species TEXT NOT NULL,password TEXT NOT NULL,verified INTEGER NOT NULL DEFAULT 0,discoverable INTEGER NOT NULL DEFAULT 1,banned INTEGER NOT NULL DEFAULT 0,created INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,csrf TEXT NOT NULL,expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS tokens(hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,kind TEXT NOT NULL,expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS requests(id TEXT PRIMARY KEY,sender TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,recipient TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,created INTEGER NOT NULL,UNIQUE(sender,recipient));
 CREATE TABLE IF NOT EXISTS friendships(a TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,b TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,created INTEGER NOT NULL,PRIMARY KEY(a,b));
 CREATE TABLE IF NOT EXISTS blocks(owner TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,target TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,created INTEGER NOT NULL,PRIMARY KEY(owner,target));
 CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY AUTOINCREMENT,sender TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,recipient TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,kind TEXT NOT NULL,body TEXT NOT NULL,client_id TEXT NOT NULL,created INTEGER NOT NULL,UNIQUE(sender,client_id));
 CREATE INDEX IF NOT EXISTS messages_pair ON messages(sender,recipient,id);
 CREATE INDEX IF NOT EXISTS messages_recipient ON messages(recipient,id);
 CREATE TABLE IF NOT EXISTS reads(owner TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,peer TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,message_id INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(owner,peer));
 CREATE TABLE IF NOT EXISTS reports(id TEXT PRIMARY KEY,reporter TEXT REFERENCES users(id) ON DELETE SET NULL,target TEXT REFERENCES users(id) ON DELETE SET NULL,message_id INTEGER,reason TEXT NOT NULL,evidence TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'open',created INTEGER NOT NULL);
 PRAGMA user_version=1;`);
 const get=(sql,...args)=>db.prepare(sql).get(...args),all=(sql,...args)=>db.prepare(sql).all(...args),run=(sql,...args)=>db.prepare(sql).run(...args);
 const transaction=fn=>{db.exec('BEGIN IMMEDIATE');try{const value=fn();db.exec('COMMIT');return value;}catch(e){db.exec('ROLLBACK');throw e;}};
 return{db,get,all,run,transaction,close:()=>db.close(),backup:file=>backup(db,file)};
}
export function publicUser(u){return{id:u.id,handle:u.handle,name:u.name,species:u.species};}
export const pair=(a,b)=>[a,b].sort();
