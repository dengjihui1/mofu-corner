#!/usr/bin/env node
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { supportedNode, ensureDependencies, ensureConfiguration, setupLock, launchDesktop } from './src/bootstrap.mjs';
const root = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const dataRoot = resolve(process.env.PAPERPAL_DATA_DIR || join(root, '.local'));
const allowed = ['--configure', '--no-start', '--repair', '--smoke', '--demo', '--brand', '--pet'];
try {
  if (!supportedNode()) throw new Error('需要 Node.js 22.12 或更新版本。请安装后重新运行。');
  for (let i = 0; i < args.length; i++) {
    if (!allowed.includes(args[i])) throw new Error(`未知选项：${args[i]}`);
    if (['--brand', '--pet'].includes(args[i])) { if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`缺少 ${args[i]} 的值`); i++; }
  }
  if (args.includes('--brand') && !['feishu', 'lark'].includes(args[args.indexOf('--brand') + 1])) throw new Error('brand 必须是 feishu 或 lark');
  console.log('绒角 MofuCorner · 一键准备与启动');
  const release = await setupLock(dataRoot);
  let runtime, configuration;
  try {
    runtime = await ensureDependencies(root, { repair: args.includes('--repair') });
    configuration = await ensureConfiguration(dataRoot);
  } finally { await release(); }
  if (configuration.warning) console.log(configuration.warning);
  console.log(`宠物：${configuration.character.name}；设置保存在 ${dataRoot}`);
  if (args.includes('--no-start')) { console.log('配置已准备好。运行 node setup.mjs 即可启动。'); }
  else {
    const forwarded = args.filter(arg => !['--configure', '--no-start', '--repair', '--smoke'].includes(arg));
    const result = await launchDesktop(root, runtime.executable, dataRoot, { configure: args.includes('--configure') || configuration.needsConfiguration, smoke: args.includes('--smoke'), args: forwarded });
    if (args.includes('--smoke')) console.log(JSON.stringify({ bootstrapSmoke: true, firstRun: configuration.firstRun, settingsOpen: result.settingsOpen, ready: result.ready }));
    console.log(args.includes('--smoke') ? '隐藏窗口启动自检通过。' : result.reused ? '绒角已经运行；可在托盘切换桌面陪伴与窗口外侧陪伴。' : '绒角已启动。托盘右键可切换桌面陪伴与窗口外侧陪伴；窗口外空间不足时会收起。小窝可换生肖与定制。');
  }
} catch (error) { console.error(`\n未完成：${error.message}`); process.exitCode = 1; }
