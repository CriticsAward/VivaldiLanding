/* One editorial model drives scene identity, historical dates, navigation and music.
   Thematic chapters explicitly retain the last historical landmark; no section-index mapping. */
export const EVENTS = [
 {id:'birth',date:'1678',scene:'prologue',phase:0,x:.06,caption:'Рождение в Венеции · ранние годы'},
 {id:'pieta',date:'1703',scene:'venice',phase:0,x:.27,caption:'Священный сан · начало работы в Pietà'},
 {id:'europe',date:'1711',scene:'career',phase:0,x:.39,caption:'L’estro armonico · европейское признание'},
 {id:'opera',date:'1713',scene:'opera',phase:0,x:.46,caption:'Ottone in villa · оперный дебют'},
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
 {id:'opera',label:'Оперный дебют',event:'opera',music:1},
 {id:'seasons',label:'Четыре времени года',event:'seasons',music:'seasons'},
 {id:'anna',label:'Анна Жиро',carry:'seasons',context:'с 1726',music:5},
 {id:'legacy',label:'Наследие разных лет',carry:'seasons',context:'1735',music:6},
 {id:'ferrara',label:'Феррарский перелом',carry:'seasons',context:'1737–1739',music:6},
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
 const path=nav.querySelector('.history-drawn'),clip=nav.querySelector('.history-fill-clip'),marker=nav.querySelector('.history-marker'),buttons=[...nav.querySelectorAll('button')];
 const trigger=mobile.querySelector('.mobile-history-toggle'),panel=mobile.querySelector('.mobile-history-panel'),list=mobile.querySelector('.mobile-history-list');
 const close=()=>{trigger.setAttribute('aria-expanded','false');panel.hidden=true};
 trigger.addEventListener('click',()=>{const open=trigger.getAttribute('aria-expanded')!=='true';trigger.setAttribute('aria-expanded',String(open));panel.hidden=!open});
 mobile.addEventListener('keydown',e=>{if(e.key==='Escape'){close();trigger.focus()}});
 document.addEventListener('pointerdown',e=>{if(!mobile.contains(e.target))close()});
 EVENTS.forEach(event=>{const b=document.createElement('button');b.type='button';b.dataset.event=event.id;b.innerHTML=`<span>${event.date}</span><small>${event.caption}</small>`;b.addEventListener('click',()=>{close();window.scrollTo({top:navigationY(event,getGeometry()),behavior:reduce.matches?'instant':'smooth'});trigger.focus({preventScroll:true})});list.append(b)});
 let length=0,landmarks=[],chapterStops=[],lastScene='',lastEvent='';
 buttons.forEach((b,i)=>{const event=EVENTS[i];b.dataset.event=event.id;b.dataset.target=event.scene;b.dataset.phase=event.phase;b.style.setProperty('--x',`${event.x*100}%`);b.querySelector('span').textContent=event.date;b.querySelector('small').textContent=event.caption;b.addEventListener('click',()=>window.scrollTo({top:navigationY(event,getGeometry()),behavior:reduce.matches?'instant':'smooth'}))});
 function measure(){
  length=path.getTotalLength();
  const atX=x=>{let low=0,high=length;for(let i=0;i<22;i++){const mid=(low+high)/2;if(path.getPointAtLength(mid).x<x)low=mid;else high=mid}return(low+high)/2};
  landmarks=EVENTS.map(event=>({event,distance:atX(event.x*1000)}));
  const fixed=CHAPTERS.map((chapter,i)=>({i,x:EVENTS.find(event=>event.scene===chapter.id)?.x})).filter(stop=>stop.x!==undefined);
  fixed.push({i:CHAPTERS.length-1,x:.985});
  chapterStops=CHAPTERS.map((chapter,i)=>{
   const before=[...fixed].reverse().find(stop=>stop.i<=i),after=fixed.find(stop=>stop.i>=i);
   const x=before.i===after.i?before.x:before.x+(after.x-before.x)*(i-before.i)/(after.i-before.i);
   const g=getGeometry().find(part=>part.id===chapter.id);
   return{x,y:Math.max(0,g.top-innerHeight*.35)};
  });
  const svg=nav.querySelector('.history-string'),height=svg.getBoundingClientRect().height;
  landmarks.forEach(({event,distance},i)=>{const point=path.getPointAtLength(distance),button=buttons[i];button.style.setProperty('--path-x',`${point.x/1000*svg.clientWidth}px`);button.style.setProperty('--path-y',`${point.y/85*height}px`)});
  lastEvent='';
 }
 function update(view,y){
  const {scene}=view;if(!chapterStops.length)return;
  const next=chapterStops.findIndex(stop=>stop.y>y),right=next<0?chapterStops.length-1:Math.max(1,next),left=right-1;
  const a=chapterStops[left],b=chapterStops[right],fraction=clamp((y-a.y)/Math.max(1,b.y-a.y));
  const x=y<=chapterStops[0].y?chapterStops[0].x:y>=chapterStops.at(-1).y?chapterStops.at(-1).x:a.x+(b.x-a.x)*fraction;
  let low=0,high=length;for(let i=0;i<22;i++){const mid=(low+high)/2;if(path.getPointAtLength(mid).x<x*1000)low=mid;else high=mid}
  const distance=(low+high)/2,point=path.getPointAtLength(distance);
  const event=landmarks.reduce((reached,landmark)=>landmark.distance<=distance+0.001?landmark.event:reached,landmarks[0].event);
  const mobileEvent=view.event;
  mobile.querySelector('.mobile-history-date').textContent=scene.context||mobileEvent.date;
  mobile.querySelector('.mobile-history-title').textContent=scene.label;
  mobile.querySelector('.mobile-history-progress i').style.width=`${Math.max(0,Math.min(100,(CHAPTERS.indexOf(scene)+view.progress)/CHAPTERS.length*100))}%`;
  list.querySelectorAll('button').forEach(b=>{if(b.dataset.event===mobileEvent.id)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')});
  if(scene.id!==lastScene){lastScene=scene.id;const chapter=CHAPTERS.indexOf(scene);indicator.querySelector('span').textContent=`${String(chapter+1).padStart(2,'0')} / ${CHAPTERS.length}`;indicator.querySelector('b').textContent=scene.label;nav.querySelector('.history-chapter').textContent=scene.label+(scene.context?` · ${scene.context}`:scene.event?'':' · тематическая сцена');nav.classList.toggle('is-thematic',!scene.event)}
  nav.dataset.scene=scene.id;nav.dataset.state=view.internalState;
  if(lastEvent!==event.id){buttons.forEach(b=>{if(b.dataset.event===event.id)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')});lastEvent=event.id}
  // The clip edge and marker use the same point on the original SVG path.
  marker.style.transform=`translate(${point.x}px,${point.y}px)`;clip.style.width=`${point.x}px`;
  nav.dataset.event=marker.dataset.event=event.id;nav.dataset.date=event.date;nav.dataset.distance=String(distance);nav.dataset.pathLength=String(length);
 }
 return{measure,update};
}
