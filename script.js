(()=>{
  const root=document.documentElement,year=document.querySelector('.year'),chapters=[...document.querySelectorAll('.season')],canvas=document.querySelector('.weather'),ctx=canvas.getContext('2d',{alpha:true,desynchronized:true}),status=document.querySelector('.status'),sound=document.querySelector('.sound'),hint=document.querySelector('.sound-hint'),tracks=['media/spring.mp3','media/summer.mp3','media/autumn.mp3','media/winter.mp3'],media=[document.querySelector('#track-a'),document.querySelector('#track-b')],reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let soundEnabled=false,season=-1,active=0,fadeTimer=0,audioContext=null,gains=[],analyser=null,fallback=true,scrollRAF=0,particleRAF=0,particles=[],lastFrame=0,lightning=0,audioLevel=0;
  const seasonNames=['Весна','Лето','Осень','Зима'];
  media.forEach(a=>{a.loop=true;a.preload='none';a.playsInline=true});
  const atmospheres=[['#e4e59b','#8bc2a7','#fff2c4'],['#ffc37c','#dc562e','#fff0b3'],['#edb973','#a9522b','#d4a150'],['#c7edff','#8cc3da','#f4fbff']];
  const layerEls={canal:document.querySelector('.canal'),portrait:document.querySelector('.portrait'),score:document.querySelector('.score'),violin:document.querySelector('.violin'),thread:document.querySelector('.red-thread'),light:document.querySelector('.scene-light')};
  const storyScenes=[...document.querySelectorAll('[data-scene]')];
  const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
  const sceneProgress=(node,vh)=>{const r=node.getBoundingClientRect();return clamp((vh-r.top)/(vh+r.height))};
  function resizeCanvas(){const dpr=Math.min(devicePixelRatio||1,innerWidth<700?1:1.4);canvas.width=Math.round(innerWidth*dpr);canvas.height=Math.round(innerHeight*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);seedParticles()}
  function seedParticles(){const count=reduce?0:innerWidth<700?30:64;particles=Array.from({length:count},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,r:1+Math.random()*3,a:.2+Math.random()*.6,vx:(Math.random()-.5)*.5,vy:.3+Math.random()*1.2,rot:Math.random()*6.28}))}
  resizeCanvas();addEventListener('resize',resizeCanvas,{passive:true});
  function drawWeather(now){particleRAF=0;if(reduce||document.hidden||season<0||!year.getBoundingClientRect().height)return;const elapsed=Math.min(34,now-lastFrame||16),dt=elapsed/16;lastFrame=now;if(analyser&&soundEnabled){const data=new Uint8Array(analyser.fftSize);analyser.getByteTimeDomainData(data);let sum=0;for(const n of data){const v=(n-128)/128;sum+=v*v}audioLevel=Math.min(1,Math.sqrt(sum/data.length)*5)}else audioLevel*=.92;const [light,dark,flare]=atmospheres[season];ctx.clearRect(0,0,innerWidth,innerHeight);ctx.save();ctx.globalCompositeOperation='screen';if(season===1&&now>lightning){lightning=now+5000+Math.random()*8000;ctx.fillStyle=flare;ctx.globalAlpha=.045;ctx.fillRect(0,0,innerWidth,innerHeight)}if(season===1&&now>lightning-110&&now<lightning-50){ctx.fillStyle='#fff9d6';ctx.globalAlpha=.12;ctx.fillRect(0,0,innerWidth,innerHeight)}for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;if(season===0){p.x+=Math.sin(now*.0006+p.rot)*.55*dt;p.y+=.35*dt}else if(season===1){p.x+=Math.sin(now*.001+p.y*.012)*.8*dt}else if(season===2){p.x+=Math.sin(now*.00045+p.rot)*1.25*dt;p.y+=.75*dt}else{p.x+=.25*dt;p.y+=.95*dt}if(p.y>innerHeight+15){p.y=-12;p.x=Math.random()*innerWidth}if(p.x>innerWidth+15)p.x=-10;if(p.x<-15)p.x=innerWidth+10;ctx.globalAlpha=p.a*(.72+audioLevel*.45);ctx.fillStyle=season===0?light:season===1?flare:season===2?dark:light;if(season===2){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot+now*.0002);ctx.beginPath();ctx.ellipse(0,0,p.r*1.5,p.r*.7,0,0,Math.PI*2);ctx.fill();ctx.restore()}else{ctx.beginPath();ctx.arc(p.x,p.y,season===1?p.r*.45:p.r*(1+audioLevel*.2),0,Math.PI*2);ctx.fill()}}ctx.restore();particleRAF=requestAnimationFrame(drawWeather)}
  function beginWeather(){if(!reduce&&!particleRAF){lastFrame=performance.now();particleRAF=requestAnimationFrame(drawWeather)}}function stopWeather(){if(particleRAF){cancelAnimationFrame(particleRAF);particleRAF=0}ctx.clearRect(0,0,innerWidth,innerHeight)}
  function setSeason(index){if(index===season)return;season=index;if(index<0){year.removeAttribute('data-active');year.style.removeProperty('--season-color');stopWeather();if(soundEnabled)fadeOut();return}year.dataset.active=chapters[index].dataset.season;root.style.setProperty('--season-color',getComputedStyle(chapters[index]).getPropertyValue('--season-color'));chapters.forEach((c,i)=>c.classList.toggle('is-current',i===index));document.querySelector('.scene-light').style.setProperty('--scene-accent',atmospheres[index][1]);beginWeather();if(soundEnabled)playTrack(index)}
  function setProgress(){
    scrollRAF=0;
    const y=scrollY,max=document.documentElement.scrollHeight-innerHeight,p=max?y/max:0;
    document.querySelector('.scroll-thread i').style.height=`${p*100}%`;
    document.body.classList.toggle('scrolled',y>innerHeight*.4);
    const vh=innerHeight,opening=document.querySelector('.opening'),birth=document.querySelector('.birth'),ritornello=document.querySelector('.ritornello'),intro=document.querySelector('.year-intro'),aftersound=document.querySelector('.aftersound'),finale=document.querySelector('.final-scene');
    const op=sceneProgress(opening,vh),bp=sceneProgress(birth,vh),rp=sceneProgress(ritornello,vh),ip=sceneProgress(intro,vh),ap=sceneProgress(aftersound,vh),fp=sceneProgress(finale,vh);
    if(!reduce){
      // The shared images travel through three visual peaks: city, concert, manuscript return.
      layerEls.canal.style.opacity=String(clamp(.2+bp*.56-rp*.36-ap*.2,.02,.78));
      layerEls.canal.style.transform=`translate3d(${bp*-10-rp*7}vw,${bp*7-rp*4}vh,0) scale(${1+bp*.38+rp*.08})`;
      layerEls.portrait.style.opacity=String(clamp(.68-op*.12-bp*.24-rp*.3-ap*.58+fp*.72,.02,.8));
      layerEls.portrait.style.transform=`translate3d(${op*-12+bp*8-rp*15+fp*11}vw,${op*9+bp*-6+rp*7+fp*-5}vh,0) rotate(${op*10+bp*-8+rp*14+fp*-4}deg) scale(${1-op*.13+bp*.22+rp*.12-ap*.12+fp*.2})`;
      layerEls.score.style.opacity=String(clamp(.12+bp*.18+rp*.62+ip*.16-ap*.08,.04,.86));
      layerEls.score.style.transform=`translate3d(${op*16+bp*18-rp*12+fp*-9}vw,${op*-12+bp*12+rp*-10}vh,0) rotate(${-13+op*16+bp*7-rp*12}deg) scale(${1+op*.2+bp*.2+rp*.22})`;
      layerEls.violin.style.opacity=String(clamp(.2+rp*.54+fp*.2-ap*.24,.04,.82));
      layerEls.violin.style.transform=`translate3d(${op*4-rp*13+fp*4}vw,${op*-8+rp*11+fp*-8}vh,0) rotate(${-34+op*24+rp*-18+fp*16}deg) scale(${1+rp*.24+fp*.18})`;
      const lineAngle=-26+bp*14+rp*35+ip*12+ap*-26+fp*20;
      layerEls.thread.style.transform=`rotate(${lineAngle}deg) scaleX(${1+rp*.12})`;
      layerEls.thread.style.opacity=String(clamp(.55+bp*.28+rp*.2-ap*.5+fp*.25,.12,1));
      const cityRect=birth.getBoundingClientRect(),cityOpen=clamp(1-Math.abs((cityRect.top+cityRect.height*.5-vh*.5)/(vh*.8)));
      const concertRect=ritornello.getBoundingClientRect(),concertOpen=clamp(1-Math.abs((concertRect.top+concertRect.height*.5-vh*.5)/(vh*.8)));
      const returnOpen=clamp(1-Math.abs((aftersound.getBoundingClientRect().top+aftersound.getBoundingClientRect().height*.5-vh*.5)/(vh*.9)));
      const lightColor=returnOpen>.2?'#d5b77f':concertOpen>.2?'#e9472d':cityOpen>.2?'#496b81':'#d9582e';
      layerEls.light.style.setProperty('--scene-accent',lightColor);
      layerEls.light.style.opacity=String(.1+cityOpen*.12+concertOpen*.17+returnOpen*.13);
      document.querySelector('.solo').style.transform=`translate3d(${rp*36}vw,${rp*9}vh,0) rotate(${rp*-12}deg)`;
      document.querySelector('.tutti').style.transform=`translate3d(${rp*-29}vw,${rp*-12}vh,0) rotate(${rp*8}deg)`;
      const yr=year.getBoundingClientRect(),progress=clamp((vh-yr.top)/(yr.height+vh));
      document.querySelector('.season-stroke').style.transform=`translate3d(${progress*10}vw,${progress*13}vh,0) rotate(${-25+progress*64}deg)`;
      document.querySelector('.year-portrait').style.transform=`translate3d(${progress*-13}vw,${progress*4}vh,0) scale(${1.1+progress*.12})`;
    }
    const center=vh*.48;let nearest=-1,dist=Infinity;
    chapters.forEach((node,i)=>{const r=node.getBoundingClientRect();if(r.bottom<vh*.16||r.top>vh*.84)return;const d=Math.abs((r.top+r.bottom)/2-center);if(d<dist){dist=d;nearest=i}});
    if(season>=0){const r=chapters[season].getBoundingClientRect(),hold=Math.abs((r.top+r.bottom)/2-center);if(r.bottom>vh*.1&&r.top<vh*.9&&hold<dist+vh*.08)nearest=season}
    setSeason(nearest);
  }
  function requestScroll(){if(!scrollRAF)scrollRAF=requestAnimationFrame(setProgress)}addEventListener('scroll',requestScroll,{passive:true});addEventListener('resize',requestScroll,{passive:true});requestScroll();
  function setStatus(text){status.textContent=text}
  function initAudioGraph(){if(audioContext)return;const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;try{audioContext=new Ctx({latencyHint:'interactive'});analyser=audioContext.createAnalyser();analyser.fftSize=256;gains=media.map(el=>{const src=audioContext.createMediaElementSource(el),gain=audioContext.createGain();gain.gain.value=0;src.connect(gain);gain.connect(analyser);return gain});analyser.connect(audioContext.destination);fallback=false}catch(e){audioContext=null;analyser=null;gains=[];fallback=true}}
  function gainTo(i,value,duration=.7){if(!fallback&&audioContext&&gains[i]){const g=gains[i].gain,t=audioContext.currentTime;g.cancelScheduledValues(t);g.setValueAtTime(g.value,t);g.linearRampToValueAtTime(value,t+duration)}else media[i].volume=value}
  async function playTrack(index){if(index<0||index>3||!soundEnabled)return;const target=1-active,old=active,el=media[target];try{if(el.dataset.track!==String(index)){el.pause();el.currentTime=0;el.src=tracks[index];el.dataset.track=String(index);el.load()}if(audioContext?.state==='suspended')await audioContext.resume();el.volume=fallback?0:1;await el.play();active=target;gainTo(target,1,.7);if(media[old].src){gainTo(old,0,.7);clearTimeout(fadeTimer);fadeTimer=setTimeout(()=>{if(old!==active){media[old].pause();media[old].currentTime=0}},760)}setStatus(`Сейчас звучит: ${seasonNames[index]}`)}catch(error){soundEnabled=false;sound.setAttribute('aria-pressed','false');sound.setAttribute('aria-label','Включить музыкальное сопровождение');sound.querySelector('span').textContent='ЗВУК';fadeOut(true);setStatus('Не удалось запустить музыку. Проверь соединение и попробуй ещё раз.');console.warn('Audio playback failed',error)}}
  function fadeOut(stopImmediatelyAfterFade=false){media.forEach((el,i)=>{if(!el.paused){gainTo(i,0,.45);setTimeout(()=>{if(stopImmediatelyAfterFade||season<0){el.pause();el.currentTime=0}},520)}})}
  sound.addEventListener('click',async()=>{if(!soundEnabled){soundEnabled=true;sound.setAttribute('aria-pressed','true');sound.setAttribute('aria-label','Выключить музыкальное сопровождение');sound.querySelector('span').textContent='ВЫКЛ';hint.classList.add('hidden');initAudioGraph();try{if(audioContext?.state==='suspended')await audioContext.resume()}catch(e){console.warn('Audio context resume failed',e)}if(season>=0)await playTrack(season);else setStatus('Звук разрешён. Музыка начнётся при входе в четыре времени года.')}else{soundEnabled=false;sound.setAttribute('aria-pressed','false');sound.setAttribute('aria-label','Включить музыкальное сопровождение');sound.querySelector('span').textContent='ЗВУК';fadeOut(true);setStatus('Звук выключен')}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopWeather();else{requestScroll();if(season>=0)beginWeather()}});
})();
