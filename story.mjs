/* One editorial model drives scene identity, historical dates, navigation and music.
   Thematic chapters explicitly retain the last historical landmark; no section-index mapping. */
export const EVENTS = [
 {id:'birth',date:'1678',scene:'prologue',phase:0,x:.06,caption:'Рождение в Венеции · ранние годы'},
 {id:'pieta',date:'1703',scene:'venice',phase:0,x:.27,caption:'Священный сан · начало работы в Pietà'},
 {id:'europe',date:'1711',scene:'career',phase:0,x:.39,caption:'L’estro armonico · европейское признание'},
 {id:'seasons',date:'1725',scene:'seasons',phase:0,x:.55,caption:'Публикация Op. 8 с «Временами года»'},
 {id:'last',date:'1741',scene:'return',phase:0,x:.76,caption:'Последние годы · Вена'},
 {id:'archive',date:'1926',scene:'rediscovery',phase:0,x:.94,caption:'Находка и исследование рукописей'}
];
/* Music cue boundaries are explicit episode starts, independent from the visual-scene resolver. */
export const MUSIC_CUES = [
 {id:'prologue',track:0},
 {id:'concert',track:1},
 {id:'seasons',track:'seasons'},
 {id:'legacy',track:6}
];
export function resolveMusicTrack(geometry,y,seasonIndex=0){
 let cue=MUSIC_CUES[0];
 for(const item of MUSIC_CUES){const g=geometry.find(part=>part.id===item.id);if(g&&y>=g.top)cue=item;else if(g&&y<g.top)break}
 return cue.track==='seasons'?2+clamp(Math.floor(seasonIndex),0,3):cue.track;
}

export const CHAPTERS = [
 {id:'prologue',label:'Пролог',event:'birth',music:0},
 {id:'origins',label:'Ранние годы',event:'birth',music:0},
 {id:'venice',label:'Венеция и Pietà',event:'pieta',music:0,states:[{id:'ordination',from:0,to:.48},{id:'pieta',from:.48,to:1}]},
 {id:'concert',label:'Скрипка и оркестр',carry:'pieta',music:1},
 {id:'career',label:'Признание и театр',event:'europe',music:1},
 {id:'seasons',label:'Четыре времени года',event:'seasons',music:'seasons'},
 {id:'legacy',label:'Наследие разных лет',carry:'seasons',music:6},
 {id:'return',label:'Последние годы',event:'last',music:6},
 {id:'rediscovery',label:'Возвращение музыки',event:'archive',music:6},
 {id:'epilogue',label:'Музыкальное наследие',carry:'archive',music:6}
];
export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const stageTopAt=(g,y)=>Math.min(Math.max(g.top-y,0),g.top+g.height-y-g.stageHeight);
const overlap=(a,b,c,d)=>Math.max(0,Math.min(b,d)-Math.max(a,c));
export function sceneVisibility(g,y,vh,safeBottom=48){
 const stageTop=stageTopAt(g,y),visible=overlap(stageTop,stageTop+g.stageHeight,0,vh)/vh;
 const textTop=stageTop+g.readTop,textBottom=stageTop+g.readBottom;
 const reading=overlap(textTop,textBottom,72,vh-safeBottom)/Math.max(1,Math.min(g.readBottom-g.readTop,vh-safeBottom-72));
 const heading=overlap(stageTop+g.headingTop,stageTop+g.headingBottom,72,vh-safeBottom);
 return{stageTop,visible,reading,heading,score:visible*.55+reading*.45};
}
export function resolveVisibleScene(geometry,y,vh,previousId,safeBottom=48){
 const candidates=geometry.map(g=>({g,...sceneVisibility(g,y,vh,safeBottom)}));
 let main=candidates.reduce((best,v)=>v.score>best.score&&v.visible>0&&(v.heading>12||v.g.top<=y)?v:best,candidates[0]);
 const previous=candidates.find(v=>v.g.id===previousId);
 // A small visual-coverage band stabilizes a boundary without advancing to unseen content.
 if(previous&&previous.visible>0&&main.score-previous.score<.035)main=previous;
 const chapter=CHAPTERS.find(c=>c.id===main.g.id),progress=clamp((y-main.g.top)/Math.max(1,main.g.height-main.g.stageHeight));
 const state=chapter.states?.find(s=>progress>=s.from&&(progress<s.to||s.to===1));
 return{scene:chapter,geometry:main.g,event:EVENTS.find(e=>e.id===(chapter.event||chapter.carry)),progress,internalState:state?.id||chapter.id,visibility:main};
}
export function navigationY(event,geometry){const g=geometry.find(g=>g.id===event.scene);return g.top+Math.max(0,g.height-g.stageHeight)*event.phase}
export function createHistory({nav,indicator,mobile,reduce,getGeometry}){
 const path=nav.querySelector('.history-drawn'),marker=nav.querySelector('.history-marker'),buttons=[...nav.querySelectorAll('button')];
 const trigger=mobile.querySelector('.mobile-history-toggle'),panel=mobile.querySelector('.mobile-history-panel'),list=mobile.querySelector('.mobile-history-list');
 const close=()=>{trigger.setAttribute('aria-expanded','false');panel.hidden=true};
 trigger.addEventListener('click',()=>{const open=trigger.getAttribute('aria-expanded')!=='true';trigger.setAttribute('aria-expanded',String(open));panel.hidden=!open});
 mobile.addEventListener('keydown',e=>{if(e.key==='Escape'){close();trigger.focus()}});
 document.addEventListener('pointerdown',e=>{if(!mobile.contains(e.target))close()});
 EVENTS.forEach(event=>{const b=document.createElement('button');b.type='button';b.dataset.event=event.id;b.innerHTML=`<span>${event.date}</span><small>${event.caption}</small>`;b.addEventListener('click',()=>{close();window.scrollTo({top:navigationY(event,getGeometry()),behavior:reduce.matches?'instant':'smooth'});trigger.focus({preventScroll:true})});list.append(b)});
 let length=0,landmarks=[],lastEvent='',lastScene='',lastLength=0,motion=[],lastChange=0;
 buttons.forEach((b,i)=>{const event=EVENTS[i];b.dataset.event=event.id;b.dataset.target=event.scene;b.dataset.phase=event.phase;b.style.setProperty('--x',`${event.x*100}%`);b.querySelector('span').textContent=event.date;b.querySelector('small').textContent=event.caption;b.addEventListener('click',()=>window.scrollTo({top:navigationY(event,getGeometry()),behavior:reduce.matches?'instant':'smooth'}))});
 function measure(){
  length=path.getTotalLength();path.style.strokeDasharray=`${length} ${length}`;
  landmarks=EVENTS.map(event=>{let low=0,high=length;for(let i=0;i<22;i++){const mid=(low+high)/2;if(path.getPointAtLength(mid).x<event.x*1000)low=mid;else high=mid}return{event,distance:(low+high)/2}});
  lastEvent='';motion.forEach(a=>a.cancel());motion=[];
 }
 function update(view){
  const {scene,event}=view,landmark=landmarks.find(p=>p.event===event);if(!landmark)return;
  mobile.querySelector('.mobile-history-date').textContent=event.date;
  mobile.querySelector('.mobile-history-title').textContent=scene.label;
  mobile.querySelector('.mobile-history-progress i').style.width=`${Math.max(0,Math.min(100,(CHAPTERS.indexOf(scene)+view.progress)/CHAPTERS.length*100))}%`;
  list.querySelectorAll('button').forEach(b=>{if(b.dataset.event===event.id)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')});
  if(scene.id!==lastScene){lastScene=scene.id;const chapter=CHAPTERS.indexOf(scene);indicator.querySelector('span').textContent=`${String(chapter+1).padStart(2,'0')} / ${CHAPTERS.length}`;indicator.querySelector('b').textContent=scene.label;nav.querySelector('.history-chapter').textContent=scene.label+(scene.event?'':' · тематическая сцена');nav.classList.toggle('is-thematic',!scene.event)}
  nav.dataset.scene=scene.id;nav.dataset.state=view.internalState;
  if(lastEvent===event.id)return;
  const previous=lastEvent,lastDistance=lastLength,distance=landmark.distance,point=path.getPointAtLength(distance),now=performance.now();
  motion.forEach(a=>a.cancel());motion=[];
  // Marker, fill and highlight share this one event snapshot, including reverse scrolling.
  buttons.forEach(b=>{if(b.dataset.event===event.id)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')});
  marker.style.transform=`translate(${point.x}px,${point.y}px)`;path.style.strokeDashoffset=String(length-distance);
  nav.dataset.event=marker.dataset.event=event.id;nav.dataset.date=event.date;nav.dataset.distance=String(distance);nav.dataset.pathLength=String(length);
  if(previous&&Math.abs(EVENTS.indexOf(event)-EVENTS.findIndex(e=>e.id===previous))===1&&!reduce.matches&&now-lastChange>160&&marker.animate){
   const frames=Array.from({length:9},(_,i)=>{const d=lastDistance+(distance-lastDistance)*i/8,p=path.getPointAtLength(d);return{transform:`translate(${p.x}px,${p.y}px)`,offset:i/8}});
   const opts={duration:110,easing:'linear'};motion=[marker.animate(frames,opts),path.animate([{strokeDashoffset:String(length-lastDistance)},{strokeDashoffset:String(length-distance)}],opts)];const start=document.timeline.currentTime;motion.forEach(a=>a.startTime=start);
  }
  lastEvent=event.id;lastLength=distance;lastChange=now;
 }
 reduce.addEventListener('change',()=>{motion.forEach(a=>a.cancel());motion=[]});
 return{measure,update};
}
