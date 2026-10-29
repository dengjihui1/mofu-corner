import test from 'node:test';
import assert from 'node:assert/strict';
import { ActivityDirector } from '../ui/activity.mjs';

test('小动作有开始、结束和休息间隔，不连续重复同一个动作', () => {
  const director = new ActivityDirector({ now: 0, random: () => 0 });
  assert.equal(director.step({ now: 3499 }), null);
  const first = director.step({ now: 3500 });
  assert.equal(first.kind, 'peek');
  assert.equal(director.step({ now: 4000 }), first);
  assert.equal(director.step({ now: first.until }), null);
  assert.ok(director.nextAt - first.until >= 14000);
  assert.notEqual(director.step({ now: director.nextAt }).kind, first.kind);
});
test('悬停、面板或安静模式阻止动作，恢复后先等一会儿', () => {
  const director = new ActivityDirector({ now: 0, random: () => 0 });
  assert.ok(director.step({ now: 4000 }));
  assert.equal(director.step({ now: 4100, allowed: false }), null);
  assert.equal(director.step({ now: 9000, allowed: false }), null);
  assert.equal(director.step({ now: 10000, allowed: true }), null);
  assert.equal(director.step({ now: 13499 }), null);
  assert.ok(director.step({ now: 13500 }));
});
test('安静性格只做轻动作，活泼性格有更短的间隔', () => {
  const quiet = new ActivityDirector({ now: 0, random: () => .9 });
  const quietAction = quiet.step({ now: 6000, personality: 'quiet' });
  assert.ok(['peek', 'sway'].includes(quietAction.kind));
  const quietGap = quiet.nextAt - quietAction.until;
  assert.ok(quietGap >= 35000 && quietGap < 60000);
  const playful = new ActivityDirector({ now: 0, random: () => .9 });
  const action = playful.step({ now: 6000, personality: 'playful' });
  assert.ok(playful.nextAt - action.until < quietGap);
});
