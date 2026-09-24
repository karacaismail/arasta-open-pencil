const G=figma.graph,V=Object.fromEntries(figma.getLocalVariables().map(v=>[v.name,v.id]));
const page=figma.createPage();page.name='00c · Durum matrisi';figma.currentPage=page;
function paint(n,token,stroke=false){const field=stroke?'strokes':'fills';n[field]=[{type:'SOLID',color:G.resolveColorVariable(V[token]),opacity:1,visible:true}];if(stroke)n.strokeWeight=1;figma.bindVariable(n.id,field+'/0/color',V[token]);}
function frame(parent,name,w,h,x=0,y=0,token=null){const n=figma.createFrame();parent.appendChild(n);n.name=name;n.resize(w,h);n.x=x;n.y=y;n.fills=[];n.layoutMode='NONE';if(token)paint(n,token);return n;}
function txt(parent,str,x,y,w,h,size,token='text.primary'){const n=figma.createText();parent.appendChild(n);n.name='label';n.characters=str;n.fontName={family:'Roboto',style:'Medium'};n.fontSize=size;n.lineHeight=size*1.5;n.resize(w,h);n.textAutoResize='NONE';n.x=x;n.y=y;paint(n,token);if(V['type.size.'+size])figma.bindVariable(n.id,'fontSize',V['type.size.'+size]);return n;}
function border(n,token,weight=1){paint(n,token,true);n.strokeWeight=weight;}
const families={phone:[16,44],phoneL:[16,44],tablet:[16,44],tabletL:[16,44],desktop:[16,44],wide:[18,48],ultra:[20,56],tv:[28,64]};
const groups=[];let row=0;
for(const [family,[size,target]] of Object.entries(families)){
 const make=(type,properties,w=320,h=target)=>{const c=figma.createComponent();page.appendChild(c);c.name=properties;c.resize(w,h);c.fills=[];c.layoutMode='NONE';c.setPluginData('arasta-key',type+'/'+family+'/'+properties);c.setPluginData('arasta-layout',JSON.stringify({width:w,height:h}));return c;};
 const group=(name,items)=>{const s=figma.combineAsVariants(items,page);s.name=name+'/'+family;s.fills=[];items.forEach((c,i)=>{c.x=24+(i%6)*400;c.y=24+Math.floor(i/6)*220});s.resize(2448,Math.ceil(items.length/6)*220+48);s.x=0;s.y=row;row+=s.height+96;groups.push({name:s.name,variants:items.length});};
 const buttons=[];
 for(const type of ['Primary','Secondary','Tertiary','Danger'])for(const state of ['Default','Hover','Pressed','Focus','Disabled','Loading']){
  const c=make('Button','Type='+type+', State='+state);c.cornerRadius=8;
  const primary=['Primary','Danger'].includes(type),disabled=state==='Disabled';
  if(type!=='Tertiary'||disabled)paint(c,disabled?'action.disabled-bg':type==='Danger'?'action.danger':primary?({Hover:'action.hover',Pressed:'action.pressed'}[state]||'action.primary'):'bg.surface');
  const ink=disabled?'action.disabled-text':primary?'text.on-brand':'text.brand';if(type==='Secondary')border(c,'border.default');
  if(state==='Focus'){border(c,'focus.ring',2);const ring=frame(c,'2px focus gap',4,4,0,0);ring.fills=[];}
  const label=txt(c,state==='Loading'?'Yükleniyor…':'Devam et',48,(target-size*1.5)/2,256,size*1.5,size,ink);
  const mark=frame(c,state==='Loading'?'Loading indicator':'Icon slot',20,20,16,(target-20)/2);mark.cornerRadius=state==='Loading'?10:4;border(mark,ink,2);
  c.layoutMode='HORIZONTAL';c.primaryAxisSizingMode='FIXED';c.counterAxisSizingMode='FIXED';c.itemSpacing=12;c.paddingLeft=16;c.paddingRight=16;c.counterAxisAlignItems='CENTER';buttons.push(c);
 }
 group('Button',buttons);
 for(const type of ['Checkbox','Radio','Switch']){
  const items=[];for(const checked of type==='Checkbox'?['Unchecked','Checked','Indeterminate']:['Off','On'])for(const state of ['Default','Focus','Disabled']){
   const c=make(type,'Value='+checked+', State='+state);const disabled=state==='Disabled',active=!['Unchecked','Off'].includes(checked);const ink=disabled?'action.disabled-text':active?'action.primary':'border.default';
   const w=type==='Switch'?44:24;const control=frame(c,'control',w,24,12,(target-24)/2,active?'action.primary':'bg.surface');control.cornerRadius=type==='Checkbox'?4:12;border(control,ink,2);
   if(type==='Switch'){const knob=frame(control,'thumb',16,16,active?24:4,4,'text.on-brand');knob.cornerRadius=8;}
   else if(active){const mark=frame(control,'selected',12,checked==='Indeterminate'?4:12,6,checked==='Indeterminate'?10:6,'text.on-brand');mark.cornerRadius=type==='Radio'?6:2;}
   txt(c,'Seçenek',type==='Switch'?72:52,(target-size*1.5)/2,230,size*1.5,size,disabled?'action.disabled-text':'text.primary');if(state==='Focus'){border(c,'focus.ring',2);c.cornerRadius=8;}
   items.push(c);
  }group(type,items);
 }
 for(const type of ['Input','Select','Textarea']){
  const items=[];for(const state of ['Default','Focus','Filled','Error','Disabled']){
   const boxH=type==='Textarea'?120:target+4,h=32+boxH+(state==='Error'?48:0),c=make(type,'State='+state,360,h);
   txt(c,'Alan etiketi',0,0,360,32,size);
   const box=frame(c,'field-box',360,boxH,0,32,state==='Disabled'?'action.disabled-bg':'bg.surface');box.cornerRadius=8;border(box,state==='Error'?'border.danger':state==='Focus'?'focus.ring':'border.default',state==='Focus'?2:1);
   txt(box,state==='Filled'?'Girilen değer':type==='Select'?'Bir seçenek seçin':'Bilgi girin',12,Math.max(8,(target-size*1.5)/2),336,size*1.5,size,state==='Disabled'?'action.disabled-text':'text.secondary');
   if(state==='Error')txt(c,'! Bu alanı kontrol edin.',0,36+boxH,360,40,size,'text.danger');items.push(c);
  }group(type,items);
 }
}
await Bun.write('/work/repo/measurements/state-library.json',JSON.stringify({groups,components:groups.reduce((s,g)=>s+g.variants,0)},null,2));
return {groups:groups.length,components:groups.reduce((s,g)=>s+g.variants,0)};
