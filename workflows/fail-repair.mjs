import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const dir=resolve(root,'artifacts/fail-repair');mkdirSync(dir,{recursive:true});
const now='2026-09-06T12:00:00.000Z';
const fixtures=[
 {id:'active',status:'open',archived:false,due:'2026-09-05T12:00:00.000Z'},
 {id:'done',status:'done',archived:false,due:'2026-09-05T12:00:00.000Z'},
 {id:'archived',status:'open',archived:true,due:'2026-09-05T12:00:00.000Z'},
 {id:'equal',status:'open',archived:false,due:now},
 {id:'undated',status:'open',archived:false,due:null}
];
const checkpoint={kind:'authored deterministic checkpoint; not a Codex run',now,fixtures};
writeFileSync(resolve(dir,'checkpoint.json'),JSON.stringify(checkpoint,null,2));
const broken=r=>r.due!==null&&r.due<now;
const expected=['active'];const failed=fixtures.filter(broken).map(r=>r.id);
assert.notDeepEqual(failed,expected);
const restored=JSON.parse(readFileSync(resolve(dir,'checkpoint.json'),'utf8'));
const repaired=r=>r.due!==null&&r.due<restored.now&&r.status!=='done'&&!r.archived;
const actual=restored.fixtures.filter(repaired).map(r=>r.id);assert.deepEqual(actual,expected);
const result={kind:checkpoint.kind,expected_failure:{selected:failed,expected,diagnosis:'Deadline-only predicate leaks completed and archived tasks.'},repair:{selected:actual,pass:true},reset:'Every rerun restores the fixture checkpoint; no canonical app code is edited.'};
writeFileSync(resolve(dir,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
