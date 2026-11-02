const ns='http://www.w3.org/2000/svg';
let sequence=0;
export const LISTENING_ITEMS=Object.freeze(['wall-listening','floor-walnut','rug-woven','seat-lounge','shelf-records','table-magazines','light-reading','art-blue-note']);

// Each object has its own camera and silhouette; nothing is baked into a room image.
export function listeningItemArt(item){
 if(!LISTENING_ITEMS.includes(item.id))return null;
 const id='listening-'+(++sequence),url=name=>`url(#${id}-${name})`;
 const wood=url('walnut'),woodTop=url('walnut-top'),woodSide='#513b2b',cloth=url('charcoal'),metal=url('metal');
 let width=100,height=100,body='',contact='';
 const shadow=(x,y,rx,ry)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#26271f" opacity=".2" filter="${url('contact')}"/>`;

 if(item.id==='shelf-records'){
  width=160;contact=shadow(82,97,68,2.7);
  body=`
   <path d="M17 85L14 96M135 86L138 96M148 78L151 89" stroke="#45382b" stroke-width="4" stroke-linecap="round"/>
   <path d="M8 50H142V89H8Z" fill="${wood}"/><path d="M142 50L155 42V81L142 89Z" fill="${woodSide}"/>
   <path d="M8 50L21 42H155L142 50Z" fill="${woodTop}"/><path d="M8 50H142" stroke="#bd9469" stroke-width="1"/>
   <path d="M15 56H89V83H15Z" fill="#3a3027"/><path d="M15 56H89V59H15Z" fill="#231f1a" opacity=".5"/>
   <g stroke="#b2a593" stroke-width=".5"><path d="M20 61L25 60L29 82H24Z" fill="#5c6e66"/><path d="M27 59L32 58L36 82H31Z" fill="#baa98d"/><path d="M34 60L38 59L42 82H38Z" fill="#806e64"/><path d="M40 60L45 59L49 82H44Z" fill="#d6cbbb"/><path d="M47 61L51 60L55 82H51Z" fill="#a4a293"/></g>
   <path d="M60 61H83V82H60Z" fill="#3d5f9a"/><path d="M63 64H80V79H63Z" fill="#ded5ba"/><circle cx="71.5" cy="71.5" r="6.7" fill="#2c3030"/><circle cx="71.5" cy="71.5" r="1.8" fill="#9d6953"/>
   <path d="M94 56H136V83H94Z" fill="${wood}"/><path d="M97 60Q113 56 133 60M97 65Q116 61 133 65M97 75Q113 70 133 75M97 79Q116 75 133 79" fill="none" stroke="#bc9164" stroke-opacity=".2" stroke-width=".55"/>
   <rect x="98" y="65" width="2" height="11" rx="1" fill="#bfa77c"/><path d="M14 85H137" stroke="#c39b70" stroke-opacity=".45" stroke-width=".7"/>
   <path d="M17 20H36V43H17Z" fill="#353938"/><path d="M36 20L41 17V40L36 43Z" fill="#252a29"/><path d="M17 20L22 17H41L36 20Z" fill="#5c6159"/><rect x="20" y="23" width="13" height="17" rx="1" fill="${url('speaker')}"/><circle cx="26.5" cy="34" r="5" fill="#252b28"/><circle cx="26.5" cy="34" r="3.1" fill="#424940"/><circle cx="26.5" cy="25.6" r="1.5" fill="#1b2420"/>
   <path d="M122 18H143V42H122Z" fill="#353938"/><path d="M143 18L148 15V39L143 42Z" fill="#252a29"/><path d="M122 18L127 15H148L143 18Z" fill="#5c6159"/><rect x="125" y="21" width="15" height="18" rx="1" fill="${url('speaker')}"/><circle cx="132.5" cy="33" r="5.5" fill="#252b28"/><circle cx="132.5" cy="33" r="3.5" fill="#424940"/><circle cx="132.5" cy="23.5" r="1.7" fill="#1b2420"/>
   <path d="M49 38L58 30H108L99 38Z" fill="#42433b"/><path d="M49 38H99V43H49Z" fill="#624b36"/><path d="M99 38L108 30V35L99 43Z" fill="#392f25"/>
   <path d="M58 30V13H109V30Z" fill="#a8b0a1" fill-opacity=".18" stroke="#b5b5a3" stroke-width=".65"/><path d="M61 15H105M61 17V26" stroke="#f4edda" stroke-opacity=".55" stroke-width=".7"/>
   <ellipse cx="74" cy="34" rx="17.5" ry="5.3" fill="#1f2827"/><g fill="none" stroke="#69706a" stroke-width=".35"><ellipse cx="74" cy="34" rx="14.5" ry="4.2"/><ellipse cx="74" cy="34" rx="11.6" ry="3.3"/><ellipse cx="74" cy="34" rx="8.9" ry="2.5"/></g><ellipse cx="74" cy="34" rx="4.8" ry="1.4" fill="#c0a06f"/><circle cx="74" cy="33.7" r=".6" fill="#e6e2cf"/>
   <path d="M102 32H97L92 36L84 35" stroke="#b5baac" stroke-width="1" fill="none" stroke-linejoin="round"/><path d="M83 34.5L86 35.3" stroke="#e0d4a9" stroke-width="1.4"/><circle cx="102" cy="32" r="1.1" fill="#ddd1b4"/><circle cx="96" cy="40" r=".7" fill="#d2ae6a"/>
  `;
 }
 if(item.id==='seat-lounge'){
  width=120;height=120;contact=shadow(61,115,47,3.2);
  body=`
   <path d="M25 68L14 112M87 62L105 111M27 94L86 92M82 43L92 103" fill="none" stroke="#4e3828" stroke-width="6" stroke-linecap="round"/>
   <path d="M28 69L17 110M88 65L102 109" stroke="#aa845b" stroke-width="1.7" fill="none"/>
   <path d="M21 22L88 18L101 66L35 72Z" fill="#333a3b"/>
   <path d="M21 22Q22 17 29 17L85 13Q90 13 92 19L103 59Q104 64 98 66L40 71Q34 71 32 66Z" fill="${cloth}"/>
   <path d="M30 24L84 20Q87 20 88 24L96 57Q97 61 92 61L42 65Q38 65 37 61Z" fill="#4c5352"/>
   <path d="M31 25L39 60M42 65L92 61" stroke="#8b8d80" stroke-opacity=".4" stroke-width=".65" fill="none"/>
   <path d="M32 73L96 65L104 81L39 94L23 82Z" fill="#252e2f"/>
   <path d="M27 72L88 65Q94 64 98 69L106 79Q109 85 101 87L43 97Q36 98 31 92L20 80Q17 74 27 72Z" fill="${cloth}"/>
   <path d="M23 77L37 90Q41 93 46 92L100 82" fill="none" stroke="#8b8f81" stroke-opacity=".52" stroke-width=".7"/>
   <path d="M15 59L38 82M85 52L111 72" stroke="#57402d" stroke-width="6.3" stroke-linecap="round"/>
   <path d="M14 56L35 76Q38 79 40 76L41 73L21 53Q17 49 14 53Z" fill="${woodTop}"/>
   <path d="M84 49L109 66Q114 69 113 73L110 75L82 56Q78 52 81 50Z" fill="${woodTop}"/>
   <path d="M17 54L37 74M85 51L110 69" stroke="#c8a57c" stroke-width=".8" fill="none"/>
   <path d="M49 39L72 37L77 58L54 61Z" fill="#b6aa8b"/><path d="M52 42L70 40L73 56L56 58Z" fill="#c9bea2"/><path d="M54 43L57 55M58 42L61 55M63 42L66 54" stroke="#968b72" stroke-width=".6"/>
   <path d="M28 24L85 20L97 59L40 65Z" fill="${url('cloth')}" opacity=".1"/>
   <path d="M24 77L39 91L100 82L92 69Z" fill="${url('cloth')}" opacity=".1"/>
  `;
 }
 if(item.id==='table-magazines'){
  width=140;height=110;contact=shadow(72,104,52,3);
  body=`
   <path d="M24 53L18 100M107 47L118 99M72 62L74 102" stroke="#333b39" stroke-width="3.4" stroke-linecap="round"/>
   <path d="M24 55L20 96M107 50L115 96" stroke="#9a9c89" stroke-width=".65"/>
   <path d="M27 79L95 74L107 85L38 92Z" fill="#414a46"/><path d="M38 92V94L107 87V85" fill="#293430"/>
   <path d="M9 46Q13 35 27 33L102 29Q118 29 126 39L132 47L130 54Q124 60 109 62L33 68Q17 68 10 59Z" fill="#4e3829"/>
   <path d="M9 46Q11 36 27 34L102 29Q118 29 125 39L131 47Q135 55 112 58L33 64Q14 65 9 53Z" fill="${woodTop}"/>
   <path d="M17 48Q49 36 118 43M23 54Q60 42 124 48" stroke="#c09b70" stroke-opacity=".27" stroke-width=".7" fill="none"/>
   <path d="M47 37L79 32L99 44L67 51Z" fill="#9b9c8f"/><path d="M47 38V41L67 55L99 47V44L67 51Z" fill="#ddd7c4"/><path d="M47 38L67 51L99 44" fill="none" stroke="#f3ebd8" stroke-width=".6"/>
   <path d="M50 34L79 29L97 40L68 47Z" fill="#d5c8ad"/><path d="M50 34V37L68 50L97 43V40L68 47Z" fill="#f0eadb"/>
   <path d="M57 35L73 32L85 39L68 42Z" fill="#375b8b"/><path d="M59 37L67 35M69 43L85 40" stroke="#b2b7aa" stroke-width=".5"/>
   <ellipse cx="33" cy="46" rx="12" ry="3.8" fill="#d0c6b0"/>
   <path d="M25 31H40V42Q33 49 25 42Z" fill="${url('ceramic')}"/><ellipse cx="32.5" cy="31" rx="7.5" ry="2.6" fill="#b2a58d"/><ellipse cx="32.5" cy="31.4" rx="5.8" ry="1.8" fill="#62503c"/>
   <path d="M40 33Q48 30 46 37Q45 42 40 41" stroke="#d2c9b6" fill="none" stroke-width="2"/>
   <path d="M47 81L78 77L93 84L62 89Z" fill="#ad9c80"/><path d="M47 82L62 91L93 86V84L62 89Z" fill="#d9d0bc"/><path d="M53 82L71 80" stroke="#ede5d0" stroke-width="1"/>
  `;
 }
 if(item.id==='light-reading'){
  height=140;contact=shadow(51,134,28,3);
  body=`
   <ellipse cx="51" cy="132" rx="25" ry="5" fill="#3a4039"/><ellipse cx="51" cy="130" rx="25" ry="4.2" fill="${metal}"/>
   <path d="M49 128V58Q49 42 61 34" stroke="#766b50" stroke-width="3" fill="none"/><path d="M48 126V57Q48 42 59 35" stroke="#d0bd8d" stroke-width=".9" fill="none"/>
   <path d="M57 28L63 20L75 30L70 36Z" fill="#76705a"/>
   <path d="M44 17Q53 7 63 15L83 32Q89 37 82 44L74 50L41 27Q37 24 44 17Z" fill="${metal}"/>
   <path d="M44 18Q49 13 54 15L75 31" stroke="#ead6a0" stroke-width="1.4" fill="none"/>
   <ellipse cx="65" cy="40" rx="24" ry="7.5" transform="rotate(34 65 40)" fill="#615d4e"/>
   <ellipse cx="65" cy="40" rx="19.7" ry="5.5" transform="rotate(34 65 40)" fill="#f3e7bc"/><ellipse cx="65" cy="40" rx="9" ry="3.8" transform="rotate(34 65 40)" fill="#fff4d8"/>
   <circle cx="54" cy="47" r="3.1" fill="#4b5044"/><circle cx="54" cy="47" r="1.4" fill="#bcab7c"/>
   <path d="M54 131Q75 132 83 138" stroke="#45473c" stroke-width=".9" fill="none"/>
  `;
 }
 if(item.id==='art-blue-note'){
  height=125;
  body=`
   <path d="M11 8H91V119H11Z" fill="#202c2d"/><path d="M8 6H88V116H8Z" fill="#3e4844"/><path d="M11 9H85V113H11Z" fill="#dbd8c7"/><path d="M17 15H79V107H17Z" fill="#274fb4"/>
   <text x="23" y="28" font-family="Arial,sans-serif" font-size="8.4" font-weight="700" letter-spacing=".65" fill="#eee6cf">AFTER</text><text x="23" y="37" font-family="Arial,sans-serif" font-size="8.4" font-weight="700" letter-spacing=".65" fill="#eee6cf">HOURS</text>
   <circle cx="47" cy="65" r="22" fill="#ded4b5"/><g fill="none" stroke="#acb5bb" stroke-width=".65"><circle cx="47" cy="65" r="18.2"/><circle cx="47" cy="65" r="15.3"/><circle cx="47" cy="65" r="12.4"/></g><circle cx="47" cy="65" r="6.3" fill="#c28e53"/><circle cx="47" cy="65" r="1.5" fill="#324d82"/>
   <path d="M72 43L67 53L59 59" fill="none" stroke="#e5e3d3" stroke-width="1.6"/><path d="M57 59L61 61" stroke="#e5e3d3" stroke-width="2.6"/><path d="M23 91H72" stroke="#91a5ca" stroke-width=".65"/>
   <text x="23" y="98" font-family="Arial,sans-serif" font-size="3.1" letter-spacing=".45" fill="#d4d9dc">LISTEN SLOWLY</text><text x="64" y="103" font-family="Arial,sans-serif" font-size="3" fill="#b2c0d9">33 RPM</text>
   <path d="M10 7H86M9 8V113" stroke="#767e70" stroke-width=".65"/><path d="M12 11H83V111H12Z" fill="none" stroke="#b8bdab" stroke-opacity=".3" stroke-width=".5"/>
  `;
 }
 if(item.id==='rug-woven'){
  width=160;
  body=`<path d="M19 12H141L154 91H6Z" fill="#8e8068"/><path d="M19 10H141L154 88H6Z" fill="${url('rug')}"/>
   <path d="M25 16H135L146 82H14Z" fill="none" stroke="#897c66" stroke-width="1.7"/><path d="M29 20H131L141 78H19Z" fill="none" stroke="#e1d6bd" stroke-width="1"/>
   <path d="M40 23L34 75M44 23L39 75M115 23L121 75M119 23L126 75" stroke="#6a7062" stroke-opacity=".55" stroke-width="1.2"/>
   <path d="M19 11H141L153 87H7Z" fill="${url('cloth')}" opacity=".26"/>
   <g stroke="#c4b69b" stroke-width=".7">${Array.from({length:24},(_,i)=>`<path d="M${10+i*6} 89L${9.5+i*6.04} 95M${20+i*5.2} 4L${19.5+i*5.25} 9"/>`).join('')}</g>`;
 }
 if(item.id==='wall-listening')body=`<path d="M7 6H93V94H7Z" fill="#d8d2c6"/><path d="M7 73H93V94H7Z" fill="#b4aa94"/><path d="M17 18H79V65H17Z" fill="#635846"/><path d="M20 21H76V62H20Z" fill="#bcb6a0"/><path d="M20 23H76M20 28H76M20 33H76M20 38H76M20 43H76" stroke="#e4d8bb" stroke-width="3"/><path d="M48 22V62" stroke="#645f50" stroke-width="1.3"/><path d="M15 65H81" stroke="#8a785b" stroke-width="3"/>`;
 if(item.id==='floor-walnut')body=`<path d="M8 26L78 8L95 75L24 94Z" fill="${wood}"/><path d="M24 23L43 88M42 18L61 83M60 13L79 79M13 47L32 42M47 45L66 40M21 79L40 74M59 75L89 67" stroke="#3d3026" stroke-opacity=".65" stroke-width=".8"/><path d="M17 35Q21 44 23 58M34 27Q42 43 45 71M53 27Q59 41 62 61M74 38L81 67" fill="none" stroke="#c39b70" stroke-opacity=".38" stroke-width=".6"/>`;

 const defs=`<defs>
  <linearGradient id="${id}-walnut" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#a27a50"/><stop offset=".45" stop-color="#79543e"/><stop offset="1" stop-color="#5b402e"/></linearGradient>
  <linearGradient id="${id}-walnut-top" x1="0" y1="0" x2=".9" y2="1"><stop stop-color="#b2926a"/><stop offset=".55" stop-color="#95704d"/><stop offset="1" stop-color="#755338"/></linearGradient>
  <linearGradient id="${id}-charcoal" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#5d6561"/><stop offset=".45" stop-color="#444c49"/><stop offset="1" stop-color="#303939"/></linearGradient>
  <linearGradient id="${id}-metal" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#e2cca0"/><stop offset=".24" stop-color="#c2a579"/><stop offset=".7" stop-color="#98805a"/><stop offset="1" stop-color="#756448"/></linearGradient>
  <linearGradient id="${id}-ceramic"><stop stop-color="#d5ccba"/><stop offset=".3" stop-color="#ede7d7"/><stop offset="1" stop-color="#b0a38b"/></linearGradient>
  <linearGradient id="${id}-rug" x1="0" y1="0" x2=".35" y2="1"><stop stop-color="#d4cbb8"/><stop offset="1" stop-color="#b3a78f"/></linearGradient>
  <pattern id="${id}-cloth" width="1.2" height="1.2" patternUnits="userSpaceOnUse"><path d="M0 .3H1.2M.3 0V1.2" stroke="#f4ecd7" stroke-width=".19"/><path d="M.8 .6V1.1" stroke="#333c32" stroke-width=".13"/></pattern>
  <pattern id="${id}-speaker" width=".8" height=".8" patternUnits="userSpaceOnUse"><rect width=".8" height=".8" fill="#464a43"/><path d="M0 .2H.8M.2 0V.8" stroke="#c5c1a7" stroke-opacity=".22" stroke-width=".12"/></pattern>
  <filter id="${id}-contact" x="-25%" y="-100%" width="150%" height="300%"><feGaussianBlur stdDeviation="1.1"/></filter>
  <filter id="${id}-volume" x="-15%" y="-15%" width="135%" height="140%"><feDropShadow dx=".6" dy="1" stdDeviation=".65" flood-color="#262c22" flood-opacity=".18"/></filter>
 </defs>`;
 const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.setAttribute('aria-hidden','true');svg.innerHTML=defs+contact+`<g filter="${url('volume')}">${body}</g>`;return svg;
}
