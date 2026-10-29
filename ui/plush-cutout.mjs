import * as T from './vendor/three.module.mjs';
import {RIG_ASSETS} from './rig-assets.mjs';
import {clamp} from './joint-motion.mjs';
import {ANATOMY_LAYOUT} from './anatomy-layout.mjs';
let renderer;
const textures=new Map();
const load=src=>{if(!textures.has(src))textures.set(src,new Promise((resolve,reject)=>{new T.TextureLoader().load(src,t=>{t.colorSpace=T.SRGBColorSpace;t.minFilter=T.LinearFilter;t.magFilter=T.LinearFilter;t.generateMipmaps=false;resolve(t);},undefined,reject);}));return textures.get(src);};
function engine(){if(!renderer){renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});renderer.setSize(640,660);renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.NoToneMapping;}return renderer;}
const group=(parent,x=0,y=0)=>{const g=new T.Group();g.position.set(x,y,0);parent.add(g);return g;};
const QUADS=['ox','horse','sheep','dog','pig'];
function faceCanvas(canvas,p){
 const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;c.clearRect(0,0,w,h);const open=clamp(p.eye),sleep=p.cuddle>.7;
 const eye=(x,y)=>{
  c.save();c.translate(x,y);
  if(open>.13){
   c.save();c.beginPath();c.ellipse(0,0,34,39*open,0,0,Math.PI*2);c.clip();
   const rim=c.createRadialGradient(-8,-10,5,0,0,39);rim.addColorStop(0,'#60402e');rim.addColorStop(.55,'#2e1b14');rim.addColorStop(.86,'#120d0b');rim.addColorStop(1,'#70472c');c.fillStyle=rim;c.beginPath();c.ellipse(0,0,34,39,0,0,Math.PI*2);c.fill();
   c.fillStyle='#090909';c.beginPath();c.ellipse(1,3,25,31,0,0,Math.PI*2);c.fill();
   const glint=c.createRadialGradient(-10,-15,1,-10,-15,12);glint.addColorStop(0,'#fff');glint.addColorStop(.64,'#fffffff0');glint.addColorStop(1,'#ffffff00');c.fillStyle=glint;c.beginPath();c.ellipse(-10,-15,12,10,-.4,0,Math.PI*2);c.fill();
   c.fillStyle='#fff7ebbb';c.beginPath();c.ellipse(11,16,3.4,3,0,0,Math.PI*2);c.fill();c.restore();
  }else{c.strokeStyle='#603c30';c.lineWidth=6;c.lineCap='round';c.beginPath();c.moveTo(-29,2);c.quadraticCurveTo(0,sleep?16:-23,29,2);c.stroke();}
  c.restore();
 };
 eye(w*.295,h*.535);eye(w*.705,h*.535);
 // A small embroidered heart nose and one mouth, all drawn on the same face layer.
 const nx=w*.50,ny=h*.665;c.save();c.translate(nx,ny);const nose=c.createLinearGradient(0,-8,0,10);nose.addColorStop(0,'#efa6a0');nose.addColorStop(1,'#d98583');c.fillStyle=nose;c.beginPath();c.moveTo(0,9);c.bezierCurveTo(-28,-3,-11,-16,0,-8);c.bezierCurveTo(11,-16,28,-3,0,9);c.fill();c.restore();
 const mx=nx,my=h*.746;c.save();c.translate(mx,my);
 if(sleep){c.strokeStyle='#7e4938';c.lineWidth=3.6;c.lineCap='round';c.beginPath();c.moveTo(-16,-2);c.quadraticCurveTo(0,11,16,-2);c.stroke();}
 else{
  const mouth=Math.max(.08,p.mouth),rx=19+7*p.smile,ry=15+mouth*29;c.fillStyle='#803e31';c.beginPath();c.moveTo(-rx,-8);c.quadraticCurveTo(0,2,rx,-8);c.bezierCurveTo(rx,ry,-rx,ry,-rx,-8);c.fill();
  c.save();c.beginPath();c.moveTo(-rx,-8);c.quadraticCurveTo(0,2,rx,-8);c.bezierCurveTo(rx,ry,-rx,ry,-rx,-8);c.clip();const tongue=c.createLinearGradient(0,ry*.2,0,ry);tongue.addColorStop(0,'#f4a09b');tongue.addColorStop(1,'#e78383');c.fillStyle=tongue;c.beginPath();c.ellipse(0,ry*.75,rx*.8,ry*.43,0,0,Math.PI*2);c.fill();c.restore();
  c.fillStyle='#fff2dc';c.beginPath();c.roundRect(-6,-7,12,7,2);c.fill();
 }
 c.restore();
}
export class PlushScene{
 constructor(species){
  this.species=species;this.layout=ANATOMY_LAYOUT[species];this.data=RIG_ASSETS[species];this.quad=QUADS.includes(species);this.anatomy=this.quad?'quadruped':species==='snake'?'coiled':species==='rooster'?'bird':'seated';this.scene=new T.Scene();this.camera=new T.OrthographicCamera(0,320,0,330,.1,2000);this.camera.position.z=1000;this.root=group(this.scene);this.parts={};this.resources=[];this.images=[];this.faceContext=null;
  this.ready=Promise.all([load(this.data.src),species==='rabbit'?load('assets/rabbit-plush-head-v9.png'):null]).then(([atlas,head])=>{this.atlas=atlas;this.headTexture=head;this.build();this.apply(this.pending||{height:0,pitch:0,head:0,tilt:0,arms:0,cuddle:0,ear:0,eye:1,smile:.25,mouth:.08,flight:0,fold:0,look:0});});
 }
 part(key,index,x,y,width,parent=this.root,{crop=0,texture=null,rect=null}={}){
  const d=this.data;rect=rect||d.rects[index];if(!rect)return;const [sx,sy,sw,fullH]=rect,sh=fullH*(1-crop),top=sy+fullH*crop,height=width*sh/sw;texture=texture||this.atlas;const texW=texture.image.width,texH=texture.image.height;
  const geometry=new T.PlaneGeometry(width,height),pos=geometry.attributes.position,uv=geometry.attributes.uv;
  for(let i=0;i<pos.count;i++){const u=pos.getX(i)/width+.5,v=pos.getY(i)/height+.5;uv.setXY(i,(sx+u*sw)/texW,1-(top+v*sh)/texH);}
  const mat=new T.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.12,depthTest:true,depthWrite:true,toneMapped:false,side:T.DoubleSide});const mesh=new T.Mesh(geometry,mat);mesh.renderOrder=this.images.length;const node=group(parent,x,y);node.add(mesh);node.userData={width,height,source:[sx,top,sw,sh]};this.parts[key]=node;this.images.push({key,index,mesh,width,height,source:[sx,top,sw,sh]});this.resources.push(geometry,mat);return node;
 }
 build(){
  const s=this.species,d=this.data,l=this.layout;
  const shadow=document.createElement('canvas');shadow.width=256;shadow.height=64;const sc=shadow.getContext('2d');sc.scale(4,1);const fade=sc.createRadialGradient(32,32,2,32,32,31);fade.addColorStop(0,'#55433170');fade.addColorStop(1,'#55433100');sc.fillStyle=fade;sc.fillRect(0,0,64,64);const shadowMap=new T.CanvasTexture(shadow);const shadowMat=new T.MeshBasicMaterial({map:shadowMap,transparent:true,depthTest:false,depthWrite:false,side:T.DoubleSide,opacity:.23,toneMapped:false});const shadowGeo=new T.PlaneGeometry(92,8);this.shadow=new T.Mesh(shadowGeo,shadowMat);this.shadow.position.set(160,307,-10);this.shadow.renderOrder=-10;this.scene.add(this.shadow);this.resources.push(shadowMap,shadowMat,shadowGeo);
  this.part('tail',3,l.tailX,l.tailY,l.tailWidth);
  if(s!=='snake'){
   if(s==='rooster'){this.part('feetPair',6,160,280,l.footWidth);}
   else if(this.quad){this.part('legPairL',4,l.legsX[0],278,l.legWidth);this.part('legPairR',5,l.legsX[1],278,l.legWidth);}
   else{this.part('footL',6,l.feetX[0],285,l.footWidth);this.part('footR',7,l.feetX[1],285,l.footWidth);}
  }
  this.part('body',0,160,l.bodyY,l.bodyWidth);
  if(s==='rat'){
   const body=this.parts.body,mat=body.children[0].material,{width,height}=body.userData;
   mat.onBeforeCompile=shader=>{shader.vertexShader='varying vec2 pelvisXY;\n'+shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>\npelvisXY=vec2(position.x/${width.toFixed(6)},position.y/${height.toFixed(6)});`);shader.fragmentShader='varying vec2 pelvisXY;\n'+shader.fragmentShader.replace('#include <alphatest_fragment>','float notchEdge=.38+.12*pow(abs(pelvisXY.x)/.20,2.);\ndiffuseColor.a*=1.-smoothstep(notchEdge-.005,notchEdge+.005,pelvisXY.y);\n#include <alphatest_fragment>');};
  }

  this.headRoot=group(this.root,160,l.headY);
  if(!['snake','rooster','sheep','dragon'].includes(s)){
   const sizes=s==='rabbit'?[[8,-38,-91,47],[9,46,-59,79]]:s==='dog'?[[8,-60,28,76],[9,60,28,76]]:s==='horse'?[[8,-41,-68,32],[9,43,-69,32]]:['rat','tiger','monkey'].includes(s)?[[8,-53,-44,54],[9,54,-44,54]]:[[8,-61,-14,40],[9,61,-14,40]];
   for(const [idx,x,y,w]of sizes)this.part(idx===8?'earL':'earR',idx,x,y,w,this.headRoot);
  }
  if(s==='rabbit'){
   this.part('head',1,0,0,l.headWidth,this.headRoot,{texture:this.headTexture,rect:[69,204,1123,894]});
   this.faceCanvas=document.createElement('canvas');this.faceCanvas.width=512;this.faceCanvas.height=420;this.faceTexture=new T.CanvasTexture(this.faceCanvas);this.faceTexture.colorSpace=T.SRGBColorSpace;this.faceTexture.minFilter=T.LinearFilter;this.faceTexture.generateMipmaps=false;
   const face=this.part('face',1,0,0,154,this.headRoot,{texture:this.faceTexture,rect:[0,0,512,420]});face.userData.height=this.parts.head.userData.height;this.parts.face.children[0].scale.y=this.parts.head.userData.height/(154*420/512);
  }else{
   const w=l.headWidth;this.part('head',1,0,0,w,this.headRoot);this.part('headClosed',2,0,0,w,this.headRoot);this.part('headYawn',10,0,0,w,this.headRoot);
  }
  if(!this.quad&&s!=='snake'){
   this.armRootL=group(this.root,...l.shoulders[0]);this.armRootR=group(this.root,...l.shoulders[1]);
   this.part('armL',4,-4,12,l.armWidth,this.armRootL);this.part('armR',5,4,12,l.armWidth,this.armRootR);
  }
  for(const [key,node] of Object.entries(this.parts)){const order=key==='tail'?0:key.startsWith('foot')||key==='feetPair'||key.startsWith('legPair')?5:key==='body'?10:key.startsWith('arm')?20:key.startsWith('ear')?30:key==='face'?41:40;node.children[0].renderOrder=key.startsWith('arm')?45:order;node.position.z=key==='tail'?-3:key.startsWith('foot')||key==='feetPair'||key.startsWith('legPair')?0:key==='body'?1:key.startsWith('arm')?0:key.startsWith('ear')?-1:key==='face'?.3:0;}this.headRoot.position.z=5;if(this.armRootL){this.armRootL.position.z=.2;this.armRootR.position.z=.2;}
  this.rest=Object.fromEntries(Object.entries(this.parts).map(([k,g])=>[k,{x:g.position.x,y:g.position.y}]));
 }
 apply(p,time=0){
  this.pending=p;if(!this.atlas)return;this.current=p;const a=this.parts,rest=this.rest,s=this.species,l=this.layout,air=p.height>0?p.height*78:0,c=p.cuddle;
  const rootY=p.flight?air:0,compression=Math.max(0,-p.height)*78,proneX=s==='snake'?0:(this.quad?48:38)*c;this.root.position.y=-rootY;
  this.shadow.position.x=160+proneX*.35;this.shadow.material.opacity=.23*Math.exp(-Math.max(0,p.height)*2.5);
  if(a.body){const r=rest.body,{width:w,height:h}=a.body.userData,angle=s==='snake'?0:p.pitch*.08*(1-c)-c*Math.PI/2;const support=Math.hypot(w*.5*Math.sin(angle),h*.5*Math.cos(angle)),floor=306-support,drop=s==='snake'?0:Math.max(0,floor-r.y-17.16);a.body.position.set(r.x+proneX,Math.min(floor,r.y+compression+c*drop),1);a.body.rotation.z=angle;}
  const headFloor=306-Math.max(...['head','headClosed','headYawn'].map(k=>a[k]?.userData.height||0))/2;const headDrop=s==='snake'?37:Math.max(0,headFloor-l.headY-17.16);this.headRoot.position.set(160+p.look*17-(s==='snake'?0:c*12),Math.min(headFloor,l.headY+compression+c*headDrop),5);this.headRoot.rotation.z=p.tilt+p.head*.4-c*.08;if(s==='snake'){this.headRoot.rotation.z+=p.arms*.13;this.headRoot.position.y=l.headY+c*8-p.arms*6;}
  for(const side of ['L','R']){
   const foot=a['foot'+side];if(foot){const r=rest['foot'+side];foot.position.x=r.x+proneX;foot.position.y=306-foot.userData.height/2-p.fold*35;foot.rotation.z=(side==='L'?1:-1)*p.fold*.7;}
   const pair=a['legPair'+side];if(pair){pair.position.x=rest['legPair'+side].x+proneX;pair.position.y=306-pair.userData.height*.5;pair.rotation.z=0;}
   const ear=a['ear'+side];if(ear){ear.rotation.z=(s==='dog'?(side==='L'?-.89:.89):0)+(side==='L'?1:-1)*(p.ear*.6+c*.09);}
  }
  if(a.feetPair){a.feetPair.position.x=160+proneX;a.feetPair.position.y=306-a.feetPair.userData.height/2;}
  if(this.armRootL){
   const restAngle=l.armRest,angle=(restAngle+p.arms*2.8)*(1-c);
   for(const [i,side]of ['L','R'].entries()){const root=this['armRoot'+side],[sx,sy]=l.shoulders[i];root.position.x=sx+((side==='L'?160:183)-sx)*c;root.position.y=sy+compression+c*(278-sy-17.16);root.rotation.z=(side==='L'?angle:-angle)+1.12*c;a['arm'+side].children[0].rotation.x=.18+p.arms*.8+c*.45;}
   if(s==='rooster'){
    this.scene.updateMatrixWorld(true);
    for(const [i,side]of ['L','R'].entries()){const root=this['armRoot'+side],[sx,sy]=l.shoulders[i],anchor=a.body.localToWorld(new T.Vector3(sx-160,sy-l.bodyY,1));root.position.copy(this.root.worldToLocal(anchor));root.rotation.z=a.body.rotation.z+(side==='L'?1:-1)*(l.armRest+p.arms*1.3);const mesh=a['arm'+side].children[0];mesh.rotation.x=0;mesh.rotation.y=(side==='L'?1:-1)*(.24+c*.10);}
   }
   if(!p.flight){this.scene.updateMatrixWorld(true);for(const side of ['L','R']){const node=a['arm'+side],{width:w,height:h}=node.userData;let bottom=-Infinity;for(const x of [-w/2,w/2])for(const y of [-h/2,h/2])bottom=Math.max(bottom,node.children[0].localToWorld(new T.Vector3(x,y,0)).y);if(bottom>306)this['armRoot'+side].position.y-=bottom-306;}}
  }
  if(a.tail){a.tail.position.x=rest.tail.x+proneX;a.tail.position.y=rest.tail.y+compression+c*5;a.tail.rotation.z=Math.sin(time*1.5)*.03+p.arms*.07;}
  if(this.faceCanvas){faceCanvas(this.faceCanvas,p);this.faceTexture.needsUpdate=true;}
  else{const variant=p.mouth>.65?'headYawn':p.eye<.3?'headClosed':'head';for(const key of ['head','headClosed','headYawn'])if(a[key])a[key].visible=key===variant;}
 }
 render(ctx){if(!this.atlas)return;const r=engine();r.render(this.scene,this.camera);ctx.clearRect(0,0,640,660);ctx.drawImage(r.domElement,0,0);}
 inspect(){return {species:this.species,anatomy:this.anatomy,legs:this.quad?4:this.species==='snake'?0:2,arms:this.quad||this.species==='snake'?0:2,parts:this.images.map(({key,width,height,source,mesh})=>({key,width,height,source,visible:mesh.parent.visible,scale:mesh.scale.toArray()})),headCopies:this.species==='rabbit'?1:3,activeHeadCopies:['head','headClosed','headYawn'].filter(k=>this.parts[k]?.visible).length};}
 dispose(){for(const item of this.resources)item.dispose();this.faceTexture?.dispose();}
}
