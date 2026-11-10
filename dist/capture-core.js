(function(root){
  function clampCrop(rect,width,height){
    const number=(value,fallback)=>Number.isFinite(Number(value))?Math.round(Number(value)):fallback;
    const x=Math.max(0,Math.min(width-1,number(rect.x,0)));
    const y=Math.max(0,Math.min(height-1,number(rect.y,0)));
    return {x,y,width:Math.max(1,Math.min(width-x,number(rect.width,width))),height:Math.max(1,Math.min(height-y,number(rect.height,height)))};
  }
  function dragCrop(start,end,width,height){return clampCrop({x:Math.min(start.x,end.x),y:Math.min(start.y,end.y),width:Math.abs(end.x-start.x),height:Math.abs(end.y-start.y)},width,height);}
  function stopStream(stream){for(const track of stream?.getTracks()||[])track.stop();}
  function captureError(error){
    if(error.name==='NotAllowedError')return 'Screen sharing was cancelled or blocked. Choose Capture screen to try again, or upload an image.';
    if(error.name==='NotReadableError')return 'Your screen could not be read. Check your system’s screen recording permissions, then try again.';
    if(error.name==='NotFoundError')return 'No screen or window is available to capture. Try an open desktop window, or upload an image.';
    if(error.name==='InvalidStateError')return 'Return to this tab and click Capture screen again.';
    return error.message||'The screen could not be captured. Please try again.';
  }
  const api={clampCrop,dragCrop,stopStream,captureError};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MellowCaptureCore=api;
})(globalThis);
