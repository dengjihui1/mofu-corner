import * as T from './vendor/three.module.mjs';
import {FACE_FRAGMENT} from './whole-plush.mjs?v=20';
import {REFERENCE_ART} from './rig-reference.mjs';
import {RABBIT_REST,solvePaw} from './rabbit-motion.mjs?v=20';
let engine;
function renderer(){if(!engine){engine=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});engine.setSize(640,660);engine.setClearColor(0,0);engine.outputColorSpace=T.SRGBColorSpace;engine.toneMapping=T.NoToneMapping;}return engine;}
const texture=c=>{const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.minFilter=T.LinearFilter;t.generateMipmaps=false;return t;};
const load=async src=>{const im=new Image();im.src=src;await im.decode();return im;};
const silhouette={
 head:'M0 0H263V232Q235 239 209 242Q176 261 125 259Q62 258 25 237L0 219Z',
 leftPaw:'M20 254C23 244 30 240 40 240C56 240 66 250 67 264C68 277 54 288 38 290C20 288 14 272 20 254Z',
 rightPaw:'M113 254C135 250 156 262 166 278C175 296 157 310 137 308C114 307 96 298 100 279Z',
 leftFoot:'M24 345C39 333 65 334 81 346C96 356 91 373 68 377L30 378C12 377 11 356 24 345Z',
 rightFoot:'M124 347C139 339 161 344 173 354C185 367 175 379 159 379H125C108 378 109 357 124 347Z'
};
export class RabbitScene{
 constructor(){
  this.scene=new T.Scene();this.camera=new T.OrthographicCamera(0,320,0,330,-30,30);this.root=new T.Group();this.root.position.set(72.56,51,0);this.root.scale.setScalar(252/379);this.scene.add(this.root);this.resources=[];
  this.ready=load('assets/rig-rabbit-v1.png').then(im=>{if(this.disposed)return;this.image=im;this.build();this.apply(RABBIT_REST);});
 }
 canvas(rect,path){const c=document.createElement('canvas');c.width=rect[2];c.height=rect[3];const ctx=c.getContext('2d');if(path){ctx.translate(-rect[0],-rect[1]);ctx.clip(new Path2D(path));ctx.translate(rect[0],rect[1]);}ctx.drawImage(this.image,1140+rect[0],650+rect[1],rect[2],rect[3],0,0,rect[2],rect[3]);return c;}
 plane(canvas,x,y,w=canvas.width,h=canvas.height,z=1,material){
  const g=new T.PlaneGeometry(w,h,32,32);const a=g.attributes.position;for(let i=0;i<a.count;i++)a.setY(i,-a.getY(i));const tx=texture(canvas),m=material||new T.MeshBasicMaterial({map:tx,transparent:true,alphaTest:.035,side:T.DoubleSide});if(material)m.uniforms.art.value=tx;
  const mesh=new T.Mesh(g,m);mesh.position.set(x,y,z);mesh.frustumCulled=false;this.root.add(mesh);this.resources.push(g,m,tx);return mesh;
 }
 build(){
  // Face and paws retain the approved rabbit pixels; body and tail use matching art from the same atlas.
  // Filled regions only supply fur that was occluded by a paw or the head.
  const body=document.createElement('canvas');body.width=183;body.height=158;const c=body.getContext('2d');
  c.save();c.beginPath();c.rect(0,34,183,124);c.clip();c.drawImage(this.image,64,84,275,271,11,0,160,158);c.restore();
  this.body=this.plane(body,0,0,183,158,1);this.bodyCenter=[18+91.5-116,203+79-338];
  const pixels=c.getImageData(0,0,183,158).data;this.bodyBoundary=[];for(let y=0;y<158;y++){let lo=183,hi=-1;for(let x=0;x<183;x++)if(pixels[(y*183+x)*4+3]>70){lo=Math.min(lo,x);hi=x;}if(hi>=0){this.bodyBoundary.push([lo-91.5,y-79],[hi-91.5,y-79]);}}
  const tail=document.createElement('canvas');tail.width=153;tail.height=150;tail.getContext('2d').drawImage(this.image,1197,179,153,150,0,0,153,150);
  this.tail=this.plane(tail,203,304,52,51,-1);
  this.leftFoot=this.plane(this.canvas([10,333,88,46],silhouette.leftFoot),54,356,88,46,.5);
  this.rightFoot=this.plane(this.canvas([107,339,78,40],silhouette.rightFoot),146,359,78,40,.5);
  this.leftPaw=this.plane(this.canvas([12,237,67,65],silhouette.leftPaw),45.5,269.5,67,65,5);
  this.rightPaw=this.plane(this.canvas([94,248,83,65],silhouette.rightPaw),135.5,280.5,83,65,5);
  const fur=this.canvas([112,141,18,16]);this.skin=texture(fur);this.resources.push(this.skin);
  this.arms=[this.capsule(30,21,.3),this.capsule(33,21,2),this.capsule(30,21,.3),this.capsule(33,21,2)];
  this.hind=[this.capsule(22,29,.2),this.capsule(26,27,.3),this.capsule(22,29,.2),this.capsule(26,27,.3)];
  const eyes=REFERENCE_ART.rabbit.eyes;
  this.face={art:{value:null},opening:{value:1},happy:{value:0},mouthOpen:{value:0},mouth:{value:new T.Vector4(.371,1-.554*379/263,.075,.045*379/263)},eyeA:{value:new T.Vector4()},eyeB:{value:new T.Vector4()},skinA:{value:new T.Color(eyes[0].color)},skinB:{value:new T.Color(eyes[1].color)}};
  eyes.forEach((e,i)=>this.face[i?'eyeB':'eyeA'].value.set(e.cx,1-e.cy*379/263,e.rx,e.ry*379/263));
  const rabbitFace=FACE_FRAGMENT.replace('source.y=mouth.y+(source.y-mouth.y)/(1.+mouthOpen*mw*.38);',`float yawn=max(0.,(mouthOpen-.35)/.65);source.y=mouth.y+(source.y-mouth.y)/(1.+yawn*mw*.65);`).replace('vec4 c=texture2D(art,source);',`vec4 c=texture2D(art,source);
   float close=1.-smoothstep(.03,.3,mouthOpen);
   float mouthMask=(1.-smoothstep(.8,1.35,length(mq)))*(1.-smoothstep(.35,.65,mq.y));
   vec4 chin=texture2D(art,vec2(uvArt.x,mouth.y-mouth.w*1.7));
   float arc=(1.-smoothstep(.04,.11,abs(mq.y+.10+.18*(1.-mq.x*mq.x))))*(1.-smoothstep(.42,.7,abs(mq.x)));
   chin.rgb=mix(chin.rgb,vec3(.28,.13,.09),arc);c=mix(c,chin,mouthMask*close);`);
  const fm=new T.ShaderMaterial({uniforms:this.face,transparent:true,side:T.DoubleSide,depthTest:true,vertexShader:'varying vec2 uvArt;void main(){uvArt=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:rabbitFace});
  const skull=this.canvas([0,0,263,263],silhouette.head),sc=skull.getContext('2d');sc.globalCompositeOperation='destination-out';sc.fill(new Path2D(silhouette.leftPaw));sc.fill(new Path2D(silhouette.rightPaw));
  const chin=document.createElement('canvas');chin.width=263;chin.height=263;const cc=chin.getContext('2d');cc.beginPath();cc.ellipse(107,211,103,47,0,0,Math.PI*2);cc.clip();cc.fillStyle=cc.createPattern(this.canvas([87,230,24,16]),'repeat');cc.fillRect(58,234,122,29);cc.globalCompositeOperation='destination-in';const feather=cc.createLinearGradient(56,0,184,0);feather.addColorStop(0,'#fff0');feather.addColorStop(.13,'#fff');feather.addColorStop(.87,'#fff');feather.addColorStop(1,'#fff0');cc.fillStyle=feather;cc.fillRect(0,0,263,263);
  // Draw the source head over its hidden chin fill; no paw pixels remain on the skull.
  const complete=document.createElement('canvas');complete.width=263;complete.height=263;complete.getContext('2d').drawImage(chin,0,0);complete.getContext('2d').drawImage(skull,0,0);
  this.head=this.plane(complete,0,0,263,263,4,fm);this.headOriginal=this.head.geometry.attributes.position.array.slice();
 }
 capsule(length,width,z){
  const g=new T.PlaneGeometry(width,length+width),m=new T.ShaderMaterial({transparent:true,side:T.DoubleSide,uniforms:{fur:{value:this.skin},dimensions:{value:new T.Vector2(width,length+width)}},vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`uniform sampler2D fur;uniform vec2 dimensions;varying vec2 v;void main(){vec2 p=(v-.5)*dimensions;float r=dimensions.x*.5;float l=dimensions.y-dimensions.x;float d=length(vec2(p.x,max(abs(p.y)-l*.5,0.)));float a=1.-smoothstep(r-1.,r,d);vec3 color=texture2D(fur,v).rgb;float shade=.76+.24*sqrt(max(0.,1.-pow(p.x/r,2.)));gl_FragColor=vec4(color*shade,a);
  #include <colorspace_fragment>
  }`});const mesh=new T.Mesh(g,m);mesh.position.z=z;this.root.add(mesh);this.resources.push(g,m);return mesh;
 }
 segment(mesh,a,b){mesh.position.x=(a[0]+b[0])/2;mesh.position.y=(a[1]+b[1])/2;mesh.rotation.z=-Math.atan2(b[0]-a[0],b[1]-a[1]);}
 apply(p,time=0){
  if(!this.head)return;this.pose=p;const co=Math.cos(p.br),si=Math.sin(p.br);
  this.body.position.x=p.bx+this.bodyCenter[0]*co-this.bodyCenter[1]*si;this.body.position.y=p.by+this.bodyCenter[0]*si+this.bodyCenter[1]*co;this.body.rotation.z=p.br;
  const bottom=Math.max(...this.bodyBoundary.map(([x,y])=>this.body.position.y+x*si+y*co));this.body.position.y+=Math.min(0,376-bottom);
  this.tail.position.set(p.tx,p.ty,-1);this.tail.rotation.z=p.tr;
  this.leftFoot.position.set(p.lfx-4,p.lfy-23,.5);this.rightFoot.position.set(p.rfx-4,p.rfy-20,.5);
  const left=solvePaw([p.lsx,p.lsy],[p.lpx,p.lpy],30,33,-1),right=solvePaw([p.rsx,p.rsy],[p.rpx,p.rpy],30,33,1);
  this.segment(this.arms[0],[p.lsx,p.lsy],left.elbow);this.segment(this.arms[1],left.elbow,left.paw);this.segment(this.arms[2],[p.rsx,p.rsy],right.elbow);this.segment(this.arms[3],right.elbow,right.paw);
  this.leftPaw.position.set(left.paw[0]+3.5,left.paw[1]-3.5,5);this.rightPaw.position.set(right.paw[0]+.5,right.paw[1]-3.5,5);
  this.leftPaw.rotation.z=p.lpr;this.rightPaw.rotation.z=p.rpr;
  const hl=solvePaw([p.lhx,p.lhy],[p.lfx,p.lfy-22],22,26,1),hr=solvePaw([p.rhx,p.rhy],[p.rfx,p.rfy-22],22,26,-1);
  this.segment(this.hind[0],[p.lhx,p.lhy],hl.elbow);this.segment(this.hind[1],hl.elbow,hl.paw);this.segment(this.hind[2],[p.rhx,p.rhy],hr.elbow);this.segment(this.hind[3],hr.elbow,hr.paw);
  this.reachErrors=[left,right,hl,hr].map(s=>s.reachError);
  // Rigid skull and paws; only the ear tips flex. The face never squashes.
  const hx=131.5-112,hy=131.5-248,ch=Math.cos(p.hr),sh=Math.sin(p.hr);
  this.head.position.set(p.hx+hx*ch-hy*sh,p.hy+hx*sh+hy*ch,4);this.head.rotation.z=p.hr;
  const a=this.head.geometry.attributes.position.array,o=this.headOriginal;
  for(let i=0;i<a.length;i+=3){const x=o[i]+131.5,y=o[i+1]+131.5;let dx=0,dy=0;
   if(y<120&&x<110){const u=Math.max(0,Math.min(1,(120-y)/100)),ang=(p.ear+Math.sin(time*1.4)*.009)*u;dx=(x-65)*Math.cos(ang)-(y-125)*Math.sin(ang)-(x-65);dy=(x-65)*Math.sin(ang)+(y-125)*Math.cos(ang)-(y-125);}
   if(x>179&&y<174){const u=Math.max(0,Math.min(1,(x-179)/65)),ang=-p.ear*u*.7;dx=(x-179)*Math.cos(ang)-(y-112)*Math.sin(ang)-(x-179);dy=(x-179)*Math.sin(ang)+(y-112)*Math.cos(ang)-(y-112);}
   a[i]=o[i]+dx;a[i+1]=o[i+1]+dy;
  }this.head.geometry.attributes.position.needsUpdate=true;
  this.face.opening.value=Math.max(.025,Math.min(1.12,p.eye));this.face.happy.value=p.smile;this.face.mouthOpen.value=p.mouth;
 }
 render(ctx){if(!this.head)return;const r=renderer();r.render(this.scene,this.camera);ctx.clearRect(0,0,640,660);ctx.save();ctx.translate(320,611);ctx.scale(1,.17);const shadow=ctx.createRadialGradient(0,0,0,0,0,94);shadow.addColorStop(0,'#75644a22');shadow.addColorStop(1,'#75644a00');ctx.fillStyle=shadow;ctx.fillRect(-100,-100,200,200);ctx.restore();ctx.drawImage(r.domElement,0,0);}
 inspect(){return {renderer:'rabbit-skeleton',poseArtSwitches:0,reachErrors:this.reachErrors,pawScale:[this.leftPaw.scale.x,this.leftPaw.scale.y],headScale:[this.head.scale.x,this.head.scale.y]};}
 dispose(){this.disposed=true;for(const r of this.resources)r.dispose();}
}
