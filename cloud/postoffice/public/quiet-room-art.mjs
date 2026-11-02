const ns='http://www.w3.org/2000/svg';
let sequence=0;
export const QUIET_ROOM_ITEMS=Object.freeze(['wall-sage','rug-flower','seat-sage','plant-sprout','shelf-books','table-reading','light-task','art-herbarium','wall-night','rug-cloud','seat-peach','light-moon','art-stars','shelf-steel','table-chess','floor-slate']);

// Independent objects retain their identity, silhouette and material when moved.
export function quietItemArt(item){
 if(!QUIET_ROOM_ITEMS.includes(item?.id))return null;
 const id='quiet-'+(++sequence),url=name=>`url(#${id}-${name})`;
 let width=100,height=100,body='',contact='';
 const shadow=(x,y,rx,ry=3)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#28312a" opacity=".19" filter="${url('contact')}"/>`;
 const oak=url('oak'),walnut=url('walnut'),steel=url('steel');

 if(item.id==='seat-sage'){
  width=120;height=130;contact=shadow(63,124,48);
  body=`
   <path d="M31 46L15 120M92 43L107 119M17 120L91 65M105 119L35 68" fill="none" stroke="#72583d" stroke-width="6.5" stroke-linecap="round"/>
   <path d="M31 46L17 118M91 45L104 116M20 118L90 65" fill="none" stroke="#c2a077" stroke-width="2" stroke-linecap="round"/>
   <path d="M24 15L93 10L103 66L35 77Z" fill="#506956"/>
   <path d="M28 15L90 11L98 62Q99 70 90 76L59 98Q48 104 38 96L22 83Q18 79 24 73L37 67Z" fill="${url('sage')}"/>
   <path d="M33 21L85 17L92 61Q93 67 86 72L56 92Q47 98 39 91L27 81Q24 78 30 73L43 66Z" fill="none" stroke="#c9cdb1" stroke-width=".9"/>
   <path d="M43 66Q57 76 90 65M31 77Q46 94 62 87" fill="none" stroke="#354d3e" stroke-opacity=".32" stroke-width="1.1"/>
   <path d="M29 16L90 12L98 62Q99 70 90 76L59 98Q48 104 38 96L22 83Q18 79 24 73L37 67Z" fill="${url('weave')}" opacity=".2"/>
   <path d="M21 14L96 9" stroke="#8a6746" stroke-width="7" stroke-linecap="round"/><path d="M22 12L95 7" stroke="#c1a17b" stroke-width="2" stroke-linecap="round"/>
   <path d="M21 67L27 90M99 62L93 88" stroke="#765639" stroke-width="5.4" stroke-linecap="round"/>
   <path d="M17 58L42 80M89 49L113 70" stroke="#785a3e" stroke-width="7.5" stroke-linecap="round"/><path d="M17 56L42 77M89 47L113 67" stroke="#c4a27a" stroke-width="5" stroke-linecap="round"/>
   <circle cx="29" cy="92" r="2.2" fill="#a89b7d"/><circle cx="94" cy="91" r="2.2" fill="#a89b7d"/><circle cx="29" cy="92" r=".7" fill="#69533c"/><circle cx="94" cy="91" r=".7" fill="#69533c"/>
   <path d="M51 36L71 34L76 51L56 54Z" fill="#e5ddc6"/><path d="M54 39L69 37L73 48L58 51Z" fill="none" stroke="#c5baa2" stroke-width=".7"/>
  `;
 }
 if(item.id==='shelf-books'){
  width=100;height=155;contact=shadow(52,151,42,2.7);
  body=`
   <path d="M8 12H84V144H8Z" fill="#573f2e"/><path d="M84 12L94 7V138L84 144Z" fill="#674832"/>
   <path d="M8 12L18 7H94L84 12Z" fill="#b38c65"/><path d="M14 19H77V136H14Z" fill="#443a2f"/>
   <path d="M10 15H15V142H10ZM77 15H83V142H77Z" fill="${walnut}"/>
   <path d="M14 48H78V53H14ZM14 89H78V94H14ZM14 132H78V138H14Z" fill="#b18c65"/><path d="M14 53H78M14 94H78M14 138H78" stroke="#3a3026" stroke-width="1.5"/>
   <path d="M13 143V150M78 143V150M90 138V145" stroke="#674b35" stroke-width="4" stroke-linecap="round"/>
   <g stroke="#d4c9b6" stroke-width=".45"><path d="M20 27H28V48H20Z" fill="#6f8172"/><path d="M29 23H35V48H29Z" fill="#b8af91"/><path d="M36 26H43V48H36Z" fill="#8b6e5f"/><path d="M45 25L51 23L59 46L53 48Z" fill="#cbc4ae"/></g>
   <path d="M22 30H26M31 27H33M38 29H41M23 43H26M38 43H41" stroke="#e9e0c9" stroke-width=".65"/>
   <path d="M65 32L64 26H71L70 32Q78 42 71 47H64Q58 41 65 32Z" fill="${url('ceramic')}"/><ellipse cx="67.5" cy="26" rx="3.5" ry="1.1" fill="#968b74"/>
   <path d="M23 73H50V81H23Z" fill="#b1ad92"/><path d="M20 81H52V87H20Z" fill="#687265"/><path d="M24 76H47M23 84H48" stroke="#e5ddc9" stroke-width="1"/>
   <path d="M58 63Q67 56 74 64L72 87H60Z" fill="#b8aa8b"/><ellipse cx="66" cy="64" rx="8" ry="2.8" fill="#d4c8ae"/><ellipse cx="66" cy="64" rx="4.8" ry="1.6" fill="#716750"/>
   <path d="M21 104H28V131H21ZM30 101H38V131H30Z" fill="#b9b9a1"/><path d="M40 106H47V131H40Z" fill="#716f61"/><path d="M49 100H56V131H49Z" fill="#9d856b"/><path d="M59 111L66 109L73 130L66 132Z" fill="#d0c5ac"/>
   <path d="M23 108H26M32 106H36M42 111H45M51 106H54M51 125H54" stroke="#e4d9c3" stroke-width=".7"/>
   <path d="M10 15V139M80 17V140M86 15V137" fill="none" stroke="#d3ab7a" stroke-opacity=".25" stroke-width=".65"/>
  `;
 }
 if(item.id==='plant-sprout'){
  width=85;height=140;contact=shadow(42,135,27,2.8);
  body=`
   <path d="M39 110L43 28M42 69L23 46M42 54L65 33M41 88L66 64M43 38L30 20" stroke="#655f3c" stroke-width="1.7" fill="none" stroke-linecap="round"/>
   <path d="M42 36Q27 39 24 27Q33 20 42 36M42 49Q50 33 61 37Q65 50 42 49M36 63Q21 68 17 54Q26 48 36 63M43 78Q57 60 67 67Q67 81 43 78M42 94Q22 96 21 82Q33 73 42 94M45 25Q34 17 39 6Q51 8 45 25M58 38Q55 19 69 17Q78 28 58 38M26 46Q11 46 9 33Q20 27 26 46M63 65Q63 46 78 49Q81 62 63 65" fill="${url('leaf')}"/>
   <path d="M27 28L41 36M46 47L57 40M21 56L34 63M46 77L62 69M25 84L39 92M42 12L44 24M61 32L68 22M14 35L23 43M68 59L76 52" fill="none" stroke="#b8bf93" stroke-width=".65"/>
   <path d="M16 103Q42 96 69 103L63 128Q42 140 22 128Z" fill="${url('clay')}"/><ellipse cx="42.5" cy="103" rx="26.5" ry="6.5" fill="#aaa189"/><ellipse cx="42.5" cy="102" rx="22.5" ry="4.9" fill="#53573d"/>
   <path d="M40 105V96" stroke="#665d3f" stroke-width="2"/><path d="M23 109L27 126M29 110L32 128M36 111L38 130M44 112V131M51 110L49 129M59 108L55 126" stroke="#ece7d5" stroke-opacity=".34" stroke-width=".6"/>
   <path d="M24 132Q43 139 62 131" fill="none" stroke="#90846c" stroke-width="1.4"/>
  `;
 }
 if(item.id==='table-reading'){
  width=105;height=125;contact=shadow(54,120,41,2.5);
  body=`
   <path d="M30 65V110L82 114L87 109L36 105V63" fill="none" stroke="#49574d" stroke-width="4" stroke-linejoin="round"/>
   <path d="M31 67V107L83 111" fill="none" stroke="#9aa490" stroke-width=".8"/>
   <path d="M9 48L72 36L97 51L32 66Z" fill="#755b3f"/><path d="M9 48V53L32 71L97 56V51L32 66Z" fill="#97744e"/><path d="M9 48L72 36L97 51L32 66Z" fill="${oak}"/>
   <path d="M17 48L34 60L86 49" fill="none" stroke="#dbc29b" stroke-opacity=".6" stroke-width=".7"/>
   <path d="M28 42L42 37Q51 35 59 40Q66 32 77 34L89 40L69 54Q61 49 53 52Z" fill="#b4b09a"/>
   <path d="M28 40L42 35Q51 33 59 38Q67 30 77 32L89 38L69 51Q61 46 53 49Z" fill="#ede7d5"/>
   <path d="M59 38L53 49M32 40L53 46M35 38L55 43M64 37L80 34M62 40L81 37M60 43L77 40" stroke="#b9b29c" stroke-width=".6" fill="none"/>
   <path d="M57 40L56 49L60 48" fill="none" stroke="#9a7156" stroke-width="1"/>
   <ellipse cx="24" cy="45" rx="9" ry="2.6" fill="#d0c6ac"/><path d="M18 30H30V41Q24 47 18 41Z" fill="${url('ceramic')}"/><ellipse cx="24" cy="30" rx="6" ry="2.2" fill="#807156"/><path d="M30 32Q37 30 35 36Q34 40 30 39" fill="none" stroke="#d8cfb7" stroke-width="1.7"/>
   <path d="M77 42L82 45M75 44L80 47" stroke="#9e9b82" stroke-width=".65"/>
  `;
 }
 if(item.id==='light-task'){
  width=90;height=150;contact=shadow(47,144,31,2.6);
  body=`
   <ellipse cx="47" cy="140" rx="27" ry="5" fill="#364a3d"/><ellipse cx="47" cy="138" rx="27" ry="4" fill="#657767"/>
   <path d="M47 135V89L68 59L46 32" fill="none" stroke="#31493a" stroke-width="3.6" stroke-linejoin="round"/><path d="M43 133V89L63 59L42 34" fill="none" stroke="#7d8d72" stroke-width="1.2"/>
   <path d="M45 88L63 63M62 56L47 38" stroke="#b4baa3" stroke-width="1"/><path d="M47 86L63 64M60 56L48 41" stroke="#334c3c" stroke-width="2.7" stroke-dasharray="1 1.5"/>
   <circle cx="46" cy="89" r="4.1" fill="#273c30"/><circle cx="46" cy="89" r="1.6" fill="#b0b6a0"/><circle cx="66" cy="59" r="4" fill="#273c30"/><circle cx="66" cy="59" r="1.6" fill="#b0b6a0"/>
   <path d="M43 34L39 26L32 25" stroke="#455f4b" stroke-width="4" fill="none"/><path d="M20 14Q26 8 34 13L47 31Q50 36 43 39L14 40Q7 38 11 31Z" fill="${url('green-metal')}"/>
   <path d="M17 24L22 17Q26 13 30 15" fill="none" stroke="#a8b59b" stroke-width="1"/>
   <ellipse cx="28" cy="38" rx="18.5" ry="4.5" fill="#293d30"/><ellipse cx="28" cy="38" rx="15" ry="2.8" fill="#e8e3bc"/><ellipse cx="28" cy="38" rx="5.4" ry="1.6" fill="#fff6d3"/>
   <path d="M50 139Q69 140 76 147" stroke="#3c4538" stroke-width=".8" fill="none"/>
  `;
 }
 if(item.id==='art-herbarium'){
  height=130;
  body=`
   <path d="M10 7H91V123H10Z" fill="#594c3c"/><path d="M7 5H87V120H7Z" fill="${oak}"/><path d="M12 10H82V115H12Z" fill="#f1eddf"/><path d="M18 16H76V103H18Z" fill="#e6e4d3"/>
   <path d="M47 92L46 32M46 74L30 59M46 60L62 44M46 45L35 31" stroke="#64745a" stroke-width="1.1" fill="none"/>
   <path d="M46 81Q31 85 27 72Q40 68 46 81M45 67Q56 54 66 61Q63 74 45 67M39 62Q24 64 23 52Q35 47 39 62M48 56Q52 41 65 40Q71 53 48 56M46 43Q35 45 31 33Q42 27 46 43M46 34Q38 27 44 20Q54 24 46 34" fill="#91a486"/>
   <path d="M31 75L43 80M49 67L61 63M27 55L37 60M52 52L62 43M35 35L43 41" stroke="#b6c0a6" stroke-width=".65" fill="none"/>
   <path d="M38 88H53M36 91H55" stroke="#c8ba95" stroke-width="2.2"/><path d="M31 108H63" stroke="#a6a38c" stroke-width=".6"/>
   <text x="47" y="112" text-anchor="middle" font-family="Arial,sans-serif" font-size="2.5" letter-spacing=".8" fill="#7d826e">BOTANICAL STUDY</text><path d="M9 7H85M9 9V117" stroke="#d5b991" stroke-width=".7"/>
  `;
 }
 if(item.id==='rug-flower'){
  width=160;
  body=`<path d="M16 11H143L153 91H7Z" fill="#7b8067"/><path d="M17 9H142L153 88H7Z" fill="#c7c5aa"/>
   <path d="M24 15H135L144 82H16Z" fill="#d9d2b7"/><path d="M25 20H135L136 27H24ZM22 40H138L139 49H21ZM19 64H141L142 73H18Z" fill="#6b8069"/>
   <path d="M25 30H136M23 35H137M21 52H140M20 57H140M18 77H142" stroke="#9d8e69" stroke-width="1.1"/>
   <path d="M22 13H137L147 85H13Z" fill="none" stroke="#69795f" stroke-width=".8"/><path d="M17 9H142L153 88H7Z" fill="${url('weave')}" opacity=".26"/>
   <g stroke="#b7b49b" stroke-width=".8">${Array.from({length:24},(_,i)=>`<path d="M${10+i*6} 89L${9.7+i*6.02} 95M${19+i*5.2} 4L${18.7+i*5.22} 9"/>`).join('')}</g>`;
 }
 if(item.id==='wall-sage')body=`<path d="M5 5H95V95H5Z" fill="#d1d9cf"/><path d="M5 73H95V95H5Z" fill="#b9b59f"/><path d="M13 15H78V68H13Z" fill="#8d6e4b"/><path d="M17 19H74V64H17Z" fill="#d4decb"/><path d="M17 46Q27 30 37 45Q47 28 59 43Q71 31 74 40V64H17Z" fill="#859d7d"/><path d="M17 57Q31 49 43 55Q60 48 74 55V64H17Z" fill="#55785a"/><path d="M45 19V64M17 43H74" stroke="#b99c73" stroke-width="2.5"/><path d="M12 68H80" stroke="#7e6345" stroke-width="3"/>`;

 if(item.id==='seat-peach'){
  width=145;height=110;contact=shadow(76,104,60,3);
  body=`
   <path d="M22 88V103M119 86V102M133 76V94" stroke="#29373e" stroke-width="4.8" stroke-linecap="round"/>
   <path d="M20 33Q20 22 32 22H111Q124 22 127 34L132 64L19 72Z" fill="#173b6f"/>
   <path d="M21 29Q22 19 34 19H108Q120 19 122 30L126 57Q127 65 118 67L30 72Q20 72 20 61Z" fill="${url('cobalt')}"/>
   <path d="M28 27H109Q115 27 116 33L119 58Q118 62 111 62L33 66Q28 66 28 59Z" fill="none" stroke="#a4b8ca" stroke-opacity=".5" stroke-width=".7"/>
   <path d="M18 64L111 58L135 76V92Q81 108 18 94Z" fill="#15355e"/>
   <path d="M18 64L110 57Q117 57 121 62L136 77Q140 82 132 85L40 98Q32 99 26 93L13 80Q8 70 18 64Z" fill="${url('cobalt')}"/>
   <path d="M17 73L34 91Q38 94 44 93L128 81" stroke="#809bb8" stroke-width=".75" fill="none"/>
   <path d="M9 49Q9 44 16 43L28 44Q34 46 34 52V84Q32 91 23 89L13 85Q8 83 8 75Z" fill="${url('cobalt')}"/>
   <path d="M116 43Q117 38 124 41L137 49Q141 53 140 59L139 82Q138 89 128 90L116 87Z" fill="#244b7d"/>
   <path d="M12 50L26 51V79M121 45L135 53V79" fill="none" stroke="#88a2bd" stroke-width=".6"/>
   <path d="M72 35L92 35L95 58L74 59Z" fill="#d6d5c6"/><path d="M75 38H89L91 55H77Z" fill="#deded0"/><path d="M77 39L89 52M80 39L90 49" stroke="#b8baaf" stroke-width=".55"/>
   <path d="M29 29H111L118 59L33 65Z" fill="${url('weave')}" opacity=".1"/>
  `;
 }
 if(item.id==='shelf-steel'){
  width=145;height=145;contact=shadow(76,140,61,3);
  body=`
   <path d="M16 20H124V135H16Z" fill="#a7b0af"/><path d="M124 20L136 12V126L124 135Z" fill="#818f94"/><path d="M16 20L29 12H136L124 20Z" fill="#d6ddda"/>
   <path d="M21 26H66V73H21ZM73 26H119V73H73ZM21 80H66V129H21ZM73 80H119V129H73Z" fill="#606e75"/>
   <path d="M21 26H66V69H21ZM73 26H119V69H73ZM21 80H66V125H21ZM73 80H119V125H73Z" fill="#7b898e"/>
   <path d="M17 21H123V25H17ZM17 73H123V79H17ZM17 129H123V134H17ZM67 23H72V131H67Z" fill="${steel}"/>
   <path d="M18 22V133M122 22V132M69 26V128M23 76H118" stroke="#e4e9e5" stroke-width=".8"/>
   <path d="M24 134V140M116 134V140M132 127V133" stroke="#5f6b6b" stroke-width="3" stroke-linecap="round"/>
   <path d="M26 41H34V70H26Z" fill="#c6c7bc"/><path d="M36 36H43V70H36Z" fill="#495e73"/><path d="M45 43H51V70H45Z" fill="#bcae91"/><path d="M52 40L57 39L64 69L59 70Z" fill="#d8d4c4"/>
   <path d="M28 46H32M38 41H41M47 47H49M28 63H32" stroke="#edf0e4" stroke-width=".7"/>
   <path d="M81 51H112V67H81Z" fill="#35464c"/><path d="M83 47H91L93 51H106L109 49H112V54H81Z" fill="#a0aaa8"/><circle cx="98" cy="59" r="9" fill="#1c2c36"/><circle cx="98" cy="59" r="6.8" fill="#566f7e"/><circle cx="98" cy="59" r="4.4" fill="#203848"/><circle cx="96" cy="57" r="1.6" fill="#8da9b2"/><rect x="84" y="54" width="5" height="3" rx=".6" fill="#c3ceca"/>
   <path d="M27 109H58V116H27Z" fill="#b4b3a5"/><path d="M24 117H61V126H24Z" fill="#424f65"/><path d="M28 112H54M28 121H57" stroke="#d6d9c9" stroke-width="1"/>
   <path d="M84 98Q89 89 98 92Q109 98 106 117L104 126H83Q80 111 84 98Z" fill="${url('ceramic-cool')}"/><ellipse cx="94" cy="95" rx="7.5" ry="3" fill="#81938f"/><ellipse cx="94" cy="95" rx="4" ry="1.4" fill="#4b6264"/>
   <path d="M125 23L133 18M126 27L133 22M126 31L133 26" stroke="#d0d7d2" stroke-opacity=".4" stroke-width=".5"/>
  `;
 }
 if(item.id==='table-chess'){
  width=150;height=105;contact=shadow(77,99,62,3);
  const checks=Array.from({length:8},(_,r)=>Array.from({length:8},(_,c)=>`<rect x="${c*7}" y="${r*7}" width="7" height="7" fill="${(r+c)%2?'#586467':'#b8b9a8'}"/>`).join('')).join('');
  body=`
   <path d="M23 48L16 95M124 44L135 94M50 60L48 97M104 34L107 87" stroke="#414e55" stroke-width="3.4" stroke-linecap="round"/>
   <path d="M24 49L18 93M123 47L133 92M51 62L49 94" stroke="#acb9ba" stroke-width=".8"/>
   <path d="M11 39Q12 35 18 34L112 22Q121 21 126 25L143 41Q148 47 140 49L43 64Q34 65 29 62L11 46Z" fill="#334c56" fill-opacity=".52" stroke="#3b4c54" stroke-width="1.1"/>
   <path d="M12 39L34 59Q38 62 43 61L140 46" fill="none" stroke="#c2d2ce" stroke-width=".9"/><path d="M22 36L114 25M45 62L139 48" stroke="#d5e0d8" stroke-opacity=".55" stroke-width=".5"/>
   <path d="M43 31L99 24L126 41L70 49Z" fill="#3d494b"/><path d="M43 31V33L70 51L126 43V41L70 49Z" fill="#69716c"/>
   <g transform="matrix(1 -.125 .48 .3 44 31)">${checks}</g>
   <g fill="#26393d" stroke="#121f25" stroke-width=".35"><path d="M66 31H73L71 28V22H68V28Z"/><circle cx="69.5" cy="21.2" r="2.4"/><ellipse cx="69.5" cy="31" rx="4" ry="1.3"/><path d="M88 29H96L94 26V20L92 16L90 20V26Z"/><path d="M90 16H94M92 14V18" fill="none" stroke="#26393d" stroke-width="1.2"/><ellipse cx="92" cy="29" rx="4.5" ry="1.4"/></g>
   <g fill="#d4d5c2" stroke="#868f84" stroke-width=".35"><path d="M81 40H89L87 37V30L85 27L83 30V37Z"/><path d="M82 27H88M85 24V30" fill="none" stroke="#d4d5c2" stroke-width="1.2"/><ellipse cx="85" cy="40" rx="4.3" ry="1.4"/><path d="M102 38H109L107 35V30H104V35Z"/><circle cx="105.5" cy="28.7" r="2.2"/><ellipse cx="105.5" cy="38" rx="4" ry="1.3"/></g>
   <path d="M29 44L38 41L46 46L37 49Z" fill="#b4bfba" fill-opacity=".6"/><path d="M30 42V34H39V42Q35 47 30 42Z" fill="#869d9e" fill-opacity=".72" stroke="#ccd6cb" stroke-width=".5"/><ellipse cx="34.5" cy="34" rx="4.5" ry="1.3" fill="#aab9b4" fill-opacity=".6"/>
  `;
 }
 if(item.id==='light-moon'){
  width=100;height=155;contact=shadow(36,150,30,2.8);
  body=`
   <path d="M12 143L40 137L64 144L38 152Z" fill="#656e71"/><path d="M12 140L40 134L64 141L38 149Z" fill="#a8b3b3"/><path d="M12 140V143L38 152V149Z" fill="#737d80"/>
   <path d="M37 140V61Q37 11 67 11Q85 11 85 33" fill="none" stroke="#5a6c75" stroke-width="3.5"/><path d="M36 138V61Q36 12 66 12Q83 12 84 31" fill="none" stroke="#c3cece" stroke-width="1"/>
   <path d="M80 33H90V39H80Z" fill="${steel}"/><circle cx="85" cy="52" r="14" fill="${url('orb')}"/><path d="M77 43Q70 53 77 61" stroke="#f6f4da" stroke-width="1.1" fill="none"/>
   <path d="M40 141Q60 141 75 151" stroke="#4e5e65" stroke-width=".7" fill="none"/>
  `;
 }
 if(item.id==='art-stars'){
  width=110;height=140;
  body=`
   <path d="M10 7H101V133H10Z" fill="#3c4c55"/><path d="M7 5H97V130H7Z" fill="${steel}"/><path d="M12 10H92V125H12Z" fill="#d2d7d1"/><path d="M17 15H87V118H17Z" fill="#314e6e"/>
   <g fill="none" stroke="#afc4cd" stroke-width=".65"><path d="M26 95V53L50 36L77 53V95ZM26 53H77M50 36V95M26 70H77M26 88H77M34 58H43V66H34ZM57 58H69V66H57ZM34 75H43V84H34ZM57 75H69V84H57Z"/><path d="M21 95H82M21 99H82M23 101V104M79 101V104M23 103H79M21 35V95M19 35H23M19 95H23"/><path d="M31 43L50 29L72 43M25 110H37M42 110H56M62 110H78"/></g>
   <path d="M50 25V102M22 52H81" stroke="#e3d5ab" stroke-width=".45" stroke-dasharray="2 2"/><circle cx="72" cy="26" r="5" fill="none" stroke="#d9deca" stroke-width=".6"/><path d="M72 19V33M65 26H79" stroke="#d9deca" stroke-width=".4"/>
   <text x="25" y="23" font-family="Arial,sans-serif" font-size="3.2" letter-spacing=".5" fill="#d7dfd9">CITY STUDY</text><text x="25" y="115" font-family="Arial,sans-serif" font-size="2.4" letter-spacing=".45" fill="#b2c5cb">ELEVATION  /  01</text><path d="M9 7H95M9 9V127" stroke="#dce1db" stroke-width=".6"/>
  `;
 }
 if(item.id==='rug-cloud'){
  width=160;
  body=`<path d="M14 43Q19 15 55 13Q80 11 99 28Q112 37 134 34Q154 34 154 55Q155 83 122 90Q99 96 73 83Q60 76 41 81Q15 87 8 69Q5 57 14 43Z" fill="#758c98"/>
   <path d="M15 40Q20 12 55 10Q80 8 99 25Q112 34 134 31Q154 31 154 52Q155 80 122 87Q99 93 73 80Q60 73 41 78Q15 84 8 66Q5 54 15 40Z" fill="${url('blue-rug')}"/>
   <path d="M21 43Q26 20 57 18Q77 17 95 32Q110 42 133 39Q145 38 146 53Q146 73 119 79Q99 85 76 73Q59 66 40 70Q20 76 16 63Q13 55 21 43Z" fill="none" stroke="#c1ced0" stroke-width="1.2"/>
   <path d="M27 45Q34 25 57 25Q77 25 90 38" fill="none" stroke="#68818f" stroke-width=".7"/><path d="M18 46Q24 18 57 15Q83 16 101 30Q119 39 135 36Q151 39 148 58Q143 79 116 83Q94 86 73 76Q54 70 36 75Q10 79 13 57Z" fill="${url('weave')}" opacity=".2"/>`;
 }
 if(item.id==='wall-night')body=`<path d="M5 5H95V95H5Z" fill="#9caeb4"/><path d="M5 73H95V95H5Z" fill="#707e85"/><path d="M12 19H90V65H12Z" fill="#425763"/><path d="M15 22H87V62H15Z" fill="#243e56"/><path d="M15 43H26V34H39V49H50V31H62V45H72V37H87V62H15Z" fill="#3d5968"/><path d="M20 50H24M30 40H34M30 47H34M55 37H59M55 45H59M75 43H79M80 51H84" stroke="#d5c9a0" stroke-width="1.6"/><path d="M43 22V62M70 22V62" stroke="#889b9e" stroke-width="1.3"/>`;
 if(item.id==='floor-slate')body=`<path d="M8 26L78 8L95 75L24 94Z" fill="#76858a"/><path d="M9 27L78 10L93 74L25 92Z" fill="${url('slate')}"/><path d="M31 20L48 86M55 14L72 80M14 48L83 30M19 70L89 53" stroke="#414f59" stroke-width="1.2"/><path d="M32 21L48 85M56 15L72 79M15 49L83 31M20 71L89 54" stroke="#9aabaa" stroke-opacity=".55" stroke-width=".5"/><path d="M13 30L28 26L33 44L18 48ZM60 58L82 52L87 72L65 78Z" fill="#c0cbc2" opacity=".09"/>`;

 const defs=`<defs>
  <linearGradient id="${id}-oak" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#c9ac81"/><stop offset=".5" stop-color="#b19165"/><stop offset="1" stop-color="#8f704b"/></linearGradient>
  <linearGradient id="${id}-walnut" x1="0" y1="0" x2=".75" y2="1"><stop stop-color="#ad8861"/><stop offset=".55" stop-color="#866243"/><stop offset="1" stop-color="#65472f"/></linearGradient>
  <linearGradient id="${id}-sage" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#9da88c"/><stop offset=".55" stop-color="#798e73"/><stop offset="1" stop-color="#526b56"/></linearGradient>
  <linearGradient id="${id}-leaf" x1="0" y1="0" x2="1" y2=".8"><stop stop-color="#a1ae87"/><stop offset=".5" stop-color="#7d956f"/><stop offset="1" stop-color="#557453"/></linearGradient>
  <linearGradient id="${id}-clay" x1="0" y1="0" x2="1" y2=".2"><stop stop-color="#b4aa90"/><stop offset=".3" stop-color="#d7cdb1"/><stop offset="1" stop-color="#a79a7d"/></linearGradient>
  <linearGradient id="${id}-ceramic"><stop stop-color="#b5b49d"/><stop offset=".35" stop-color="#e0ddc5"/><stop offset="1" stop-color="#969f86"/></linearGradient>
  <linearGradient id="${id}-green-metal" x1="0" y1="0" x2="1" y2=".7"><stop stop-color="#819477"/><stop offset=".4" stop-color="#5e795e"/><stop offset="1" stop-color="#354f3c"/></linearGradient>
  <linearGradient id="${id}-steel" x1="0" y1="0" x2="1" y2=".6"><stop stop-color="#b5c0bd"/><stop offset=".2" stop-color="#e0e6e0"/><stop offset=".43" stop-color="#97a7aa"/><stop offset=".76" stop-color="#c7d1cd"/><stop offset="1" stop-color="#82969e"/></linearGradient>
  <linearGradient id="${id}-cobalt" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#4a739f"/><stop offset=".4" stop-color="#315d8e"/><stop offset="1" stop-color="#1d416e"/></linearGradient>
  <linearGradient id="${id}-ceramic-cool"><stop stop-color="#9baaa3"/><stop offset=".4" stop-color="#c4cfc3"/><stop offset="1" stop-color="#778e87"/></linearGradient>
  <radialGradient id="${id}-orb" cx=".35" cy=".3" r=".8"><stop stop-color="#f5f2d6"/><stop offset=".7" stop-color="#d8ddce"/><stop offset="1" stop-color="#a7b8b6"/></radialGradient>
  <linearGradient id="${id}-blue-rug" x1="0" y1="0" x2=".3" y2="1"><stop stop-color="#b6c2c2"/><stop offset="1" stop-color="#8ca2ad"/></linearGradient>
  <linearGradient id="${id}-slate" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#849399"/><stop offset="1" stop-color="#596e7b"/></linearGradient>
  <pattern id="${id}-weave" width="1.3" height="1.3" patternUnits="userSpaceOnUse"><path d="M0 .3H1.3M.3 0V1.3" stroke="#f5f0db" stroke-width=".16"/><path d="M.9 .7V1.2" stroke="#253c38" stroke-width=".12"/></pattern>
  <filter id="${id}-contact" x="-25%" y="-100%" width="150%" height="300%"><feGaussianBlur stdDeviation="1.1"/></filter>
  <filter id="${id}-volume" x="-15%" y="-15%" width="135%" height="140%"><feDropShadow dx=".5" dy=".8" stdDeviation=".55" flood-color="#2c3935" flood-opacity=".16"/></filter>
 </defs>`;
 const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.setAttribute('aria-hidden','true');svg.innerHTML=defs+contact+`<g filter="${url('volume')}">${body}</g>`;return svg;
}
