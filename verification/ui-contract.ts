import assert from 'node:assert/strict';
import {createApp} from '../experiments/candidate/src/app.ts';
import {FIXTURE_NOW} from '../experiments/candidate/src/db.ts';
import {readFileSync} from 'node:fs';
// Transport contract only. Real browser layout/interaction remains a separate review.
const {app}=createApp({demo:true,now:()=>new Date(FIXTURE_NOW)});
const login=await app.inject({method:'POST',url:'/api/demo-session',payload:{email:'alice@example.test'}});
assert.equal(login.statusCode,200);
const cookies={session:login.cookies[0].value};
assert.equal((await app.inject({url:'/api/orgs/org-a/tasks',cookies})).json().length,7);
assert.deepEqual((await app.inject({url:'/api/orgs/org-a/tasks?overdue=true',cookies})).json().map((r:any)=>r.id).sort(),['t-overdue','t-progress']);
assert.equal((await app.inject({url:'/api/orgs/org-b/tasks?overdue=true',cookies})).statusCode,403);
assert.equal((await app.inject({method:'POST',url:'/api/demo-session',payload:{email:'stranger@example.test'}})).statusCode,400);
const source=readFileSync(new URL('../experiments/candidate/src/main.tsx',import.meta.url),'utf8');
assert.match(source,/Overdue only/);
await app.close();console.log('PASS demo-session HTTP transport contract and overdue UI label presence; rendered browser QA separate');
