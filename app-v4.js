const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const get=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}};
const set=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const key='airbeat2027_personal_packing_v1';

function nav(page){$$('.page').forEach(x=>x.classList.toggle('active',x.dataset.page===page));$$('nav button').forEach(x=>x.classList.toggle('active',x.dataset.nav===page));scrollTo({top:0,behavior:'smooth'})}
$$('[data-nav]').forEach(x=>x.onclick=()=>nav(x.dataset.nav));

const defaults=['Ticket / Ausweis','Zelt + Heringe','Schlafsack','Isomatte / Luftmatratze','Powerbank + Ladekabel','Regenjacke / Poncho','Sonnencreme','Trinkflasche','Hygieneartikel','Gehörschutz'];
let packing=get(key,defaults.map((text,i)=>({id:i+1,text,done:false})));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

function renderPacking(){
 const box=$('#packingList');box.innerHTML='';
 packing.forEach(item=>{
   const row=document.createElement('div');row.className='pack'+(item.done?' done':'');
   row.innerHTML=`<input type="checkbox" ${item.done?'checked':''}><span class="label">${esc(item.text)}</span><button class="del">✕</button>`;
   row.querySelector('input').onchange=e=>{item.done=e.target.checked;set(key,packing);renderPacking()};
   row.querySelector('button').onclick=()=>{packing=packing.filter(x=>x.id!==item.id);set(key,packing);renderPacking()};
   box.appendChild(row);
 });
 const done=packing.filter(x=>x.done).length,total=packing.length,p=total?Math.round(done/total*100):0;
 $('#progressText').textContent=`${done} von ${total} erledigt`;$('#progressPct').textContent=p+'%';$('#progressBar').style.width=p+'%';
}
$('#packForm').onsubmit=e=>{e.preventDefault();const i=$('#packInput'),t=i.value.trim();if(!t)return;packing.push({id:Date.now(),text:t,done:false});set(key,packing);i.value='';renderPacking()};
$('#resetPacking').onclick=()=>{packing=defaults.map((text,i)=>({id:i+1,text,done:false}));set(key,packing);renderPacking()};

let events=get('airbeat2027_events_v1',[{id:1,day:'Freitag',time:'18:00',act:'Gemeinsamer Treffpunkt'}]);
function renderEvents(){
 const box=$('#timeline');box.innerHTML='';
 events.forEach(ev=>{const r=document.createElement('div');r.className='event';r.innerHTML=`<span class="time">${esc(ev.time)}</span><div><strong>${esc(ev.act)}</strong><small>${esc(ev.day)}</small></div><button class="del">✕</button>`;r.querySelector('button').onclick=()=>{events=events.filter(x=>x.id!==ev.id);set('airbeat2027_events_v1',events);renderEvents()};box.appendChild(r)});
}
$('#timeForm').onsubmit=e=>{e.preventDefault();const day=$('#timeDay').value.trim(),time=$('#timeHour').value,act=$('#timeAct').value.trim();if(!day||!time||!act)return;events.push({id:Date.now(),day,time,act});set('airbeat2027_events_v1',events);e.target.reset();renderEvents()};

$('#meetingPoint').value=localStorage.getItem('airbeat2027_meeting')||'';$('#crewNotes').value=localStorage.getItem('airbeat2027_notes')||'';
$('#meetingPoint').oninput=e=>localStorage.setItem('airbeat2027_meeting',e.target.value);$('#crewNotes').oninput=e=>localStorage.setItem('airbeat2027_notes',e.target.value);

renderPacking();renderEvents();
if('serviceWorker'in navigator){window.addEventListener('load',async()=>{try{for(const r of await navigator.serviceWorker.getRegistrations())await r.unregister();await navigator.serviceWorker.register('./service-worker-v4.js?v=4')}catch(e){console.log(e)}})}
