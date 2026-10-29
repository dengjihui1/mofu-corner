export const PERSONALITIES = {
  rat: { group:'a',row:0,tempo:1.15,accent:'#8b7ab5',trait:'好奇的小侦探',touch:'挠挠脸颊',play:'一起找谷粒',rest:'把尾巴盖好',game:'seeds',toy:'seed',instruction:'有三颗小谷粒，帮小米一颗颗找到。',greeting:'你来啦，今天有什么新鲜事？',touched:['呀，被你发现我的软脸颊啦。','再挠一下，就一下。','好吧，今天的谷粒分你一颗。'],success:'三颗都找到了！我会慢慢吃的。',sleep:'尾巴盖好了，明天也来找我。',habit:'遇到喜欢的人，会把小爪子收在脸边。',idle:'peek',duration:1800 },
  ox: { group:'a',row:1,tempo:.65,accent:'#937052',trait:'可靠的慢性子',touch:'摸摸额头',play:'帮它推靠垫',rest:'稳稳趴一会',game:'cushion',toy:'cushion',instruction:'轻轻推三下，把靠垫送到阿稳面前。',greeting:'不用急，我陪你慢慢来。',touched:['嗯……这个力度刚刚好。','有我在，今天也稳稳的。','再忙，也记得松松肩膀呀。'],success:'到了。你看，慢一点也能做好。',sleep:'我就在这里歇一会，不走远。',habit:'回应总慢半拍，却每次都很认真。',idle:'nod',duration:2700 },
  tiger: { group:'a',row:2,tempo:1.3,accent:'#bd8250',trait:'一摸就露馅的小威风',touch:'揉揉小脑袋',play:'来个虎爪击掌',rest:'收起小威风',game:'highfive',toy:'paw',instruction:'碰一碰小爪子，和橘宝击掌三次。',greeting:'嗷！今天也由本虎陪着你。',touched:['才、才没有很喜欢摸摸呢。','好吧，再揉一下也可以。','嗷呜……已经变成小猫了。'],success:'三次击掌，今天的勇气充满了！',sleep:'小威风下班，呼噜声值班。',habit:'挺胸只能坚持两秒，之后就想被摸摸。',idle:'tiger',duration:1700 },
  rabbit: { group:'b',row:0,tempo:1.2,accent:'#bc8095',trait:'耳朵先说话',touch:'轻轻顺顺毛',play:'踩着云朵跳',rest:'耳朵也歇歇',game:'hop',toy:'cloud',instruction:'点亮三朵小云，耳朵会一朵一朵跳过去。',greeting:'我听见你的脚步声啦。',touched:['耳朵软软的，要轻一点哦。','一只耳朵开心，另一只慢半拍。','现在，两只耳朵都喜欢你。'],success:'跳过来了，刚好落在你旁边。',sleep:'今天听到的好事，都收进梦里。',habit:'开心时先歪头，接着才忍不住蹦一下。',idle:'rabbit',duration:1450 },
  dragon: { group:'b',row:1,tempo:1,accent:'#7587c7',trait:'会把心事变成云',touch:'给云朵一个抱抱',play:'收集三朵小云',rest:'卷成一朵云',game:'clouds',toy:'cloud',instruction:'点点飘来的三朵小云，一起把烦恼放轻。',greeting:'今天，也一起慢慢来。',touched:['抱住了，是软乎乎的你。','云朵正在悄悄充电。','充好啦，分你一点好心情。'],success:'收集完毕！今天可以轻一点。',sleep:'我先卷起来，给你留一小块云。',habit:'喜欢把小云抱在怀里，遇到你就想张开手。',idle:'dragon',duration:2100 },
  snake: { group:'b',row:2,tempo:.8,accent:'#719b85',trait:'尾尖藏着小心思',touch:'轻轻碰碰头',play:'滚球给青团',rest:'盘成小青团',game:'roll',toy:'ball',instruction:'拖动小球，让它先到左边、再到右边。也可用方向键。',greeting:'嘘，我的尾尖在向你打招呼。',touched:['喜欢你，所以尾巴偷偷弯了。','没有小手，也可以回应你。','尾尖圈起来，就当是个抱抱。'],success:'接到了！尾尖也能把球抱稳。',sleep:'盘好了。小青团进入省电模式。',habit:'没有手脚，所有心情都藏在偏头和尾尖里。',idle:'snake',duration:2400 },
  horse: { group:'c',row:0,tempo:1.4,accent:'#a37e60',trait:'藏不住的小期待',touch:'顺顺短鬃毛',play:'陪踏踏小踏步',rest:'小蹄子下班',game:'steps',toy:'hoof',instruction:'跟着点三次小蹄印，陪踏踏原地走一小段。',greeting:'准备好了？我会等你一起出发。',touched:['鬃毛顺好了，可以出发啦。','还想再靠近你一点点。','走累了也没关系，我陪你停下来。'],success:'哒、哒、哒！这一小段，我们一起走完啦。',sleep:'小蹄子休息了，明天继续出发。',habit:'很想跑，却总记得先等一等身边的人。',idle:'horse',duration:1350 },
  sheep: { group:'c',row:1,tempo:.55,accent:'#9485b3',trait:'慢慢呼吸的小棉花',touch:'揉揉羊毛团',play:'一起慢慢呼吸',rest:'戴好小睡帽',game:'breathe',toy:'moon',instruction:'点一下开始，跟着绵绵吸气、呼气。随时可以停。',greeting:'先松口气，再做下一件事吧。',touched:['揉进去了，是很软的羊毛。','今天已经很努力啦。','再靠一会儿，也完全可以。'],success:'呼……现在有没有松一点点？',sleep:'把今天折好，放在枕头旁边。',habit:'把放松这件事做得很认真，从来不催你。',idle:'sheep',duration:3200 },
  monkey: { group:'c',row:2,tempo:1.35,accent:'#a37d69',trait:'爱藏猫猫的小淘气',touch:'挠挠小脑袋',play:'和桃桃躲猫猫',rest:'把尾巴收好',game:'peekaboo',toy:'leaf',instruction:'桃桃躲到叶子后了，点开叶子找它。',greeting:'猜猜我正准备什么小把戏？',touched:['哈哈，被你挠到啦！','头顶这个位置，刚好。','再挠我就要笑出小猴声了。'],success:'找到啦！其实我也很想被你找到。',sleep:'今天的小把戏，留一个在梦里。',habit:'假装很会躲，尾巴却总忍不住露出来。',idle:'monkey',duration:1550 },
  rooster: { group:'d',row:0,tempo:1.15,accent:'#b99544',trait:'认真打气的小毛球',touch:'摸摸小鸡冠',play:'左右伸伸翅膀',rest:'小翅膀收工',game:'wings',toy:'feather',instruction:'依次点左、右、左，让啾啾舒展小翅膀。',greeting:'啾，今天也有一点小小的精神。',touched:['小鸡冠，也是软乎乎的。','收到摸摸，精神加一点。','我会安静给你打气，不打鸣。'],success:'伸展开啦！给今天一个小小的拥抱。',sleep:'安静收工，明天再为你打气。',habit:'很爱挺胸，打气时只展开翅膀，不突然鸣叫。',idle:'rooster',duration:1700 },
  dog: { group:'d',row:1,tempo:1.25,accent:'#a7825b',trait:'认真等你的好朋友',touch:'挠挠小下巴',play:'抛个球给旺仔',rest:'陪它趴一会',game:'fetch',toy:'ball',instruction:'试着抛三次小球，旺仔每次都会认真叼回来。',greeting:'你终于来啦，我一直在这里。',touched:['下巴挠对了，尾巴藏不住啦。','你忙的时候，我也会乖乖等。','再挠一会儿？不着急的话。'],success:'叼回来啦，球给你，我也给你。',sleep:'你在旁边，我就睡得很安心。',habit:'球可以叼回来，喜欢你这件事藏不起来。',idle:'dog',duration:1800 },
  pig: { group:'d',row:2,tempo:.7,accent:'#ba8790',trait:'很会休息的小专家',touch:'揉揉软脸蛋',play:'陪噗噗伸懒腰',rest:'一起睡个小觉',game:'stretch',toy:'pillow',instruction:'慢慢拉动舒展条，让小懒腰从一半伸到刚刚好。',greeting:'先找个舒服的位置，我陪你。',touched:['脸蛋很软，今天也要对自己软一点。','嗯……舒服得想眯起眼。','休息好了，再一起认真工作。'],success:'哈——伸完了，身体都轻了一点。',sleep:'好好休息，也是今天的正经事。',habit:'伸懒腰永远不急，卷尾巴比身体先醒。',idle:'pig',duration:2800 },
};

PERSONALITIES.otter={...PERSONALITIES.dragon,group:'b',row:1,accent:'#829777',trait:'慢慢送信的小邮差',touch:'摸摸小獭',play:'收好三份小心意',rest:'抱着邮包歇歇',greeting:'邮包放好了，今天也慢慢来。',touched:['小獭把脑袋凑了过来。','喜欢摸摸，邮包也可以借你抱。','今天的心意，我都收好啦。']};

export class PlaySession {
  constructor(id='dragon'){this.select(id);}
  select(id){if(!PERSONALITIES[id])throw Error('UNKNOWN_PET');this.id=id;this.mode='idle';this.progress=0;this.game=null;this.endpoints=new Set();this.touchCount=0;this.serial=(this.serial||0)+1;return this;}
  touch(){this.serial++;this.mode='touch';this.game=null;this.progress=0;this.touchCount++;return PERSONALITIES[this.id].touched[(this.touchCount-1)%3];}
  start(){this.serial++;this.mode='play';this.progress=0;this.endpoints.clear();this.game=PERSONALITIES[this.id].game;return this.game;}
  advance(value){if(this.mode!=='play'||!this.game)return false;let goal=3;
    if(this.game==='roll'){goal=2;if(value==='left'&&this.progress===0){this.endpoints.add('left');this.progress=1;}else if(value==='right'&&this.progress===1){this.endpoints.add('right');this.progress=2;}}
    else if(this.game==='stretch'){goal=1;if(Number(value)>=95)this.progress=1;}
    else if(this.game==='breathe'){goal=1;if(value==='done')this.progress=1;}
    else if(this.game==='wings'){if(value===(this.progress%2===0?'left':'right'))this.progress++;}
    else this.progress++;
    const complete=this.progress>=goal;if(complete){this.mode='done';this.game=null;}return complete;
  }
  sleep(){this.serial++;this.mode='sleep';this.game=null;this.progress=0;}
  wake(){this.serial++;this.mode='idle';this.game=null;this.progress=0;}
}
