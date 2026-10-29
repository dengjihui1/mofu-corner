import { readFile, writeFile, rename, mkdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { validateCharacter, DEFAULT_CHARACTER } from './character.mjs';
export async function loadCharacter(directory) {
  try { return { character: validateCharacter(JSON.parse(await readFile(join(directory, 'character.json'), 'utf8'))), error: null }; }
  catch (error) { return { character: { ...DEFAULT_CHARACTER }, error: error.code === 'ENOENT' ? null : '角色配置损坏，已使用默认角色；重新保存可修复。' }; }
}
export async function saveCharacter(directory, value) {
  const character = validateCharacter(value);
  await mkdir(directory, { recursive: true });
  const temp = join(directory, `character-${randomUUID()}.tmp`);
  try { await writeFile(temp, JSON.stringify(character, null, 2), { mode: 0o600, flag: 'wx' }); await rename(temp, join(directory, 'character.json')); }
  finally { await unlink(temp).catch(() => {}); }
  return character;
}
