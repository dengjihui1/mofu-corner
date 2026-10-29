import test from 'node:test';
import assert from 'node:assert/strict';
import { createCharacter, validateCharacter } from '../src/character.mjs';
test('默认桌宠缩小为 60%，仍可自行调整尺寸',()=>{assert.equal(createCharacter().size,.60);assert.equal(createCharacter({size:.9}).size,.9);});
test('角色配方可定制名称和配色', () => { const pet = createCharacter({ name: '豆豆', bag: '#bb9988' }); assert.equal(pet.name, '豆豆'); assert.equal(pet.bag, '#bb9988'); });
test('拒绝脚本、外部资源和未知字段', () => { assert.throws(() => validateCharacter({ ...createCharacter(), script: 'run()' })); assert.throws(() => createCharacter({ bag: 'url(https://example.com)' })); assert.throws(() => createCharacter({ name: '<script>' })); });

test('旧小獭配方迁移后保留角色和配色', () => {
  const migrated = validateCharacter({ schema: 'paperpal.character.v1', name: '折折', bag: '#91a185', stamp: '#d99b79' });
  assert.equal(migrated.species, 'otter');
  assert.equal(migrated.schema, 'paperpal.character.v2');
  assert.equal(migrated.size, 1);
  assert.equal(migrated.name, '折折');
});

test('配置边界拒绝未制作角色、异常尺寸和非法选项', () => {
  for (const options of [{ species: 'unicorn' }, { size: .54 }, { size: 1.31 }, { size: NaN }, { size: '1' }, { scarf: 'false' }, { personality: 'unknown' }, { name: ' ' }, { name: 'a'.repeat(17) }]) assert.throws(() => createCharacter(options));
  assert.equal(createCharacter({ size: .8, scarf: false, personality: 'quiet' }).scarf, false);
  assert.equal(createCharacter({ size: 1.3, species: 'otter' }).name, '折折');
});

test("十二生肖都可选择并保存到同一角色配方",()=>{for(const species of ["rat","ox","tiger","rabbit","dragon","snake","horse","sheep","monkey","rooster","dog","pig"]){assert.equal(validateCharacter(createCharacter({species})).species,species);}});
