// Mobile menu
const toggle=document.querySelector('.menu-toggle'),nav=document.getElementById('nav');
toggle.addEventListener('click',()=>{const o=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',o)});

// Tabs
document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>{
  document.querySelectorAll('.tab').forEach(x=>{x.classList.toggle('active',x===t);x.setAttribute('aria-selected',x===t)});
  document.querySelectorAll('.tab-body').forEach(b=>b.hidden=b.id!==t.dataset.tab);
}));

// Verticals accordion (one open at a time)
document.querySelectorAll('.vertical').forEach(v=>v.querySelector('.v-head').addEventListener('click',()=>{
  const open=!v.classList.contains('open');
  document.querySelectorAll('.vertical').forEach(x=>{x.classList.remove('open');x.querySelector('.v-head').setAttribute('aria-expanded',false)});
  if(open){v.classList.add('open');v.querySelector('.v-head').setAttribute('aria-expanded',true)}
}));

// Projects data -- replace with your real projects
const projects=[
 {t:'Support Copilot',c:'Enterprise AI',d:'LLM-powered assistant that resolves customer tickets and hands off complex cases to agents.',s:'Python · LLMs · AWS'},
 {t:'Demand Forecasting Engine',c:'Enterprise AI',d:'Predictive pipeline that cut inventory overstock for a retail chain.',s:'ML · Airflow · Snowflake'},
 {t:'Field Operations Platform',c:'Software Engineering',d:'Web and mobile app for scheduling, tracking and reporting on field teams.',s:'React · Node.js · PostgreSQL'},
 {t:'Cloud Migration Suite',c:'Software Engineering',d:'Phased move of legacy systems to a scalable cloud architecture.',s:'Docker · Kubernetes · Azure'},
 {t:'AI Adoption Roadmap',c:'Consulting',d:'Strategy and readiness review that prioritised AI use cases by business value.',s:'Strategy · Workshops'},
 {t:'Compliance Data Vault',c:'Security',d:'SOC2-aligned data governance and access controls for a fintech client.',s:'IAM · Encryption · Audit'}
];
const cats=['All',...new Set(projects.map(p=>p.c))];
const filters=document.getElementById('filters'),grid=document.getElementById('grid');
function render(cat){
  filters.innerHTML=cats.map(c=>`<button class="chip${c===cat?' active':''}" data-c="${c}">${c}</button>`).join('');
  grid.innerHTML=projects.filter(p=>cat==='All'||p.c===cat).map(p=>`<article class="card"><span class="tag">${p.c}</span><h3>${p.t}</h3><p>${p.d}</p><span class="stack">${p.s}</span></article>`).join('');
  filters.querySelectorAll('.chip').forEach(b=>b.onclick=()=>render(b.dataset.c));
}
render('All');
