"""Static, semantic HTML export of the native OpenPencil document. No HTML is imported."""
import json,copy,re,html,hashlib,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]; WEB=ROOT/'web';DOC=json.loads((ROOT/'design/projection.json').read_text());CAT=json.loads((WEB/'catalog.json').read_text());BY={};USED={}; CSS={}
def walk(n):
 if 'id'in n:BY[n['id']]=n
 for c in n.get('children',[]):walk(c)
for p in DOC['pages']:walk(p)
def resolve(n,seen=()):
 if n.get('type')=='ref':
  ref=n['ref']
  if ref in seen:raise ValueError('cycle')
  master=BY[ref];d={**master,**{k:v for k,v in n.items() if k not in ['ref','type','children','descendants'] and v is not None}};d['type']=master['type'];d['component']=master.get('name');d['children']=master.get('children',[])
  return resolve(d,(*seen,ref))
 d=dict(n);d['children']=[resolve(c,seen) for c in n.get('children',[])];return d
E=lambda s:html.escape(str(s),quote=True)
def color(c):return 'var(--'+c[1:].replace('.','-')+')' if isinstance(c,str) and c.startswith('$') else str(c)
def num(v):return str(round(v,2)).rstrip('0').rstrip('.') if isinstance(v,float) else str(v)
def px(v):return num(v)+'px'
def fill(fs):
 if not fs:return ''
 f=fs[0]
 if isinstance(f,str):return color(f)
 if f.get('type')=='solid':return color(f['color'])
 stops=f.get('stops',[])
 if stops:return 'linear-gradient('+str(f.get('angle',135))+'deg,'+','.join(color(a['color'])+' '+num(a['offset']*100)+'%' for a in stops)+')'
 return ''
def cssclass(s):
 c='s'+hashlib.sha1(s.encode()).hexdigest()[:10];CSS[c]=s;return c
def styles(n):
 s=[]
 def put(k,v):s.append(k+':'+str(v))
 if n['type']=='text':
  put('font-family',"'"+n.get('fontFamily','Roboto')+"',sans-serif");put('font-size',px(n.get('fontSize',16)));put('font-weight',n.get('fontWeight',400));put('line-height',n.get('lineHeight',1.5));put('color',fill(n.get('fill')) or 'inherit')
  if n.get('textAlign'):put('text-align',n['textAlign'])
 else:
  if bg:=fill(n.get('fill')):put('background',bg)
  if 'gap'in n:put('gap',px(n['gap']))
  if 'padding'in n:
   p=n['padding'];put('padding',' '.join(px(x) for x in p) if isinstance(p,list) else px(p))
  if 'cornerRadius'in n:put('border-radius',px(n['cornerRadius']))
  if 'stroke'in n:
   st=n['stroke'];th=st.get('thickness',1);ink=fill(st.get('fill'))
   if ink:
    if isinstance(th,dict):
     for edge,t in th.items():put('border-'+edge,px(t)+' solid '+ink)
    else:put('border',px(th)+' solid '+ink)
  if 'alignItems'in n:put('align-items',{'start':'flex-start','end':'flex-end'}.get(n['alignItems'],n['alignItems']))
  if 'justifyContent'in n:put('justify-content',n['justifyContent'].replace('_','-'))
  if isinstance(n.get('height'),(int,float)) and not n.get('name','').startswith(('main','Screen/')):put('min-height',px(n['height']))
  if isinstance(n.get('width'),(int,float)) and not n.get('name','').startswith(('Screen/','device-content')):put('width',px(n['width']));put('max-width','100%')
 return cssclass(';'.join(s))
COUNT=0;CONTEXT={}
def textcontent(n):return str(n.get('content','')) or ' '.join(textcontent(c) for c in n.get('children',[]))
def render(n):
 global COUNT
 COUNT+=1;name=n.get('name','');typ=n.get('type');children=n.get('children',[]);tag='div';attrs=[];extra='';component=n.get('component','');classes=['n',styles(n)]
 classes.append('horizontal' if n.get('layout')=='horizontal' else 'vertical')
 if n.get('width')=='fill_container':classes.append('fill')
 elif n.get('width')=='fit_content':classes.append('hug')
 classes.append(re.sub(r'[^a-zA-Z0-9_-]','-',name.split(':')[0].split('/')[0]))
 if name.startswith('icon:') or component.startswith('Icon/'):
  paths=[p for p in children if p.get('type')=='path'];key=hashlib.sha1(json.dumps(paths,sort_keys=True).encode()).hexdigest()[:12];USED[key]=paths
  size=n.get('width',24)
  return f'<svg class="icon" aria-hidden="true" width="{size}" height="{size}" style="background:{fill(n.get("fill")) or "transparent"}" viewBox="0 0 256 256"><use href="../../assets/icons.svg#i{key}"></use></svg>'
 if typ=='text':
  tag=name if name in ['h1','h2','h3'] else 'span'
  if name in ['status','alert']:attrs.append('role="'+name+'"')
  if name in ['subtotal','landed-result']:attrs.append('data-output="'+name+'"')
  extra=E(n.get('content','')).replace('\n','<br>');children=[]
 elif name.startswith('Screen/'):
  classes.append('device');attrs+=['id="device"']
 elif name=='device-content':classes.append('device-body')
 elif name.startswith('main'):
  tag='main';attrs+=['id="main"','tabindex="-1"'];classes.append('main')
 elif name=='header':tag='header';classes.append('app-header')
 elif name=='footer':tag='footer'
 elif name.startswith('nav:'):tag='nav';attrs.append('aria-label="'+E(name[4:])+'"')
 elif name.startswith(('link:','action:')):
  mode,target,label=name.split(':',2);tag='a' if mode=='link' else 'button';classes.append('control')
  attrs.append('aria-label="'+E(label)+'"')
  if mode=='link':attrs+=['href="'+E(target)+'.html"','data-route="'+E(target)+'"']
  else:attrs+=['type="button"','data-action="'+E(target)+'"']
 elif name.startswith('field:'):
  _,kind,label=name.split(':',2);id='f'+str(COUNT);box=children[-1] if children else {};value=textcontent(box).strip();value='' if value in [label,'Ürün veya üretici'] else value
  tag='label';attrs+=['for="'+id+'"'];classes.append('field');children=[]
  common=f'id="{id}" name="{E(label)}" aria-label="{E(label)}" data-field="{E(label)}"'
  fieldstyle=styles(box) if box else ''
  inputtype=kind if kind in ['text','email','password','number','search','file'] else 'text'
  if kind=='textarea':control=f'<textarea {common} class="input {fieldstyle}" rows="3">{E(value)}</textarea>'
  elif kind=='select':
   opts=([value] if value else [])+(['İstanbul','Denizli','Konya','İzmir'] if 'şehir' in label.lower() else ['14 gün','21 gün','30 gün','60 gün'])
   control=f'<select {common} class="input {fieldstyle}">'+''.join('<option>'+E(o)+'</option>' for o in dict.fromkeys(opts))+'</select>'
  else:
   ac={'email':'email','password':'current-password','search':'off','number':'off'}.get(kind,'on')
   control=f'<input {common} class="input {fieldstyle}" type="{inputtype}" autocomplete="{ac}"'+(' value="'+E(value)+'"' if kind!='file' else '')+(' min="1" step="1" inputmode="numeric"' if kind=='number' else '')+(' placeholder="Ürün veya üretici"' if kind=='search' else '')+'>'
   if kind=='password':control+='<button type="button" data-action="password" class="plain">Parolayı göster</button>'
  extra=('<span class="field-label">'+E(label)+'</span>' if len(n.get('children',[]))>1 else '')+control
 elif name.startswith('check:'):
  tag='label';children=[];extra='<input type="checkbox" data-check="'+E(name[6:])+'"> <span>'+E(name[6:])+'</span>';classes.append('check-control')
 elif name.startswith('radio:'):
  _,group,label=name.split(':',2);tag='label';children=[];extra=f'<input type="radio" name="{E(group)}" value="{E(label)}"> <span>{E(label)}</span>';classes.append('check-control')
 elif name.startswith('details:'):
  tag='details';extra='<summary>'+E(name[8:])+'</summary>';children=children[1:]
 elif name.startswith('table:'):
  tag='table';attrs+=['aria-label="'+E(name[6:])+'"'];classes=['data-table',styles(n)]
  head=children[0];body=children[1:]
  extra='<thead><tr>'+''.join('<th scope="col">'+E(textcontent(c))+'</th>' for c in head['children'])+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+E(textcontent(c))+'</td>' for c in r['children'])+'</tr>' for r in body)+'</tbody>';children=[]
 elif name.startswith('progress:'):
  val=name[9:];attrs+=['role="progressbar"','aria-valuenow="'+val+'"','aria-valuemin="0"','aria-valuemax="100"','aria-label="Kontenjan"'];extra=f'<span style="width:{val}%;height:8px;background:var(--action-primary);border-radius:4px"></span>'
 elif name=='chat-log':attrs+=['role="log"','aria-label="Görüşme"','aria-live="polite"']
 elif name.startswith('product:'):attrs.append('data-product="'+name[8:]+'"')
 elif name.startswith('bar:'):children=[];classes.append('chart-bar');attrs+=['aria-hidden="true"'];extra='<span style="width:'+str(float(name[4:])/142*100)+'%"></span>'
 if name=='grid-row':
  classes.append('grid-row');attrs.append('style="--cols:'+str(len(children))+'"')
 attrs.append('class="'+' '.join(classes)+'"')
 attrs.append('data-node="'+E(n.get('id',''))+'"')
 return '<'+tag+' '+' '.join(attrs)+'>'+extra+''.join(render(c) for c in children)+'</'+tag+'>'

def shell(title,body,prefix='',extra=''):
 return '<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><title>'+E(title)+' · arasta</title><link rel="stylesheet" href="'+prefix+'assets/app.css?v=HASH">'+extra+'</head>'+body+'</html>'
# Native state is the sole visual source of screen markup.
for m in CAT['screens']:
 CONTEXT=m;COUNT=0;n=resolve(BY[m['id']]);body=render(n);dest=WEB/m['cluster']/m['screen'];dest.mkdir(parents=True,exist_ok=True)
 config={k:m[k] for k in ['cluster','screen','family','width','height','page','title']}
 bar='<div class="devicebar"><a href="../../index.html#'+m['cluster']+'/'+m['screen']+'/'+m['page']+'">Tüm ekranlar</a><label>Cihaz <select id="device-choice" aria-label="Cihaz"></select></label><label>Sayfa <select id="page-choice" aria-label="Sayfa"></select></label><button data-action="fit">Sığdır</button><button data-action="theme">Tema</button></div>'
 htmlbody='<body data-fam="'+m['family']+'" data-theme="'+('dark' if m['family']=='tv' else 'light')+'"><a class="skip" href="#main">İçeriğe geç</a>'+bar+body+'<div id="toast" role="status" aria-live="polite"></div><div id="compare-tray" hidden></div><dialog id="dialog" aria-label="İşlem penceresi"></dialog><script id="config" type="application/json">'+json.dumps(config,ensure_ascii=False)+'</script><script src="../../assets/app.js?v=HASH" defer></script></body>'
 (dest/(m['page']+'.html')).write_text(shell(m['title'],htmlbody,'../../'))
for cl,label,fam,dims in CAT['clusters']:
 links=[]
 for w,h in dims:
  sid='4k' if cl=='tv' else str(w);p=WEB/cl/sid
  p.mkdir(parents=True,exist_ok=True)
  (p/'index.html').write_text(shell(label+' '+sid,'<body class="directory"><h1>'+E(label)+' '+sid+'</h1><nav>'+''.join('<a href="'+slug+'.html">'+E(title)+'</a>' for slug,title in CAT['pages'])+'</nav><a href="../../index.html#'+cl+'/'+sid+'/ana-sayfa">İzleyiciyi aç</a></body>','../../'))
  links.append('<a href="'+sid+'/index.html">'+str(w)+' × '+str(h)+'</a>')
 (WEB/cl/'index.html').write_text(shell(label,'<body class="directory"><h1>'+E(label)+'</h1><nav>'+''.join(links)+'</nav><a href="../index.html">İzleyici</a></body>','../'))
# One external vector sprite; source paths came from the official Phosphor package.
svg='<svg xmlns="http://www.w3.org/2000/svg">'
for key,paths in USED.items():
 svg+='<symbol id="i'+key+'" viewBox="0 0 256 256">'+''.join('<path d="'+E(p.get('d',''))+'" opacity="'+str(p.get('opacity',1))+'" fill="'+E(fill(p.get('fill')) or 'currentColor')+'"/>' for p in paths)+'</symbol>'
(WEB/'assets/icons.svg').write_text(svg+'</svg>')
fonts=''
for family,filename in [('Roboto','Roboto'),('Roboto Mono','RobotoMono')]:
 for weight in [400,500,600,700]:
  for subset,range_ in [('latin-ext','U+0100-02FF,U+1E00-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF'),('latin','U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD')]:fonts+="@font-face{font-family:'"+family+"';font-style:normal;font-weight:"+str(weight)+";font-display:swap;src:url('"+filename+'-'+subset+'-'+str(weight)+".woff2') format('woff2');unicode-range:"+range_+'}'
# Actual design_to_tokens CSS is the token source. Adapt native class selectors
# and collection-prefixed names to the site's documented data attributes.
idx=json.loads((ROOT/'measurements/native-index.json').read_text())
def slug(v):return re.sub(r'[^a-zA-Z0-9-]','',v.replace('/','-').replace(' ','-')).lower()
collections={c['id']:c for c in idx['collections']}
tokens=(ROOT/'design/exports/tokens.css').read_text()
for family in CAT['families']:
 tokens=tokens.replace('.'+family.lower()+' {','[data-fam="'+family+'"] {')
tokens=tokens.replace('.dark {','[data-theme="dark"] {')
# Declare aliases on each scope so child overrides are resolved locally.
aliases=''.join('--'+v['name'].replace('.','-')+':var(--'+slug(collections[v['collectionId']]['name'])+'-'+slug(v['name'])+');' for v in idx['variables'])
tokens+='\n:root,[data-fam],[data-theme]{'+aliases+'}\n'
(WEB/'assets/tokens.css').write_text(tokens)
(WEB/'assets/generated.css').write_text(fonts+tokens+'\n'+'\n'.join('.'+k+'{'+v+'}' for k,v in CSS.items()))
(WEB/'assets/app.css').write_text((WEB/'assets/generated.css').read_text()+'\n'+(WEB/'assets/base.css').read_text())
hash_=hashlib.sha256(((WEB/'assets/app.css').read_bytes()+(WEB/'assets/app.js').read_bytes())).hexdigest()[:12]
for p in WEB.rglob('*.html'):p.write_text(re.sub(r'\?v=(?:HASH|[a-f0-9]+)', '?v='+hash_, p.read_text()))
print('exported',len(CAT['screens']),'screens',len(CSS),'styles',len(USED),'icon symbols',hash_)
(ROOT/'measurements/export.json').write_text(json.dumps({'source':'design/projection.json','screens':len(CAT['screens']),'uniqueStyles':len(CSS),'symbols':len(USED),'assetHash':hash_},indent=2))
