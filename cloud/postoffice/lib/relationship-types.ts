export const RELATIONSHIPS = [
  {id:'besties',label:'闺蜜',icon:'flower'},
  {id:'colleagues',label:'同事',icon:'briefcase'},
  {id:'couple',label:'情侣',icon:'heart'},
  {id:'buddies',label:'哥们儿',icon:'paw'},
  {id:'father_son',label:'父子',icon:'home',roles:['father','son']},
  {id:'mother_son',label:'母子',icon:'home',roles:['mother','son']},
  {id:'father_daughter',label:'父女',icon:'home',roles:['father','daughter']},
  {id:'mother_daughter',label:'母女',icon:'home',roles:['mother','daughter']}
];
export const ROLE_LABELS={father:'爸爸',mother:'妈妈',son:'儿子',daughter:'女儿'};
export const relationshipType=id=>RELATIONSHIPS.find(item=>item.id===id);
