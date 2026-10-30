import {access,readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
for(const file of ['public/postoffice.html','public/postoffice.mjs','public/postoffice.css','public/privacy.html','public/terms.html','public/assets/rig-rabbit-v1.png','migrations/0001_initial.sql','migrations/0002_home.sql','public/postoffice-home.css'])await access(file);
for(const file of ['lib/api.mjs','lib/social.mjs','lib/storage.mjs','netlify/functions/api.mjs','public/postoffice.mjs','public/postoffice-home.mjs','public/home-art.mjs','lib/home.mjs','lib/home-catalog.mjs']){
 const r=spawnSync(process.execPath,['--check',file],{stdio:'inherit'});if(r.status!==0)process.exit(1);
}
if((await readFile('public/postoffice.mjs','utf8')).includes("post('/logout')"))throw Error('Obsolete logout endpoint');
console.log('Build checks passed. Static assets and server function are ready.');
