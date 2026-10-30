import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, mkdir, cp, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { saveCharacter } from '../src/storage.mjs';
import { createCharacter } from '../src/character.mjs';
const exec = promisify(execFile);
const source = dirname(dirname(fileURLToPath(import.meta.url)));
const work = process.env.PAPERPAL_TEST_DIR || resolve(source, '..', '..', 'work');
await mkdir(work, { recursive: true });
const scratch = await mkdtemp(join(work, 'paperpal setup 空格 '));
const cold = process.argv.includes('--clean');
let root = source;
if (cold) {
  root = join(scratch, 'source with spaces'); await mkdir(root);
  for (const name of ['package.json', 'package-lock.json', 'setup.mjs', 'src', 'desktop', 'ui', 'platform', 'tests']) await cp(join(source, name), join(root, name), { recursive: true });
  console.log('正在验证全新源码目录的一键安装，可能需要下载依赖…');
}
const data = join(scratch, 'profile');
const env = { ...process.env, PAPERPAL_DATA_DIR: data }; delete env.ELECTRON_RUN_AS_NODE;
const invoke = async flags => {
  const result = await exec(process.execPath, [join(root, 'setup.mjs'), ...flags], { cwd: root, env, timeout: 240000, maxBuffer: 2 * 1024 * 1024, windowsHide: true });
  const line = result.stdout.split(/\r?\n/).find(line => line.startsWith('{'));
  if (!line) throw new Error('No bootstrap receipt');
  return JSON.parse(line);
};
const first = await invoke(['--smoke']);
if (!first.ready || !first.firstRun || !first.settingsOpen) throw new Error('First-run configuration was not shown');
await saveCharacter(data, createCharacter({ name: '棉花', size: 1.15 }));
const second = await invoke(['--smoke']);
if (!second.ready || second.firstRun || second.settingsOpen) throw new Error('Repeat launch did not preserve the configured state');
const saved = JSON.parse(await readFile(join(data, 'character.json'), 'utf8'));
if (saved.name !== '棉花' || saved.size !== 1.15) throw new Error('Saved character was overwritten');
const explicit = await invoke(['--smoke', '--configure']);
if (!explicit.settingsOpen) throw new Error('Explicit configuration did not open');
await invoke(['--smoke','--postoffice','https://pets.example.test']);
if(JSON.parse(await readFile(join(data,'postoffice.json'),'utf8')).url!=='https://pets.example.test')throw new Error('Postoffice URL was not saved');
try{await invoke(['--no-start','--postoffice','http://pets.example.test']);throw new Error('Insecure postoffice was accepted');}catch(error){if(!String(error.stderr).includes('HTTPS'))throw error;}
const report = { date: new Date().toISOString(), freshDependencyInstall: cold, first, second, explicit, savedPreferencesPreserved: true, postofficeConfigurationValidated: true, pathWithSpacesAndChinese: true, mouseAndKeyboardUsed: false };
await writeFile(join(source, 'docs', 'bootstrap-validation.json'), JSON.stringify(report, null, 2));
if (cold) await writeFile(join(source, 'docs', 'bootstrap-clean-validation.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
