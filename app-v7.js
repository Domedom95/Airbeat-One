const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const get=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}};
const set=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const packKey='airbeat2027_personal_packing_v1';

function nav(page){
  $$('.page').forEach(x=>x.classList.toggle('active',x.dataset.page===page));
  $$('nav button').forEach(x=>x.classList.toggle('active',x.dataset.nav===page));
  scrollTo({top:0,behavior:'smooth'});
  if(page==='timetable')loadTimetable();
  if(page==='crew')loadCrew();
}
$$('[data-nav]').forEach(x=>x.onclick=()=>nav(x.dataset.nav));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

// Personal packing list
const defaults=['Ticket / Ausweis','Zelt + Heringe','Schlafsack','Isomatte / Luftmatratze','Powerbank + Ladekabel','Regenjacke / Poncho','Sonnencreme','Trinkflasche','Hygieneartikel','Gehörschutz'];
let packing=get(packKey,defaults.map((text,i)=>({id:i+1,text,done:false})));
function renderPacking(){
 const box=$('#packingList');box.innerHTML='';
 packing.forEach(item=>{
  const row=document.createElement('div');row.className='pack'+(item.done?' done':'');
  row.innerHTML=`<input type="checkbox" ${item.done?'checked':''}><span class="label">${esc(item.text)}</span><button class="del">✕</button>`;
  row.querySelector('input').onchange=e=>{item.done=e.target.checked;set(packKey,packing);renderPacking()};
  row.querySelector('button').onclick=()=>{packing=packing.filter(x=>x.id!==item.id);set(packKey,packing);renderPacking()};
  box.appendChild(row);
 });
 const done=packing.filter(x=>x.done).length,total=packing.length,p=total?Math.round(done/total*100):0;
 $('#progressText').textContent=`${done} von ${total} erledigt`;
 $('#progressPct').textContent=p+'%';
 $('#progressBar').style.width=p+'%';
}
$('#packForm').onsubmit=e=>{
  e.preventDefault();
  const i=$('#packInput'),t=i.value.trim();
  if(!t)return;
  packing.push({id:Date.now(),text:t,done:false});
  set(packKey,packing);
  i.value='';
  renderPacking();
};
$('#resetPacking').onclick=()=>{
  packing=defaults.map((text,i)=>({id:i+1,text,done:false}));
  set(packKey,packing);
  renderPacking();
};

// Shared Supabase data
let db=null;
const configured=window.AIRBEAT_SUPABASE_URL && window.AIRBEAT_SUPABASE_ANON_KEY;
if(configured && window.supabase){
  db=window.supabase.createClient(window.AIRBEAT_SUPABASE_URL,window.AIRBEAT_SUPABASE_ANON_KEY);
  $('#syncStatus').textContent='✓ Synchronisierung ist eingerichtet.';
  $('#syncStatus').style.color='#9ef1de';
}else{
  $('#syncStatus').textContent='Synchronisierung ist vorbereitet, aber Supabase ist noch nicht verbunden.';
}

async function loadTimetable(){
 const box=$('#timeline');
 if(!db){
   box.innerHTML='<div class="sync-status">Supabase ist noch nicht verbunden.</div>';
   return;
 }
 box.innerHTML='<div class="sync-status">Lade gemeinsame Einträge …</div>';
 const {data,error}=await db.from('timetable').select('*').order('day').order('time');
 if(error){
   box.innerHTML=`<div class="sync-status">Fehler: ${esc(error.message)}</div>`;
   return;
 }
 box.innerHTML='';
 (data||[]).forEach(ev=>{
   const r=document.createElement('div');
   r.className='event';
   r.innerHTML=`<span class="time">${esc((ev.time||'').slice(0,5))}</span><div><strong>${esc(ev.act)}</strong><small>${esc(ev.day)}</small><div class="meta">eingetragen von ${esc(ev.name||'Crew')}</div></div><button class="del" title="Löschen">✕</button>`;
   r.querySelector('button').onclick=async()=>{await db.from('timetable').delete().eq('id',ev.id);loadTimetable()};
   box.appendChild(r);
 });
 if(!(data||[]).length) box.innerHTML='<div class="sync-status">Noch keine gemeinsamen Einträge.</div>';
}
$('#timeForm').onsubmit=async e=>{
 e.preventDefault();
 if(!db){alert('Supabase ist noch nicht eingerichtet.');return}
 const row={day:$('#timeDay').value.trim(),time:$('#timeHour').value,act:$('#timeAct').value.trim(),name:$('#timeName').value.trim()};
 const {error}=await db.from('timetable').insert(row);
 if(error){alert(error.message);return}
 e.target.reset();
 loadTimetable();
};
$('#refreshTimetable').onclick=loadTimetable;

async function loadCrew(){
 if(!db)return;
 const {data,error}=await db.from('crew_settings').select('*').eq('id',1).maybeSingle();
 if(!error && data){
   $('#meetingPoint').value=data.meeting_point||'';
   $('#crewNotes').value=data.notes||'';
 }
}
$('#saveCrew').onclick=async()=>{
 if(!db){alert('Supabase ist noch nicht eingerichtet.');return}
 const row={id:1,meeting_point:$('#meetingPoint').value,notes:$('#crewNotes').value,updated_at:new Date().toISOString()};
 const {error}=await db.from('crew_settings').upsert(row);
 if(error){alert(error.message);return}
 alert('Für alle gespeichert.');
};
$('#refreshCrew').onclick=loadCrew;

renderPacking();

// Service worker - config.js is intentionally NOT precached to avoid stale Supabase config.
if('serviceWorker' in navigator){
  window.addEventListener('load',async()=>{
    try{
      for(const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
      await navigator.serviceWorker.register('./service-worker-v7.js?v=7');
    }catch(e){console.log(e)}
  });
}
