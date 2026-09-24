const G=figma.graph;
const {ALL_TOOLS}=await import('@open-pencil/core/tools');
const tool=ALL_TOOLS.find(t=>t.name==='design_to_tokens');
const tokenResults=[];
for(const format of ['css','tailwind','json']){
 const result=await tool.execute(figma,{format});
 await Bun.write('/work/repo/design/exports/tokens.'+(format==='tailwind'?'tailwind.css':format),result.output);
 tokenResults.push({format,tokenCount:result.tokenCount,modeCount:result.modeCount});
}
const {headlessRenderNodes,sceneNodeToJSX}=await import('@open-pencil/core/io');
const samples=['mobil-dikey/320','mobil-dikey/390','mobil-yatay/844','tablet-dikey/768','laptop/1440','masaustu/2560','tv/4k'];
const rendered=[];
for(const route of [...samples.map(s=>s+'/ana-sayfa'),'mobil-dikey/320/panel','tv/4k/odeme']){
 const n=figma.root.findAll(n=>n.name==='Screen/'+route)[0];
 const t=performance.now();const png=await headlessRenderNodes(G,n.parent.id,[n.id],{format:'PNG'});
 const file='native-'+route.replaceAll('/','-')+'.png';
 await Bun.write('/work/repo/measurements/screenshots/'+file,png);
 rendered.push({route,file,bytes:png.length,durationMs:performance.now()-t});
 if(route.startsWith('mobil-dikey/320/')||route.startsWith('laptop/1440/')){
  await Bun.write('/work/repo/design/exports/'+route.replaceAll('/','-')+'.tsx',sceneNodeToJSX(n.id,G,'tailwind'));
 }
}
const masters=figma.root.findAll(n=>n.type==='COMPONENT'&&(n.getPluginData('arasta-base-key')||n.getPluginData('arasta-key')).startsWith('ProductCard/'));
const ids=new Set(masters.map(n=>n.id));const bound=figma.getLocalVariables().find(v=>v.name==='border.default').id;
const instances=figma.root.findAll(n=>n.type==='INSTANCE'&&ids.has(n.mainComponent?.id));
const proof={tokenResults,rendered,masterRoundtrip:{masters:masters.length,instances:instances.length,passing:instances.filter(n=>G.getNode(n.id).boundVariables['strokes/0/color']===bound).length},figmaDesktopTested:false};
await Bun.write('/work/repo/measurements/native-export-evidence.json',JSON.stringify(proof,null,2));
return proof;
