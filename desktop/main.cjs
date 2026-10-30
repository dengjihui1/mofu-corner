const { app, BrowserWindow, ipcMain, screen, Menu, shell, Tray, nativeImage } = require('electron');
const { join } = require('node:path');
const { pathToFileURL } = require('node:url');
const fs = require('node:fs/promises');
const root = join(__dirname, '..');
const demo = process.argv.includes('--demo');
const docsCapture = process.argv.includes('--docs-capture');
const selfTest = process.argv.includes('--self-test') || docsCapture;
const smoke = process.argv.includes('--smoke') || selfTest;
const softwareTest=smoke && process.env.PAPERPAL_TEST_SOFTWARE_GL==='1';
// Intel macOS CI has no GPU. Use the documented software GLES driver only
// for explicit smoke/self tests; normal launches retain the system backend.
if(softwareTest){
  app.commandLine.appendSwitch('use-gl','angle');
  app.commandLine.appendSwitch('use-angle','swiftshader-webgl');
  // Trusted local test pages only, in an isolated temporary profile on the CI VM.
  app.commandLine.appendSwitch('enable-unsafe-swiftshader');
}
// Exercise the same GPU interpolation path in desktop verification as in normal use.
const brand = process.env.PAPERPAL_BRAND === 'lark' ? 'lark' : 'feishu';
const dataRoot = process.env.PAPERPAL_DATA_DIR || join(root, '.local');
const calendarEnabled = process.argv.includes('--experimental-calendar');
let character;
const {accountCharacter,canSaveCharacter}=require('../src/account-sync.cjs');
let postoffice, postofficeUnread=0, account=null;
let win, tray, state, reducer, presenter, error = '', polling = false;
let followHost = false, host = { status: 'desktop' }, stopWatching = () => {}, stopPointerTracking=()=>{},freePosition, docking = false;
let rendererReady = false;
let modalOpen = process.argv.includes('--configure');
const pendingLaunches = [];
const { validLaunchId, launchIdFrom } = require('../src/launch-args.cjs');
function launchReceipt(id, reused = false, settingsOpen = null) {
  if (!id) return;
  const syncFs = require('node:fs');
  syncFs.mkdirSync(join(dataRoot, 'run'), { recursive: true });
  syncFs.writeFileSync(join(dataRoot, 'run', `${id}.json`), JSON.stringify({ ready: true, launchId: id, pid: process.pid, version: app.getVersion(), reused, settingsOpen }), { mode: 0o600 });
}
require('node:fs').mkdirSync(join(dataRoot, 'desktop-runtime'), { recursive: true });
app.setPath('userData', join(dataRoot, 'desktop-runtime'));

if (!app.requestSingleInstanceLock({ paperpalLaunchId: launchIdFrom(process.argv), configure: process.argv.includes('--configure') })) app.quit();
else app.whenReady().then(async () => {
  app.setName('绒角 MofuCorner');
  if(process.platform==='darwin')app.dock?.hide();
  const engine = await import(pathToFileURL(join(root, 'src', 'state.mjs')).href);
  const characters = await import(pathToFileURL(join(root, 'src', 'character.mjs')).href);
  const storage = await import(pathToFileURL(join(root, 'src', 'storage.mjs')).href);
  const hosts = await import(pathToFileURL(join(root, 'src', 'host.mjs')).href);
  const platform=await import(pathToFileURL(join(root,'src','platform.mjs')).href),caps=platform.capabilities(),canFollow=caps.windowFollowing!=='unavailable';
  let footprints=hosts.DEFAULT_FOOTPRINTS, dockState={placement:'desktop',visible:false}, statusKey='',statusWrites=Promise.resolve();
  const loaded = await storage.loadCharacter(dataRoot);
  character = loaded.character;
  error = loaded.error || '';
  const petArg = process.argv.indexOf('--pet');
  if (petArg !== -1) {
    try {
      const petFile = process.argv[petArg + 1];
      if (!petFile || (await fs.stat(petFile)).size > 65536) throw new Error('invalid');
      character = characters.validateCharacter(JSON.parse(await fs.readFile(petFile, 'utf8')));
    } catch { console.error('角色配方无效：仅支持本地 JSON 名称与配色，不执行任何脚本。'); app.exit(1); return; }
  }
  reducer = engine.reduce; presenter = engine.presentation; state = engine.createState(); state.brand = brand;
  await fs.mkdir(dataRoot, { recursive: true });
  await fs.mkdir(join(dataRoot,'run'), { recursive: true });
  try {
    const saved = JSON.parse(await fs.readFile(join(dataRoot, 'preferences.json'), 'utf8'));
    if (engine.MODES.includes(saved.mode)) state.mode = saved.mode;
    if (Number.isFinite(saved.until) && saved.until > Date.now() && saved.until < Date.now() + 7200000) state.until = saved.until;
    else if (state.mode === 'focus') state.mode = 'available';
    state.affection = Math.min(999, Math.max(0, Number(saved.affection) || 0));
    followHost = saved.followHost === true && canFollow;
  } catch {}
  const area = screen.getPrimaryDisplay().workArea;
  win = new BrowserWindow({ width: 440, height: 650, x: area.x + area.width - 450, y: area.y + area.height - 660,
    transparent: true, backgroundColor: '#00000000', frame: false, resizable: false, alwaysOnTop: true, skipTaskbar: true, hasShadow: false,
    show: false, title: '绒角 MofuCorner', webPreferences: { preload: join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: !smoke, offscreen: selfTest },
  });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (event, url) => { if (url !== win.webContents.getURL()) event.preventDefault(); });
  win.webContents.session.setPermissionRequestHandler((_, __, callback) => callback(false));
  const allowed = event => event.sender === win.webContents && event.senderFrame === win.webContents.mainFrame;
  postoffice=await require('./postoffice.cjs')({root,dataRoot,allowedPet:allowed,smoke,onEvent:event=>{postofficeUnread=event.unread;if(Object.hasOwn(event,'account')){account=event.account;character=accountCharacter(character,account,characters.createCharacter);broadcast();}if(win&&!win.isDestroyed())win.webContents.send('paperpal:postoffice',{...event,quiet:state.mode!=='available'||modalOpen});}});
  account=postoffice.account();character=accountCharacter(character,account,characters.createCharacter);
  const petArea=()=>screen.getDisplayMatching(dockState.footprint||win.getBounds()).workArea;
  let snapshotSequence=0;
  const snapshot = () => ({ sequence:++snapshotSequence,state, view: presenter(state), demo, brand, error, character, account, postofficeUnread, companion: { followHost, host, platform:caps,docking:dockState,window:win.getBounds(),settingsOpen:modalOpen,workArea:petArea(),canFollow } });
  const recordStatus=()=>{const value={pid:process.pid,brand:host.brand||brand,hostStatus:host.status,hostActive:host.active===true,followHost,petSize:character.size,settingsOpen:modalOpen,docking:dockState,window:win.getBounds(),windowVisible:win.isVisible()};const key=JSON.stringify(value);if(key===statusKey)return;statusKey=key;statusWrites=statusWrites.catch(()=>{}).then(()=>fs.writeFile(join(dataRoot,'run','window-status.json'),key,{mode:0o600})).catch(()=>{});};
  const broadcast = () => { if (win && !win.isDestroyed()) win.webContents.send('paperpal:update', snapshot()); };
  const act = action => { state = reducer(state, action); broadcast(); };
  const moveFrame=(x,y)=>{const p=win.getPosition();if(p[0]===x&&p[1]===y)return;docking=true;win.setPosition(Math.round(x),Math.round(y));docking=false;};
  const fitSettings=()=>{const a=petArea(),r=win.getBounds();moveFrame(Math.max(a.x,Math.min(a.x+Math.max(0,a.width-r.width),r.x)),Math.max(a.y,Math.min(a.y+Math.max(0,a.height-r.height),r.y)));};
  const parkDesktop=()=>{const r=footprints.body,a=petArea(),p=freePosition;const x=Math.max(a.x,Math.min(a.x+a.width-r.width,p?p[0]+r.x:a.x+a.width-r.width-12)),y=Math.max(a.y,Math.min(a.y+a.height-r.height,p?p[1]+r.y:a.y+a.height-r.height-12));moveFrame(x-r.x,y-r.y);dockState={placement:'desktop',visible:true,footprint:{x,y,width:r.width,height:r.height}};recordStatus();};
  const applyHost = value => {
    host = value;
    if (!followHost) return;
    if (modalOpen) { broadcast();recordStatus();return; }
    if (value.status === 'ready' && value.active) {
      const bounds = process.platform==='win32'?screen.screenToDipRect(null,value.bounds):value.bounds;
      const position = hosts.dockPosition(bounds, screen.getDisplayMatching(bounds).workArea,footprints);
      dockState={...position,hostBounds:bounds};
      if(position.visible){moveFrame(position.x,position.y);if(!smoke&&!win.isVisible())win.showInactive();}
      else win.hide();
    } else { dockState={placement:'tray',visible:false,reason:value.status==='minimized'?'client-minimized':value.status==='ready'?'client-inactive':'client-not-found'};win.hide(); }
    tray?.setToolTip(dockState.reason==='no-exterior-space'?'绒角 · 窗口外空间不足，已收进托盘':'绒角 MofuCorner · 窗口外侧陪伴');
    broadcast();
    recordStatus();
  };
  const setFollowing = enabled => {
    stopWatching(); stopWatching = () => {};
    const before = followHost;
    followHost = enabled === true && canFollow;
    if(!smoke)try{require('node:fs').writeFileSync(join(dataRoot,'preferences.json'),JSON.stringify({mode:state.mode,until:state.until,affection:state.affection,followHost}),{mode:0o600});}catch{}
    if (followHost) {
      if (!before) freePosition = win.getPosition();
      host = { status: 'searching' };
      if(!modalOpen){dockState={placement:'tray',visible:false,reason:'client-not-found'};win.hide();}
      if (!smoke) stopWatching = hosts.watchHost({ onUpdate: applyHost, onError: () => applyHost({ status: 'error' }) });
    } else {
      host = { status: 'desktop' };
      if(modalOpen)fitSettings();else parkDesktop();
      if (!smoke && !win.isVisible()) win.showInactive();
    }
    broadcast();
    recordStatus();
  };
  win.on('will-move', () => { if (followHost && !docking) { freePosition=win.getPosition();setFollowing(false); } });
  ipcMain.on('paperpal:modal', (event, open) => {
    if (!allowed(event) || typeof open !== 'boolean') return;
    modalOpen = open;
    if(open)fitSettings();
    if (!smoke && open && !win.isVisible()) win.show();
    if (!open && followHost) applyHost(host);
    else if(!open)parkDesktop();
    recordStatus();
  });
  ipcMain.handle('paperpal:get', event => allowed(event) ? snapshot() : null);
  ipcMain.on('paperpal:ready', async (event, settingsOpen) => {
    if (!allowed(event)) return;
    rendererReady = true;
    if(!smoke){if(modalOpen){fitSettings();win.show();}else if(followHost)applyHost(host);else{parkDesktop();win.showInactive();}}recordStatus();
    launchReceipt(launchIdFrom(process.argv), false, settingsOpen === true);
    for (const request of pendingLaunches.splice(0)) {
      if (request.configure) win.webContents.send('paperpal:configure');
      launchReceipt(request.id, true, settingsOpen === true);
    }
    if (!smoke) return;
    if (selfTest) {
      try {
        // The real page is ready before emulating this test-only media preference.
        win.webContents.debugger.attach('1.3');
        await win.webContents.debugger.sendCommand('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
        if(docsCapture){
          await require('../scripts/capture-native.cjs')(win,process.env.MOFUCORNER_CAPTURE_DIR);
          console.log(JSON.stringify({documentationScreenshots:'passed'}));app.quit();return;
        }
        const scenario = require('../tests/desktop-scenario.cjs');
        const result = await win.webContents.executeJavaScript(`(${scenario.toString()})({timeout:${softwareTest?20000:8000}})`);
        const stored = await storage.loadCharacter(dataRoot);
        if (stored.error || stored.character.name !== result.savedName || stored.character.size !== 1.3) throw new Error('DISK_PERSISTENCE_FAILED');
        await win.webContents.executeJavaScript('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
        const paint = new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error('PAINT_TIMEOUT')), 5000); const listener = (_event, _dirty, image) => { const png = image.toPNG(); if (!png.length) return; win.webContents.removeListener('paint', listener); clearTimeout(timer); resolve(png); }; win.webContents.on('paint', listener); });
        win.webContents.invalidate();
        const png = await paint;
        const screenshot = process.env.PAPERPAL_TEST_SCREENSHOT;
        if (screenshot) await fs.writeFile(screenshot, png);
        console.log(JSON.stringify({ desktopTest: 'passed', ...result, diskPersistence: true, windowHidden: !win.isVisible(), sandbox: true, tray: Boolean(tray), brand }));
        app.quit();
      } catch (failure) { console.error('DESKTOP_TEST_FAILED', failure.message); console.error(await win.webContents.executeJavaScript('JSON.stringify({hidden:document.hidden,reducedMotion:matchMedia("(prefers-reduced-motion: reduce)").matches,portrait:document.querySelector("#portrait")?.dataset})')); app.exit(1); }
    } else { console.log(JSON.stringify({ smoke: 'passed', renderer: true, windowHidden: win.isVisible() === false, sandbox: true, tray: Boolean(tray), character: character.name, demo, brand, messageCount: state.queue.length, calendarEnabled, companionOnly: !demo && !calendarEnabled })); setTimeout(() => app.quit(), 200); }
  });
  let hitRegions=[];
  ipcMain.on('paperpal:shape', (event, rectangles) => {
    if (!allowed(event) || !Array.isArray(rectangles) || !rectangles.length || rectangles.length > 20) return;
    if (!rectangles.every(r => r && ['x', 'y', 'width', 'height'].every(k => Number.isInteger(r[k])) && r.x >= 0 && r.y >= 0 && r.width > 0 && r.height > 0 && r.x + r.width <= 440 && r.y + r.height <= 650)) return;
    hitRegions=rectangles;
    if(process.platform!=='darwin')win.setShape(rectangles);
  });
  if(process.platform==='darwin'){
    // setShape is not implemented on macOS. Ignore transparent areas instead.
    win.setVisibleOnAllWorkspaces(true,{visibleOnFullScreen:false,skipTransformProcessType:true});
    let previousIgnore=null;const timer=setInterval(()=>{if(win.isDestroyed())return;const ignore=!win.isVisible()||!platform.interactivePoint(screen.getCursorScreenPoint(),win.getBounds(),hitRegions);if(ignore!==previousIgnore){win.setIgnoreMouseEvents(ignore,{forward:true});previousIgnore=ignore;}},30);timer.unref();stopPointerTracking=()=>clearInterval(timer);
  }
  ipcMain.on('paperpal:layout',(event,value)=>{if(!allowed(event)||!hosts.validFootprints(value))return;footprints={body:{...value.body},side:{...value.side}};if(!modalOpen){if(followHost)applyHost(host);else if(!freePosition)parkDesktop();}recordStatus();});
  ipcMain.handle('paperpal:action', async (event, action) => {
    if (!allowed(event) || !action || typeof action.type !== 'string') return null;
    if (action.type === 'character-save') {
      if(!canSaveCharacter(action.character,account))return {...snapshot(),settingsError:'生肖已和账号绑定，不能更换；可以在小邮局给伙伴换装。'};
      try { const saved=await storage.saveCharacter(dataRoot, action.character);character=accountCharacter(saved,account,characters.createCharacter);broadcast(); }
      catch { return { ...snapshot(), settingsError: '未能保存，请检查配置内容与本机目录写入权限。' }; }
    }
    if (action.type === 'follow-host') setFollowing(action.enabled);
    if (selfTest && action.type === 'test-host') {const value=hosts.validateHost(action.host);if(process.platform==='win32'&&action.coordinates==='dip'&&value.bounds)value.bounds=screen.dipToScreenRect(null,value.bounds);applyHost(value);}
    if (['mode', 'interact', 'dismiss', 'clear'].includes(action.type)) act(action);
    if (action.type === 'demo-message' && demo) act({ type: 'message', id: `demo_${Date.now()}`, from: '示例 · 设计协作群', text: '新方案已放好，方便时再看看。', demo: true });
    if (action.type === 'demo-calendar' && demo) act({ type: 'calendar', end: state.inference?.source === 'demo' ? 0 : Date.now() + 900000, demo: true });
    if (action.type === 'open-chat') {
      const item = state.queue.find(m => m.id === action.id);
      if (item && item.source === 'api' && item.chatId) await shell.openExternal(`https://${brand === 'lark' ? 'applink.larksuite.com' : 'applink.feishu.cn'}/client/chat/open?openChatId=${encodeURIComponent(item.chatId)}`);
    }
    return snapshot();
  });
  win.webContents.on('context-menu', () => Menu.buildFromTemplate([
    { label: `摸摸${character.name}`, click: () => act({ type: 'interact', kind: 'pet' }) },
    { label: '喂一块小饼', click: () => act({ type: 'interact', kind: 'feed' }) },
    { label: '打开小邮局', click: () => postoffice.open() },
    { label: '定制小伙伴', click: () => win.webContents.send('paperpal:configure') },
    { type: 'separator' },
    { label: '专注 25 分钟', click: () => act({ type: 'mode', mode: 'focus', minutes: 25 }) },
    { label: '恢复陪伴', click: () => act({ type: 'mode', mode: 'available' }) },
    { label: '退出绒角', click: () => app.quit() },
  ]).popup({ window: win }));
  {
    const bitmap = Buffer.alloc(16 * 16 * 4);
    for (let y = 1; y < 15; y++) for (let x = 1; x < 15; x++) {
      const offset = (y * 16 + x) * 4;
      const letter = (y === 5 || y === 11) && x >= 4 && x <= 12 || (x === 4 || x === 12) && y >= 5 && y <= 11 || y === 6 + Math.min(x - 5, 11 - x) && x >= 5 && x <= 11;
      bitmap[offset] = process.platform==='darwin'?0:letter ? 225 : 100; bitmap[offset + 1] = process.platform==='darwin'?0:letter ? 245 : 125; bitmap[offset + 2] = process.platform==='darwin'?0:letter ? 255 : 88; bitmap[offset + 3] = process.platform==='darwin'?(letter?255:0):255;
    }
    const trayImage=nativeImage.createFromBitmap(bitmap,{width:16,height:16});if(process.platform==='darwin')trayImage.setTemplateImage(true);tray=new Tray(trayImage);
    const openSettings=()=>{modalOpen=true;fitSettings();win.show();win.webContents.send('paperpal:configure');};
    tray.setToolTip('绒角 MofuCorner'); tray.setContextMenu(Menu.buildFromTemplate([{label:'打开小窝 / 设置',click:openSettings},{label:'小邮局 · 好友与聊天',click:()=>postoffice.open()},{ label: '显示宠物 · 桌面陪伴', click: () => { modalOpen=false;setFollowing(false);win.webContents.send('paperpal:collapse');win.showInactive(); } }, { label: caps.windowFollowing==='experimental'?'窗口外侧陪伴（Mac 试用）':'贴在飞书 / Lark 窗口外侧', enabled:canFollow, click: () => {modalOpen=false;setFollowing(true);win.webContents.send('paperpal:collapse');} }, { label: '退出', click: () => app.quit() }]));
    tray.on('double-click',openSettings);
    if(process.platform==='darwin')Menu.setApplicationMenu(Menu.buildFromTemplate([{label:'绒角 MofuCorner',submenu:[{role:'about'},{label:'小窝设置',accelerator:'Command+,',click:openSettings},{type:'separator'},{role:'quit'}]}]));
  }
  await win.loadFile(join(root, 'ui', 'desktop.html'), { query: { desktop: '1', demo: demo ? '1' : '0', configure: process.argv.includes('--configure') ? '1' : '0' } });
  if (followHost) setFollowing(true);
  postoffice.start().catch(()=>console.warn('小邮局暂时无法连接，可在托盘重新打开。'));
  const profileDir = join(dataRoot, brand, 'lark-cli');
  const poll = async () => {
    if (!calendarEnabled || demo || smoke || polling || brand !== 'feishu') return;
    try { const config = JSON.parse(await fs.readFile(join(dataRoot, brand, 'connection.json'), 'utf8')); if (config.calendar !== true) return; } catch { return; }
    polling = true;
    try {
      const { fetchCalendar } = await import(pathToFileURL(join(root, 'src', 'lark.mjs')).href);
      const { busy } = await fetchCalendar(profileDir, brand);
      error = ''; act({ type: 'connection', connected: true, brand }); act({ type: 'calendar', end: busy?.end || 0 });
    } catch { error = '日历查询未成功；请检查授权、网络和额度。'; broadcast(); }
    finally { polling = false; }
  };
  await poll();
  setInterval(poll, 120000).unref();
  setInterval(() => { state = reducer(state, { type: 'tick' }); broadcast(); }, 1000).unref();
  if (smoke) setTimeout(() => { console.error('SMOKE_TIMEOUT'); app.exit(1); }, softwareTest ? (selfTest?120000:30000) : selfTest ? 30000 : 15000).unref();
});
app.on('second-instance', (_event, args, _directory, additionalData) => {
  const request = { id: validLaunchId(additionalData?.paperpalLaunchId) ? additionalData.paperpalLaunchId : launchIdFrom(args), configure: additionalData?.configure === true || args.includes('--configure') };
  if (win && rendererReady) {
    const postArg=args.indexOf('--postoffice');if(postArg>=0)postoffice.configureUrl(args[postArg+1]).catch(error=>console.error(error.message));
    // Pin the configuration window before the next host poll can hide it.
    if (request.configure) {modalOpen=true;win.show();win.webContents.send('paperpal:configure');}
    else if(!followHost)win.showInactive();
    launchReceipt(request.id, true);
  } else pendingLaunches.push(request);
});
app.on('window-all-closed', () => app.quit());
app.on('before-quit', () => { postoffice?.dispose();stopWatching();stopPointerTracking();if (!state || smoke) return; try { require('node:fs').writeFileSync(join(dataRoot, 'preferences.json'), JSON.stringify({ mode: state.mode, until: state.until, affection: state.affection, followHost }), { mode: 0o600 }); } catch {} });
