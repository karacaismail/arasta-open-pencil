import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('/opt/browser/package.json');const{chromium}=require('playwright');
const b=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--unsafely-treat-insecure-origin-as-secure=http://127.0.0.1:1420']});
const p=await b.newPage({viewport:{width:1600,height:1100}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.addInitScript(()=>{window.showOpenFilePicker=undefined;window.showSaveFilePicker=undefined;});
await p.goto('http://127.0.0.1:1420',{waitUntil:'networkidle',timeout:120000});
await p.waitForTimeout(4000);
const chooser=p.waitForEvent('filechooser',{timeout:10000});await p.keyboard.press('Control+o');
await(await chooser).setFiles('/work/arasta.fig');
await p.waitForTimeout(20000);
await p.getByText('01 · Mobil · dikey',{exact:true}).click();
await p.waitForTimeout(1000);
const target=p.getByText('Screen/mobil-dikey/320/ana-sayfa',{exact:true});if(await target.count()){await target.first().click();await p.keyboard.press('Shift+2');await p.waitForTimeout(1500);}
const body=await p.locator('body').innerText();
console.log(body.slice(0,15000));
await p.screenshot({path:'/work/qa/editor-loaded.png'});
fs.writeFileSync('/work/qa/editor-load.json',JSON.stringify({url:p.url(),body,errors,loaded:body.includes('Mobil')&&!body.includes('Could not open')},null,2));
await b.close();
