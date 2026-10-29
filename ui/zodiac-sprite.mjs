import {PERSONALITIES} from './zodiac-personalities.mjs';
// Shared cutout artwork for the web configuration preview. Native playback uses
// the same rectangles in zodiac.mjs, while continuing to support classic otter.
export function zodiacSprite(species){
 const p=PERSONALITIES[species];if(!p)return '';
 const rows={a:[[0,395],[395,321],[716,370]],b:[[0,425],[425,353],[778,308]],c:[[0,401],[401,345],[746,340]],d:[[0,396],[396,350],[746,340]]};
 const [top,height]=rows[p.group][p.row],side=Math.max(362,height);
 return `<button class="pet-surface species-zodiac" type="button"><span class="zodiac-cutout"><span style="position:absolute;overflow:hidden;left:${(side-362)/2/side*100}%;top:${(side-height)/2/side*100}%;width:${362/side*100}%;height:${height/side*100}%"><img src="assets/desktop-zodiac-${p.group}-v1.png" alt="" draggable="false" style="position:absolute;width:400%;max-width:none;height:${1086/height*100}%;top:${-top/height*100}%"></span></span></button>`;
}
