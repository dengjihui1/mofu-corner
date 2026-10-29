const { app, BrowserWindow } = require('electron');
app.disableHardwareAcceleration();
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const scratch = path.resolve(root, '..', '..', 'work');
fs.mkdirSync(scratch, { recursive: true });
app.setPath('userData', fs.mkdtempSync(path.join(scratch, 'preview-test-')));
app.commandLine.appendSwitch('force-device-scale-factor', '1');
app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: 1280, height: 800, show: false, webPreferences: { offscreen: true, backgroundThrottling: false, contextIsolation: true, sandbox: true, nodeIntegration: false } });
  try {
    await win.loadFile(path.join(root, 'ui', 'index.html'));
    const checks = await win.webContents.executeJavaScript(`(${previewScenario.toString()})()`);
    await win.loadFile(path.join(root, 'ui', 'index.html'));
    const reload = await win.webContents.executeJavaScript(`document.querySelector('.pet-caption h2').textContent.includes('云朵') && JSON.parse(localStorage.getItem('paperpal.character.v2')).size === 0.9`);
    if (!reload) throw new Error('PREVIEW_RELOAD_FAILED');
    await win.webContents.executeJavaScript(`document.querySelector('[data-mode="focus"]').click(); new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))`);
    await win.webContents.executeJavaScript('new Promise(resolve => setTimeout(resolve, 240))');
    await saveFrame(win, 'mvp-local-preview.png');
    const desktopLayout = await win.webContents.executeJavaScript('({ viewport: innerWidth, content: document.documentElement.scrollWidth })');
    if (desktopLayout.content > desktopLayout.viewport) throw new Error('DESKTOP_HORIZONTAL_OVERFLOW');
    await win.webContents.executeJavaScript('document.querySelector("[data-configure]").click()');
    await saveFrame(win, 'mvp-settings.png');
    const modal = await win.webContents.executeJavaScript('document.querySelector("#settings-dialog").getBoundingClientRect().bottom <= innerHeight');
    if (!modal) throw new Error('SETTINGS_OUT_OF_VIEWPORT');
    await win.webContents.executeJavaScript('document.querySelector("#settings-dialog").close()');
    win.setContentSize(390, 844);
    await saveFrame(win, 'mvp-mobile.png');
    const mobileLayout = await win.webContents.executeJavaScript('({ viewport: innerWidth, content: document.documentElement.scrollWidth })');
    if (mobileLayout.content > mobileLayout.viewport) throw new Error('MOBILE_HORIZONTAL_OVERFLOW');
    const report = { date: new Date().toISOString(), checks, savedConfigurationRestored: reload, desktopLayout, mobileLayout, modalFitsViewport: modal, mouseAndKeyboardUsed: false, screenshot: 'design/mvp-local-preview.png', settings: 'design/mvp-settings.png', mobile: 'design/mvp-mobile.png' };
    fs.writeFileSync(path.join(root, 'docs', 'preview-validation.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2)); app.quit();
  } catch (error) { console.error(error.message); app.exit(1); }
});
setTimeout(() => { console.error('PREVIEW_TIMEOUT'); app.exit(1); }, 25000).unref();

async function saveFrame(win, name) {
  await win.webContents.executeJavaScript('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 260))))');
  const frame = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('PAINT_TIMEOUT')), 5000);
    const listener = (_event, _rect, image) => { const png = image.toPNG(); if (!png.length) return; win.webContents.removeListener('paint', listener); clearTimeout(timeout); resolve(png); };
    win.webContents.on('paint', listener);
  });
  win.webContents.invalidate();
  fs.writeFileSync(path.join(root, 'design', name), await frame);
}

async function previewScenario() {
  const checks = [];
  const assert = (value, label) => { if (!value) throw new Error(label); checks.push(label); };
  const get = selector => document.querySelector(selector);
  const next = () => new Promise(resolve => setTimeout(resolve, 30));
  assert(get('.mail-card').hidden && !get('#companion-card').hidden && get('#sample-calendar').hidden, 'default-is-local-companion');
  assert(get('.demo-pill').textContent.includes('无需登录') && !document.body.classList.contains('demo'), 'no-account-prompt');
  get('[data-configure]').click();
  get('#pet-name').value = '取消昵称'; get('#pet-name').dispatchEvent(new Event('input', { bubbles: true }));
  assert(document.title.includes('取消昵称'), 'name-preview');
  get('#settings-cancel').click(); await next();
  assert(document.title.includes('云朵'), 'cancel-restores-original');
  get('[data-configure]').click(); get('#settings-reset').click(); get('#settings-save').click(); await next();
  assert(!get('#settings-dialog').open && JSON.parse(localStorage.getItem('paperpal.character.v2')).name === '云朵', 'save-default-character');
  get('[data-mode="focus"]').click();
  assert(get('#mood-title').textContent.includes('你专心') && get('#focus-clock').textContent === '25:00', 'local-focus-without-messages');
  get('[data-interact="feed"]').click();
  assert(get('#mascot-mount .pet-surface').classList.contains('mood--eating'), 'feed-animation');
  const pose = getComputedStyle(get('#mascot-mount .sprite-pet'));
  assert(parseFloat(pose.backgroundPositionX) === 0 && pose.backgroundPositionY === '100%', 'feeding-uses-biscuit-artwork');
  return checks;
}
