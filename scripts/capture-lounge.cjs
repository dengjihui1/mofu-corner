const {app,BrowserWindow}=require('electron'),fs=require('node:fs/promises'),path=require('node:path');
const root=path.resolve(__dirname,'..'),output=process.env.MOFUCORNER_CAPTURE_DIR;
app.setPath('userData',path.join(process.env.PAPERPAL_DATA_DIR,'lounge-capture'));
app.whenReady().then(async()=>{try{
 const w=new BrowserWindow({width:1280,height:850,show:false,webPreferences:{offscreen:true,backgroundThrottling:false}});
 await w.loadFile(path.join(root,'ui/motion-study.html'));
 await w.webContents.debugger.attach('1.3');
 await w.webContents.debugger.sendCommand('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
 const prepare=()=>w.webContents.executeJavaScript(`(async()=>{const end=Date.now()+15000;while(document.querySelectorAll('[data-thumb-ready=true]').length!==12||document.querySelector('#hero').dataset.rigReady!=='true'){if(Date.now()>end)throw Error('LOUNGE_ART_TIMEOUT');await new Promise(r=>setTimeout(r,35));}document.querySelector('#ambient-toggle').click();const m=await import('./motion-study.mjs?v=23');m.hero.setStill('idle',0);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));})()`);
 await prepare();
 const photograph=async name=>{await new Promise(r=>setTimeout(r,240));const image=await new Promise((done,reject)=>{const timer=setTimeout(()=>reject(Error('DOC_PAINT_TIMEOUT')),8000);w.webContents.once('paint',(_event,_dirty,image)=>{clearTimeout(timer);done(image);});w.webContents.invalidate();});await fs.writeFile(path.join(output,name),image.toPNG());};
 await photograph('lounge-overview.png');
 w.setContentSize(390,1020);
 await w.loadFile(path.join(root,'ui/motion-study.html'));await prepare();
 await photograph('lounge-narrow.png');
 const sheet=await w.webContents.executeJavaScript(`(async()=>{const m=await import('./motion-study.mjs?v=23');const c=document.createElement('canvas');c.width=1320;c.height=920;const x=c.getContext('2d');x.fillStyle='#f1f3ed';x.fillRect(0,0,c.width,c.height);const samples=[['自在陪伴','idle',0],['摸摸头','touch',.52],['眨眨眼','blink',.10],['歪歪头','tilt',.82],['轻轻跳','jump',.54],['笑一个','happy',.52]];for(let i=0;i<samples.length;i++){const [label,action,time]=samples[i],left=24+i%3*432,top=24+Math.floor(i/3)*446;x.fillStyle='#fffefa';x.beginPath();x.roundRect(left,top,408,420,24);x.fill();m.hero.setStill(action,time);x.drawImage(m.hero.canvas,left+52,top+25,304,313.5);x.fillStyle='#355846';x.font='24px "Microsoft YaHei UI","PingFang SC",sans-serif';x.textAlign='center';x.fillText(label,left+204,top+380);}return c.toDataURL('image/png');})()`);
 await fs.writeFile(path.join(output,'interaction-keyframes.png'),Buffer.from(sheet.split(',')[1],'base64'));
 // Each cell is an actual rendered built-in character, captured by the same player.
 const roster=await w.webContents.executeJavaScript(`(async()=>{const {RigPlayer}=await import('./rig-motion.mjs?v=23'),{ZODIAC_CONCEPTS}=await import('./zodiac-data.mjs');const c=document.createElement('canvas');c.width=1440;c.height=1060;const x=c.getContext('2d');x.fillStyle='#f1f3ed';x.fillRect(0,0,c.width,c.height);for(let i=0;i<ZODIAC_CONCEPTS.length;i++){const p=ZODIAC_CONCEPTS[i],host=document.createElement('div'),r=new RigPlayer(host,p.id,null,{enabled:()=>false});cancelAnimationFrame(r.raf);await r.ready;r.lastDraw=null;r.draw();const left=20+i%4*355,top=20+Math.floor(i/4)*345;x.fillStyle='#fffefa';x.beginPath();x.roundRect(left,top,335,325,24);x.fill();x.drawImage(r.canvas,left+49,top+6,237,244.4);x.fillStyle='#355846';x.font='22px "Microsoft YaHei UI","PingFang SC",sans-serif';x.textAlign='center';x.fillText(p.name+' · '+p.zodiac,left+167.5,top+289);r.destroy();}return c.toDataURL('image/png');})()`);
 await fs.writeFile(path.join(output,'zodiac-roster.png'),Buffer.from(roster.split(',')[1],'base64'));
 console.log(JSON.stringify({loungeScreenshots:'passed',actualRenderer:true,zodiac:12,actionKeyframes:6}));app.quit();
}catch(e){console.error(e);app.exit(1);}});
