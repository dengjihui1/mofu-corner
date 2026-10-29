import { createState, reduce, presentation } from '../src/state.mjs';
import { mascot } from './mascot.mjs';
import { dragon } from './cloud-dragon.mjs';
import { ActivityDirector } from './activity.mjs';
import {zodiacSprite} from './zodiac-sprite.mjs';
import { DEFAULT_CHARACTER, CATALOG, ZODIAC, createCharacter, validateCharacter } from '../src/character.mjs';
const desktop = new URLSearchParams(location.search).get('desktop') === '1';
const bridge = desktop && window.paperpal;
const demo = new URLSearchParams(location.search).get('demo') === '1';
let state = createState();
let toastTimer;
let mailKey = '';
let character = { ...DEFAULT_CHARACTER };
let savedCharacter = { ...character };
let renderedSpecies = '';
let settingsSpecies = character.species;
let companion = { followHost: false, canFollow: false, host: { status: 'desktop' } };
const activity = new ActivityDirector();
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let hoveringPet = false;
let hintUntil = Date.now() + 3000;
let hintMessage = '';
function applyCharacter(value = DEFAULT_CHARACTER) {
  character = validateCharacter(value);
  const preset = CATALOG.find(c => c.id === character.species);
  if (renderedSpecies !== character.species) {
    const markup = !['dragon','otter'].includes(character.species) ? zodiacSprite(character.species) : character.species === 'dragon' ? dragon : mascot.replace('<g class="envelope">', '<g class="character-scarf"><path d="M111 174q39 18 79 0l-3 15q-36 18-72-1Z" style="fill:var(--stamp-color,#d99b79)"/><path d="m178 185 18 29-19 7-10-33" style="fill:var(--stamp-color,#d99b79)"/></g><g class="envelope">');
    for (const mount of ['mascot-mount', 'desktop-mascot', 'settings-preview']) {
      // Hidden scenes must not own another visible SVG's paint-server IDs.
      $(mount).innerHTML = markup.replace(/\bid="([^"]+)"/g, (_, id) => `id="${mount}-${id}"`).replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${mount}-${id})`);
      const button = $(mount).querySelector('.pet-surface');
      const motion = document.createElement('span'); motion.className = 'pet-motion';
      motion.append(...button.childNodes); button.append(motion);
    }
    renderedSpecies = character.species;
  }
  document.documentElement.style.setProperty('--bag-color', character.bag);
  const rgb = character.bag.slice(1).match(/../g).map(v => parseInt(v, 16) / 255);
  const hi = Math.max(...rgb), lo = Math.min(...rgb), delta = hi - lo;
  let hue = delta ? hi === rgb[0] ? ((rgb[1] - rgb[2]) / delta) % 6 : hi === rgb[1] ? (rgb[2] - rgb[0]) / delta + 2 : (rgb[0] - rgb[1]) / delta + 4 : 0;
  hue = (hue * 60 + 360) % 360;
  document.documentElement.style.setProperty('--pet-hue', `${hue - 219}deg`);
  document.documentElement.style.setProperty('--stamp-color', character.stamp);
  document.documentElement.style.setProperty('--pet-scale', character.size);
  document.documentElement.style.setProperty('--pet-growth', `${Math.max(0, character.size - 1) * 170}px`);
  document.body.classList.toggle('no-scarf', !character.scarf);
  document.body.dataset.personality = character.personality;
  for (const b of document.querySelectorAll('.pet-surface')) b.setAttribute('aria-label', `摸摸${preset.name}${character.name}`);
  document.querySelector('.pet-caption h2').innerHTML = `${escape(character.name)} <span>${preset.name}</span>`;
  document.querySelector('.edition b').textContent = preset.zodiac ? `${preset.zodiac} · 生肖伙伴` : '经典伙伴';
  document.querySelector('.breed-tag').textContent = preset.zodiac ? `生肖伙伴 · ${preset.zodiac}` : '经典伙伴 · 小獭';
  $('pet-hint').textContent = `点点${character.name}，给今天一点小惊喜。`;
  $('character-description').textContent = preset.description;
  $('personality-label').textContent = ({ gentle: '温柔陪伴', playful: '有一点淘气', quiet: '安静守候' })[character.personality];
  document.querySelector('.settings-dialog .dialog-top h2').textContent = `把${character.name}，变成你的样子。`;
  document.querySelector('.mail-card h3').firstChild.textContent = `${character.name}的邮包 `;
  document.querySelector('.desktop-controls>b').textContent = `${character.name}的陪伴模式`;
  const label = document.querySelector('.drag-label'); if (label) label.textContent = `${character.name} · 拖动`;
  document.title = `纸伴 PaperPal · ${character.name}的陪伴小屋`;
}
const $ = id => document.getElementById(id);
const escape = str => String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const labels = { available: '自在陪伴', focus: '专注陪伴', meeting: '轻声会议', rest: '一起歇歇', scheduled: '日程时间', mail: '来信敲门', happy: '开心一下', eating: '小饼时间' };

document.body.classList.toggle('desktop', desktop);
document.querySelectorAll('svg.icon').forEach(icon => icon.setAttribute('aria-hidden', 'true'));
document.body.classList.toggle('demo', demo);
document.querySelector('.mail-card').hidden = !demo;
$('companion-card').hidden = demo;
$('sample-calendar').hidden = $('dialog-calendar').hidden = !demo;
if (demo) document.querySelector('.demo-pill').innerHTML = '<span></span>功能演示 · 示例数据';
if (desktop) {
  const label = document.createElement('span'); label.className = 'drag-label'; label.textContent = '折折 · 拖动这里搬家'; $('desktop-companion').append(label);
  $('desktop-demo-mail').hidden = !demo;
}

function toast(text) { $('toast').textContent = text; $('toast').classList.add('shown'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('shown'), 2300); }
async function dispatch(action) {
  if (bridge) { const snapshot = await bridge.act(action); if (snapshot) { state = snapshot.state; render(); } }
  else { state = reduce(state, action); render(); }
}

function render() {
  const view = presentation(state);
  refreshMotion(view);
  $('status-chip').innerHTML = `<i></i>${escape(labels[view.mode])}`;
  $('provenance').textContent = view.source;
  $('sample-calendar').textContent = state.inference?.source === 'demo' ? '结束示例日程' : '体验日程联动';
  const phrase = view.mode === 'available' ? ({ gentle: view.label, playful: '走，一起把今天过好！', quiet: '我在旁边，安静陪你。' }[character.personality]) : view.label;
  $('mood-title').textContent = phrase;
  $('stage-greeting').textContent = view.mode === 'available' ? '今天，也一起慢慢来。' : phrase;
  $('mood-detail').textContent = view.detail;
  $('affection').textContent = state.affection;
  $('mail-count').textContent = view.count;
  $('focus-note').textContent = view.minutesLeft !== null ? `↳ 还有 ${view.minutesLeft} 分钟，专心做眼前这一件事。` : '↳ 模式由你掌控，不会修改飞书状态。';
  const seconds = state.until ? Math.max(0, Math.ceil((state.until - Date.now()) / 1000)) : 1500;
  $('focus-clock').textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  $('clock-caption').textContent = state.until ? '专注进行中，小伙伴陪着你' : '一段留给自己的专注时间';
  $('start-focus').disabled = Boolean(state.until);
  $('start-focus').textContent = state.until ? '专注进行中，加油。' : '开始 25 分钟专注 ↗';
  document.querySelectorAll('[data-mode]').forEach(b => { b.classList.toggle('selected', b.dataset.mode === state.mode); b.setAttribute('aria-pressed', String(b.dataset.mode === state.mode)); });
  const rows = state.queue.slice(-2).reverse().map(m => `<div class="mail-item"><span class="mail-icon">↗</span><div class="mail-content"><b>${escape(m.from)}</b><p>${escape(m.text)}</p></div><button data-dismiss="${escape(m.id)}" aria-label="从本地邮包移除这封消息">✓</button></div>`).join('');
  if (rows !== mailKey || !$('mail-list').hasChildNodes()) {
    mailKey = rows;
    $('mail-list').innerHTML = rows || `<div class="mail-empty">邮包空空，日子松松。<br>有新消息时，小伙伴会轻轻提醒。</div>`;
    $('desktop-mail-list').innerHTML = rows;
  }
  $('desktop-source').textContent = demo ? `体验模式 · ${view.source}` : view.source;
  $('desktop-label').textContent = Date.now() < hintUntil && hintMessage ? hintMessage : phrase;
  $('desktop-detail').textContent = state.until ? `还有 ${view.minutesLeft} 分钟，一起慢慢完成。` : view.detail;
  $('desktop-detail').hidden = desktop && Date.now() < hintUntil && Boolean(hintMessage);
  const hostBrand = companion.host.brand === 'lark' ? 'Lark' : '飞书';
  const hostDetail = ({ desktop: '无需账号授权，也能一起办公。', searching: '正在寻找飞书 / Lark 窗口。', ready: `正在跟随 ${hostBrand}，切走时安静退后。`, minimized: `${hostBrand} 已收起，小伙伴也安静退后。`, missing: '暂未发现客户端，先在桌面陪你。', error: '暂时无法跟随窗口，可切回桌面陪伴。' })[companion.host.status] || '';
  if (!state.connected) { $('connection-label').textContent = companion.followHost ? `${hostBrand} · 窗口陪伴` : '飞书 / Lark 旁的小伙伴'; $('connection-detail').textContent = hostDetail; }
  if (!state.connected) $('desktop-mode-source').textContent = companion.followHost ? hostDetail : '本地陪伴，不读取聊天消息';
  document.querySelectorAll('[data-follow]').forEach(button => { button.hidden = !desktop; button.disabled = !companion.canFollow; button.title = companion.canFollow ? '只读取窗口位置，不读取聊天内容' : '窗口跟随暂支持 Windows'; button.textContent = companion.followHost ? '已开启窗口陪伴 · 切回桌面' : '跟随飞书 / Lark 窗口'; button.setAttribute('aria-pressed', String(companion.followHost)); });
  if (state.connected) { $('connection-label').textContent = '飞书日历 · 已连接'; $('connection-detail').textContent = '日程仅用于推断忙闲，不代表实际入会。'; }
  document.querySelectorAll('[data-dismiss]').forEach(b => b.onclick = () => { dispatch({ type: 'dismiss', id: b.dataset.dismiss }); toast('已从本地邮包移除，未修改飞书已读状态。'); });
}

function refreshMotion(view = presentation(state)) {
  const panelOpen = Boolean(document.querySelector('dialog[open]')) || desktop && !$('desktop-controls').hidden;
  const action = activity.step({ personality: character.personality, allowed: view.mode === 'available' && !hoveringPet && !panelOpen && !reducedMotion.matches && !document.hidden });
  for (const pet of document.querySelectorAll('.pet-surface')) {
    const className = `pet-surface mood--${view.mode}${character.species === 'dragon' ? ' species-dragon' : ''}`;
    if (pet.className !== className) pet.className = className;
    const kind = action?.kind || '';
    if ((pet.dataset.idleMotion || '') !== kind) {
      if (kind) { pet.dataset.idleMotion = kind; pet.style.setProperty('--activity-duration', `${action.duration}ms`); }
      else { delete pet.dataset.idleMotion; pet.style.removeProperty('--activity-duration'); }
    }
  }
  if (desktop) {
    const hide = panelOpen || !(hoveringPet || Date.now() < hintUntil);
    if ($('desktop-note').hidden !== hide) $('desktop-note').hidden = hide;
  }
}

document.addEventListener('pointerover', e => { const pet = e.target.closest('.pet-surface'); if (pet && !pet.contains(e.relatedTarget)) { hoveringPet = true; refreshMotion(); } });
document.addEventListener('pointerout', e => { const pet = e.target.closest('.pet-surface'); if (pet && !pet.contains(e.relatedTarget)) { hoveringPet = false; hintUntil = Math.max(hintUntil, Date.now() + 600); refreshMotion(); } });
document.addEventListener('visibilitychange', () => refreshMotion());
reducedMotion.addEventListener('change', () => refreshMotion());

document.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => dispatch({ type: 'mode', mode: b.dataset.mode, minutes: 25 }));
document.querySelectorAll('[data-interact]').forEach(b => b.onclick = () => interact(b.dataset.interact));
document.addEventListener('click', e => { if (e.target.closest('.pet-surface')) interact('pet'); });
document.addEventListener('pointermove', e => { const b = e.target.closest('.pet-surface'); if (b) { const box = b.getBoundingClientRect(); b.style.setProperty('--look-x', `${Math.max(-3, Math.min(3, (e.clientX - box.left - box.width / 2) / 30))}px`); b.style.setProperty('--look-y', `${Math.max(-2, Math.min(2, (e.clientY - box.top - box.height / 2) / 40))}px`); } });
document.addEventListener('pointerout', e => { const b = e.target.closest('.pet-surface'); if (b && !b.contains(e.relatedTarget)) { b.style.setProperty('--look-x', '0px'); b.style.setProperty('--look-y', '0px'); } });
function interact(kind) {
  if (desktop) {
    hintMessage = kind === 'feed' ? '咔嚓，小饼真香。' : kind === 'highfive' ? '啪，一起加油！' : character.personality === 'playful' ? '再摸一下嘛。' : '嘿嘿，喜欢摸摸。';
    hintUntil = Date.now() + 3500;
  }
  dispatch({ type: 'interact', kind });
  if (!desktop) toast(kind === 'feed' ? '咔嚓，小饼真香。' : kind === 'highfive' ? '啪，一起加油！' : `${character.name}轻轻蹭了蹭你。`);
}
function sampleMessage() {
  if (bridge) dispatch({ type: 'demo-message' });
  else dispatch({ type: 'message', id: `demo_${Date.now()}`, from: '示例 · 设计协作群', text: '新方案已放好，方便时再看看。', demo: true });
  if (presentation(state).quiet) toast('示例来信已收进邮包，保持安静。');
}
$('sample-message').onclick = sampleMessage; $('desktop-demo-mail').onclick = sampleMessage;
$('clear-mail').onclick = () => { dispatch({ type: 'clear' }); toast('本地邮包已清空，未修改飞书消息。'); };
function sampleCalendar() {
  const ending = state.inference?.source === 'demo';
  if (bridge) dispatch({ type: 'demo-calendar' });
  else dispatch({ type: 'calendar', end: ending ? 0 : Date.now() + 900000, demo: true });
  toast(ending ? '示例日程已结束，恢复本地模式。' : '示例日程已开始。这只是时间推断，不表示已入会。');
}
$('sample-calendar').onclick = sampleCalendar;
$('dialog-calendar').onclick = () => { $('capability-dialog').close(); sampleCalendar(); };
$('capabilities').onclick = $('capabilities-top').onclick = () => $('capability-dialog').showModal();
$('close-dialog').onclick = () => $('capability-dialog').close();
$('capability-dialog').addEventListener('click', e => { if (e.target === $('capability-dialog')) { const r = e.target.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) e.target.close(); } });
$('desktop-toggle').onclick = () => { $('desktop-controls').hidden = !$('desktop-controls').hidden; };
document.querySelectorAll('[data-follow]').forEach(button => button.onclick = async () => {
  if (!bridge) return;
  const result = await bridge.act({ type: 'follow-host', enabled: !companion.followHost });
  if (result) { companion = result.companion; render(); }
});
function fillSettings(value) {
  settingsSpecies = value.species;
  $('pet-name').value = value.name; $('pet-color').value = value.bag; $('pet-accent').value = value.stamp;
  $('pet-size').value = String(value.size * 100); $('pet-size-label').textContent = `${Math.round(value.size * 100)}%`;
  $('pet-scarf').checked = value.scarf; $('pet-personality').value = value.personality;
  $('scarf-option').hidden = value.species !== 'otter';
  $('artwork-note').hidden = value.species !== 'dragon';
  $('character-catalog').innerHTML = CATALOG.map(c => `<button type="button" data-species="${c.id}" class="character-choice ${settingsSpecies === c.id ? 'selected' : ''}" aria-pressed="${settingsSpecies === c.id}"><span class="choice-symbol">${c.zodiac || '獭'}</span><span><b>${c.name}</b><small>${c.description}</small></span><em>${c.zodiac ? '已开放' : '额外角色'}</em></button>`).join('');
  $('zodiac-progress').innerHTML = ZODIAC.map(z => `<span class="available" title="已开放">${z}</span>`).join('');
}
function readSettings() { return validateCharacter({ schema: DEFAULT_CHARACTER.schema, species: settingsSpecies, name: $('pet-name').value, bag: $('pet-color').value, stamp: $('pet-accent').value, size: Number($('pet-size').value) / 100, scarf: $('pet-scarf').checked, personality: $('pet-personality').value }); }
function previewSettings() {
  $('pet-size-label').textContent = `${$('pet-size').value}%`;
  try { applyCharacter(readSettings()); render(); $('settings-feedback').textContent = '正在预览，点击「保存并应用」保留。'; }
  catch { $('settings-feedback').textContent = '请输入 1–16 个字的昵称。'; }
}
function openSettings() { if ($('settings-dialog').open) return; savedCharacter = { ...character }; fillSettings(character); $('settings-feedback').textContent = '改动可即时预览，保存后生效。'; $('settings-dialog').showModal(); }
document.querySelectorAll('[data-configure]').forEach(b => b.onclick = openSettings);
$('settings-form').addEventListener('input', previewSettings);
$('character-catalog').onclick = e => {
  const button = e.target.closest('[data-species]'); if (!button) return;
  const next = createCharacter({ species: button.dataset.species });
  fillSettings(next); previewSettings();
};
document.querySelectorAll('[data-palette]').forEach(b => b.onclick = () => { const p = { jade: ['#9ac8b5', '#e9bb9d'], sky: ['#a9c3f3', '#ffb99c'], peach: ['#efb0bd', '#b6c9eb'] }[b.dataset.palette]; $('pet-color').value = p[0]; $('pet-accent').value = p[1]; previewSettings(); });
$('settings-reset').onclick = () => { fillSettings(createCharacter({ species: settingsSpecies })); previewSettings(); };
$('settings-close').onclick = $('settings-cancel').onclick = () => $('settings-dialog').close();
$('settings-dialog').addEventListener('close', () => { applyCharacter(savedCharacter); render(); });
$('settings-form').addEventListener('submit', async e => {
  e.preventDefault(); $('settings-save').disabled = true;
  try {
    const value = readSettings();
    if (bridge) { const result = await bridge.act({ type: 'character-save', character: value }); if (!result || result.settingsError) throw new Error('save'); savedCharacter = result.character; }
    else { localStorage.setItem('paperpal.character.v2', JSON.stringify(value)); savedCharacter = value; }
    $('settings-dialog').close();
    if (desktop) { hintMessage = '已保存，我就在这里。'; hintUntil = Date.now() + 2000; refreshMotion(); }
    else toast('已保存。下次启动仍会使用这只小伙伴。');
  } catch { $('settings-feedback').textContent = '保存未成功，请检查昵称或本机存储权限；也可取消恢复。'; }
  finally { $('settings-save').disabled = false; }
});
if (bridge) {
  bridge.onConfigure(openSettings);
  const snapshot = await bridge.snapshot();
  if (snapshot) { state = snapshot.state; companion = snapshot.companion; applyCharacter(snapshot.character); savedCharacter = { ...character }; if (snapshot.error) $('desktop-mode-source').textContent = snapshot.error; }
  bridge.listen(snapshot => { state = snapshot.state; companion = snapshot.companion; if (!$('settings-dialog').open) { applyCharacter(snapshot.character); savedCharacter = { ...character }; } render(); if (snapshot.error) $('desktop-mode-source').textContent = snapshot.error; });
  let lastShape = '', shapeFrame = 0, lastModal = null;
  const updateShape = () => {
    shapeFrame = 0;
    // A modal needs its backdrop for click-away/keyboard focus. In normal mode,
    // the OS clips away unused areas, so click-through cannot get stuck on.
    const modal = document.querySelector('dialog[open]');
    if (Boolean(modal) !== lastModal) { lastModal = Boolean(modal); bridge.modal(lastModal); }
    const rectangles = modal ? [{ x: 0, y: 0, width: 440, height: 650 }] : [...document.querySelectorAll('.desktop-note,.desktop-controls,.desktop-gear,#desktop-mascot,.drag-label,.toast.shown')].filter(el => {
      const style = getComputedStyle(el); return style.display !== 'none' && style.visibility !== 'hidden';
    }).map(el => {
      let box = el.getBoundingClientRect();
      if (el.id === 'desktop-mascot') box = el.querySelector('.pet-surface').getBoundingClientRect();
      const x = Math.max(0, Math.floor(box.left - 14)), y = Math.max(0, Math.floor(box.top - 14));
      return { x, y, width: Math.min(440, Math.ceil(box.right + 14)) - x, height: Math.min(650, Math.ceil(box.bottom + 14)) - y };
    }).filter(r => r.width > 0 && r.height > 0);
    const key = JSON.stringify(rectangles);
    if (key !== lastShape) { lastShape = key; bridge.shape(rectangles); }
  };
  new MutationObserver(() => { if (!shapeFrame) shapeFrame = requestAnimationFrame(updateShape); }).observe(document.body, { attributes: true, childList: true, subtree: true, attributeFilter: ['class', 'style', 'open', 'hidden'] });
  updateShape();
} else {
  try { const saved = localStorage.getItem('paperpal.character.v2'); if (saved) character = validateCharacter(JSON.parse(saved)); } catch { toast('未能读取角色设置，先使用默认小云龙。'); }
  savedCharacter = { ...character }; applyCharacter(character);
  if (demo) {
    state = reduce(state, { type: 'message', id: 'demo_welcome', from: '示例 · 设计协作群', text: '今天的灵感，慢慢整理就好。', demo: true });
    state = reduce(state, { type: 'message', id: 'demo_note', from: '示例 · 产品小组', text: '文档已更新，方便时再看看。', demo: true });
  }
}
render();
if (bridge) {
  if (new URLSearchParams(location.search).get('configure') === '1') openSettings();
  bridge.ready($('settings-dialog').open);
}
setInterval(() => { if (!bridge) { state = reduce(state, { type: 'tick' }); render(); } }, 1000);
setInterval(refreshMotion, 250);
