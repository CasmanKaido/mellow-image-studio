(function(root){
 'use strict';
 function layout(width,height,aspect,size,center){
  const margin=Math.min(24,width*.02,height*.02);
  const w=Math.min(width*size/100,width-margin*2,(height-margin*2)/aspect),h=w*aspect;
  const x=Math.max(margin,Math.min(width-w-margin,center.x*width-w/2));
  const y=Math.max(margin,Math.min(height-h-margin,center.y*height-h/2));
  return {x,y,width:w,height:h};
 }
 function point(client,bounds,width,height){
  const scale=Math.min(bounds.width/width,bounds.height/height);
  const left=bounds.left+(bounds.width-width*scale)/2,top=bounds.top+(bounds.height-height*scale)/2;
  return {x:(client.x-left)/scale,y:(client.y-top)/scale};
 }
 function contains(rect,p){return p.x>=rect.x&&p.x<=rect.x+rect.width&&p.y>=rect.y&&p.y<=rect.y+rect.height;}
 const api={layout,point,contains};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MellowMascotCore=api;
})(globalThis);
