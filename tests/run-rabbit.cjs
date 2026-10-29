const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const root=path.resolve(__dirname,'..');app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'paperpal-rabbit-')));
app.whenReady().then(async()=>{try{
 const win=new BrowserWindow({show:false,width:600,height:780,webPreferences:{offscreen:true,backgroundThrottling:false}}),errors=[];
 win.webContents.on('console-message',event=>{if(event.level==='error')errors.push(event.message);});
 await win.loadFile(path.join(root,'tests/render-host.html'));
 const report=await win.webContents.executeJavaScript(`(async()=>{
  const {RabbitScene}=await import('../ui/rabbit-scene.mjs?v=20');const {rabbitPose,RABBIT_DURATIONS}=await import('../ui/rabbit-motion.mjs');
  const model=new RabbitScene();await model.ready;const textures=[model.head.material.uniforms.art.value,...[model.body,model.leftPaw,model.rightPaw,model.leftFoot,model.rightFoot].map(m=>m.material.map)];
  const c=document.createElement('canvas');c.width=640;c.height=660;const ctx=c.getContext('2d');let frames=0,maxBodyY=0,maxReachError=0,minVisibleChest=Infinity;
  for(const name of ['sleep','wake','stretch'])for(let t=0;t<=RABBIT_DURATIONS[name];t+=1/120){
   model.apply(rabbitPose(name,t));
   const co=Math.cos(model.body.rotation.z),si=Math.sin(model.body.rotation.z),bottom=Math.max(...model.bodyBoundary.map(([x,y])=>model.body.position.y+x*si+y*co));maxBodyY=Math.max(maxBodyY,bottom);if(bottom>379)throw Error('BODY_BELOW_FLOOR');const chest=bottom-model.pose.hy-19;minVisibleChest=Math.min(minVisibleChest,chest);if(chest<45)throw Error('BODY_HIDDEN_BY_HEAD');
   maxReachError=Math.max(maxReachError,...model.reachErrors);if(maxReachError>1e-7)throw Error('PAW_UNREACHABLE');
   for(const m of [model.head,model.leftPaw,model.rightPaw,model.leftFoot,model.rightFoot])if(m.scale.x!==1||m.scale.y!==1)throw Error('PART_SQUASH');
   const current=[model.head.material.uniforms.art.value,...[model.body,model.leftPaw,model.rightPaw,model.leftFoot,model.rightFoot].map(m=>m.material.map)];if(current.some((tx,i)=>tx!==textures[i]))throw Error('POSE_TEXTURE_SWITCH');frames++;
  }
  for(const [name,t]of [['sleep',3.6],['wake',.7],['wake',3.8],['stretch',1.8],['stretch',3.3]]){model.apply(rabbitPose(name,t));model.render(ctx);if(!ctx.getImageData(0,0,640,660).data.some((v,i)=>i%4===3&&v>128))throw Error('BLANK_RENDER');}model.dispose();
  return {date:new Date().toISOString(),renderer:'one articulated plush rabbit',samples:frames,maxBodyY,minVisibleChest,floor:379,maxReachError,poseTextureIdentityStable:true,skullAndPawScaleFixed:true,restWakeStretchRendered:true};
 })()`);
 await win.loadFile(path.join(root,'ui/motion-study.html'));
 const live=await win.webContents.executeJavaScript(`(async()=>{
  const module=await import('./motion-study.mjs?v=20');await module.hero.ready;const hero=module.hero;const pause=ms=>new Promise(r=>setTimeout(r,ms));const until=async fn=>{const end=Date.now()+6500;while(!fn()){if(Date.now()>end)throw Error('ANIMATION_TIMEOUT:'+hero.host.dataset.animation+':'+hero.clip?.time);await pause(25);}};
  if(document.querySelector('p,small,footer,.eyebrow,.motion-note'))throw Error('EXTRA_EXPLANATORY_COPY');
  hero.play('jump');await pause(750);hero.cancel();document.querySelector('[data-action=sleep]').click();if(hero.clip?.name!=='jump'||hero.queued!=='sleep')throw Error('FLIGHT_INTERRUPTED_BY_SLEEP');await until(()=>hero.host.dataset.animation==='asleep');if(hero.host.dataset.animation!=='asleep'||hero.pose.eye!==0)throw Error('SLEEP_NOT_COMPLETED');
  document.querySelector('[data-action=wake]').click();await pause(700);if(hero.host.dataset.animation!=='wake')throw Error('WAKE_NOT_RUNNING');
  document.querySelector('[data-action=touch]').click();if(hero.clip.name!=='wake'||hero.queued!=='touch')throw Error('WAKE_INTERRUPTED_BY_TOUCH');
  await until(()=>hero.clip?.name==='touch');if(hero.clip?.name!=='touch')throw Error('QUEUED_TOUCH_MISSING');
  hero.enabled=()=>false;hero.play('touch',{instant:true});const before=hero.canvas.toDataURL();await pause(180);if(hero.canvas.toDataURL()!==before)throw Error('REDUCED_MOTION_NOT_STATIC');
  const ids=[...document.querySelectorAll('[data-species]')].map(e=>e.dataset.species);if(ids.length!==12)throw Error('MISSING_ZODIAC');
  return {pageWithoutExplanatoryCopy:true,sleepWakeThroughActualButtons:true,jumpFinishesBeforeSleep:true,wakingQueuesTouch:true,reducedMotionStatic:true,zodiacCount:ids.length};
 })()`);
 if(errors.length)throw Error(errors.join(';'));Object.assign(report,live,{consoleErrors:errors});fs.writeFileSync(path.join(root,'docs/rabbit-validation.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));app.quit();
 }catch(e){console.error(e);app.exit(1);}});
