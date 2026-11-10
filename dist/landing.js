'use strict';
const hero=document.querySelector('.hero-scroll'),intro=document.querySelector('.hero-intro'),processIntro=document.querySelector('.process-intro'),cards=[...document.querySelectorAll('.look-card')],motion=document.querySelector('.motion-section'),nav=document.querySelector('.navigation'),words=[...document.querySelectorAll('.reveal-word')],stickers=[...document.querySelectorAll('.motion-sticker')];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let pending=false;
const clamp=value=>Math.max(0,Math.min(1,value));
function updateMotion(){
 pending=false;const mobile=innerWidth<761,heroBounds=hero.getBoundingClientRect();
 const progress=reduced.matches?0:clamp(-heroBounds.top/Math.max(1,hero.offsetHeight-innerHeight));
 intro.style.opacity=1-clamp(progress*2.5);intro.style.transform=`translateY(${-progress*100}px)`;intro.style.pointerEvents=progress>.3?'none':'auto';
 const next=clamp((progress-.32)/.35);processIntro.style.opacity=next;processIntro.style.transform=`translateY(${(1-next)*35}px)`;processIntro.style.pointerEvents=next>.9?'auto':'none';
 const spread=mobile?innerWidth*.135:Math.min(innerWidth*.115,175);
 const startX=[-2.5,-1.5,-.5,.5,1.5,2.4],startY=[60,5,-20,0,25,85],angles=[-21,-12,-4,7,14,24];
 // The same cards fan out from the hero, then make room for the product story.
 const endX=mobile?[-innerWidth*.45,-innerWidth*.40,innerWidth*.35,innerWidth*.42,-innerWidth*.15,innerWidth*.12]:[-innerWidth*.39,-innerWidth*.18,innerWidth*.22,innerWidth*.39,-innerWidth*.25,innerWidth*.26];
 const endY=mobile?[-innerHeight*.10,-innerHeight*1.05,-innerHeight*1.08,-innerHeight*.03,innerHeight*.05,innerHeight*.06]:[-innerHeight*.30,-innerHeight*1.05,-innerHeight*1.08,-innerHeight*.28,innerHeight*.02,innerHeight*.02];
 cards.forEach((card,index)=>{const x=startX[index]*spread*(1-progress)+endX[index]*progress;const y=startY[index]*(1-progress)+endY[index]*progress;const rotate=angles[index]*(1-progress)+[-17,12,-14,14,-14,14][index]*progress;card.style.transform=`translate(calc(-50% + ${x}px),${y}px) rotate(${rotate}deg)`;});
 const bounds=motion.getBoundingClientRect(),motionProgress=reduced.matches?1:clamp((innerHeight*.4-bounds.top)/Math.max(1,motion.offsetHeight-innerHeight*.5));
 words.forEach((word,index)=>word.classList.toggle('lit',motionProgress>(index/words.length)*.75));
 stickers.forEach((sticker,index)=>{const amount=reduced.matches?0:Math.sin(motionProgress*Math.PI)*((index%2?1:-1)*45);sticker.style.transform=`translate(${amount}px,${-amount*.35}px)`;});
 const dark=bounds.top<85&&document.querySelector('.closing').getBoundingClientRect().top>85;nav.classList.toggle('on-dark',dark);
}
function schedule(){if(!pending){pending=true;requestAnimationFrame(updateMotion);}}
window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule,{passive:true});reduced.addEventListener('change',schedule);updateMotion();document.fonts.ready.then(schedule);
// A small, real styling preview. Its selected look transfers into the full editor.
const preview=document.querySelector('.demo-composition');let mood='sage',frame='clean';
function updatePreview(){preview.dataset.mood=mood;preview.dataset.frame=frame;document.getElementById('use-look').href=`studio.html?bg=${encodeURIComponent(mood)}&frame=${encodeURIComponent(frame)}`;}
document.querySelectorAll('button[data-mood]').forEach(button=>button.addEventListener('click',()=>{mood=button.dataset.mood;document.querySelectorAll('button[data-mood]').forEach(item=>{const active=item===button;item.classList.toggle('selected',active);item.setAttribute('aria-pressed',String(active));});updatePreview();}));
document.querySelectorAll('button[data-frame]').forEach(button=>button.addEventListener('click',()=>{frame=button.dataset.frame;document.querySelectorAll('button[data-frame]').forEach(item=>{const active=item===button;item.classList.toggle('selected',active);item.setAttribute('aria-pressed',String(active));});updatePreview();}));
