import test from 'node:test';
import assert from 'node:assert/strict';
import {rabbitPose,RABBIT_REST,RABBIT_SLEEP,RABBIT_DURATIONS,solvePaw} from '../ui/rabbit-motion.mjs';
const numericEqual=(a,b)=>{for(const k of Object.keys(a))if(typeof a[k]==='number')assert.ok(Math.abs(a[k]-b[k])<1e-7,k);};
test('兔子收拢与唤醒的端点一致，舒展后恢复站姿',()=>{
 numericEqual(rabbitPose('sleep',0),RABBIT_REST);numericEqual(rabbitPose('sleep',3.6),RABBIT_SLEEP);
 numericEqual(rabbitPose('wake',0),RABBIT_SLEEP);numericEqual(rabbitPose('wake',5.2),RABBIT_REST);numericEqual(rabbitPose('stretch',4.8),RABBIT_REST);
});
test('兔子三种长动作始终在肢体可达范围内，骨段长度固定',()=>{
 for(const action of ['sleep','wake','stretch'])for(let t=0;t<=RABBIT_DURATIONS[action];t+=1/120){const p=rabbitPose(action,t);
  for(const [a,b,l1,l2,bend]of [[[p.lsx,p.lsy],[p.lpx,p.lpy],30,33,-1],[[p.rsx,p.rsy],[p.rpx,p.rpy],30,33,1],[[p.lhx,p.lhy],[p.lfx,p.lfy-22],22,26,1],[[p.rhx,p.rhy],[p.rfx,p.rfy-22],22,26,-1]]){
   const s=solvePaw(a,b,l1,l2,bend);assert.equal(s.reachError,0,action+':'+t);assert.ok(Math.abs(Math.hypot(s.elbow[0]-a[0],s.elbow[1]-a[1])-l1)<1e-7);assert.ok(Math.abs(Math.hypot(s.paw[0]-s.elbow[0],s.paw[1]-s.elbow[1])-l2)<1e-7);
  }
 }
});
test('兔子动作分段的位置与速度连续，没有姿态突跳',()=>{
 const h=1e-5;
 for(const [name,keys]of [['sleep',[.45,1.3,2.9]],['wake',[.55,1.35,2.45,3.7,4.05]],['stretch',[.8,1.7,2.1,3.25,3.65]]])for(const t of keys){const a=rabbitPose(name,t-h),b=rabbitPose(name,t),c=rabbitPose(name,t+h);for(const k of Object.keys(b))if(typeof b[k]==='number'){assert.ok(Math.abs(a[k]-c[k])<.005,name+':'+k);assert.ok(Math.abs((b[k]-a[k])/h-(c[k]-b[k])/h)<.02,name+':velocity:'+k);}}
});
test('蜷睡保留身体空间，脚掌固定，动作幅度受到约束',()=>{
 for(const action of ['sleep','wake','stretch'])for(let t=0;t<=RABBIT_DURATIONS[action];t+=.01){const p=rabbitPose(action,t);assert.equal(p.lfx,RABBIT_REST.lfx);assert.equal(p.rfx,RABBIT_REST.rfx);assert.equal(p.lfy,379);assert.equal(p.rfy,379);assert.ok(p.hy<=RABBIT_REST.hy+48);assert.ok(Math.abs(p.br)<=.12);assert.ok(p.mouth<=.65);}
 const end=rabbitPose('sleep',3.6);assert.equal(end.eye,0);assert.equal(end.mouth,0);assert.ok(end.hy-RABBIT_REST.hy<=48);
});
test('伸懒腰只在胸前轻轻舒展，不大幅甩爪或过度张嘴',()=>{
 const up=rabbitPose('stretch',3.3),end=rabbitPose('stretch',4.8);
 assert.ok(up.lpy<RABBIT_REST.lpy-15);assert.ok(up.rpy<RABBIT_REST.rpy-15);assert.ok(up.lpx>=28);assert.ok(up.rpx<=155);assert.ok(up.mouth>=.5&&up.mouth<=.65);assert.ok(up.eye<.15);numericEqual(end,RABBIT_REST);
});
test('中途叫醒从当前姿势开始，不会先跳到完整睡姿',()=>{
 for(const t of [.2,.8,1.5,2.5]){const current=rabbitPose('sleep',t);numericEqual(rabbitPose('wake',0,current),current);assert.ok(rabbitPose('wake',.25,current).hy<=current.hy+.001);}
});
