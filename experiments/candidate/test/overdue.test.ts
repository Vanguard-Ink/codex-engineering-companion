import {afterEach,expect,test} from 'vitest';
import {createApp} from '../src/app';
import {createSession,FIXTURE_NOW} from '../src/db';

const apps:ReturnType<typeof createApp>[]=[];
function fixture(clock=FIXTURE_NOW){
  const x=createApp({now:()=>new Date(clock)});
  apps.push(x);
  const token=createSession(x.db,'alice',new Date(clock));
  return {...x,cookies:{session:token}};
}
afterEach(async()=>{await Promise.all(apps.splice(0).map(x=>x.app.close()));});

test('overdue includes only past, unfinished tasks in active projects in the requested organization',async()=>{
  const {app,cookies}=fixture();
  const r=await app.inject({url:'/api/orgs/org-a/tasks?overdue=true',cookies});
  expect(r.statusCode).toBe(200);
  expect(r.json()).toEqual([
    {id:'t-overdue',title:'Review navigation',status:'open',due_at:'2026-09-05T12:00:00.000Z',project_name:'Website refresh',archived:0},
    {id:'t-progress',title:'Repair mobile menu',status:'in_progress',due_at:'2026-09-06T11:59:59.999Z',project_name:'Website refresh',archived:0}
  ]);
});

test('omitted and false filters preserve the original full list and order',async()=>{
  const {app,cookies}=fixture();
  const full=await app.inject({url:'/api/orgs/org-a/tasks',cookies});
  const disabled=await app.inject({url:'/api/orgs/org-a/tasks?overdue=false',cookies});
  expect(full.statusCode).toBe(200);
  expect(disabled.statusCode).toBe(200);
  expect(disabled.json()).toEqual(full.json());
  expect(full.json().map((t:{id:string})=>t.id)).toEqual([
    't-archived','t-done','t-equal','t-future','t-null','t-overdue','t-progress'
  ]);
});

test('the exact deadline becomes overdue only after the server clock passes it',async()=>{
  const {app,cookies}=fixture('2026-09-06T12:00:00.001Z');
  const r=await app.inject({url:'/api/orgs/org-a/tasks?overdue=true',cookies});
  expect(r.statusCode).toBe(200);
  expect(r.json().map((t:{id:string})=>t.id)).toEqual(['t-equal','t-overdue','t-progress']);
});

test('no qualifying tasks returns an empty array',async()=>{
  const {app,db,cookies}=fixture();
  db.prepare("UPDATE tasks SET status='done' WHERE project_id='p-a'").run();
  const r=await app.inject({url:'/api/orgs/org-a/tasks?overdue=true',cookies});
  expect(r.statusCode).toBe(200);
  expect(r.json()).toEqual([]);
});

test.each(['','1','0','TRUE','False','null','yes','true%20','true&overdue=false','true&overdue=true'])(
  'invalid overdue query %j returns 400',async value=>{
    const {app,cookies}=fixture();
    const r=await app.inject({url:`/api/orgs/org-a/tasks?overdue=${value}`,cookies});
    expect(r.statusCode).toBe(400);
    expect(r.json()).toEqual({error:'overdue must be true or false'});
  }
);

test.each([undefined,'invalid-session'])('overdue requires a valid session (%s)',async session=>{
  const {app}=fixture();
  const r=await app.inject({url:'/api/orgs/org-a/tasks?overdue=true',cookies:session?{session}:{}});
  expect(r.statusCode).toBe(401);
});

test('overdue rejects expired sessions',async()=>{
  const {app,db}=fixture();
  const token=createSession(db,'alice',new Date('2026-09-06T11:00:00.000Z'));
  expect((await app.inject({url:'/api/orgs/org-a/tasks?overdue=true',cookies:{session:token}})).statusCode).toBe(401);
});

test('overdue cannot access another organization or a nonexistent organization',async()=>{
  const {app,cookies}=fixture();
  for(const org of ['org-b','missing']){
    const r=await app.inject({url:`/api/orgs/${org}/tasks?overdue=true`,cookies});
    expect(r.statusCode).toBe(403);
    expect(r.json()).toEqual({error:'Organization access denied'});
  }
});

test('Bob sees only overdue tasks in his own organization',async()=>{
  const {app,db}=fixture();
  const token=createSession(db,'bob',new Date(FIXTURE_NOW));
  const cookies={session:token};
  const r=await app.inject({url:'/api/orgs/org-b/tasks?overdue=true',cookies});
  expect(r.statusCode).toBe(200);
  expect(r.json().map((t:{id:string})=>t.id)).toEqual(['t-other']);
  expect((await app.inject({url:'/api/orgs/org-a/tasks?overdue=true',cookies})).statusCode).toBe(403);
});
