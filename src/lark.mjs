import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);

export function cliPath() {
  const packageRoot = dirname(require.resolve('@larksuite/cli/package.json'));
  return join(packageRoot, 'scripts', 'run.js');
}

export async function runLark(args, { profileDir, timeout = 20000 } = {}) {
  // A dedicated brand profile avoids consuming an unrelated CLI login.
  const result = await execFileAsync(process.execPath, [cliPath(), ...args], {
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', LARKSUITE_CLI_CONFIG_DIR: profileDir },
    timeout, maxBuffer: 2 * 1024 * 1024, windowsHide: true,
  });
  const parsed = JSON.parse(result.stdout);
  if (parsed.ok !== true) throw new Error('CLI_REQUEST_FAILED');
  return parsed.data;
}

export function normalizeCalendar(data, now = Date.now()) {
  const events = Array.isArray(data) ? data : Array.isArray(data?.events) ? data.events : Array.isArray(data?.items) ? data.items : [];
  const stamp = t => { const value = t?.datetime ?? t?.timestamp ?? t; if (typeof value === 'string' && value.includes('T')) return Date.parse(value); const x = Number(value); return Number.isFinite(x) ? (x < 1e12 ? x * 1000 : x) : NaN; };
  return events.filter(e => e.status !== 'cancelled' && e.self_attendee_status !== 'decline' && e.free_busy_status !== 'free' && !e.start_time?.date && !e.end_time?.date)
    .map(e => ({ start: stamp(e.start_time), end: stamp(e.end_time) }))
    .filter(e => Number.isFinite(e.start) && Number.isFinite(e.end) && e.start <= now && e.end > now)
    .sort((a, b) => a.end - b.end)[0] ?? null;
}

export async function fetchCalendar(profileDir, brand) {
  const data = await runLark(['calendar', '+agenda', '--as', 'user', '--start', new Date().toISOString(), '--end', new Date(Date.now() + 3600000).toISOString(), '--json'], { profileDir });
  return { busy: normalizeCalendar(data), brand };
}
