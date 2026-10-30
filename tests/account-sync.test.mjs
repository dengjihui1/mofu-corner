import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {EventEmitter} from 'node:events';
import vm from 'node:vm';
import {createCharacter} from '../src/character.mjs';
import sync from '../src/account-sync.cjs';
const require=createRequire(import.meta.url),{accountIdentity,acceptIdentity,accountCharacter,canSaveCharacter}=sync;
const rabbit={id:'account-a',species:'rabbit',outfit:{headwear:'wear-bow',neckwear:'wear-bandana'}};
test('account identity only accepts known wearable IDs in their actual slots',()=>{
 assert.deepEqual(accountIdentity(rabbit),rabbit);assert.equal(accountIdentity(null),null);
 for(const value of [{...rabbit,species:'unknown'},{...rabbit,id:'../account'}, {...rabbit,outfit:{headwear:'https://evil.test/a.svg'}},{...rabbit,outfit:{headwear:'wear-satchel'}},{...rabbit,outfit:{__proto__:'ignored',script:'alert(1)'}}, {...rabbit,outfit:[]}, {...rabbit,outfit:null}])assert.equal(accountIdentity(value),undefined);
 assert.deepEqual(accountIdentity({...rabbit,extra:'discard'}),rabbit);
});
test('same account zodiac is immutable; explicit logout and account switch are supported',()=>{
 assert.deepEqual(acceptIdentity(rabbit,{...rabbit,species:'dog'}),rabbit);
 assert.deepEqual(acceptIdentity(rabbit,{...rabbit,outfit:{}}).outfit,{});
 const dog={id:'account-b',species:'dog',outfit:{carry:'wear-satchel'}};assert.deepEqual(acceptIdentity(rabbit,dog),dog);
 assert.equal(acceptIdentity(rabbit,null),null);assert.deepEqual(acceptIdentity(rabbit,undefined),rabbit);
 const local=createCharacter({species:'dragon',size:.7,personality:'quiet'}),bound=accountCharacter(local,rabbit,createCharacter);
 assert.equal(bound.species,'rabbit');assert.equal(bound.size,.7);assert.equal(bound.personality,'quiet');
 assert.equal(canSaveCharacter({...bound,species:'dragon'},rabbit),false);assert.equal(canSaveCharacter(bound,rabbit),true);assert.equal(canSaveCharacter(local,null),true);
});
test('Electron postoffice bridge rejects foreign windows, subframes and cross-origin messages; preserves binding on ordinary events',async()=>{
 const folder=await mkdtemp(join(tmpdir(),'mofu-sync-')),origin='https://pets.example.test',ipc=new EventEmitter();ipc.handle=(name,handler)=>ipc.on(name,handler);const events=[];
 class Window extends EventEmitter {constructor(){super();this.webContents=new EventEmitter();this.webContents.mainFrame={url:origin+'/'};this.webContents.session={setPermissionRequestHandler(){},setPermissionCheckHandler(){}};this.webContents.setWindowOpenHandler=()=>{};this.closed=false;}isDestroyed(){return this.closed;}async loadURL(url){this.webContents.mainFrame.url=url;}async loadFile(){}show(){}focus(){}hide(){}destroy(){this.closed=true;}}
 try{await writeFile(join(folder,'postoffice.json'),JSON.stringify({url:origin}));const source=await readFile(new URL('../desktop/postoffice.cjs',import.meta.url),'utf8'),module={exports:{}};
 const localRequire=id=>id==='electron'?{BrowserWindow:Window,ipcMain:ipc,shell:{openExternal(){}}}:id==='../src/account-sync.cjs'?sync:id==='../src/postoffice-url.cjs'?require('../src/postoffice-url.cjs'):require(id);
 vm.runInNewContext(source,{require:localRequire,module,process:{argv:[],env:{}},console,URL});
 const app=await module.exports({root:process.cwd(),dataRoot:folder,allowedPet:()=>true,onEvent:event=>events.push(event),smoke:true});await app.open({show:false});const window=app.getWindow(),event={sender:window.webContents,senderFrame:window.webContents.mainFrame};
 const notify=(sender,data)=>ipc.emit('mofu:postoffice-notify',sender,data);
 notify({sender:{},senderFrame:event.senderFrame},{account:rabbit});notify({sender:event.sender,senderFrame:{url:origin+'/'}},{account:rabbit});assert.equal(events.length,0);
 event.senderFrame.url='https://foreign.test/';notify(event,{account:rabbit});assert.equal(events.length,0);event.senderFrame.url=origin+'/';
 notify(event,{account:rabbit,unread:7});assert.equal(app.account().species,'rabbit');assert.equal(events.at(-1).account.id,rabbit.id);
 notify(event,{unread:8});assert.equal(app.account().id,rabbit.id);assert.equal(Object.hasOwn(events.at(-1),'account'),false);
 notify(event,{account:{...rabbit,outfit:{headwear:'malicious'}},unread:8});assert.equal(app.account().outfit.headwear,'wear-bow');
 const cached=JSON.parse(await readFile(join(folder,'postoffice-account.json'),'utf8'));assert.equal(cached.origin,origin);assert.equal(cached.account.species,'rabbit');
 notify(event,{account:{...rabbit,outfit:{}}});assert.deepEqual(Object.keys(app.account().outfit),[]);
 notify(event,{account:null});assert.equal(app.account(),null);assert.equal(JSON.parse(await readFile(join(folder,'postoffice-account.json'),'utf8')).account,null);
 notify(event,{account:rabbit});await app.configureUrl('https://other.example.test');assert.equal(app.account(),null);
 app.dispose();
 }finally{await rm(folder,{recursive:true,force:true});}
});
