import {readdir} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=dirname(dirname(fileURLToPath(import.meta.url))),files=['setup.mjs'];
async function walk(dir){for(const entry of await readdir(join(root,dir),{withFileTypes:true})){if(['vendor','assets','node_modules'].includes(entry.name))continue;const path=join(dir,entry.name);if(entry.isDirectory())await walk(path);else if(/\.(?:mjs|cjs|js)$/.test(path))files.push(path);}}
for(const dir of ['bin','desktop','src','ui','platform','scripts','tests','server'])await walk(dir);
for(const file of files){const result=spawnSync(process.execPath,['--check',join(root,file)],{encoding:'utf8',windowsHide:true});if(result.status!==0){console.error(result.stderr||result.error);process.exit(1);}}
console.log(`Syntax checked ${files.length} JavaScript files.`);
