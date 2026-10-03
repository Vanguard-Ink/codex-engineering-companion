import {spawnSync} from 'node:child_process';
import {dirname,resolve,relative,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {mkdirSync,readFileSync,writeFileSync,existsSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
if(!process.version.startsWith('v24.')) throw new Error('Node 24 is required for the edition workflow.');
const mode=process.argv[2]??'all';
const allowed=['all','ch03','ch04','ch12','labs','evidence'];
if(!allowed.includes(mode)) throw new Error(`Unknown workflow: ${mode}`);
const runId=new Date().toISOString().replace(/[:.]/g,'-');
const output=join(root,'artifacts',`${runId}-${mode}`); mkdirSync(output,{recursive:true});
const checks=[];
const digest=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
function tree(dir){return Object.fromEntries(readdirSync(dir,{withFileTypes:true}).flatMap(x=>{
  if(['node_modules','dist','.git','artifacts'].includes(x.name))return [];
  const p=join(dir,x.name);return x.isDirectory()?Object.entries(tree(p)):[[relative(root,p).replaceAll('\\','/'),digest(p)]];
}));}
const baselineBefore=tree(join(root,'northstar'));
function command(name,exe,args,cwd=root,validate=null){
  const r=spawnSync(exe,args,{cwd,encoding:'utf8',maxBuffer:16*1024*1024,timeout:180000});
  const text=(r.stdout??'')+(r.stderr??'');writeFileSync(join(output,`${name}.log`),text);
  const verdict=validate?validate(r,text):r.status===0&&!r.error;
  checks.push({name,pass:!!verdict,exit_code:r.status,error:r.error?String(r.error):null,executable:exe,args,working_directory:relative(root,cwd),log:`${name}.log`});
  console.log(`${verdict?'PASS':'FAIL'} ${name} (exit ${r.status})`);
  return r;
}
function appChecks(folder,label){
  const dir=join(root,folder);
  for(const [name,script,args] of [
    ['typecheck','typescript/bin/tsc',['--noEmit']],
    ['test','vitest/vitest.mjs',['run']],
    ['build','vite/bin/vite.js',['build']],
  ]) command(`${label}-${name}`,process.execPath,[join(dir,'node_modules',script),...args],dir);
}
function evalTarget(folder,label,expectedFailure=false){
  const report=join(output,`${label}.json`);
  return command(label,process.execPath,[join(root,'experiments/candidate/node_modules/tsx/dist/cli.mjs'),join(root,'verification/acceptance.ts'),join(root,folder),report],root,(r)=>{
    if(r.error||!existsSync(report))return false;
    const data=JSON.parse(readFileSync(report,'utf8'));
    const infrastructureFree=data.total===8&&data.checks.every(c=>!c.error);
    return infrastructureFree&&(expectedFailure?
      r.status===1&&data.passed===6&&data.checks.filter(c=>!c.pass).map(c=>c.name).join('|')==='overdue selection excludes completed, null, equal, future and archived|invalid boolean rejected':
      r.status===0&&data.passed===8);
  });
}
if(mode==='all'||mode==='ch03'){
  appChecks('northstar','baseline'); appChecks('experiments/candidate','candidate');
  evalTarget('northstar','EXPECTED_BASELINE_FAIL',true);evalTarget('experiments/candidate','candidate-evaluator');
  command('http-browser-contract',process.execPath,[join(root,'experiments/candidate/node_modules/tsx/dist/cli.mjs'),join(root,'verification/ui-contract.ts')]);
}
if(mode==='all'||mode==='ch04'){
  command('instruction-context-fixtures',process.execPath,[join(root,'labs/ch04-06/labs.mjs')]);
  command('fail-repair-checkpoint',process.execPath,[join(root,'workflows/fail-repair.mjs')]);
}
if(mode==='all'||mode==='ch12') evalTarget('experiments/candidate','ch12-external-evaluator');
if(mode==='all'||mode==='labs'){
  command('case-study-labs',process.execPath,[join(root,'labs/ch13-15/run-labs.ts')]);
  command('economics',process.env.PYTHON??(process.platform==='win32'?'python.exe':'python3'),[join(root,'labs/ch10-12/economics/illustrative_economics.py')]);
  command('predicate-example',process.execPath,[join(root,'examples/overdue-predicate.mjs')]);
}
if(mode==='all'||mode==='evidence') {
  command('historical-provenance',process.execPath,[join(root,'scripts/check-provenance.mjs')]);
  command('edition-manifest',process.execPath,[join(root,'scripts/check-manifest.mjs')]);
}
const baselineAfter=tree(join(root,'northstar'));
checks.push({name:'preserved-baseline',pass:JSON.stringify(baselineBefore)===JSON.stringify(baselineAfter)});
const summary={run_id:runId,mode,status:checks.every(x=>x.pass)?'PASS':'FAIL',environment:{node:process.version,platform:process.platform,arch:process.arch,sqlite:process.versions.sqlite},model_run:false,external_service:false,checks,baseline_before:baselineBefore,baseline_after:baselineAfter,limits:['Local deterministic correctness replay; no production or account-dependent run.','HTTP/browser contract check does not prove rendered visual quality.','Other operating systems are untested unless a separate retained CI run establishes support.']};
writeFileSync(join(output,'summary.json'),JSON.stringify(summary,null,2));
console.log(`Evidence: ${relative(root,output)}/summary.json`);
if(summary.status!=='PASS')process.exitCode=1;
