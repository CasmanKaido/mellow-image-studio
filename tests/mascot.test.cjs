const {test}=require('node:test');const assert=require('node:assert/strict');
const core=require('../dist/mascot-core.js');
test('mascot placement stays inside landscape, square and portrait exports after dragging beyond the edges',()=>{
 for(const [w,h] of [[1600,1200],[1400,1400],[1080,1920]])for(const aspect of [1,1.5,.9])for(const center of [{x:-1,y:3},{x:2,y:-2},{x:.5,y:.5}]){
  const r=core.layout(w,h,aspect,35,center);
  assert.ok(r.x>=0&&r.y>=0);assert.ok(r.x+r.width<=w&&r.y+r.height<=h);assert.ok(Math.abs(r.height/r.width-aspect)<1e-10);
 }
});
test('pointer mapping compensates for the letterboxing of a fitted preview',()=>{
 const wide={left:10,top:20,width:800,height:400};
 assert.deepEqual(core.point({x:210,y:20},wide,1000,1000),{x:0,y:0});
 assert.deepEqual(core.point({x:610,y:420},wide,1000,1000),{x:1000,y:1000});
 const tall={left:0,top:0,width:400,height:800};
 assert.deepEqual(core.point({x:0,y:200},tall,1000,1000),{x:0,y:0});
 assert.deepEqual(core.point({x:200,y:400},tall,1000,1000),{x:500,y:500});
});
test('dragging only starts on the selected mascot bounds',()=>{
 const rect={x:100,y:200,width:50,height:80};assert.equal(core.contains(rect,{x:120,y:230}),true);assert.equal(core.contains(rect,{x:99,y:230}),false);
});
