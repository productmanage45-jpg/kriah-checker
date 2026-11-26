// ===== Teacher access: admins see everything; teachers see only their assigned classes =====
(function(){
window.IS_ADMIN=true;
// Called after sign-in. The database enforces access; this only hides admin tools from teachers.
window.applyRole=async function(){
  const r=await sb.rpc('is_admin');
  window.IS_ADMIN=r.error?true:!!r.data;           // before the database update runs, behave as before
  const admin=window.IS_ADMIN;
  for(const sel of['[data-view=classes]','[data-view=teachers]'])document.querySelectorAll(sel).forEach(b=>b.hidden=!admin);
  for(const id of['r-ai','r-ai-note','r-stats-box','r-resetai'])if($(id))$(id).style.display=admin?'':'none';
  const showAi=$('r-showai')?.closest('label');if(showAi)showAi.style.display=admin?'':'none';
  if(!admin&&$('r-showai'))$('r-showai').checked=false;
  if(!admin)document.querySelectorAll('#r-table th:nth-child(5),#r-table td:nth-child(5)').forEach(c=>c.style.display='none');
  if(!admin&&!classes.length)msg('No classes are assigned to your account yet. Ask the kriah coordinator to give you access.');
};
// Keep AI columns hidden for teachers whenever the review list redraws.
new MutationObserver(()=>{if(!window.IS_ADMIN)document.querySelectorAll('#r-table th:nth-child(5),#r-table td:nth-child(5)').forEach(c=>c.style.display='none');})
  .observe($('r-table'),{childList:true,subtree:true});
const origCompare=$('r-compare');if(origCompare)new MutationObserver(()=>{if(!window.IS_ADMIN&&origCompare.textContent)origCompare.textContent='';}).observe(origCompare,{childList:true,characterData:true,subtree:true});

// ---- Admin: Teachers tab ----
const btn=document.createElement('button');btn.className='btn';btn.type='button';btn.dataset.view='teachers';btn.textContent='Teachers';btn.hidden=true;
$('signout').before(btn);
const sec=document.createElement('section');sec.id='v-teachers';sec.hidden=true;
sec.innerHTML=`<div class="card">
    <h2 style="margin-top:0;font-size:1.05rem">Give a teacher access</h2>
    <p class="muted">Type the teacher's login email and tick their classes. They will only see, test and review those classes. Create their login first in Supabase (Authentication → Users → Add user).</p>
    <label class="f" for="tc-email">Teacher email</label><input id="tc-email" type="email" placeholder="teacher@oholeitorah.com" style="width:min(100%,380px)">
    <div id="tc-classes" style="display:flex;flex-wrap:wrap;gap:6px 18px;margin:12px 0"></div>
    <button class="btn primary" id="tc-save" type="button">Save access</button>
  </div>
  <div class="card scroll"><h2 style="margin-top:0;font-size:1.05rem">Who can see what</h2><table id="tc-table"></table></div>
  <div class="card"><h2 style="margin-top:0;font-size:1.05rem">Admins</h2>
    <p class="muted">Admins see every class, all marks and the AI results, and can manage classes and teachers.</p>
    <div id="tc-admins"></div>
    <div class="row" style="margin-top:8px"><input id="tc-admin-email" type="email" placeholder="email"><button class="btn" id="tc-admin-add" type="button">Add admin</button></div></div>`;
$('v-classes').after(sec);
document.querySelectorAll('#nav [data-view]').forEach(b=>{if(b!==btn)b.addEventListener('click',()=>{sec.hidden=true;btn.classList.remove('on');});});
btn.onclick=async()=>{for(const v of['setup','login','test','review','classes'])$('v-'+v).hidden=true;const rp=$('v-reports');if(rp)rp.hidden=true;
  document.querySelectorAll('#nav [data-view]').forEach(b=>b.classList.toggle('on',b===btn));sec.hidden=false;msg('');await draw();};

let access=[];
async function draw(){
  await loadRoster();
  const a=await sb.from('class_access').select('*'),ad=await sb.from('admins').select('*');
  if(a.error){msg('Run the database update (update-access.sql) first.');return;}
  access=a.data;
  $('tc-classes').innerHTML=classes.map(c=>`<label style="display:flex;gap:6px;align-items:center"><input type="checkbox" value="${c.id}" style="width:20px;height:20px;min-height:0"> ${esc(c.name)}</label>`).join('');
  const byEmail={};for(const x of access)(byEmail[x.email]??=[]).push(classes.find(c=>c.id===x.class_id)?.name||'?');
  const emails=Object.keys(byEmail).sort();
  $('tc-table').innerHTML='<tr><th>Teacher</th><th>Classes</th><th></th></tr>'+(emails.length?emails.map(e=>`<tr><td><b>${esc(e)}</b></td><td>${byEmail[e].map(esc).join(', ')}</td>
    <td><button class="btn" style="padding:3px 10px;font-size:.85rem" data-edit="${esc(e)}" type="button">Edit</button> <button class="btn no" style="padding:3px 10px;font-size:.85rem" data-remove="${esc(e)}" type="button">Remove</button></td></tr>`).join(''):'<tr><td colspan="3" class="muted">No teachers assigned yet.</td></tr>');
  $('tc-admins').innerHTML=(ad.data||[]).map(x=>`<span style="display:inline-flex;gap:6px;align-items:center;margin:0 12px 6px 0"><b>${esc(x.email)}</b> <button class="btn" style="padding:2px 8px;font-size:.8rem" data-unadmin="${esc(x.email)}" type="button">remove</button></span>`).join('');
}
function fillForm(email){$('tc-email').value=email;const mine=new Set(access.filter(x=>x.email===email).map(x=>x.class_id));
  $('tc-classes').querySelectorAll('input').forEach(i=>i.checked=mine.has(i.value));$('tc-email').scrollIntoView({behavior:'smooth'});}
$('tc-save').onclick=async()=>{
  const email=$('tc-email').value.trim().toLowerCase();if(!/^\S+@\S+\.\S+$/.test(email)){msg('Type the teacher\'s email.');return;}
  const want=[...$('tc-classes').querySelectorAll('input:checked')].map(i=>i.value);
  const del=await sb.from('class_access').delete().eq('email',email);if(del.error){msg('Could not save access.');return;}
  if(want.length){const ins=await sb.from('class_access').insert(want.map(class_id=>({email,class_id})));if(ins.error){msg('Could not save access.');return;}}
  msg(want.length?`Saved ✓ ${email} can see ${want.length} class${want.length>1?'es':''}.`:`Saved ✓ ${email} has no classes now.`);$('tc-email').value='';await draw();};
sec.addEventListener('click',async e=>{const d=e.target.dataset;
  if(d.edit){fillForm(d.edit);return;}
  if(d.remove){if(!confirm(`Remove all class access for ${d.remove}?`))return;await sb.from('class_access').delete().eq('email',d.remove);msg('Access removed.');await draw();return;}
  if(d.unadmin){const{data:u}=await sb.auth.getUser();if(d.unadmin===u.user?.email?.toLowerCase()&&!confirm('Remove yourself as admin? You will lose access to other classes.'))return;
    await sb.from('admins').delete().eq('email',d.unadmin);await draw();}});
$('tc-admin-add').onclick=async()=>{const email=$('tc-admin-email').value.trim().toLowerCase();if(!/^\S+@\S+\.\S+$/.test(email))return;
  const r=await sb.from('admins').insert({email});msg(r.error?'Could not add admin.':'Admin added ✓');$('tc-admin-email').value='';await draw();};
})();
