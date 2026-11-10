'use strict';
// Capture uses the browser's own source picker. Only a local still image enters the editor.
const captureDialog=$('capture-dialog'),captureVideo=$('capture-video'),cropPreview=$('crop-preview');
const captureCore=window.MellowCaptureCore;
let captureStream=null,frozenCapture=null,cropRect=null,cropStart=null,captureGeneration=0,capturePending=false,editingImage=false,cropFileName="";
function stopCaptureStream(){const stream=captureStream;captureStream=null;captureCore.stopStream(stream);captureVideo.pause();captureVideo.srcObject=null;captureVideo.hidden=true;$('take-screenshot').disabled=true;}
function closeCapture(){captureGeneration++;capturePending=false;captureButtonsBusy(false);stopCaptureStream();frozenCapture=null;cropRect=null;cropStart=null;}
function captureButtonsBusy(busy){for(const id of ['capture-screen','choose-capture'])$(id).disabled=busy;}
function setCaptureStatus(message){$('capture-status').textContent=message;}
function configureCropMode(editing){
  editingImage=editing;
  $('choose-capture').hidden=editing;
  document.querySelector('.capture-privacy').textContent=editing?'Edits stay on your device. Cancel keeps your image unchanged. Restore original brings back the full image.':'Captures stay on your device. No microphone or audio is captured. The browser lets you choose what to share each time.';
  $('use-screenshot').textContent=editing?'Apply crop ':'Use screenshot ';
}
function showCaptureDialog(){if(!captureDialog.open)captureDialog.showModal();}
function drawCrop(){
  if(!frozenCapture||!cropRect)return;
  const context=cropPreview.getContext('2d'),{width,height}=frozenCapture;
  if(cropPreview.width!==width||cropPreview.height!==height){cropPreview.width=width;cropPreview.height=height;}
  context.clearRect(0,0,width,height);context.drawImage(frozenCapture,0,0);
  const r=cropRect,full=r.x===0&&r.y===0&&r.width===width&&r.height===height;
  if(!full){
    context.fillStyle='#16271ca0';context.fillRect(0,0,width,height);
    context.drawImage(frozenCapture,r.x,r.y,r.width,r.height,r.x,r.y,r.width,r.height);
    context.strokeStyle='#fff';context.lineWidth=Math.max(2,width/550);context.setLineDash([width/90,width/150]);context.strokeRect(r.x,r.y,r.width,r.height);context.setLineDash([]);
  }
  for(const [field,key]of [['crop-x','x'],['crop-y','y'],['crop-width','width'],['crop-height','height']]){$(field).value=r[key];$(field).max=key==='x'?width-1:key==='y'?height-1:key==='width'?width:height;}
  setCaptureStatus(`${editingImage?'Image crop':'Still captured · sharing stopped'} · ${r.width} × ${r.height} px selected`);
}
async function startCapture(){
  if(capturePending)return;
  configureCropMode(false);
  if(!window.isSecureContext||!navigator.mediaDevices?.getDisplayMedia){
    showCaptureDialog();$('capture-heading').textContent='Capture from your screen.';setCaptureStatus(!window.isSecureContext?'Screen capture needs a secure HTTPS connection. Open the published Mellow site to capture.':'This browser does not offer screen capture. Try a supported desktop browser, or upload an image.');
    $('take-screenshot').hidden=true;$('use-screenshot').hidden=true;return;
  }
  const generation=++captureGeneration;stopCaptureStream();frozenCapture=null;cropRect=null;
  cropPreview.hidden=true;$('crop-fields').hidden=true;$('crop-instruction').hidden=true;$('use-screenshot').hidden=true;$('take-screenshot').hidden=false;
  capturePending=true;captureButtonsBusy(true);
  try{
    // This call stays directly inside the user's click, preserving transient activation.
    const stream=await navigator.mediaDevices.getDisplayMedia({video:true,audio:false,monitorTypeSurfaces:'include',selfBrowserSurface:'exclude'});
    if(generation!==captureGeneration){captureCore.stopStream(stream);return;}
    captureStream=stream;const track=stream.getVideoTracks()[0];
    if(!track)throw new Error('No video source was shared. Please choose a screen or window.');
    track.addEventListener('ended',()=>{if(captureStream===stream){stopCaptureStream();setCaptureStatus('Sharing ended. Choose another source to take a screenshot.');}},{once:true});
    captureVideo.srcObject=stream;captureVideo.hidden=false;$('capture-heading').textContent='Capture screen.';
    setCaptureStatus('Live preview · take the shot when your screen is ready.');showCaptureDialog();
    let playTimeout;try{await Promise.race([captureVideo.play(),new Promise((_,reject)=>{playTimeout=setTimeout(()=>reject(new Error('The screen preview did not start. Try another source.')),12000);})]);}finally{clearTimeout(playTimeout);}
    if(generation!==captureGeneration)return;
    if(!captureVideo.videoWidth){await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>{cleanup();reject(new Error('The screen preview did not become ready. Try another source.'));},12000);const ready=()=>{cleanup();resolve();};function cleanup(){clearTimeout(timeout);captureVideo.removeEventListener('loadeddata',ready);}captureVideo.addEventListener('loadeddata',ready,{once:true});});}
    if(generation!==captureGeneration||captureStream!==stream)return;
    if(!captureVideo.videoWidth||!captureVideo.videoHeight)throw new Error('The shared screen has no readable image yet. Try another source.');
    $('take-screenshot').disabled=false;
  }catch(error){if(generation===captureGeneration){stopCaptureStream();showCaptureDialog();setCaptureStatus(captureCore.captureError(error));}}
  finally{if(generation===captureGeneration){capturePending=false;captureButtonsBusy(false);}}
}
function takeScreenshot(){
  if(!captureStream||!captureVideo.videoWidth||captureVideo.readyState<2){setCaptureStatus('Wait for the live preview before taking the screenshot.');return;}
  try{
    const still=document.createElement('canvas');still.width=captureVideo.videoWidth;still.height=captureVideo.videoHeight;
    still.getContext('2d').drawImage(captureVideo,0,0);frozenCapture=still;
    // Stop every capture track immediately. Cropping uses the frozen canvas only.
    stopCaptureStream();cropRect={x:0,y:0,width:still.width,height:still.height};
    $('capture-heading').textContent='Crop image.';cropPreview.hidden=false;$('crop-fields').hidden=false;$('crop-instruction').hidden=false;$('take-screenshot').hidden=true;$('use-screenshot').hidden=false;drawCrop();
  }catch{stopCaptureStream();setCaptureStatus('This source could not be saved. Try another window or upload an image.');}
}
function cropPoint(event){const bounds=cropPreview.getBoundingClientRect();return {x:Math.max(0,Math.min(cropPreview.width,(event.clientX-bounds.left)*cropPreview.width/bounds.width)),y:Math.max(0,Math.min(cropPreview.height,(event.clientY-bounds.top)*cropPreview.height/bounds.height))};}
cropPreview.addEventListener('pointerdown',event=>{if(!frozenCapture||event.button!==0)return;event.preventDefault();cropStart=cropPoint(event);cropPreview.setPointerCapture(event.pointerId);});
cropPreview.addEventListener('pointermove',event=>{if(!cropStart||!frozenCapture)return;cropRect=captureCore.dragCrop(cropStart,cropPoint(event),frozenCapture.width,frozenCapture.height);drawCrop();});
function endCrop(event){if(cropStart){const end=cropPoint(event);if(Math.abs(end.x-cropStart.x)>3&&Math.abs(end.y-cropStart.y)>3)cropRect=captureCore.dragCrop(cropStart,end,frozenCapture.width,frozenCapture.height);cropStart=null;drawCrop();}}
cropPreview.addEventListener('pointerup',endCrop);cropPreview.addEventListener('pointercancel',()=>{cropStart=null;});
for(const id of ['crop-x','crop-y','crop-width','crop-height'])$(id).addEventListener('input',()=>{if(!frozenCapture)return;cropRect=captureCore.clampCrop({x:$('crop-x').value,y:$('crop-y').value,width:$('crop-width').value,height:$('crop-height').value},frozenCapture.width,frozenCapture.height);drawCrop();});
$('crop-reset').addEventListener('click',()=>{if(frozenCapture){cropRect={x:0,y:0,width:frozenCapture.width,height:frozenCapture.height};drawCrop();}});
$('use-screenshot').addEventListener('click',()=>{
  if(!frozenCapture||!cropRect)return;const generation=captureGeneration;
  const cropped=document.createElement('canvas');cropped.width=cropRect.width;cropped.height=cropRect.height;
  cropped.getContext('2d').drawImage(frozenCapture,cropRect.x,cropRect.y,cropRect.width,cropRect.height,0,0,cropRect.width,cropRect.height);
  $('use-screenshot').disabled=true;
  cropped.toBlob(blob=>{
    $('use-screenshot').disabled=false;if(generation!==captureGeneration)return;
    if(!blob){setCaptureStatus('The screenshot could not be created. Please try again.');return;}
    if(blob.size>20*1024*1024){setCaptureStatus('This screenshot is over 20 MB. Select a smaller crop, then try again.');return;}
    const file=new File([blob],editingImage?cropFileName:`Screen capture ${new Date().toISOString().replace(/[:.]/g,'-')}.png`,{type:'image/png'});
    loadImage(file,{preserveOriginal:editingImage});captureDialog.close();
  },'image/png');
});
for(const id of ['capture-screen','choose-capture'])$(id).addEventListener('click',startCapture);
for(const id of ['close-capture','cancel-capture'])$(id).addEventListener('click',()=>captureDialog.close());
captureDialog.addEventListener('close',closeCapture);captureDialog.addEventListener('cancel',closeCapture);
$('reset').addEventListener('click',()=>{if(captureDialog.open)captureDialog.close();else closeCapture();});
window.addEventListener('pagehide',closeCapture);

// Reuse the still-image cropper for uploads, pastes and images already captured.
$('crop-image').addEventListener('click',()=>{
  if(!state.image)return;
  closeCapture();configureCropMode(true);cropFileName=state.fileName;
  const still=document.createElement('canvas');still.width=state.image.width;still.height=state.image.height;
  still.getContext('2d').drawImage(state.image,0,0);frozenCapture=still;
  cropRect={x:0,y:0,width:still.width,height:still.height};
  $('capture-heading').textContent='Crop image.';
  cropPreview.hidden=false;$('crop-fields').hidden=false;$('crop-instruction').hidden=false;
  $('take-screenshot').hidden=true;$('use-screenshot').hidden=false;
  drawCrop();showCaptureDialog();
});
