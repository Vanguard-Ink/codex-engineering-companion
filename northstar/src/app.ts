import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import { createDb, createSession, digest } from './db';

export function createApp(options: { now?: () => Date; demo?: boolean; logger?: boolean } = {}) {
  const app=Fastify({logger:options.logger ?? false});
  const db=createDb();
  const now=options.now ?? (()=>new Date());
  app.register(cookie);
  app.addHook('onClose',async()=>db.close());
  app.get('/api/health',async()=>({status:'ok'}));
  // Local teaching fixtures only. Never enable this endpoint in a public deployment.
  if(options.demo) app.post<{Body:{email?:string}}>('/api/demo-session',async(req,reply)=>{
    const email=req.body?.email;
    if(email!=='alice@example.test' && email!=='bob@example.test') return reply.code(400).send({error:'Unknown demo user'});
    const user=db.prepare('SELECT id FROM users WHERE email=?').get(email) as {id:string};
    const token=createSession(db,user.id,now());
    reply.setCookie('session',token,{httpOnly:true,sameSite:'lax',path:'/',maxAge:3600});
    return {userId:user.id};
  });
  function userId(token:string|undefined) {
    if(!token) return null;
    const session=db.prepare('SELECT user_id FROM sessions WHERE token_hash=? AND expires_at>?').get(digest(token),now().toISOString()) as {user_id:string}|undefined;
    return session?.user_id ?? null;
  }
  app.get('/api/organizations',async(req,reply)=>{
    const id=userId(req.cookies.session);
    if(!id) return reply.code(401).send({error:'Sign in required'});
    return db.prepare('SELECT o.id,o.name FROM organizations o JOIN memberships m ON m.org_id=o.id WHERE m.user_id=? ORDER BY o.id').all(id);
  });
  app.get<{Params:{orgId:string}}>('/api/orgs/:orgId/tasks',async(req,reply)=>{
    const id=userId(req.cookies.session);
    if(!id) return reply.code(401).send({error:'Sign in required'});
    const org=req.params.orgId;
    if(!db.prepare('SELECT 1 FROM memberships WHERE user_id=? AND org_id=?').get(id,org)) return reply.code(403).send({error:'Organization access denied'});
    return db.prepare(`SELECT t.id,t.title,t.status,t.due_at,p.name AS project_name,p.archived
      FROM tasks t JOIN projects p ON p.id=t.project_id
      WHERE p.org_id=? ORDER BY t.id`).all(org);
  });
  return {app,db,now};
}
