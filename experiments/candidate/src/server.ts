import {createApp} from './app';
import {FIXTURE_NOW} from './db';
const demo=process.env.NORTHSTAR_DEMO==='1';
const clock=demo && process.env.NORTHSTAR_FIXED_CLOCK==='1' ? ()=>new Date(FIXTURE_NOW) : undefined;
const {app}=createApp({demo,now:clock,logger:true});
const shutdown=async()=>{await app.close();process.exit(0);};
process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
await app.listen({port:Number(process.env.PORT ?? 4311),host:'127.0.0.1'});
