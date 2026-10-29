import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = dirname(dirname(fileURLToPath(import.meta.url)));

export function validateHost(value) {
  if (!value || !['missing', 'ready', 'minimized', 'error'].includes(value.status)) throw new Error('HOST_STATUS');
  if (value.status === 'missing' || value.status === 'error') return { status: value.status };
  if (!['feishu', 'lark'].includes(value.brand) || !Number.isInteger(value.pid) || value.pid < 1 || typeof value.active !== 'boolean') throw new Error('HOST_IDENTITY');
  const r = value.bounds;
  if (!r || !['x', 'y', 'width', 'height'].every(k => Number.isFinite(r[k])) || r.width <= 0 || r.height <= 0 || Object.values(r).some(n => Math.abs(n) > 100000)) throw new Error('HOST_BOUNDS');
  return { status: value.status, brand: value.brand, pid: value.pid, active: value.active, bounds: { x: r.x, y: r.y, width: r.width, height: r.height } };
}

// These rectangles describe visible content inside the transparent 440×650 window.
// The renderer replaces them with measured bounds, including the animation margin.
export const DEFAULT_FOOTPRINTS = Object.freeze({ body: { x: 248, y: 492, width: 160, height: 156 }, side: { x: 248, y: 386, width: 160, height: 262 } });
export function validFootprints(value) {
  return value && ['body', 'side'].every(key => { const r=value[key];return r && ['x','y','width','height'].every(k=>Number.isInteger(r[k])) && r.x>=0 && r.y>=0 && r.width>0 && r.height>0 && r.x+r.width<=440 && r.y+r.height<=650; });
}
export function dockPosition(host, workArea, footprints = DEFAULT_FOOTPRINTS) {
  if (!validFootprints(footprints)) throw new Error('COMPANION_FOOTPRINT');
  const clamp = (n, lo, hi) => Math.round(Math.max(lo, Math.min(Math.max(lo, hi), n)));
  const fits = r => r.x>=workArea.x && r.y>=workArea.y && r.x+r.width<=workArea.x+workArea.width && r.y+r.height<=workArea.y+workArea.height;
  const outside = r => r.x>=host.x+host.width+12 || r.y>=host.y+host.height+12;
  for (const placement of ['right','bottom']) {
    const local=placement==='right'?footprints.side:footprints.body;
    const r={x:placement==='right'?Math.ceil(host.x+host.width+12):clamp(host.x+host.width-local.width,workArea.x,workArea.x+workArea.width-local.width),y:placement==='right'?clamp(host.y+host.height-local.height,workArea.y,workArea.y+workArea.height-local.height):Math.ceil(host.y+host.height+12),width:local.width,height:local.height};
    if (fits(r) && outside(r)) return { x:r.x-local.x,y:r.y-local.y,placement,visible:true,footprint:r };
  }
  // Never clamp the pet back over the client's content when it fills the screen.
  return { placement:'tray',visible:false,reason:'no-exterior-space' };
}

export function hostCommand(platform=process.platform,companionPid=process.pid){
 if(platform==='win32')return {executable:join(process.env.SystemRoot||'C:\\Windows','System32','WindowsPowerShell','v1.0','powershell.exe'),args:['-NoProfile','-NonInteractive','-File',join(root,'platform','windows-host.ps1'),'-CompanionProcessId',String(companionPid)]};
 if(platform==='darwin')return {executable:'/usr/bin/osascript',args:['-l','JavaScript',join(root,'platform','macos-host.js'),String(companionPid)]};
 return null;
}
export function watchHost({ companionPid = process.pid, onUpdate, onError } = {}) {
  const command=hostCommand();if(!command){onError?.();return()=>{};}
  const child = spawn(command.executable,command.args,{ windowsHide:true,stdio:['ignore','pipe','ignore'] });
  let buffer = '', last = '', stopped = false;
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', chunk => {
    buffer += chunk;
    if (buffer.length > 65536) { buffer = ''; onError?.(); return; }
    const lines = buffer.split(/\r?\n/); buffer = lines.pop();
    for (const line of lines) {
      try { const value = validateHost(JSON.parse(line)); const key = JSON.stringify(value); if (key !== last) { last = key; onUpdate?.(value); } }
      catch { onError?.(); }
    }
  });
  child.on('error', () => { if (!stopped) onError?.(); });
  child.on('exit', () => { if (!stopped) onError?.(); });
  return () => { stopped = true; child.kill(); };
}
