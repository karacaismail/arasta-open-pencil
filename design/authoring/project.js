const G=figma.graph;const V=Object.fromEntries(figma.getLocalVariables().map(v=>[v.id,v]));
const hex=c=>'#'+[c.r,c.g,c.b].map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join('').toUpperCase();
function color(n,c,index=0,field='fills'){const v=V[n.boundVariables[field+'/'+index+'/color']];return v?'$'+v.name:hex(c)}
function fills(n,fs,field='fills'){return fs.filter(f=>f.visible!==false).map((f,i)=>f.type==='GRADIENT_LINEAR'?{type:'linear_gradient',angle:135,stops:f.gradientStops.map(s=>({offset:s.position,color:(()=>{let tokens=[];try{tokens=JSON.parse(figma.getNodeById(n.id).getPluginData('arasta-gradient-tokens')||'[]')}catch{}return tokens[f.gradientStops.indexOf(s)]?'$'+tokens[f.gradientStops.indexOf(s)]:hex(s.color)})()}))}:{type:'solid',color:color(n,f.color,i,field)});}
function project(id){const n=G.getNode(id),p=figma.getNodeById(id);let intent={};try{intent=JSON.parse(p.getPluginData('arasta-layout')||'{}')}catch{}
 let d={id:n.id,name:n.name,type:n.type==='TEXT'?'text':n.type==='VECTOR'?'path':'frame',width:intent.width??n.width,height:intent.height??n.height};
 if(n.type==='INSTANCE'){return {...d,type:'ref',ref:n.componentId};}
 d.fill=fills(n,n.fills);if(n.opacity!==1)d.opacity=n.opacity;
 if(n.type==='TEXT')Object.assign(d,{content:n.text,fontFamily:n.fontFamily,fontSize:n.fontSize,fontWeight:n.fontWeight,lineHeight:n.lineHeight/n.fontSize,textAlign:n.textAlignHorizontal.toLowerCase()});
 else if(n.type==='VECTOR')d.d=p.getPluginData('arasta-path')||p.vectorPaths.map(v=>v.data).join(' ');
 else{
  Object.assign(d,{layout:n.layoutMode==='HORIZONTAL'?'horizontal':n.layoutMode==='NONE'?'none':'vertical',gap:n.itemSpacing,padding:[n.paddingTop,n.paddingRight,n.paddingBottom,n.paddingLeft],cornerRadius:n.cornerRadius,alignItems:({MIN:'start',MAX:'end',CENTER:'center',STRETCH:'stretch'})[n.counterAxisAlign],justifyContent:({MIN:'start',MAX:'end',CENTER:'center',SPACE_BETWEEN:'space_between'})[n.primaryAxisAlign]});
  if(n.strokes.length)d.stroke={thickness:n.strokes[0].weight||1,fill:fills(n,n.strokes,'strokes')};
  d.children=G.getChildren(id).map(c=>project(c.id));
 }
 return d;
}
const screens=figma.root.findAll(n=>n.name.startsWith('Screen/'));
const masters=figma.root.findAll(n=>n.type==='COMPONENT');
const projection={source:'OpenPencil CLI / native Figma API graph',pages:[{id:'components',children:masters.map(n=>project(n.id))},{id:'screens',children:screens.map(n=>project(n.id))}]};
await Bun.write('/work/repo/design/projection.json',JSON.stringify(projection));
const metadata=screens.map(n=>({route:n.name.slice(7),id:n.id,pageId:n.parent.id,width:n.width,height:n.height}));
await Bun.write('/work/repo/measurements/native-index.json',JSON.stringify({screens:metadata,variables:figma.getLocalVariables(),collections:figma.getLocalVariableCollections(),nodes:G.nodes.size,components:masters.length,instances:figma.root.findAll(n=>n.type==='INSTANCE').length,componentSets:figma.root.findAll(n=>n.type==='COMPONENT_SET').length}));
return {screens:screens.length,masters:masters.length,nodes:G.nodes.size};
