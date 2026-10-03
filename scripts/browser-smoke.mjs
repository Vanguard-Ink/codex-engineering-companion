import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {dirname,resolve,join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const app=join(root,'experiments/candidate');
const runId=new Date().toISOString().replace(/[:.]/g,'-');
const out=join(root,'artifacts',`${runId}-browser`);mkdirSync(out,{recursive:true});
const children=[];const checks=[];let browser;
function service(name,args,env={}){
 const p=spawn(process.execPath,args,{cwd:app,env:{...process.env,...env},stdio:['ignore','pipe','pipe'],windowsHide:true});
 children.push(p);let log='';p.stdout.on('data',x=>log+=x);p.stderr.on('data',x=>log+=x);
 p.on('exit',()=>writeFileSync(join(out,`${name}.log`),log));return p;
}
async function ready(url){const deadline=Date.now()+45000;while(Date.now()<deadline){try{if((await fetch(url)).ok)return;}catch{}await new Promise(r=>setTimeout(r,200));}throw Error(`Service unavailable: ${url}`);}
async function check(name,fn){await fn();checks.push({name,pass:true});console.log(`PASS browser ${name}`);}
const screenshot=async(page,name)=>{await page.screenshot({path:join(out,`${name}.png`),fullPage:true});};
try{
 service('api',[join(app,'node_modules/tsx/dist/cli.mjs'),'src/server.ts'],{NORTHSTAR_DEMO:'1',NORTHSTAR_FIXED_CLOCK:'1',PORT:'4311'});
 await ready('http://127.0.0.1:4311/api/health');
 service('vite',[join(app,'node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port','4319','--strictPort']);
 await ready('http://127.0.0.1:4319');
 browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 const context=await browser.newContext({viewport:{width:1100,height:850}});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:4319');await screenshot(page,'01-login');
 await check('fixture login shows seven owned tasks',async()=>{
  await page.getByRole('button',{name:'Open Aster Studio'}).click();await page.locator('li').nth(6).waitFor();assert.equal(await page.locator('li').count(),7);
 });await screenshot(page,'02-unfiltered');
 let release;const blocked=new Promise(r=>release=r);
 await page.route('**/api/orgs/org-a/tasks?overdue=true',async route=>{await blocked;await route.continue();});
 await check('loading state during delayed filtered request',async()=>{
  await page.getByRole('checkbox',{name:'Overdue only'}).check();await page.getByRole('status').filter({hasText:'Loading tasks'}).waitFor();await screenshot(page,'03-loading');release();
 });
 await check('overdue toggle selects exact two tasks',async()=>{
  await page.getByText('Repair mobile menu',{exact:true}).waitFor();
  await page.waitForFunction(()=>document.querySelectorAll('li').length===2);
  assert.deepEqual(await page.locator('li strong').allTextContents(),['Review navigation','Repair mobile menu']);
 });await page.unroute('**/api/orgs/org-a/tasks?overdue=true');await screenshot(page,'04-overdue');
 await check('toggle reset restores unfiltered seven tasks',async()=>{await page.getByRole('checkbox').uncheck();await page.locator('li').nth(6).waitFor();assert.equal(await page.locator('li').count(),7);});
 await page.route('**/api/orgs/org-a/tasks?overdue=true',route=>route.fulfill({status:500,json:{error:'injected transport failure'}}));
 await check('injected HTTP error displayed without stale list',async()=>{await page.getByRole('checkbox').check();await page.getByRole('alert').waitFor();assert.equal(await page.getByRole('alert').textContent(),'Unable to load tasks');assert.equal(await page.locator('li').count(),0);});await screenshot(page,'05-error');
 await page.unroute('**/api/orgs/org-a/tasks?overdue=true');await page.getByRole('checkbox').uncheck();await page.locator('li').nth(6).waitFor();
 await page.route('**/api/orgs/org-a/tasks?overdue=true',route=>route.fulfill({status:200,json:[]}));
 await check('injected empty result displayed',async()=>{await page.getByRole('checkbox').check();await page.getByRole('status').filter({hasText:'No overdue tasks found.'}).waitFor();assert.equal(await page.locator('li').count(),0);});await screenshot(page,'06-empty');
 await check('reset recovers after empty and failed request',async()=>{await page.getByRole('checkbox').uncheck();await page.locator('li').nth(6).waitFor();assert.equal(await page.locator('li').count(),7);});
 const bob=await browser.newContext({viewport:{width:1100,height:850}});const bobPage=await bob.newPage();
 await check('Birch fixture login isolates organization',async()=>{await bobPage.goto('http://127.0.0.1:4319');await bobPage.getByRole('button',{name:'Open Birch Labs'}).click();await bobPage.getByText('Confidential review',{exact:true}).waitFor();assert.equal(await bobPage.locator('li').count(),1);assert.equal((await bobPage.request.get('http://127.0.0.1:4319/api/orgs/org-a/tasks?overdue=true')).status(),403);});
 await screenshot(bobPage,'07-birch');assert.deepEqual(errors,[]);checks.push({name:'no uncaught page errors',pass:true});
}catch(e){checks.push({name:'browser execution',pass:false,error:String(e)});console.error(e);process.exitCode=1;
}finally{
 const version=browser?browser.version():null;
 if(browser)await browser.close();for(const p of children)p.kill();
 const hashes=Object.fromEntries(['src/app.ts','src/main.tsx','src/db.ts'].map(p=>[p,createHash('sha256').update(readFileSync(join(app,p))).digest('hex')]));
 writeFileSync(join(out,'summary.json'),JSON.stringify({run_id:runId,status:checks.every(c=>c.pass)?'PASS':'FAIL',checks,environment:{node:process.version,platform:process.platform,browser:version},source_hashes:hashes,model_run:false,historical_run_proof:false,limits:['Current edition candidate browser smoke only; no proof of historical browser run.','HTTP error/empty/loading cases use explicit deterministic route injection.','Local fixture authentication; no production identity/deployment.']},null,2));
 console.log(`Evidence: ${relative(root,out)}/summary.json`);
}
