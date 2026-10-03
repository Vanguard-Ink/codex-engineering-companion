import {spawnSync} from 'node:child_process';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
if(!process.version.startsWith('v24.')) throw new Error('Use Node 24 for this edition; other runtimes are not tested.');
if(!process.env.npm_execpath) throw new Error('Run npm run setup so the npm CLI path is available.');
for(const pkg of ['.','northstar','experiments/candidate']) {
  const r=spawnSync(process.execPath,[process.env.npm_execpath,'ci','--no-audit','--no-fund'],{cwd:resolve(root,pkg),stdio:'inherit'});
  if(r.error) throw r.error;
  if(r.status!==0) process.exit(r.status??1);
}
