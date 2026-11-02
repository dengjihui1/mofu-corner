import {defaultLayout} from './room-layout.mjs';

// These are inspiration layouts, never inventory or free unlocks.
export const HOME_STYLES=[
 {id:'listening',name:'下班听一张',note:'放一张唱片，让时间慢下来。',species:'rabbit',color:'#756c5e',equipped:{wall:'wall-listening',floor:'floor-walnut',rug:'rug-woven',seat:'seat-lounge',shelf:'shelf-records',table:'table-magazines',light:'light-reading',art:'art-blue-note',chat:'chat-paper',headwear:'wear-knit-cap',neckwear:'wear-pinstripe',carry:'wear-canvas-bag'},layout:{pet:{x:68,y:72,scale:.88},'rug-woven':{x:51,y:82},'shelf-records':{x:28,y:61,scale:1.35},'seat-lounge':{x:58,y:65},'table-magazines':{x:35,y:84},'light-reading':{x:86,y:57},'art-blue-note':{x:70,y:29}}},
 {id:'breakfast',name:'奶油日光',note:'亚麻、浅橡木与午后的光。',species:'rat',color:'#d5cbb7',equipped:{wall:'wall-butter',floor:'floor-oak',rug:'rug-cookie',seat:'seat-toast',plant:'plant-daisy',light:'light-mushroom',art:'art-bunting',shelf:'shelf-books',table:'table-tea',chat:'chat-paper'}},
 {id:'berry',name:'莓果公寓',note:'灰粉软包，胡桃木的温度。',species:'rabbit',color:'#ad7e89',equipped:{wall:'wall-peach',floor:'floor-rose',rug:'rug-petal',seat:'seat-bunny',plant:'plant-tulip',light:'light-tulip',art:'art-letter',shelf:'shelf-books',table:'table-tea',chat:'chat-berry'}},
 {id:'forest',name:'森林书房',note:'雾绿织物，留一页慢慢读。',species:'sheep',color:'#758b76',equipped:{wall:'wall-sage',floor:'floor-oak',rug:'rug-flower',seat:'seat-sage',plant:'plant-sprout',light:'light-mushroom',art:'art-bunting',shelf:'shelf-books',table:'table-tea',chat:'chat-garden'}},
 {id:'moon',name:'蓝调夜色',note:'磨砂月灯，陪你把一天放下。',species:'dragon',color:'#81989c',equipped:{wall:'wall-night',floor:'floor-oak',rug:'rug-cloud',seat:'seat-peach',plant:'plant-daisy',light:'light-moon',art:'art-stars',shelf:'shelf-books',table:'table-tea',chat:'chat-sky'}}
];

// A fresh copy keeps preview edits out of the theme and saved account layouts.
// Only catalog items equipped by this theme can acquire a custom placement.
export function styleLayout(style,catalog){
 const nodes=defaultLayout(style.equipped,catalog);
 for(const [id,node]of Object.entries(nodes))nodes[id]={...node,...style.layout?.[id]};
 return nodes;
}
