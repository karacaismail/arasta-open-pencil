const G=figma.graph;const {deleteInstanceOverride}=await import('@open-pencil/scene-graph');
const productMasters=figma.root.findAll(n=>n.type==='COMPONENT'&&(n.getPluginData('arasta-base-key')||n.getPluginData('arasta-key')).startsWith('ProductCard/'));
const ids=new Set(productMasters.map(n=>n.id));let cleared=0;
for(const n of figma.root.findAll(n=>n.type==='INSTANCE'&&ids.has(n.mainComponent?.id))){const raw=G.getNode(n.id);if(deleteInstanceOverride(raw.instanceOverrides,n.id,n.id,'boundVariables'))cleared++;deleteInstanceOverride(raw.instanceOverrides,n.id,n.id,'strokes');}
for(const m of productMasters)G.syncInstances(m.id);
const bound=figma.getLocalVariables().find(v=>v.name==='border.default').id;
const checks=figma.root.findAll(n=>n.type==='INSTANCE'&&ids.has(n.mainComponent?.id)).map(n=>({id:n.id,master:n.mainComponent.id,pass:G.getNode(n.id).boundVariables['strokes/0/color']===bound}));
const repaired=[];
function grow(node){if(node.type==='INSTANCE')return;for(const c of node.children)grow(c);if(node.type!=='FRAME'||node.clipsContent)return;let i={};try{i=JSON.parse(node.getPluginData('arasta-layout')||'{}')}catch{}if(i.height!=='fit_content')return;const raw=G.getNode(node.id);const h=node.layoutMode==='VERTICAL'?node.children.reduce((s,c)=>s+c.height,0)+raw.paddingTop+raw.paddingBottom+Math.max(0,node.children.length-1)*raw.itemSpacing:Math.max(0,...node.children.map(c=>c.y+c.height))+raw.paddingBottom;node.resize(node.width,Math.max(node.height,h));}
for(const s of figma.root.findAll(n=>n.name.startsWith('Screen/'))){const parents=new Set();for(const n of s.findAll(n=>n.type!=='VECTOR'&&n.parent&&n.x+n.width>n.parent.width+2))if(n.parent.layoutMode==='HORIZONTAL')parents.add(n.parent.id);
 for(const id of parents){const n=figma.getNodeById(id),raw=G.getNode(id);n.layoutMode='VERTICAL';n.layoutWrap='NO_WRAP';n.primaryAxisSizingMode='FIXED';n.counterAxisSizingMode='FIXED';n.itemSpacing=12;let y=raw.paddingTop;for(const c of n.children){c.x=raw.paddingLeft;c.y=y;y+=c.height+12;}n.resize(n.width,y-12+raw.paddingBottom);repaired.push(id);}
 grow(s);
}
const prev=JSON.parse(await Bun.file('/work/repo/measurements/master-round3.json').text());prev.instances=checks;prev.allInherited=checks.every(x=>x.pass);prev.inheritedBindingOverridesCleared=cleared;prev.finalVerticalRepairs=repaired;delete prev.instanceOverridesWritten;prev.instancePropertyValueWrites=0;
await Bun.write('/work/repo/measurements/master-round3.json',JSON.stringify(prev));
return {masters:ids.size,instances:checks.length,allInherited:checks.every(x=>x.pass),inheritedBindingOverridesCleared:cleared,verticalRepairs:repaired.length};
