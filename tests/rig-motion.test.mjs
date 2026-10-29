import test from 'node:test';
import assert from 'node:assert/strict';
import {motionPose,REST_POSE,DURATIONS,blendPose} from '../ui/joint-motion.mjs';
import {RIG_ASSETS} from '../ui/rig-assets.mjs';
import {REFERENCE_ART} from '../ui/rig-reference.mjs';
import {readFileSync,existsSync} from 'node:fs';
test('十二生肖完整原画裁切有效并保留透明通道',()=>{
 assert.equal(Object.keys(RIG_ASSETS).length,12);
 for(const data of Object.values(RIG_ASSETS)){assert.ok(existsSync(new URL('../ui/'+data.src,import.meta.url)));for(const rect of data.rects.filter(Boolean)){const [x,y,w,h]=rect;assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=data.width&&y+h<=data.height);}}
 for(const [id,data]of Object.entries(RIG_ASSETS)){assert.deepEqual(REFERENCE_ART[id].rect,data.rects[11]);const png=readFileSync(new URL('../ui/'+data.src,import.meta.url));assert.equal(png.readUInt32BE(16),data.width);assert.equal(png.readUInt32BE(20),data.height);assert.equal(png[25],6);}
});
test('跳跃衔接时位置和速度连续，腾空阶段重力恒定',()=>{
 const h=1e-5,y=t=>motionPose('jump',t).height;
 for(const t of [.36,.58,1.18,1.34,1.9]){assert.ok(Math.abs(y(t+h)-y(t-h))<.0001);const left=(y(t)-y(t-h))/h,right=(y(t+h)-y(t))/h;assert.ok(Math.abs(left-right)<.003,`${t}: ${left} vs ${right}`);}
 for(let t=.62;t<1.13;t+=.05){const a=(y(t+h)-2*y(t)+y(t-h))/(h*h);assert.ok(Math.abs(a+8*.43/.6**2)<.0001);}
 assert.equal(y(.58),0);assert.ok(Math.abs(y(1.18))<1e-10);assert.equal(y(1.9),0);
});
test('睡眠与唤醒使用相同的身体状态，过渡可从当前姿态开始',()=>{
 const sleep=motionPose('sleep',2.6),wake=motionPose('wake',0);for(const key of Object.keys(REST_POSE))if(typeof sleep[key]==='number')assert.ok(Math.abs(sleep[key]-wake[key])<1e-8,key);
 const a=motionPose('jump',.7),b=motionPose('touch',.3);assert.deepEqual(blendPose(a,b,0),a);for(const k of Object.keys(b))if(typeof b[k]==='number')assert.ok(Math.abs(blendPose(a,b,1)[k]-b[k])<1e-10);else assert.equal(blendPose(a,b,1)[k],b[k]);
});
test('所有动作参数连续且有限，小蛇没有腾空和腿部状态',()=>{
 for(const [name,duration]of Object.entries(DURATIONS)){let prev=motionPose(name,0);for(let t=.001;t<=duration;t+=.001){const p=motionPose(name,t);for(const k of Object.keys(p))if(typeof p[k]==='number'){assert.ok(Number.isFinite(p[k]),name+':'+k);if(k!=='flight')assert.ok(Math.abs(p[k]-prev[k])<.03,name+':'+k);}prev=p;}}
 for(let t=0;t<1.9;t+=.01){const p=motionPose('jump',t,'snake');assert.equal(p.height,0);assert.equal(p.fold,0);assert.equal(p.flight,0);}
});
test('表情跟随动作，蓄力、开心、惊讶和闭眼睡觉各有区别',()=>{
 assert.equal(motionPose('jump',.3).expression,'focused');assert.equal(motionPose('jump',.5).expression,'effort');assert.equal(motionPose('jump',.8).expression,'excited');assert.equal(motionPose('jump',1.3).expression,'landing');
 assert.equal(motionPose('sleep',2.6).eye,0);assert.equal(motionPose('sleep',2.6).expression,'asleep');assert.equal(motionPose('wake',1.7).expression,'yawning');assert.equal(motionPose('touch',.7).expression,'happy');assert.equal(motionPose('surprise',.5).expression,'surprised');assert.ok(motionPose('surprise',.5).eye>motionPose('touch',.7).eye);
});
