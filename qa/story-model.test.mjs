import assert from 'node:assert/strict';
import {CHAPTERS,EVENTS,resolveVisibleScene,navigationY,stageTopAt} from '../story.mjs';
const heights=[110,105,145,120,110,270,105,105,105,105];
let cases=0;
for(const vh of [720,768,900,1080]){
 let top=0;const geometry=CHAPTERS.map((c,i)=>{const g={id:c.id,top,height:heights[i]*vh/100,stageHeight:vh,readTop:vh*.3,readBottom:vh*.8,headingTop:vh*.3,headingBottom:vh*.45};top+=g.height;return g});
 for(const g of geometry){const v=resolveVisibleScene(geometry,g.top,vh,null,112);assert.equal(v.scene.id,g.id);assert.equal(v.event.id,CHAPTERS.find(c=>c.id===g.id).event||CHAPTERS.find(c=>c.id===g.id).carry);cases++}
 const last=EVENTS.find(e=>e.id==='last'),archive=EVENTS.find(e=>e.id==='archive');assert.notEqual(navigationY(last,geometry),navigationY(archive,geometry));cases++;
 for(const e of EVENTS){const g=geometry.find(g=>g.id===e.scene);const before=g.top-vh*.95;if(before>0){const v=resolveVisibleScene(geometry,before,vh,null,112);assert.notEqual(v.scene.id,g.id,'An event with only scenery entering must not activate');cases++}const v=resolveVisibleScene(geometry,navigationY(e,geometry),vh,null,112);assert.equal(v.event.id,e.id);cases++}
 const g=geometry.find(g=>g.id==='return');assert.equal(stageTopAt(g,g.top),0);assert.equal(stageTopAt(g,g.top+g.height-vh),0);assert(stageTopAt(g,g.top+g.height-vh+100)<0);cases+=3;
 for(const id of ['concert','legacy','epilogue']){const g=geometry.find(g=>g.id===id),v=resolveVisibleScene(geometry,g.top,vh,null,112);assert.equal(v.scene.event,undefined);assert.equal(v.event.id,v.scene.carry);cases++}
 const scenesDown=[],scenesUp=[];let previous;for(let y=0;y<top-vh;y+=31){const v=resolveVisibleScene(geometry,y,vh,previous,112);scenesDown.push(CHAPTERS.indexOf(v.scene));previous=v.scene.id}for(let i=1;i<scenesDown.length;i++)assert(scenesDown[i]>=scenesDown[i-1]);for(let y=top-vh;y>=0;y-=31){const v=resolveVisibleScene(geometry,y,vh,previous,112);scenesUp.push(CHAPTERS.indexOf(v.scene));previous=v.scene.id}for(let i=1;i<scenesUp.length;i++)assert(scenesUp[i]<=scenesUp[i-1]);cases+=2;
}
console.log(JSON.stringify({modelChecks:cases,result:'passed'}));
