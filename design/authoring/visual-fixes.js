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

const tablet=[];
for(const screen of targets.filter(n=>['Screen/tablet-dikey/600/ana-sayfa','Screen/tablet-dikey/768/ana-sayfa'].includes(n.name))){
 const value=screen.findAll(n=>n.type==='TEXT'&&n.characters==='₺24.600')[0],old=value.parent.parent,parent=old.parent,index=parent.children.findIndex(n=>n.id===old.id);
 const row=figma.createFrame();parent.insertChild(index,row);row.name='collage-stats';row.layoutMode='VERTICAL';row.primaryAxisSizingMode='FIXED';row.counterAxisSizingMode='FIXED';row.fills=[];row.itemSpacing=16;row.resize(old.width,old.height);row.x=old.x;row.y=old.y;row.setPluginData('arasta-layout',JSON.stringify({width:'fill_container',height:'fit_content'}));
 for(const c of [...old.children])row.appendChild(c);old.remove();place(G.getNode(row.id),row.width);
 let n=parent;while(n&&n.type!=='CANVAS'&&!n.clipsContent){const raw=G.getNode(n.id);if(n.layoutMode==='VERTICAL'){let y=raw.paddingTop;for(const c of n.children){c.y=y;y+=c.height+raw.itemSpacing;}n.resize(n.width,y-raw.itemSpacing+raw.paddingBottom);}else if(n.layoutMode==='HORIZONTAL')n.resize(n.width,Math.max(...n.children.map(c=>c.y+c.height))+raw.paddingBottom);n=n.parent;}tablet.push(screen.name);
}
const colors=Object.fromEntries(figma.getLocalVariables().map(v=>[v.name,v.id]));let heroCount=0;
for(const n of figma.root.findAll(n=>n.name==='hero')){const raw=G.getNode(n.id);if(!raw.fills.some(f=>f.type==='GRADIENT_LINEAR'))continue;const tokens=['bg.brand-subtle','bg.ai-subtle'];n.setPluginData('arasta-gradient-tokens',JSON.stringify(tokens));n.fills=n.fills.map(f=>f.type==='GRADIENT_LINEAR'?{...f,gradientStops:f.gradientStops.map((s,i)=>({...s,color:G.resolveColorVariableForNode(n.id,colors[tokens[i]])}))}:f);heroCount++;}
await Bun.write('/work/repo/measurements/visual-fixes.json',JSON.stringify({tablet,semanticGradientHeroes:heroCount}));return {tablet,semanticGradientHeroes:heroCount};
