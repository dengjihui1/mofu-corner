import {JointPlayer} from './joint-player.mjs';
const reduced=matchMedia('(prefers-reduced-motion:reduce)');
export const hero=new JointPlayer(document.getElementById('hero'),'rabbit',null,{enabled:()=>!reduced.matches});
for(const button of document.querySelectorAll('[data-action]'))button.onclick=()=>hero.play(button.dataset.action,{instant:reduced.matches,rate:Number(document.getElementById('speed').value)});
const words={neutral:'放松',focused:'专注蓄力',effort:'蹬地用力',excited:'跳起来啦',landing:'弯腿缓冲',pleased:'开心',drowsy:'困了',sleepy:'慢慢趴好',asleep:'睡着了',waking:'睁开眼睛',yawning:'打个哈欠',stretching:'伸懒腰',relaxed:'放松下来',happy:'喜欢摸摸',surprised:'咦？',curious:'好奇',blink:'眨眼'};
new MutationObserver(()=>document.getElementById('live-expression').textContent=words[hero.host.dataset.expression]||'放松').observe(hero.host,{attributes:true,attributeFilter:['data-expression']});
