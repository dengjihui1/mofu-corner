import {WEARABLES} from '../public/wear-catalog.mjs';
// Prices and ownership are authoritative on the server. No cash purchases or transfers.
export const CATALOG = [
 ...WEARABLES,
 {id:'wall-cream',slot:'wall',name:'暖白石膏墙',price:0,color:'#ecebe3'},
 {id:'wall-peach',slot:'wall',name:'雾粉墙面',price:24,color:'#e3d8d3'},
 {id:'wall-sage',slot:'wall',name:'雾绿墙面',price:36,color:'#d1d9cf'},
 {id:'floor-oak',slot:'floor',name:'自然橡木地板',price:0,color:'#c1ad91'},
 {id:'floor-rose',slot:'floor',name:'烟熏胡桃木',price:24,color:'#a28b77'},
 {id:'rug-oat',slot:'rug',name:'燕麦织毯',price:0,color:'#d9d4c4'},
 {id:'rug-cloud',slot:'rug',name:'流线云毯',price:18,color:'#d8dfda'},
 {id:'rug-flower',slot:'rug',name:'鼠尾草花形毯',price:36,color:'#c4ccb7'},
 {id:'seat-peach',slot:'seat',name:'浅莓软包椅',price:48,color:'#b28d91'},
 {id:'seat-sage',slot:'seat',name:'苔绿豆袋椅',price:48,color:'#758b76'},
 {id:'plant-sprout',slot:'plant',name:'陶盆小绿植',price:12,color:'#607764'},
 {id:'plant-tulip',slot:'plant',name:'瓶插郁金香',price:28,color:'#ad7e89'},
 {id:'light-mushroom',slot:'light',name:'蘑菇罩落地灯',price:32,color:'#b3a182'},
 {id:'light-moon',slot:'light',name:'月相落地灯',price:60,color:'#d1c7a8'},
 {id:'art-letter',slot:'art',name:'信笺装裱画',price:20,color:'#a17d83'},
 {id:'art-stars',slot:'art',name:'夜空抽象画',price:40,color:'#81989c'},
 {id:'chat-paper',slot:'chat',name:'素色信纸',price:0,color:'#fafaf6'},
 {id:'chat-garden',slot:'chat',name:'林间信纸',price:24,color:'#edf0e9'},
 {id:'wall-butter',slot:'wall',name:'奶油日光墙',price:32,color:'#e7e4d7'},
 {id:'wall-night',slot:'wall',name:'蓝调灰墙',price:38,color:'#bdcccc'},
 {id:'rug-cookie',slot:'rug',name:'圈纹羊毛毯',price:26,color:'#bcae92'},
 {id:'rug-petal',slot:'rug',name:'莓果波形毯',price:30,color:'#b99b9f'},
 {id:'seat-bunny',slot:'seat',name:'兔耳软包椅',price:56,color:'#ad7e89'},
 {id:'seat-toast',slot:'seat',name:'黄油软包椅',price:52,color:'#d5cbb7'},
 {id:'plant-daisy',slot:'plant',name:'陶瓶小雏菊',price:26,color:'#e8e4d7'},
 {id:'light-tulip',slot:'light',name:'花苞褶罩灯',price:42,color:'#b8a49f'},
 {id:'art-bunting',slot:'art',name:'三色织物挂饰',price:18,color:'#81917b'},
 {id:'shelf-books',slot:'shelf',name:'胡桃木开放架',price:36,color:'#947557'},
 {id:'table-tea',slot:'table',name:'双杯圆茶几',price:40,color:'#947557'},
 {id:'chat-berry',slot:'chat',name:'灰莓信纸',price:24,color:'#f0e9e8'},
 {id:'chat-sky',slot:'chat',name:'蓝灰信纸',price:24,color:'#ebf0ee'}
];
export const DEFAULT_HOME={wall:'wall-cream',floor:'floor-oak',rug:'rug-oat',chat:'chat-paper'};
export const HOME_RULES={welcome:20,minutesPerReward:10,beansPerReward:2,presenceCap:36,socialCap:12,chatReward:3,gestureReward:1,timezone:'Asia/Shanghai'};
