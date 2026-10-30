import {CATALOG} from '../lib/home-catalog.mjs';
import {access,readFile,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
await writeFile('lib/room-schema.mjs','// Generated from migrations/0003_room_layout.sql by the build check.\nexport const LAYOUT_SCHEMA_SQL = '+JSON.stringify((await readFile('migrations/0003_room_layout.sql','utf8')).replaceAll('\r\n','\n'))+';\n');
try{await writeFile('public/pet-accessories.mjs',await readFile(new URL('../../../ui/pet-accessories.mjs',import.meta.url),'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;await access('public/pet-accessories.mjs');}
await writeFile('public/home-collection.json',JSON.stringify({catalog:CATALOG}));
for(const file of ['public/showroom.html','public/showroom.css','public/home-cozy.css','public/postoffice.html','public/postoffice.mjs','public/postoffice.css','public/privacy.html','public/terms.html','public/assets/rig-rabbit-v1.png','migrations/0001_initial.sql','migrations/0002_home.sql','public/postoffice-home.css'])await access(file);
for(const file of ['public/pet-accessories.mjs','lib/home-layout.mjs','public/room-layout.mjs','public/pet-outfit.mjs','public/home-editor.mjs','lib/api.mjs','lib/social.mjs','lib/storage.mjs','netlify/functions/api.mjs','public/postoffice.mjs','public/postoffice-home.mjs','public/home-art.mjs','lib/home.mjs','lib/home-catalog.mjs','public/showroom.mjs','public/home-styles.mjs']){
 const r=spawnSync(process.execPath,['--check',file],{stdio:'inherit'});if(r.status!==0)process.exit(1);
}
if((await readFile('public/postoffice.mjs','utf8')).includes("post('/logout')"))throw Error('Obsolete logout endpoint');
console.log('Build checks passed. Static assets and server function are ready.');
