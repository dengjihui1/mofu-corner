// Coordinates describe the animal's shoulder, torso and hip, not a shared toy body.
// The artwork keeps its aspect ratio; all feet rest on the same ground line.
const seated={headY:178,headWidth:153,bodyY:238,bodyWidth:100,footWidth:42,feetX:[137,183],shoulders:[[116,244],[204,244]],armWidth:33,armRest:-.08,tailX:215,tailY:253,tailWidth:49};
const quadruped={headY:166,headWidth:153,bodyY:223,bodyWidth:122,legWidth:49,legsX:[134,186],tailX:219,tailY:240,tailWidth:58};
export const ANATOMY_LAYOUT={
 rabbit:{...seated,headY:176,headWidth:154,bodyWidth:96,footWidth:43,armWidth:34,tailWidth:40,tailX:211,tailY:251},
 rat:{...seated,bodyY:236,bodyWidth:100,footWidth:42,armWidth:33,shoulders:[[116,243],[204,243]],tailWidth:53},
 tiger:{...seated,bodyY:238,bodyWidth:106,armWidth:34,shoulders:[[113,240],[207,240]],tailWidth:56},
 dragon:{...seated,bodyY:238,bodyWidth:107,headWidth:158,footWidth:43,armWidth:41,shoulders:[[111,244],[209,244]],tailWidth:57},
 monkey:{...seated,bodyY:238,bodyWidth:100,footWidth:42,armWidth:33,shoulders:[[115,250],[205,250]],tailWidth:55},
 ox:{...quadruped},
 horse:{...quadruped,bodyWidth:122,tailWidth:58},
 sheep:{...quadruped,bodyWidth:126,headWidth:151,tailX:220,tailY:243,tailWidth:43},
 dog:{...quadruped,bodyWidth:122,tailX:219,tailY:242,tailWidth:59},
 pig:{...quadruped,bodyWidth:122,tailX:218,tailY:241,tailWidth:41},
 rooster:{...seated,headY:174,headWidth:126,bodyY:230,bodyWidth:104,footWidth:68,armWidth:43,armRest:-.40,shoulders:[[125,229],[195,229]],tailX:218,tailY:247,tailWidth:64},
 snake:{headY:190,headWidth:142,bodyY:273,bodyWidth:165,tailX:215,tailY:267,tailWidth:56},
};
