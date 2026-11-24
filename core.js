// Kriah checker core (shared by index.html and school.html)
// ===== Kriah checker core v3 =====
// Recognition approach adapted from the earlier Kriah Practice code: confidence-based,
// only flags a sound when the model is sure and the neighbors match; otherwise "not sure".
const SHEVA='\u05B0',HSEGOL='\u05B1',HPATACH='\u05B2',HKAMATZ='\u05B3',HIRIQ='\u05B4',TZEIREI='\u05B5',
  SEGOL='\u05B6',PATACH='\u05B7',KAMATZ='\u05B8',HOLAM='\u05B9',HOLAM_VAV='\u05BA',KUBUTZ='\u05BB',
  DAGESH='\u05BC',SIN_DOT='\u05C2',KAMATZ_KATAN='\u05C7';
const VOWELS=new Set([SHEVA,HSEGOL,HPATACH,HKAMATZ,HIRIQ,TZEIREI,SEGOL,PATACH,KAMATZ,HOLAM,HOLAM_VAV,KUBUTZ,KAMATZ_KATAN]);
const VNAME={[KAMATZ]:'komatz',[PATACH]:'patach',[TZEIREI]:'tzeirei',[SEGOL]:'segol',[HIRIQ]:'chirik',[HOLAM]:'cholam',
  [HOLAM_VAV]:'cholam',[KUBUTZ]:'kubutz',SHURUK:'shuruk',[SHEVA]:'sheva',[HSEGOL]:'chataf segol',[HPATACH]:'chataf patach',
  [HKAMATZ]:'chataf komatz',[KAMATZ_KATAN]:'komatz katan'};

// Each pronunciation is just a table. Add a new one here.
const TRADITIONS={
  chabad:{name:'Ashkenazi (Chabad)',tavRafe:'s',v:{[KAMATZ]:['o'],[KAMATZ_KATAN]:['o'],[HKAMATZ]:['o'],[PATACH]:['a'],[HPATACH]:['a'],
    [TZEIREI]:['ey'],[SEGOL]:['e'],[HSEGOL]:['e'],[HIRIQ]:['i'],[HOLAM]:['oy'],[HOLAM_VAV]:['oy'],[KUBUTZ]:['u'],SHURUK:['u'],[SHEVA]:['ə']}},
  sefardi:{name:'Sefardi / Israeli',tavRafe:'t',v:{[KAMATZ]:['a'],[KAMATZ_KATAN]:['o'],[HKAMATZ]:['o'],[PATACH]:['a'],[HPATACH]:['a'],
    [TZEIREI]:['e'],[SEGOL]:['e'],[HSEGOL]:['e'],[HIRIQ]:['i'],[HOLAM]:['o'],[HOLAM_VAV]:['o'],[KUBUTZ]:['u'],SHURUK:['u'],[SHEVA]:['ə']}}
};
const BASIC={'ג':'g','ד':'d','ה':'h','ו':'v','ז':'z','ח':'x','ט':'t','י':'y','ל':'l','מ':'m','ם':'m','נ':'n','ן':'n','ס':'s','צ':'ts','ץ':'ts','ק':'k','ר':'r'};
const VOWEL_SOUNDS=new Set(['a','o','i','e','ey','oy','u','ə']);

function clusters(word){const out=[];for(const ch of word){
  if(ch>='\u05D0'&&ch<='\u05EA')out.push([ch,new Set()]);
  else if(out.length&&ch>='\u0591'&&ch<='\u05C7')out[out.length-1][1].add(ch);}return out;}
function consonant(c,m,dag,T){
  if('אע'.includes(c))return[];
  if(c==='ב')return[dag?'b':'v'];
  if('כך'.includes(c))return[dag?'k':'x'];
  if('פף'.includes(c))return[dag?'p':'f'];
  if(c==='ת')return[dag?'t':T.tavRafe];
  if(c==='ש')return[m.has(SIN_DOT)?'s':'sh'];
  return[BASIC[c]||''];}
function splitWords(text){return text.replace(/[\u05BE\u05C3\u05C0]/g,' ').split(/\s+/).filter(w=>clusters(w).length);}

// Expected sounds for one word. Each: {phone, c (letter index), kind 'vowel'|'consonant', name, uncertain}
function wordUnits(word,trad,elokim){
  const T=TRADITIONS[trad],V=T.v,cl=clusters(word),n=cl.length,letters=cl.map(x=>x[0]).join('');
  const out=[];let prev=null;
  const add=(toks,c,kind,name,uncertain=false)=>toks.forEach(phone=>phone&&out.push({phone,c,kind,name,uncertain}));
  const isName=letters.endsWith('אלהים');
  for(let i=0;i<n;i++){
    const[c,m]=cl[i],last=i===n-1,dag=m.has(DAGESH);
    let vow=null;for(const x of m)if(VOWELS.has(x)){vow=x;break;}
    const nxt=last?null:cl[i+1];
    if((c==='ו'&&i>0)||(c==='ו'&&!vow&&dag)){
      if(!vow&&dag){add(V.SHURUK,i,'vowel','shuruk');prev='SHURUK';continue;}
      if(vow===HOLAM){add(V[HOLAM],i,'vowel','cholam');prev=HOLAM;continue;}}
    if(c==='י'&&!vow&&!dag&&i>0){
      if([PATACH,KAMATZ,HPATACH].includes(prev)&&!(nxt&&nxt[0]==='ו'&&nxt[1].size===0))add(['y'],i-1,'vowel',VNAME[prev],true);
      prev='MATER';continue;}
    if(c==='ה'&&last&&!vow&&!dag)continue;
    let cons=consonant(c,m,dag,T),consUnsure=c==='ה'||(c==='ו'&&!vow)||(c==='ש'&&!m.has(SIN_DOT)&&!m.has('\u05C1'));
    if(isName&&c==='ה'&&i===n-3){cons=elokim?['k']:['h'];consUnsure=true;}
    if(last&&vow===PATACH&&'חעה'.includes(c)){add(V[PATACH],i,'vowel','patach',true);add(cons,i,'consonant',c,consUnsure);prev=PATACH;continue;}
    add(cons,i,'consonant',c,consUnsure);
    if(vow===SHEVA){
      const na=i===0||(prev===SHEVA&&!last)||(dag&&i>0&&![null,SHEVA,'MATER'].includes(prev));
      if(na)add(V[SHEVA],i,'vowel','sheva',true);
    }else if(vow)add(V[vow],i,'vowel',VNAME[vow]);
    prev=vow;}
  return out;}

function buildLesson(text,trad,elokim){
  const words=splitWords(text),units=[];
  words.forEach((word,w)=>wordUnits(word,trad,elokim).forEach(u=>units.push({...u,w,key:w+':'+u.c+':'+u.kind})));
  return{words,units};}

// ---- Model output -> sound segments with confidence ----
const ALIASES={a:'a ɑ ɐ æ ʌ aɪ',o:'o ɔ ɒ oʊ əʊ',i:'i ɪ ɨ',e:'e ɛ',ey:'eɪ ɛɪ',oy:'ɔɪ oɪ',u:'u ʊ','ə':'ə ɜ ᵻ',b:'b β',v:'v ʋ',
  g:'ɡ g',d:'d',h:'h ɦ',z:'z',x:'x χ ħ',t:'t',y:'j',k:'k q',l:'l ɫ',m:'m',n:'n',s:'s',f:'f',p:'p',ts:'ts',r:'r ɹ ɾ ʁ ʀ',sh:'ʃ ɕ'};
const NAME_BY_TOKEN=new Map();for(const[name,vals]of Object.entries(ALIASES))for(const v of vals.split(' '))NAME_BY_TOKEN.set(v,name);
const NEAR=[['e','ey'],['o','oy'],['ə','e'],['ə','a'],['s','z'],['t','d'],['b','v'],['i','y']];
const CLOSE=new Set(NEAR.flatMap(([a,b])=>[a+'/'+b,b+'/'+a]));
// How this model hears a Chabad/Ashkenazi accent: counted as a match unless the teacher marks it stricter.
const ALIKE=new Set([['r','d'],['ts','s'],['ts','t'],['e','ey'],['o','oy'],['o','a'],['ə','i'],['ə','e'],['ə','a'],['i','ey']].flatMap(([a,b])=>[a+'/'+b,b+'/'+a]));

function makeVocab(vocab){const labels=new Array(Object.keys(vocab).length);
  for(const[tok,id]of Object.entries(vocab))labels[id]=NAME_BY_TOKEN.get(tok.replace(/[ːˑˈˌ]/gu,''));
  return{labels,blank:vocab['<pad>']??0};}

function extractSegments(output,vocab){
  const width=output.dims[output.dims.length-1],segments=[];let last=vocab.blank,current;
  for(let f=0;f<output.data.length/width;f++){
    const s=output.data.subarray(f*width,f*width+width);
    let best=vocab.blank;for(let id=0;id<width;id++)if(s[id]>s[best])best=id;
    if(best!==last){current=undefined;const sound=vocab.labels[best];
      if(sound){current={sound,frame:f,start:f,end:f,best:-Infinity,margin:0,supported:{}};segments.push(current);}}
    if(current){current.end=f;
      for(let id=0;id<width;id++){const nm=vocab.labels[id];if(!nm)continue;const diff=s[best]-s[id];
        current.supported[nm]=Math.min(diff,current.supported[nm]??Infinity);}
      if(s[best]>current.best){let other=s[vocab.blank];
        for(let id=0;id<width;id++)if(vocab.labels[id]&&vocab.labels[id]!==current.sound)other=Math.max(other,s[id]);
        current.best=s[best];current.margin=s[best]-other;current.frame=f;}}
    last=best;}
  return segments;}

function alignment(units,segments){
  const cols=segments.length+1,costs=new Float32Array((units.length+1)*cols),steps=new Uint8Array(costs.length);
  const omission=u=>u.uncertain?.48:u.kind==='vowel'?.84:1.06;
  for(let i=0;i<=units.length;i++)for(let j=0;j<cols;j++){
    if(!i&&!j)continue;const cell=i*cols+j,u=units[i-1],h=segments[j-1];let cost=Infinity,step=0;
    if(i&&j){const same=(u.kind==='vowel')===VOWEL_SOUNDS.has(h.sound),gap=h.supported[u.phone]??10;
      const change=u.phone===h.sound?0:ALIKE.has(u.phone+'/'+h.sound)?.15:Math.min(same?1.1:2,.3+.25*gap);cost=costs[cell-cols-1]+change;step=1;}
    const skip=i?costs[cell-cols]+omission(u):Infinity;if(skip<cost){cost=skip;step=2;}
    const extra=j?costs[cell-1]+.83:Infinity;if(extra<cost){cost=extra;step=3;}
    costs[cell]=cost;steps[cell]=step;}
  const aligned=new Array(units.length).fill(null);let i=units.length,j=segments.length;
  while(i||j){const st=steps[i*cols+j];if(st===1)aligned[--i]=segments[--j];else if(st===2)i--;else j--;}
  return{aligned,cost:costs[costs.length-1]};}

// Strictness presets: how sure the model must be before it calls something a mistake.
const STRICT={gentle:{margin:2,gap:4},normal:{margin:1.5,gap:3.2},strict:{margin:1,gap:2.4}};
const keyOf=(u,h)=>u.name+'|'+u.phone+'>'+(h??'-');

// Returns null if the reading could not be followed; otherwise per-sound results.
function review(output,vocab,lesson,strictness,W){
  const S=STRICT[strictness]||STRICT.normal,units=lesson.units;
  const heard=extractSegments(output,vocab);
  if(!units.length||heard.length<3)return null;
  const{aligned,cost}=alignment(units,heard);
  const exact=units.map((u,i)=>{const s=aligned[i]?.sound;return s===u.phone||(s!=null&&ALIKE.has(u.phone+'/'+s)&&!((W[keyOf(u,s)]||0)<0));});
  const match=exact.filter(Boolean).length/units.length;
  // Low confidence: still show the reading, but never call anything a mistake.
  const low=match<.48||cost/units.length>.66||heard.length>units.length*2.3+12;
  const res=units.map((u,i)=>({...u,heard:aligned[i]?.sound??null,status:'ok'}));
  const anchored=(a,b)=>exact.slice(Math.max(0,a),Math.min(units.length,b)).some(Boolean);
  for(let start=0;start<units.length;){
    const w=units[start].w;let end=start+1;while(end<units.length&&units[end].w===w)end++;
    const bracketed=(start===0||anchored(start-3,start))&&(end===units.length||anchored(end,end+3));
    if(!low&&end-start>=2&&bracketed&&aligned.slice(start,end).every(x=>!x)){
      for(let k=start;k<end;k++)res[k].status='skip';start=end;continue;}
    for(let i=start;i<end;i++){
      const u=units[i],seg=aligned[i],r=res[i];
      // Sounds trained in the Sound trainer are judged by the teacher's own examples first.
      if(seg&&!u.uncertain&&window.soundJudge){const j=window.soundJudge(output,seg,u);if(j){r.status=j.status;if(j.heard)r.heard=j.heard;continue;}}
      if(exact[i]){r.status='ok';continue;}
      if(low){r.status='unclear';continue;}
      if(u.uncertain){r.status='unclear';continue;}
      const local=(i===0||exact[i-1])&&(i===units.length-1||exact[i+1]);
      const t=W[keyOf(u,seg?.sound)]||0;
      if(t>=2){r.status='unclear';continue;}
      if(!seg&&u.kind==='consonant'&&local){r.status='skip';continue;}
      const close=seg&&CLOSE.has(u.phone+'/'+seg.sound);
      const allowClose=strictness==='strict'||t<0;
      const need=S.gap+(t>0?3*t:t*.8)+(close?1.4:0);
      if(seg&&local&&seg.margin>=S.margin&&(seg.supported[u.phone]??10)>=Math.max(1,need)&&
         (u.kind==='vowel')===VOWEL_SOUNDS.has(seg.sound)&&(!close||allowClose))r.status='flag';
      else r.status='unclear';}
    start=end;}
  return{units:res,heard:heard.map(h=>h.sound),low,match};}

// Group sounds into letter-level units for display and training.
const RANK={flag:3,skip:2,unclear:1,ok:0};
function groupUnits(res){const map=new Map();
  for(const r of res){if(!map.has(r.key))map.set(r.key,{key:r.key,w:r.w,c:r.c,kind:r.kind,name:r.name,items:[],status:'ok'});
    const g=map.get(r.key);g.items.push(r);if(RANK[r.status]>RANK[g.status])g.status=r.status;}
  return[...map.values()];}

const show=t=>t.map(x=>({x:'ch','ə':"'"})[x]??x).join('');

// Teacher feedback. falseAlarm: forgive this exact sound swap more. missed: be stricter about it.
function learn(group,decision,W){const changes=[];
  for(const it of group.items){if(it.heard===it.phone)continue;const k=keyOf(it,it.heard);
    W[k]=(W[k]||0)+(decision==='falseAlarm'?1:-1);if(W[k]===0)delete W[k];changes.push(k);}
  return changes;}


