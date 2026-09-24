import {createRequire} from 'module';import fs from 'fs';const require=createRequire('/opt/browser/package.json');const {chromium}=require('playwright');
const base='http://127.0.0.1:8000/',out='/work/qa';fs.mkdirSync(out,{recursive:true});
const catalog=await (await fetch(base+'catalog.json')).json();const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});let results=[];
const selected=process.argv.includes('--sample')?catalog.screens.filter(m=>m.page==='ana-sayfa'&&['320','390','844','768','1440','2560','4k'].includes(m.screen)):catalog.screens;
for(const m of selected){
 const started=performance.now(),timestamp=new Date().toISOString();
 const context=await browser.newContext({viewport:{width:m.width,height:m.height},deviceScaleFactor:1});const page=await context.newPage();let errors=[];page.on('pageerror',e=>errors.push(e.message));
 const url=base+m.cluster+'/'+m.screen+'/'+m.page+'.html?embed=1';const res=await page.goto(url,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
 const audit=await page.evaluate(()=>{
  const els=[...document.querySelectorAll('#device *')],vis=e=>{const c=getComputedStyle(e);return c.display!=='none'&&c.visibility!=='hidden'&&e.getClientRects().length>0},data=e=>({tag:e.tagName,name:e.getAttribute('data-node')||e.className,text:e.textContent?.slice(0,90),width:Math.round(e.getBoundingClientRect().width),scroll:e.scrollWidth,client:e.clientWidth});
  const text=els.filter(e=>vis(e)&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())),small=text.filter(e=>parseFloat(getComputedStyle(e).fontSize)<15.99);
  const radius=els.filter(e=>vis(e)&&['borderTopLeftRadius','borderTopRightRadius','borderBottomLeftRadius','borderBottomRightRadius'].some(x=>parseFloat(getComputedStyle(e)[x])>12.01));
  const unlabeled=els.filter(e=>e.matches('input,select,textarea')&&!e.getAttribute('aria-label')&&!e.labels?.length);
  const overflow=els.filter(e=>vis(e)&&e.clientWidth>0&&e.scrollWidth>e.clientWidth+2&&!e.matches('input,textarea,select,svg,use,path')&&getComputedStyle(e).overflowX!=='auto'&&getComputedStyle(e).overflowX!=='scroll');
  const badTargets=els.filter(e=>vis(e)&&e.matches('a,button,input,select,textarea,summary')&&(e.getBoundingClientRect().width<23.9||e.getBoundingClientRect().height<23.9));
  return{h1:document.querySelectorAll('h1').length,documentOverflow:document.documentElement.scrollWidth>innerWidth+1,overflow:overflow.map(data).slice(0,18),small:small.map(data),radius:radius.map(data),unlabeled:unlabeled.map(data),badTargets:badTargets.map(data),links:[...new Set([...document.querySelectorAll('a[href]')].map(e=>e.getAttribute('href')))]};
 });
 const r={durationMs:performance.now()-started,timestamp,cluster:m.cluster,screen:m.screen,page:m.page,status:res.status(),errors,...audit};results.push(r);
 if(!process.argv.includes("--sample"))fs.appendFileSync(out+"/browser-calls.jsonl",JSON.stringify({timestamp,tool:"playwright.page.audit",operation:m.cluster+"/"+m.screen+"/"+m.page,durationMs:r.durationMs,success:r.status===200&&!r.errors.length&&!r.documentOverflow&&!r.overflow.length&&!r.small.length&&!r.radius.length&&!r.unlabeled.length&&!r.badTargets.length&&r.h1===1,error:r.errors.length?r.errors.join("; "):null,bodyBytes:Buffer.byteLength(url)})+"\n");
 if(process.argv.includes('--sample'))await page.screenshot({path:out+'/'+m.cluster+'-'+m.screen+'.png'});
 await context.close();if(results.length%22===0||process.argv.includes('--sample'))console.log(results.length,m.cluster,m.screen,m.page,'overflow',audit.overflow.length);
 fs.writeFileSync(out+'/results'+(process.argv.includes('--sample')?'-sample':'')+'.json',JSON.stringify(results,null,2));
}
await browser.close();console.log('done',results.length,'failures',results.filter(r=>r.status!==200||r.errors.length||r.h1!==1||r.documentOverflow||r.overflow.length||r.small.length||r.radius.length||r.unlabeled.length||r.badTargets.length).length);
