import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(dir,'../..');
const now=Date.parse('2026-09-06T12:00:00.000Z');
const rows=[
 {id:'active',status:'open',archived:false,due:'2026-09-05T12:00:00.000Z'},
 {id:'completed',status:'done',archived:false,due:'2026-09-05T12:00:00.000Z'},
 {id:'archived',status:'open',archived:true,due:'2026-09-05T12:00:00.000Z'},
 {id:'equal',status:'open',archived:false,due:'2026-09-06T12:00:00.000Z'},
 {id:'undated',status:'open',archived:false,due:null}
];
const past=r=>r.due!==null&&Date.parse(r.due)<now;
const unfinished=r=>past(r)&&r.status!=='done';
const full=r=>unfinished(r)&&!r.archived;
const selected=[past,unfinished,full].map(fn=>rows.filter(fn).map(r=>r.id));
assert.deepEqual(selected,[['active','completed','archived'],['active','archived'],['active']]);
const broken=[{condition:'package-manager',action:'npm'},{condition:'package-manager',action:'pnpm'},{condition:'checks-after-edit',action:'all'},{condition:'checks-after-edit',action:'none'}];
const repaired=[{condition:'package-manager',action:'npm'},{condition:'checks-after-edit',action:'focused'},{condition:'checks-before-handoff',action:'required-acceptance'}];
function conflicts(rules){const groups=new Map();for(const r of rules){if(!groups.has(r.condition))groups.set(r.condition,new Set());groups.get(r.condition).add(r.action);}return [...groups].filter(([,v])=>v.size>1).map(([k])=>k);}
assert.equal(conflicts(broken).length,2);assert.equal(conflicts(repaired).length,0);
const files=['README.md','package.json','src/app.ts','src/db.ts','src/main.tsx','test/baseline.test.ts'];
const provenance=files.map(f=>{const p=path.join(root,'northstar',f);return {path:path.relative(root,p),sha256:crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')};});
const report={kind:'deterministic authored teaching fixtures; no new model experiment',node:process.version,selected,brokenConflicts:conflicts(broken),repairedConflicts:conflicts(repaired),provenance};
fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});
fs.writeFileSync(path.join(root,'artifacts','ch04-06-results.json'),JSON.stringify(report,null,2));

console.log(JSON.stringify(report,null,2));
