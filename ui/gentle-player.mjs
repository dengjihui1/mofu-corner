import {normalizeOutfit,accessorySvg,accessoryPlacements} from './pet-accessories.mjs';
import * as T from './vendor/three.module.mjs';
import {RIG_ASSETS} from './rig-assets.mjs';
import {REFERENCE_ART} from './rig-reference.mjs';
import {neutral,gentlePose,blink,vertex,DURATIONS,clamp,smooth,idleChoice,idleGap,HOP} from './gentle-motion.mjs';

let renderer;
const images=new Map();
function load(src){if(!images.has(src))images.set(src,new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src;}));return images.get(src);}
export async function composeAccessories(baseArt,species,value){
 const pieces=accessoryPlacements(species,normalizeOutfit(value));
 const prepared=await Promise.all(pieces.map(async piece=>({...piece,image:await load('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(accessorySvg(piece.id)))})));
 const canvas=document.createElement('canvas');canvas.width=baseArt.width;canvas.height=baseArt.height;const ctx=canvas.getContext('2d');ctx.drawImage(baseArt,0,0);
 for(const p of prepared){ctx.save();ctx.translate((p.x+p.width/2)*canvas.width,(p.y+p.height/2)*canvas.height);ctx.rotate((p.rotation||0)*Math.PI/180);ctx.drawImage(p.image,-p.width*canvas.width/2,-p.height*canvas.height/2,p.width*canvas.width,p.height*canvas.height);ctx.restore();}
 return canvas;
}
function engine(){if(!renderer){renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});renderer.setSize(640,660);renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.NoToneMapping;}return renderer;}
// Only the measured eye areas change. The artist's mouth and all limbs stay intact.
const fragment=`
uniform sampler2D art;uniform float opening;uniform float wink;uniform float smile;uniform float gaze;uniform float blush;uniform vec4 eyeA;uniform vec4 eyeB;
varying vec2 uvArt;
vec4 lid(vec4 color,vec4 eye,float aperture){
 if(aperture>.999&&abs(gaze)<.001)return color;
 vec2 q=(uvArt-eye.xy)/eye.zw;float d=length(q);
 if(d>1.5)return color;
 float o=aperture<.16?0.:aperture;vec2 lookup=uvArt;
 lookup.x-=gaze*eye.z*.22*(1.-smoothstep(.8,1.5,d));
 if(o>0.&&abs(q.y)<o)lookup.y=eye.y+(uvArt.y-eye.y)/o;
 else lookup.y=eye.y+eye.w*(2.25+q.y*.15);
 vec4 closed=texture2D(art,lookup);
 float curve=mix(-.12,.35,smile)*(1.-q.x*q.x);
 float line=(1.-smoothstep(.035,.115,abs(q.y-curve)))*(1.-smoothstep(.75,1.12,abs(q.x)));
 closed.rgb=mix(closed.rgb,vec3(.24,.14,.12),line*(1.-smoothstep(.04,.18,aperture)));
 return mix(color,closed,1.-smoothstep(1.05,1.5,d));
}
void main(){vec4 c=texture2D(art,uvArt);c=lid(c,eyeA,opening);c=lid(c,eyeB,max(0.,opening-wink));
 vec2 qa=(uvArt-eyeA.xy)/eyeA.zw-vec2(-.8,-2.0),qb=(uvArt-eyeB.xy)/eyeB.zw-vec2(.8,-2.0);
 float cheek=(1.-smoothstep(.15,1.3,length(qa)))+(1.-smoothstep(.15,1.3,length(qb)));
 c.rgb=mix(c.rgb,vec3(1.,.63,.64),cheek*blush*.12);gl_FragColor=c;
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
export class GentleScene{
 constructor(species){
  this.species=species;this.outfit={};this.outfitRevision=0;this.reference=REFERENCE_ART[species];this.pose=neutral();this.scene=new T.Scene();this.camera=new T.OrthographicCamera(0,320,0,330,-10,10);
  this.geometry=new T.PlaneGeometry(1,1,32,40);this.original=this.geometry.attributes.position.array.slice();
  this.uniforms={art:{value:null},opening:{value:1},wink:{value:0},smile:{value:0},gaze:{value:0},blush:{value:0},eyeA:{value:new T.Vector4()},eyeB:{value:new T.Vector4()}};
  this.material=new T.ShaderMaterial({transparent:true,depthTest:false,uniforms:this.uniforms,vertexShader:'varying vec2 uvArt;void main(){uvArt=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:fragment});
  const mesh=new T.Mesh(this.geometry,this.material);mesh.frustumCulled=false;this.scene.add(mesh);
  this.ready=load(RIG_ASSETS[species].src).then(img=>{
   if(this.disposed)return;const r=this.reference.rect,canvas=document.createElement('canvas');canvas.width=r[2];canvas.height=r[3];canvas.getContext('2d').drawImage(img,...r,0,0,r[2],r[3]);
   this.baseArt=canvas;this.texture=new T.CanvasTexture(canvas);this.texture.colorSpace=T.SRGBColorSpace;this.texture.minFilter=T.LinearFilter;this.texture.generateMipmaps=false;this.uniforms.art.value=this.texture;
   this.height=252;this.width=252*r[2]/r[3];this.reference.eyes.forEach((e,i)=>this.uniforms[i?'eyeB':'eyeA'].value.set(e.cx,1-e.cy,e.rx,e.ry));this.apply(neutral(),0);
  });
 }
 async setOutfit(value){
  const outfit=normalizeOutfit(value),key=JSON.stringify(outfit),revision=++this.outfitRevision;if(key===this.outfitKey)return;await this.ready;if(this.disposed||revision!==this.outfitRevision)return;
  const canvas=await composeAccessories(this.baseArt,this.species,outfit);
  if(this.disposed||revision!==this.outfitRevision)return;
  // One surface, one deformation, one depth order: no floating overlay or second skeleton.
  this.texture.image=canvas;this.texture.needsUpdate=true;this.outfit=outfit;this.outfitKey=key;
 }
 apply(p,time=0){if(!this.texture)return;this.pose=p;for(const [name,key]of [['opening','eye'],['wink','wink'],['smile','smile'],['gaze','look'],['blush','blush']])this.uniforms[name].value=p[key]??(key==='eye'?1:0);const a=this.geometry.attributes.position.array;for(let i=0;i<a.length;i+=3){const xy=vertex(this.original[i],.5-this.original[i+1],this.width,this.height,p,time);a[i]=xy[0];a[i+1]=xy[1];a[i+2]=0;}this.geometry.attributes.position.needsUpdate=true;}
 render(ctx){if(!this.texture)return;const r=engine();r.render(this.scene,this.camera);ctx.clearRect(0,0,640,660);const lift=this.pose.lift||0;ctx.save();ctx.translate(320,608);ctx.scale(1-lift/100,.14);const shadow=ctx.createRadialGradient(0,0,2,0,0,this.width*.47);shadow.addColorStop(0,`rgba(87,64,69,${.13-lift*.004})`);shadow.addColorStop(1,'rgba(87,64,69,0)');ctx.fillStyle=shadow;ctx.fillRect(-160,-160,320,320);ctx.restore();ctx.drawImage(r.domElement,0,0);}
 inspect(){return{renderer:'gentle-intact-art',anatomicalLayers:1,textureCount:1,outfit:{...this.outfit},accessoryBinding:'shared-deformation-texture',mouth:'original',feet:'planted except during the short ballistic hop'};}
 dispose(){this.disposed=true;this.geometry.dispose();this.material.dispose();this.texture?.dispose();}
}
export class GentlePlayer{
 constructor(host,species,_legacy,{enabled=()=>true,idleAllowed=()=>true,personality=()=> 'gentle',random=Math.random,outfit={}}={}){
  Object.assign(this,{outfit:normalizeOutfit(outfit),host,species,enabled,idleAllowed,personality,random,sleeping:false,destroyed:false,pose:neutral(),clip:null,idleTime:0,lastNow:performance.now(),blinkAt:4+random()*3,nextIdleAt:3.2+random()*1.4,idleIndex:0,idleCount:0});
  this.canvas=document.createElement('canvas');this.canvas.width=640;this.canvas.height=660;this.canvas.className='rig-puppet';this.canvas.dataset.artwork='intact-plush';this.canvas.setAttribute('aria-hidden','true');this.canvas.style.cssText='width:100%;height:100%;object-fit:contain;display:block;pointer-events:none';this.ctx=this.canvas.getContext('2d');host.replaceChildren(this.canvas);Object.assign(host.dataset,{rig:species,rigReady:'false',anatomy:'intact',interpolation:'gentle-intact-art'});
  this.ready=(async()=>{this.model=new GentleScene(species);await this.model.ready;await this.model.setOutfit(this.outfit);if(this.destroyed){this.model.dispose();return;}this.host.dataset.rigReady='true';this.lastDraw=null;this.draw();})().catch(error=>{if(this.destroyed)return;this.error=error;host.dataset.rigReady='error';host.title='伙伴暂时未加载，请刷新';});
  this.tick=this.tick.bind(this);this.raf=requestAnimationFrame(this.tick);
 }
 async setOutfit(value){this.outfit=normalizeOutfit(value);await this.ready;if(this.destroyed)return;await this.model.setOutfit(this.outfit);if(this.destroyed)return;this.lastDraw=null;this.draw();}
 play(name,{instant=false,rate=1,source='manual'}={}){
  if(this.clip?.name==='jump'&&this.pose.lift>0&&!instant&&this.enabled()){this.queued={name,instant,rate,source};return this;}
  if(name==='sleep'){this.sleeping=true;this.clip=null;this.pose=neutral();this.draw();return this;}
  if(name==='wake'){this.sleeping=false;this.clip=null;this.nextIdleAt=this.idleTime+4;this.draw();return this;}
  this.sleeping=false;if(!DURATIONS[name])name=name==='stretch'||name==='sway'||name==='step'?'tilt':'touch';
  if(instant||!this.enabled()){this.clip=null;this.pose=neutral();this.draw();return this;}
  // Retarget from the currently visible pose, including fast repeated clicks.
  if(name==='jump'&&this.species==='snake')name='happy';
  this.clip={name,time:0,rate:clamp(rate,.25,2),from:{...this.pose},source};this.queued=null;this.nextIdleAt=this.idleTime+DURATIONS[name]+idleGap(this.random,this.personality());return this;
 }
 cancel(){this.queued=null;if(this.clip?.name==='jump'&&this.pose.lift>0){this.clip.stopAfterLanding=true;return;}this.clip=null;this.nextIdleAt=this.idleTime+5;}
 pause(){this.clip=null;this.queued=null;this.pose=neutral();this.nextIdleAt=this.idleTime+4;this.draw();}
 setStill(name,time){this.clip=null;this.pose=this.enabled()?gentlePose(name,time,this.species):neutral();this.draw();}
 tick(now){
  if(this.destroyed)return;const dt=Math.min(.05,(now-this.lastNow)/1000);this.lastNow=now;
  if(!document.hidden){
   const active=this.enabled()&&!this.sleeping;
   if(!active){this.pose=neutral();this.clip=null;this.queued=null;}
   else if(this.clip){const c=this.clip;c.time+=dt*c.rate;const p=gentlePose(c.name,c.time,this.species),u=smooth(c.time/.18);for(const k of Object.keys(p))this.pose[k]=typeof p[k]==='number'?c.from[k]*(1-u)+p[k]*u:p[k];if(c.name==='blink'&&c.from.eye>.999)this.pose.eye=p.eye;
    const landed=c.name==='jump'&&c.time>=HOP.start+HOP.flight+.16;
    if(landed&&this.queued){const next=this.queued;this.clip=null;this.play(next.name,next);}
    else if(c.time>=DURATIONS[c.name]||(landed&&c.stopAfterLanding))this.clip=null;
   }
   else{const rest=neutral(),u=1-Math.exp(-dt*12);for(const k of Object.keys(rest))this.pose[k]=typeof rest[k]==='number'?this.pose[k]+(rest[k]-this.pose[k])*u:rest[k];
    if(this.idleAllowed()){
     const t=this.idleTime-this.blinkAt;if(t>=0&&t<.26){this.pose.eye=blink(t);this.pose.expression='blink';}else if(t>=.26)this.blinkAt=this.idleTime+4.5+this.random()*3;
     if(this.idleTime>=this.nextIdleAt){const name=idleChoice(this.idleIndex++,this.species,this.personality());this.idleCount++;this.play(name,{source:'idle'});}
    }else this.nextIdleAt=this.idleTime+3.2;
   }
   if(active)this.idleTime+=dt;this.draw();
  }
  this.raf=requestAnimationFrame(this.tick);
 }
 draw(){if(!this.model?.texture||this.destroyed)return;const active=this.enabled()&&!this.sleeping;if(!active)this.pose=neutral();const time=active&&this.idleAllowed()?this.idleTime:0,signature=JSON.stringify(this.pose)+Math.floor(time*60);if(signature!==this.lastDraw){this.model.apply(this.pose,time);this.model.render(this.ctx);this.lastDraw=signature;}Object.assign(this.host.dataset,{animation:this.clip?.name||(this.sleeping?'quiet':'idle'),expression:this.pose.expression,source:this.clip?.source||'rest',idleCount:String(this.idleCount),phase:String(this.clip?Math.round(100*clamp(this.clip.time/DURATIONS[this.clip.name])):100),frame:'intact',interpolation:'gentle-intact-art'});}
 destroy(){this.destroyed=true;cancelAnimationFrame(this.raf);this.model?.dispose();this.host.replaceChildren();}
}
