const {app,BrowserWindow,nativeImage}=require('electron'),fs=require('node:fs'),path=require('node:path');
app.disableHardwareAcceleration();
if(!process.env.MOFU_POSTCARD_PROFILE)throw Error('Use the test runner');app.setPath('userData',process.env.MOFU_POSTCARD_PROFILE);
app.whenReady().then(async()=>{try{
 const win=new BrowserWindow({show:false,width:1280,height:900,webPreferences:{offscreen:true,backgroundThrottling:false}});const base=process.env.MOFU_POSTCARD_URL||'http://127.0.0.1:4722/showroom.html#berry/rabbit';
 const results=[];const dir=path.join(__dirname,'../.local/scene-postcards');fs.mkdirSync(dir,{recursive:true});
 for(const theme of ['listening','breakfast','berry','forest','moon']){
 await win.loadURL(base.split('#')[0]+'#'+theme+'/rabbit');
 const value=await win.webContents.executeJavaScript(`(async()=>{
  const {createRoomPostcard}=await import('/room-postcard.mjs');const {HOME_STYLES}=await import('/home-styles.mjs');const expected=HOME_STYLES.find(x=>x.id===location.hash.slice(1).split('/')[0]);
  const until=Date.now()+10000;while(!document.querySelector('#showroom-scene .mofu-room')||document.querySelector('#showroom-scene').getAttribute('aria-busy')==='true'||document.querySelector('#room-name').textContent!==expected.name){if(Date.now()>until)throw Error('Room load timeout');await new Promise(r=>setTimeout(r,40));}
  const scene=document.querySelector('#showroom-scene .mofu-room');await Promise.all([...scene.querySelectorAll('img')].map(i=>i.decode()));
  const result=await createRoomPostcard({scene,name:'耳朵',preview:true});
  const data=await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.readAsDataURL(result.blob);});
  if(result.blob.type!=='image/png'||result.blob.size<10000)throw Error('Empty postcard');const r=scene.getBoundingClientRect(),pet=scene.querySelector('.room-pet').getBoundingClientRect();return {...result,blob:null,data,pet:{x:(pet.x-r.x)/r.width*480,y:(pet.y-r.y)/r.height*300,width:pet.width/r.width*480,height:pet.height/r.height*300},bounds:{x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)}};
 })()`);
 const photo=nativeImage.createFromBuffer(Buffer.from(value.data.split(',')[1],'base64')).crop({x:36,y:36,width:value.width-72,height:value.height-164}).resize({width:480,height:300});
 const live=(await win.webContents.capturePage(value.bounds)).resize({width:480,height:300});
 const eyes=image=>{const data=image.toBitmap();let x=0,y=0,n=0;for(let i=0;i<data.length;i+=4){const px=(i/4)%480,py=Math.floor(i/4/480);if(px<value.pet.x||px>value.pet.x+value.pet.width||py<value.pet.y||py>value.pet.y+value.pet.height*.72)continue;if(data[i]<45&&data[i+1]<45&&data[i+2]<45&&data[i+3]>220){const p=i/4;x+=p%480;y+=Math.floor(p/480);n++;}}if(n<3)throw Error('Pet eyes missing in postcard');return {x:x/n,y:y/n};};
 fs.writeFileSync(path.join(dir,theme+'-live.png'),live.toPNG());fs.writeFileSync(path.join(dir,theme+'-crop.png'),photo.toPNG());
 const a=eyes(photo),b=eyes(live);if(Math.abs(a.x-b.x)>3||Math.abs(a.y-b.y)>3)throw Error(theme+' photo moved pet: '+JSON.stringify({photo:a,live:b}));
 const bytes=Buffer.from(value.data.split(',')[1],'base64');fs.writeFileSync(path.join(dir,theme+'.png'),bytes);if(theme==='berry')fs.writeFileSync(path.join(__dirname,'../docs/screenshots/room-postcard.png'),bytes);results.push({theme,width:value.width,height:value.height,positionMatches:true});
 }console.log(JSON.stringify({postcards:'passed',results}));app.quit();
}catch(e){console.error(e);app.exit(1);}});
