import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const work = process.env.PAPERPAL_TEST_DIR || resolve(root, '..', '..', 'work');
await mkdir(work, { recursive: true });
const directory = await mkdtemp(join(work, 'desktop-test-'));
const electron = createRequire(import.meta.url)('electron');
const env = { ...process.env, PAPERPAL_DATA_DIR: directory, PAPERPAL_TEST_SCREENSHOT: join(root, 'design', 'mvp-desktop.png') };
delete env.ELECTRON_RUN_AS_NODE;
async function run(flags, brand) {
  return await new Promise((done, reject) => {
    const child = spawn(electron, [root, ...flags], { env: { ...env, PAPERPAL_BRAND: brand }, windowsHide: true });
    let stdout = '', stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; }); child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', reject);
    child.on('exit', code => {
      if (code !== 0) return reject(new Error(`Desktop process failed (${code}): ${stderr}`));
      const line = stdout.split(/\r?\n/).find(v => v.startsWith('{'));
      if (!line) return reject(new Error('No desktop verification result'));
      done(JSON.parse(line));
    });
    setTimeout(() => { if (child.exitCode === null) { child.kill(); reject(new Error('Desktop test timeout')); } }, 40000).unref();
  });
}
const ui = await run(['--self-test', '--demo'], 'lark');
const restart = await run(['--smoke'], 'lark');
if (restart.character !== ui.savedName || !restart.windowHidden) throw new Error('Restart did not restore saved character');
if (!restart.companionOnly || restart.messageCount !== 0 || restart.calendarEnabled) throw new Error('Default mode is not a local companion');
const report = { date: new Date().toISOString(), method: 'isolated hidden Electron window with offscreen rendering; DOM actions + actual preload IPC + local disk + native restart', liveApiRequests: false, ui, restart, screenshot: 'design/mvp-desktop.png' };
await writeFile(join(root, 'docs', 'desktop-validation.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
