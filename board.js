/* Fullscreen classroom presentation. No remote dependencies. */
(function () {
  'use strict';
  const app = document.getElementById('app');
  const toggle = document.getElementById('boardToggle');
  if (!app || !toggle) return;
  let slides = [], index = 0, root = null, restorers = [], changing = false, lastKey = '';
  let fullscreenRequested = false, fullscreenNote = '', openAtEnd = false;
  const controls = document.createElement('nav');
  controls.className = 'board-slide-controls'; controls.hidden = true;
  controls.setAttribute('aria-label', 'Presentation slides');
  controls.innerHTML = '<button type="button" class="button-secondary" data-board-prev>← Previous block</button><span class="board-slide-count" role="status" aria-live="polite"></span><button type="button" class="button" data-board-next>Next block →</button><small class="board-fullscreen-note"></small>';
  document.body.appendChild(controls);
  const active = () => document.body.classList.contains('board-mode');
  const appObserver = new MutationObserver(() => { if (active() && !changing) build(); });
  const observe = () => appObserver.observe(app, {childList:true, subtree:true});
  function suspend(fn) { changing = true; appObserver.disconnect(); try { fn(); } finally { changing = false; observe(); } }
  function cleanup() {
    restorers.reverse().forEach(fn => fn()); restorers = [];
    app.querySelectorAll('.board-slide').forEach(el => el.replaceWith(...el.childNodes));
    app.querySelectorAll('[data-board-hidden]').forEach(el => { el.hidden = false; el.removeAttribute('data-board-hidden'); });
    app.querySelectorAll('.board-fit-scroll').forEach(el => el.classList.remove('board-fit-scroll'));
    app.style.removeProperty('--board-content-size');
    slides=[];root=null;controls.hidden=true;app.classList.remove('board-presentation');
  }
  function splitWarmups(container) {
    Array.from(container.children).filter(el=>el.matches('.topic-warmup')).forEach(section=>{
      const cards=Array.from(section.children).filter(el=>el.matches('.mini-check,.question-card'));
      if(!cards.length)return;
      const slots=cards.map(el=>({el,next:el.nextSibling}));section.after(...cards);
      restorers.push(()=>{if(section.isConnected)slots.reverse().forEach(slot=>section.insertBefore(slot.el,slot.next&&slot.next.parentNode===section?slot.next:null));});
    });
  }
  function splitDiagnostics(container) {
    Array.from(container.children).forEach(details=>{
      if(details.tagName!=='DETAILS')return;
      const questions=Array.from(details.children).filter(el=>el.matches('article.question-card'));
      if(questions.length<2)return;
      const slots=questions.map(el=>({el,next:el.nextSibling}));
      const wasOpen=details.open;details.open=true;
      details.after(...questions);
      restorers.push(()=>{if(details.isConnected){slots.reverse().forEach(slot=>details.insertBefore(slot.el,slot.next&&slot.next.parentNode===details?slot.next:null));details.open=wasOpen;}});
    });
  }
  function splitExamples(container) {
    Array.from(container.children).forEach(card => {
      if (!card.matches('article.theory-card')) return;
      const examples=Array.from(card.children).filter(el=>el.classList.contains('example'));
      if(examples.length<3) return;
      const title=card.querySelector('h3,h2');
      const chunks=[];for(let n=0;n<examples.length;n+=3)chunks.push(examples.slice(n,n+3));
      const additions=[];
      chunks.forEach((chunk,i)=>{
        const more=document.createElement('article');more.className='theory-card board-example-card';
        const heading=document.createElement('h3');heading.textContent='Examples · '+(title?title.textContent:'Apply the pattern')+(chunks.length>1?' ('+(i+1)+'/'+chunks.length+')':'');more.appendChild(heading);
        chunk.forEach(el=>more.appendChild(el));additions.push(more);
      });
      card.after(...additions);
      restorers.push(()=>{if(card.isConnected){examples.forEach(el=>card.appendChild(el));additions.forEach(el=>el.remove());}});
    });
  }
  function splitGrids(container) {
    Array.from(container.children).forEach(section=>{
      const grid=section.querySelector && section.querySelector('.session-grid,.topic-grid,.glossary-grid');
      if(!grid || grid.children.length<3) return;
      const original=Array.from(grid.children), additions=[];
      const heading=section.querySelector('h2');
      original.forEach(card=>{
        const more=document.createElement('section');more.className='board-topic-block';
        if(heading){const h=document.createElement('h2');h.textContent=heading.textContent;more.appendChild(h);}
        more.appendChild(card);additions.push(more);
      });
      section.after(...additions);section.dataset.boardGridIntro='true';
      restorers.push(()=>{if(grid.isConnected){original.forEach(el=>grid.appendChild(el));additions.forEach(el=>el.remove());delete section.dataset.boardGridIntro;}});
    });
  }
  function keyForView() {
    return (app.querySelector('h1')?.textContent||'')+'|'+(app.querySelector('.stage-button.active')?.textContent||'')+'|'+(app.querySelector('.question-card h3')?.textContent||'');
  }
  function build() {
    if(!active())return;
    const newKey=keyForView(), oldIndex=index;
    suspend(()=>{
      cleanup(); root=app.querySelector('.stage-content')||app;
      if(root===app)splitWarmups(root);splitDiagnostics(root);splitExamples(root); if(root===app)splitGrids(root);
      const children=Array.from(root.children).filter(el=>!(root===app && el.matches('.lesson-header,.stage-nav')));
      let pending=[];
      const add=nodes=>{
        if(!nodes.length)return;
        const wrapper=document.createElement('div');wrapper.className='board-slide';
        if(nodes.some(el=>el.matches('.mini-check,.activity-card')))wrapper.classList.add('board-task-slide');
        nodes[0].before(wrapper);nodes.forEach(el=>wrapper.appendChild(el));slides.push(wrapper);
      };
      children.forEach(el=>{
        const introOnly=el.matches('.topic-warmup') || el.dataset.boardGridIntro==='true';
        const major=!introOnly && (el.matches('article,details,.discovery-list,.question-card,.flashcard,.board-topic-block,.hero,.assessment-section,.glossary-card,.theory-card') || (root===app && el.tagName==='SECTION'));
        if(major){add([...pending,el]);pending=[];}
        else if(el.matches('ul,ol,.checklist') && pending.length){add([...pending,el]);pending=[];}
        else if(el.matches('button,.toolbar') && slides.length && !pending.length){slides[slides.length-1].appendChild(el);}
        else pending.push(el);
      });
      if(pending.length){
        const supportOnly=pending.every(el=>el.matches('p.muted,.source-note,button,.toolbar'));
        if(supportOnly && slides.length)pending.forEach(el=>slides[slides.length-1].appendChild(el));
        else add(pending);
      }
      if(!slides.length){controls.hidden=true;return;}
      app.classList.add('board-presentation');controls.hidden=false;
      index=openAtEnd?slides.length-1:newKey===lastKey?Math.min(oldIndex,slides.length-1):0;openAtEnd=false;lastKey=newKey;
      show();
    });
  }
  function fit() {
    if(!slides[index] || !active())return;
    const current=slides[index];
    app.style.setProperty('--board-content-size','24px');current.classList.remove('board-fit-scroll');
    const header=app.querySelector('.lesson-header'),stages=app.querySelector('.stage-nav');
    const top=Math.max(current.getBoundingClientRect().top,document.querySelector('.site-header')?.getBoundingClientRect().bottom||0);
    const available=Math.max(190,window.innerHeight-controls.getBoundingClientRect().height-top-24);
    current.style.maxHeight=available+'px';
    for(let size=24;size>=18;size--){
      app.style.setProperty('--board-content-size',size+'px');
      if(current.scrollHeight<=available+2)break;
    }
    if(current.scrollHeight>available+2)current.classList.add('board-fit-scroll');
  }
  function show() {
    slides.forEach((el,i)=>{el.hidden=i!==index;el.setAttribute('aria-label','Block '+(i+1)+' of '+slides.length);});
    controls.querySelector('.board-slide-count').textContent='Block '+(index+1)+' / '+slides.length;
    const route=stageRoute();
    controls.querySelector('[data-board-prev]').disabled=index===0 && !route.previous;
    controls.querySelector('[data-board-next]').disabled=index===slides.length-1 && !route.next;
    controls.querySelector('.board-fullscreen-note').textContent=fullscreenNote;
    requestAnimationFrame(fit);
  }
  function stageRoute() {
    const tabs=Array.from(app.querySelectorAll('.stage-nav [data-stage]'));
    const i=tabs.findIndex(el=>el.classList.contains('active')||el.getAttribute('aria-current')==='step');
    return {previous:i>0?tabs[i-1]:null,next:i>=0&&i<tabs.length-1?tabs[i+1]:null};
  }
  function move(delta){
    if(!active())return;
    const next=index+delta;
    if(next<0||next>=slides.length){
      const route=stageRoute(),target=delta>0?route.next:route.previous;
      if(target){openAtEnd=delta<0;target.click();return;}
    }
    index=Math.min(slides.length-1,Math.max(0,next));show();
  }
  controls.querySelector('[data-board-prev]').addEventListener('click',()=>move(-1));
  controls.querySelector('[data-board-next]').addEventListener('click',()=>move(1));
  document.addEventListener('keydown',e=>{
    if(!active()||e.altKey||e.ctrlKey||e.metaKey||e.target.closest('input,textarea,select,[contenteditable="true"]'))return;
    if(e.key==='ArrowRight'||e.key==='PageDown'){e.preventDefault();move(1);}
    if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();move(-1);}
  });
  toggle.addEventListener('click',()=>{
    if(!active()){
      fullscreenRequested=true;fullscreenNote='';
      if(document.documentElement.requestFullscreen){document.documentElement.requestFullscreen().catch(()=>{fullscreenNote='Fullscreen was unavailable. Presentation controls still work.';if(active())show();});}
      else fullscreenNote='Fullscreen is not supported in this browser. Presentation controls still work.';
    }else{
      fullscreenRequested=false;
      if(document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen().catch(()=>{});
    }
  },true);
  const bodyObserver=new MutationObserver(()=>{
    if(active())build();else suspend(cleanup);
  });
  bodyObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
  document.addEventListener('fullscreenchange',()=>{
    if(!document.fullscreenElement && fullscreenRequested && active()){fullscreenRequested=false;toggle.click();}
    else if(active())requestAnimationFrame(fit);
  });
  window.addEventListener('grammar-render',()=>{if(active())build();});
  window.addEventListener('grammar-check',()=>{if(active())requestAnimationFrame(fit);});
  window.addEventListener('resize',()=>{if(active())requestAnimationFrame(fit);});
  document.addEventListener('toggle',e=>{if(active()&&e.target.tagName==='DETAILS')requestAnimationFrame(fit);},true);
  observe(); if(active())build();
})();
