// Intact plush art: readable head turns, short hops and local eye expressions.
export const DURATIONS={touch:1.65,blink:.26,tilt:2.6,jump:1.5,happy:1.8,wink:.65,look:2.4};
export const HOP={start:.32,flight:.44,height:12};
export const neutral=()=>({tilt:0,eye:1,wink:0,smile:0,look:0,blush:0,lift:0,settle:0,lean:0,shift:0,nod:0,ear:0,hand:0,expression:'neutral'});
export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const smooth=v=>{v=clamp(v);return v*v*v*(v*(v*6-15)+10);};
const hold=(t,inEnd,outStart,end)=>t<inEnd?smooth(t/inEnd):1-smooth((t-outStart)/(end-outStart));
export function blink(t){if(t<0||t>=.26)return 1;return t<.10?1-smooth(t/.10):smooth((t-.10)/.16);}
export function gentlePose(name,t,species='rabbit'){
 const p=neutral(),d=DURATIONS[name];if(!d||t<0||t>=d)return p;
 const head=species==='rabbit'?.065:.045;
 if(name==='blink'){p.eye=blink(t);p.expression='blink';}
 if(name==='tilt'){
  const lead=hold(t,.58,1.18,d),follow=hold(t-.10,.52,1.14,2.3);
  p.tilt=head*lead;p.lean=.014*follow;p.shift=1.2*follow;
  p.ear=-16*head*(lead-hold(t-.14,.58,1.18,d-.14));
  p.hand=.6*(follow-hold(t-.18,.52,1.14,2.12));
  p.look=.65*hold(t,.35,1.25,2.05);p.eye=blink(t-1.45);p.expression='curious';
 }
 if(name==='look'){p.look=.9*hold(t,.35,.70,1.1)-.85*hold(t-1.1,.3,.65,1.2);p.tilt=p.look*head*.35;p.lean=p.look*.010;p.shift=p.look*1.1;p.ear=-p.look*.35;p.expression='curious';}
 if(name==='wink'){p.wink=hold(t,.12,.27,d);p.tilt=-head*.35*hold(t,.20,.30,d);p.lean=-.009*hold(t-.06,.20,.30,d-.06);p.shift=-.7*hold(t-.06,.20,.30,d-.06);p.smile=hold(t,.15,.32,d);p.blush=.45*p.smile;p.expression='wink';}
 if(name==='happy'||name==='touch'){
  const amount=hold(t,.24,.85,d);p.smile=amount;p.blush=.8*amount;
  p.eye=1-.96*hold(t-.18,.14,.44,.80);p.tilt=-head*(name==='touch'?.55:.30)*amount;
  p.lean=-.009*hold(t-.07,.26,.85,d-.07);p.shift=-.8*amount;p.nod=-.65*hold(t-.08,.25,.7,d-.08);p.hand=.4*amount;p.ear=-.5*(amount-hold(t-.13,.24,.85,d-.13));
  p.expression=name==='touch'?'pleased':'happy';
 }
 if(name==='jump'){
  if(species==='snake')return gentlePose('happy',t,'snake');
  const u=(t-HOP.start)/HOP.flight;
  const velocity=4*HOP.height/HOP.flight;
  if(u<0){
   p.settle=t<.22?3.2*smooth(t/.22):hermite(3.2,0,0,-velocity,(t-.22)/.10,.10);
   p.eye=1-.24*hold(t,.15,.22,HOP.start);p.nod=.35*hold(t-.04,.14,.22,HOP.start-.04);p.ear=.6*hold(t-.08,.12,.22,HOP.start-.08);p.expression='focused';
  }
  else if(u<1){p.lift=4*HOP.height*u*(1-u);p.ear=-.7*Math.sin(Math.PI*u);p.expression='bright';}
  else{
   const land=t-HOP.start-HOP.flight;
   p.settle=land<.09?hermite(0,velocity,3.1,0,land/.09,.09):land<.30?hermite(3.1,0,-.45,0,(land-.09)/.21,.21):hermite(-.45,0,0,0,(land-.30)/.30,.30);
   p.nod=.45*hold(land-.025,.075,.12,.43);p.ear=land<.18?.8*Math.sin(Math.PI*clamp(land/.18)):-.28*Math.sin(Math.PI*clamp((land-.18)/.35));p.hand=.6*hold(land,.065,.12,.42);
   p.smile=hold(land,.10,.25,.62);p.eye=1-.94*hold(land,.10,.18,.46);p.blush=p.smile*.6;p.expression='happy';
  }
 }
 return p;
}
export function idleChoice(index,species='rabbit',personality='gentle'){
 const choices=personality==='quiet'?['look','wink','tilt','happy']:['tilt','wink',species==='snake'?'happy':'jump','look','happy'];
 return choices[index%choices.length];
}
export function idleGap(random=Math.random,personality='gentle'){return personality==='quiet'?12+random()*8:personality==='playful'?3.5+random()*3:5+random()*4;}
// Hermite tangents match the torso velocity at takeoff and floor contact.
export function hermite(a,va,b,vb,u,duration){u=clamp(u);const q=u*u,r=q*u;return (2*r-3*q+1)*a+(r-2*q+u)*duration*va+(-2*r+3*q)*b+(r-q)*duration*vb;}
export function vertex(nx,v,w,h,pose,time){
 const p=typeof pose==='number'?{tilt:pose}:pose,tilt=p.tilt||0;
 const head=1-smooth((v-.52)/.31),support=1-smooth((v-.73)/.17),body=1-smooth((v-.56)/.34);
 const x=nx*w,y=(v-1)*h,dy=y+h*.43,c=Math.cos(tilt),s=Math.sin(tilt),lean=p.lean||0,lc=Math.cos(lean),ls=Math.sin(lean);
 const shoulder=1-smooth((v-.65)/.24),ear=1-smooth((v-.05)/.25),hand=smooth((v-.59)/.09)*(1-smooth((v-.76)/.12))*smooth((Math.abs(nx)-.08)/.15);
 const headX=(x*c-dy*s-x)*head,headY=(x*s+dy*c-dy)*head;
 const bodyX=(x*lc-y*ls-x)*support+(p.shift||0)*shoulder,bodyY=(x*ls+y*lc-y)*support;
 return [160+x+bodyX+headX+(p.ear||0)*ear,303+y+bodyY+headY+(Math.sin(time*1.45)*.30+(p.settle||0))*body+(p.nod||0)*head+(p.hand||0)*hand+(p.ear||0)*nx*.35*ear-(p.lift||0)];
}
