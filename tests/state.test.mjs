import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, reduce, presentation } from '../src/state.mjs';
import { normalizeCalendar } from '../src/lark.mjs';

test('专注期间新消息保留，结束后才恢复提醒姿态', () => {
  let state = reduce(createState(0), { type: 'mode', mode: 'focus', minutes: 25 }, 0);
  state = reduce(state, { type: 'message', id: 'm1', from: 'fixture', text: 'test' }, 10);
  assert.equal(state.queue.length, 1);
  assert.equal(presentation(state, 20).mode, 'focus');
  state = reduce(state, { type: 'tick' }, 25 * 60000);
  assert.equal(presentation(state, 25 * 60000).mode, 'mail');
});

test('日历只能推断有安排，不能产生实际入会或个人勿扰状态', () => {
  let state = reduce(createState(0), { type: 'calendar', end: 900000 }, 100);
  const view = presentation(state, 200);
  assert.equal(view.mode, 'scheduled');
  assert.equal(view.source, '日程推断');
  assert.equal(state.mode, 'available');
  state = reduce(state, { type: 'tick' }, 180101);
  assert.equal(state.inference, null);
});

test('忽略重复、自己发送、静音和已读消息', () => {
  let state = createState(0);
  for (const extra of [{ fromSelf: true }, { muted: true }, { read: true }]) state = reduce(state, { type: 'message', id: 'bad', ...extra }, 1);
  assert.equal(state.queue.length, 0);
  state = reduce(state, { type: 'message', id: 'unique' }, 1);
  state = reduce(state, { type: 'message', id: 'unique' }, 2);
  assert.equal(state.queue.length, 1);
});

test('清空本地邮包保留去重记录，避免下一轮重复提醒', () => {
  let state = reduce(createState(), { type: 'message', id: 'seen' });
  state = reduce(state, { type: 'clear' });
  state = reduce(state, { type: 'message', id: 'seen' });
  assert.equal(state.queue.length, 0);
});

test('手动休息优先于日程，且日程结束会被清除', () => {
  let state = reduce(createState(0), { type: 'mode', mode: 'rest' }, 0);
  state = reduce(state, { type: 'calendar', end: 10000 }, 1);
  assert.equal(presentation(state, 2).mode, 'rest');
  state = reduce(state, { type: 'calendar', end: 0 }, 3);
  assert.equal(state.inference, null);
});

test('日历兼容 CLI datetime 数组，过滤全天、空闲、拒绝和取消事件', () => {
  const now = Date.parse('2026-10-28T08:30:00Z');
  const valid = { start_time: { datetime: '2026-10-28T08:00:00Z' }, end_time: { datetime: '2026-10-28T09:00:00Z' } };
  assert.deepEqual(normalizeCalendar([valid], now), { start: Date.parse('2026-10-28T08:00:00Z'), end: Date.parse('2026-10-28T09:00:00Z') });
  assert.equal(normalizeCalendar([{ ...valid, status: 'cancelled' }, { ...valid, self_attendee_status: 'decline' }, { ...valid, free_busy_status: 'free' }, { start_time: { date: '2026-10-28' }, end_time: { date: '2026-10-29' } }], now), null);
});

test('日历兼容底层 timestamp，排除过去与未来日程', () => {
  const current = { start_time: { timestamp: '1000' }, end_time: { timestamp: '2000' } };
  assert.deepEqual(normalizeCalendar({ items: [current] }, 1500000), { start: 1000000, end: 2000000 });
  assert.equal(normalizeCalendar([current], 2000001), null);
  assert.equal(normalizeCalendar([current], 999999), null);
});

test('未来的任意网页不能通过 chatId 注入外部链接', () => {
  const state = reduce(createState(), { type: 'message', id: 'badlink', chatId: 'https://evil.invalid' });
  assert.equal(state.queue[0].chatId, null);
});

test('可见通知有容量上限，长时间运行不无限保留正文', () => {
  let state = createState();
  for (let i = 0; i < 1200; i++) state = reduce(state, { type: 'message', id: `m${i}`, text: 'x'.repeat(1000) });
  assert.equal(state.queue.length, 120);
  assert.equal(state.seen.length, 1000);
  assert.equal(state.queue[0].text.length, 160);
});
