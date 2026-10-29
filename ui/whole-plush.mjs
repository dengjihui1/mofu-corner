import * as T from './vendor/three.module.mjs';
import {RIG_ASSETS} from './rig-assets.mjs';
import {REFERENCE_ART} from './rig-reference.mjs';
import {MOTION_ASSETS} from './motion-assets.mjs';
import {clamp} from './joint-motion.mjs';

// One intact illustration per pose. Never assemble or duplicate anatomical parts.
let renderer;
const images=new Map();
const load=src=>{if(!images.has(src))images.set(src,new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src;}));return images.get(src);};
function engine(){if(!renderer){renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});renderer.setSize(640,660);renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.NoToneMapping;}return renderer;}
const fragment=`
uniform sampler2D art; uniform float opening; uniform float happy; uniform float mouthOpen; uniform vec4 mouth; uniform vec4 eyeA; uniform vec4 eyeB;
uniform vec3 skinA; uniform vec3 skinB;
varying vec2 uvArt;
vec4 eyelid(vec4 color,vec4 eye,vec3 skin){
 vec2 q=(uvArt-eye.xy)/eye.zw; float d=length(q);
 if(d>1.6||abs(opening-1.)<.001)return color;
 float o=opening<.16?0.:opening;float feather=1.-smoothstep(1.05,1.6,d);
 vec2 lookup=uvArt;
 // Retain the original fur around a closing eye, rather than painting flat circles.
 if(o>0.&&abs(q.y)<o){lookup.y=eye.y+(uvArt.y-eye.y)/o;}
 else {lookup.y=eye.y+eye.w*(2.35+q.y*.18);}
 vec4 closed=texture2D(art,lookup);
 if(o==0.){vec3 sampleBase=texture2D(art,eye.xy+vec2(0.,eye.w*2.35)).rgb;closed.rgb=clamp(skin+(closed.rgb-sampleBase)*.6,0.,1.);}
 float curve=mix(-.25,.45,happy)*(1.-q.x*q.x);
 float line=(1.-smoothstep(.055,.14,abs(q.y-curve)))*(1.-smoothstep(.8,1.15,abs(q.x)));
 closed.rgb=mix(closed.rgb,vec3(.22,.12,.09),line*(1.-smoothstep(.10,.25,opening)));
 return mix(color,closed,feather);
}
void main(){vec2 source=uvArt;
 vec2 mq=(source-mouth.xy)/max(mouth.zw,vec2(.001));
 float mw=1.-smoothstep(.45,1.6,length(mq));
 source.y=mouth.y+(source.y-mouth.y)/(1.+mouthOpen*mw*.38);
 vec4 c=texture2D(art,source);c=eyelid(c,eyeA,skinA);c=eyelid(c,eyeB,skinB);gl_FragColor=c;
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
export const FACE_FRAGMENT=fragment;

export class PlushScene{
 constructor(species){
  this.species=species;this.reference=REFERENCE_ART[species];this.pose={};this.scene=new T.Scene();this.camera=new T.OrthographicCamera(0,320,0,330,-10,10);
  this.geometry=new T.PlaneGeometry(1,1,32,40);this.original=this.geometry.attributes.position.array.slice();
  this.uniforms={art:{value:null},opening:{value:1},happy:{value:0},mouthOpen:{value:0},mouth:{value:new T.Vector4()},eyeA:{value:new T.Vector4()},eyeB:{value:new T.Vector4()},skinA:{value:new T.Color(this.reference.eyes[0].color)},skinB:{value:new T.Color(this.reference.eyes[1].color)}};
  const mouth={rabbit:[.371,.554,.075,.045],dog:[.476,.436,.08,.055],tiger:[.433,.462,.085,.06],monkey:[.481,.446,.07,.04]}[species];
  if(mouth)this.uniforms.mouth.value.set(mouth[0],1-mouth[1],mouth[2],mouth[3]);
  this.material=new T.ShaderMaterial({transparent:true,depthTest:false,uniforms:this.uniforms,vertexShader:'varying vec2 uvArt;void main(){uvArt=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:fragment});
  this.mesh=new T.Mesh(this.geometry,this.material);this.mesh.frustumCulled=false;this.scene.add(this.mesh);
  this.ready=Promise.all([load(RIG_ASSETS[species].src),load(MOTION_ASSETS[species].src)]).then(([reference,atlas])=>{
   if(this.disposed)return;this.referenceImage=reference;this.motionImage=atlas;this.setArtwork('rest');this.apply(this.pose,0);
  });
 }
 setArtwork(mode){
  if(this.mode===mode)return;this.mode=mode;
  const rect=mode==='sleep'?MOTION_ASSETS[this.species].rects[14]:this.reference.rect;
  const canvas=document.createElement('canvas');canvas.width=rect[2];canvas.height=rect[3];canvas.getContext('2d').drawImage(mode==='sleep'?this.motionImage:this.referenceImage,...rect,0,0,rect[2],rect[3]);
  this.texture?.dispose();this.texture=new T.CanvasTexture(canvas);this.texture.colorSpace=T.SRGBColorSpace;this.texture.minFilter=T.LinearFilter;this.texture.generateMipmaps=false;this.uniforms.art.value=this.texture;
  this.height=mode==='sleep'?Math.min(154,245*rect[3]/this.reference.rect[3]):252;
  this.width=this.height*rect[2]/rect[3];
  // Texture V runs bottom to top. Eye measurements run top to bottom.
  this.reference.eyes.forEach((e,i)=>this.uniforms[i?'eyeB':'eyeA'].value.set(e.cx,1-e.cy,e.rx,e.ry));
 }
 apply(p,time=0){
  this.pose=p;if(!this.texture)return;
  // The big lying/standing transition is deliberately not synthesized from cutouts.
  // Swap between two complete drawings only after the eyes have closed.
  const asleep=(p.cuddle||0)>.62;this.setArtwork(asleep?'sleep':'rest');
  const sleeping=this.mode==='sleep',height=Number(p.height)||0;
  this.uniforms.opening.value=sleeping?1:clamp(p.eye??1,.025,1.12);this.uniforms.happy.value=p.expression==='happy'||p.expression==='pleased'?1:0;
  this.uniforms.mouthOpen.value=sleeping?0:Math.max(0,(p.mouth||0)-.08);
  const a=this.geometry.attributes.position.array,w=this.width,h=this.height;
  const airborne=Math.max(0,height)*60,compression=Math.max(-.17,Math.min(0,height))*27;
  const lean=clamp((p.tilt||0)*.45+(p.head||0)*.12,-.045,.045),co=Math.cos(lean),si=Math.sin(lean);
  const breathing=Math.sin(time*1.65)*.45;
  for(let i=0;i<a.length;i+=3){
   const nx=this.original[i],ny=-this.original[i+1],v=ny+.5;
   // Feet and lower legs stay attached and keep their original dimensions.
   // Only the broad torso/neck region bends by a few pixels.
   const headWeight=1-smooth(.48,.82,v),bodyWeight=1-smooth(.64,.91,v);
   const x=nx*w,y=(v-1)*h;
   const headX=x*co-(y+h*.56)*si,headY=x*si+(y+h*.56)*co-h*.56;
   const earWeight=1-smooth(.02,.32,v);
   a[i]=160+x+(headX-x)*headWeight+(p.look||0)*8*headWeight+(p.ear||0)*5*earWeight;
   a[i+1]=303+y-airborne-compression*bodyWeight+(headY-y)*headWeight+(sleeping?0:breathing*bodyWeight);
   a[i+2]=0;
  }
  this.geometry.attributes.position.needsUpdate=true;
 }
 render(ctx){if(!this.texture)return;const r=engine();r.render(this.scene,this.camera);ctx.clearRect(0,0,640,660);
  const air=Math.max(0,this.pose.height||0),g=ctx.createRadialGradient(320,610,2,320,610,100);g.addColorStop(0,`rgba(85,73,58,${.12-air*.10})`);g.addColorStop(1,'rgba(85,73,58,0)');ctx.fillStyle=g;ctx.save();ctx.translate(320,610);ctx.scale(1,.16);ctx.translate(-320,-610);ctx.fillRect(200,510,240,200);ctx.restore();ctx.drawImage(r.domElement,0,0);
 }
 inspect(){return {renderer:'intact-plush',anatomicalLayers:1,mode:this.mode,aspectRatio:this.width/this.height,sourceAspectRatio:this.texture.image.width/this.texture.image.height};}
 dispose(){this.disposed=true;this.geometry.dispose();this.material.dispose();this.texture?.dispose();}
}
function smooth(a,b,x){const u=clamp((x-a)/(b-a));return u*u*(3-2*u);}
