export const CATALOG = Object.freeze([
  {"id": "rat", "name": "圆耳小鼠", "nickname": "小米", "zodiac": "鼠", "description": "对什么都好奇", "bag": "#c9c5d8", "stamp": "#e7b7bc"},
  {"id": "ox", "name": "慢慢小牛", "nickname": "阿稳", "zodiac": "牛", "description": "慢一点，也会到", "bag": "#c8ae91", "stamp": "#937052"},
  {"id": "tiger", "name": "小威风虎", "nickname": "橘宝", "zodiac": "虎", "description": "一摸就露馅的小威风", "bag": "#edb57e", "stamp": "#bd8250"},
  {"id": "rabbit", "name": "折耳兔", "nickname": "耳朵", "zodiac": "兔", "description": "一只耳朵总慢半拍", "bag": "#f2d9de", "stamp": "#bc8095"},
  {"id": "dragon", "name": "小云龙", "nickname": "云朵", "zodiac": "龙", "description": "软乎乎的云，有一点淘气", "bag": "#a9c3f3", "stamp": "#ffb99c"},
  {"id": "snake", "name": "青团小蛇", "nickname": "青团", "zodiac": "蛇", "description": "心思都藏在尾尖里", "bag": "#adcfbb", "stamp": "#719b85"},
  {"id": "horse", "name": "小踏步马", "nickname": "踏踏", "zodiac": "马", "description": "很想出发，也记得等你", "bag": "#caa58a", "stamp": "#a37e60"},
  {"id": "sheep", "name": "小棉花羊", "nickname": "绵绵", "zodiac": "羊", "description": "把放松这件事做得很认真", "bag": "#cfc7e2", "stamp": "#9485b3"},
  {"id": "monkey", "name": "桃桃小猴", "nickname": "桃桃", "zodiac": "猴", "description": "假装很会躲，尾巴却露馅", "bag": "#b69a88", "stamp": "#a37d69"},
  {"id": "rooster", "name": "打气小鸡", "nickname": "啾啾", "zodiac": "鸡", "description": "展开翅膀，安静打气", "bag": "#f1d68b", "stamp": "#b99544"},
  {"id": "dog", "name": "等你小狗", "nickname": "旺仔", "zodiac": "狗", "description": "喜欢你这件事藏不住", "bag": "#d5b795", "stamp": "#a7825b"},
  {"id": "pig", "name": "小懒腰猪", "nickname": "噗噗", "zodiac": "猪", "description": "休息也是正经事", "bag": "#eabdc0", "stamp": "#ba8790"},
  { id:'otter',name:'邮差小獭',nickname:'折折',zodiac:null,description:'抱着邮包，慢慢来',bag:'#91a185',stamp:'#d99b79' },
]);
export const ZODIAC = Object.freeze(['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']);
export const DEFAULT_CHARACTER = Object.freeze({ schema: 'paperpal.character.v2', species: 'dragon', name: '云朵', bag: '#a9c3f3', stamp: '#ffb99c', size: .60, scarf: false, personality: 'gentle' });
export function validateCharacter(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || !['paperpal.character.v1', DEFAULT_CHARACTER.schema].includes(value.schema)) throw new Error('CHARACTER_SCHEMA');
  const legacy = value.schema === 'paperpal.character.v1';
  if (Object.keys(value).some(k => !(legacy ? ['schema', 'name', 'bag', 'stamp'] : Object.keys(DEFAULT_CHARACTER)).includes(k))) throw new Error('CHARACTER_UNKNOWN_FIELDS');
  if (typeof value.name !== 'string' || !value.name.trim() || value.name.length > 16 || /[<>\u0000-\u001f]/.test(value.name)) throw new Error('CHARACTER_NAME');
  if (![value.bag, value.stamp].every(c => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c))) throw new Error('CHARACTER_COLOR');
  const species = legacy ? 'otter' : value.species;
  const size = legacy ? 1 : value.size;
  const scarf = legacy ? true : value.scarf;
  const personality = legacy ? 'gentle' : value.personality;
  if (!CATALOG.some(c => c.id === species) || typeof size !== 'number' || !Number.isFinite(size) || size < .55 || size > 1.3 || typeof scarf !== 'boolean' || !['gentle', 'playful', 'quiet'].includes(personality)) throw new Error('CHARACTER_OPTIONS');
  return { schema: DEFAULT_CHARACTER.schema, species, name: value.name.trim(), bag: value.bag, stamp: value.stamp, size, scarf, personality };
}
export function createCharacter(options = {}) {
  const preset = CATALOG.find(c => c.id === (options.species || 'dragon'));
  if (!preset) throw new Error('CHARACTER_SPECIES');
  return validateCharacter({ ...DEFAULT_CHARACTER, species: preset.id, name: preset.nickname, bag: preset.bag, stamp: preset.stamp, scarf: preset.id === 'otter', ...options });
}
