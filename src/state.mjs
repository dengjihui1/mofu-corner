export const MODES = Object.freeze(['available', 'focus', 'meeting', 'rest']);
const MAX_QUEUE = 120;
const safeText = (value, max = 160) => String(value ?? '').replace(/[\u0000-\u001f]/g, ' ').slice(0, max);

export function createState(now = Date.now()) {
  return { mode: 'available', source: 'local', until: null, queue: [], seen: [], affection: 0, lastInteraction: null, connected: false, brand: 'feishu', lastSync: null, inference: null, lastAlertAt: 0, createdAt: now };
}

export function reduce(state, action, now = Date.now()) {
  if (!action || typeof action.type !== 'string') return state;
  if (action.type === 'mode') {
    if (!MODES.includes(action.mode)) return state;
    const minutes = Number(action.minutes);
    return { ...state, mode: action.mode, source: 'local', until: action.mode === 'focus' ? now + Math.min(120, Math.max(1, Number.isFinite(minutes) ? minutes : 25)) * 60000 : null };
  }
  if (action.type === 'tick') {
    const next = { ...state };
    if (next.until && now >= next.until) { next.mode = 'available'; next.until = null; }
    if (next.inference && now >= next.inference.expiresAt) next.inference = null;
    return next;
  }
  if (action.type === 'calendar') {
    const end = Number(action.end);
    if (!Number.isFinite(end) || end <= now) return { ...state, inference: null };
    return { ...state, inference: { kind: 'calendar_busy', expiresAt: Math.min(end, now + 180000), title: '当前有日程', source: action.demo ? 'demo' : 'calendar' }, lastSync: now };
  }
  if (action.type === 'connection') return { ...state, connected: action.connected === true, brand: action.brand === 'lark' ? 'lark' : 'feishu', lastSync: action.connected ? now : state.lastSync, inference: action.connected ? state.inference : null };
  if (action.type === 'interact') {
    if (!['pet', 'feed', 'highfive'].includes(action.kind)) return state;
    return { ...state, affection: Math.min(999, state.affection + 1), lastInteraction: { kind: action.kind, at: now } };
  }
  if (action.type === 'message') {
    const id = safeText(action.id, 120);
    if (!id || state.seen.includes(id) || action.fromSelf || action.muted || action.read) return state;
    const msg = { id, from: safeText(action.from || '新消息', 30), text: safeText(action.text), urgent: action.urgent === true, source: action.demo ? 'demo' : 'api', chatId: /^oc_[A-Za-z0-9]+$/.test(action.chatId || '') ? action.chatId : null, at: now };
    return { ...state, queue: [...state.queue, msg].slice(-MAX_QUEUE), seen: [...state.seen, id].slice(-1000) };
  }
  // Local dismissal is deliberately separate from upstream read status.
  if (action.type === 'dismiss') return { ...state, queue: state.queue.filter(m => m.id !== action.id) };
  if (action.type === 'clear') return { ...state, queue: [] };
  return state;
}

export function presentation(state, now = Date.now()) {
  const quiet = state.mode !== 'available' || Boolean(state.inference);
  const fresh = state.queue.at(-1);
  const descriptions = {
    available: ['我在，慢慢来。', '陪你把今天过好。'],
    focus: ['你专心，我陪你。', '先做眼前这一件事，忙完一起歇歇。'],
    meeting: ['会议中，我轻一点。', '这是你手动设置的本地模式。'],
    rest: ['休息也算正经事。', '我在旁边，等你慢慢回来。'],
  };
  let mode = state.mode;
  let label = descriptions[mode][0];
  let detail = descriptions[mode][1];
  if (state.inference && mode === 'available') { mode = 'scheduled'; label = '日程时间，安静陪你。'; detail = '根据日历时间推断，不代表已经入会。'; }
  if (fresh && !quiet) { mode = 'mail'; label = fresh.source === 'demo' ? '有一封示例来信。' : '有一封新来信。'; detail = `${fresh.from} · ${fresh.text}`; }
  if (state.lastInteraction && now - state.lastInteraction.at < 2200) mode = state.lastInteraction.kind === 'feed' ? 'eating' : 'happy';
  return { mode, label, detail, quiet, count: state.queue.length, source: state.inference?.source === 'calendar' ? '日程推断' : state.inference?.source === 'demo' ? '示例日程' : '本地模式', minutesLeft: state.until ? Math.max(0, Math.ceil((state.until - now) / 60000)) : null };
}
