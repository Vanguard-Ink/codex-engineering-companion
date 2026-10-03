import {test,expect,afterEach} from 'vitest';
import {createApp} from '../src/app';
import {createSession,FIXTURE_NOW} from '../src/db';
const apps:ReturnType<typeof createApp>[]=[];
function fixture(){const x=createApp({now:()=>new Date(FIXTURE_NOW)});apps.push(x);return x;}
afterEach(async()=>{await Promise.all(apps.splice(0).map(x=>x.app.close()));});
test('health is public',async()=>{const {app}=fixture();expect((await app.inject('/api/health')).statusCode).toBe(200);});
test('list requires a session',async()=>{const {app}=fixture();expect((await app.inject('/api/orgs/org-a/tasks')).statusCode).toBe(401);});
test('Alice sees seven tasks in her own organization',async()=>{const {app,db}=fixture();const token=createSession(db,'alice',new Date(FIXTURE_NOW));const r=await app.inject({url:'/api/orgs/org-a/tasks',cookies:{session:token}});expect(r.statusCode).toBe(200);expect(r.json()).toHaveLength(7);});
test('organization membership is enforced',async()=>{const {app,db}=fixture();const token=createSession(db,'alice',new Date(FIXTURE_NOW));expect((await app.inject({url:'/api/orgs/org-b/tasks',cookies:{session:token}})).statusCode).toBe(403);});
test('demo login is disabled by default',async()=>{const {app}=fixture();expect((await app.inject({method:'POST',url:'/api/demo-session',payload:{email:'alice@example.test'}})).statusCode).toBe(404);});
