// ===== Sound trainer =====
// Teach the checker each nekudah and letter sound separately, in the chosen pronunciation.
// It learns from the speech model's detailed sound scores, so it works on every passuk.
(function(){
const BASES=['מ','ל','נ','ס','ד','ג','ז','ר'];
const VOWEL_CARDS=[['komatz','\u05B8'],['patach','\u05B7'],['tzeirei','\u05B5'],['segol','\u05B6'],['chirik','\u05B4'],
  ['cholam','\u05B9'],['shuruk','SHURUK'],['kubutz','\u05BB'],['sheva','\u05B0']];
const MIN_EXAMPLES=2,DRILL_TARGET=3;
let tab='vowel',selected=null,busy=false,stopDrill=false,stream=null,cache=null;

const trad=()=>$('trad').value;
const libKey=()=>'kriah-sounds-'+trad();
function lib(){try{return JSON.parse(localStorage.getItem(libKey()))||{examples:[]};}catch{return{examples:[]};}}
function saveLib(L){try{localStorage.setItem(libKey(),JSON.stringify(L));}catch{msg('This browser is out of space for sound examples. Download the library, then clear some.');}cache=null;}

function cards(){
  const T=TRADITIONS[trad()],L=lib(),count=(kind,cls)=>L.examples.filter(e=>e.kind===kind&&e.cls===cls&&!e.mistake).length;
  if(tab==='vowel')return VOWEL_CARDS.map(([name,mark])=>{const cls=T.v[mark][0],n=count('vowel',cls),b=BASES[n%BASES.length];
    return{id:'v-'+name,kind:'vowel',name,cls,n,text:mark==='SHURUK'?b+'וּ':b+mark};});
  const t=T.tavRafe;
  return[['בּ','b','bet'],['ב','v','vet'],['כּ','k','kaf'],['כ','x','chaf'],['פּ','p','pey'],['פ','f','fey'],['תּ','t','tav'],['ת',t,'sav / tav rafe'],
    ['שׁ','sh','shin'],['שׂ','s','sin'],['ח','x','ches'],['ר','r','reish'],['ע','','ayin (silent)'],['צ','ts','tzadik']]
    .filter(c=>c[1]).map(([letter,cls,name])=>({id:'l-'+letter,kind:'letter',name,cls,n:count('letter',cls),text:letter+'\u05B7'}));
}

// ---- Features: the model's averaged log-probabilities over one sound ----
function segFeature(output,seg){
  const T=output.dims[0],V=output.dims[1],d=output.data,a=Math.max(0,seg.start-1),b=Math.min(T-1,seg.end+1),f=new Float32Array(V);
  for(let t=a;t<=b;t++){const o=t*V;let m=-Infinity;for(let i=0;i<V;i++)if(d[o+i]>m)m=d[o+i];
    let s=0;for(let i=0;i<V;i++)s+=Math.exp(d[o+i]-m);const l=m+Math.log(s);for(let i=0;i<V;i++)f[i]+=Math.max(-15,d[o+i]-l);}
  for(let i=0;i<V;i++)f[i]/=(b-a+1);return f;}
function dist(a,b){let s=0;for(let i=0;i<a.length;i++){const x=a[i]-b[i];s+=x*x;}return Math.sqrt(s);}
function centroids(kind){
  if(cache&&cache[kind])return cache[kind];
  const C={};for(const e of lib().examples){if(e.kind!==kind)continue;const c=C[e.cls]??={sum:null,n:0};
    if(!c.sum)c.sum=new Float32Array(e.f.length);for(let i=0;i<e.f.length;i++)c.sum[i]+=e.f[i];c.n++;}
  for(const c of Object.values(C)){c.mean=c.sum.map(v=>v/c.n);}
  (cache??={})[kind]=C;return C;}

// Used by the checker for every sound in every passuk.
window.soundJudge=function(output,seg,u){
  if(seg.start==null)return null;
  const kind=u.kind==='vowel'?'vowel':'letter',C=centroids(kind),exp=C[u.phone];
  if(!exp||exp.n<MIN_EXAMPLES)return null;
  const f=segFeature(output,seg),dExp=dist(f,exp.mean);let best=null,dBest=Infinity;
  for(const[cls,c]of Object.entries(C)){if(cls===u.phone||c.n<MIN_EXAMPLES)continue;const d=dist(f,c.mean);if(d<dBest){dBest=d;best=cls;}}
  if(!best)return null;
  if(dBest<dExp*.88){if((getW()[keyOf(u,best)]||0)>=2)return{status:'unclear',heard:best};return{status:'flag',heard:best};}
  if(dExp<=dBest)return{status:'ok'};
  return{status:'unclear',heard:best};};

// ---- Recording ----
async function mic(){if(!stream||!stream.active)stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}});return stream;}
function releaseMic(){stream?.getTracks().forEach(t=>t.stop());stream=null;}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function recordClip(ms=2200){
  const s=await mic(),rec=new MediaRecorder(s),parts=[];rec.ondataavailable=e=>e.data.size&&parts.push(e.data);
  const done=new Promise(r=>rec.onstop=r);rec.start();await sleep(ms);rec.stop();await done;return new Blob(parts,{type:rec.mimeType});}
async function analyze(blob,kind){
  const session=await loadModel(),samples=await toSamples(blob),output=await inference(session,samples);
  const segs=extractSegments(output,vocabInfo);
  let seg=null;
  if(kind==='vowel'){for(const s of segs)if(VOWEL_SOUNDS.has(s.sound)&&(!seg||s.end-s.start>seg.end-seg.start||s.margin>seg.margin))seg=s;}
  else seg=segs.find(s=>!VOWEL_SOUNDS.has(s.sound))||null;
  if(!seg)return null;
  return{feat:segFeature(output,seg),heard:seg.sound};}

// ---- Saving clips for real training later ----
function sdb(){return new Promise((res,rej)=>{const r=indexedDB.open('kriah-sounds',1);
  r.onupgradeneeded=()=>r.result.createObjectStore('clips',{keyPath:'id'});r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
async function sstore(mode,fn){const d=await sdb();return new Promise((res,rej)=>{const tx=d.transaction('clips',mode);const q=fn(tx.objectStore('clips'));
  tx.oncomplete=()=>res(q?.result);tx.onerror=()=>rej(tx.error);});}

async function capture(card,cls,mistake){
  if(busy)return false;busy=true;setButtons();
  try{
    for(const n of['3','2','1']){msg(`Get ready… ${n}`);await sleep(350);}
    msg(`Read now: ${card.text}`);$('st-big').classList.add('rec');
    const blob=await recordClip();$('st-big').classList.remove('rec');
    msg('Learning…');
    const a=await analyze(blob,card.kind);
    if(!a){msg('No sound was heard. Read a little louder and try again.');return false;}
    const L=lib();const id=crypto.randomUUID?crypto.randomUUID():String(Date.now());
    L.examples.push({id,kind:card.kind,cls,card:card.id,text:card.text,mistake:!!mistake,f:Array.from(a.feat,v=>Math.round(v*10)/10),t:Date.now()});
    saveLib(L);
    try{await sstore('readwrite',s=>s.put({id,pronunciation:trad(),kind:card.kind,cls,card:card.id,text:card.text,mistake:!!mistake,audio:blob,audioType:blob.type,date:new Date().toISOString()}));}catch{}
    msg(`Saved${mistake?' as a mistake':''}. ${card.name}: ${lib().examples.filter(e=>e.card===card.id&&!e.mistake).length} correct example(s).`);
    drawCards();if(typeof lastOut!=='undefined'&&lastOut)recheck();
    return true;
  }catch(e){console.error(e);msg(e.name==='NotAllowedError'?'The microphone is blocked. Allow it in the browser and try again.':'That did not work. Try again.');return false;}
  finally{busy=false;$('st-big')?.classList.remove('rec');setButtons();}
}

// ---- Panel ----
function msg(t){$('st-msg').textContent=t;}
function setButtons(){for(const id of['st-rec','st-mistake','st-drill','st-test'])if($(id))$(id).disabled=busy&&id!=='st-drill';
  if($('st-drill'))$('st-drill').textContent=busy&&!stopDrill&&drilling?'Stop drill':'Quick drill';}
let drilling=false;
function drawCards(){
  const list=cards();
  $('st-cards').innerHTML=list.map(c=>`<button type="button" class="st-card${selected===c.id?' sel':''}" data-id="${c.id}">
    <span class="s" dir="rtl">${esc(c.text)}</span><span>${esc(c.name)}</span><small>${c.n?'✓ '+c.n:'not trained'}</small></button>`).join('');
  const c=list.find(x=>x.id===selected)||list[0];selected=c.id;
  $('st-cards').querySelector(`[data-id="${CSS.escape(c.id)}"]`)?.classList.add('sel');
  $('st-big').textContent=c.text;$('st-name').textContent=`${c.name}: should sound like "${show([c.cls])}"`;
  const others=[...new Set(list.filter(x=>x.cls!==c.cls).map(x=>x.cls))];
  $('st-mistake-as').innerHTML=others.map(cls=>{const o=list.find(x=>x.cls===cls);return `<option value="${esc(cls)}">read like ${esc(o.name)} ("${esc(show([cls]))}")</option>`;}).join('');
  const L=lib(),ready=[...new Set(L.examples.map(e=>e.kind+':'+e.cls))].filter(k=>L.examples.filter(e=>e.kind+':'+e.cls===k).length>=MIN_EXAMPLES);
  $('st-ready').textContent=ready.length>1?`Checking with your training: ${ready.length} sounds ready. Each nekudah needs ${MIN_EXAMPLES}+ examples to be used.`:`Each sound needs ${MIN_EXAMPLES}+ examples before the checker uses it. Start with komatz and patach.`;
  $('st-count').textContent=`${L.examples.length} examples saved for ${TRADITIONS[trad()].name}.`;
}
function current(){return cards().find(c=>c.id===selected);}

function build(){
  const css=document.createElement('style');css.textContent=`
.st-tabs{display:flex;gap:8px;margin:10px 0}.st-tabs .on{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}
.st-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px}
.st-card{display:flex;flex-direction:column;align-items:center;gap:2px;border:1px solid var(--line);border-radius:12px;padding:8px;background:var(--card);color:var(--ink);cursor:pointer;font:inherit}
.st-card .s{font:700 2.1rem/1.2 'Frank Ruhl Libre',serif}.st-card small{color:var(--soft)}.st-card.sel{outline:3px solid var(--accent)}
.st-stage{text-align:center;margin:16px 0 6px}#st-big{display:inline-block;font:700 4.5rem/1.2 'Frank Ruhl Libre',serif;padding:0 .3em;border-radius:16px}
#st-big.rec{background:var(--miss-bg);color:var(--miss)}#st-name{color:var(--soft);margin:2px 0 10px}
.st-row{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;align-items:center}#st-msg{text-align:center;font-weight:500;color:var(--accent);min-height:1.5em}
#st-ready{font-size:.9rem}`;document.head.append(css);
  const btn=document.createElement('button');btn.className='btn';btn.type='button';btn.id='st-open';btn.textContent='Sound trainer';
  document.querySelector('header .mode').before(btn);
  const p=document.createElement('section');p.id='sound-trainer';p.className='panel';p.hidden=true;
  p.innerHTML=`<h2>Sound trainer</h2>
  <p>Teach the checker how each nekudah and letter sounds in your pronunciation. What it learns here is used on every passuk.</p>
  <div class="st-tabs"><button class="btn on" type="button" data-tab="vowel">Nekudos</button><button class="btn" type="button" data-tab="letter">Letters</button></div>
  <div id="st-cards" class="st-grid"></div>
  <div class="st-stage"><span id="st-big" dir="rtl" lang="he"></span><p id="st-name"></p>
    <div class="st-row"><button class="btn yes" id="st-rec" type="button">Record correct</button>
      <select id="st-mistake-as" aria-label="Which mistake"></select><button class="btn no" id="st-mistake" type="button">Record this mistake</button></div></div>
  <p id="st-msg" role="status" aria-live="polite"></p>
  <div class="st-row"><button class="btn" id="st-drill" type="button">Quick drill</button><button class="btn" id="st-test" type="button">Test a sound</button></div>
  <p id="st-ready"></p>
  <details><summary>Sound library</summary><p id="st-count"></p>
    <div class="tools"><button class="btn" id="st-dl" type="button">Download library</button>
      <label class="btn">Load library<input id="st-ul" type="file" accept=".json,application/json"></label>
      <button class="btn" id="st-zip" type="button">Download recordings (ZIP)</button>
      <button class="btn no" id="st-undo" type="button">Undo last example</button>
      <button class="btn no" id="st-clear" type="button">Clear this pronunciation</button></div></details>`;
  document.querySelector('footer').before(p);

  btn.onclick=()=>{p.hidden=!p.hidden;if(!p.hidden){drawCards();msg('Pick a card, press Record correct, and read it when it says "Read now".');p.scrollIntoView({behavior:'smooth'});warmup();}else releaseMic();};
  p.querySelector('.st-tabs').onclick=e=>{const b=e.target.closest('[data-tab]');if(!b||busy)return;tab=b.dataset.tab;selected=null;
    p.querySelectorAll('.st-tabs .btn').forEach(x=>x.classList.toggle('on',x===b));drawCards();};
  $('st-cards').onclick=e=>{const b=e.target.closest('.st-card');if(!b||busy)return;selected=b.dataset.id;drawCards();};
  $('st-rec').onclick=()=>{const c=current();capture(c,c.cls,false);};
  $('st-mistake').onclick=()=>{const c=current();const cls=$('st-mistake-as').value;if(cls)capture(c,cls,true);};
  $('st-drill').onclick=async()=>{
    if(drilling){stopDrill=true;msg('Stopping after this one…');return;}
    drilling=true;stopDrill=false;setButtons();
    try{for(let round=0;round<DRILL_TARGET&&!stopDrill;round++){
      for(const c of cards()){if(stopDrill)break;if(c.n>round)continue;selected=c.id;drawCards();
        $('st-drill').disabled=false;$('st-drill').textContent='Stop drill';
        const ok=await capture(c,c.cls,false);if(!ok)await sleep(900);else await sleep(400);}}
      msg(stopDrill?'Drill stopped.':'Drill finished. Every card has '+DRILL_TARGET+' examples.');}
    finally{drilling=false;stopDrill=false;setButtons();drawCards();}};
  $('st-test').onclick=async()=>{
    if(busy)return;busy=true;setButtons();
    try{for(const n of['3','2','1']){msg(`Get ready… ${n}`);await sleep(350);}
      msg('Say one sound now…');const blob=await recordClip();msg('Listening…');
      const a=await analyze(blob,tab);if(!a){msg('No sound was heard. Try again.');return;}
      const C=centroids(tab),list=cards(),ranked=Object.entries(C).filter(([,c])=>c.n>=MIN_EXAMPLES).map(([cls,c])=>[cls,dist(a.feat,c.mean)]).sort((x,y)=>x[1]-y[1]);
      if(!ranked.length){msg('Train at least two sounds first.');return;}
      const nm=cls=>(list.find(x=>x.cls===cls)||{name:cls}).name;
      msg('Sounds most like: '+ranked.slice(0,3).map(([cls],i)=>(i?'then ':'')+nm(cls)).join(', ')+'.');}
    catch(e){console.error(e);msg('That did not work. Try again.');}
    finally{busy=false;setButtons();}};
  $('st-dl').onclick=()=>download(new Blob([JSON.stringify({pronunciation:trad(),...lib()})]),'kriah-sounds-'+trad()+'.json');
  $('st-ul').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
    try{const d=JSON.parse(await f.text());if(d.pronunciation&&d.pronunciation!==trad()){$('trad').value=d.pronunciation;}
      const L=lib(),have=new Set(L.examples.map(x=>x.id));for(const x of d.examples||[])if(!have.has(x.id))L.examples.push(x);
      saveLib(L);drawCards();msg('Library loaded.');if(lastOut)recheck();}catch{msg('That file is not a sound library.');}};
  $('st-zip').onclick=async()=>{const clips=await sstore('readonly',s=>s.getAll());if(!clips.length){msg('No recordings saved yet.');return;}
    const zip=new JSZip(),ext=t=>/mp4|m4a|aac/.test(t)?'m4a':/ogg/.test(t)?'ogg':/wav/.test(t)?'wav':'webm';
    zip.file('sounds.jsonl',clips.map(c=>{const f='audio/'+c.id+'.'+ext(c.audioType||'');zip.file(f,c.audio);const{audio,...r}=c;return JSON.stringify({...r,audio:f});}).join('\n')+'\n');
    download(await zip.generateAsync({type:'blob'}),'kriah-sound-recordings.zip');};
  $('st-undo').onclick=()=>{const L=lib();const x=L.examples.pop();if(!x){msg('Nothing to undo.');return;}saveLib(L);drawCards();msg(`Removed the last example (${x.text}).`);if(lastOut)recheck();};
  $('st-clear').onclick=()=>{if(confirm('Clear all sound training for this pronunciation? Download the library first if you want a backup.')){saveLib({examples:[]});drawCards();msg('Cleared.');if(lastOut)recheck();}};
  $('trad').addEventListener('change',()=>{cache=null;if(!p.hidden)drawCards();});
}
build();
})();
