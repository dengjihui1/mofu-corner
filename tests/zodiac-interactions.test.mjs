import test from 'node:test';
import assert from 'node:assert/strict';
import { PERSONALITIES, PlaySession } from '../ui/zodiac-personalities.mjs';
test('十二生肖使用不同玩法与回应，物种动作不混用',()=>{
  const values=Object.entries(PERSONALITIES).filter(([id])=>id!=='otter').map(([,value])=>value);assert.equal(values.length,12);assert.equal(new Set(values.map(v=>v.game)).size,12);assert.equal(new Set(values.map(v=>v.play)).size,12);assert.equal(PERSONALITIES.snake.game,'roll');assert.equal(PERSONALITIES.rooster.game,'wings');
});
test('换角色、摸摸和休息取消旧玩法，不会追加旧进度',()=>{
  const session=new PlaySession('dog');session.start();session.advance('go');const serial=session.serial;session.select('snake');assert.ok(session.serial>serial);assert.equal(session.advance('go'),false);session.start();session.sleep();assert.equal(session.advance('right'),false);assert.equal(session.mode,'sleep');session.touch();assert.equal(session.mode,'touch');assert.equal(session.game,null);
});
test('滚球必须先左后右，舒展要到达终点，完成不重复计数',()=>{
  const session=new PlaySession('snake');session.start();assert.equal(session.advance('right'),false);assert.equal(session.progress,0);assert.equal(session.advance('left'),false);assert.equal(session.advance('left'),false);assert.equal(session.advance('right'),true);assert.equal(session.advance('right'),false);session.select('pig');session.start();assert.equal(session.advance(50),false);assert.equal(session.advance(100),true);assert.equal(session.advance(100),false);
});
test('翅膀按左右交替回应，不把重复点同侧算作完成',()=>{
  const session=new PlaySession('rooster');session.start();assert.equal(session.advance('right'),false);assert.equal(session.progress,0);session.advance('left');session.advance('left');assert.equal(session.progress,1);session.advance('right');assert.equal(session.advance('left'),true);
});
test('呼吸只有结束事件算完成，睡觉和唤醒不增加玩耍进度',()=>{
  const session=new PlaySession('sheep');session.start();assert.equal(session.advance('go'),false);assert.equal(session.advance('done'),true);session.sleep();session.wake();assert.equal(session.progress,0);assert.equal(session.mode,'idle');assert.throws(()=>session.select('fox'));
});
