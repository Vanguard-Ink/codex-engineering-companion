import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(readFileSync(resolve(root,'resources/edition-manifest.json'),'utf8'));
for(const [path,hash] of Object.entries(manifest.source_files))assert.equal(createHash('sha256').update(readFileSync(resolve(root,path))).digest('hex'),hash,`Edition input drift: ${path}`);
console.log(`PASS edition source manifest: ${Object.keys(manifest.source_files).length} files`);
