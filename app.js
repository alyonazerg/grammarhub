(function () {
  'use strict';
  const topics = {
    1: {title:'Parts of Speech, Nouns & Articles', description:'Word classes, noun forms and article choices organised by noun class.', course:window.TOPIC1_COURSE || [], glossary:window.TOPIC1_GLOSSARY || [], assessment:window.TOPIC1_ASSESSMENT || []},
    2: {title:'Pronouns & Numerals', description:'Reference, clause connections, quantities and mathematical English.', course:window.COURSE || [], glossary:window.GLOSSARY || [], assessment:window.ASSESSMENT || []},
    3: {title:'Adjectives & Adverbs', description:'Classification, modification, comparison and meaning.', course:[], glossary:[], assessment:[]}
  };
  let currentTopic = 2, course = topics[2].course, glossary = topics[2].glossary, assessment = topics[2].assessment;
  const app = document.getElementById('app');
  const storageKey = 'grammar-studio-v1';
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch (_) {}
  const state = { sessions: saved.sessions || {}, draftsByTopic: saved.draftsByTopic || {2:saved.drafts || {}}, board: !!saved.board };
  function drafts() { return state.draftsByTopic[currentTopic] || (state.draftsByTopic[currentTopic] = {}); }
  let view = 'home', active = 0, stage = 'Discover', practiceIndex = 0;
  let selected = null, checked = false;
  const stages = ['Discover', 'Rule', 'Practise', 'Use', 'Review', 'Homework'];
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const list = (items, cls) => '<ul' + (cls ? ' class="' + cls + '"' : '') + '>' + (items || []).map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>';
  function persist() { try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch (_) {} }
  function sessionState() { const id = String(course[active].id); return state.sessions[id] || (state.sessions[id] = { started: true, answers: {}, reflection: {} }); }
  function status(s) { const progress = state.sessions[String(s.id)]; return progress && progress.reviewed ? 'Reviewed' : progress && progress.started ? 'In progress' : 'Not started'; }
  function focusMain() { const el = app.querySelector('h1'); if (el) { el.tabIndex = -1; el.focus({preventScroll:true}); } window.scrollTo({top:0,behavior:'instant'}); }
  function updateNavigation() {
    const nav = document.getElementById('sessionNav');
    const topicLinks = '<button class="all-topics-link" data-view="home">← All topics</button><div class="topic-switcher">'+Object.keys(topics).map(id=>'<button data-topic="'+id+'"'+(Number(id)===currentTopic?' aria-current="true"':'')+'>Topic '+id+'<small>'+esc(topics[id].title)+'</small></button>').join('')+'</div>';
    const label = document.querySelector('.course-label'); if(label)label.textContent=topics[currentTopic].title;
    const note = document.querySelector('.sidebar-top .muted'); if(note)note.textContent=currentTopic===3?'In development':currentTopic===2?'Four 90-minute sessions.':'Reference and consolidation modules.';
    if (nav) nav.innerHTML = topicLinks + course.map((s,i) => '<button class="session-link' + (view === 'lesson' && active === i ? ' active' : '') + '" data-session="'+i+'"'+(view==='lesson'&&active===i?' aria-current="page"':'')+'><span class="card-number">'+String(i+1).padStart(2,'0')+'</span><span>'+esc(s.title)+'<small class="muted" style="display:block">'+status(s)+'</small></span></button>').join('');
    document.querySelectorAll('[data-view]').forEach(b => { if (b.dataset.view === view) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current'); });
    const complete = course.filter(s=>status(s)==='Reviewed').length;
    const el = document.getElementById('courseProgress');
    if (el) el.innerHTML = '<span>'+complete+' / '+course.length+' '+(currentTopic===2?'sessions':'modules')+' reviewed</span><div class="progress-track" role="progressbar" aria-label="Learning units reviewed" aria-valuemin="0" aria-valuemax="'+course.length+'" aria-valuenow="'+complete+'"><span class="progress-fill" style="width:'+(course.length?complete/course.length*100:0)+'%"></span></div>';
  }
  function renderTopic() {
    app.innerHTML = '<section class="hero hero-grid"><div><p class="eyebrow">THE UNIVERSITY GRAMMAR LAB</p><h1>'+esc(topics[currentTopic].title)+'</h1><p class="hero-description">'+esc(topics[currentTopic].description)+'</p><div class="toolbar"><button class="button" data-session="0">Start the course <span aria-hidden="true">↗</span></button><button class="button-secondary" data-view="glossary">Explore the glossary</button></div><p class="muted">'+(currentTopic===2?'4 sessions · 90 minutes each · B1+/B2 consolidation':'Reference modules · choose a section to study or review')+'</p></div><div class="hero-art" aria-hidden="true"><span class="art-word">we</span><span class="art-number">¾</span><span class="art-caption">REFERENCE / QUANTITY / MEANING</span></div></section><section aria-labelledby="course-title"><div class="toolbar" style="justify-content:space-between"><div><p class="eyebrow">YOUR LEARNING PATH</p><h2 id="course-title">'+(currentTopic===2?'Four sessions. One connected course.':'Explore the topic by section.')+'</h2></div><span class="tag">Choose your starting point</span></div><div class="session-grid">'+course.map((s,i)=>'<article class="session-card"><span class="card-number">'+String(i+1).padStart(2,'0')+'</span><span class="tag">'+status(s)+'</span><h3>'+esc(s.title)+'</h3><p>'+esc(s.subtitle)+'</p><button class="button-secondary" data-session="'+i+'">'+(status(s)==='Not started'?'Explore session':'Continue session')+' <span aria-hidden="true">→</span></button></article>').join('')+'</div></section><section class="theory-card" style="margin-top:2rem"><p class="eyebrow">HOW THIS COURSE WORKS</p><h2>Notice. Explain. Put it to use.</h2><p>Begin with examples, work out a pattern, check the explanation and test your choices. Finish with a meaningful task and a personal review.</p><p class="muted">All sessions are open. Progress and assessment drafts stay in this browser. “Reviewed” records your participation, not a mastery score.</p><div class="toolbar"><button class="button-secondary" data-action="print">Print this view</button><button class="button-secondary" data-action="reset">Reset local progress</button></div></section>';
  }
  function renderHome() {
    app.innerHTML = '<section class="hero hero-grid"><div><p class="eyebrow">THE UNIVERSITY GRAMMAR LAB</p><h1>Grammar.<br>Connected.</h1><p class="hero-description">Choose a topic. Discover a pattern, explain a choice and put the language to use.</p><p class="muted">Your course library · classroom and independent study · offline edition available</p></div><div class="hero-art" aria-hidden="true"><span class="art-word">the</span><span class="art-number">¾</span><span class="art-caption">FORM / FUNCTION / MEANING</span></div></section><section><p class="eyebrow">COURSE TOPICS</p><h2>Your grammar library.</h2><div class="topic-grid">'+Object.keys(topics).map(id=>'<article class="session-card topic-card"><span class="card-number">TOPIC '+id+'</span><span class="tag">'+(id==='3'?'In development':'Available')+'</span><h3>'+esc(topics[id].title)+'</h3><p>'+esc(topics[id].description)+'</p><button class="'+(id==='3'?'button-secondary':'button')+'" data-topic="'+id+'">'+(id==='3'?'View planned coverage':'Open topic')+' →</button></article>').join('')+'</div></section><section class="theory-card hub-note"><h2>Notice. Explain. Put it to use.</h2><p>Each available module includes discovery, an explanation, practice with feedback, a communication task and review. All topics remain open; your progress stays on this device.</p><p class="muted">Topic 1 follows the supplied noun and article presentations. Topic 2 follows the four-session pronoun and numeral course. Topic 3 is a syllabus outline, with teaching material still in development.</p><button class="button-secondary" data-action="reset">Reset local progress</button></section>';
  }
  function renderDevelopment() {
    app.innerHTML = '<header class="lesson-header"><p class="eyebrow">TOPIC 3 · IN DEVELOPMENT</p><h1>Adjectives &amp; Adverbs</h1><p>This topic is planned. Lessons, practice and assessment have not been released.</p></header><section class="theory-card"><h2>The Adjective</h2>'+list(['Definition and classification.','Qualitative adjectives: descriptive and limiting; relative adjectives.','Grammatical characteristics of qualitative and relative adjectives.','Syntactic functions: attribute and predicative.','Adjective order.','Substantivized adjectives.','–ed and –ing adjectives.','Degrees of comparison.'])+'</section><section class="theory-card"><h2>The Adverb</h2>'+list(['Definition.','Syntactic functions.','Degrees of comparison.'])+'</section><button class="button" data-view="home">← Back to all topics</button>';
  }
  function setTopicHash(hash) {
    if (!window.location || window.location.hash === hash) return;
    if (window.history && window.history.pushState) window.history.pushState(null, '', hash);
    else window.location.hash = hash;
  }
  function selectTopic(id, updateHash = true) {
    if(!topics[id])return;
    currentTopic=Number(id);course=topics[id].course;glossary=topics[id].glossary;assessment=topics[id].assessment;
    active=0;stage='Discover';practiceIndex=0;selected=null;checked=false;view=currentTopic===3?'development':'topic';if(updateHash)setTopicHash('#topic-'+currentTopic);render(true);
  }
  function diagnosticHTML(s) {
    return '<details class="theory-card"><summary>Check what you know · 3 quick questions</summary><p>This is a starting-point check, not a scored test. Choose an answer or “Not sure”, then compare your reasoning with the guidance.</p>'+(s.practice||[]).slice(0,3).map((q,i)=>'<article class="question-card"><h3>'+esc(q.question)+'</h3><fieldset style="border:0;padding:0"><legend class="muted">Choose your starting answer</legend>'+q.options.map((option,j)=>'<label class="option"><input type="radio" name="diagnostic-'+i+'" value="'+j+'"> <span>'+esc(option)+'</span></label>').join('')+'<label class="option"><input type="radio" name="diagnostic-'+i+'" value="unsure"> <span>Not sure yet</span></label></fieldset><details><summary>Reveal guidance</summary><p><strong>'+esc(q.options[q.answer])+'</strong></p><p>'+esc(q.explanation)+'</p></details></article>').join('')+'<p>If the choices were uncertain, start with the core explanation. If you can explain all three, try the communication challenge and return to any rule you need.</p><div class="toolbar"><button class="button-secondary" data-stage="Rule">Review the forms</button><button class="button-secondary" data-stage="Use">Try the challenge</button></div></details>';
  }
  function renderLesson() {
    const s = course[active]; if (!s) { renderHome(); return; }
    const progress = sessionState();
    let html = '<header class="lesson-header"><p class="eyebrow">'+(currentTopic===2?'SESSION '+String(active+1).padStart(2,'0')+' / 90 MINUTES':'MODULE '+String(active+1).padStart(2,'0'))+'</p><h1>'+esc(s.title)+'</h1><p>'+esc(s.subtitle)+'</p></header><nav class="stage-nav" aria-label="Lesson stages">'+stages.map(x=>'<button class="stage-button'+(stage===x?' active':'')+'" data-stage="'+x+'"'+(stage===x?' aria-current="step"':'')+'>'+x+'</button>').join('')+'</nav><section class="stage-content">';
    if (stage === 'Discover') html += diagnosticHTML(s)+'<p class="eyebrow">LOOK CLOSELY</p><h2>What do you notice?</h2><p>Think individually, compare with a partner, then explain your reasoning.</p><div class="discovery-list">'+(s.discovery.examples||[]).map(x=>'<p class="example">'+esc(x)+'</p>').join('')+'</div>'+list(s.discovery.questions)+'<details class="theory-card"><summary>Reveal the pattern</summary><p>'+esc(s.discovery.insight)+'</p></details><h3>By the end, you can…</h3>'+list(s.outcomes)+'<button class="button" data-stage="Rule">Check the explanation →</button>';
    if (stage === 'Rule') html += '<p class="eyebrow">CORE EXPLANATIONS</p><h2>Give the pattern a name.</h2>'+(s.theory||[]).map((t,i)=>'<article class="theory-card"><span class="card-number">'+String(i+1).padStart(2,'0')+'</span><h3>'+esc(t.title)+'</h3><p>'+esc(t.body)+'</p>'+(t.source?'<p class="source-note">Source: '+esc(Array.isArray(t.source)?t.source.join('; '):t.source)+'</p>':'')+(t.examples||[]).map(x=>'<p class="example">'+esc(x)+'</p>').join('')+'</article>').join('')+'<button class="button" data-stage="Practise">Try it in context →</button>';
    if (stage === 'Practise') html += practiceHTML(s);
    if (stage === 'Use') html += '<p class="eyebrow">MAKE MEANING TOGETHER</p><h2>'+esc(s.production.title)+'</h2><article class="theory-card"><p>'+esc(s.production.instructions)+'</p><h3>Plan → exchange → verify</h3><p>Take a minute to plan. Work with a partner. Your listener should be able to use or reconstruct the information you give.</p><h3>Success criteria</h3>'+list(s.production.criteria)+'</article><details class="theory-card"><summary>Reflection challenge</summary><p>Choose one sentence from your task. Explain the form, meaning and function of a key word. How would another choice change the message?</p></details><button class="button" data-stage="Review">Reflect on your work →</button>';
    if (stage === 'Review') {
      const answered = Object.values(progress.answers||{}).filter(Boolean).length;
      html += '<p class="eyebrow">PAUSE AND REFLECT</p><h2>What can you explain now?</h2><p>'+answered+' of '+s.practice.length+' practice questions answered correctly. You can revisit any question without a penalty.</p><div class="checklist">'+['I can choose an appropriate form.','I can explain the meaning and a useful contrast.','I can identify the grammatical function.'].map((x,i)=>'<label><input type="checkbox" data-reflection="'+i+'" '+(progress.reflection&&progress.reflection[i]?'checked':'')+'> '+esc(x)+'</label>').join('')+'</div><label for="uncertainty">One point I want to revisit</label><textarea id="uncertainty" rows="3" data-uncertainty placeholder="Name a contrast or write an example…">'+esc(progress.uncertainty||'')+'</textarea><div class="toolbar"><button class="button" data-action="reviewed">'+(progress.reviewed?'Session reviewed ✓':'Mark session reviewed')+'</button><button class="button-secondary" data-stage="Practise">I need more practice</button></div><p class="muted">A review mark records participation and reflection. It is not a certificate of mastery.</p>';
    }
    if (stage === 'Homework') html += '<p class="eyebrow">RETRIEVE AND TRANSFER</p><h2>Take the learning further.</h2>'+list(s.homework,'homework-list')+'<article class="theory-card"><h3>Prepare an oral explanation</h3><p>Define the term → give an example → identify its form and function → explain a contrast.</p></article><div class="toolbar"><button class="button-secondary" data-view="glossary">Open the glossary</button>'+(active===course.length-1?'<button class="button" data-view="assessment">Open topic review →</button>':'<button class="button" data-session="'+(active+1)+'">Next session →</button>')+'</div>';
    app.innerHTML = html+'</section>';
  }
  function practiceHTML(s) {
    const q = s.practice[practiceIndex]; if (!q) return '<p>No practice questions available.</p>';
    return '<p class="eyebrow">PRACTISE WITH FEEDBACK</p><div class="toolbar" style="justify-content:space-between"><h2>Explain your choice.</h2><span class="tag">'+(practiceIndex+1)+' / '+s.practice.length+'</span></div><article class="question-card"><h3>'+esc(q.question)+'</h3><fieldset style="border:0;padding:0;margin:0"><legend class="muted">Choose one answer. Discuss your reason before checking.</legend>'+(q.options||[]).map((option,i)=>'<label class="option'+(checked&&i===q.answer?' correct':checked&&i===selected?' incorrect':'')+'"><input type="radio" name="answer" value="'+i+'" '+(selected===i?'checked':'')+' '+(checked?'disabled':'')+'> <span>'+esc(option)+'</span></label>').join('')+'</fieldset>'+(checked?'<div class="feedback" role="status"><strong>'+(selected===q.answer?'That fits.':'Let’s look at the meaning.')+'</strong><p>'+esc(q.explanation)+'</p></div>':'')+'<div class="toolbar">'+(!checked?'<button class="button" data-action="check" '+(selected===null?'disabled':'')+'>Check answer</button>':'<button class="button-secondary" data-action="retry">Try again</button>')+'<button class="button-secondary" data-action="previous-question" '+(practiceIndex===0?'disabled':'')+'>Previous</button><button class="button-secondary" data-action="next-question">'+(practiceIndex===s.practice.length-1?'Review session →':'Next question →')+'</button></div></article><p class="muted">No timer. No lost points. The explanation matters more than the first attempt.</p>';
  }
  function renderGlossary(query) {
    const q = (query||'').toLowerCase();
    const terms = glossary.filter(x=>(x.term+' '+x.definition+' '+(x.note||'')).toLowerCase().includes(q));
    app.innerHTML = '<header class="lesson-header"><p class="eyebrow">EXAM LANGUAGE / '+glossary.length+' TERMS</p><h1>The grammar glossary.</h1><p>Learn a definition, illustrate it and explain a contrast.</p></header><div class="theory-card"><p>'+(currentTopic===2?'Kaushanskaya’s classification is the examination reference. Universal and detaching are additional teaching labels mapped to the defining-pronoun group, not separate groups in the uploaded edition.':'Definitions and contrasts support the noun and article modules. Read them alongside the examples and source notes in each explanation.')+'</p></div><div class="toolbar"><label for="glossarySearch">Find a term</label><input id="glossarySearch" class="search-input" type="search" placeholder="Search terms and definitions…" value="'+esc(query||'')+'"></div><p class="muted">'+terms.length+' terms</p><div class="glossary-grid">'+terms.map(x=>'<article class="glossary-card"><h2>'+esc(x.term)+'</h2><p>'+esc(x.definition)+'</p>'+(x.note?'<p class="muted">'+esc(x.note)+'</p>':'')+'</article>').join('')+'</div>';
  }
  function renderAssessment() {
    app.innerHTML = '<header class="lesson-header"><p class="eyebrow">'+(currentTopic===2?'FINAL TAKE-HOME ASSESSMENT':'TOPIC 1 CONSOLIDATION')+'</p><h1>Put your knowledge to work.</h1><p>'+(currentTopic===2?'Open-book · approximately 60–70 minutes · 60 marks':'Open-book review · explain your choices')+'</p></header><article class="theory-card"><h2>Before you begin</h2><p>Use the course materials. Give your own explanations and examples. '+(currentTopic===2?'This task replaces the regular homework after Session 4.':'Use this review after studying the noun and article modules; your teacher can select sections for assessment.')+' Drafts save in this browser; download your responses to keep or submit them.</p><div class="toolbar"><button class="button" data-action="download-assessment">Download my responses</button><button class="button-secondary" data-action="print">Print assessment</button></div><p class="muted" id="draftStatus" role="status">Drafts are stored on this device when browser storage is available.</p></article>'+assessment.map((s,i)=>'<section class="assessment-section theory-card"><h2>'+esc(s.title)+'</h2><p>'+esc(s.instructions)+'</p><ol>'+(s.items||[]).map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol><label for="draft-'+i+'">Your response</label><textarea id="draft-'+i+'" data-draft="'+i+'" rows="6" placeholder="Write your answers and explanations…">'+esc(drafts()[i]||'')+'</textarea></section>').join('');
  }
  function render(focus) {
    if(currentTopic===3 && view!=='home')renderDevelopment(); else if(view==='lesson')renderLesson(); else if(view==='glossary')renderGlossary(''); else if(view==='assessment')renderAssessment(); else if(view==='topic')renderTopic(); else renderHome();
    updateNavigation(); if(focus)focusMain();
  }
  function openSession(i) { if(!course[i])return; active=i;view='lesson';stage='Discover';practiceIndex=0;selected=null;checked=false;sessionState().started=true;persist();render(true); }
  document.addEventListener('click', e=>{
    const button=e.target.closest('button,[data-view]'); if(!button)return;
    if(button.dataset.topic!==undefined){selectTopic(button.dataset.topic);return;}
    if(button.dataset.session!==undefined){openSession(Number(button.dataset.session));return;}
    if(button.dataset.view){view=button.dataset.view;if(view==='home')setTopicHash('#topics');render(true);return;}
    if(button.dataset.stage){stage=button.dataset.stage;selected=null;checked=false;render(true);return;}
    const action=button.dataset.action;
    if(action==='check'&&selected!==null){checked=true;sessionState().answers[practiceIndex]=selected===course[active].practice[practiceIndex].answer;persist();render();}
    if(action==='retry'){selected=null;checked=false;render();}
    if(action==='previous-question'){practiceIndex=Math.max(0,practiceIndex-1);selected=null;checked=false;render();}
    if(action==='next-question'){if(practiceIndex===course[active].practice.length-1)stage='Review';else practiceIndex++;selected=null;checked=false;render();}
    if(action==='reviewed'){sessionState().reviewed=true;persist();render();}
    if(action==='print')window.print();
    if(action==='reset'&&window.confirm('Clear progress and assessment drafts saved in this browser?')){state.sessions={};state.draftsByTopic={};persist();render();}
    if(action==='download-assessment'){
      const text=topics[currentTopic].title.toUpperCase()+' — '+(currentTopic===2?'FINAL ASSESSMENT':'CONSOLIDATION REVIEW')+'\n\n'+assessment.map((s,i)=>s.title+'\n'+s.instructions+'\n'+s.items.map((x,j)=>(j+1)+'. '+x).join('\n')+'\n\nRESPONSE\n'+(drafts()[i]||'[No response yet]')).join('\n\n----------------\n\n');
      const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='grammar-studio-topic-'+currentTopic+'-responses.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }
  });
  document.addEventListener('change',e=>{
    if(e.target.name==='answer'){selected=Number(e.target.value);const check=app.querySelector('[data-action="check"]');if(check)check.disabled=false;}
    if(e.target.dataset.reflection!==undefined){sessionState().reflection[e.target.dataset.reflection]=e.target.checked;persist();}
  });
  document.addEventListener('input',e=>{
    if(e.target.id==='glossarySearch'){const query=e.target.value;renderGlossary(query);const input=document.getElementById('glossarySearch');input.focus();}
    if(e.target.dataset.draft!==undefined){drafts()[e.target.dataset.draft]=e.target.value;persist();const el=document.getElementById('draftStatus');if(el)el.textContent='Draft updated. Download your responses to keep a separate copy.';}
    if(e.target.hasAttribute('data-uncertainty')){sessionState().uncertainty=e.target.value;persist();}
  });
  function updateBoard(){document.body.classList.toggle('board-mode',state.board);const button=document.getElementById('boardToggle');if(button){button.setAttribute('aria-pressed',String(state.board));button.textContent=state.board?'Exit board mode':'Board mode';}}
  const board=document.getElementById('boardToggle');if(board)board.addEventListener('click',()=>{state.board=!state.board;persist();updateBoard();});
  const print=document.getElementById('printButton');if(print)print.addEventListener('click',()=>window.print());
  function openHash() {
    const hash = window.location ? window.location.hash : '';
    const match = /^#topic-([123])$/.exec(hash);
    if (match) selectTopic(Number(match[1]), false);
    else { view='home';render(true); }
  }
  if(window.addEventListener) window.addEventListener('hashchange', openHash);
  updateBoard();openHash();
})();
