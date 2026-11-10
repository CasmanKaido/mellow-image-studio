const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');
const core=require('../dist/capture-core.js');
test('crop coordinates stay within image bounds and never produce a zero-size canvas',()=>{
 assert.deepEqual(core.clampCrop({x:-20,y:80,width:500,height:0},200,100),{x:0,y:80,width:200,height:1});
 assert.deepEqual(core.clampCrop({x:500,y:500,width:500,height:500},200,100),{x:199,y:99,width:1,height:1});
 assert.deepEqual(core.clampCrop({x:NaN,y:NaN,width:NaN,height:NaN},200,100),{x:0,y:0,width:200,height:100});
});
test('crop supports dragging in any direction',()=>{
 assert.deepEqual(core.dragCrop({x:150,y:80},{x:30,y:20},200,100),{x:30,y:20,width:120,height:60});
});
test('all sharing tracks stop during cleanup, including optional unexpected tracks',()=>{
 let stopped=0;core.stopStream({getTracks:()=>[{stop:()=>stopped++},{stop:()=>stopped++}]});assert.equal(stopped,2);core.stopStream(null);
});
function captureHarness(getDisplayMedia,secure=true){
 const elements=new Map(),listeners=new Map();let loaded=null,loadOptions=null;
 function element(id){
  if(elements.has(id))return elements.get(id);
  const result={id,hidden:false,disabled:false,open:false,textContent:'',value:'0',width:0,height:0,videoWidth:1000,videoHeight:500,readyState:4,srcObject:null,addEventListener:(name,handler)=>{listeners.set(id+':'+name,handler);},removeEventListener:()=>{},pause:()=>{},play:async()=>{},showModal(){this.open=true;},close(){this.open=false;listeners.get(id+':close')?.();},getBoundingClientRect:()=>({left:0,top:0,width:500,height:250}),setPointerCapture:()=>{},getContext:()=>({clearRect(){},drawImage(){},fillRect(){},strokeRect(){},setLineDash(){}}),toBlob(callback){callback(new Blob(['image'],{type:'image/png'}));}};
  elements.set(id,result);return result;
 }
 const window={isSecureContext:secure,MellowCaptureCore:core,addEventListener:()=>{}};
 const context={window,navigator:{mediaDevices:{getDisplayMedia}},$:element,state:{image:{width:800,height:600},fileName:'uploaded.jpg'},document:{querySelector:()=>element('privacy'),createElement:()=>element('canvas-'+elements.size)},File:class{constructor(parts,name,options){this.name=name;this.type=options.type;}},Blob,Date,setTimeout,clearTimeout,loadImage:(file,options)=>{loaded=file;loadOptions=options;}};
 vm.createContext(context);vm.runInContext(fs.readFileSync(require.resolve('../dist/capture.js'),'utf8'),context);
 return {context,elements,listeners,element,loaded:()=>loaded,loadOptions:()=>loadOptions};
}
test('capturing a still immediately stops sharing and inserts a cropped PNG into the editor',async()=>{
 let stopped=0,options;const track={stop:()=>stopped++,addEventListener:()=>{}};
 const stream={getTracks:()=>[track],getVideoTracks:()=>[track]};
 const h=captureHarness(async value=>{options=value;return stream;});
 await h.context.startCapture();assert.equal(options.audio,false);assert.equal(options.video,true);assert.equal(h.element('capture-dialog').open,true);assert.equal(h.element('take-screenshot').disabled,false);
 h.context.takeScreenshot();assert.equal(stopped,1);assert.equal(h.element('capture-video').srcObject,null);assert.equal(h.element('use-screenshot').hidden,false);assert.equal(h.element('crop-width').value,1000);
 h.listeners.get('use-screenshot:click')();assert.equal(h.loaded().type,'image/png');assert.match(h.loaded().name,/Screen capture/);assert.equal(h.element('capture-dialog').open,false);
});
test('closing the capture dialog stops the selected stream',async()=>{
 let stopped=0;const track={stop:()=>stopped++,addEventListener:()=>{}};const h=captureHarness(async()=>({getTracks:()=>[track],getVideoTracks:()=>[track]}));
 await h.context.startCapture();h.element('capture-dialog').close();assert.equal(stopped,1);assert.equal(h.element('capture-video').srcObject,null);
});
test('a stream granted after cancellation is immediately stopped and never shown',async()=>{
 let grant,stopped=0;const h=captureHarness(()=>new Promise(resolve=>grant=resolve));const pending=h.context.startCapture();h.context.closeCapture();
 const track={stop:()=>stopped++,addEventListener:()=>{}};grant({getTracks:()=>[track],getVideoTracks:()=>[track]});await pending;assert.equal(stopped,1);assert.equal(h.element('capture-dialog').open,false);
});
test('denied sharing leaves the editor intact with a useful recovery message',async()=>{
 const error=new Error('Denied');error.name='NotAllowedError';const h=captureHarness(async()=>{throw error;});await h.context.startCapture();assert.match(h.element('capture-status').textContent,/cancelled or blocked/);assert.equal(h.loaded(),null);
});
test('insecure preview never attempts to request screen access',async()=>{
 let called=false;const h=captureHarness(async()=>{called=true;},false);await h.context.startCapture();assert.equal(called,false);assert.match(h.element('capture-status').textContent,/HTTPS/);
});

test('uploaded images crop without requesting sharing and preserve the original on apply',()=>{
 let requested=false;const h=captureHarness(()=>{requested=true;});
 h.listeners.get('crop-image:click')();
 assert.equal(requested,false);assert.equal(h.element('capture-dialog').open,true);
 assert.equal(h.element('choose-capture').hidden,true);assert.equal(h.element('crop-width').value,800);
 h.element('crop-width').value='320';h.element('crop-height').value='240';
 h.listeners.get('crop-width:input')();h.listeners.get('use-screenshot:click')();
 assert.equal(h.loaded().name,'uploaded.jpg');assert.equal(h.loadOptions().preserveOriginal,true);
});
test('cancelling an uploaded image crop leaves the editor unchanged',()=>{
 const h=captureHarness(()=>{throw Error('No sharing should be requested');});
 h.listeners.get('crop-image:click')();h.element('capture-dialog').close();
 assert.equal(h.loaded(),null);
});
