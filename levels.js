// Kriah levels (דרגא) from the school's testing chart. Each level makes a fresh set of test words.
(function(){
const K='\u05B8',P='\u05B7',TZ='\u05B5',SG='\u05B6',CH='\u05B4',HO='\u05B9',KU='\u05BB',SH='\u05B0',DG='\u05BC',SHIN='\u05C1';
const OPEN='אבגדהוזחטיכלמנסעפצקרשת'.split('');
const NOGUT='בגדזטכלמנספצקשת'.split('');          // letters that can carry a sheva
const FINAL={'כ':'ך','מ':'ם','נ':'ן','פ':'ף','צ':'ץ'};
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
// A letter, with dagesh for בכפת at the start of a word, and the shin dot on ש.
function L(c,first){let s=c;if(c==='ש')s+=SHIN;if('בכפת'.includes(c)&&first)s+=DG;return s;}
const syl=(v,first,from=OPEN)=>L(pick(from),first)+v;
function fin(list){const c=pick(list);if(c==='כ')return 'ך'+SH;return FINAL[c]||L(c,false);}
const F_AH='בגדזח'.split(''),F_AL='בגדזחטכל'.split(''),F_ALL='בגדזחטכלמנספצקרשת'.split('');
const V3=[K,P,TZ],V4=[K,P,TZ,SG],V5=[K,P,TZ,SG,HO,CH];
const cholam=first=>Math.random()<.5?syl(HO,first):L(pick(OPEN),first)+'ו'+HO;
const shuruk=first=>Math.random()<.5?syl(KU,first):L(pick(OPEN),first)+'ו'+DG;
const chirik=first=>Math.random()<.5?syl(CH,first):syl(CH,first)+'י';

const LEVELS=[
 {n:'1',p:'',ex:'א-בּ',d:'Letters א–ת',count:16,letters:true,
  gen:()=>pick(['א','בּ','ב','ג','ד','ה','ו','ז','ח','ט','י','כּ','כ','ך','ל','מ','ם','נ','ן','ס','ע','פּ','פ','ף','צ','ץ','ק','ר','שׁ','שׂ','תּ','ת'])},
 {n:'2',p:'',ex:'אָ',d:'Letters with komatz',count:16,letters:true,gen:()=>syl(K,true)},
 {n:'3',p:'',ex:'אַ',d:'Letters with patach',count:16,letters:true,gen:()=>syl(P,true)},
 {n:'4',p:'',ex:'אַבָּא',d:'Two letters with komatz and patach',gen:()=>syl(pick([K,P]),true)+syl(pick([K,P]),false)},
 {n:'5',p:'',ex:'אֵ',d:'Letters with tzeirei',count:16,letters:true,gen:()=>syl(TZ,true)},
 {n:'6',p:'פרשת ויצא',ex:'אָב אַב אֵב',d:'Komatz, patach or tzeirei, with a letter א–ח at the end',gen:()=>syl(pick(V3),true)+fin(F_AH)},
 {n:'7',p:'פרשת וישלח',ex:'וַיֵּרָא',d:'Three letters with komatz, patach or tzeirei',gen:()=>syl(pick(V3),true)+syl(pick(V3),false)+syl(pick(V3),false)},
 {n:'8',p:'פרשת וישב',ex:'וַיָּגֶל',d:'Komatz, patach, tzeirei, segol, with a letter א–ל at the end',gen:()=>syl(pick(V4),true)+syl(pick(V4),false)+fin(F_AL)},
 {n:'9',p:'',ex:'שְׁבָא',d:'Sheva (na) at the start of the word',gen:()=>L(pick(NOGUT),true)+SH+syl(pick(V4),false)+(Math.random()<.5?fin(F_AL):'')},
 {n:'10',p:'פרשת ויחי',ex:'חוֹלָם',d:'Both kinds of cholam, with letters א–ת at the end',gen:()=>Math.random()<.5?cholam(true)+fin(F_ALL):syl(pick(V4),true)+cholam(false)+fin(F_ALL)},
 {n:'11',p:'פרשת בא',ex:'חֶדְוָה',d:'Sheva (nach) in the middle of the word',gen:()=>syl(pick(V5),true)+L(pick(NOGUT),false)+SH+syl(pick(V4),true)+(Math.random()<.4?fin(F_AL):'')},
 {n:'12',p:'',ex:'חִירִיק',d:'Words with chirik',gen:()=>Math.random()<.5?chirik(true)+fin(F_ALL):syl(pick(V4),true)+chirik(false)+fin(F_ALL)},
 {n:'13',p:'',ex:'שׁוּרֻק',d:'Words with kubutz and shuruk',gen:()=>Math.random()<.5?shuruk(true)+fin(F_ALL):syl(pick(V4),true)+shuruk(false)+fin(F_ALL)},
 {n:'סופי',id:'sofi1',p:'פרשת תרומה',ex:'—',d:'Review: all the nekudos',mix:['4','6','7','8','9','10','11','12','13']},
 {n:'15',p:'פרשת תצוה',ex:'רוֹמְמוּ',d:'Two of the same letter; the first has a sheva (na)',
  gen:()=>{const x=pick('מלנסקשז'.split(''));return syl(pick(V5),true)+L(x,false)+SH+L(x,false)+pick([K,P,TZ,SG,HO,'ו'+DG])+(Math.random()<.4?fin(F_AL):'');}},
 {n:'16',p:'פרשת כי תשא',ex:'חַסְדְּךָ',d:'Two shvas in the middle, one after the other',
  gen:()=>syl(pick(V4),true)+L(pick(NOGUT),false)+SH+L(pick(NOGUT),true)+SH+L(pick(OPEN),false)+pick(V4)},
 {n:'17',p:'פרשת ויקהל',ex:'רֵאשִׁית',d:'Silent א',words:['רֵאשִׁית','רֹאשׁ','צֹאן','לֵאמֹר','מְאֹד','נְאֻם','רִאשׁוֹן','שְׂמֹאל','צֹאנוֹ','רָאשֵׁי']},
 {n:'18',p:'פרשת ויקהל',ex:'דַּי',d:'ַי at the end of the word',gen:()=>Math.random()<.4?L(pick(OPEN),true)+P+'י':syl(pick(V5),true)+L(pick(OPEN),false)+P+'י'},
 {n:'19',p:'פרשת פקודי',ex:'צִוָּה',d:'ו with komatz or patach and a dot',words:['צִוָּה','קִוָּה','חַוָּה','עַוָּל','צִוָּנוּ','צַוָּאר','וַיְצַוֶּה','מְצַוֶּה','קַוֵּה','חַוַּת']},
 {n:'20',p:'פרשת פקודי',ex:'עָוֹן',d:'Cholam ו in the middle of the word (review)',words:['עָוֹן','שָׁלוֹם','עוֹלָם','טוֹבָה','מוֹשָׁב','קוֹלוֹת','דּוֹרוֹת','יוֹמַיִם','אוֹתָם','בּוֹרֵא']},
 {n:'21',p:'פרשת ויקרא',ex:'יָדָי',d:'ָי at the end of the word',gen:()=>syl(pick(V5),true)+L(pick(OPEN),false)+K+'י'},
 {n:'22',p:'פרשת שמיני',ex:'מֹשֶׁה',d:'שׁ / שׂ with cholam (review)',words:['מֹשֶׁה','עֹשֶׂה','נֹשֵׂא','שֹׂנֵא','חֹשֶׁךְ','שֹׁמֵר','שֹׁפֵט','שֹׁרֶשׁ','בֹּשֶׂם','שֹׁבֵר']},
 {n:'23',p:'פרשת תזריע',ex:'מָשִׁיחַ',d:'ח at the end of the word',words:['מָשִׁיחַ','רוּחַ','לוּחַ','תַּפּוּחַ','שָׂמֵחַ','פּוֹתֵחַ','מִזְבֵּחַ','מַפְתֵּחַ','יָדוּעַ','שָׁבוּעַ']},
 {n:'24',p:'פרשת מצורע',ex:'אַנְתְּ',d:'Two shvas at the end of the word',words:['אַתְּ','וַיֵּשְׁתְּ','וַיֵּבְךְּ','וַיִּשְׁבְּ','וַיִּחַדְּ','נֵרְדְּ','וַיַּשְׁקְ','וַיֵּרְדְּ']},
 {n:'25',p:'פרשת מצורע',ex:'הַבְּהֵמָה',d:'Sheva (na) under a letter with a dot',words:['הַבְּהֵמָה','הַמְּלָאכָה','הַלְּבָנָה','וַיְּדַבֵּר','הַסְּפָרִים','הַשְּׁבוּעַ','הַכְּלָלִים','הַמְּנוֹרָה']},
 {n:'26',p:'פרשת אמור',ex:'כָּרָאוּי',d:'וּי at the end of the word',words:['רָאוּי','כָּרָאוּי','גָּלוּי','בָּנוּי','עָשׂוּי','פָּנוּי','צָפוּי','רָצוּי','קָנוּי']},
 {n:'27',p:'פרשת אמור',ex:'לָהּ',d:'ה with a dot (הּ)',words:['לָהּ','בָּהּ','שְׁמָהּ','בְּנָהּ','אִישָׁהּ','אַרְצָהּ','יָדָהּ','בִּתָּהּ']},
 {n:'סופי',id:'sofi2',p:'פרשת במדבר',ex:'—',d:'Review: words with all the nekudos and rules',mix:'all'}
];
for(const l of LEVELS)l.id=l.id||'l'+l.n;
const byN=Object.fromEntries(LEVELS.map(l=>[l.n,l]));

let lastUnique=0,lastWant=0;
// Fill up to the requested count; if a darga has fewer different items, repeat them in a new random order.
function fill(unique,want){lastUnique=unique.length;lastWant=want;if(!unique.length)return[];
  const out=shuffle(unique);while(out.length<want)out.push(...shuffle(unique));return out.slice(0,want);}
// ---- Real Chumash words per darga ----
const RW=(function(){
const SH='\u05B0',HS='\u05B1',HP='\u05B2',HK='\u05B3',CH='\u05B4',TZ='\u05B5',SG='\u05B6',P='\u05B7',K='\u05B8',HO='\u05B9',HOV='\u05BA',KU='\u05BB',DG='\u05BC',KK='\u05C7';
const RANGE_AH='אבגדהוזח',RANGE_AL='אבגדהוזחטיכךל';
function clusters(w){const o=[];for(const ch of w){if(ch>='\u05D0'&&ch<='\u05EA')o.push({l:ch,m:''});else if(o.length)o[o.length-1].m+=ch;}return o;}
// Returns {need, voiced, finalCons, kinds} or null if the word has something outside the chart.
function analyze(word){
  const c=clusters(word),n=c.length;if(!n||n>9)return null;
  const letters=c.map(x=>x.l).join('');
  if(/יהו|אלה|אלו|שדי/.test(letters))return null;                // no Shem Hashem forms
  let need=0,voiced=0;const kinds=new Set();const up=(lv,k)=>{need=Math.max(need,lv);if(k)kinds.add(k);};
  const vow=x=>{for(const v of[K,KK,P,TZ,SG,CH,HO,HOV,KU,SH,HS,HP,HK])if(x.m.includes(v))return v;return null;};
  let finalCons=null;
  for(let i=0;i<n;i++){
    const x=c[i],v=vow(x),last=i===n-1,prev=i?c[i-1]:null,next=last?null:c[i+1],pv=prev?vow(prev):null,dag=x.m.includes(DG);
    // vav as a vowel
    if(x.l==='ו'&&!v&&dag){up(13,'shuruk');voiced++;continue;}
    if(x.l==='ו'&&(v===HO||v===HOV)&&i>0&&!pv){up(10,'cholam');voiced++;if(!last)up(10);continue;}
    if(x.l==='ו'&&dag&&(v===K||v===P)&&i>0)up(19,'vav-dagesh');
    if(x.l==='י'&&!v&&i>0){                                         // yud as a vowel letter
      if(last&&pv===P){up(18,'ay');continue;}
      if((last&&pv===K)||(next&&next.l==='ו'&&!vow(next)&&next===c[n-1]&&pv===K)){up(21,'oy');continue;}
      if(last&&prev?.l==='ו'&&prev.m.includes(DG)){up(26,'ui');continue;}
      if(pv===CH){up(12);continue;}
      if(pv===TZ||pv===SG){up(12);continue;}
      return null;}
    if(x.l==='ו'&&!v&&!dag&&last&&prev?.l==='י'&&vow(c[i-2]||{m:''})===K){continue;}  // ָיו ending
    if(x.l==='א'&&!v){if(last){up(4);continue;}up(17,'silent-alef');continue;}
    if(x.l==='ה'&&!v&&last){if(dag){up(27,'mapik');}else up(4);continue;}
    if(!v){                                                          // a letter with no vowel
      if(last){finalCons=x.l;up(RANGE_AH.includes(x.l)?6:RANGE_AL.includes(x.l)?8:10,'final');continue;}
      return null;}
    if(v===HS||v===HP||v===HK)return null;                           // chataf: not in the chart
    if(v===SH){
      if(last){finalCons=x.l;up(RANGE_AL.includes(x.l)?8:10,'final');continue;}
      if(i===0){up(9,'sheva-start');continue;}
      if(next&&next.l===x.l){up(15,'double-letter');continue;}
      if(pv===SH){up(last||i===n-2&&!vow(next)?24:16,'two-shvas');continue;}
      if(i===n-2&&next&&vow(next)===SH){up(24,'two-shvas-end');continue;}
      if(dag&&pv&&pv!==SH){up(25,'sheva-dagesh');continue;}
      up(11,'sheva-mid');continue;}
    if(last&&v===P&&'חע'.includes(x.l)&&i>0){up(23,'patach-genuva');voiced++;continue;}
    voiced++;
    up({[K]:2,[KK]:2,[P]:3,[TZ]:5,[SG]:8,[CH]:12,[HO]:10,[HOV]:10,[KU]:13}[v]);
  }
  return{need,voiced,finalCons,kinds};
}
// Does this word belong to the given darga?
const VO=new Set([K,KK,P]);
function fits(n,word){
  const a=analyze(word);if(!a)return false;const{need,voiced,finalCons,kinds}=a;
  switch(n){
    case '4':return need<=4&&voiced===2&&!finalCons&&!kinds.size&&!/[\u05B5\u05B6]/.test(word);
    case '6':return need<=6&&voiced===1&&finalCons&&RANGE_AH.includes(finalCons)&&!/[\u05B6]/.test(word);
    case '7':return need<=5&&voiced===3&&!finalCons;
    case '8':return need<=8&&need>=6&&voiced===2&&finalCons&&RANGE_AL.includes(finalCons)&&!kinds.has('sheva-start');
    case 'sofi1':return need<=13&&need>=4&&voiced>=2;
    case 'sofi2':return need>=4&&voiced>=2;
    default:{const L=+n;if(!L||L<9)return false;
      if(need!==L)return false;
      if(L===9)return kinds.has('sheva-start');if(L===10)return kinds.has('cholam')||/\u05B9/.test(word);
      if(L===11)return kinds.has('sheva-mid');if(L===12)return /\u05B4/.test(word);if(L===13)return /\u05BB|\u05D5\u05BC/.test(word);
      return true;}}
}
const LEVELS_WITH_REAL=['4','6','7','8','9','10','11','12','13','sofi1','15','16','18','21','sofi2'];
function clean(t){return String(t).replace(/<[^>]+>/g,'').replace(/&[a-z]+;/g,' ').replace(/\{[^}]*\}/g,'')
  .replace(/[\u0591-\u05AF\u05BD\u05BF\u05C0\u05C3-\u05C6]/g,'').replace(/\u05BE/g,' ').replace(/[^\u05B0-\u05EA\s]/g,' ');}
async function build(onProgress){
  const words=new Set();const parts=[];for(let s=1;s<=50;s+=10)parts.push(`Genesis.${s}-${Math.min(s+9,50)}`);for(let s=1;s<=40;s+=10)parts.push(`Exodus.${s}-${Math.min(s+9,40)}`);
  let k=0;for(const ref of parts){k++;onProgress?.(k,parts.length);
    const j=await(await fetch('https://www.sefaria.org/api/v3/texts/'+ref+'?version=hebrew|Miqra%20according%20to%20the%20Masorah')).json();
    for(const line of[].concat(j.versions[0].text).flat(4))for(const w of clean(line).split(/\s+/))if(w&&/[\u05D0-\u05EA]/.test(w))words.add(w);}
  const pools={};for(const n of LEVELS_WITH_REAL)pools[n]=[];
  for(const w of words)for(const n of LEVELS_WITH_REAL)if(fits(n,w))pools[n].push(w);
  return pools;}
return{build};})();
let REAL=null;
window.loadRealWords=async function(){
  if(REAL)return REAL;
  try{const c=localStorage.getItem('kriah-realwords-v1');if(c){REAL=JSON.parse(c);return REAL;}}catch{}
  const pools=await RW.build();for(const k in pools)pools[k]=shuffle(pools[k]).slice(0,800);
  REAL=pools;try{localStorage.setItem('kriah-realwords-v1',JSON.stringify(pools));}catch{}return REAL;};
const realKey=l=>l.id.startsWith('sofi')?l.id:l.n;
function wordsFor(l,count){
  if(l.words)return fill(l.words,count||10);
  const want=count||l.count||12,pool=REAL&&!l.letters?REAL[realKey(l)]:null;
  if(pool&&pool.length){                                  // about half real words, half practice words
    const realN=Math.min(Math.ceil(want/2),pool.length),real=shuffle(pool).slice(0,realN),rest=genWords(l,want-realN);
    const all=shuffle([...real,...rest]);lastUnique=new Set(all).size;lastWant=want;return all;}
  return genWords(l,want);}
function genWords(l,count){
  if(count<=0)return[];
  if(l.mix){const pool=l.mix==='all'?LEVELS.filter(x=>!x.mix&&!x.letters&&x.n!=='1'):l.mix.map(n=>byN[n]);
    const out=new Set();let guard=0;while(out.size<count&&guard++<2000){const x=pick(pool);out.add(x.words?pick(x.words):x.gen());}return fill([...out],count);}
  const out=new Set();let guard=0;const want=count;
  while(out.size<want&&guard++<3000)out.add(l.gen());
  return fill([...out],want);}

const find=v=>LEVELS.find(l=>'lvl-'+l.id===v);
window.addLevelOptions=function(select){
  const g=document.createElement('optgroup');g.label='Levels (דרגא)';
  for(const l of LEVELS)g.append(new Option(`דרגא ${l.n}${l.p?' · '+l.p:''} · ${l.ex}`,'lvl-'+l.id));
  select.prepend(g);select.value='lvl-'+LEVELS[0].id;};
window.makeLevelWords=(v,count)=>{const l=find(v);return l?wordsFor(l,count).join(' '):'';};
window.levelUniqueCount=()=>lastUnique<lastWant?lastUnique:0;
window.levelInfo=v=>{const l=find(v);return l?`${l.d}${l.ex!=='—'?' (e.g. '+l.ex+')':''}`:'';};
window.levelTitle=v=>{const l=find(v);return l?`דרגא ${l.n}${l.p?' · '+l.p:''}`:'';};
window.KRIAH_LEVELS=LEVELS;
})();
