const G=figma.graph;const {createLinter}=await import('@open-pencil/core/lint');
const luminance=c=>[c.r,c.g,c.b].map(v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4)).reduce((a,x,i)=>a+x*[.2126,.7152,.0722][i],0);
const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
const screens=figma.root.findAll(n=>n.name.startsWith('Screen/'));
const rows=[];for(const screen of screens){
 const issues=[];let count=0,token=0,solid=0,h1=0;const rec=(n,bg=[{r:1,g:1,b:1,a:1}],insideScroll=false)=>{
  count++;const p=G.getNode(n.id);const fills=p.fills.map((f,i)=>({...f,color:p.boundVariables['fills/'+i+'/color']?G.resolveColorVariableForNode(p.id,p.boundVariables['fills/'+i+'/color'])||f.color:f.color}));
  for(let i=0;i<fills.length;i++)if(fills[i].type==='SOLID'){solid++;if(p.boundVariables['fills/'+i+'/color'])token++;}
  if(p.type!=='TEXT'&&fills[0]?.type==='SOLID')bg=[fills[0].color];
  if(p.type!=='TEXT'&&fills[0]?.type==='GRADIENT_LINEAR')bg=fills[0].gradientStops.map(s=>s.color);
  if(p.type==='TEXT'){
   if(p.fontSize<16)issues.push({id:p.id,kind:'font',value:p.fontSize});if(p.name==='h1')h1++;
   if(fills[0]?.type==='SOLID'&&!p.name.includes('Disabled')){const c=Math.min(...bg.map(b=>contrast(fills[0].color,b)));if(c<4.49)issues.push({id:p.id,kind:'contrast',value:+c.toFixed(2),text:p.text.slice(0,60)});}
   if(!p.text.trim())issues.push({id:p.id,kind:'empty-text'});
  }
  if(p.cornerRadius>12.01)issues.push({id:p.id,kind:'radius',value:p.cornerRadius});
  if(p.width<.5||p.height<.5)issues.push({id:p.id,kind:'collapsed',width:p.width,height:p.height});
  if(p.name.startsWith('link:')||p.name.startsWith('action:'))if(p.width<24||p.height<24)issues.push({id:p.id,kind:'target',width:p.width,height:p.height});
  if(n.parent&&n.parent.type!=='CANVAS'&&p.type!=='VECTOR'&&!p.name.startsWith('main')&&p.x+p.width>n.parent.width+2)issues.push({id:p.id,kind:'overflow-x',name:p.name,width:p.width,x:p.x,parentWidth:n.parent.width});
  for(const c of n.children)rec(c,bg,insideScroll||p.name.startsWith('main'));
 };rec(screen);rows.push({name:screen.name,nodes:count,h1,solid,token,issues});
}
const result=createLinter({preset:'strict'}).lintGraph(G);
await Bun.write('/work/repo/measurements/native-audit-round2.json',JSON.stringify({rows,lint:result}));
return {frames:rows.length,nodes:G.nodes.size,issues:rows.reduce((c,r)=>c+r.issues.length,0),categories:Object.fromEntries([...new Set(rows.flatMap(r=>r.issues.map(i=>i.kind)))].map(k=>[k,rows.reduce((c,r)=>c+r.issues.filter(i=>i.kind===k).length,0)])),lint:{errors:result.errorCount,warnings:result.warningCount,info:result.infoCount}};
