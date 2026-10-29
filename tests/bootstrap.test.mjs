import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, stat, utimes } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { supportedNode, ensureConfiguration, ensureDependencies, setupLock } from '../src/bootstrap.mjs';
import { saveCharacter } from '../src/storage.mjs';
import { createCharacter } from '../src/character.mjs';
import launchArgs from '../src/launch-args.cjs';
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const work = process.env.PAPERPAL_TEST_DIR || resolve(root, '..', '..', 'work');
await mkdir(work, { recursive: true });
const scratch = () => mkdtemp(join(work, 'setup-test '));
test('重复启动兼容 Chromium 等号参数，拒绝无效回执路径', () => {
  const id = '3b5cabf6-791c-41e5-9344-3cbf2acd532b';
  assert.equal(launchArgs.launchIdFrom(['--launch-id', id]), id);
  assert.equal(launchArgs.launchIdFrom([`--launch-id=${id}`]), id);
  assert.equal(launchArgs.launchIdFrom(['--launch-id=../../invalid']), null);
});

test('启动入口检查 Node.js 最低版本', () => {
  assert.equal(supportedNode('22.11.0'), false);
  assert.equal(supportedNode('22.12.0'), true);
  assert.equal(supportedNode('24.0.0'), true);
  assert.equal(supportedNode('invalid'), false);
});
test('重复配置保留昵称、大小和已有跟随偏好', async () => {
  const dir = await scratch();
  assert.equal((await ensureConfiguration(dir)).firstRun, true);
  const pet = createCharacter({ name: '棉花', size: 1.2 });
  await saveCharacter(dir, pet);
  const preferences = { mode: 'rest', affection: 42, followHost: true };
  await writeFile(join(dir, 'preferences.json'), JSON.stringify(preferences));
  const second = await ensureConfiguration(dir);
  assert.equal(second.firstRun, false);
  assert.deepEqual(second.character, pet);
  assert.deepEqual(JSON.parse(await readFile(join(dir, 'preferences.json'), 'utf8')), preferences);
});
test('已有损坏配置不被启动器覆盖，并打开设置用于恢复', async () => {
  const dir = await scratch();
  await writeFile(join(dir, 'character.json'), '{broken');
  const result = await ensureConfiguration(dir);
  assert.equal(result.needsConfiguration, true);
  assert.equal(await readFile(join(dir, 'character.json'), 'utf8'), '{broken');
});
test('首次安装路径调用 npm ci，重复启动不重复安装', async () => {
  const dir = await scratch();
  await writeFile(join(dir, 'package.json'), JSON.stringify({ version: '1.0.0', dependencies: { electron: '1.0.0' } }));
  await writeFile(join(dir, 'package-lock.json'), '{}');
  const calls = [];
  const run = async args => {
    calls.push(args);
    const pkg = join(dir, 'node_modules', 'electron');
    await mkdir(pkg, { recursive: true });
    await writeFile(join(pkg, 'package.json'), JSON.stringify({ name: 'electron', version: '1.0.0', main: 'index.cjs' }));
    await writeFile(join(pkg, 'index.cjs'), 'module.exports = __dirname + "/runtime-stub";');
    await writeFile(join(pkg, 'runtime-stub'), 'test-only fixture');
  };
  const first = await ensureDependencies(dir, { run, log() {} });
  assert.equal(first.installed, true);
  assert.ok(calls[0][0].endsWith('npm-cli.js'));
  assert.deepEqual(calls[0].slice(1), ['ci', '--no-audit', '--no-fund']);
  assert.equal((await ensureDependencies(dir, { run, log() {} })).installed, false);
  assert.equal(calls.length, 1);
});
test('下载失败不写入安装成功标记，允许下次重试', async () => {
  const dir = await scratch();
  await writeFile(join(dir, 'package.json'), JSON.stringify({ version: '1', dependencies: { electron: '1' } }));
  await writeFile(join(dir, 'package-lock.json'), '{}');
  await assert.rejects(() => ensureDependencies(dir, { run: async () => { throw new Error('network unavailable'); }, log() {} }));
  await assert.rejects(() => stat(join(dir, 'node_modules', '.paperpal-install.json')));
});
test('并发启动不会同时安装，遗留空锁过期后可恢复', async () => {
  const dir = await scratch();
  const release = await setupLock(dir);
  await assert.rejects(() => setupLock(dir));
  await release();
  const lock = join(dir, 'setup.lock');
  await writeFile(lock, '');
  await assert.rejects(() => setupLock(dir));
  const old = new Date(Date.now() - 120000); await utimes(lock, old, old);
  const releaseRecovered = await setupLock(dir); await releaseRecovered();
});
