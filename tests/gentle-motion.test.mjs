import test from 'node:test';
import assert from 'node:assert/strict';
import {DURATIONS,gentlePose,vertex,blink,HOP,idleChoice,idleGap,neutral} from '../ui/gentle-motion.mjs';
test('gentle gestures return to the original neutral pose',()=>{for(const [name,d]of Object.entries(DURATIONS)){assert.ok(Math.abs(gentlePose(name,0).tilt)<1e-10);assert.ok(Math.abs(gentlePose(name,d).tilt)<1e-10);assert.equal(gentlePose(name,d).eye,1);}});
test('rabbit tilt is readable at desktop size without body scaling',()=>{assert.ok(gentlePose('tilt',.8).tilt>=.06);for(const [name,d]of Object.entries(DURATIONS))for(let t=0;t<d;t+=1/240){const p=gentlePose(name,t);assert.ok(Math.abs(p.tilt)<=.065001);assert.ok(!('scale' in p));}});
test('feet stay planted on ground; a hop translates both feet by the same height',()=>{for(const [name,d]of Object.entries(DURATIONS))for(let t=0;t<d;t+=1/120)for(const v of [.9,.95,1])for(const x of [-.5,.5]){const p=gentlePose(name,t),a=vertex(x,v,175,252,p,t),b=vertex(x,v,175,252,neutral(),0);assert.equal(a[0],b[0]);assert.ok(Math.abs(a[1]-b[1]+p.lift)<1e-9);}});
test('blink closes once and opens gradually within 260 milliseconds',()=>{assert.equal(blink(0),1);assert.equal(blink(.1),0);assert.equal(blink(.26),1);assert.ok(blink(.14)<blink(.2));assert.ok(blink(.02)>blink(.08));});
test('small hop has a continuous ballistic arc, reaches 12px and lands on the floor',()=>{assert.equal(gentlePose('jump',HOP.start).lift,0);assert.ok(Math.abs(gentlePose('jump',HOP.start+HOP.flight/2).lift-HOP.height)<1e-9);assert.ok(Math.abs(gentlePose('jump',HOP.start+HOP.flight).lift)<1e-9);const dt=.001,gravity=[];for(let t=HOP.start+.01;t<HOP.start+HOP.flight-.01;t+=.01){const a=gentlePose('jump',t-dt).lift,b=gentlePose('jump',t).lift,c=gentlePose('jump',t+dt).lift;gravity.push((c-2*b+a)/dt**2);}assert.ok(Math.max(...gravity)-Math.min(...gravity)<1e-6);});
test('eyes distinguish a happy squint, a wink and a glance without mouth deformation',()=>{const happy=gentlePose('happy',.45),wink=gentlePose('wink',.2),look=gentlePose('look',.6);assert.ok(happy.eye<.1&&happy.smile>.8);assert.ok(wink.wink>.95&&wink.eye===1);assert.ok(look.look>.8);for(const p of [happy,wink,look])assert.ok(!('mouth' in p));});
test('idle gestures vary, with longer quiet gaps and no jumping for snakes or quiet personalities',()=>{const acts=Array.from({length:10},(_,i)=>idleChoice(i));assert.ok(new Set(acts).size===5);assert.ok(acts.every((a,i)=>i===0||a!==acts[i-1]));assert.ok(idleGap(()=>0,'quiet')>idleGap(()=>1,'playful'));for(let i=0;i<10;i++){assert.notEqual(idleChoice(i,'snake'),'jump');assert.notEqual(idleChoice(i,'rabbit','quiet'),'jump');}});

test('head leads a small weight shift; shoulders and ears follow without moving the feet',()=>{
 const early=gentlePose('tilt',.10),middle=gentlePose('tilt',.65),late=gentlePose('tilt',1.5);
 assert.ok(early.tilt>0&&early.lean===0);assert.ok(middle.lean>.01&&middle.shift>1&&Math.abs(middle.ear)>0);assert.ok(late.tilt>0&&late.lean>0);
 const still=vertex(0,.72,175,252,neutral(),0),body=vertex(0,.72,175,252,middle,0);assert.ok(Math.abs(body[0]-still[0])>1);
});
test('upper-body vertical velocity is continuous at takeoff and touchdown',()=>{
 const y=t=>vertex(0,.30,175,252,gentlePose('jump',t),0)[1],dt=1e-5;
 for(const t of [HOP.start,HOP.start+HOP.flight]){const before=(y(t)-y(t-dt))/dt,after=(y(t+dt)-y(t))/dt;assert.ok(Math.abs(before-after)<.15,`${before} vs ${after}`);}
});
