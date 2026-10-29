import {RabbitScene} from './rabbit-scene.mjs?v=20';
import {RABBIT_DURATIONS as DURATIONS,RABBIT_REST,RABBIT_SLEEP,rabbitPose} from './rabbit-motion.mjs?v=20';
export class RabbitPlayer{
 constructor(host,_species,_legacy,{enabled=()=>true}={}){
  Object.assign(this,{host,species:'rabbit',enabled,sleeping:false,destroyed:false,pose:{...RABBIT_REST},clip:null,idleTime:0,lastNow:performance.now(),blinkAt:4.7,holdUntil:0});
  this.canvas=document.createElement('canvas');this.canvas.width=640;this.canvas.height=660;this.canvas.className='rig-puppet';this.canvas.dataset.artwork='articulated-rabbit';this.canvas.style.cssText='width:100%;height:100%;object-fit:contain;display:block;pointer-events:none';this.canvas.setAttribute('aria-hidden','true');this.ctx=this.canvas.getContext('2d');host.replaceChildren(this.canvas);Object.assign(host.dataset,{rig:'rabbit',rigReady:'false',anatomy:'articulated',interpolation:'continuous-skeleton'});
  this.model=new RabbitScene();this.ready=this.model.ready.then(()=>{if(this.destroyed){this.model.dispose();return;}host.dataset.rigReady='true';this.draw();});
  this.tick=this.tick.bind(this);this.raf=requestAnimationFrame(this.tick);
 }
 play(name,{instant=false,rate=1}={}){
  if(!DURATIONS[name])name='sway';if(!instant&&this.enabled()&&this.clip?.name===name)return this;
  if(!instant&&this.enabled()&&this.clip?.name==='jump'&&name!=='jump'){this.queued=name;return this;}
  if(!instant&&this.enabled()&&this.clip?.name==='wake'&&name!=='wake'&&name!=='sleep'){this.queued=name;return this;}
  const lowered=this.sleeping||this.pose.hy>RABBIT_REST.hy+20||this.pose.br<-.3;
  if(!instant&&this.enabled()&&lowered&&name!=='wake'&&name!=='sleep'){this.queued=name;name='wake';}else this.queued=null;
  const from={...this.pose};this.sleeping=name==='sleep';this.holdUntil=0;
  if(instant||!this.enabled()){
   const t={sleep:3.6,wake:5.2,stretch:2.1,touch:.7,surprise:.5,jump:1.65,sway:.7,step:.7}[name];this.clip=null;this.pose=rabbitPose(name,t);this.holdUntil=performance.now()+1500;this.draw();return this;
  }
  this.clip={name,time:0,rate:Math.max(.25,Math.min(2,rate)),from};this.lastNow=performance.now();return this;
 }
 cancel(){this.queued=null;if(this.clip?.name!=='jump')this.clip=null;}
 pause(){this.clip=null;this.queued=null;this.draw();}
 setStill(name,time){this.clip=null;this.pose=rabbitPose(name,time);this.draw();}
 tick(now){
  if(this.destroyed)return;const dt=Math.min(.05,(now-this.lastNow)/1000);this.lastNow=now;
  if(!document.hidden){
   if(this.clip){const c=this.clip;c.time=Math.min(DURATIONS[c.name],c.time+dt*c.rate);this.pose=rabbitPose(c.name,c.time,c.from);
    if(c.time>=DURATIONS[c.name]){this.clip=null;if(this.queued){const next=this.queued;this.queued=null;this.play(next);}}
   }else if(this.enabled()&&now>=this.holdUntil){
    this.idleTime+=dt;const base={...(this.sleeping?RABBIT_SLEEP:RABBIT_REST)};
    const phase=this.idleTime-this.blinkAt;
    if(!this.sleeping&&phase>=0&&phase<.34){base.eye=1-Math.sin(Math.PI*phase/.34)**2;base.expression='blink';}else if(phase>=.34)this.blinkAt=this.idleTime+4.5+Math.random()*2;
    // Numeric idle recovery uses a direct exponential factor, not repeated easing.
    const u=1-Math.exp(-dt*9);for(const k of Object.keys(base))if(typeof base[k]==='number')this.pose[k]=this.pose[k]+(base[k]-this.pose[k])*u;
    this.pose.expression=base.expression;
   }
   this.draw();
  }
  this.raf=requestAnimationFrame(this.tick);
 }
 draw(){if(this.host.dataset.rigReady!=='true')return;const key=JSON.stringify(this.pose)+(this.enabled()?Math.floor(this.idleTime*30):'');if(key!==this.lastDraw){this.model.apply(this.pose,this.idleTime);this.model.render(this.ctx);this.lastDraw=key;}const c=this.clip;Object.assign(this.host.dataset,{animation:c?.name||(this.sleeping?'asleep':'idle'),expression:this.pose.expression,phase:String(Math.round(c?c.time/DURATIONS[c.name]*100:100)),frame:'skeleton',interpolation:'continuous-skeleton'});}
 destroy(){this.destroyed=true;cancelAnimationFrame(this.raf);this.model.dispose();this.host.replaceChildren();}
}
