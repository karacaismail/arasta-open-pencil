const G=figma.graph,vars=new Map(figma.getLocalVariables().map(v=>[v.id,v.name]));
function visit(n){const raw=G.getNode(n.id);return {name:n.name,type:n.type,x:n.x,y:n.y,width:n.width,height:n.height,layout:raw.layoutMode,text:raw.text,font:raw.fontFamily,fontSize:raw.fontSize,fills:raw.fills,bound:Object.fromEntries(Object.entries(raw.boundVariables).map(([k,v])=>[k,vars.get(v)])),component:n.type==='INSTANCE'?n.mainComponent?.name:null,children:n.children.map(visit)}}
const rows=figma.root.findAll(n=>n.name.startsWith('Screen/')).map(n=>({name:n.name,hash:new Bun.CryptoHasher('sha256').update(JSON.stringify(visit(n))).digest('hex')}));
await Bun.write('/work/repo/measurements/signature.json',JSON.stringify({frames:rows.length,rows}));return {frames:rows.length};
