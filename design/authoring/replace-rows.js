const G=figma.graph;const repaired=[];
for(const s of figma.root.findAll(n=>n.name.startsWith('Screen/'))){const rows=new Set();for(const n of s.findAll(n=>n.type!=='VECTOR'&&n.parent&&n.x+n.width>n.parent.width+2))rows.add(n.parent.id);
 for(const id of rows){const old=figma.getNodeById(id),p=old.parent,idx=p.children.findIndex(c=>c.id===id),raw=G.getNode(id);const n=figma.createFrame();p.insertChild(idx,n);n.name=old.name;n.layoutMode='VERTICAL';n.primaryAxisSizingMode='FIXED';n.counterAxisSizingMode='FIXED';n.itemSpacing=12;n.counterAxisAlignItems='MIN';n.fills=old.fills;n.strokes=old.strokes;n.x=old.x;n.y=old.y;n.setPluginData('arasta-layout',old.getPluginData('arasta-layout'));let y=0;
 for(const c of [...old.children]){n.appendChild(c);c.x=0;c.y=y;c.layoutGrow=0;c.layoutAlign='INHERIT';y+=c.height+12;}
 n.resize(old.width,y-12);old.remove();repaired.push(n.id);}
}
return {newRows:repaired};
