// Shared motion and expression parameters. The renderer bounds deformation of intact artwork.
export const DURATIONS={jump:1.9,sleep:2.6,wake:4.1,stretch:3.4,touch:1.9,step:1.8,sway:2.3,surprise:1.7};
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const ease=x=>{x=clamp(x);return x*x*x*(10+x*(-15+6*x));};
const lerp=(a,b,t)=>a+(b-a)*t;
function track(t,keys){let i=0;while(i<keys.length-1&&t>=keys[i+1][0])i++;const a=keys[i],b=keys[Math.min(i+1,keys.length-1)];return lerp(a[1],b[1],ease((t-a[0])/(b[0]-a[0]||1)));}
const pulse=(t,a,b,c,d)=>track(t,[[0,0],[a,0],[b,1],[c,1],[d,0]]);
export const REST_POSE={height:0,pitch:0,head:0,tilt:0,arms:0,cuddle:0,ear:0,eye:1,smile:.25,mouth:.08,flight:0,fold:0,look:0,expression:'neutral'};
export function motionPose(name,t,species='rabbit'){
 const p={...REST_POSE};
 if(name==='jump'){
  const takeoff=.58,landing=1.18,h=.43,v=4*h/(landing-takeoff);
  // Cubic launch and compression join the ballistic arc with matching velocity.
  const hermite=(a,b,va,vb,u,d)=>(2*u**3-3*u*u+1)*a+(u**3-2*u*u+u)*va*d+(-2*u**3+3*u*u)*b+(u**3-u*u)*vb*d;
  if(t<.36)p.height=track(t,[[0,0],[.36,-.17]]);
  else if(t<takeoff)p.height=hermite(-.17,0,0,v,(t-.36)/(takeoff-.36),takeoff-.36);
  else if(t<landing){const u=(t-takeoff)/(landing-takeoff);p.height=4*h*u*(1-u);p.flight=1;p.fold=Math.sin(Math.PI*u)*.09;}
  else if(t<1.34)p.height=hermite(0,-.14,-v,0,(t-landing)/.16,.16);
  else p.height=track(t,[[1.34,-.14],[1.9,0]]);
  p.pitch=track(t,[[0,0],[.38,.12],[.65,-.06],[.95,.02],[1.28,.12],[1.9,0]]);
  p.arms=pulse(t,.1,.52,.93,1.7)*.6;p.ear=track(t,[[0,0],[.4,.15],[.68,-.18],[1.03,.16],[1.36,-.12],[1.9,0]]);
  p.eye=track(t,[[0,1],[.38,.74],[.53,.18],[.7,1],[1.05,1],[1.22,.15],[1.52,1]]);
  p.mouth=track(t,[[0,.08],[.4,.02],[.67,.7],[1.03,.65],[1.24,.06],[1.55,.32],[1.9,.08]]);p.smile=.5;
  p.expression=t<.18?'neutral':t<.42?'focused':t<.58?'effort':t<1.18?'excited':t<1.4?'landing':t<1.8?'pleased':'neutral';
  if(species==='snake'){p.height=0;p.pitch*=.5;p.flight=0;p.fold=0;}
 }else if(name==='sleep'){
  const u=ease(t/2.6);p.height=-.22*u;p.pitch=1.35*u;p.head=.12*u;p.eye=1-ease((t-.35)/1.7);p.ear=-.48*u;p.cuddle=u;p.smile=.05;p.mouth=.03;
  p.expression=t<.6?'drowsy':t<2?'sleepy':'asleep';
 }else if(name==='wake'){
  const u=ease(t/2.5);p.height=-.22*(1-u);p.pitch=1.35*(1-u);p.head=track(t,[[0,.12],[1,.1],[2.1,-.1],[4.1,0]]);p.ear=-.48*(1-u);p.cuddle=1-u;
  p.eye=track(t,[[0,0],[.5,.35],[1.1,.5],[1.55,.08],[2.4,.08],[3.1,1]]);
  p.mouth=track(t,[[0,.03],[.75,.12],[1.5,1],[2.15,.85],[2.7,.1],[4.1,.08]]);
  p.arms=pulse(t,1.4,2.3,2.65,3.7);p.smile=track(t,[[0,.05],[2.5,.3],[3.4,.65],[4.1,.25]]);
  p.expression=t<1.1?'waking':t<2.25?'yawning':t<3.4?'stretching':'relaxed';
 }else if(name==='stretch'){
  const u=pulse(t,0,1.1,1.75,3.4);p.pitch=-.1*u;p.head=-.15*u;p.arms=u;p.eye=1-.91*u;p.mouth=.08+.65*u;p.ear=-.12*u;p.smile=.5;p.expression=t<.5?'drowsy':t<1.3?'yawning':t<2.5?'stretching':'relaxed';
 }else if(name==='touch'){
  const u=pulse(t,0,.45,1.05,1.9);p.head=-.07*u;p.tilt=-.09*u;p.eye=1-.92*u;p.smile=.25+.7*u;p.mouth=.08+.2*u;p.arms=.08*u;p.ear=.15*u;p.expression='happy';
 }else if(name==='surprise'){
  const u=pulse(t,0,.24,.72,1.7);p.head=-.06*u;p.eye=1+.13*u;p.mouth=.08+.85*u;p.smile=.25*(1-u);p.arms=.24*u;p.ear=.14*u;p.expression=t<1?'surprised':'curious';
 }else if(name==='sway'||name==='step'){
  const u=t/(DURATIONS[name]||2.3);p.tilt=Math.sin(u*Math.PI*2)*.06*Math.sin(Math.PI*clamp(u));p.look=Math.sin(u*Math.PI*2)*.13;p.ear=Math.sin(u*Math.PI*2-.3)*.07*Math.sin(Math.PI*clamp(u));p.smile=.5;p.expression='curious';
 }
 return p;
}
export function blendPose(a,b,u){const p={};u=ease(u);for(const k of Object.keys(REST_POSE))p[k]=typeof a[k]==='number'?lerp(a[k],b[k],u):(u<.5?a[k]:b[k]);return p;}
// The analytic two-bone solver preserves both segment lengths, including at reach limits.
export function solveLeg(hip,foot,l1,l2,bend=1){
 const dx=foot[0]-hip[0],dy=foot[1]-hip[1],dz=foot[2]-hip[2],raw=Math.hypot(dx,dy,dz),d=clamp(raw,Math.abs(l1-l2)+1e-5,l1+l2-1e-5);
 const dir=[dx/(raw||1),dy/(raw||1),dz/(raw||1)];const along=(l1*l1-l2*l2+d*d)/(2*d),perp=Math.sqrt(Math.max(0,l1*l1-along*along));
 // Prefer knee forward; perpendicular remains well defined for vertical legs.
 let n=[-dir[0]*dir[2],-dir[1]*dir[2],1-dir[2]*dir[2]],len=Math.hypot(...n);if(len<1e-5){n=[0,1,0];len=1;}n=n.map(x=>x/len*bend);
 return {knee:hip.map((v,i)=>v+dir[i]*along+n[i]*perp),foot:hip.map((v,i)=>v+dir[i]*d),reachable:Math.abs(d-raw)<1e-4};
}
