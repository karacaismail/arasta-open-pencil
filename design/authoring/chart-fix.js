const G=figma.graph;const {initCanvasKit}=await import('@open-pencil/core/io');const {SkiaRenderer}=await import('@open-pencil/core/canvas');const ck=await initCanvasKit(),r=new SkiaRenderer(ck,ck.MakeSurface(1,1));await r.loadFonts();
const vars=Object.fromEntries(figma.getLocalVariables().map(v=>[v.name,v.id]));
function fill(n,key){n.fills=[{type:'SOLID',color:G.resolveColorVariable(vars[key]),opacity:1,visible:true}];figma.bindVariable(n.id,'fills/0/color',vars[key]);}
function f(parent,name,w,h,layout='VERTICAL'){const n=figma.createFrame();parent.appendChild(n);n.name=name;n.resize(w,h);n.layoutMode=layout;n.primaryAxisSizingMode='FIXED';n.counterAxisSizingMode='FIXED';n.fills=[];n.setPluginData('arasta-layout',JSON.stringify({width:'fill_container',height:'fit_content',role:name}));return n;}
function t(parent,value,w,h,size){const n=figma.createText();parent.appendChild(n);n.name='p';n.characters=value;n.fontName={family:'Roboto',style:'Regular'};n.fontSize=size;n.lineHeight=size*1.5;n.resize(w,h);n.textAutoResize='NONE';fill(n,'text.primary');n.setPluginData('arasta-layout',JSON.stringify({width:'fill_container',height:'fit_content',role:'p'}));if(vars['type.size.'+size])figma.bindVariable(n.id,'fontSize',vars['type.size.'+size]);return n;}
const changed=[];
for(const screen of figma.root.findAll(n=>n.name.endsWith('/panel')&&n.name.startsWith('Screen/'))){const chart=screen.findAll(n=>n.name==='chart')[0];if(!chart)continue;const parent=chart.parent,idx=parent.children.findIndex(c=>c.id===chart.id),w=chart.width,size=screen.name.includes('/tv/')?28:screen.width===2560?18:screen.width===3840?20:16,h=size*1.5+32;
 const next=f(parent,'chart',w,6*h+5*16);parent.insertChild(idx,next);next.x=chart.x;next.y=chart.y;next.itemSpacing=16;
 for(const [i,[month,v]] of [['Nisan',84],['Mayıs',96],['Haziran',112],['Temmuz',103],['Ağustos',128],['Eylül',142]].entries()){
  const row=f(next,'chart-row',w,h);row.y=i*(h+16);row.itemSpacing=8;const label=f(row,'chart-labels',w,size*1.5,'HORIZONTAL');t(label,month,w/2,size*1.5,size);const value=t(label,'₺'+v+'.000',w/2,size*1.5,size);value.x=w/2;value.textAlignHorizontal='RIGHT';
  const bar=f(row,'bar:'+v,w,24,'NONE');bar.y=size*1.5+8;fill(bar,'bg.muted');bar.cornerRadius=4;bar.setPluginData('arasta-layout',JSON.stringify({width:'fill_container',height:24,role:bar.name}));const inside=f(bar,'chart-fill',w*v/142,24,'NONE');fill(inside,'action.primary');inside.cornerRadius=4;
 }
 chart.remove();let n=parent;while(n&&n.type!=='CANVAS'&&!n.clipsContent&&n.type!=='INSTANCE'){const raw=G.getNode(n.id);if(n.layoutMode==='VERTICAL'){let y=raw.paddingTop;for(const c of n.children){c.y=y;y+=c.height+raw.itemSpacing;}n.resize(n.width,y-raw.itemSpacing+raw.paddingBottom);}n=n.parent;}changed.push(screen.name);
}
return {charts:changed.length};
