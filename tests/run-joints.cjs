const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),os=require('node:os');
const root=path.resolve(__dirname,'..');
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'paperpal-whole-')));
app.whenReady().then(async()=>{try{
 const win=new BrowserWindow({show:false,width:400,height:470,webPreferences:{offscreen:true,backgroundThrottling:false}});
 await win.loadFile(path.join(root,'tests/render-host.html'));
 const report=await win.webContents.executeJavaScript(`(async()=>{
  const {PlushScene}=await import(${JSON.stringify(pathToFileURL(path.join(root,'ui/whole-plush.mjs')).href)});
  const {motionPose,DURATIONS}=await import(${JSON.stringify(pathToFileURL(path.join(root,'ui/joint-motion.mjs')).href)});
  const report={date:new Date().toISOString(),renderer:'intact plush artwork',samples:0,characters:[],minTriangleAreaRatio:Infinity,maxTriangleAreaRatio:0,knownLimitation:'Other eleven characters use discrete complete sleeping artwork. Rabbit has a separate continuous skeleton validation.'};
  const canvas=document.createElement('canvas');canvas.width=640;canvas.height=660;const ctx=canvas.getContext('2d');
  for(const id of ['rat','ox','tiger','dragon','snake','horse','sheep','monkey','rooster','dog','pig']){
   const model=new PlushScene(id);await model.ready;
   for(const [action,duration]of Object.entries(DURATIONS))for(let t=0;t<=duration;t+=1/30){
    model.apply(motionPose(action,t,id));const a=model.geometry.attributes.position.array,o=model.original,ix=model.geometry.index.array;
    if(model.scene.children.length!==1||model.inspect().anatomicalLayers!==1)throw Error('DUPLICATED_ANATOMY_'+id);
    if(Math.abs(model.inspect().aspectRatio-model.inspect().sourceAspectRatio)>1e-8)throw Error('ART_ASPECT_'+id);
    for(let i=0;i<ix.length;i+=3){const [j,k,l]=[ix[i]*3,ix[i+1]*3,ix[i+2]*3];
     const cross=(arr)=>(arr[k]-arr[j])*(arr[l+1]-arr[j+1])-(arr[k+1]-arr[j+1])*(arr[l]-arr[j]);
     const ratio=cross(a)/(-cross(o)*model.width*model.height);
     if(!Number.isFinite(ratio)||ratio<.65||ratio>1.4)throw Error('FOLDED_OR_STRETCHED_'+id+':'+action+':'+t+':'+ratio);
     report.minTriangleAreaRatio=Math.min(report.minTriangleAreaRatio,ratio);report.maxTriangleAreaRatio=Math.max(report.maxTriangleAreaRatio,ratio);
    }
    const bottom=[];for(let i=0;i<o.length;i+=3)if(Math.abs(o[i+1]+.5)<1e-7)bottom.push(a[i+1]);
    const ground=303-Math.max(0,motionPose(action,t,id).height)*60;
    if(bottom.some(y=>Math.abs(y-ground)>.01))throw Error('FOOT_SLIDE_'+id);
    report.samples++;
   }
   for(const [action,time]of [['jump',0],['touch',.7],['sleep',2.6]]){
    model.apply(motionPose(action,time,id));model.render(ctx);const pixels=ctx.getImageData(0,0,640,660).data;
    if(!pixels.some((v,i)=>i%4===3&&v>128))throw Error('BLANK_'+id+':'+action);
    if(action==='touch'&&model.uniforms.opening.value>.15)throw Error('EYELIDS_NOT_RESPONDING_'+id);
   }
   report.characters.push({id,completeArtLayers:1,sourceAspectPreserved:true,meshNeverFolds:true,neutralHappySleepRendered:true});model.dispose();
  }
  return report;
 })()`);
 fs.writeFileSync(path.join(root,'docs/joint-validation.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));app.quit();
 }catch(e){console.error(e);app.exit(1);}});
