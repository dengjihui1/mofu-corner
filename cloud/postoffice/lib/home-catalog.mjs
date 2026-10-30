// Prices and ownership are authoritative on the server. No cash purchases or transfers.
export const CATALOG = [
 {id:'wall-cream',slot:'wall',name:'奶油墙纸',price:0,color:'#f4e6d6'},
 {id:'wall-peach',slot:'wall',name:'蜜桃小格',price:24,color:'#f2d9d4'},
 {id:'wall-sage',slot:'wall',name:'抹茶花园',price:36,color:'#dce5d5'},
 {id:'floor-oak',slot:'floor',name:'蜂蜜木地板',price:0,color:'#d9b795'},
 {id:'floor-rose',slot:'floor',name:'草莓奶木',price:24,color:'#d9bbb2'},
 {id:'rug-oat',slot:'rug',name:'燕麦软垫',price:0,color:'#eee0cb'},
 {id:'rug-cloud',slot:'rug',name:'云朵地毯',price:18,color:'#fff8ec'},
 {id:'rug-flower',slot:'rug',name:'奶黄小雏菊',price:36,color:'#f5df91'},
 {id:'seat-peach',slot:'seat',name:'桃桃小沙发',price:48,color:'#daa8a1'},
 {id:'seat-sage',slot:'seat',name:'抹茶豆袋',price:48,color:'#a6b99c'},
 {id:'plant-sprout',slot:'plant',name:'第一盆小芽',price:12,color:'#87a078'},
 {id:'plant-tulip',slot:'plant',name:'郁金香来信',price:28,color:'#d99b9d'},
 {id:'light-mushroom',slot:'light',name:'蘑菇晚安灯',price:32,color:'#d7a677'},
 {id:'light-moon',slot:'light',name:'月亮落地灯',price:60,color:'#e9cc85'},
 {id:'art-letter',slot:'art',name:'一封小小的信',price:20,color:'#d5a0a5'},
 {id:'art-stars',slot:'art',name:'数星星挂画',price:40,color:'#849bb0'},
 {id:'chat-paper',slot:'chat',name:'奶油信纸',price:0,color:'#fffcf8'},
 {id:'chat-garden',slot:'chat',name:'花园来信',price:24,color:'#edf1e7'},
 {id:'chat-sky',slot:'chat',name:'晴空邮票',price:24,color:'#eaf0f5'}
];
export const DEFAULT_HOME={wall:'wall-cream',floor:'floor-oak',rug:'rug-oat',chat:'chat-paper'};
export const HOME_RULES={welcome:20,minutesPerReward:10,beansPerReward:2,presenceCap:36,socialCap:12,chatReward:3,gestureReward:1,timezone:'Asia/Shanghai'};
