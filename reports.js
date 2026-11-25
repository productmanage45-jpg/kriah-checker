// ===== Reports: class overview and student report cards (updates automatically from saved tests) =====
(function(){
// Score thresholds (percent of letters read correctly)
const MASTERED=95,PASSING=85,PRACTICE=70;
const STATUS=[[MASTERED,'Mastered','m'],[PASSING,'Passing','p'],[PRACTICE,'Needs practice','n'],[-1,'Not yet','x']];
const statusOf=s=>s==null?['Not tested','t']:STATUS.find(([min])=>s>=min).slice(1);
const LEVELS=window.KRIAH_LEVELS||[];
const titleToLevel=new Map(LEVELS.map(l=>[`דרגא ${l.n}${l.p?' · '+l.p:''}`,l]));
let tests=[],cls='',student=null,card=null;

// ---- Scoring ----
function letterCount(text){return splitWords(text).reduce((n,w)=>n+segments(w).length,0);}
function score(t){const total=letterCount(t.passage_text||'');if(!total)return null;
  const marked=new Set((t.teacher_marks||[]).map(m=>m.w+':'+m.c)).size;return Math.max(0,Math.round(100*(1-marked/total)));}
function mistakeDetails(t){const words=splitWords(t.passage_text||''),out={nikud:[],letter:[],missing:0};
  for(const m of t.teacher_marks||[]){const seg=segments(words[m.w]||'')[m.c]||'';
    if(m.type==='missing'){out.missing++;continue;}
    if(m.type==='letter'){out.letter.push(seg[0]);continue;}
    let name=null;for(const ch of seg)if(VNAME[ch]){name=VNAME[ch];break;}
    if(!name&&seg.includes('ו\u05BC'))name='shuruk';if(!name&&seg[0]==='ו'&&seg.includes('\u05B9'))name='cholam';
    out.nikud.push(name||'other');}
  return out;}
const fmtDate=d=>new Date(d).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});

// ---- Build UI ----
const css=document.createElement('style');css.textContent=`
.rp-chip{display:inline-block;padding:2px 10px;border-radius:999px;font-size:.82rem;font-weight:600;white-space:nowrap}
.rp-m{background:var(--good-bg);color:var(--good)}.rp-p{background:#e3f1e6;color:#3f7a4f}.rp-n{background:var(--yel-bg);color:var(--yel)}
.rp-x{background:var(--miss-bg);color:var(--miss)}.rp-t{background:transparent;color:var(--soft);border:1px dashed var(--line)}
@media (prefers-color-scheme:dark){.rp-p{background:#22392a;color:#9fd8b0}}
.rp-grid td,.rp-grid th{text-align:center;padding:5px 4px;font-size:.82rem}.rp-grid td:first-child,.rp-grid th:first-child{text-align:left;white-space:nowrap;position:sticky;left:0;background:var(--card)}
.rp-cell{display:block;border-radius:6px;padding:3px 0;font-weight:600;min-width:38px}
.rp-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap}
.rp-big{font-size:1.25rem;font-weight:600;margin:4px 0}
.rp-bar{height:14px;border-radius:999px;background:var(--line);overflow:hidden;margin:6px 0}.rp-bar i{display:block;height:100%;background:var(--good)}
.rp-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px;margin:10px 0}
.rp-cards div{border:1px solid var(--line);border-radius:12px;padding:10px}.rp-cards b{display:block;font-size:1.35rem}
.rp-he{font-family:'Frank Ruhl Libre',serif;font-size:1.15rem}
.rp-ws .verse{font-size:clamp(1.6rem,4.5vw,2.4rem);cursor:default}.rp-ws .verse .L{cursor:default}.rp-ws .verse .L:hover{background:none}
.rp-ws{padding:10px 4px 16px}.rp-ws audio{margin:6px auto}.rp-ws .rec-row{margin-top:4px}
.rp-small{padding:4px 10px;font-size:.85rem}
@media print{header,#msg,nav,.no-print,section.card:not(#rp-card),#v-reports>.card:not(#rp-card){display:none!important}
  body{background:#fff;color:#000}.wrap{max-width:none;padding:0}#rp-card{border:0;box-shadow:none}.rp-grid{display:none}}`;
document.head.append(css);

const btn=document.createElement('button');btn.className='btn';btn.type='button';btn.dataset.view='reports';btn.textContent='Reports';
$('signout').before(btn);
const sec=document.createElement('section');sec.id='v-reports';sec.hidden=true;
sec.innerHTML=`<div class="card no-print"><div class="row">
    <div><label class="f" for="rp-class">Class</label><select id="rp-class"></select></div>
    <button class="btn" id="rp-refresh" type="button">Refresh</button></div>
    <p class="muted">Green = mastered (${MASTERED}%+), light green = passing (${PASSING}%+), yellow = needs practice (${PRACTICE}%+), red = not yet. Click a student for the report card.</p></div>
  <div class="card scroll no-print" id="rp-overview"></div>
  <div class="card" id="rp-card" hidden></div>`;
$('v-classes').after(sec);

// Show/hide alongside the other tabs
document.querySelectorAll('#nav [data-view]').forEach(b=>{if(b!==btn)b.addEventListener('click',()=>{sec.hidden=true;btn.classList.remove('on');});});
btn.onclick=async()=>{for(const v of['setup','login','test','review','classes'])$('v-'+v).hidden=true;
  document.querySelectorAll('#nav [data-view]').forEach(b=>b.classList.toggle('on',b===btn));sec.hidden=false;msg('');
  fillClasses();await load();};
function fillClasses(){const keep=$('rp-class').value;$('rp-class').innerHTML=classes.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('');if(keep)$('rp-class').value=keep;}
$('rp-class').onchange=load;$('rp-refresh').onclick=load;

async function load(){
  cls=$('rp-class').value;if(!cls){$('rp-overview').innerHTML='<p>Add a class first.</p>';return;}
  msg('Loading…');
  const r=await sb.from('tests').select('id,student_id,passage_title,passage_text,teacher_marks,created_at,audio_path').eq('class_id',cls).order('created_at',{ascending:true}).limit(5000);
  if(r.error){msg('Could not load tests.');return;}msg('');
  tests=r.data.map(t=>({...t,score:score(t),level:titleToLevel.get(t.passage_title)||null}));
  drawOverview();if(student&&students.some(s=>s.id===student&&s.class_id===cls))drawCard(student);else $('rp-card').hidden=true;
}
function latestByLevel(list){const m=new Map();for(const t of list)if(t.level&&t.score!=null)m.set(t.level.id,t);return m;}
function holding(byLevel){for(const l of LEVELS){const t=byLevel.get(l.id);if(!t||t.score<PASSING)return l;}return null;}

function drawOverview(){
  const kids=students.filter(s=>s.class_id===cls);
  const head=`<tr><th>Student</th><th>Holding at</th>${LEVELS.map(l=>`<th title="${esc(l.d)}">${esc(l.n==='סופי'?'ס':l.n)}</th>`).join('')}<th>Last test</th></tr>`;
  const rows=kids.map(s=>{const mine=tests.filter(t=>t.student_id===s.id),by=latestByLevel(mine),h=holding(by);
    const last=mine[mine.length-1];
    return `<tr class="click" data-sid="${s.id}"><td><b>${esc(s.name)}</b></td><td>${h?'דרגא '+esc(h.n):'✓ all'}</td>`+
      LEVELS.map(l=>{const t=by.get(l.id);if(!t)return '<td></td>';const[,c]=statusOf(t.score);
        return `<td><span class="rp-cell rp-${c}" title="${fmtDate(t.created_at)}">${t.score}</span></td>`;}).join('')+
      `<td>${last?fmtDate(last.created_at):'—'}</td></tr>`;}).join('');
  $('rp-overview').innerHTML=kids.length?`<table class="rp-grid">${head}${rows}</table>`:'<p>No students in this class.</p>';
}
$('rp-overview').onclick=e=>{const tr=e.target.closest('tr[data-sid]');if(tr)drawCard(tr.dataset.sid);};

function drawCard(sid){
  student=sid;const s=students.find(x=>x.id===sid),c=classes.find(x=>x.id===s?.class_id);
  const mine=tests.filter(t=>t.student_id===sid),by=latestByLevel(mine),h=holding(by);
  const best=new Map();for(const t of mine)if(t.level&&t.score!=null&&(!best.has(t.level.id)||t.score>best.get(t.level.id)))best.set(t.level.id,t.score);
  const passed=LEVELS.filter(l=>(by.get(l.id)?.score??-1)>=PASSING).length;
  const scored=mine.filter(t=>t.score!=null),avg=scored.length?Math.round(scored.reduce((a,t)=>a+t.score,0)/scored.length):null;
  const recent=scored.slice(-5),trend=recent.length>1?recent[recent.length-1].score-recent[0].score:0;
  // mistake patterns
  const nk={},lt={};let miss=0;for(const t of mine){const d=mistakeDetails(t);d.nikud.forEach(n=>nk[n]=(nk[n]||0)+1);d.letter.forEach(x=>lt[x]=(lt[x]||0)+1);miss+=d.missing;}
  const top=(o,k)=>Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,k);
  const nkTop=top(nk,4),ltTop=top(lt,4);
  const skills=LEVELS.map(l=>{const t=by.get(l.id),[label,cl]=statusOf(t?.score);
    return `<tr><td><b>${esc(l.n)}</b></td><td>${esc(l.d)} <span class="rp-he">${l.ex!=='—'?esc(l.ex):''}</span></td>
      <td><span class="rp-chip rp-${cl}">${label}</span></td><td>${t?t.score+'%':''}${best.get(l.id)!=null&&best.get(l.id)!==t?.score?` (best ${best.get(l.id)}%)`:''}</td><td>${t?fmtDate(t.created_at):''}</td></tr>`;}).join('');
  const rows=mine.slice(-12).reverse().map(t=>{const d=mistakeDetails(t),[label,cl]=statusOf(t.score);
    return `<tr><td>${fmtDate(t.created_at)}</td><td class="${t.level?'':'rp-he'}">${esc(t.passage_title)}</td><td><span class="rp-chip rp-${cl}">${t.score!=null?t.score+'%':'—'}</span></td>
      <td>${d.nikud.length} nikud · ${d.letter.length} letter · ${d.missing} missing</td>
      <td class="no-print"><button class="btn rp-small" type="button" data-ws="${t.id}">Worksheet</button></td></tr>
      <tr id="ws-${t.id}" hidden><td colspan="5" class="rp-ws"></td></tr>`;}).join('');
  $('rp-card').innerHTML=`
    <div class="rp-head"><div><h2 style="margin:0">${esc(s?.name||'')}</h2><p class="muted" style="margin:2px 0">${esc(c?.name||'')} · Kriah report · ${fmtDate(Date.now())}</p></div>
      <div class="no-print" style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" type="button" data-share-report="1">Copy link for parents</button>
      <button class="btn primary" type="button" onclick="window.print()">Print / Save as PDF</button></div></div>
    <p class="rp-big">${h?`Now working on: דרגא ${esc(h.n)}${h.p?' · '+esc(h.p):''} — ${esc(h.d)}`:'All dargas passed ✓'}</p>
    <div class="rp-bar" title="${passed} of ${LEVELS.length}"><i style="width:${Math.round(100*passed/LEVELS.length)}%"></i></div>
    <p class="muted" style="margin:0">${passed} of ${LEVELS.length} dargas passed</p>
    <div class="rp-cards">
      <div><b>${mine.length}</b>tests taken</div>
      <div><b>${avg!=null?avg+'%':'—'}</b>average accuracy</div>
      <div><b>${recent.length>1?(trend>0?'▲ ':trend<0?'▼ ':'')+Math.abs(trend)+' pts':'—'}</b>trend (last ${recent.length} tests)</div>
      <div><b>${mine.length?fmtDate(mine[mine.length-1].created_at):'—'}</b>last test</div></div>
    <h3 style="font-size:1rem;margin:14px 0 4px">What to practice</h3>
    <p style="margin:0">${nkTop.length?'Nikud mistakes: '+nkTop.map(([n,k])=>`<b>${esc(n)}</b> ×${k}`).join(', ')+'. ':''}${ltTop.length?'Letter mistakes: '+ltTop.map(([n,k])=>`<b class="rp-he">${esc(n)}</b> ×${k}`).join(', ')+'. ':''}${miss?`Skipped letters: ${miss}.`:''}${!nkTop.length&&!ltTop.length&&!miss?'No mistakes recorded yet.':''}</p>
    <h3 style="font-size:1rem;margin:16px 0 4px">Skills</h3>
    <div class="scroll"><table><tr><th>Darga</th><th>Skill</th><th>Status</th><th>Score</th><th>Tested</th></tr>${skills}</table></div>
    <h3 style="font-size:1rem;margin:16px 0 4px">Recent tests</h3>
    <div class="scroll"><table><tr><th>Date</th><th>Read</th><th>Score</th><th>Mistakes</th><th class="no-print"></th></tr>${rows||'<tr><td colspan="5">No tests yet.</td></tr>'}</table></div>`;
  card={name:s?.name||'',cls:c?.name||'',holding:h?`דרגא ${h.n}${h.p?' · '+h.p:''} — ${h.d}`:'All dargas passed',passed,total:LEVELS.length,avg,
    skills:LEVELS.map(l=>{const t=by.get(l.id);return{n:l.n,d:l.d,ex:l.ex,st:statusOf(t?.score)[0],sc:t?.score??null};}),tests:mine};
  $('rp-card').hidden=false;$('rp-card').scrollIntoView({behavior:'smooth'});
}

// ---- Worksheets (marked passage + recording) and parent links ----
function testPayload(t,audio){const d=mistakeDetails(t);
  return{date:t.created_at,title:t.passage_title,score:t.score,text:t.passage_text,marks:(t.teacher_marks||[]).map(m=>[m.w,m.c,m.type[0]]),
    mk:[d.nikud.length,d.letter.length,d.missing],audio:audio||null};}
async function signed(path,secs){if(!path)return null;const r=await sb.storage.from('recordings').createSignedUrl(path,secs);return r.data?.signedUrl||null;}
async function encode(obj){const bytes=new TextEncoder().encode(JSON.stringify(obj));
  const z=new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer());
  let s='';for(const b of z)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
async function share(obj){
  const url=new URL('share.html',location.href).href+'#'+await encode(obj);
  try{await navigator.clipboard.writeText(url);msg('Parent link copied ✓ Paste it into an email or WhatsApp. Recordings in the link work for 30 days.');}
  catch{prompt('Copy this link for the parents:',url);}
}
const MONTH=60*60*24*30;
$('rp-card').addEventListener('click',async e=>{
  const ws=e.target.closest('[data-ws]'),sh=e.target.closest('[data-share-test]'),rp=e.target.closest('[data-share-report]');
  if(ws){const row=$('ws-'+ws.dataset.ws),t=tests.find(x=>x.id===ws.dataset.ws);row.hidden=!row.hidden;ws.textContent=row.hidden?'Worksheet':'Hide';
    const cell=row.querySelector('td');if(row.hidden||cell.dataset.done)return;cell.dataset.done='1';
    cell.innerHTML=`<ul class="legend"><li><i style="background:var(--yel-bg)"></i>Letter mistake</li><li><i style="background:var(--miss-bg)"></i>Nikud mistake</li><li><i style="background:var(--blue-bg)"></i>Skipped</li></ul>
      <div class="verse" dir="rtl" lang="he"></div><audio controls preload="none"></audio>
      <div class="rec-row no-print"><button class="btn rp-small" type="button" data-share-test="${t.id}">Copy link for parents</button></div>`;
    drawVerse(cell.querySelector('.verse'),t.passage_text,listToMarks(t.teacher_marks));
    const u=await signed(t.audio_path,3600);if(u)cell.querySelector('audio').src=u;else cell.querySelector('audio').hidden=true;return;}
  if(sh){const t=tests.find(x=>x.id===sh.dataset.shareTest);msg('Preparing link…');
    await share({v:1,name:card.name,cls:card.cls,made:Date.now(),tests:[testPayload(t,await signed(t.audio_path,MONTH))]});return;}
  if(rp&&card){msg('Preparing link…');const recent=card.tests.slice(-5).reverse(),list=[];
    for(const t of recent)list.push(testPayload(t,await signed(t.audio_path,MONTH)));
    await share({v:1,name:card.name,cls:card.cls,made:Date.now(),holding:card.holding,passed:card.passed,total:card.total,avg:card.avg,skills:card.skills,tests:list});}
});
})();
