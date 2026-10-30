import {configuration} from './config.mjs';import {openStore} from './store.mjs';import {mkdir} from 'node:fs/promises';import {join} from 'node:path';
const config=configuration(),db=openStore(config.dataDir),[command,value]=process.argv.slice(2);
try{
 if(command==='reports'){console.log(JSON.stringify(db.all("SELECT r.id,r.reason,r.evidence,r.created,u.handle AS target FROM reports r LEFT JOIN users u ON u.id=r.target WHERE r.status='open' ORDER BY r.created DESC LIMIT 100"),null,2));}
 else if(['ban','unban'].includes(command)){const u=db.get('SELECT id,handle FROM users WHERE handle=?',String(value||'').toLowerCase());if(!u)throw Error('未找到该绒角号');db.run('UPDATE users SET banned=? WHERE id=?',command==='ban'?1:0,u.id);if(command==='ban')db.run('DELETE FROM sessions WHERE user_id=?',u.id);console.log(command+' '+u.handle);}
 else if(command==='resolve'){if(!value||!db.get('SELECT 1 FROM reports WHERE id=?',value))throw Error('未找到举报');db.run("UPDATE reports SET status='resolved' WHERE id=?",value);console.log('举报已处理');}
 else if(command==='backup'){const dir=join(config.dataDir,'backups');await mkdir(dir,{recursive:true,mode:0o700});const file=join(dir,'postoffice-'+new Date().toISOString().replace(/[:.]/g,'-')+'.sqlite');await db.backup(file);console.log(file);}
 else throw Error('用法：reports | ban <绒角号> | unban <绒角号> | resolve <举报ID> | backup');
}finally{db.close();}
