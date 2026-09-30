const qs=s=>document.querySelector(s), qsa=s=>[...document.querySelectorAll(s)];
const store={
  get(k,f){try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}},
  set(k,v){localStorage.setItem(k,JSON.stringify(v))}
};

function nav(page){
  qsa('.page').forEach(el=>el.classList.toggle('active',el.dataset.page===page));
  qsa('.nav-item').forEach(el=>el.classList.toggle('active',el.dataset.nav===page));
  scrollTo({top:0,behavior:'smooth'});
}
qsa('[data-nav]').forEach(el=>el.addEventListener('click',()=>nav(el.dataset.nav)));

const defaults=[
  'Ticket / Ausweis','Zelt + Heringe','Schlafsack','Isomatte / Luftmatratze',
  'Powerbank + Ladekabel','Regenjacke / Poncho','Sonnencreme','Trinkflasche',
  'Hygieneartikel','Gehörschutz'
];
let packing=store.get('airbeat_v3_packing',defaults.map((text,i)=>({id:i+1,text,done:false})));

function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function renderPacking(){
  const box=qs('#packingList'); box.innerHTML='';
  packing.forEach(item=>{
    const row=document.createElement('div');
    row.className='pack-item'+(item.done?' done':'');
    row.innerHTML=`<input type="checkbox" ${item.done?'checked':''}><span class="pack-label">${esc(item.text)}</span><button class="delete-btn" aria-label="Löschen">✕</button>`;
    row.querySelector('input').onchange=e=>{item.done=e.target.checked;store.set('airbeat_v3_packing',packing);renderPacking()};
    row.querySelector('button').onclick=()=>{packing=packing.filter(x=>x.id!==item.id);store.set('airbeat_v3_packing',packing);renderPacking()};
    box.appendChild(row);
  });
  const done=packing.filter(x=>x.done).length, total=packing.length, pct=total?Math.round(done/total*100):0;
  qs('#packProgressText').textContent=`${done} von ${total} erledigt`;
  qs('#packPercent').textContent=`${pct}%`;
  qs('#packProgressBar').style.width=pct+'%';
}
qs('#packForm').onsubmit=e=>{
  e.preventDefault(); const input=qs('#packInput'), text=input.value.trim(); if(!text)return;
  packing.push({id:Date.now(),text,done:false}); store.set('airbeat_v3_packing',packing); input.value=''; renderPacking();
};
qs('#resetPacking').onclick=()=>{
  packing=defaults.map((text,i)=>({id:i+1,text,done:false}));store.set('airbeat_v3_packing',packing);renderPacking();
};

let events=store.get('airbeat_v3_events',[
  {id:1,day:'Freitag',time:'18:00',act:'Gemeinsamer Treffpunkt'}
]);
function renderEvents(){
  const box=qs('#timeline');box.innerHTML='';
  if(!events.length){
    box.innerHTML='<div class="info-card"><p>Noch keine Einträge. Trag euren ersten Act oder Treffpunkt ein.</p></div>'; return;
  }
  events.forEach(ev=>{
    const row=document.createElement('div');row.className='event-item';
    row.innerHTML=`<div class="event-time">${esc(ev.time)}</div><div><strong>${esc(ev.act)}</strong><small>${esc(ev.day)}</small></div><button class="delete-btn">✕</button>`;
    row.querySelector('button').onclick=()=>{events=events.filter(x=>x.id!==ev.id);store.set('airbeat_v3_events',events);renderEvents()};
    box.appendChild(row);
  });
}
qs('#timeForm').onsubmit=e=>{
  e.preventDefault();
  const day=qs('#timeDay').value.trim(),time=qs('#timeHour').value,act=qs('#timeAct').value.trim();
  if(!day||!time||!act)return;
  events.push({id:Date.now(),day,time,act});store.set('airbeat_v3_events',events);e.target.reset();renderEvents();
};

qs('#meetingPoint').value=localStorage.getItem('airbeat_v3_meeting')||'';
qs('#crewNotes').value=localStorage.getItem('airbeat_v3_notes')||'';
qs('#meetingPoint').oninput=e=>localStorage.setItem('airbeat_v3_meeting',e.target.value);
qs('#crewNotes').oninput=e=>localStorage.setItem('airbeat_v3_notes',e.target.value);

renderPacking(); renderEvents();

if('serviceWorker' in navigator){
  window.addEventListener('load',async()=>{
    try{
      const regs=await navigator.serviceWorker.getRegistrations();
      for(const r of regs){ if(r.active?.scriptURL.includes('service-worker.js')) await r.unregister(); }
      await navigator.serviceWorker.register('./service-worker-v3.js?v=3');
    }catch(e){ console.log(e); }
  });
}
