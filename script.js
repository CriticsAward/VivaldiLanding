import {resolveVisibleScene,createHistory,resolveMusicTrack} from './story.mjs?v=17';
(()=>{
'use strict';
const root=document.documentElement;root.classList.add('enhanced');
const episodes=[...document.querySelectorAll('[data-episode]')],year=document.querySelector('.seasons'),yearStage=year.querySelector('.stage'),panels=[...document.querySelectorAll('.season-panel')],sound=document.querySelector('.sound'),status=document.querySelector('.status'),hint=document.querySelector('.sound-hint'),canvas=document.querySelector('.weather'),ctx=canvas.getContext('2d'),media=[document.querySelector('#track-a'),document.querySelector('#track-b')];
const names=['spring','summer','autumn','winter'],labels=['La Follia · RV 63','Две скрипки · RV 522','Весна · RV 269','Лето · RV 315','Осень · RV 293','Зима · RV 297','Gloria · Domine Deus'],tracks=['media/follia.mp3','media/concerto-522.mp3',...names.map(n=>`media/${n}.mp3`),'media/gloria.mp3'],reduce=matchMedia('(prefers-reduced-motion: reduce)');
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
let geometry=[],view=null,measureRAF=0,raf=0,current=-1,currentTrack=0,visualSeason=-1,seasonLocal=0,enabled=false,graph=null,gains=[],analyser=null,audioData=null,active=-1,request=0,pauseTimers=[0,0],weatherRAF=0,lastFrame=0,level=0,particles=[],audioRAF=0,lastAudioSample=0;
media.forEach((a,i)=>{a.loop=true;a.preload=i===0?'auto':'none';a.playsInline=true});
function measure(){
 measureRAF=0;geometry=episodes.map(node=>{const stage=node.querySelector('.stage'),sr=stage.getBoundingClientRect(),text=[...node.querySelectorAll('.copy h2,.copy p,h1,.hero-foot,.season-panel h2,.season-panel p')].map(e=>e.getBoundingClientRect()),h=node.querySelector('h1,h2').getBoundingClientRect();return{node,id:node.dataset.episode,top:node.getBoundingClientRect().top+scrollY,height:node.offsetHeight,stageHeight:stage.offsetHeight,readTop:Math.min(...text.map(r=>r.top-sr.top)),readBottom:Math.max(...text.map(r=>r.bottom-sr.top)),headingTop:h.top-sr.top,headingBottom:h.bottom-sr.top}});history.measure();resizeWeather();schedule()
}
function scheduleMeasure(){if(!measureRAF)measureRAF=requestAnimationFrame(measure)}

function schedule(){if(!raf)raf=requestAnimationFrame(render)}
function render(){
 raf=0;const y=scrollY,vh=innerHeight;view=resolveVisibleScene(geometry,y,vh,view?.scene.id,innerWidth>=1024?112:44);const max=root.scrollHeight-vh;document.querySelector('.journey i').style.height=`${clamp(y/max)*100}%`;
 geometry.forEach(({node,top,height,stageHeight})=>{
  if(y+vh<top||y>top+height)return;
  const travel=node.classList.contains('prologue')&&innerWidth<=700?height:Math.max(1,height-stageHeight);
  const p=clamp((y-top)/travel);node.style.setProperty('--p',p.toFixed(4));node.style.setProperty('--turn',Math.sin(p*Math.PI*2).toFixed(4));
  if(node.classList.contains('venice')){const show=p>=.48;node.classList.toggle('is-pieta',show);node.style.setProperty('--pieta',clamp((p-.35)/.25).toFixed(4));toggleBeat(node.querySelector('.priest'),!show);toggleBeat(node.querySelector('.pieta'),show)}
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
 updateSeasonWorld(p);
 if(index!==visualSeason){visualSeason=index;yearStage.dataset.season=names[index];panels.forEach((panel,i)=>{const selected=i===index;panel.classList.toggle('is-active',selected);panel.inert=!selected;panel.setAttribute('aria-hidden',String(!selected))});year.querySelector('.season-count span').textContent=`0${index+1}`;year.querySelectorAll('.season-progress i').forEach((el,i)=>el.classList.toggle('is-filled',i<=index))}
 if(view.scene.id==='seasons'){current=index;startWeather()}else{current=-1;stopWeather()}
 // Music follows explicit episode boundaries; visual scene selection remains independent.
 const desired=resolveMusicTrack(geometry,y,index);
 if(desired!==currentTrack){currentTrack=desired;if(enabled&&!document.hidden)play(desired)}
 history.update(view);seekStoryMotion(y,vh);
 if(location.search.includes('qa=1')){root.dataset.musicTrack=String(currentTrack);root.dataset.storyScene=view.scene.id;root.dataset.storyScroll=String(y);root.dataset.storyEvent=view.event.id}

}
function updateSeasonWorld(p){
 const ease=(a,b)=>{const x=clamp((p-a)/(b-a));return x*x*(3-2*x)},s1=ease(.20,.30),s2=ease(.45,.55),s3=ease(.70,.80);
 const weights=[1-s1,s1*(1-s2),s2*(1-s3),s3];
 ['--spr','--sum','--aut','--win'].forEach((key,i)=>yearStage.style.setProperty(key,weights[i].toFixed(4)));
 yearStage.style.setProperty('--flow',p.toFixed(4));
 const tones=[[211,231,187],[255,187,120],[237,187,111],[186,228,246]];
 const rgb=tones[0].map((_,channel)=>Math.round(tones.reduce((sum,t,i)=>sum+t[channel]*weights[i],0)));
 yearStage.style.setProperty('--score-color',`rgb(${rgb.join(' ')})`);
 const flicker=reduce.matches?0:Math.max(0,1-Math.abs(p-.39)/.006)*.24;
 yearStage.style.setProperty('--flash',flicker.toFixed(3));
}
const history=createHistory({nav:document.querySelector('.history'),indicator:document.querySelector('.chapter-indicator'),mobile:document.querySelector('.mobile-history'),reduce,getGeometry:()=>geometry});
/* Paused Web Animations are sought by the camera, never run as independent loops. */
const storyMotion=[];
function scrub(selector,frames){const el=document.querySelector(selector);if(!el?.animate)return;const animation=el.animate(frames,{duration:1000,fill:'both',easing:'linear'});animation.pause();storyMotion.push({el,animation,scene:el.closest('.episode')})}
scrub('.lesson-master',[{transform:'translate3d(-25%,5%,0) rotate(-32deg) scale(1.35)',offset:0},{transform:'translate3d(5%,-4%,0) rotate(8deg) scale(.92)',offset:.65},{transform:'translate3d(30%,-12%,0) rotate(24deg) scale(.84)',offset:1}]);
scrub('.lesson-pupil',[{transform:'translate3d(45%,15%,0) rotate(28deg) scale(.65)'},{transform:'translate3d(-10%,-5%,0) rotate(-16deg) scale(.9)'}]);
document.querySelectorAll('.printing-leaf').forEach((el,i)=>{if(!el.animate)return;const animation=el.animate([{transform:`rotateY(${i*12-12}deg) rotateZ(${i*8-8}deg) translateZ(${i*14}px)`},{transform:`rotateY(${-65-i*18}deg) rotateZ(${i*12-16}deg) translateZ(${40+i*30}px)`}],{duration:1000,fill:'both'});animation.pause();storyMotion.push({el,animation,scene:el.closest('.episode')})});
function seekStoryMotion(y,vh){for(const item of storyMotion){const g=geometry.find(g=>g.node===item.scene);if(y+vh<g.top||y>g.top+g.height){item.el.style.willChange='auto';continue}const progress=clamp((y+vh*.8-g.top)/(vh*.8+g.height-g.stageHeight));item.animation.currentTime=reduce.matches?500:progress*1000;item.el.style.willChange=reduce.matches?'auto':'transform'}}
function toggleBeat(node,visible){node.inert=!visible;node.setAttribute('aria-hidden',String(!visible))}
addEventListener('scroll',schedule,{passive:true});addEventListener('resize',scheduleMeasure,{passive:true});window.visualViewport?.addEventListener('resize',scheduleMeasure,{passive:true});document.fonts.ready.then(scheduleMeasure);document.fonts.addEventListener('loadingdone',scheduleMeasure);addEventListener('load',scheduleMeasure,{once:true});addEventListener('pageshow',scheduleMeasure);addEventListener('hashchange',schedule);const sizeObserver=new ResizeObserver(scheduleMeasure);episodes.forEach(e=>{sizeObserver.observe(e);sizeObserver.observe(e.querySelector('.stage'))});measure();
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
function sampleAudio(t){audioRAF=0;if(!enabled||document.hidden||!analyser)return;if(t-lastAudioSample>90){lastAudioSample=t;analyser.getByteTimeDomainData(audioData);let energy=0;for(const n of audioData){const a=(n-128)/128;energy+=a*a}level+=(Math.min(.8,Math.sqrt(energy/audioData.length)*4)-level)*.4;if(view?.scene.id==='venice'||view?.scene.music===6)root.style.setProperty('--audio',level.toFixed(3));if(location.search.includes('qa=1'))root.dataset.audioEnergy=level.toFixed(4)}audioRAF=requestAnimationFrame(sampleAudio)}
/* Weather stays inside the seasonal stage. No canvas or light overlays story text. */
function resizeWeather(){const dpr=Math.min(devicePixelRatio||1,1.5),w=canvas.clientWidth,h=canvas.clientHeight;canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);const count=innerWidth<701?18:32;particles=Array.from({length:count},(_,i)=>({x:(i*137.5)%w,y:(i*93.7)%h,size:1+(i%4)*.65,speed:.45+(i%7)*.12,phase:i*1.73}))}
function startWeather(){if(!reduce.matches&&!document.hidden&&!weatherRAF){lastFrame=0;weatherRAF=requestAnimationFrame(drawWeather)}}
function stopWeather(){cancelAnimationFrame(weatherRAF);weatherRAF=0;ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight)}
function drawWeather(t){weatherRAF=0;if(current<0||document.hidden||reduce.matches)return;const w=canvas.clientWidth,h=canvas.clientHeight,dt=Math.min(32,t-lastFrame||16)/16;lastFrame=t;ctx.clearRect(0,0,w,h);if(location.search.includes('qa=1'))canvas.dataset.energy=level.toFixed(4);ctx.strokeStyle=['#d6eab7','#ffc08a','#e0a85d','#b7e4f4'][current];ctx.fillStyle=ctx.strokeStyle;for(const p of particles){p.y+=p.speed*dt*(current===1?4:1);p.x+=Math.sin(t*.0004+p.phase)*dt*(current===2?1.4:.4);if(p.y>h+15){p.y=-15;p.x=(p.x+137)%w}ctx.globalAlpha=.25+(p.size/4)*.35+level*.15;ctx.beginPath();if(current===0){ctx.ellipse(p.x,p.y,p.size*2,p.size,Math.sin(t*.0005+p.phase),0,Math.PI*2);ctx.fill()}else if(current===1){ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-7,p.y+22);ctx.stroke()}else if(current===2){ctx.ellipse(p.x,p.y,p.size*3,p.size*1.3,t*.0006+p.phase,0,Math.PI*2);ctx.fill()}else{ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill()}}ctx.globalAlpha=1;weatherRAF=requestAnimationFrame(drawWeather)}
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopWeather();stopAudioMeter();if(enabled)fadeOut()}else{schedule();if(enabled)play(currentTrack)}});reduce.addEventListener('change',()=>{stopWeather();schedule()});
})();
