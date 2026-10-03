import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {writeFileSync} from 'node:fs';
// Evaluator lives outside the candidate checkout and is frozen before the run.
const root=resolve(process.argv[2]);
const {createApp}=await import(pathToFileURL(resolve(root,'src/app.ts')).href);
const {createSession,FIXTURE_NOW}=await import(pathToFileURL(resolve(root,'src/db.ts')).href);
const result:any[]=[];
async function check(name:string,fn:()=>Promise<boolean>){try{result.push({name,pass:await fn()});}catch(e){result.push({name,pass:false,error:String(e)});}}
const {app,db}=createApp({now:()=>new Date(FIXTURE_NOW)});
const token=createSession(db,'alice',new Date(FIXTURE_NOW));
const req=(url:string,cookies={session:token})=>app.inject({url,cookies});
await check('overdue selection excludes completed, null, equal, future and archived',async()=>{const r=await req('/api/orgs/org-a/tasks?overdue=true');return r.statusCode===200&&JSON.stringify(r.json().map((x:any)=>x.id).sort())===JSON.stringify(['t-overdue','t-progress']);});
await check('unfiltered list preserves all seven own tasks',async()=>{const r=await req('/api/orgs/org-a/tasks');return r.statusCode===200&&r.json().length===7;});
await check('false preserves unfiltered behavior',async()=>{const r=await req('/api/orgs/org-a/tasks?overdue=false');return r.statusCode===200&&r.json().length===7;});
await check('invalid boolean rejected',async()=>(await req('/api/orgs/org-a/tasks?overdue=maybe')).statusCode===400);
await check('unauthenticated filtered request rejected',async()=>(await app.inject('/api/orgs/org-a/tasks?overdue=true')).statusCode===401);
await check('other organization filtered access denied',async()=>(await req('/api/orgs/org-b/tasks?overdue=true')).statusCode===403);
await check('expired session rejected',async()=>{const old=createSession(db,'alice',new Date('2026-09-05T00:00:00.000Z'));return (await req('/api/orgs/org-a/tasks?overdue=true',{session:old})).statusCode===401;});
await check('SQL injection does not bypass membership',async()=>(await req('/api/orgs/'+encodeURIComponent("org-a' OR 1=1 --")+'/tasks?overdue=true')).statusCode===403);
await app.close();
const report={evaluatedAt:new Date().toISOString(),candidate:root,total:result.length,passed:result.filter(x=>x.pass).length,checks:result};
console.log(JSON.stringify(report,null,2));
if(process.argv[3])writeFileSync(process.argv[3],JSON.stringify(report,null,2));
process.exitCode=report.passed===report.total?0:1;
