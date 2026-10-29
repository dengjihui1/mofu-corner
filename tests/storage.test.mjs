import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCharacter, DEFAULT_CHARACTER } from '../src/character.mjs';
import { loadCharacter, saveCharacter } from '../src/storage.mjs';

test('重复保存后重新加载得到最后一次配置，临时文件清理完成', async () => {
  const dir = await mkdtemp(join(process.env.PAPERPAL_TEST_DIR || tmpdir(), 'paperpal-'));
  try {
    assert.deepEqual(await loadCharacter(dir), { character: DEFAULT_CHARACTER, error: null });
    await saveCharacter(dir, createCharacter({ name: '团团', size: 1.2 }));
    const last = createCharacter({ name: '豆豆', species: 'otter', scarf: false, personality: 'playful' });
    await saveCharacter(dir, last);
    assert.deepEqual((await loadCharacter(dir)).character, last);
    assert.deepEqual(await readdir(dir), ['character.json']);
    await assert.rejects(() => saveCharacter(dir, { ...last, size: 99 }));
    assert.deepEqual(JSON.parse(await readFile(join(dir, 'character.json'), 'utf8')), last);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('配置损坏会回退默认角色并可通过重新保存恢复', async () => {
  const dir = await mkdtemp(join(process.env.PAPERPAL_TEST_DIR || tmpdir(), 'paperpal-'));
  try {
    await writeFile(join(dir, 'character.json'), '{broken');
    const result = await loadCharacter(dir);
    assert.ok(result.error);
    assert.deepEqual(result.character, DEFAULT_CHARACTER);
    await saveCharacter(dir, createCharacter({ name: '云团' }));
    assert.equal((await loadCharacter(dir)).error, null);
    assert.equal((await loadCharacter(dir)).character.name, '云团');
  } finally { await rm(dir, { recursive: true, force: true }); }
});
