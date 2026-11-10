'use strict';
const mascotCore=window.MellowMascotCore;
const mascotFiles={mellow:'assets/mascot-mellow.png',scout:'assets/mascot-scout.png',bolt:'assets/mascot-bolt.png'};
const mascotImages=new Map(),mascotLoads=new Map();let mascotDrag=null,customUploadGeneration=0,customObjectUrl=null;
function loadMascot(id){
 if(id==='none')return Promise.resolve(null);
 if(mascotImages.has(id))return Promise.resolve(mascotImages.get(id));
 if(mascotLoads.has(id))return mascotLoads.get(id);
 const promise=new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{mascotImages.set(id,image);requestDraw();resolve(image);};image.onerror=()=>{mascotLoads.delete(id);reject(new Error('The mascot could not load. Choose another mascot or try again.'));};image.src=mascotFiles[id];});
 mascotLoads.set(id,promise);return promise;
}
async function prepareMascot(){let id;do{id=state.mascot.id;await loadMascot(id);}while(id!==state.mascot.id);}
function mascotRect(){const image=mascotImages.get(state.mascot.id);return image?mascotCore.layout(canvas.width,canvas.height,image.naturalHeight/image.naturalWidth,state.mascot.size,state.mascot.center):null;}
function drawMascot(){const image=mascotImages.get(state.mascot.id),rect=mascotRect();if(!image||!rect)return;ctx.save();ctx.globalAlpha=state.mascot.opacity/100;ctx.drawImage(image,rect.x,rect.y,rect.width,rect.height);ctx.restore();}
function setMascot(id){
 if(id!=='none'&&!Object.hasOwn(mascotFiles,id)&&!(id==='custom'&&mascotImages.has('custom')))return;
 state.mascot.id=id;$('mascot-adjustments').hidden=id==='none';canvas.classList.toggle('has-mascot',id!=='none');
 document.querySelectorAll('[data-mascot]').forEach(button=>{const active=button.dataset.mascot===id;button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active));});
 loadMascot(id).catch(error=>toast(error.message));requestDraw();
}
function resetMascot(){customUploadGeneration++;if(customObjectUrl){URL.revokeObjectURL(customObjectUrl);customObjectUrl=null;}mascotImages.delete('custom');mascotLoads.delete('custom');$('custom-mascot').hidden=true;$('custom-mascot-name').textContent='';$('custom-mascot-thumb').removeAttribute('src');$('mascot-opacity').value=100;$('mascot-opacity-out').textContent='100%';state.mascot={id:'none',size:22,opacity:100,center:{x:.84,y:.8}};$('mascot-size').value=22;$('mascot-size-out').textContent='22%';$('mascot-position').value='bottom-right';setMascot('none');}
function placeMascot(position){
 if(position==='custom')return;
 state.mascot.center={x:position.endsWith('left')?0:position.endsWith('right')?1:.5,y:position.startsWith('top')?0:position.startsWith('bottom')?1:.5};requestDraw();
}
document.querySelectorAll('[data-mascot]').forEach(button=>button.addEventListener('click',()=>{setMascot(button.dataset.mascot);placeMascot($('mascot-position').value);}));
$('mascot-size').addEventListener('input',()=>{state.mascot.size=Number($('mascot-size').value);$('mascot-size-out').textContent=`${state.mascot.size}%`;requestDraw();});
$('mascot-position').addEventListener('change',()=>placeMascot($('mascot-position').value));
canvas.addEventListener('pointerdown',event=>{
 if(!state.image||state.mascot.id==='none'||event.button!==0)return;
 const rect=mascotRect(),p=mascotCore.point({x:event.clientX,y:event.clientY},canvas.getBoundingClientRect(),canvas.width,canvas.height);
 if(!rect||!mascotCore.contains(rect,p))return;
 event.preventDefault();mascotDrag={pointerId:event.pointerId,dx:p.x-(rect.x+rect.width/2),dy:p.y-(rect.y+rect.height/2)};canvas.setPointerCapture(event.pointerId);canvas.classList.add('dragging-mascot');
});
canvas.addEventListener('pointermove',event=>{
 if(!mascotDrag||event.pointerId!==mascotDrag.pointerId)return;
 const p=mascotCore.point({x:event.clientX,y:event.clientY},canvas.getBoundingClientRect(),canvas.width,canvas.height);
 state.mascot.center={x:(p.x-mascotDrag.dx)/canvas.width,y:(p.y-mascotDrag.dy)/canvas.height};
 const rect=mascotRect();state.mascot.center={x:(rect.x+rect.width/2)/canvas.width,y:(rect.y+rect.height/2)/canvas.height};$('mascot-position').value='custom';requestDraw();
});
function stopMascotDrag(){mascotDrag=null;canvas.classList.remove('dragging-mascot');}
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,stopMascotDrag);
const linkedMascot=new URLSearchParams(location.search).get('mascot');if(Object.hasOwn(mascotFiles,linkedMascot)){setMascot(linkedMascot);placeMascot('bottom-right');}

$('upload-mascot').addEventListener('click',()=>$('mascot-file').click());
$('mascot-file').addEventListener('change',event=>{
 const file=event.target.files[0];event.target.value='';if(!file)return;
 if(!/^image\/(png|jpeg|webp)$/.test(file.type)){toast('Choose a PNG, JPG or WebP logo or mascot.');return;}
 if(file.size>10*1024*1024){toast('Choose a logo or mascot smaller than 10 MB.');return;}
 const generation=++customUploadGeneration,url=URL.createObjectURL(file),image=new Image();
 image.onload=()=>{
  if(generation!==customUploadGeneration){URL.revokeObjectURL(url);return;}
  if(customObjectUrl)URL.revokeObjectURL(customObjectUrl);customObjectUrl=url;
  mascotImages.set('custom',image);mascotLoads.delete('custom');$('custom-mascot-thumb').src=url;$('custom-mascot').hidden=false;$('custom-mascot-name').textContent=file.name;
  setMascot('custom');placeMascot($('mascot-position').value);toast('Logo or mascot added.');
 };
 image.onerror=()=>{URL.revokeObjectURL(url);if(generation===customUploadGeneration)toast('That image could not be opened. Try another file.');};image.src=url;
});
$('mascot-opacity').addEventListener('input',()=>{state.mascot.opacity=Number($('mascot-opacity').value);$('mascot-opacity-out').textContent=`${state.mascot.opacity}%`;requestDraw();});
window.addEventListener('pagehide',()=>{if(customObjectUrl)URL.revokeObjectURL(customObjectUrl);});
