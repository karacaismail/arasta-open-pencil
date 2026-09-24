// Materialize adaptive layout using the native font measurer. Preserve component links and auto-layout.
const G=figma.graph;const {initCanvasKit,headlessRenderNodes}=await import('@open-pencil/core/io');const {SkiaRenderer}=await import('@open-pencil/core/canvas');const {recordInstanceOverride}=await import('@open-pencil/scene-graph');const ck=await initCanvasKit();const renderer=new SkiaRenderer(ck,ck.MakeSurface(1,1));await renderer.loadFonts();
const targets=figma.root.findAll(n=>n.name.startsWith('Screen/'));
await renderer.prepareForExport(G,targets[0].parent.id,targets.map(n=>n.id));
const intents=new Map();function intent(n){if(!intents.has(n.id)){let x={};try{x=JSON.parse(figma.getNodeById(n.id).getPluginData('arasta-layout')||'{}')}catch{}intents.set(n.id,x)}return intents.get(n.id)}
const children=n=>G.getChildren(n.id);
function measure(n,w){return renderer.measureTextNode(n,Math.max(1,w))||{width:Math.min(w,n.text.length*n.fontSize*.55),height:n.lineHeight||n.fontSize*1.5}}
function natural(n,max=5000){
 const q=intent(n);if(typeof q.width==='number')return Math.min(max,q.width);
 if(n.type==='TEXT')return Math.min(max,Math.ceil(measure(n,max).width));
 if(n.type==='VECTOR')return n.width;
 const ch=children(n);const pad=n.paddingLeft+n.paddingRight,gap=n.itemSpacing*Math.max(0,ch.length-1);
 return Math.min(max,pad+(n.layoutMode==='HORIZONTAL'?ch.reduce((a,c)=>a+natural(c,max),gap):Math.max(0,...ch.map(c=>natural(c,max-pad)))));
}
function set(n,patch){G.updateNode(n.id,patch);recordInstanceOverride(G,n.id,Object.keys(patch));}
function place(n,width,height=null){
 const q=intent(n);width=Math.max(1,width);
 if(n.type==='VECTOR')return {w:n.width,h:n.height};
 if(n.type==='TEXT'){
  const m=measure(n,width);const w=q.width==='fit_content'?Math.min(width,Math.ceil(m.width)):width,h=Math.max(n.fontSize,Math.ceil(m.height));
  set(n,{width:w,height:h,textAutoResize:'NONE',derivedLayout:null,primaryAxisSizing:'FIXED',counterAxisSizing:'FIXED',layoutGrow:0});return{w,h};
 }
 const padW=n.paddingLeft+n.paddingRight,padH=n.paddingTop+n.paddingBottom,inner=Math.max(1,width-padW),ch=children(n),row=n.layoutMode==='HORIZONTAL';
 if(n.layoutMode==='NONE'){
  const h=height??(typeof q.height==='number'?q.height:n.height);set(n,{width,height:h,derivedLayout:null});return{w:width,h};
 }
 const fixed=typeof q.height==='number'?q.height:null;let sizes=[],contentH=0;
 if(row){
  const space=n.itemSpacing*Math.max(0,ch.length-1);let fixedW=0,flex=0;
  for(const c of ch){const ci=intent(c);if(ci.width==='fill_container')flex++;else fixedW+=typeof ci.width==='number'?Math.min(inner,ci.width):natural(c,inner);}
  let remaining=Math.max(0,inner-space-fixedW),x=n.paddingLeft,y=n.paddingTop,lineH=0,maxX=0;
  for(const c of ch){const ci=intent(c);let cw=ci.width==='fill_container'?Math.max(1,remaining/Math.max(1,flex)):typeof ci.width==='number'?Math.min(inner,ci.width):natural(c,inner);
   // Short landscape tool rows wrap; multi-column grids remain equal-width columns.
   if(fixedW+space>inner&&ci.width==='fill_container')cw=inner;
   if(x>n.paddingLeft&&x+cw>width-n.paddingRight+1){x=n.paddingLeft;y+=lineH+n.itemSpacing;lineH=0;}
   const d=place(c,cw,(n.name.startsWith('Screen/')||n.name==='device-content')?height:null);set(c,{x,y});sizes.push([c,d]);lineH=Math.max(lineH,d.h);x+=d.w+n.itemSpacing;maxX=Math.max(maxX,x);}
  contentH=y-n.paddingTop+lineH;
  const lines=new Map();for(const [c,d] of sizes){const line=lines.get(c.y)||[];line.push([c,d]);lines.set(c.y,line);}for(const line of lines.values()){const used=line.reduce((a,[c,d])=>a+d.w,0)+n.itemSpacing*Math.max(0,line.length-1);let start=n.paddingLeft+(n.primaryAxisAlign==='CENTER'?Math.max(0,(inner-used)/2):0);const spacing=n.primaryAxisAlign==='SPACE_BETWEEN'&&line.length>1?Math.max(n.itemSpacing,(inner-line.reduce((a,[c,d])=>a+d.w,0))/(line.length-1)):n.itemSpacing;for(const [c,d] of line){set(c,{x:start});start+=d.w+spacing;}}
 }else{
  let y=n.paddingTop;const isBody=n.name==='device-content';let bodyLeft=height;
  if(isBody&&height!=null){for(const c of ch.filter(x=>!x.name.startsWith('main'))){const d=place(c,inner);sizes.push([c,d]);bodyLeft-=d.h;}bodyLeft-=padH+n.itemSpacing*Math.max(0,ch.length-1);}
  for(const c of ch){const ci=intent(c),cw=typeof ci.width==='number'?Math.min(inner,ci.width):ci.width==='fit_content'?natural(c,inner):inner;
   let d=sizes.find(([x])=>x.id===c.id)?.[1];if(!d)d=place(c,cw,isBody&&c.name.startsWith('main')?Math.max(64,bodyLeft):n.name.startsWith('Screen/')?height:null);
   const x=n.paddingLeft+(n.counterAxisAlign==='CENTER'?(inner-d.w)/2:n.counterAxisAlign==='MAX'?inner-d.w:0);set(c,{x,y});if(!sizes.some(([x])=>x.id===c.id))sizes.push([c,d]);y+=d.h+n.itemSpacing;}
  contentH=y-n.paddingTop-(ch.length?n.itemSpacing:0);
 }
 const h=height??(n.clipsContent&&fixed!==null?fixed:Math.max(fixed||0,contentH+padH));
 if(row){for(const [c,d] of sizes){if(n.counterAxisAlign==='CENTER')set(c,{y:n.paddingTop+(h-padH-d.h)/2});else if(n.counterAxisAlign==='MAX')set(c,{y:h-n.paddingBottom-d.h});}}
 const useWrap=row&&contentH>Math.max(0,...sizes.map(([,d])=>d.h))+1;
 set(n,{width,height:h,derivedLayout:null,primaryAxisSizing:'FIXED',counterAxisSizing:'FIXED',layoutGrow:0,layoutAlignSelf:'AUTO',layoutWrap:useWrap?'WRAP':'NO_WRAP'});
 return{w:width,h};
}
const times=[];for(const s of targets){const t=performance.now(),raw=G.getNode(s.id);place(raw,raw.width,raw.height);times.push({name:s.name,durationMs:performance.now()-t});}
await Bun.write('/work/repo/measurements/layout-materialization.json',JSON.stringify(times));
// OpenPencil FIG currently drops nested instance geometry overrides. Keep each adaptive size as a native variant master.
const lib=figma.root.children.find(p=>p.name==='00 · Tasarım Sistemi');
let adaptive=figma.root.children.find(p=>p.name==='00b · Uyarlanabilir bileşenler');if(!adaptive){adaptive=figma.createPage();adaptive.name='00b · Uyarlanabilir bileşenler';}
const variants=new Map();const records=[];
function signature(n){return [Math.round(n.width*100)/100,Math.round(n.height*100)/100,n.layoutMode,n.itemSpacing,n.primaryAxisAlign,n.counterAxisAlign,n.paddingTop,n.paddingRight,n.paddingBottom,n.paddingLeft,children(n).map(c=>[c.type,c.componentId,c.x,c.y,c.width,c.height,c.type==='TEXT'?c.text:'',c.type==='FRAME'?signature(c):''])]}
function canonical(node){
 for(const c of [...node.children])canonical(c);
 if(node.type!=='INSTANCE')return;
 const raw=G.getNode(node.id),parent=node.parent,idx=parent.children.findIndex(c=>c.id===node.id),key=node.mainComponent?.getPluginData('arasta-key')||node.mainComponent?.name||raw.componentId;
 const sign=key+'|'+JSON.stringify(signature(raw));let master=variants.get(sign);
 if(!master){
  const clone=node.clone();master=figma.createComponentFromNode(clone);adaptive.appendChild(master);master.x=(variants.size%12)*1700;master.y=Math.floor(variants.size/12)*1200;
  const hash=Bun.hash(sign).toString(16);master.name=key+'/'+Math.round(raw.width)+'px/'+hash.slice(0,8);master.setPluginData('arasta-key',master.name);master.setPluginData('arasta-base-key',key);
  // Component children become the source geometry rather than overrides of an earlier component.
  for(const c of master.findAll(c=>c.type!=='INSTANCE'))G.updateNode(c.id,{componentId:null,derivedLayout:null});
  variants.set(sign,master);records.push({base:key,master:master.id,width:raw.width,height:raw.height});
 }
 const n=master.createInstance();parent.insertChild(idx,n);n.name=node.name;n.x=raw.x;n.y=raw.y;n.setPluginData('arasta-layout',node.getPluginData('arasta-layout'));
 G.updateNode(n.id,{width:raw.width,height:raw.height,primaryAxisSizing:'FIXED',counterAxisSizing:'FIXED',layoutGrow:0,layoutAlignSelf:'AUTO',derivedLayout:null});
 node.remove();
}
for(const s of targets)canonical(s);
await Bun.write('/work/repo/measurements/adaptive-variants.json',JSON.stringify({masters:records,count:records.length}));
const s=targets.find(n=>n.name==='Screen/laptop/1440/ana-sayfa');await Bun.write('/work/repo/measurements/native-1440-materialized.png',await headlessRenderNodes(G,s.parent.id,[s.id]));
return {frames:targets.length,nodes:G.nodes.size};
