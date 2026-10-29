import {FLOW_ASSETS} from './flow-assets.mjs';
const cache=new Map();
async function readBytes(url){
 try{const r=await fetch(url);if(!r.ok&&r.status!==0)throw Error('FLOW_HTTP_'+r.status);return new Uint8Array(await r.arrayBuffer());}
 catch(error){if(url.protocol!=='file:')throw error;return new Promise((resolve,reject)=>{const xhr=new XMLHttpRequest();xhr.open('GET',url);xhr.responseType='arraybuffer';xhr.onload=()=>resolve(new Uint8Array(xhr.response));xhr.onerror=()=>reject(error);xhr.send();});}
}
export function loadFlow(species){
 if(!cache.has(species))cache.set(species,(async()=>{
  const spec=FLOW_ASSETS[species];if(!spec)throw Error('MISSING_FLOW_'+species);let raw=await readBytes(new URL(spec.src,import.meta.url));
  if(raw[0]===31&&raw[1]===139)raw=new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
  const length=new DataView(raw.buffer,raw.byteOffset,4).getUint32(0,true);if(length>65536)throw Error('INVALID_FLOW_HEADER');
  const header=JSON.parse(new TextDecoder().decode(raw.subarray(4,4+length))),stride=header.flowBytes+header.confidenceBytes;
  if(header.version!==1||raw.length!==4+length+stride*header.pairs.length)throw Error('INVALID_FLOW_DATA');
  const pairs=new Map(header.pairs.map(([a,b],i)=>[a+':'+b,{flow:raw.subarray(4+length+i*stride,4+length+i*stride+header.flowBytes),confidence:raw.subarray(4+length+i*stride+header.flowBytes,4+length+(i+1)*stride)}]));
  return {...header,pairs};
 })());return cache.get(species);
}

const quadVertex=`attribute vec2 position;varying vec2 uv;void main(){uv=vec2(position.x*.5+.5,.5-position.y*.5);gl_Position=vec4(position,0.,1.);}`;
const warpVertex=`precision highp float;attribute vec2 position;uniform sampler2D field;uniform float amount;uniform float flowRange;uniform float reverse;uniform float side;varying vec2 original;
void main(){original=position;vec4 f=(texture2D(field,clamp(position/vec2(320.,330.),0.,1.))*255.-128.)*(flowRange/127.);f=mix(f,f.zwxy,reverse);vec2 delta=mix(f.xy,f.zw,side);vec2 p=position+amount*delta;gl_Position=vec4(p.x/160.-1.,1.-p.y/165.,0.,1.);}`;
const warpFragment=`precision highp float;varying vec2 original;uniform sampler2D atlas;uniform vec4 source;uniform vec4 target;uniform vec2 atlasSize;
void main(){vec2 q=(original-target.xy)/target.zw;if(q.x<0.||q.y<0.||q.x>1.||q.y>1.)discard;gl_FragColor=texture2D(atlas,(source.xy+q*source.zw)/atlasSize);}`;
const compositeFragment=`precision highp float;varying vec2 uv;uniform sampler2D warpedA;uniform sampler2D warpedB;uniform float progress;
void main(){vec2 q=vec2(uv.x,1.-uv.y);vec4 a=texture2D(warpedA,q),b=texture2D(warpedB,q),c=progress<.5?a:b;gl_FragColor=c;}`;
export class FlowRenderer{
 constructor(canvas,image,data,flow){
  Object.assign(this,{canvas,data,flow,textures:new Map()});const gl=this.gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:true});if(!gl)throw Error('WEBGL_UNAVAILABLE');if(gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS)<1)throw Error('VERTEX_TEXTURES_UNAVAILABLE');
  const program=(v,f)=>{const p=gl.createProgram();for(const [type,src]of [[gl.VERTEX_SHADER,v],[gl.FRAGMENT_SHADER,f]]){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));gl.attachShader(p,s);}gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p;};
  this.warp=program(warpVertex,warpFragment);this.composite=program(quadVertex,compositeFragment);
  const verts=[];for(let y=0;y<42;y++)for(let x=0;x<40;x++){const a=x*8,b=y*330/42,c=(x+1)*8,d=(y+1)*330/42;verts.push(a,b,c,b,a,d,a,d,c,b,c,d);}this.count=verts.length/2;
  const buffer=data=>{const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);return b;};this.mesh=buffer(verts);this.quad=buffer([-1,-1,1,-1,-1,1,1,1]);
  this.atlas=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.atlas);this.params();gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
  this.targets=[0,1].map(()=>{const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);this.params();gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,canvas.width,canvas.height,0,gl.RGBA,gl.UNSIGNED_BYTE,null);const fbo=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);return {texture,fbo};});gl.bindFramebuffer(gl.FRAMEBUFFER,null);
 }
 params(){const gl=this.gl;gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);}
 pair(a,b){const key=Math.min(a,b)+':'+Math.max(a,b);if(!this.textures.has(key)){const data=this.flow.pairs.get(key);if(!data)return null;const gl=this.gl,texture=gl.createTexture();gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,texture);this.params();gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,this.flow.width,this.flow.height,0,gl.RGBA,gl.UNSIGNED_BYTE,data.flow);this.textures.set(key,texture);}return this.textures.get(key);}
 use(program,buffer){const gl=this.gl;gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);const pos=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);}
 render(a,b,t,dA,dB){
  if(a===b)return false;const field=this.pair(a,b);if(!field)return false;const gl=this.gl,p=this.warp;this.use(p,this.mesh);gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.atlas);gl.uniform1i(gl.getUniformLocation(p,'atlas'),0);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,field);gl.uniform1i(gl.getUniformLocation(p,'field'),1);gl.uniform2f(gl.getUniformLocation(p,'atlasSize'),this.data.width,this.data.height);gl.uniform1f(gl.getUniformLocation(p,'flowRange'),this.flow.range);gl.uniform1f(gl.getUniformLocation(p,'reverse'),a>b?1:0);
  for(let i=0;i<2;i++){gl.bindFramebuffer(gl.FRAMEBUFFER,this.targets[i].fbo);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);const d=i?dB:dA;gl.uniform4fv(gl.getUniformLocation(p,'source'),d.source);gl.uniform4f(gl.getUniformLocation(p,'target'),d.x,d.y,d.width,d.height);gl.uniform1f(gl.getUniformLocation(p,'side'),i);gl.uniform1f(gl.getUniformLocation(p,'amount'),i?1-t:t);gl.drawArrays(gl.TRIANGLES,0,this.count);}
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.disable(gl.BLEND);this.use(this.composite,this.quad);for(let i=0;i<2;i++){gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,this.targets[i].texture);gl.uniform1i(gl.getUniformLocation(this.composite,i?'warpedB':'warpedA'),i);}gl.uniform1f(gl.getUniformLocation(this.composite,'progress'),t);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);return true;
 }
 destroy(){const gl=this.gl;for(const t of this.textures.values())gl.deleteTexture(t);for(const {texture,fbo}of this.targets){gl.deleteTexture(texture);gl.deleteFramebuffer(fbo);}gl.deleteTexture(this.atlas);gl.deleteProgram(this.warp);gl.deleteProgram(this.composite);gl.getExtension('WEBGL_lose_context')?.loseContext();}
}
