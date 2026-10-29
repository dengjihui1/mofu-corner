#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join, dirname, resolve, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import {capabilities} from '../src/platform.mjs';
const require = createRequire(import.meta.url);
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const command = args[0] || 'help';
const dataRoot = process.env.PAPERPAL_DATA_DIR || join(root, '.local');
const brand = args.includes('--brand') ? args[args.indexOf('--brand') + 1] : 'feishu';
if (!['feishu', 'lark'].includes(brand)) { console.error('brand 必须为 feishu 或 lark'); process.exit(1); }
const profileDir = join(dataRoot, brand, 'lark-cli');

function child(exe, argv, options = {}) {
  return new Promise((done, reject) => {
    const proc = spawn(exe, argv, { stdio: 'inherit', windowsHide: true, ...options });
    proc.on('error', reject); proc.on('exit', code => done(code || 0));
  });
}

if (command === 'start') {
  process.exitCode=await child(process.execPath,[join(root,'setup.mjs'),...args.slice(1)]);
} else if (command === 'preview') {
  const ui = join(root, 'ui');
  const types = { '.html': 'text/html; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.gz': 'application/gzip', '.mp4': 'video/mp4' };
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1');
      const name = decodeURIComponent(url.pathname === '/' ? '/motion-study.html' : url.pathname);
      let base = ui;
      let file;
      const sourceModule = ['/src/state.mjs', '/src/character.mjs'].includes(name);
      if (sourceModule) file = join(root, name.slice(1));
      else file = resolve(ui, `.${name}`);
      if (!sourceModule && (relative(base, file).startsWith('..') || relative(base, file).includes(':'))) throw new Error('invalid path');
      const content = await readFile(file);
      res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'" });
      res.end(content);
    } catch { res.writeHead(404); res.end('Not found'); }
  });
  server.listen(4717, '127.0.0.1', () => console.log('PaperPal 本地陪伴：http://127.0.0.1:4717（无需账号登录；仅本机可访问）'));
  server.on('error', () => { console.error('预览端口 4717 已占用或不可用'); process.exitCode = 1; });
} else if (command === 'character') {
  const { createCharacter } = await import('../src/character.mjs');
  const flag = (key, fallback) => args.includes(key) ? args[args.indexOf(key) + 1] : fallback;
  try {
    const options = {};
    for (const key of ['species', 'name', 'bag', 'stamp', 'personality']) if (args.includes(`--${key}`)) options[key] = flag(`--${key}`);
    if (args.includes('--size')) options.size = Number(flag('--size'));
    if (args.includes('--no-scarf')) options.scarf = false;
    const recipe = createCharacter(options);
    const output = resolve(flag('--out', 'paperpal-character.json'));
    await writeFile(output, JSON.stringify(recipe, null, 2), { flag: 'wx' });
    console.log(`本地角色配方已生成：${output}\n使用 start --pet 加载，也可在设置界面保存。此命令定制内置角色，不调用 AI 生图。`);
  } catch { console.error('配方生成失败：检查角色、昵称、六位十六进制颜色、大小 0.55–1.3，以及输出文件是否已存在。'); process.exitCode = 1; }
} else if (command === 'doctor') {
  console.log(JSON.stringify({ node: process.version, os: process.platform, mode: 'local-companion', loginRequired: false, enterpriseAppRequired: false, messageAccess: 'disabled', notificationAccess: 'disabled', calendarAccess: 'disabled by default', windowFollowing: capabilities().windowFollowing, characterSettings: '本地保存', dataDirectory: dataRoot }, null, 2));
} else if (command === 'connect') {
  if (!args.includes('--experimental-calendar')) { console.error('当前 MVP 无需连接账号，直接 npm start 即可。日历研究入口需要显式 --experimental-calendar，此流程仍可能涉及企业审批。'); process.exitCode = 2; }
  else if (brand === 'lark') { console.error('Lark 日程与用户权限尚未联调，此版暂不自动配置。可以使用本地陪伴和体验模式。'); process.exitCode = 2; }
  else {
    const { cliPath } = await import('../src/lark.mjs');
    await mkdir(profileDir, { recursive: true });
    const env = { ...process.env, LARKSUITE_CLI_CONFIG_DIR: profileDir };
    console.log('即将通过官方 CLI 引导创建飞书应用。应用模板预设权限以飞书确认页为准，请核对后自行确认。随后本产品只申请用户只读日历权限。此接入流程尚待账号联调。');
    const init = await child(process.execPath, [cliPath(), 'config', 'init', '--new', '--brand', brand], { env });
    if (init !== 0) process.exitCode = init;
    else {
      const auth = await child(process.execPath, [cliPath(), 'auth', 'login', '--scope', 'calendar:calendar.event:read'], { env });
      process.exitCode = auth;
      if (auth === 0) { await writeFile(join(dataRoot, brand, 'connection.json'), JSON.stringify({ calendar: true, brand }), { mode: 0o600 }); console.log('日历授权流程完成；桌面端仍会检查每次查询结果，并显示“日程推断”。'); }
    }
  }
} else {
  console.log(`纸伴 PaperPal 0.6 · Windows / macOS 桌面陪伴\n\nnode setup.mjs                       一键准备并启动\nnode setup.mjs --configure           打开小窝设置\nnode setup.mjs --brand lark          Lark 标识启动\nnode bin/paperpal.mjs preview        浏览器预览\nnode bin/paperpal.mjs doctor         本机能力与平台状态\n\n十二生肖和经典小獭均可在小窝选择。默认身量 60%。\nWindows 外侧跟随已实测；Mac 跟随为试用适配，等待 Mac 验收。\n本版不接收聊天消息、不修改飞书状态。源码尚未发布 npm 公共包。`);
}
