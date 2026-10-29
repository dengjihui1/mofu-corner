import {motionPose,clamp,ease} from './joint-motion.mjs';
export const RABBIT_DURATIONS={sleep:3.6,wake:5.2,stretch:4.8,touch:1.9,jump:1.9,surprise:1.7,sway:2.3,step:1.8};
export const RABBIT_REST={hx:112,hy:248,hr:0,bx:116,by:338,br:0,
 lsx:48,lsy:250,rsx:127,rsy:260,lpx:42,lpy:273,rpx:135,rpy:284,
 lhx:78,lhy:331,rhx:150,rhy:336,lfx:58,lfy:379,rfx:150,rfy:379,
 tx:203,ty:304,tr:0,lpr:0,rpr:0,eye:1,mouth:.35,smile:.3,ear:0,expression:'neutral'};
// Compact rest: keep the chest visible and the hind paws planted.
export const RABBIT_SLEEP={...RABBIT_REST,hx:112,hy:293,hr:-.018,bx:120,by:348,br:-.11,
 lsx:52,lsy:292,rsx:130,rsy:302,lpx:48,lpy:323,rpx:138,rpy:330,
 lhx:88,lhy:342,rhx:157,rhy:347,tx:204,ty:316,tr:.02,eye:0,mouth:0,smile:0,ear:.055,expression:'asleep'};
const PLANT={...RABBIT_REST,hx:112,hy:268,hr:-.008,bx:118,by:343,br:-.04,
 lsx:50,lsy:276,rsx:128,rsy:285,lpx:45,lpy:306,rpx:138,rpy:314,
 lhx:82,lhy:336,rhx:153,rhy:341,tx:204,ty:311,eye:.45,mouth:.2,smile:.12,ear:.025,expression:'sleepy'};
const PREP={...RABBIT_REST,hy:255,bx:116,by:341,br:-.025,
 lsx:48,lsy:257,rsx:128,rsy:267,lpx:42,lpy:282,rpx:136,rpy:294,eye:.6,mouth:.3,expression:'drowsy'};
const STRETCH={...RABBIT_REST,hy:245,hr:-.025,bx:116,by:337,br:.015,
 lsx:48,lsy:251,rsx:130,rsy:260,lpx:35,lpy:283,rpx:143,rpy:289,
 lhx:78,lhy:330,rhx:150,rhy:335,tx:204,ty:303,tr:-.015,eye:.12,mouth:.6,smile:.1,ear:.045,expression:'stretching'};
const REACH_UP={...RABBIT_REST,hy:240,hr:-.03,bx:116,by:335,
 lsx:48,lsy:248,rsx:127,rsy:254,lpx:31,lpy:253,rpx:148,rpy:260,lpr:-.08,rpr:.08,
 lhx:78,lhy:329,rhx:150,rhy:334,tx:203,ty:301,eye:.08,mouth:.62,smile:.1,ear:.055,expression:'stretching'};
export function mixRabbit(a,b,u){u=ease(u);const out={};for(const key of Object.keys(RABBIT_REST))out[key]=typeof a[key]==='number'?a[key]+(b[key]-a[key])*u:b[key];return out;}
function sequence(t,frames){let i=0;while(i<frames.length-1&&t>=frames[i+1][0])i++;const [at,a]=frames[i],[bt,b]=frames[Math.min(i+1,frames.length-1)];return mixRabbit(a,b,clamp((t-at)/(bt-at||1)));}
export function rabbitPose(name,t,start){
 t=Math.max(0,t);const rest=RABBIT_REST;
 if(name==='sleep'){
  const p=sequence(t,[[0,start||rest],[.45,{...rest,hy:255,eye:.65,expression:'drowsy'}],[1.3,PLANT],[2.9,RABBIT_SLEEP],[3.6,RABBIT_SLEEP]]);
  p.expression=t<.6?'drowsy':t<2.9?'sleepy':'asleep';
  return p;
 }
 if(name==='wake'){
  const origin=start||RABBIT_SLEEP;
  const p=sequence(t,[[0,origin],[.55,{...origin,hy:Math.min(origin.hy-7,334),eye:.28,expression:'waking'}],[1.35,{...mixRabbit(origin,STRETCH,.4),hy:Math.min(origin.hy-15,319),eye:.38}],[2.45,STRETCH],[3.7,REACH_UP],[4.05,REACH_UP],[5.2,rest]]);
  p.expression=t<1.35?'waking':t<2.45?'yawning':t<4.1?'stretching':'relaxed';
  return p;
 }
 if(name==='stretch'){
  const p=sequence(t,[[0,start||rest],[.8,PREP],[1.7,STRETCH],[2.1,STRETCH],[3.25,REACH_UP],[3.65,REACH_UP],[4.8,rest]]);
  p.expression=t<.7?'drowsy':t<1.7?'yawning':t<3.7?'stretching':'relaxed';
  return p;
 }
 const shared=motionPose(name,t,'rabbit');let p={...rest,eye:Math.min(1.04,shared.eye),mouth:Math.min(.62,.35+shared.mouth*.35),smile:shared.smile,expression:shared.expression,ear:shared.ear*.22};
 if(name==='jump'){
  const air=Math.max(0,shared.height)*72,crouch=Math.min(0,shared.height)*-36;
  for(const k of ['hy','by','lsy','rsy','lpy','rpy','lhy','rhy','lfy','rfy','ty'])p[k]-=air;
  for(const k of ['hy','by','lsy','rsy','lpy','rpy','lhy','rhy','ty'])p[k]+=crouch;
  p.hr=shared.pitch*.18;
 }else{p.hr=shared.tilt*.55+shared.head*.12;p.hx+=shared.look*8;p.hy+=shared.head*8;}
 return start&&t<.28?mixRabbit(start,p,t/.28):p;
}
export function solvePaw(shoulder,paw,l1=30,l2=33,bend=1){
 const dx=paw[0]-shoulder[0],dy=paw[1]-shoulder[1],raw=Math.hypot(dx,dy),d=clamp(raw,Math.abs(l1-l2)+.001,l1+l2-.001),ux=dx/(raw||1),uy=dy/(raw||1);
 const x=(l1*l1-l2*l2+d*d)/(2*d),h=Math.sqrt(Math.max(0,l1*l1-x*x));
 return {elbow:[shoulder[0]+ux*x-uy*h*bend,shoulder[1]+uy*x+ux*h*bend],paw:[shoulder[0]+ux*d,shoulder[1]+uy*d],reachError:Math.abs(raw-d)};
}
