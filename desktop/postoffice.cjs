const {accountIdentity,acceptIdentity}=require('../src/account-sync.cjs');
const {BrowserWindow,ipcMain,shell}=require('electron');const {join}=require('node:path');const {pathToFileURL}=require('node:url');const fs=require('node:fs/promises');const {postofficeUrl}=require('../src/postoffice-url.cjs');
module.exports=async function createPostofficeWindow({root,dataRoot,allowedPet,onEvent,smoke=false}){
 const file=join(dataRoot,'postoffice.json'),connectFile=join(root,'ui','postoffice-connect.html'),connectUrl=pathToFileURL(connectFile).href;
 let base='',window=null,quitting=false,lastGesture=0,account=null;
 const accountFile=join(dataRoot,'postoffice-account.json');
 try{base=postofficeUrl(JSON.parse(await fs.readFile(file,'utf8')).url);}catch{}
 const cli=process.argv.indexOf('--postoffice'),provided=cli>=0?process.argv[cli+1]:process.env.MOFUCORNER_SOCIAL_URL;
 if(provided){try{base=postofficeUrl(provided);if(!smoke)await fs.writeFile(file,JSON.stringify({url:base}),{mode:0o600});}catch{base='';console.warn('邮局地址无效，请在小邮局中重新填写。');}}
 try{const saved=JSON.parse(await fs.readFile(accountFile,'utf8'));if(saved.origin===base)account=accountIdentity(saved.account)||null;}catch{}
 function updateAccount(value){const next=acceptIdentity(account,value);if(JSON.stringify(next)===JSON.stringify(account))return false;account=next;const content=JSON.stringify({origin:base,account});try{require('node:fs').writeFileSync(accountFile,content,{mode:0o600});}catch{}return true;}
 const isMain=e=>window&&!window.isDestroyed()&&e.sender===window.webContents&&e.senderFrame===window.webContents.mainFrame;
 const isConnect=e=>isMain(e)&&e.senderFrame.url.split('?')[0]===connectUrl;
 const isRemote=e=>{if(!isMain(e)||!base)return false;try{return new URL(e.senderFrame.url).origin===base;}catch{return false;}};
 function create(){if(window&&!window.isDestroyed())return;window=new BrowserWindow({width:940,height:760,minWidth:370,minHeight:580,title:'绒角 · 小邮局',backgroundColor:'#fffaf4',show:false,autoHideMenuBar:true,webPreferences:{preload:join(root,'desktop','postoffice-preload.cjs'),partition:'persist:mofucorner-postoffice',sandbox:true,contextIsolation:true,nodeIntegration:false,webSecurity:true,backgroundThrottling:false}});
  window.webContents.session.setPermissionRequestHandler((_,__,cb)=>cb(false));window.webContents.session.setPermissionCheckHandler(()=>false);
  window.webContents.setWindowOpenHandler(({url})=>{try{const u=new URL(url);if(base&&u.origin===base&&['/privacy','/terms'].includes(u.pathname))shell.openExternal(u.href);}catch{}return{action:'deny'};});
  window.webContents.on('will-navigate',(event,url)=>{try{if(url!==connectUrl&&(!base||new URL(url).origin!==base))event.preventDefault();}catch{event.preventDefault();}});
  window.webContents.on('will-redirect',(event,url)=>{try{if(!base||new URL(url).origin!==base)event.preventDefault();}catch{event.preventDefault();}});
  window.on('close',e=>{if(!quitting){e.preventDefault();window.hide();}});window.on('closed',()=>{window=null;});
 }
 async function load(show){create();try{if(base)await window.loadURL(base+'/');else await window.loadFile(connectFile);}catch{if(window&&!window.isDestroyed())await window.loadFile(connectFile,{query:{error:'连接不上这间邮局，请确认地址和网络。'}});}if(show&&!smoke){window.show();window.focus();}}
 async function open({show=true}={}){if(window&&!window.isDestroyed()){if(show&&!smoke){window.show();window.focus();}return;}await load(show);}
 async function configureUrl(url){const next=postofficeUrl(url);if(next!==base){updateAccount(null);onEvent({unread:0,account:null});}base=next;await fs.writeFile(file,JSON.stringify({url:base}),{mode:0o600});await load(true);return{ok:true};}
 ipcMain.handle('paperpal:open-postoffice',async e=>{if(!allowedPet(e))return null;await open();return{ok:true};});
 ipcMain.handle('mofu:postoffice-config',e=>isConnect(e)?{url:base}:null);
 ipcMain.handle('mofu:postoffice-connect',async(e,url)=>{if(!isConnect(e))return{error:'不允许的连接请求'};try{return await configureUrl(url);}catch(error){return{error:error.message};}});
 ipcMain.handle('mofu:postoffice-configure',async e=>{if(!isRemote(e))return null;await window.loadFile(connectFile);if(!smoke)window.show();return{ok:true};});
 ipcMain.on('mofu:postoffice-notify',(e,data)=>{if(!isRemote(e)||!data||typeof data!=='object')return;const unread=Math.min(999,Math.max(0,Math.floor(Number(data.unread)||0))),event={unread};if(Object.hasOwn(data,'account')){const next=accountIdentity(data.account);if(next!==undefined){updateAccount(next);event.account=account;}}if(['text','heart','pat'].includes(data.kind)&&Date.now()-lastGesture>8000){lastGesture=Date.now();event.kind=data.kind;event.name=typeof data.name==='string'?data.name.replace(/[\x00-\x1f]/g,'').slice(0,20):'好友';}onEvent(event);});
 return{open,configureUrl,account:()=>account,start:async()=>{if(base&&!smoke)await open({show:false});},dispose:()=>{quitting=true;window?.destroy();},getWindow:()=>window,url:()=>base};
};
