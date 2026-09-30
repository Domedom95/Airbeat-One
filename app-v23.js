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
  if(page==='chat')loadChat();
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
  loadMeetingPoints();
}
$('#refreshCrew').onclick=loadCrew;

// ---------- Shared Meeting Points ----------
async function loadMeetingPoints(){
  const box=$('#meetingList');
  if(!box)return;
  if(!db){
    box.innerHTML='<div class="meeting-empty">Supabase ist noch nicht verbunden.</div>';
    return;
  }
  const {data,error}=await db.from('meeting_points').select('*').order('meeting_time',{ascending:true});
  if(error){
    box.innerHTML=`<div class="meeting-empty">Fehler: ${esc(error.message)}</div>`;
    return;
  }
  box.innerHTML='';
  (data||[]).forEach(m=>{
    const item=document.createElement('article');
    item.className='meeting-item';
    const dt=new Date(m.meeting_time);
    const when=dt.toLocaleString('de-DE',{weekday:'short',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
    item.innerHTML=`
      <div class="meeting-icon">📍</div>
      <div class="meeting-main">
        <strong>${esc(m.title)}</strong>
        <div class="meeting-meta">
          <span>${esc(m.location)}</span>
          <span>🕒 ${esc(when)}</span>
          <span>👤 ${esc(m.created_by||'Crew')}</span>
        </div>
        ${m.note ? `<div class="meeting-note">${esc(m.note)}</div>` : ''}
      </div>
      <button class="meeting-delete" title="Treffpunkt löschen" aria-label="Treffpunkt löschen">🗑️</button>`;
    item.querySelector('.meeting-delete').onclick=async()=>{
      const ok=confirm(`Treffpunkt "${m.title}" wirklich löschen?`);
      if(!ok)return;
      const {error}=await db.from('meeting_points').delete().eq('id',m.id);
      if(error){alert(error.message);return}
      loadMeetingPoints();
    };
    box.appendChild(item);
  });
  if(!(data||[]).length){
    box.innerHTML='<div class="meeting-empty">Noch keine Treffpunkte eingetragen.</div>';
  }
}

$('#meetingForm').addEventListener('submit',async e=>{
  e.preventDefault();
  if(!db){alert('Supabase ist noch nicht verbunden.');return}
  const title=$('#meetingTitle').value.trim();
  const location=$('#meetingLocation').value.trim();
  const meetingTime=$('#meetingTime').value;
  const createdBy=$('#meetingName').value.trim();
  const note=$('#meetingNote').value.trim();
  if(!title||!location||!meetingTime||!createdBy)return;

  localStorage.setItem('airbeatMeetingName',createdBy);

  const {error}=await db.from('meeting_points').insert({
    title,
    location,
    meeting_time:new Date(meetingTime).toISOString(),
    created_by:createdBy,
    note:note||null
  });
  if(error){alert(error.message);return}
  $('#meetingTitle').value='';
  $('#meetingLocation').value='';
  $('#meetingTime').value='';
  $('#meetingNote').value='';
  loadMeetingPoints();
});

$('#meetingName').value=localStorage.getItem('airbeatMeetingName')||'';

renderPacking();

// Service worker - config.js is intentionally NOT precached to avoid stale Supabase config.
if('serviceWorker' in navigator){
  window.addEventListener('load',async()=>{
    try{
      for(const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
      await navigator.serviceWorker.register('./service-worker-v23.js?v=23');
    }catch(e){console.log(e)}
  });
}


// ---------- Simple Crew Code Gate ----------
// NOTE: This is only a lightweight client-side gate, not strong security.
const CREW_CODE = "123456";
const loginGate = document.getElementById('loginGate');
const loginForm = document.getElementById('loginForm');
const loginCode = document.getElementById('loginCode');
const loginError = document.getElementById('loginError');

function unlockApp(){
  sessionStorage.setItem('airbeatCrewUnlocked','1');
  loginGate.classList.add('hidden');
  document.body.classList.remove('locked');
}
if(sessionStorage.getItem('airbeatCrewUnlocked') === '1'){
  unlockApp();
}else{
  document.body.classList.add('locked');
}
loginForm.addEventListener('submit',e=>{
  e.preventDefault();
  if(loginCode.value.trim() === CREW_CODE){
    loginError.textContent='';
    unlockApp();
  }else{
    loginError.textContent='Falscher Crew-Code.';
    loginCode.select();
  }
});

// ---------- Countdown ----------
const FESTIVAL_START = new Date('2027-07-07T00:00:00+02:00');
function updateCountdown(){
  const now = new Date();
  let diff = FESTIVAL_START - now;
  if(diff < 0) diff = 0;
  const sec = Math.floor(diff/1000);
  const days = Math.floor(sec/86400);
  const hours = Math.floor((sec%86400)/3600);
  const mins = Math.floor((sec%3600)/60);
  const secs = sec%60;
  document.getElementById('cdDays').textContent=days;
  document.getElementById('cdHours').textContent=String(hours).padStart(2,'0');
  document.getElementById('cdMinutes').textContent=String(mins).padStart(2,'0');
  document.getElementById('cdSeconds').textContent=String(secs).padStart(2,'0');
}
updateCountdown();
setInterval(updateCountdown,1000);

// ---------- Shared Crew Chat ----------
let chatTimer = null;
async function loadChat(){
  const box = document.getElementById('chatList');
  if(!db){
    box.innerHTML='<div class="sync-status">Supabase ist noch nicht verbunden.</div>';
    return;
  }
  const {data,error}=await db.from('chat_messages').select('*').order('created_at',{ascending:false}).limit(80);
  if(error){
    box.innerHTML=`<div class="sync-status">Fehler: ${esc(error.message)}</div>`;
    return;
  }
  box.innerHTML='';
  (data||[]).slice().reverse().forEach(m=>{
    const item=document.createElement('article');
    item.className='chat-msg';
    const dt = new Date(m.created_at);
    const cleanName = (m.name||'Crew').trim();
    const initial = esc((cleanName[0]||'C').toUpperCase());
    item.innerHTML=`<div class="chat-avatar">${initial}</div><div class="chat-body"><header><strong>${esc(cleanName)}</strong><time>${dt.toLocaleString('de-DE',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</time></header><p>${esc(m.message)}</p></div>`;
    box.appendChild(item);
  });
  box.scrollTop = box.scrollHeight;
}
document.getElementById('chatForm').addEventListener('submit',async e=>{
  e.preventDefault();
  if(!db){alert('Supabase ist noch nicht verbunden.');return}
  const name=document.getElementById('chatName').value.trim();
  const message=document.getElementById('chatMessage').value.trim();
  if(!name||!message)return;
  localStorage.setItem('airbeatChatName',name);
  const {error}=await db.from('chat_messages').insert({name,message});
  if(error){alert(error.message);return}
  document.getElementById('chatMessage').value='';
  loadChat();
});
document.getElementById('chatName').value=localStorage.getItem('airbeatChatName')||'';
document.getElementById('refreshChat').addEventListener('click',loadChat);

// lightweight polling while app is open
setInterval(()=>{
  const chatPage=document.querySelector('.page[data-page="chat"]');
  if(chatPage?.classList.contains('active')) loadChat();
},5000);
