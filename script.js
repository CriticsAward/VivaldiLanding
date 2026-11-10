(() => {
 const cards=[...document.querySelectorAll('.season-card')],dots=[...document.querySelectorAll('.dot')],player=document.querySelector('#player'),status=document.querySelector('.audio-status');
 const tracks=[
  'https://upload.wikimedia.org/wikipedia/commons/f/ff/Vivaldi_-_Four_Seasons_1_Spring_mvt_1_Allegro_-_John_Harrison_violin.oga',
  'https://upload.wikimedia.org/wikipedia/commons/a/a5/Vivaldi_-_Four_Seasons_2_Summer_mvt_1_Allegro_non_molto_-_John_Harrison_violin.oga',
  'https://upload.wikimedia.org/wikipedia/commons/0/0f/Vivaldi_-_Four_Seasons_3_Autumn_mvt_1_Allegro_-_John_Harrison_violin.oga',
  'https://upload.wikimedia.org/wikipedia/commons/2/2a/Vivaldi_-_Four_Seasons_4_Winter_mvt_1_Allegro_non_molto_-_John_Harrison_violin.oga'
 ];let current=0,activeTrack=-1;
 function show(n){current=(n+cards.length)%cards.length;cards.forEach((c,i)=>{c.classList.toggle('active',i===current);c.setAttribute('aria-hidden',i===current?'false':'true')});dots.forEach((d,i)=>{d.classList.toggle('selected',i===current);d.setAttribute('aria-selected',i===current?'true':'false')})}
 document.querySelector('.prev').addEventListener('click',()=>show(current-1));document.querySelector('.next').addEventListener('click',()=>show(current+1));dots.forEach(d=>d.addEventListener('click',()=>show(+d.dataset.index)));
 document.querySelectorAll('.listen').forEach(btn=>btn.addEventListener('click',async()=>{const n=+btn.dataset.track;if(activeTrack===n&&!player.paused){player.pause();btn.querySelector('.play-icon').textContent='▶';status.textContent='Воспроизведение приостановлено';return}if(activeTrack!==n){player.pause();activeTrack=n;player.src=tracks[n];document.querySelectorAll('.play-icon').forEach(x=>x.textContent='▶')}try{await player.play();btn.querySelector('.play-icon').textContent='Ⅱ';status.textContent='Сейчас звучит: '+cards[n].querySelector('h3').innerText}catch(e){status.textContent='Не удалось загрузить запись. Откройте ссылку на Wikimedia Commons в блоке атрибуции.';btn.querySelector('.play-icon').textContent='▶'}}));
 player.addEventListener('ended',()=>{document.querySelectorAll('.play-icon').forEach(x=>x.textContent='▶');status.textContent='Фрагмент завершён'});player.addEventListener('pause',()=>document.querySelectorAll('.play-icon').forEach(x=>x.textContent='▶'));
 const progress=document.querySelector('.progress span');function update(){const max=document.documentElement.scrollHeight-innerHeight;progress.style.width=(max>0?scrollY/max*100:0)+'%'}addEventListener('scroll',update,{passive:true});update();
 const observer=new IntersectionObserver(entries=>entries.forEach(e=>e.target.classList.toggle('in-view',e.isIntersecting)),{threshold:.1});document.querySelectorAll('.scene').forEach(s=>observer.observe(s));
 let sx=0;const track=document.querySelector('.season-track');track.addEventListener('touchstart',e=>sx=e.changedTouches[0].screenX,{passive:true});track.addEventListener('touchend',e=>{const dx=e.changedTouches[0].screenX-sx;if(Math.abs(dx)>60)show(current+(dx<0?1:-1))},{passive:true});
 show(0);
})();
