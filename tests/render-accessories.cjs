const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const root=path.resolve(__dirname,'..');app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'mofu-wardrobe-')));
if(process.env.PAPERPAL_TEST_SOFTWARE_GL==='1'){app.commandLine.appendSwitch('use-gl','angle');app.commandLine.appendSwitch('use-angle','swiftshader-webgl');app.commandLine.appendSwitch('enable-unsafe-swiftshader');}
app.whenReady().then(async()=>{try{
 const window=new BrowserWindow({show:false,width:1000,height:800,webPreferences:{offscreen:true,backgroundThrottling:false}}),errors=[];
 window.webContents.on('console-message',event=>{if(event.level==='error')errors.push(event.message);});await window.loadFile(path.join(root,'tests/render-host.html'));
 const result=await window.webContents.executeJavaScript(`(async()=>{
  const {GentleScene,GentlePlayer}=await import('./gentle-player.mjs'),{gentlePose}=await import('./gentle-motion.mjs'),{REFERENCE_ART}=await import('./rig-reference.mjs');
  const species=Object.keys(REFERENCE_ART),canvas=document.createElement('canvas');canvas.width=640;canvas.height=660;const ctx=canvas.getContext('2d');
  const contact=document.createElement('canvas');contact.width=960;contact.height=900;const sheet=contact.getContext('2d');sheet.fillStyle='#fbf5ed';sheet.fillRect(0,0,contact.width,contact.height);
  const phases=document.createElement('canvas');phases.width=960;phases.height=660;const pc=phases.getContext('2d');pc.fillStyle='#fbf5ed';pc.fillRect(0,0,960,660);
  let checks=0;
  for(const [index,id]of species.entries()){
   const scene=new GentleScene(id);await scene.ready;const mesh=scene.scene.children[0],texture=scene.texture;
   for(const headwear of ['wear-bow','wear-daisy','wear-beret']){const outfit={headwear,neckwear:'wear-bandana',carry:'wear-satchel'};await scene.setOutfit(outfit);
    for(const [action,t]of [['tilt',.8],['jump',.22],['jump',.54],['jump',.84],['happy',.5],['look',1.4]]){scene.apply(gentlePose(action,t,id),t);if(scene.scene.children.length!==1||scene.scene.children[0]!==mesh||scene.texture!==texture)throw Error('Detached accessory layer '+id);const coords=scene.geometry.attributes.position.array;if(!coords.every(Number.isFinite))throw Error('Invalid mesh');checks++;}
    if(id==='rabbit'&&headwear==='wear-beret'){for(const [i,[name,t]]of [['tilt',.8],['jump',.22],['jump',.54],['jump',.84],['happy',.5],['look',1.4]].entries()){scene.apply(gentlePose(name,t,id),t);scene.render(ctx);pc.drawImage(canvas,i%3*320,Math.floor(i/3)*330,300,310);pc.fillStyle='#604f49';pc.font='15px sans-serif';pc.fillText(name+' '+t,i%3*320+20,Math.floor(i/3)*330+320);}}
   }
   await scene.setOutfit({headwear:'wear-daisy',neckwear:'wear-bandana',carry:'wear-satchel'});scene.apply(gentlePose('tilt',.8,id),0);scene.render(ctx);sheet.drawImage(canvas,index%4*240,Math.floor(index/4)*300,230,265);sheet.font='15px sans-serif';sheet.fillStyle='#604f49';sheet.fillText(id,index%4*240+22,Math.floor(index/4)*300+283);
   await Promise.all([scene.setOutfit({headwear:'wear-beret'}),scene.setOutfit({headwear:'wear-bow'})]);if(scene.outfit.headwear!=='wear-bow')throw Error('Old outfit overwrote newer selection');await Promise.all([scene.setOutfit({headwear:'wear-beret'}),scene.setOutfit({headwear:'wear-bow'})]);if(scene.outfit.headwear!=='wear-bow')throw Error('Returning to current outfit must cancel pending change');await scene.setOutfit({});if(Object.keys(scene.outfit).length)throw Error('Clear outfit failed');scene.dispose();
  }
  const host=document.createElement('div');document.body.append(host);const p=new GentlePlayer(host,'rabbit',null,{enabled:()=>false,outfit:{headwear:'wear-bow'}});p.model.ready.then(()=>p.draw());await p.ready;const initial=host.querySelector('canvas').toDataURL();p.lastDraw=null;p.draw();if(initial!==host.querySelector('canvas').toDataURL())throw Error('Initial reduced-motion outfit was not painted');await p.setOutfit({neckwear:'wear-bandana'});p.draw();if(p.model.outfit.neckwear!=='wear-bandana'||p.pose.tilt!==0)throw Error('Reduced motion hides wardrobe');p.destroy();
  return {checks,contact:contact.toDataURL(),phases:phases.toDataURL()};
 })()`);
 if(errors.length)throw Error(errors.join(';'));fs.mkdirSync(path.join(root,'docs','screenshots'),{recursive:true});for(const [key,name]of [['contact','desktop-wardrobe-zodiacs.png'],['phases','desktop-wardrobe-motion.png']])fs.writeFileSync(path.join(root,'docs','screenshots',name),Buffer.from(result[key].split(',')[1],'base64'));
 console.log(JSON.stringify({wardrobe:'passed',species:12,animationSamples:result.checks,singleMesh:true,singleTexture:true,latestOutfitWins:true,reducedMotion:true}));app.quit();
}catch(error){console.error(error);app.exit(1);}});
