(()=>{
'use strict';
const root=document.documentElement;root.classList.add('enhanced');
const episodes=[...document.querySelectorAll('[data-episode]')],year=document.querySelector('.seasons'),yearStage=year.querySelector('.stage'),panels=[...document.querySelectorAll('.season-panel')],sound=document.querySelector('.sound'),status=document.querySelector('.status'),hint=document.querySelector('.sound-hint'),canvas=document.querySelector('.weather'),ctx=canvas.getContext('2d'),media=[document.querySelector('#track-a'),document.querySelector('#track-b')];
const names=['spring','summer','autumn','winter'],labels=['La Follia · RV 63','Две скрипки · RV 522','Весна · RV 269','Лето · RV 315','Осень · RV 293','Зима · RV 297','Gloria · Domine Deus'],tracks=['media/follia.mp3','media/concerto-522.mp3',...names.map(n=>`media/${n}.mp3`),'media/gloria.mp3'],reduce=matchMedia('(prefers-reduced-motion: reduce)');
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
let geometry=[],raf=0,current=-1,currentTrack=0,musicEpisode=0,visualSeason=-1,seasonLocal=0,enabled=false,graph=null,gains=[],analyser=null,audioData=null,active=-1,request=0,pauseTimers=[0,0],weatherRAF=0,lastFrame=0,level=0,particles=[],audioRAF=0,lastAudioSample=0;
media.forEach((a,i)=>{a.loop=true;a.preload=i===0?'auto':'none';a.playsInline=true});
function measure(){geometry=episodes.map(node=>{const stage=node.querySelector('.stage');return{node,top:node.getBoundingClientRect().top+scrollY,height:node.offsetHeight,stageHeight:stage.offsetHeight}});measureHistory();resizeWeather();schedule()}
function schedule(){if(!raf)raf=requestAnimationFrame(render)}
function render(){
 raf=0;const y=scrollY,vh=innerHeight;const max=root.scrollHeight-vh;document.querySelector('.journey i').style.height=`${clamp(y/max)*100}%`;
 geometry.forEach(({node,top,height,stageHeight})=>{
  if(y+vh<top||y>top+height)return;
  const p=clamp((y-top)/Math.max(1,height-stageHeight));node.style.setProperty('--p',p.toFixed(4));node.style.setProperty('--turn',Math.sin(p*Math.PI*2).toFixed(4));
  if(node.classList.contains('venice')){const show=p>.48;node.classList.toggle('is-pieta',show);node.style.setProperty('--pieta',clamp((p-.35)/.25).toFixed(4));toggleBeat(node.querySelector('.priest'),!show);toggleBeat(node.querySelector('.pieta'),show)}
  if(node.classList.contains('return')||node.classList.contains('rediscovery')){
   const arrival=node.classList.contains('rediscovery')?clamp((y+vh*.78-top)/(vh*.78)):0;
   node.style.setProperty('--arrival',arrival.toFixed(4));node.style.setProperty('--scatter',(1-arrival).toFixed(4));
  }
 });
 const g=geometry.find(g=>g.node===year),travel=Math.max(1,g.height-g.stageHeight),p=clamp((y-g.top)/travel);
 // Active music is based on the season stage, not overflowing child rectangles.
 const inside=y>=g.top-2&&y<g.top+travel+g.stageHeight*.35;
 let index=Math.min(3,Math.floor(p*4));
 if(current>=0&&inside){const hysteresis=.012;if(index>current&&p<(current+1)/4+hysteresis)index=current;if(index<current&&p>current/4-hysteresis)index=current}
 year.style.setProperty('--exit',clamp((p-.88)/.12).toFixed(4));seasonLocal=clamp(p*4-index);year.style.setProperty('--local',seasonLocal.toFixed(4));
 if(index!==visualSeason){visualSeason=index;yearStage.dataset.season=names[index];panels.forEach((panel,i)=>{const selected=i===index;panel.classList.toggle('is-active',selected);panel.inert=!selected;panel.setAttribute('aria-hidden',String(!selected))});year.querySelector('.season-count span').textContent=`0${index+1}`;year.querySelectorAll('.season-progress i').forEach((el,i)=>el.classList.toggle('is-filled',i<=index))}
 if(inside){current=index;startWeather()}else{current=-1;stopWeather()}
 // A stable camera anchor selects the music throughout the complete story.
 const anchor=y+vh*.35;let candidate=0;
 geometry.forEach((scene,i)=>{if(scene.top<=anchor)candidate=i});
 const margin=vh*.06;
 if(candidate>musicEpisode&&anchor<geometry[candidate].top+margin)candidate=musicEpisode;
 if(candidate<musicEpisode&&anchor>geometry[musicEpisode].top-margin)candidate=musicEpisode;
 musicEpisode=candidate;
 const desired=candidate<2?0:candidate===2?1:candidate===3?2+index:6;
 if(desired!==currentTrack){currentTrack=desired;if(enabled&&!document.hidden)play(desired)}
 updateHistory(y,vh,max);
 if(location.search.includes('qa=1'))root.dataset.musicTrack=String(currentTrack);

}
const history=document.querySelector('.history'),historyButtons=[...history.querySelectorAll('button')],indicator=document.querySelector('.chapter-indicator');
const chapterNames=['Пролог','Венеция','Скрипка и оркестр','Четыре времени года','Наследие разных лет','Последние годы','Возвращение музыки','Эпилог'];
let lastChapter=-1,stringLength=0,historyMarks=[];
const historyPath=history.querySelector('.history-drawn');
function updateHistory(y,vh,max){
 const anchor=y+vh*.35;let scene=geometry[0];for(const g of geometry)if(g.top<=anchor)scene=g;
 const chapter=geometry.indexOf(scene);
 if(chapter!==lastChapter){lastChapter=chapter;indicator.querySelector('span').textContent=`${String(chapter+1).padStart(2,'0')} / 08`;indicator.querySelector('b').textContent=chapterNames[chapter];history.querySelector('.history-chapter').textContent=chapterNames[chapter];
 const point=[0,1,-1,2,-1,3,4,4][chapter];history.classList.toggle('is-thematic',point<0);historyButtons.forEach((b,i)=>{if(i===point)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')});}
 const marks=[...historyMarks,{y:max,x:1}];let progress=.06;
 for(let i=0;i<marks.length-1;i++){const a=marks[i],b=marks[i+1];if(y>=a.y)progress=a.x+(b.x-a.x)*clamp((y-a.y)/Math.max(1,b.y-a.y));}
 // Use measured SVG units. Unitless CSS calc and pathLength normalization differed across browsers.
 historyPath.style.strokeDashoffset=String(stringLength*(1-progress));

}
function measureHistory(){stringLength=historyPath.getTotalLength();historyPath.style.strokeDasharray=`${stringLength} ${stringLength}`;historyMarks=historyButtons.map((b,i)=>{const g=geometry.find(g=>g.node.dataset.episode===b.dataset.target);return{y:g.top,x:[.06,.27,.5,.74,.94][i]}})}
historyButtons.forEach(b=>b.addEventListener('click',()=>{const g=geometry.find(g=>g.node.dataset.episode===b.dataset.target);window.scrollTo({top:g.top+(g.height-g.stageHeight)*Number(b.dataset.phase),behavior:reduce.matches?'instant':'smooth'})}));
function toggleBeat(node,visible){node.inert=!visible;node.setAttribute('aria-hidden',String(!visible))}
addEventListener('scroll',schedule,{passive:true});addEventListener('resize',measure,{passive:true});document.fonts.ready.then(measure);addEventListener('load',measure,{once:true});measure();
/* A maximum of two sources during a 600 ms controlled transition. Tokens invalidate
   pending play() promises and all delayed stops when direction changes quickly. */
function audioGraph(){if(graph)return;const AudioCtx=window.AudioContext||window.webkitAudioContext;if(!AudioCtx)return;try{graph=new AudioCtx({latencyHint:'interactive'});analyser=graph.createAnalyser();analyser.fftSize=256;audioData=new Uint8Array(analyser.fftSize);gains=media.map(el=>{const source=graph.createMediaElementSource(el),gain=graph.createGain();gain.gain.value=0;source.connect(gain);gain.connect(analyser);return gain});analyser.connect(graph.destination)}catch(e){graph=null;analyser=null;gains=[]}}
function volume(i,target,seconds=.6){if(gains[i]){const g=gains[i].gain,t=graph.currentTime;if(g.cancelAndHoldAtTime)g.cancelAndHoldAtTime(t);else{g.cancelScheduledValues(t);g.setValueAtTime(g.value,t)}g.linearRampToValueAtTime(target,t+seconds)}else media[i].volume=target}
function pause(i){clearTimeout(pauseTimers[i]);media[i].pause();if(media[i].readyState)media[i].currentTime=0;volume(i,0,0)}
function stopLater(i,token,delay){clearTimeout(pauseTimers[i]);pauseTimers[i]=setTimeout(()=>{if(token===request&&i!==active)pause(i)},delay)}
function setSound(on){enabled=on;sound.setAttribute('aria-pressed',String(on));sound.setAttribute('aria-label',on?'Выключить музыкальное сопровождение':'Включить музыкальное сопровождение');sound.querySelector('span').textContent=on?'ВЫКЛ':'ЗВУК'}
async function play(index){
 const token=++request;pauseTimers.forEach(clearTimeout);
 const reuse=media.findIndex((a,i)=>i===active&&a.dataset.track===String(index)&&!a.paused);if(reuse>=0){volume(reuse,1);media.forEach((_,i)=>{if(i!==reuse){volume(i,0);stopLater(i,token,650)}});startAudioMeter();return}
 const target=active===0?1:0,el=media[target];pause(target);
 try{if(el.dataset.track!==String(index)){el.src=tracks[index];el.dataset.track=String(index);el.load()}if(graph?.state==='suspended')await graph.resume();if(token!==request||!enabled||currentTrack!==index)return;el.volume=gains.length?1:0;await el.play();if(token!==request||!enabled||currentTrack!==index)return;active=target;volume(target,1);media.forEach((_,i)=>{if(i!==target){volume(i,0);stopLater(i,token,650)}});status.textContent=`Сейчас звучит: ${labels[index]}`;document.querySelector('.now-playing span').textContent=labels[index];startAudioMeter()}
 catch(e){if(token!==request)return;setSound(false);fadeOut(true);stopAudioMeter();status.textContent='Музыка не загрузилась. Нажми на звук, чтобы попробовать ещё раз.';console.warn('Vivaldi audio:',e.message)}
}
function fadeOut(immediate=false){const token=++request;pauseTimers.forEach(clearTimeout);active=-1;media.forEach((el,i)=>{volume(i,0,immediate?.12:.4);stopLater(i,token,immediate?160:450)})}
sound.addEventListener('click',()=>{
 hint.classList.add('hidden');
 if(enabled){setSound(false);fadeOut();stopAudioMeter();status.textContent='Звук выключен';return}
 render();setSound(true);audioGraph();document.querySelector('.now-playing span').textContent='Музыка загружается…';play(currentTrack);
});
function startAudioMeter(){if(analyser&&!audioRAF&&!document.hidden)audioRAF=requestAnimationFrame(sampleAudio)}
function stopAudioMeter(){cancelAnimationFrame(audioRAF);audioRAF=0;level=0;root.style.setProperty('--audio',0)}
function sampleAudio(t){audioRAF=0;if(!enabled||document.hidden||!analyser)return;if(t-lastAudioSample>90){lastAudioSample=t;analyser.getByteTimeDomainData(audioData);let energy=0;for(const n of audioData){const a=(n-128)/128;energy+=a*a}level+=(Math.min(.8,Math.sqrt(energy/audioData.length)*4)-level)*.4;if(musicEpisode===1||musicEpisode>=4)root.style.setProperty('--audio',level.toFixed(3));if(location.search.includes('qa=1'))root.dataset.audioEnergy=level.toFixed(4)}audioRAF=requestAnimationFrame(sampleAudio)}
/* Weather stays inside the seasonal stage. No canvas or light overlays story text. */
function resizeWeather(){const dpr=Math.min(devicePixelRatio||1,1.5),w=canvas.clientWidth,h=canvas.clientHeight;canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);const count=innerWidth<701?26:48;particles=Array.from({length:count},(_,i)=>({x:(i*137.5)%w,y:(i*93.7)%h,size:1+(i%4)*.65,speed:.45+(i%7)*.12,phase:i*1.73}))}
function startWeather(){if(!reduce.matches&&!document.hidden&&!weatherRAF){lastFrame=0;weatherRAF=requestAnimationFrame(drawWeather)}}
function stopWeather(){cancelAnimationFrame(weatherRAF);weatherRAF=0;ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight)}
function drawWeather(t){weatherRAF=0;if(current<0||document.hidden||reduce.matches)return;const w=canvas.clientWidth,h=canvas.clientHeight,dt=Math.min(32,t-lastFrame||16)/16;lastFrame=t;ctx.clearRect(0,0,w,h);if(location.search.includes('qa=1'))canvas.dataset.energy=level.toFixed(4);ctx.strokeStyle=['#d6eab7','#ffc08a','#e0a85d','#b7e4f4'][current];ctx.fillStyle=ctx.strokeStyle;for(const p of particles){p.y+=p.speed*dt*(current===1?4:1);p.x+=Math.sin(t*.0004+p.phase)*dt*(current===2?1.4:.4);if(p.y>h+15){p.y=-15;p.x=(p.x+137)%w}ctx.globalAlpha=.25+(p.size/4)*.35+level*.15;ctx.beginPath();if(current===0){ctx.ellipse(p.x,p.y,p.size*2,p.size,Math.sin(t*.0005+p.phase),0,Math.PI*2);ctx.fill()}else if(current===1){ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-7,p.y+22);ctx.stroke()}else if(current===2){ctx.ellipse(p.x,p.y,p.size*3,p.size*1.3,t*.0006+p.phase,0,Math.PI*2);ctx.fill()}else{ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill()}}ctx.globalAlpha=1;weatherRAF=requestAnimationFrame(drawWeather)}
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopWeather();stopAudioMeter();if(enabled)fadeOut()}else{schedule();if(enabled)play(currentTrack)}});reduce.addEventListener('change',()=>{stopWeather();schedule()});
})();
