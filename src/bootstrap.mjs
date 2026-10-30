import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { access, readFile, writeFile, mkdir, open, unlink, stat } from 'node:fs/promises';
import { constants, openSync, closeSync } from 'node:fs';
import { join, dirname, resolve, delimiter } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { loadCharacter, saveCharacter } from './storage.mjs';
import { DEFAULT_CHARACTER } from './character.mjs';
import {npmCandidates} from './platform.mjs';

export function supportedNode(version = process.versions.node) {
  const [major, minor] = version.replace(/^v/, '').split('.').map(Number);
  return major > 22 || major === 22 && minor >= 12;
}
const exists = path => access(path).then(() => true, () => false);
const fingerprint = buffer => createHash('sha256').update(buffer).digest('hex');

export async function findNpmCli() {
  const candidates = npmCandidates();
  for (const path of candidates) if (path?.endsWith('npm-cli.js') && await exists(path)) return path;
  throw new Error('没有找到 npm。请安装包含 npm 的 Node.js 22.12 或更新版本后重试。');
}

export function runNode(args, cwd) {
  return new Promise((done, reject) => {
    const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE;
    const child = spawn(process.execPath, args, { cwd, env, stdio: 'inherit', windowsHide: true });
    child.once('error', reject);
    child.once('exit', code => code === 0 ? done() : reject(new Error(`安装步骤未成功（退出码 ${code}）。请检查网络后重新运行；已保存的宠物配置会保留。`)));
  });
}

export async function ensureDependencies(root, { run = runNode, log = console.log, repair = false } = {}) {
  const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  const lock = await readFile(join(root, 'package-lock.json'));
  const lockHash = fingerprint(lock);
  const lockData=JSON.parse(lock.toString('utf8'));
  const dependencyData=structuredClone(lockData);delete dependencyData.version;if(dependencyData.packages?.[''])delete dependencyData.packages[''].version;
  const dependencyHash=fingerprint(JSON.stringify(dependencyData));
  const stampFile = join(root, 'node_modules', '.paperpal-install.json');
  let stamp;
  try { stamp = JSON.parse(await readFile(stampFile, 'utf8')); } catch {}
  let packagesMatch = true;
  for (const [name, version] of Object.entries(manifest.dependencies || {})) {
    try { const installed = JSON.parse(await readFile(join(root, 'node_modules', name, 'package.json'), 'utf8')); if (installed.version !== version) packagesMatch = false; }
    catch { packagesMatch = false; }
  }
  // Older stamps hashed the application version too. Migrate only when the complete
  // old lockfile matches after restoring that version; real dependency changes still reinstall.
  let legacyMatch=stamp?.lockHash===lockHash;
  if(stamp&&!stamp.dependencyHash&&stamp.version){const previous=structuredClone(lockData);previous.version=stamp.version;if(previous.packages?.[''])previous.packages[''].version=stamp.version;const text=JSON.stringify(previous,null,2)+'\n';legacyMatch ||= [text,text.replaceAll('\n','\r\n')].some(value=>fingerprint(value)===stamp.lockHash);}
  const changed=stamp&&(stamp.dependencyHash?stamp.dependencyHash!==dependencyHash:!legacyMatch);
  let installed = false;
  if (repair || !packagesMatch || changed || stamp && (stamp.platform && stamp.platform !== process.platform || stamp.arch && stamp.arch !== process.arch)) {
    // Probe the executable before npm ci can remove any files from an active Windows install.
    const runtime=join(root,'node_modules','electron','dist','electron.exe');
    if(process.platform==='win32'&&await exists(runtime)){try{const handle=await open(runtime,'r+');await handle.close();}catch(error){if(['EPERM','EACCES','EBUSY'].includes(error.code))throw new Error('桌面运行时正被占用或不可写。请先从托盘退出绒角，再重新运行；现有依赖未修改。');throw error;}}
    log('首次准备依赖，正在安装。下载可能需要几分钟…');
    await run([await findNpmCli(), 'ci', '--no-audit', '--no-fund'], root);
    installed = true;
  } else log('依赖已就绪。');
  const require = createRequire(join(root, 'package.json'));
  let executable;
  const inspect = async () => {
    try { const path = require('electron'); await access(path, constants.F_OK); return path; } catch { return null; }
  };
  executable = await inspect();
  if (!executable) {
    log('正在准备 Electron 桌面运行时…');
    await run([join(root, 'node_modules', 'electron', 'install.js')], root);
    executable = await inspect();
  }
  if (!executable) throw new Error('桌面运行时尚未下载成功。可稍后重新运行 node setup.mjs --repair。');
  await mkdir(dirname(stampFile), { recursive: true });
  await writeFile(stampFile, JSON.stringify({ version: manifest.version, lockHash,dependencyHash,platform:process.platform,arch:process.arch }), { mode: 0o600 });
  return { executable, installed };
}

export async function ensureConfiguration(dataRoot) {
  await mkdir(dataRoot, { recursive: true });
  const characterFile = join(dataRoot, 'character.json');
  const firstRun = !await exists(characterFile);
  if (firstRun) await saveCharacter(dataRoot, DEFAULT_CHARACTER);
  const loaded = await loadCharacter(dataRoot);
  try { await writeFile(join(dataRoot, 'preferences.json'), JSON.stringify({ mode: 'available', until: null, affection: 0, followHost: false }), { flag: 'wx', mode: 0o600 }); }
  catch (error) { if (error.code !== 'EEXIST') throw error; }
  return { firstRun, needsConfiguration: firstRun || Boolean(loaded.error), character: loaded.character, warning: loaded.error };
}

export async function setupLock(dataRoot) {
  await mkdir(dataRoot, { recursive: true });
  const path = join(dataRoot, 'setup.lock');
  let handle;
  for (let attempt = 0; attempt < 2; attempt++) {
    try { handle = await open(path, 'wx', 0o600); break; }
    catch (error) {
      if (error.code !== 'EEXIST') throw error;
      let oldPid = 0;
      try { oldPid = JSON.parse(await readFile(path, 'utf8')).pid; } catch {}
      let running = Number.isInteger(oldPid) && oldPid > 0;
      if (running) { try { process.kill(oldPid, 0); } catch (failure) { if (failure.code === 'ESRCH') running = false; } }
      else if (Date.now() - (await stat(path)).mtimeMs < 60000) running = true;
      if (running || attempt) throw new Error('另一个启动入口正在准备绒角，请等它完成。');
      await unlink(path);
    }
  }
  await handle.writeFile(JSON.stringify({ pid: process.pid }));
  return async () => { await handle.close(); await unlink(path).catch(() => {}); };
}

export async function launchDesktop(root, executable, dataRoot, { configure = false, smoke = false, args = [], timeout = 20000 } = {}) {
  const launchId = randomUUID();
  const receiptFile = join(dataRoot, 'run', `${launchId}.json`);
  await mkdir(join(dataRoot, 'run'), { recursive: true });
  await mkdir(join(dataRoot, 'logs'), { recursive: true });
  const logFile = join(dataRoot, 'logs', 'desktop.log');
  const descriptor = openSync(logFile, 'a', 0o600);
  const env = { ...process.env, PAPERPAL_DATA_DIR: resolve(dataRoot), PAPERPAL_BRAND: args.includes('--brand') ? args[args.indexOf('--brand') + 1] : 'feishu' };
  delete env.ELECTRON_RUN_AS_NODE;
  const flags = [root, '--launch-id', launchId, ...args];
  if (configure && !flags.includes('--configure')) flags.push('--configure');
  if (smoke && !flags.includes('--smoke')) flags.push('--smoke');
  let child;
  try { child = spawn(executable, flags, { cwd: root, env, detached: !smoke, windowsHide: true, stdio: ['ignore', descriptor, descriptor] }); }
  finally { closeSync(descriptor); }
  let launchFailure, exited;
  const exit = new Promise(resolveExit => { child.once('error', error => { launchFailure = error; resolveExit(-1); }); child.once('exit', code => { exited = code; resolveExit(code); }); });
  const started = Date.now();
  try {
    while (Date.now() - started < timeout) {
      if (launchFailure) throw launchFailure;
      if (exited !== undefined && exited !== 0) throw new Error(`桌面启动未成功。可查看 ${logFile}`);
      try {
        const receipt = JSON.parse(await readFile(receiptFile, 'utf8'));
        if (receipt.ready === true && receipt.launchId === launchId) {
          if (smoke && await exit !== 0) throw new Error('桌面自检未通过。');
          child.unref();
          return { ...receipt, logFile };
        }
      } catch (error) { if (!['ENOENT', undefined].includes(error.code) || error.message === '桌面自检未通过。') throw error; }
      await new Promise(resolveTick => setTimeout(resolveTick, 100));
    }
    if (child.exitCode === null) child.kill();
    throw new Error(`桌面暂未就绪，请重试或查看 ${logFile}`);
  } finally { await unlink(receiptFile).catch(() => {}); }
}
