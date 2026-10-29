import {readFile,writeFile,readdir,mkdir,stat} from 'node:fs/promises';
import {join,dirname,relative,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {deflateRawSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const root=dirname(dirname(fileURLToPath(import.meta.url))),pkg=JSON.parse(await readFile(join(root,'package.json'),'utf8'));
const flag=process.argv.indexOf('--out'),out=resolve(flag<0?join(root,'dist',`paperpal-${pkg.version}-source.zip`):process.argv[flag+1]);
const files=['README.md','CHANGELOG.md','LICENSE','PRIVACY.md','package.json','package-lock.json','setup.mjs','Start-PaperPal.cmd','Start-PaperPal.command','开始使用.txt','.gitignore','.gitattributes'];
const docs=['platforms.md','publishing.md'];for(const name of docs)files.push(`docs/${name}`);
async function walk(dir){for(const e of await readdir(join(root,dir),{withFileTypes:true})){if(['node_modules','.local','.git','work','dist','__pycache__'].includes(e.name))continue;const path=join(dir,e.name);if(e.isDirectory())await walk(path);else if(!/\.(?:log|tmp)$/.test(e.name))files.push(path);}}
for(const dir of ['bin','desktop','src','ui','platform','tests','scripts','.github'])await walk(dir);
try{await stat(join(root,'design/current'));await walk('design/current');}catch{}
const table=new Uint32Array(256);for(let i=0;i<256;i++){let n=i;for(let b=0;b<8;b++)n=n&1?0xedb88320^(n>>>1):n>>>1;table[i]=n>>>0;}
function crc(data){let n=0xffffffff;for(const b of data)n=table[(n^b)&255]^(n>>>8);return (n^0xffffffff)>>>0;}
const parts=[],entries=[];let offset=0;
for(const file of [...new Set(files)].sort()){
 const name=Buffer.from('paperpal/'+file.replaceAll('\\','/')),data=await readFile(join(root,file)),packed=deflateRawSync(data,{level:6}),sum=crc(data),local=Buffer.alloc(30);
 local.writeUInt32LE(0x04034b50);local.writeUInt16LE(20,4);local.writeUInt16LE(0x800,6);local.writeUInt16LE(8,8);local.writeUInt16LE(0x5c21,12);local.writeUInt32LE(sum,14);local.writeUInt32LE(packed.length,18);local.writeUInt32LE(data.length,22);local.writeUInt16LE(name.length,26);parts.push(local,name,packed);
 const central=Buffer.alloc(46);central.writeUInt32LE(0x02014b50);central.writeUInt16LE(0x0314,4);central.writeUInt16LE(20,6);central.writeUInt16LE(0x800,8);central.writeUInt16LE(8,10);central.writeUInt16LE(0x5c21,14);central.writeUInt32LE(sum,16);central.writeUInt32LE(packed.length,20);central.writeUInt32LE(data.length,24);central.writeUInt16LE(name.length,28);central.writeUInt32LE(((file.endsWith('.command')?0o100755:0o100644)<<16)>>>0,38);central.writeUInt32LE(offset,42);entries.push(central,name);offset+=local.length+name.length+packed.length;
}
const directory=Buffer.concat(entries),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(entries.length/2,8);end.writeUInt16LE(entries.length/2,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);
const zip=Buffer.concat([...parts,directory,end]);await mkdir(dirname(out),{recursive:true});await writeFile(out,zip);
const sha256=createHash('sha256').update(zip).digest('hex');await writeFile(out+'.sha256',`${sha256}  ${out.split(/[\\/]/).at(-1)}\n`);
console.log(JSON.stringify({version:pkg.version,archive:out,files:entries.length/2,bytes:zip.length,sha256,platforms:['Windows','macOS Apple Silicon','macOS Intel'],macValidation:'pending CI / real device'}));
