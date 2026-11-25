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
function wordsFor(l,count){
  if(l.words)return fill(l.words,count||10);
  if(l.mix){const pool=l.mix==='all'?LEVELS.filter(x=>!x.mix&&!x.letters&&x.n!=='1'):l.mix.map(n=>byN[n]);
    const out=new Set();let guard=0;while(out.size<(count||12)&&guard++<2000){const x=pick(pool);out.add(x.words?pick(x.words):x.gen());}return fill([...out],count||12);}
  const out=new Set();let guard=0;const want=count||l.count||12;
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
