const ns='http://www.w3.org/2000/svg';
let sequence=0;
export const DAYLIGHT_ITEMS=Object.freeze(['wall-butter','floor-oak','rug-cookie','seat-toast','plant-daisy','light-mushroom','art-bunting','table-tea','shelf-coffee','wall-peach','floor-rose','rug-petal','seat-bunny','plant-tulip','light-tulip','art-letter','shelf-florist','table-florist']);

// Two independently furnished rooms. Every object stays movable and owns its SVG definitions.
export function daylightItemArt(item){
 if(!DAYLIGHT_ITEMS.includes(item?.id))return null;
 const id='daylight-'+(++sequence),url=name=>`url(#${id}-${name})`;
 const oak=url('oak'),maple=url('maple'),oakTop=url('oak-top'),linen=url('linen'),berry=url('berry'),ceramic=url('ceramic'),glass=url('glass'),metal=url('metal');
 let width=100,height=100,body='',contact='';
 const shadow=(x,y,rx,ry,opacity=.16)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#403c34" opacity="${opacity}" filter="${url('contact')}"/>`;
 const grain=(d,color='#855f3e')=>`<path d="${d}" fill="none" stroke="${color}" stroke-opacity=".20" stroke-width=".65"/>`;
 if(item.id==='seat-toast'){
  width=125;height=125;contact=shadow(66,119,46,3);
  body=`
   <path d="M34 72L23 115Q22 119 27 119H38M89 61L106 111Q108 117 102 117H91" fill="none" stroke="#94704d" stroke-width="7" stroke-linecap="round"/>
   <path d="M38 72L28 112M91 64L103 110" stroke="#cbae82" stroke-width="2" fill="none"/>
   <path d="M27 22Q27 15 35 15L87 12Q94 12 97 21L107 61L45 74L31 56Z" fill="#a9865e"/>
   <path d="M31 23Q30 18 37 18L85 15Q90 15 92 21L104 57Q106 62 99 65L49 73Q42 73 40 66Z" fill="${linen}"/>
   <path d="M37 24L44 62Q45 68 51 68L98 61M38 22L85 19" fill="none" stroke="#f6efdc" stroke-width="1.05"/>
   <path d="M36 25L47 66L99 60L87 20Z" fill="${url('weave')}" opacity=".19"/>
   <path d="M26 77L89 66Q96 65 101 71L111 84L43 102L23 88Z" fill="#8a6949"/>
   <path d="M29 73L87 64Q94 63 100 69L112 82Q114 87 107 90L48 103Q41 104 36 100L22 86Q17 78 29 73Z" fill="${linen}"/>
   <path d="M25 80L41 95Q44 98 49 97L106 85" fill="none" stroke="#f4edda" stroke-width=".9"/>
   <path d="M26 80L43 97L106 85L92 69Z" fill="${url('weave')}" opacity=".21"/>
   <path d="M18 49Q13 49 15 56L25 81Q29 90 39 92M87 43Q91 40 97 47L116 72Q120 78 114 80L100 83" stroke="#92704d" stroke-width="6.7" fill="none" stroke-linecap="round"/>
   <path d="M18 49Q16 49 18 55L28 79Q31 85 38 87M89 43Q92 42 97 49L114 72Q117 76 113 77L101 80" stroke="${oakTop}" stroke-width="4.4" fill="none" stroke-linecap="round"/>
   <path d="M31 98L35 116M96 94L95 116" stroke="#a3835d" stroke-width="5" stroke-linecap="round"/>
   <path d="M56 40L75 36Q78 35 80 39L87 57Q88 60 84 61L64 66Q61 67 60 63L53 44Q52 41 56 40Z" fill="#899384"/>
   <path d="M58 42L74 39L82 57L65 62Z" fill="#a2aa98"/><path d="M60 43L66 60M64 42L70 59M68 41L74 58" stroke="#d9d9bc" stroke-opacity=".55" stroke-width=".6"/>
  `;
 }
 if(item.id==='shelf-coffee'){
  width=170;height=108;contact=shadow(87,103,72,2.8);
  body=`
   <path d="M21 90L19 102M145 90L147 102M159 83L161 95" stroke="#907453" stroke-width="4.5" stroke-linecap="round"/>
   <path d="M8 51H151V94H8Z" fill="${oak}"/><path d="M151 51L164 43V86L151 94Z" fill="#997951"/>
   <path d="M6 50L19 42H166L153 51H6Z" fill="${oakTop}"/><path d="M6 50H153V54H6Z" fill="#b79a72"/>
   <path d="M15 58H62V88H15Z" fill="#b69973"/><path d="M66 58H113V88H66Z" fill="#c2a780"/>
   <g fill="none" stroke="#8f7551" stroke-width=".65" opacity=".42"><path d="M20 60V86M24 60V86M28 60V86M32 60V86M36 60V86M40 60V86M44 60V86M48 60V86M52 60V86M56 60V86"/><path d="M72 61Q88 57 106 62M72 67Q90 62 107 68M72 78Q90 73 107 79M72 84Q90 78 107 84"/></g>
   <path d="M59 67V79M69 67V79" stroke="#786348" stroke-width="1.6" stroke-linecap="round"/>
   <path d="M118 58H145V88H118Z" fill="#665944"/><path d="M119 72H145" stroke="#bda780" stroke-width="2"/>
   <g fill="#e6e1d1"><path d="M123 62H131V69H123Z"/><path d="M134 62H142V69H134Z"/><path d="M123 77H141V84H123Z"/></g><path d="M123 85H141M122 87H142" stroke="#c6c2af" stroke-width="1"/>
   <path d="M21 41H50V46H21Z" fill="#615f52"/><path d="M26 24H46V41H26Z" fill="#454e49"/><path d="M28 27H43V39H28Z" fill="#626b5e"/>
   <path d="M29 11H43L41 25H31Z" fill="#8b9382" fill-opacity=".6" stroke="#687365" stroke-width=".7"/><ellipse cx="36" cy="11" rx="7" ry="2.3" fill="#536052"/>
   <path d="M31 20H41L40 25H32Z" fill="#64503a"/><path d="M40 30H50" stroke="#333c37" stroke-width="2.5"/><circle cx="49" cy="30" r="2.5" fill="#36443a"/>
   <path d="M30 35H40V40H30Z" fill="#ddd6c3"/><ellipse cx="35" cy="35" rx="5" ry="1.6" fill="#777769"/>
   <path d="M62 25H79V42H62Z" fill="#b5b7a3" fill-opacity=".42" stroke="#89957f" stroke-width=".7"/><ellipse cx="70.5" cy="25" rx="8.5" ry="2.2" fill="#bcb49a"/><ellipse cx="70.5" cy="42" rx="8.5" ry="2.2" fill="#9a9276"/>
   <path d="M63 31H78V41H63Z" fill="#837256" opacity=".62"/><path d="M64 26V39" stroke="#f1eee1" stroke-width="1.1" opacity=".7"/><rect x="65" y="31" width="11" height="5" fill="#e5dfcb"/><path d="M67 33H74" stroke="#847c65" stroke-width=".7"/>
   <path d="M99 28Q92 29 92 35Q92 43 106 43Q117 43 117 36L114 27Z" fill="${ceramic}"/><ellipse cx="105" cy="27" rx="9" ry="2.6" fill="#d9d4c2"/>
   <path d="M103 23H109V25H103Z" fill="#a79e86"/><ellipse cx="106" cy="26" rx="9" ry="2" fill="#e9e2cc"/>
   <path d="M114 30Q124 29 123 35Q122 40 116 39" stroke="#c3bba6" stroke-width="3" fill="none"/><path d="M93 31Q85 31 84 24L81 25Q82 36 94 37" fill="#d9d3bd"/>
   <path d="M132 24V41" stroke="#5d7054" stroke-width="1.1"/><path d="M132 32Q123 22 126 20Q134 22 132 32M132 29Q139 18 143 22Q140 29 132 29" fill="#7b896b"/>
   <path d="M126 35H139L137 45H128Z" fill="#a98b6d"/><ellipse cx="132.5" cy="35" rx="6.5" ry="1.8" fill="#7d6d50"/>
  `;
 }
 if(item.id==='table-tea'){
  width=130;height=122;contact=shadow(66,116,41,3.1);
  body=`
   <ellipse cx="65" cy="111" rx="32" ry="7" fill="#8d6b48"/><ellipse cx="65" cy="108" rx="32" ry="7" fill="${oakTop}"/>
   <path d="M57 52H73L77 108Q65 113 53 108Z" fill="${oak}"/><path d="M59 60L57 105" stroke="#e5c69b" stroke-opacity=".6" stroke-width="1.3"/>
   <path d="M9 49Q9 33 65 33Q120 33 121 49V55Q121 72 65 72Q9 72 9 55Z" fill="#ae8b61"/>
   <ellipse cx="65" cy="49" rx="56" ry="19" fill="${oakTop}"/><ellipse cx="65" cy="49" rx="52" ry="16.6" fill="none" stroke="#ecce9f" stroke-width=".8"/>
   ${grain('M15 49Q44 34 108 43M20 55Q61 43 113 51M37 62Q62 52 98 57')}
   <ellipse cx="76" cy="49" rx="21" ry="6" fill="#b8a482" opacity=".4"/><ellipse cx="76" cy="46" rx="20" ry="5.5" fill="#e0d8c2"/>
   <path d="M64 28H85L81 44Q75 47 69 44Z" fill="${ceramic}"/><ellipse cx="74.5" cy="28" rx="10.5" ry="3" fill="#eee8d8"/><ellipse cx="74.5" cy="28" rx="7.5" ry="1.9" fill="#958b75"/>
   <path d="M65 15L74 33L83 15Z" fill="#d7e0d4"/><ellipse cx="74" cy="15" rx="9" ry="3.1" fill="#9eada0"/><ellipse cx="74" cy="15" rx="6.7" ry="2" fill="#675b42"/>
   <path d="M68 20L72 29M74 21V30M79 20L76 29" stroke="#afbeb0" stroke-width=".7"/><path d="M84 33Q93 32 92 38Q91 42 83 41" stroke="#d8d1bf" stroke-width="2.4" fill="none"/>
   <ellipse cx="35" cy="49" rx="13" ry="3.3" fill="#e2d9c4"/><path d="M27 35H43V44Q42 49 35 49Q28 49 27 44Z" fill="${ceramic}"/><ellipse cx="35" cy="35" rx="8" ry="2.5" fill="#bdb5a0"/><ellipse cx="35" cy="35" rx="6.2" ry="1.6" fill="#705b43"/>
   <path d="M43 37Q50 36 49 41Q48 45 43 44" stroke="#ded6c0" stroke-width="2.2" fill="none"/>
   <path d="M88 56L101 52L111 57L98 61Z" fill="#dce0cc"/><path d="M91 56L99 54M95 58L103 56" stroke="#a2aa8e" stroke-width=".7"/>
  `;
 }
 if(item.id==='plant-daisy'){
  width=95;height=125;contact=shadow(50,117,20,2.5);
  body=`<path d="M46 79Q46 49 34 26M49 81Q66 48 66 15M51 81Q63 58 78 44M48 80Q36 61 23 52" fill="none" stroke="#657b54" stroke-width="1.3"/>
   <path d="M42 53Q25 48 24 39Q38 40 42 53M49 63Q63 48 69 50Q66 63 49 66M61 39Q49 27 51 22Q63 25 61 39M66 59Q80 51 84 55Q79 65 66 63M37 66Q27 65 23 59Q35 57 37 66" fill="#849471"/>
   <g fill="#eee9d7"><ellipse cx="33" cy="24" rx="10" ry="4.5" transform="rotate(20 33 24)"/><ellipse cx="34" cy="24" rx="4.5" ry="10" transform="rotate(20 34 24)"/><ellipse cx="34" cy="24" rx="9" ry="4.3" transform="rotate(-32 34 24)"/></g><circle cx="34" cy="24" r="3.2" fill="#bfa15d"/>
   <g fill="#f4eddb"><ellipse cx="66" cy="14" rx="8.5" ry="4"/><ellipse cx="66" cy="14" rx="4" ry="8.5" transform="rotate(20 66 14)"/><ellipse cx="66" cy="14" rx="8.5" ry="4" transform="rotate(45 66 14)"/></g><circle cx="66" cy="14" r="2.8" fill="#c8ad66"/>
   <g fill="#ddd9c5"><ellipse cx="78" cy="43" rx="7" ry="3"/><ellipse cx="78" cy="43" rx="3" ry="7" transform="rotate(-15 78 43)"/></g><circle cx="78" cy="43" r="2.4" fill="#baa369"/>
   <path d="M39 73H57L59 86Q66 90 66 102Q65 117 49 118Q31 117 32 103Q32 91 38 86Z" fill="${ceramic}"/><ellipse cx="48" cy="73" rx="9" ry="3" fill="#d3c9ae"/><ellipse cx="48" cy="73" rx="6" ry="1.8" fill="#88806b"/>
   <path d="M59 87Q77 83 75 99Q74 112 64 110" stroke="#c9c0a8" stroke-width="5" fill="none"/><path d="M60 88Q72 87 71 98Q70 107 65 106" stroke="#e9e1cc" stroke-width="1.5" fill="none"/>
   <path d="M38 97Q35 106 41 112" stroke="#fff9e8" stroke-width="1.6" fill="none" opacity=".65"/><path d="M37 112Q48 116 60 112" stroke="#c8bea5" stroke-width=".8" fill="none"/>`;
 }
 if(item.id==='light-mushroom'){
  width=90;height=150;contact=shadow(47,144,27,2.5);
  body=`<path d="M43 107L30 143M47 107L65 142M46 111V145" fill="none" stroke="#75654d" stroke-width="2.3" stroke-linecap="round"/>
   <path d="M46 21V117" stroke="#ae9d7b" stroke-width="1.3"/>
   <path d="M43 15Q56 13 66 27Q77 43 75 65Q73 97 62 109Q56 117 43 116Q27 115 20 102Q10 86 12 59Q14 32 27 20Q34 14 43 15Z" fill="${url('paper')}" stroke="#b9ad91" stroke-width=".7"/>
   <g fill="none" stroke="#9e947a" stroke-width=".48" opacity=".55"><path d="M26 23Q44 28 64 24M20 32Q43 38 70 33M16 42Q43 48 73 43M13 52Q44 59 75 53M12 63Q43 70 75 64M13 74Q44 81 73 75M16 85Q44 92 71 86M20 95Q44 102 67 96M26 105Q44 111 61 106"/></g>
   <path d="M40 17Q27 58 35 110M52 17Q61 58 55 111" stroke="#fffbed" stroke-width=".7" fill="none" opacity=".6"/><path d="M43 16Q36 60 43 115" stroke="#c5b898" stroke-width=".45" fill="none" opacity=".55"/>
   <path d="M42 15H49M41 116H49" stroke="#aa9573" stroke-width="1.7"/><path d="M49 119Q70 124 76 140" stroke="#8a7b63" stroke-width=".7" fill="none"/>`;
 }
 if(item.id==='art-bunting'){
  width=145;height=100;
  body=`<path d="M12 17H135" stroke="#836f53" stroke-width="2" stroke-linecap="round"/>
   <path d="M18 19H51V79L35 87L18 79Z" fill="#dfd5bc"/><path d="M55 19H88V87H55Z" fill="#a8b09a"/><path d="M92 19H125V79L109 87L92 79Z" fill="#c6b896"/>
   <path d="M18 19H51V79L35 87L18 79ZM55 19H88V87H55ZM92 19H125V79L109 87L92 79Z" fill="${url('weave')}" opacity=".22"/>
   <path d="M21 54Q35 30 48 54V70H21Z" fill="#aa9d7f"/><path d="M26 54Q35 38 43 54V65H26Z" fill="#eee6d1"/>
   <circle cx="71.5" cy="45" r="11" fill="#e8dfc6"/><path d="M58 63H85M58 68H85M58 73H85" stroke="#637c67" stroke-width="2.1"/>
   <path d="M97 38L120 62M97 49L116 69M101 32L121 53" stroke="#f1e7ce" stroke-width="4"/>
   <g stroke="#b7aa8d" stroke-width=".7"><path d="M20 80V87M25 83V90M30 85V92M35 87V94M40 85V92M45 82V89M49 80V87M57 87V94M62 87V94M67 87V94M72 87V94M77 87V94M82 87V94M87 87V94M94 80V87M99 83V90M104 85V92M109 87V94M114 85V92M119 82V89M123 80V87"/></g>`;
 }
 if(item.id==='rug-cookie'){
  width=170;height=100;
  body=`<ellipse cx="85" cy="54" rx="80" ry="37" fill="#b9ae8d"/><ellipse cx="85" cy="52" rx="80" ry="37" fill="#d8cfb7"/><ellipse cx="85" cy="52" rx="74" ry="32.5" fill="none" stroke="#a89c7d" stroke-width="1.1"/><ellipse cx="85" cy="52" rx="69" ry="29.5" fill="none" stroke="#e9e1cd" stroke-width="1.2"/><ellipse cx="85" cy="52" rx="63" ry="26" fill="none" stroke="#c0b596" stroke-width=".7"/><ellipse cx="85" cy="52" rx="79" ry="36.5" fill="${url('rug-weave')}" opacity=".47"/>`;
 }
 if(item.id==='seat-bunny'){
  width=170;height=120;contact=shadow(86,114,73,3.3);
  body=`
   <path d="M26 96L24 112M142 96L145 112M154 88L157 101" stroke="#655044" stroke-width="5" stroke-linecap="round"/>
   <path d="M16 34Q16 24 28 22L135 16Q146 15 150 27L159 71L31 92L17 64Z" fill="#633d46"/>
   <path d="M22 31Q22 24 31 23L133 18Q143 18 144 26L152 63L33 77Z" fill="${berry}"/>
   <path d="M28 31Q27 27 33 27L78 24Q83 24 84 30L88 64L38 73Z" fill="#956773"/><path d="M85 29Q84 24 90 23L132 21Q138 21 139 28L146 61L92 69Z" fill="#8a5967"/>
   <path d="M33 30L77 27M90 27L132 24" stroke="#bc8b94" stroke-width=".8" fill="none"/>
   <path d="M26 76L139 63L157 77L42 98L21 85Z" fill="#593740"/><path d="M24 77L151 65V96L31 111L18 99Z" fill="${berry}"/>
   <path d="M26 74L80 68Q84 67 88 72L96 84L40 95L23 84Q18 77 26 74Z" fill="#a06d79"/><path d="M85 68L137 62Q143 61 146 67L155 78Q157 82 150 84L98 93L90 81Z" fill="#95606f"/>
   <path d="M27 80L41 90L87 82M93 74L101 86L148 78" stroke="#bf8d96" stroke-width=".75" fill="none"/>
   <path d="M11 57Q12 49 20 49L29 54Q34 57 35 65L42 91Q43 102 35 105L23 106Q15 104 14 96Z" fill="${berry}"/>
   <path d="M13 58Q13 53 19 53L25 57Q30 60 31 66L38 92Q39 99 33 101L23 102Q18 100 18 94Z" fill="#a06c79"/>
   <path d="M142 48Q144 41 151 44L159 49Q164 52 165 60L166 87Q166 95 159 98L150 101Q143 101 143 93L137 59Z" fill="#72444f"/>
   <path d="M145 49Q146 45 151 48L157 52Q160 54 161 61L162 85Q162 91 157 93L149 96Q146 95 147 89L141 59Z" fill="#9c6675"/>
   <path d="M43 42L60 38Q63 37 65 41L72 61Q73 65 69 66L49 70Q45 70 45 66L40 47Q39 43 43 42Z" fill="#d1b6a7"/><path d="M44 44L59 41L67 62L49 66Z" fill="#eadac5"/>
   <path d="M49 44L54 63M55 43L60 61" stroke="#b48c83" stroke-width=".9"/>
   <path d="M30 32L38 69L81 63L78 27ZM91 29L95 64L141 58L134 24Z" fill="${url('weave')}" opacity=".13"/>
   <path d="M45 101L140 88" stroke="#613c48" stroke-opacity=".75" stroke-width=".8"/>
  `;
 }
 if(item.id==='shelf-florist'){
  width=175;height=140;contact=shadow(87,135,74,2.8);
  body=`
   <path d="M17 93L15 132M151 91L155 132M164 83L167 122" stroke="#a58a65" stroke-width="5" stroke-linecap="round"/>
   <path d="M16 118L148 118L160 111L29 111Z" fill="#b89d76"/><path d="M17 118H148V122H17Z" fill="#9f8560"/>
   <path d="M14 72H153V99H14Z" fill="${maple}"/><path d="M153 72L166 64V91L153 99Z" fill="#a78c65"/>
   <path d="M7 70L21 61H170L156 71H7Z" fill="#d9c39b"/><path d="M7 70H156V75H7Z" fill="#baa27c"/>
   <path d="M21 79H81V94H21ZM86 79H147V94H86Z" fill="#d5bb91"/><path d="M45 85H59M110 85H124" stroke="#8a785b" stroke-width="1.5" stroke-linecap="round"/>
   ${grain('M25 90Q50 86 76 90M90 90Q114 86 143 90M20 67Q78 62 151 67')}
   <path d="M35 103L55 105L58 116H34Z" fill="#899886"/><path d="M59 104L83 105V116H62Z" fill="#c6b7a0"/><path d="M90 107L123 103L126 113L95 117Z" fill="#a78b79"/><path d="M94 109L124 106M95 112L124 109" stroke="#ded2b9" stroke-width=".8"/>
   <path d="M34 48Q37 28 24 13M36 49Q46 31 45 9M40 49Q55 37 64 26" stroke="#657b5a" stroke-width="1.2" fill="none"/>
   <path d="M33 33Q20 30 19 22Q32 22 33 33M43 35Q51 23 58 26Q55 35 43 37M43 20Q34 14 37 10Q44 11 43 20" fill="#8e9d7b"/>
   <path d="M19 13Q14 7 20 5Q22 3 25 7Q29 3 32 7Q35 11 28 15Q23 18 19 13Z" fill="#b78d9a"/><path d="M40 9Q35 2 41 1Q45 1 45 5Q49 1 52 5Q54 10 47 13Z" fill="#e0c6b4"/><path d="M59 25Q55 19 61 17Q65 17 65 21Q70 17 72 22Q73 27 67 29Z" fill="#b86e80"/>
   <path d="M23 44H49L47 65Q36 70 25 65Z" fill="#a4aca1" fill-opacity=".65" stroke="#77877d" stroke-width=".6"/><ellipse cx="36" cy="44" rx="13" ry="3" fill="#82948b" fill-opacity=".65"/><path d="M26 49L28 62" stroke="#edf0df" stroke-width="1.3"/>
   <path d="M88 53L75 14M91 54L95 20M94 55L114 26M88 55L67 29M94 55L116 42" stroke="#748464" stroke-width="1.3" fill="none"/>
   <g fill="#9aa889"><path d="M80 34Q66 30 67 23Q79 26 80 34M85 46Q77 37 72 39Q73 47 85 49M93 39Q99 27 105 29Q104 37 93 41M105 42Q108 33 116 35Q116 41 105 45"/></g>
   <path d="M70 13Q66 5 73 4Q77 3 78 8Q85 4 86 10Q87 16 79 18Z" fill="#d9b6ac"/><path d="M90 19Q85 12 91 10Q95 9 98 14Q103 11 106 17Q107 23 99 25Z" fill="#b67e90"/><path d="M110 25Q105 20 110 17Q115 15 117 21Q124 18 124 24Q122 31 116 30Z" fill="#e3cfb4"/>
   <path d="M80 50H102L104 67Q90 72 78 66Z" fill="#748779" fill-opacity=".63" stroke="#62786b" stroke-width=".65"/><ellipse cx="91" cy="50" rx="11" ry="2.8" fill="#667a70" fill-opacity=".7"/><path d="M82 54L82 65" stroke="#e3e9d4" stroke-width="1"/>
   <path d="M120 58L143 53L155 62L132 67Z" fill="#d7d0b9"/><path d="M124 59L142 55L150 61L132 65Z" fill="#eee5cd"/>
   <path d="M134 59L148 64M136 63L147 58" stroke="#757c70" stroke-width="1.1"/><ellipse cx="132" cy="58" rx="3" ry="1.8" stroke="#807369" stroke-width="1" fill="none"/><ellipse cx="133" cy="64" rx="3" ry="1.8" stroke="#807369" stroke-width="1" fill="none"/>
   <path d="M113 50L118 63M117 49L121 61" stroke="#5c7360" stroke-width=".85"/><path d="M113 50Q107 46 110 43Q116 44 113 50" fill="#9aaa87"/>
  `;
 }
 if(item.id==='table-florist'){
  width=120;height=120;contact=shadow(62,113,38,2.5);
  body=`<path d="M31 59L27 108M91 56L97 108M61 67L62 113" stroke="#7a817e" stroke-width="2.6" stroke-linecap="round"/><path d="M31 60L28 106M91 59L96 106" stroke="#e8e7dc" stroke-width=".8"/>
   <ellipse cx="61" cy="94" rx="29" ry="9.5" fill="#909c90" fill-opacity=".35" stroke="#8d9690" stroke-width=".85"/>
   <ellipse cx="61" cy="59" rx="47" ry="15" fill="#596c61" fill-opacity=".55" stroke="#aeb5a8" stroke-width="1.1"/><ellipse cx="61" cy="56" rx="47" ry="15" fill="${glass}" stroke="#c7cebd" stroke-width=".8"/>
   <path d="M19 54Q37 43 72 43M21 63Q49 71 87 62" stroke="#eef1df" stroke-width=".8" fill="none" opacity=".7"/>
   <path d="M50 26H66L71 46Q71 52 60 53Q47 52 46 46Z" fill="${glass}" stroke="#8a9d8d" stroke-width=".7"/><ellipse cx="58" cy="26" rx="8" ry="2.3" fill="#788b7c" fill-opacity=".65"/><path d="M50 33L49 44Q49 48 53 49" stroke="#e5ead8" stroke-width="1.1" fill="none"/>
   <path d="M58 45Q56 25 46 11M60 43Q70 26 75 14" stroke="#697a59" stroke-width="1" fill="none"/><path d="M54 25Q44 22 42 16Q52 17 54 25M66 31Q78 25 80 30Q74 36 66 34" fill="#8a9775"/>
   <path d="M40 12Q35 5 41 3Q46 1 49 8Q55 5 56 11Q55 18 47 17Z" fill="#c0909d"/><path d="M70 14Q66 8 72 6Q76 5 78 10Q85 8 84 14Q81 20 75 19Z" fill="#ddc5ad"/>
   <path d="M78 57L92 62M81 62L92 55" stroke="${metal}" stroke-width="1.2"/><ellipse cx="76" cy="56" rx="3" ry="2" fill="none" stroke="#6e7770" stroke-width="1"/><ellipse cx="78" cy="63" rx="3" ry="2" fill="none" stroke="#6e7770" stroke-width="1"/>
   <path d="M25 54L38 50L45 55L32 59Z" fill="#ded6c1"/><path d="M28 54L36 52M31 56L39 54" stroke="#aaa18e" stroke-width=".6"/>`;
 }
 if(item.id==='plant-tulip'){
  width=100;height=140;contact=shadow(52,133,25,2.6);
  body=`<path d="M48 101Q54 64 33 23M51 102Q69 65 68 13M53 103Q65 76 84 49M45 101Q27 74 18 59" stroke="#607957" stroke-width="1.4" fill="none"/>
   <path d="M46 63Q24 58 23 40Q39 45 46 63M57 63Q73 35 79 43Q79 56 57 67M43 90Q21 88 18 74Q36 73 43 90M65 80Q87 66 90 75Q84 88 65 86" fill="#7c9274"/>
   <path d="M26 25Q16 21 20 11Q25 8 29 16Q29 5 35 7Q42 10 39 20Q47 12 49 18Q49 27 35 32Z" fill="#ad7187"/><path d="M26 18Q32 17 35 27Q38 17 42 19Q43 26 35 30" fill="#ce9ba8"/>
   <path d="M61 14Q53 9 57 3Q63 0 66 8Q67 0 73 3Q78 8 73 15Q82 11 81 18Q75 26 67 22Z" fill="#d5b4a5"/><path d="M61 10Q67 12 68 20Q71 12 75 14" fill="#ecceba"/>
   <path d="M78 50Q71 45 76 40Q81 37 85 44Q90 38 94 44Q96 51 88 56Z" fill="#b9919b"/><path d="M12 58Q7 52 12 48Q17 47 19 53Q24 48 28 54Q29 61 21 64Z" fill="#e2c8b3"/>
   <path d="M37 91H63L69 116Q70 132 50 135Q29 134 31 117Z" fill="${glass}" stroke="#7b8d80" stroke-width=".8"/><ellipse cx="50" cy="91" rx="13" ry="3.8" fill="#72877a" fill-opacity=".67"/>
   <path d="M36 116Q51 121 66 115L67 122Q67 131 50 133Q34 132 33 122Z" fill="#819d88" fill-opacity=".35"/><path d="M40 95L35 116Q34 125 40 129" stroke="#eff1dc" stroke-width="1.7" fill="none" opacity=".65"/><ellipse cx="50" cy="131" rx="14" ry="2.2" fill="#708574" fill-opacity=".35"/>`;
 }
 if(item.id==='light-tulip'){
  width=90;height=150;contact=shadow(47,144,28,2.5);
  body=`<ellipse cx="47" cy="140" rx="24" ry="5" fill="#7b6553"/><ellipse cx="47" cy="138" rx="24" ry="5" fill="${metal}"/><path d="M47 51V137" stroke="#8b7962" stroke-width="3.1"/><path d="M46 54V135" stroke="#e2ceb0" stroke-width=".9"/>
   <path d="M29 13H62L77 57Q50 68 14 58Z" fill="#d0bca5"/><path d="M29 13H62L76 55Q47 64 15 56Z" fill="${url('pleat')}"/>
   <ellipse cx="45.5" cy="56" rx="30.5" ry="6.6" fill="#c2ac91"/><ellipse cx="45.5" cy="56" rx="27" ry="4.7" fill="#f3e4c4"/><ellipse cx="45.5" cy="13" rx="16.5" ry="3.3" fill="#e5d4b8"/>
   <path d="M30 15L20 54M35 16L29 58M40 16L38 60M45 16L46 60M50 16L54 59M55 16L63 57M60 15L72 54" stroke="#ad967d" stroke-width=".65" opacity=".6"/>
   <path d="M51 63V86" stroke="#9d886a" stroke-width=".65"/><ellipse cx="51" cy="87" rx="1" ry="2" fill="#9d886a"/>`;
 }
 if(item.id==='art-letter'){
  width=105;height=140;
  body=`<path d="M12 9H94V132H12Z" fill="#6d5247"/><path d="M9 7H91V130H9Z" fill="#b39b80"/><path d="M13 11H87V126H13Z" fill="#f1ead8"/><path d="M19 17H81V119H19Z" fill="#e7e0cd"/>
   <path d="M48 101Q58 65 42 33M50 91Q64 67 71 53M51 84Q38 70 29 64" fill="none" stroke="#6c7c60" stroke-width=".85"/>
   <path d="M48 60Q32 54 32 44Q45 45 48 60M54 67Q68 47 73 55Q71 65 54 71M48 83Q33 82 29 73Q40 72 48 83" fill="#8a997b"/><path d="M43 34Q34 32 35 24Q39 20 44 26Q47 19 51 23Q55 31 47 38Z" fill="#b78a96"/><path d="M40 28Q44 29 45 35Q49 27 51 29" fill="#d8b1b7"/>
   <path d="M26 105H74M34 109H65" stroke="#9d9b83" stroke-width=".65"/><text x="49" y="115" font-family="Georgia,serif" font-size="3.2" letter-spacing=".55" text-anchor="middle" fill="#7a7d66">BOTANICAL STUDY</text><path d="M14 12H86M14 12V125" stroke="#fff7e7" stroke-width=".65"/>`;
 }
 if(item.id==='rug-petal'){
  width=170;height=100;
  body=`<path d="M9 39Q13 17 51 16Q75 12 94 22Q107 28 132 23Q159 20 164 42Q170 69 138 80Q112 92 75 84Q52 79 34 81Q6 80 5 61Q3 48 9 39Z" fill="#8f7476"/><path d="M9 36Q13 14 51 13Q75 9 94 19Q107 25 132 20Q159 17 164 39Q170 66 138 77Q112 89 75 81Q52 76 34 78Q6 77 5 58Q3 45 9 36Z" fill="#d9ceba"/><path d="M11 36Q28 20 47 24Q57 27 53 40Q47 59 65 66Q91 76 124 71Q151 67 164 49Q161 70 138 77Q112 89 75 81Q52 76 34 78Q6 77 5 58Q3 45 11 36Z" fill="#8e5c6d"/>
   <path d="M16 37Q23 23 47 21Q73 16 94 25Q112 32 133 26Q151 22 157 39" fill="none" stroke="#f0e6d1" stroke-width="1.3"/>
   <path d="M9 36Q13 14 51 13Q75 9 94 19Q107 25 132 20Q159 17 164 39Q170 66 138 77Q112 89 75 81Q52 76 34 78Q6 77 5 58Q3 45 9 36Z" fill="${url('rug-weave')}" opacity=".31"/>`;
 }
 if(item.id==='wall-butter')body=`<path d="M9 8H91V93H9Z" fill="#e5dfcd"/><path d="M18 22H80V64H18Z" fill="#b7aa8a"/><path d="M21 25H77V60H21Z" fill="#c9d8c3"/><path d="M21 43H77M49 25V60" stroke="#eee6cf" stroke-width="2"/><path d="M17 19H81V34H17Z" fill="#d9cfb5"/><path d="M17 24H81M17 29H81" stroke="#b5a88b" stroke-width=".7"/><path d="M15 65H83V68H15Z" fill="#bba47b"/><path d="M9 83H91V93H9Z" fill="#d0bea1"/>`;
 if(item.id==='wall-peach')body=`<path d="M9 8H91V93H9Z" fill="#e1d7ce"/><path d="M9 71H91V93H9Z" fill="#b8b2a1"/><path d="M21 64V32Q21 12 44 12Q67 12 67 32V64Z" fill="#727f74"/><path d="M24 61V33Q24 15 44 15Q64 15 64 33V61Z" fill="#c6d0bc"/><path d="M44 16V61M24 36H64" stroke="#ede6d4" stroke-width="1.7"/><path d="M21 64H68V68H21Z" fill="#777b68"/><path d="M16 76V92M35 76V92M54 76V92M73 76V92M89 76V92" stroke="#9a9d8a" stroke-width=".7"/>`;
 if(item.id==='floor-oak')body=`<path d="M7 29L74 10L94 73L25 93Z" fill="${oakTop}"/><path d="M25 24L44 87M43 19L61 82M61 14L79 77M14 51L33 46M49 47L68 42M23 80L42 75M59 74L87 66" stroke="#a48762" stroke-width=".8"/>${grain('M16 35L30 78M34 29L48 73M53 23L65 66M72 25L83 64','#f2d9b5')}`;
 if(item.id==='floor-rose')body=`<defs><pattern id="${id}-tiles" width="30" height="30" patternUnits="userSpaceOnUse" patternTransform="matrix(1 -.27 .32 1 -10 20)"><rect width="30" height="30" fill="#e3d8c5"/><path d="M0 0H15V15H0ZM15 15H30V30H15Z" fill="#a99b91"/><path d="M0 0H30V30H0ZM15 0V30M0 15H30" fill="none" stroke="#efe7d6" stroke-width=".45"/></pattern></defs><path d="M7 29L74 10L94 73L25 93Z" fill="${url('tiles')}"/>`;
 const defs=`<defs>
  <linearGradient id="${id}-oak" x1="0" y1="0" x2="1" y2=".8"><stop stop-color="#d0b48a"/><stop offset=".55" stop-color="#b99b70"/><stop offset="1" stop-color="#a0825a"/></linearGradient>
  <linearGradient id="${id}-oak-top" x1="0" y1="0" x2=".9" y2="1"><stop stop-color="#e0c59b"/><stop offset=".5" stop-color="#ceb087"/><stop offset="1" stop-color="#b99b70"/></linearGradient>
  <linearGradient id="${id}-maple" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="#e3ccaa"/><stop offset=".6" stop-color="#cfb58d"/><stop offset="1" stop-color="#baa078"/></linearGradient>
  <linearGradient id="${id}-linen" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#e9e1cd"/><stop offset=".5" stop-color="#d5cab0"/><stop offset="1" stop-color="#b8ab8d"/></linearGradient>
  <linearGradient id="${id}-berry" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#a97b86"/><stop offset=".45" stop-color="#885866"/><stop offset="1" stop-color="#653e4a"/></linearGradient>
  <linearGradient id="${id}-ceramic"><stop stop-color="#c9c1aa"/><stop offset=".28" stop-color="#f0ead6"/><stop offset=".7" stop-color="#e5ddc7"/><stop offset="1" stop-color="#bbb19a"/></linearGradient>
  <linearGradient id="${id}-glass"><stop stop-color="#738c7b" stop-opacity=".6"/><stop offset=".22" stop-color="#c3d2bc" stop-opacity=".42"/><stop offset=".45" stop-color="#a3b99f" stop-opacity=".22"/><stop offset=".78" stop-color="#6a826f" stop-opacity=".5"/><stop offset="1" stop-color="#617c6a" stop-opacity=".7"/></linearGradient>
  <linearGradient id="${id}-metal"><stop stop-color="#797e73"/><stop offset=".32" stop-color="#dad9c7"/><stop offset=".5" stop-color="#a4a795"/><stop offset="1" stop-color="#6e776b"/></linearGradient>
  <radialGradient id="${id}-paper" cx="36%" cy="40%" r="72%"><stop stop-color="#fff7d9"/><stop offset=".55" stop-color="#f1e4c3"/><stop offset="1" stop-color="#cbbd9d"/></radialGradient>
  <linearGradient id="${id}-pleat"><stop stop-color="#cbb89d"/><stop offset=".28" stop-color="#f1e2c5"/><stop offset=".65" stop-color="#e3d0b0"/><stop offset="1" stop-color="#c3ac91"/></linearGradient>
  <pattern id="${id}-weave" width="1.8" height="1.8" patternUnits="userSpaceOnUse"><path d="M0 .4H1.8M.4 0V1.8" stroke="#fffbee" stroke-width=".28"/><path d="M1.3 1H1.8M1 1.3V1.8" stroke="#5e5b4e" stroke-width=".22"/></pattern>
  <pattern id="${id}-rug-weave" width="2.1" height="1.8" patternUnits="userSpaceOnUse"><path d="M0 .4H2.1M0 1.4H2.1" stroke="#f8efdb" stroke-width=".28"/><path d="M.5 0V1.8M1.6 0V1.8" stroke="#655b4d" stroke-width=".16"/></pattern>
  <filter id="${id}-contact" x="-25%" y="-100%" width="150%" height="300%"><feGaussianBlur stdDeviation="1.15"/></filter>
 </defs>`;
 const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.setAttribute('aria-hidden','true');svg.innerHTML=defs+contact+body;return svg;
}
