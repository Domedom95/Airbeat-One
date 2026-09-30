const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const defaults = [
  'Festival-Ticket / Ausweis',
  'Zelt + Heringe',
  'Schlafsack',
  'Isomatte / Luftmatratze',
  'Powerbank + Ladekabel',
  'Regenjacke / Poncho',
  'Sonnencreme',
  'Trinkflasche',
  'Hygieneartikel',
  'Gehörschutz'
];

function load(key, fallback){ try{return JSON.parse(localStorage.getItem(key)) ?? fallback}catch{return fallback} }
function save(key, val){ localStorage.setItem(key, JSON.stringify(val)) }

function openView(id){
  $$('.view').forEach(v=>v.classList.toggle('active',v.id===id));
  $$('.navbtn').forEach(b=>b.classList.toggle('active',b.dataset.open===id));
  window.scrollTo({top:0,behavior:'smooth'});
}
$$('[data-open]').forEach(b=>b.addEventListener('click',()=>openView(b.dataset.open)));

let packing = load('airbeatPacking', defaults.map((text,i)=>({id:i+1,text,done:false})));

function renderPacking(){
  const list = $('#packingList');
  list.innerHTML='';
  packing.forEach(item=>{
    const row=document.createElement('div');
    row.className='item'+(item.done?' done':'');
    row.innerHTML=`<input type="checkbox" ${item.done?'checked':''}><span>${escapeHtml(item.text)}</span><button class="delete" aria-label="Löschen">✕</button>`;
    row.querySelector('input').addEventListener('change',e=>{
      item.done=e.target.checked; save('airbeatPacking',packing); renderPacking();
    });
    row.querySelector('.delete').addEventListener('click',()=>{
      packing=packing.filter(x=>x.id!==item.id); save('airbeatPacking',packing); renderPacking();
    });
    list.appendChild(row);
  });
}
$('#packForm').addEventListener('submit',e=>{
  e.preventDefault();
  const input=$('#packInput');
  const text=input.value.trim();
  if(!text)return;
  packing.push({id:Date.now(),text,done:false});
  save('airbeatPacking',packing); input.value=''; renderPacking();
});
$('[data-reset="packing"]').addEventListener('click',()=>{
  packing=defaults.map((text,i)=>({id:i+1,text,done:false}));
  save('airbeatPacking',packing); renderPacking();
});

let events = load('airbeatEvents',[
  {id:1,day:'Freitag',time:'18:00',act:'Gemeinsamer Treffpunkt'},
  {id:2,day:'Samstag',time:'20:30',act:'Lieblings-Act eintragen'}
]);

function renderEvents(){
  const tl=$('#timeline');
  tl.innerHTML='';
  events.sort((a,b)=>(a.day+a.time).localeCompare(b.day+b.time,'de'));
  events.forEach(ev=>{
    const row=document.createElement('div');
    row.className='event';
    row.innerHTML=`<div class="when">${ev.time}</div><div><strong>${escapeHtml(ev.act)}</strong><small>${escapeHtml(ev.day)}</small></div><button aria-label="Löschen">✕</button>`;
    row.querySelector('button').addEventListener('click',()=>{
      events=events.filter(x=>x.id!==ev.id); save('airbeatEvents',events); renderEvents();
    });
    tl.appendChild(row);
  });
}
$('#timeForm').addEventListener('submit',e=>{
  e.preventDefault();
  const day=$('#timeDay').value.trim(), time=$('#timeHour').value, act=$('#timeAct').value.trim();
  if(!day||!time||!act)return;
  events.push({id:Date.now(),day,time,act}); save('airbeatEvents',events);
  e.target.reset(); renderEvents();
});

$('#meetingPoint').value=localStorage.getItem('airbeatMeeting')||'';
$('#crewNotes').value=localStorage.getItem('airbeatNotes')||'';
$('#meetingPoint').addEventListener('input',e=>localStorage.setItem('airbeatMeeting',e.target.value));
$('#crewNotes').addEventListener('input',e=>localStorage.setItem('airbeatNotes',e.target.value));

function escapeHtml(str){return str.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}

renderPacking();
renderEvents();

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js'));
}
