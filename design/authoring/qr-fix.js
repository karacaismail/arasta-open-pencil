const G=figma.graph;const changed=[];
for(const p of figma.root.findAll(n=>n.name==='QR modules')){
 p.x=22.756;p.y=22.756;changed.push(p.id);
}
return {qrPathsRepositioned:changed.length};
