const {app,BrowserWindow,nativeImage}=require('electron'),fs=require('node:fs'),path=require('node:path');
app.disableHardwareAcceleration();
if(!process.env.MOFU_POSTCARD_PROFILE)throw Error('Use the test runner');app.setPath('userData',process.env.MOFU_POSTCARD_PROFILE);
app.whenReady().then(async()=>{try{
 const win=new BrowserWindow({show:false,width:1280,height:900,webPreferences:{offscreen:true,backgroundThrottling:false}});await win.loadURL(process.env.MOFU_POSTCARD_URL||'http://127.0.0.1:4722/showroom.html#berry/rabbit');
 const value=await win.webContents.executeJavaScript(`(async()=>{
  const {createRoomPostcard}=await import('/room-postcard.mjs');
  const until=Date.now()+10000;while(!document.querySelector('#showroom-scene .mofu-room')){if(Date.now()>until)throw Error('Room load timeout');await new Promise(r=>setTimeout(r,40));}
  const scene=document.querySelector('#showroom-scene .mofu-room');await Promise.all([...scene.querySelectorAll('img')].map(i=>i.decode()));
  const result=await createRoomPostcard({scene,name:'耳朵',preview:true});
  const data=await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.readAsDataURL(result.blob);});
  if(result.blob.type!=='image/png'||result.blob.size<10000)throw Error('Empty postcard');const r=scene.getBoundingClientRect();return {...result,blob:null,data,bounds:{x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)}};
 })()`);
 const photo=nativeImage.createFromBuffer(Buffer.from(value.data.split(',')[1],'base64')).crop({x:36,y:36,width:value.width-72,height:value.height-164}).resize({width:480,height:300});
 const live=(await win.webContents.capturePage(value.bounds)).resize({width:480,height:300});
 const eyes=image=>{const data=image.toBitmap();let x=0,y=0,n=0;for(let i=0;i<data.length;i+=4)if(data[i]<45&&data[i+1]<45&&data[i+2]<45&&data[i+3]>220){const p=i/4;x+=p%480;y+=Math.floor(p/480);n++;}if(n<3)throw Error('Pet eyes missing in postcard');return {x:x/n,y:y/n};};
 const a=eyes(photo),b=eyes(live);if(Math.abs(a.x-b.x)>3||Math.abs(a.y-b.y)>3)throw Error('Photo moved pet: '+JSON.stringify({photo:a,live:b}));
 const file=path.join(__dirname,'../docs/screenshots/room-postcard.png');fs.writeFileSync(file,Buffer.from(value.data.split(',')[1],'base64'));console.log(JSON.stringify({postcard:'passed',width:value.width,height:value.height,petPositionMatches:true}));app.quit();
}catch(e){console.error(e);app.exit(1);}});
