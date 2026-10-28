(function(){
'use strict';

var STORAGE_KEY='tagir_panel_v1';
var STORAGE_STATE='локальный браузер';

var SEED=JSON.parse(document.getElementById('panel-seed-data').textContent);
var state=loadState();
var currentView='overview';
var evidenceFilter={sourceType:'all',level:'all',project:'all'};
var actionHorizonFilter='all';
var directionSearchQuery='';

function loadState(){
  try{
    var raw=localStorage.getItem(STORAGE_KEY);
    if(raw){var s=JSON.parse(raw);if(s&&s.meta&&s.directions&&s.projects){
      var so=JSON.stringify(SEED),st=JSON.stringify(s);
      var out=(so===st)?SEED:s;
      return out;
    }}
  }catch(e){console.warn('loadState parse error',e)}
  return JSON.parse(JSON.stringify(SEED));
}
function saveState(silent){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch(e){console.warn('saveState error',e);return}
  if(!silent){showToast('Сохранено в браузере');}
}
function showToast(text){
  var el=document.getElementById('save-toast');
  var t=document.getElementById('save-toast-text');
  if(t)t.textContent=text||'';
  if(el){el.hidden=false;setTimeout(function(){el.hidden=true;},1900);}
}

function h(tag,attrs,children){
  var el=document.createElement(tag);
  if(attrs){
    for(var k in attrs){
      if(!attrs.hasOwnProperty(k))continue;
      var v=attrs[k];
      if(k==='class')el.className=v;
      else if(k==='html')el.innerHTML=v;
      else if(k.indexOf('data-')===0)el.setAttribute(k,v);
      else if(k==='onclick'||k==='oninput'||k==='onchange')el.addEventListener(k.slice(2),v);
      else if(v!==null&&v!==undefined&&v!==false)el.setAttribute(k,v);
    }
  }
  if(children){
    if(typeof children==='string')el.innerHTML=children;
    else if(Array.isArray(children))children.forEach(function(c){if(c!==null&&c!==undefined)el.appendChild(typeof c==='string'?document.createTextNode(c):c);});
    else el.appendChild(children);
  }
  return el;
}

function lvlClass(level){return 'badge lvl-'+level;}
function statusBadge(status){
  if(status==='активно'||status==='подтверждена'||status==='в процессе'||status==='делается')return 'badge badge-teal';
  if(status==='ожидает'||status==='ожидает внешнего события'||status==='проверяется')return 'badge badge-yellow';
  if(status==='принято'||status==='сделано'||status==='подтверждено'||status==='принята')return 'badge badge-terracotta';
  return 'badge badge-neutral';
}
function directionBadge(dir){
  var map={'A':'terracotta','B':'teal','C':'yellow','D':'terracotta','E':'teal','F':'yellow'};
  return 'badge badge-'+(map[dir.code]||'neutral');
}
function projStatusBadge(status){
  if(status==='активно')return 'badge badge-teal';
  if(status==='ожидает')return 'badge badge-yellow';
  if(status==='сделано')return 'badge badge-terracotta';
  return 'badge badge-neutral';
}
function resultCatBadge(cat){
  var m={'Создано':'terracotta','Продеплоизировано':'teal','Изменения для участников':'yellow','Экономически получено':'terracotta'};
  return 'badge badge-'+(m[cat]||'neutral');
}
function horizonBadge(name){
  if(name==='Сегодня')return 'badge badge-terracotta';
  if(name==='Ближайшие 7 дней')return 'badge badge-yellow';
  if(name==='Следующие 14 дней')return 'badge badge-teal';
  if(name==='Позже')return 'badge badge-neutral';
  if(name==='Ожидает внешнего события')return 'badge badge-neutral';
  return 'badge badge-neutral';
}
function priorityBadge(p){
  if(p==='P1')return 'badge badge-terracotta';
  if(p==='P2')return 'badge badge-yellow';
  return 'badge badge-neutral';
}
function getVal(obj,path){
  var parts=path.split('.');
  var v=obj;
  for(var i=0;i<parts.length;i++){if(v==null||v===undefined)return '—';v=v[parts[i]];}
  return (v===null||v===undefined||v===''||v===false)?'—':v;
}
function truncate(str,max){if(!str)return '—';return str.length>max?str.slice(0,max)+'…':str;}
function getDirection(id){var ds=state.directions||[];for(var i=0;i<ds.length;i++){if(ds[i].id===id)return ds[i];}return null;}
function getProject(id){var ps=state.projects||[];for(var i=0;i<ps.length;i++){if(ps[i].id===id)return ps[i];}return null;}
function getResult(id){var rs=state.results||[];for(var i=0;i<rs.length;i++){if(rs[i].id===id)return rs[i];}return null;}
function getEvidence(id){var es=state.evidence||[];for(var i=0;i<es.length;i++){if(es[i].id===id)return es[i];}return null;}
function getAction(id){var as=state.actions||[];for(var i=0;i<as.length;i++){if(as[i].id===id)return as[i];}return null;}
function getHypothesis(id){var hs=state.hypotheses||[];for(var i=0;i<hs.length;i++){if(hs[i].id===id)return hs[i];}return null;}
function getDecision(id){var ds=state.decisions||[];for(var i=0;i<ds.length;i++){if(ds[i].id===id)return ds[i];}return null;}
function getPaused(id){var ps=state.pausedIdeas||[];for(var i=0;i<ps.length;i++){if(ps[i].id===id)return ps[i];}return null;}

function findEntity(id){
  var colls=['directions','projects','results','evidence','actions','hypotheses','decisions','pausedIdeas'];
  for(var c=0;c<colls.length;c++){var arr=state[colls[c]]||[];for(var i=0;i<arr.length;i++){if(arr[i].id===id)return {type:colls[c],item:arr[i]};}}
  return null;
}

function getViewLabel(view){
  var map={overview:'Обзор',directions:'Направления',projects:'Проекты',results:'Результаты',evidence:'Доказательства',actions:'Ближайшие действия',professionalValue:'Профессиональная ценность',decisions:'Журнал решений'};
  return map[view]||'';
}

function renderNavigation(){
  var nav=document.getElementById('nav-strip');
  if(!nav)return;
  nav.innerHTML='';
  var views=[['overview','Обзор'],['directions','Направления'],['projects','Проекты'],['results','Результаты'],['evidence','Доказательства'],['actions','Ближайшие действия'],['professionalValue','Проф. ценность'],['decisions','Журнал решений']];
  views.forEach(function(v){
    var btn=h('button',{class:'nav-tab'+(currentView===v[0]?' active':''),'data-view':v[0],onclick:function(){goToView(v[0]);}},[v[1]]);
    nav.appendChild(btn);
  });
}

function goToView(view){
  currentView=view;
  renderNavigation();
  render();
  window.scrollTo({top:0,behavior:'smooth'});
}

function render(){
  var ws=document.getElementById('workspace');
  if(!ws)return;
  ws.innerHTML='';
  switch(currentView){
    case 'overview':ws.appendChild(renderOverview());break;
    case 'directions':ws.appendChild(renderDirections());break;
    case 'projects':ws.appendChild(renderProjects());break;
    case 'results':ws.appendChild(renderResults());break;
    case 'evidence':ws.appendChild(renderEvidence());break;
    case 'actions':ws.appendChild(renderActions());break;
    case 'professionalValue':ws.appendChild(renderProfessionalValue());break;
    case 'decisions':ws.appendChild(renderDecisions());break;
    default:ws.appendChild(renderOverview());
  }
}

function renderOverview(){
  var meta=state.meta||{};
  var focus=state.mainFocus||{};
  var recent=state.recentProgress||[];
  var wrap=h('div',{});

  wrap.appendChild(renderHeroJournal(meta,focus,recent));

  var h1=h('div',{class:'block-head'},[h('div',{},[h('h2',{class:'block-title'},'Вопросы панели')])]);
  wrap.appendChild(h1);
  wrap.appendChild(renderFiveQuestions());

  if(state.pausedIdeas&&state.pausedIdeas.length){
    wrap.appendChild(renderPausedIdeas());
  }
  if(state.notDoingNow&&state.notDoingNow.length){
    wrap.appendChild(renderNotDoing());
  }
  if(state.reflections&&state.reflections.length){
    wrap.appendChild(renderReflection());
  }
  if(state.ideaBuffer&&state.ideaBuffer.length){
    wrap.appendChild(renderIdeaBuffer());
  }
  return wrap;
}

function renderHeroJournal(meta,focus,recent){
  var wrap=h('div',{class:'hero-journal'});
  var topRow=h('div',{class:'hero-top-row'});
  var leftCol=h('div',{});
  leftCol.appendChild(h('div',{class:'hero-dates'},(meta.updated||'')?('Обновлено: '+meta.updated):''));
  leftCol.appendChild(h('h1',{class:'hero-title'},'TAGIR — Личная рабочая панель'));
  leftCol.appendChild(h('p',{class:'hero-focus-line'},meta.focus||meta.subtitle||''));
  topRow.appendChild(leftCol);

  var rightCol=h('div',{class:'badge-row'});
  if(focus.status){
    rightCol.appendChild(h('span',{class:statusBadge(focus.status)},focus.status));
  }
  if(focus.direction){
    var d=getDirection(focus.direction);
    if(d){
      rightCol.appendChild(h('span',{class:directionBadge(d)},'↗ '+d.name));
    }
  }
  if(focus.deadline){
    rightCol.appendChild(h('span',{class:'badge badge-neutral'},'⏱ '+focus.deadline));
  }
  topRow.appendChild(rightCol);
  wrap.appendChild(topRow);

  if(meta.coreQuestion){
    wrap.appendChild(h('div',{class:'core-question-box'},[
      h('div',{class:'core-question-label'},'Главный вопрос'),
      h('p',{class:'core-question-text'},meta.coreQuestion)
    ]));
  }

  if(meta.hypothesis){
    wrap.appendChild(h('div',{class:'hypothesis-banner'},[
      h('div',{class:'kv-label'},'Гипотеза'),
      h('p',{class:'kv-val','style':'margin:0;font-size:.9rem'},meta.hypothesis)
    ]));
  }

  if(meta.method&&meta.method.steps){
    wrap.appendChild(renderMethodSteps(meta.method.steps));
  }

  if(recent&&recent.length){
    var rh=h('div',{class:'block-head','style':'margin-top:1.5rem'},[
      h('h2',{class:'block-title'},'Недельный журнал'),
      h('span',{class:'block-subtitle'},'Сыгранные итоги')
    ]);
    wrap.appendChild(rh);
    var list=h('div',{class:'split-columns'});
    recent.forEach(function(item){
      var card=h('div',{class:'card'});
      if(item.date){card.appendChild(h('div',{class:'kv-label','style':'margin-bottom:.3rem'},item.date));}
      if(item.title){card.appendChild(h('h3',{class:'card-title'},item.title));}
      if(item.done!==undefined){card.appendChild(h('p',{class:'kv-val','style':'margin-top:.5rem;font-size:.84rem'},item.done?'✓ Сделал':'△ В процессе'));}
      if(item.outcome){card.appendChild(h('p',{class:'kv-val','style':'margin-top:.35rem;font-size:.84rem;color:var(--text-secondary)'},item.outcome));}
      var badgeRow=h('div',{class:'badge-row','style':'margin-top:.55rem'});
      if(item.directionId){var d=getDirection(item.directionId);if(d){badgeRow.appendChild(h('span',{class:directionBadge(d)},d.code+' · '+d.name));}}
      if(item.confirmationLevel){badgeRow.appendChild(h('span',{class:lvlClass(item.confirmationLevel)},'Подтверждение '+item.confirmationLevel+'/4'));}
      if(item.evidenceId){var e=getEvidence(item.evidenceId);if(e){badgeRow.appendChild(h('button',{class:'btn btn-sm',onclick:function(){openModal('Evidence',e.id);}},'⇄ '+e.title));}}
      card.appendChild(badgeRow);
      list.appendChild(card);
    });
    wrap.appendChild(list);
  }

  return wrap;
}

function renderMethodSteps(steps){
  var wrap=h('div',{});
  wrap.appendChild(h('div',{class:'kv-label','style':'margin-bottom:.25rem'},'Методологическая последовательность'));
  var flex=h('div',{class:'method-steps'});
  steps.forEach(function(s,i){
    flex.appendChild(h('span',{class:'method-step'},[h('span',{class:'badge badge-neutral','style':'font-size:.7rem'},(i+1)),s]));
    if(i<steps.length-1){flex.appendChild(h('span',{class:'method-arrow'},'→'));}
  });
  wrap.appendChild(flex);
  return wrap;
}

function renderFiveQuestions(){
  var grid=h('div',{class:'five-questions-grid'});
  var questions=[
    {id:'q1',q:'Что уже сделано и достигнуто?',a:'14 результатов по 6 направлениям — вклад в школу, педагогов, участников, экономику'},
    {id:'q2',q:'Какую реальную пользу получили люди и организации?',a:'Изменения в практике — часть confirmed, часть assumed; для каждого уровня есть доказательство'},
    {id:'q3',q:'Какие направления имеют перспективу?',a:'6 направлений с гипотезами и планами проверки — школы ЭЛИФ, Insight X, подростки+ИИ, исследование орловских школ, коммерческое предложение, технические проекты'},
    {id:'q4',q:'Что нужно сделать в ближайшие дни?',a:'7 действий по горизонтам с приоритетами P1–P3 — от сегодняшних до ожидающих внешнего события'},
    {id:'q5',q:'Что можно показать потенциальному клиенту?',a:'Доказательства с уровнем надёжности и примеры решения проблем — реальные результаты и признанные премии'}
  ];
  questions.forEach(function(item){
    var card=h('div',{class:'q-card',onclick:function(){goToView('results');}},[
      h('div',{class:'q-card-question'},item.q),
      h('div',{class:'q-card-answer'},item.a)
    ]);
    grid.appendChild(card);
  });
  return grid;
}

function renderPausedIdeas(){
  var wrap=h('div',{});
  wrap.appendChild(h('div',{class:'block-head'},[
    h('div',{},[h('h2',{class:'block-title'},'Отложённые идеи'),h('p',{class:'block-subtitle'},'Немедленно не делаются — заверчены условия, но зафиксировано')])
  ]));
  var list=h('div',{class:'split-columns'});
  (state.pausedIdeas||[]).forEach(function(item){
    var card=h('div',{class:'card card-yellow'});
    card.appendChild(h('h3',{class:'card-title'},item.title));
    var kv=h('div',{class:'kv-grid'});
    if(item.whyPaused)kv.appendChild(h('div',{class:'kv-item'},[h('div',{class:'kv-label'},'Почему отложили'),h('div',{class:'kv-val'},item.whyPaused)]));
    if(item.returnCondition)kv.appendChild(h('div',{class:'kv-item'},[h('div',{class:'kv-label'},'Условие возврата'),h('div',{class:'kv-val'},item.returnCondition)]));
    if(item.lastReviewed)kv.appendChild(h('div',{class:'kv-item'},[h('div',{class:'kv-label'},'Последний обзор'),h('div',{class:'kv-val'},item.lastReviewed)]));
    card.appendChild(kv);
    list.appendChild(card);
  });
  wrap.appendChild(list);
  return wrap;
}

function renderNotDoing(){
  var wrap=h('div',{});
  wrap.appendChild(h('div',{class:'block-head'},[
    h('div',{},[h('h2',{class:'block-title'},'Что сейчас не делаю'),h('p',{class:'block-subtitle'},'Фиксировано чтобы отличать от «мне нужно»')])
  ]));
  var list=h('div',{class:'split-columns'});
  (state.notDoingNow||[]).forEach(function(item){
    var card=h('div',{class:'card card-teal'});
    card.appendChild(h('p',{class:'kv-val','style':'margin:0'},item.statement));
    if(item.reason){card.appendChild(h('p',{class:'kv-val','style':'margin-top:.5rem;font-size:.84rem;color:var(--text-secondary)'},item.reason));}
    list.appendChild(card);
  });
  wrap.appendChild(list);
  return wrap;
}

function renderReflection(){
  var r=state.reflections[0]||{};
  var wrap=h('div',{class:'card card-focus'});
  wrap.appendChild(h('h3',{class:'block-title','style':'margin-top:0'},'Чему успел научиться'));
  var kv=h('div',{class:'kv-grid'});
  var fields=[['meaningfulDone','Что было сосмысленно сделано'],['resultAppeared','Появился ли стоящий результат'],['learnedAboutValue','Что узнал о ценности'],['confirmed','Что подтверждено'],['notConfirmed','Что не подтверждено'],['wastedTime','Что ушло впустую'],['mostImportantNext','Самое важное на следующем этапе'],['deferOrStop','Что перенести или стопнуть']];
  fields.forEach(function(f){var v=r[f[0]];if(v&&v!=='')kv.appendChild(h('div',{class:'kv-item'},[h('div',{class:'kv-label'},f[1]),h('div',{class:'kv-val'},v)]));});
  wrap.appendChild(kv);
  return wrap;
}

function renderIdeaBuffer(){
  var wrap=h('div',{});
  wrap.appendChild(h('div',{class:'block-head'},[h('h2',{class:'block-title'},'Идеальный буфер')]));
  var list=h('div',{class:'split-columns'});
  (state.ideaBuffer||[]).forEach(function(item){
    var card=h('div',{class:'card card-teal'});
    card.appendChild(h('p',{class:'kv-val','style':'margin:0'},item.idea));
    if(item.context){card.appendChild(h('p',{class:'kv-val','style':'margin-top:.5rem;font-size:.84rem;color:var(--text-secondary)'},item.context));}
    list.appendChild(card);
  });
  wrap.appendChild(list);
  return wrap;
}

function renderDirections(){
  var wrap=h('div',{});
  wrap.appendChild(h('div',{class:'section-head'},[
    h('div',{},[h('h2',{class:'section-title'},'Мои направления'),h('p',{class:'section-desc'},'6 направлений с описанием, аудиторией, выгоды, состоянием и различением компетенции / деятельности / услуги / результата клиента / доказательства')])
  ]));
  var filterBar=h('div',{class:'filter-bar'});
  filterBar.appendChild(h('div',{class:'filter-group'},[h('div',{class:'filter-label'},'Поиск по направлениям'),h('input',{class:'filter-input',id:'dir-search',placeholder:'Поиск…',oninput:function(e){directionSearchQuery=e.target.value.toLowerCase();renderDirectionsFiltered();}})]));
  wrap.appendChild(filterBar);
  wrap.appendChild(h('div',{id:'directions-list'}));
  renderDirectionsFiltered();
  return wrap;
}

function renderDirectionsFiltered(){
  var list=document.getElementById('directions-list');
  if(!list)return;
  list.innerHTML='';
  var ds=(state.directions||[]).filter(function(d){
    if(!directionSearchQuery)return true;
    var hay=JSON.stringify(d).toLowerCase();
    return hay.indexOf(directionSearchQuery)>=0;
  });
  ds.forEach(function(d){list.appendChild(renderDirectionCard(d));});
}

function renderDirectionCard(d){
  var card=h('div',{class:'card card-focus'});
  var header=h('div',{class:'card-header'},[
    h('h3',{class:'card-title'},[h('span',{class:directionBadge(d)},d.code),'  ',d.name]),
    h('div',{class:'badge-row'},[h('span',{class:statusBadge(d.status)},d.status||'активно')])
  ]);
  card.appendChild(header);

  var kv=h('div',{class:'kv-grid'});
  var fields=[
    ['problemSolved','Какую задачу решает'],['audience','Для какой аудитории'],['expectedBenefit','Ожидаемая польза'],
    ['alreadyDone','Что уже сделано'],['confirmations','Подтверждения'],['openQuestions','Открытые вопросы'],
    ['currentHypothesis','Текущая гипотеза'],['nextVerificationStep','Следующая проверка'],['relatedProjects','Связанные проекты'],
    ['nearestResult','Ближайший результат'],['lastEvent','Последнее событие'],['nextAction','Следующее действие']
  ];
  fields.forEach(function(f){
    var v=d[f[0]];
    if(v&&(typeof v==='string'?v!==''&&v!=='—':Array.isArray(v)?v.length>0:v!==null&&v!==undefined&&v!==false)){
      kv.appendChild(h('div',{class:'kv-item'},[h('div',{class:'kv-label'},f[1]),h('div',{class:'kv-val'},formatVal(v))]));
    }
  });
  card.appendChild(kv);

  if(d.distinction){
    card.appendChild(renderDistinctionStrip(d.distinction));
  }
  return card;
}

function formatVal(v){
  if(Array.isArray(v))return v.map(function(x){return String(x).trim();}).filter(function(x){return x;}).join('; ');
  if(typeof v==='object'&&v!==null)return JSON.stringify(v);
  return String(v);
}

function renderDistinctionStrip(d){
  var wrap=h('div',{class:'distinction-strip'});
  var label=h('div',{class:'kv-label','style':'margin-bottom:.3rem'},'Различие');
  wrap.appendChild(label);
  var grid=h('div',{class:'distinction-grid'});
  var fields=[['competence','Компетенция'],['activity','Деятельность'],['service','Услуга'],['clientResult','Результат клиента'],['proof','Доказательство']];
  fields.forEach(function(f){
    var v=d[f[0]];
    var text=v&&(typeof v==='string'?v!==''&&v!=='—':Array.isArray(v)?v.length>0:v!==null&&v!==undefined&&v!==false)?formatVal(v):'—';
    var muted=(text==='—');
    grid.appendChild(h('div',{class:'distinction-cell'},[h('div',{class:'kv-label'},f[1]),h('div',{class:'kv-val'+(muted?' muted':''),style:'font-size:.81rem'},text)]));
  });
  wrap.appendChild(grid);
  return wrap;
}

function renderProjects(){
  var wrap=h('div',{});
  wrap.appendChild(h('div',{class:'section-head'},[
    h('div',{},[h('h2',{class:'section-title'},'Проекты'),h('p',{class:'section-desc'},'Текущие рабочие линии: техническая составляющая, методологическая последовательность, открытые вопросы, следующие задачи')])
  ]));
  var grid=h('div',{class:'grid-2'});
  (state.projects||[]).forEach(function(p){grid.appendChild(renderProjectCard(p));});
  wrap.appendChild(grid);
  return wrap;
}

function renderProjectCard(p){
  var card=h('div',{class:'card card-teal'});
  var header=h('div',{class:'card-header'},[
    h('h3',{class:'card-title'},p.name),
    h('div',{class:'badge-row'},[h('span',{class:projStatusBadge(p.status)},p.status||'активно')])
  ]);
  card.appendChild(header);

  if(p.purpose){card.appendChild(h('p',{class:'kv-val','style':'margin-top:0'},p.purpose));}

  var kv=h('div',{class:'kv-grid'});
  var fields=[['type','Тип']];
  fields.forEach(function(f){
    if(p[f[0]])kv.appendChild(h('div',{class:'kv-item'},[h('div',{class:'kv-label'},f[1]),h('div',{class:'kv-val'},p[f[0]])]));
  });
  card.appendChild(kv);

  if(p.technicalLine){
    var tl=h('div',{class:'subpanel','style':'margin-top:.85rem'});
    tl.appendChild(h('h4',{class:'subpanel-title'},'Техническая линия'));
    var kv2=h('div',{class:'kv-grid'});
    var tf=['implemented','verifiedInPractice','toDevelop','limitations'];
    var tl2=['Реализовано','Проверено в практике','Дорабатывать','Ограничения'];
    tf.forEach(function(f,i){if(p.technicalLine[f]&&p.technicalLine[f]!==''&&p.technicalLine[f]!=='—')kv2.appendChild(h('div',{class:'kv-item'},[h('div',{class:'kv-label'},tl2[i]),h('div',{class:'kv-val'},formatVal(p.technicalLine[f]))]));});
    tl.appendChild(kv2);
    card.appendChild(tl);
  }

  if(p.methodologicalLine){
    var ml=h('div',{class:'subpanel','style':'margin-top:.65rem'});
    ml.appendChild(h('h4',{class:'subpanel-title'},'Методологическая линия'));
    var kv3=h('div',{class:'kv-grid'});
    var mf=['leaderChanges','teacherChanges','observationCapture','hypothesesFlow','postDiscussionActions','confirmedShifts'];
    var ml2=['Изменения со стороны лидера','Изменения со стороны педагогов','Захват наблюдений','Поток гипотез','Действия после дискуссии','Подтверждённые сдвиги'];
    mf.forEach(function(f,i){if(p.methodologicalLine[f]&&p.methodologicalLine[f]!==''&&p.methodologicalLine[f]!=='—')kv3.appendChild(h('div',{class:'kv-item'},[h('div',{class:'kv-label'},ml2[i]),h('div',{class:'kv-val'},formatVal(p.methodologicalLine[f]))]));});
    ml.appendChild(kv3);
    card.appendChild(ml);
  }

  if(p.unresolvedQuestions&&p.unresolvedQuestions.length){
    var uq=h('div',{class:'subpanel','style':'margin-top:.65rem'});
    uq.appendChild(h('h4',{class:'subpanel-title'},'Нерешённые вопросы'));
    var ul=h('ul',{});
    p.unresolvedQuestions.forEach(function(q){ul.appendChild(h('li',{},q));});
    uq.appendChild(ul);
    card.appendChild(uq);
  }

  if(p.nextTasks&&p.nextTasks.length){
    var nt=h('div',{class:'subpanel','style':'margin-top:.65rem'});
    nt.appendChild(h('h4',{class:'subpanel-title'},'Следующие задачи'));
    var ntl=h('ul',{});
    p.nextTasks.forEach(function(q){ntl.appendChild(h('li',{},q));});
    nt.appendChild(ntl);
    card.appendChild(nt);
  }

  if(p.evolution&&p.evolution.length){
    var ev=h('div',{class:'subpanel','style':'margin-top:.65rem'});
    ev.appendChild(h('h4',{class:'subpanel-title'},'Эволюция'));
    var tl2=h('div',{class:'timeline'});
    p.evolution.forEach(function(item){
      tl2.appendChild(h('div',{class:'timeline-item'},[h('span',{class:'timeline-date'},item.date||''),h('span',{},' — '+formatVal(item.event))]));
    });
    ev.appendChild(tl2);
    card.appendChild(ev);
  }

  return card;
}

function renderResults(){
  var wrap=h('div',{});
  wrap.appendChild(h('div',{class:'section-head'},[
    h('div',{},[h('h2',{class:'section-title'},'Результаты'),h('p',{class:'section-desc'},'4 типа результатов: создано, деплоировано, изменения для участников, экономически получено')])
  ]));
  var cats=['Создано','Продеплоировано','Изменения для участников','Экономически получено'];
  cats.forEach(function(cat){
    var results=(state.results||[]).filter(function(r){return r.category===cat;});
    if(results.length===0)return;
    wrap.appendChild(h('div',{class:'block-head'},[
      h('div',{},[h('h3',{class:'block-title'},cat),h('p',{class:'block-subtitle'},results.length+' шт.')])
    ]));
    var grid=h('div',{class:'grid-2'});
    results.forEach(function(r){grid.appendChild(renderResultCard(r));});
    wrap.appendChild(grid);
  });
  return wrap;
}

function renderResultCard(r){
  var card=h('div',{class:'card card-'+(r.category==='Экономически получено'?'focus':r.category==='Изменения для участников'?'yellow':'teal')});
  var header=h('div',{class:'card-header'},[
    h('h3',{class:'card-title'},r.title),
    h('div',{class:'badge-row'},[h('span',{class:resultCatBadge(r.category)},r.category)])
  ]);
  card.appendChild(header);
  var kv=h('div',{class:'kv-grid'});
  var fields=[
    ['direction','Направление'],['description','Описание'],['evidence','Доказательство'],
    ['confirmationLevel','Уровень подтверждения'],['status','Состояние'],['impact','Влияние']
  ];
  fields.forEach(function(f){
    var v=r[f[0]];
    if(v&&v!==''&&v!==undefined&&v!==null&&v!==false){
      kv.appendChild(h('div',{class:'kv-item'},[h('div',{class:'kv-label'},f[1]),h('div',{class:'kv-val'},formatVal(v))]));
    }
  });
  card.appendChild(kv);
  return card;
}

function renderEvidence(){
  var wrap=h('div',{});
  wrap.appendChild(h('div',{class:'section-head'},[
    h('div',{},[h('h2',{class:'section-title'},'Доказательства'),h('p',{class:'section-desc'},'4 уровня надёжности: 1=личное мнение, 2=один источник, 3=несколько источников, 4=формальные документы')])
  ]));
  var fbar=h('div',{class:'filter-bar'});
  fbar.appendChild(h('div',{class:'filter-group'},[h('div',{class:'filter-label'},'Тип источника'),h('select',{class:'filter-select',id:'ev-filter-source',onchange:function(e){evidenceFilter.sourceType=e.target.value;renderEvidenceFiltered();}},
    h('option',{value:'all'},'Все'),h('option',{value:'документы'},'Документы'),h('option',{value:'интервью'},'Интервью'),h('option',{value:'чат-логи'},'Чат-логи'),h('option',{value:'признания'},'Признания'),h('option',{value:'призывы'},'Призывы'),h('option',{value:'отчеты'},'Отчёты')
  )]));
  fbar.appendChild(h('div',{class:'filter-group'},[h('div',{class:'filter-label'},'Уровень надёжности'),h('select',{class:'filter-select',id:'ev-filter-level',onchange:function(e){evidenceFilter.level=e.target.value;renderEvidenceFiltered();}},
    h('option',{value:'all'},'Все'),h('option',{value:'4'},'4 — формальные документы'),h('option',{value:'3'},'3 — несколько источников'),h('option',{value:'2'},'2 — один источник'),h('option',{value:'1'},'1 — личное мнение')
  )]));
  fbar.appendChild(h('div',{class:'filter-group'},[h('div',{class:'filter-label'},'Проект'),h('select',{class:'filter-select',id:'ev-filter-project',onchange:function(e){evidenceFilter.project=e.target.value;renderEvidenceFiltered();}},
    h('option',{value:'all'},'Все')
  )]));
  (state.projects||[]).forEach(function(p){fbar.querySelector('#ev-filter-project').appendChild(h('option',{value:p.id},p.name));});
  wrap.appendChild(fbar);
  wrap.appendChild(h('div',{id:'evidence-list'}));
  renderEvidenceFiltered();
  return wrap;
}

function renderEvidenceFiltered(){
  var list=document.getElementById('evidence-list');
  if(!list)return;
  list.innerHTML='';
  var es=(state.evidence||[]).filter(function(e){
    if(evidenceFilter.sourceType!=='all'&&e.sourceType!==evidenceFilter.sourceType)return false;
    if(evidenceFilter.level!=='all'&&String(e.reliabilityLevel)!==evidenceFilter.level)return false;
    if(evidenceFilter.project!=='all'&&e.projectId!==evidenceFilter.project)return false;
    return true;
  });
  es.forEach(function(e){list.appendChild(renderEvidenceCard(e));});
}

function renderEvidenceCard(e){
  var card=h('div',{class:'card card-'+(e.reliabilityLevel===4?'focus':e.reliabilityLevel===3?'teal':'yellow')});
  var header=h('div',{class:'card-header'},[
    h('h3',{class:'card-title'},e.title),
    h('div',{class:'badge-row'},[h('span',{class:lvlClass(e.reliabilityLevel)},'Уровень '+e.reliabilityLevel+'/4')])
  ]);
  card.appendChild(header);
  var kv=h('div',{class:'kv-grid'});
  var fields=[
    ['date','Дата'],['projectId','Проект'],['sourceType','Тип источника'],['description','Описание'],
    ['confirms','Что подтверждает'],['doesNotConfirm','Что НЕ подтверждает'],
    ['originPath','Исходный файл'],['usagePermission','Разрешение на использование'],
    ['publicDisclosure','Публичность'],['linkedValue','Привязанная ценность']
  ];
  fields.forEach(function(f){
    var v=e[f[0]];
    if(v&&v!==''&&v!==undefined&&v!==null&&v!==false){
      kv.appendChild(h('div',{class:'kv-item'},[h('div',{class:'kv-label'},f[1]),h('div',{class:'kv-val'},formatVal(v))]));
    }
  });
  card.appendChild(kv);
  return card;
}

function renderActions(){
  var wrap=h('div',{});
  wrap.appendChild(h('div',{class:'section-head'},[
    h('div',{},[h('h2',{class:'section-title'},'Ближайшие действия'),h('p',{class:'section-desc'},'Горизонты: сегодня, 7 дней, 14 дней, позже, ожидает внешнего события. Приоритеты P1/P2/P3')])
  ]));
  var horizons=['Сегодня','Ближайшие 7 дней','Следующие 14 дней','Позже','Ожидает внешнего события'];
  horizons.forEach(function(horizon){
    var acts=(state.actions||[]).filter(function(a){return a.horizon===horizon;});
    if(acts.length===0)return;
    wrap.appendChild(h('div',{class:'block-head'},[
      h('div',{},[h('h3',{class:'block-title'},horizon),h('p',{class:'block-subtitle'},acts.length+' шт.')])
    ]));
    var grid=h('div',{class:'grid-2'});
    acts.forEach(function(a){grid.appendChild(renderActionCard(a));});
    wrap.appendChild(grid);
  });
  return wrap;
}

function renderActionCard(a){
  var cardClass='card ';
  if(a.status==='сделано'||a.status==='принято')cardClass+='card-completed';
  else if(a.deadline&&isOverdue(a.deadline)&&a.status!=='сделано')cardClass+='card-overdue';
  var card=h('div',{class:cardClass});
  var header=h('div',{class:'card-header'},[
    h('h3',{class:'card-title'},a.title),
    h('div',{class:'badge-row'},[
      h('span',{class:horizonBadge(a.horizon)},a.horizon),
      h('span',{class:priorityBadge(a.priority)},a.priority||''),
      a.status?h('span',{class:statusBadge(a.status)},a.status):null
    ].filter(Boolean))
  ]);
  card.appendChild(header);
  var kv=h('div',{class:'kv-grid'});
  var fields=[
    ['reason','Почему'],['projectId','Проект'],['expectedOutcome','Ожидаемый результат'],
    ['completionCriteria','Критерий выполнения'],['deadline','Дедлайн'],['priority','Приоритет'],
    ['status','Состояние'],['dependency','Зависимость'],['obstacle','Препятствие'],
    ['materialsRef','Материалы']
  ];
  fields.forEach(function(f){
    var v=a[f[0]];
    if(v&&v!==''&&v!==undefined&&v!==null&&v!==false){
      kv.appendChild(h('div',{class:'kv-item'},[h('div',{class:'kv-label'},f[1]),h('div',{class:'kv-val'},formatVal(v))]));
    }
  });
  card.appendChild(kv);

  if(a.status!=='сделано'&&a.status!=='принято'){
    var btnRow=h('div',{class:'badge-row','style':'margin-top:.85rem'});
    btnRow.appendChild(h('button',{class:'btn btn-sm btn-teal',onclick:function(){advanceActionStatus(a.id);}},'→ Отметить как сделанное'));
    card.appendChild(btnRow);
  }
  return card;
}

function advanceActionStatus(id){
  var a=getAction(id);
  if(!a)return;
  var statuses=['новое','в работе','сделано','принято'];
  var idx=statuses.indexOf(a.status);
  if(idx<0)idx=0;
  idx++;
  if(idx>=statuses.length)idx=statuses.length-1;
  a.status=statuses[idx];
  saveState(false);
  render();
}

function isOverdue(deadline){
  if(!deadline)return false;
  var d=new Date(deadline);
  if(isNaN(d.getTime()))return false;
  return d<new Date();
}

function renderProfessionalValue(){
  var wrap=h('div',{});
  wrap.appendChild(h('div',{class:'section-head'},[
    h('div',{},[h('h2',{class:'section-title'},'Профессиональная ценность'),h('p',{class:'section-desc'},'Что могу предложить и что доказано — глаголы действия, аудитории, подтверждённые утверждения, то, что ещё нужно доказать')])
  ]));
  var pv=state.professionalValue||{};
  if(pv.skills&&pv.skills.length){
    wrap.appendChild(renderPvSection('Компетенции и услуги (глаголы действия)',pv.skills,'terracotta'));
  }
  if(pv.audiences&&pv.audiences.length){
    wrap.appendChild(renderPvSection('Аудитории',pv.audiences,'teal'));
  }
  if(pv.confirmedClaims&&pv.confirmedClaims.length){
    wrap.appendChild(renderPvSection('Подтверждённые утверждения',pv.confirmedClaims,'yellow'));
  }
  if(pv.yetToProve&&pv.yetToProve.length){
    wrap.appendChild(renderPvSection('Ещё нужно доказать',pv.yetToProve,'neutral'));
  }
  if(pv.commercialValidation&&pv.commercialValidation.length){
    wrap.appendChild(renderCommercialValidation());
  }
  return wrap;
}

function renderPvSection(title,items,color){
  var wrap=h('div',{});
  wrap.appendChild(h('div',{class:'block-head'},[h('h3',{class:'block-title'},title)]));
  var grid=h('div',{class:'grid-3'});
  items.forEach(function(item){
    var card=h('div',{class:'card card-'+color});
    if(typeof item==='string'){
      card.appendChild(h('p',{class:'kv-val','style':'margin:0'},item));
    }else{
      var kv=h('div',{class:'kv-grid'});
      Object.keys(item).forEach(function(k){
        kv.appendChild(h('div',{class:'kv-item'},[h('div',{class:'kv-label'},k),h('div',{class:'kv-val'},formatVal(item[k]))]));
      });
      card.appendChild(kv);
    }
    grid.appendChild(card);
  });
  wrap.appendChild(grid);
  return wrap;
}

function renderCommercialValidation(){
  var wrap=h('div',{});
  wrap.appendChild(h('div',{class:'block-head'},[h('h3',{class:'block-title'},'Коммерческая валидация')]));
  var table=h('div',{class:'table-wrap'});
  var tbl=h('table',{class:'journal-table'});
  var thead=h('thead',{});
  var trh=h('tr',{});
  ['Предложение','Статус','Метрики','Дата','Комментарий'].forEach(function(t){trh.appendChild(h('th',{},t));});
  thead.appendChild(trh);
  tbl.appendChild(thead);
  var tbody=h('tbody',{});
  (state.professionalValue.commercialValidation||[]).forEach(function(o){
    var tr=h('tr',{});
    tr.appendChild(h('td',{},o.offer||'—'));
    tr.appendChild(h('td',{},o.status||'—'));
    tr.appendChild(h('td',{},o.metrics?formatVal(o.metrics):'—'));
    tr.appendChild(h('td',{},o.date||'—'));
    tr.appendChild(h('td',{},o.comment||'—'));
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
  table.appendChild(tbl);
  wrap.appendChild(table);
  return wrap;
}

function renderDecisions(){
  var wrap=h('div',{});
  wrap.appendChild(h('div',{class:'section-head'},[
    h('div',{},[h('h2',{class:'section-title'},'Журнал решений'),h('p',{class:'section-desc'},'Зафиксировано чтобы отличать «сделал» от «план»: ситуация, решение, почему, альтернативы, проверка')])
  ]));
  var table=h('div',{class:'table-wrap'});
  var tbl=h('table',{class:'journal-table'});
  var thead=h('thead',{});
  var trh=h('tr',{});
  ['Дата','Ситуация','Решение','Почему','Альтернативы','Проверка','Отзыв','Вывод'].forEach(function(t){trh.appendChild(h('th',{},t));});
  thead.appendChild(trh);
  tbl.appendChild(thead);
  var tbody=h('tbody',{});
  (state.decisions||[]).forEach(function(d){
    var tr=h('tr',{});
    tr.appendChild(h('td',{},d.date||'—'));
    tr.appendChild(h('td',{},d.situation||'—'));
    tr.appendChild(h('td',{},d.decision||'—'));
    tr.appendChild(h('td',{},d.why||'—'));
    tr.appendChild(h('td',{},d.alternatives?formatVal(d.alternatives):'—'));
    tr.appendChild(h('td',{},d.assumption?formatVal(d.assumption):'—'));
    tr.appendChild(h('td',{},d.reviewDate||'—'));
    tr.appendChild(h('td',{},d.actualResult||'—'));
    tr.appendChild(h('td',{},d.conclusion||'—'));
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
  table.appendChild(tbl);
  wrap.appendChild(table);
  return wrap;
}

function openModal(type,id){
  var backdrop=document.getElementById('modal-backdrop');
  var box=h('div',{class:'modal-box'});
  var header=h('div',{class:'modal-header'},[h('h3',{class:'modal-title'},type+' #'+id),h('button',{class:'btn btn-sm',onclick:function(){backdrop.hidden=true;}},'✕')]);
  box.appendChild(header);
  var body=h('div',{class:'modal-body'},'Запись #'+id+'');
  box.appendChild(body);
  backdrop.innerHTML='';
  backdrop.appendChild(box);
  backdrop.hidden=false;
  backdrop.onclick=function(e){if(e.target===backdrop){backdrop.hidden=true;}};
}

function exportJSON(){
  var blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
  var url=URL.createObjectURL(blob);
  var a=h('a',{href:url,download:'tagir-panel-export.json'});
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Экспортировано');
}

function importJSON(file){
  var reader=new FileReader();
  reader.onload=function(e){
    try{
      var data=JSON.parse(e.target.result);
      if(data&&data.meta&&data.directions&&data.projects){
        state=data;
        saveState(false);
        render();
        showToast('Импортировано');
      }else{showToast('Ошибка: файл не соответствует структуре');}
    }catch(err){showToast('Ошибка: '+err.message);}
  };
  reader.readAsText(file);
}

function setupGlobalSearch(){
  var input=document.getElementById('global-search');
  var dropdown=document.getElementById('search-dropdown');
  if(!input||!dropdown)return;
  input.addEventListener('input',function(){
    var q=input.value.trim().toLowerCase();
    if(!q){dropdown.hidden=true;return;}
    var hits=[];
    var colls=['directions','projects','results','evidence','actions','hypotheses','decisions','pausedIdeas'];
    colls.forEach(function(c){
      (state[c]||[]).forEach(function(item){
        var hay=JSON.stringify(item).toLowerCase();
        if(hay.indexOf(q)>=0){
          hits.push({type:c,item:item});
        }
      });
    });
    hits=hits.slice(0,20);
    dropdown.innerHTML='';
    hits.forEach(function(hit){
      var label=hit.item.title||hit.item.name||hit.item.statement||hit.item.idea||'#'+hit.item.id;
      var btn=h('button',{class:'search-hit',onclick:function(){
        dropdown.hidden=true;
        input.value='';
        goToViewByEntityType(hit.type);
      }},[h('div',{style:'font-weight:600'},label),h('div',{class:'kv-label','style':'margin-top:.2rem'},hit.type)]);
      dropdown.appendChild(btn);
    });
    if(hits.length===0){
      dropdown.appendChild(h('div',{class:'kv-val muted','style':'padding:.5rem'},'Ничего не найдено'));
    }
    dropdown.hidden=false;
  });
  document.addEventListener('click',function(e){
    if(!input.contains(e.target)&&!dropdown.contains(e.target)){dropdown.hidden=true;}
  });
}

function goToViewByEntityType(type){
  var map={directions:'directions',projects:'projects',results:'results',evidence:'evidence',actions:'actions',hypotheses:'overview',decisions:'decisions',pausedIdeas:'overview'};
  goToView(map[type]||'overview');
}

function init(){
  var btnExport=document.getElementById('btn-export');
  var btnImport=document.getElementById('btn-import');
  var fileInput=document.getElementById('import-file');
  var brand=document.getElementById('brand-cluster');
  if(btnExport)btnExport.addEventListener('click',exportJSON);
  if(btnImport)btnImport.addEventListener('click',function(){fileInput.click();});
  if(fileInput)fileInput.addEventListener('change',function(e){if(e.target.files[0]){importJSON(e.target.files[0]);fileInput.value='';}});
  if(brand)brand.addEventListener('click',function(){goToView('overview');});
  setupGlobalSearch();
  renderNavigation();
  render();
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',init);
}else{
  init();
}

})();
