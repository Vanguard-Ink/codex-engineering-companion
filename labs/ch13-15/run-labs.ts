import assert from 'node:assert/strict';
import { DatabaseSync, backup } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { createDb, FIXTURE_NOW } from '../../northstar/src/db.ts';
import { changeStatus, migrateAudit, readAudit, DomainError } from './access-audit.ts';
import { enqueue, migrateOutbox, ProviderSimulator, ProviderFailure, deliverOne, wrongRetry } from './outbox.ts';
import type { OutboxRow } from './outbox.ts';

const root = dirname(fileURLToPath(import.meta.url));
const evidenceDir = join(root, '../../artifacts/case-labs');
mkdirSync(evidenceDir, { recursive: true });
const startedAt = new Date().toISOString();
const runId = startedAt.replace(/[:.]/g, '-');
const runDir = mkdtempSync(join(evidenceDir, 'run-'));
const rows: { chapter: number; name: string; passed: boolean; elapsed_ms: number; error?: string }[] = [];
const observations: Record<string, unknown> = {};
const baselinePaths = ['db.ts', 'app.ts'].map(name => join(root, '../../northstar/src', name));
const digest = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');
const baselineBefore = Object.fromEntries(baselinePaths.map(path => [path, digest(path)]));
const totalStart = performance.now();

function fresh(outbox = false) {
  const db = createDb();
  migrateAudit(db);
  db.exec(`INSERT INTO users VALUES ('ed','editor@example.test'),('view','viewer@example.test'),
    ('adm','admin@example.test'),('own','owner@example.test'),('odd','unknown@example.test');
    INSERT INTO memberships VALUES ('ed','org-a','editor'),('view','org-a','viewer'),
    ('adm','org-a','admin'),('own','org-a','owner'),('odd','org-a','future_role');`);
  if (outbox) migrateOutbox(db);
  return db;
}
const change = (overrides = {}) => ({ actorId: 'ed', orgId: 'org-a', taskId: 't-overdue',
  status: 'done', requestId: 'request-14', now: FIXTURE_NOW, ...overrides });
const status = (db: DatabaseSync, task = 't-overdue') =>
  (db.prepare('SELECT status FROM tasks WHERE id=?').get(task) as { status: string }).status;
const audits = (db: DatabaseSync) =>
  (db.prepare('SELECT count(*) AS n FROM audit_events').get() as { n: number }).n;
const queue = (db: DatabaseSync) => db.prepare('SELECT * FROM notification_outbox').get() as OutboxRow;
const countQueue = (db: DatabaseSync) =>
  (db.prepare('SELECT count(*) AS n FROM notification_outbox').get() as { n: number }).n;
function denial(db: DatabaseSync, code: number, overrides: object) {
  assert.throws(() => changeStatus(db, change(overrides)),
    (error: unknown) => error instanceof DomainError && error.code === code);
  assert.equal(status(db), 'open'); assert.equal(audits(db), 0);
}
async function test(chapter: number, name: string, fn: () => void | Promise<void>) {
  const start = performance.now();
  try {
    await fn(); rows.push({ chapter, name, passed: true, elapsed_ms: performance.now() - start });
    console.log(`PASS CH${chapter} ${name}`);
  } catch (error) {
    rows.push({ chapter, name, passed: false, elapsed_ms: performance.now() - start, error: String(error) });
    console.error(`FAIL CH${chapter} ${name}: ${error}`);
  }
}

await test(14, 'additive migration preserves legacy memberships and reruns safely', () => {
  const db = createDb();
  const original = JSON.stringify(db.prepare('SELECT * FROM memberships ORDER BY user_id').all());
  assert.equal(migrateAudit(db), true); assert.equal(migrateAudit(db), false);
  assert.equal(JSON.stringify(db.prepare('SELECT * FROM memberships ORDER BY user_id').all()), original);
  assert.equal((db.prepare('SELECT count(*) AS n FROM tasks').get() as { n: number }).n, 8); db.close();
});
await test(14, 'editor transition writes exact actor, organization and before/after evidence', () => {
  const db = fresh(); const result = changeStatus(db, change());
  assert.equal(result.changed, true); assert.equal(status(db), 'done'); assert.equal(audits(db), 1);
  const event = db.prepare('SELECT * FROM audit_events').get()!;
  assert.equal(event.actor_id, 'ed'); assert.equal(event.org_id, 'org-a');
  assert.equal(event.before_status, 'open'); assert.equal(event.after_status, 'done');
  assert.equal(event.occurred_at, FIXTURE_NOW); assert.equal(event.request_id, 'request-14'); db.close();
});
for (const [name, actor, code] of [
  ['anonymous', null, 401], ['viewer', 'view', 403], ['legacy member', 'alice', 403],
  ['unknown role', 'odd', 403], ['other organization member', 'bob', 403],
] as const) await test(14, `${name} cannot mutate or create a success audit`, () => {
  const db = fresh(); denial(db, code, { actorId: actor }); db.close();
});
await test(14, 'owner and admin each retain mutation permission', () => {
  for (const actor of ['own', 'adm']) { const db = fresh();
    changeStatus(db, change({ actorId: actor })); assert.equal(status(db), 'done'); db.close(); }
});
await test(14, 'task lookup remains scoped to the authorized organization', () => {
  const db = fresh(); denial(db, 404, { taskId: 't-other' });
  assert.equal(status(db, 't-other'), 'open'); db.close();
});
await test(14, 'archived project and invalid status fail without mutation', () => {
  const db = fresh(); denial(db, 409, { taskId: 't-archived' });
  denial(db, 400, { status: 'published' }); db.close();
});
await test(14, 'no-op retry does not invent a state transition', () => {
  const db = fresh(); changeStatus(db, change());
  assert.equal(changeStatus(db, change()).changed, false); assert.equal(audits(db), 1); db.close();
});
await test(14, 'audit insertion failure rolls back task mutation', () => {
  const db = fresh(); db.exec(`CREATE TRIGGER reject_audit BEFORE INSERT ON audit_events
    BEGIN SELECT RAISE(ABORT,'injected audit failure'); END;`);
  assert.throws(() => changeStatus(db, change()), /injected audit failure/);
  assert.equal(status(db), 'open'); assert.equal(audits(db), 0);
  observations.audit_failure = { task_status: status(db), audit_rows: audits(db) }; db.close();
});
await test(14, 'ordinary audit updates and deletes are rejected', () => {
  const db = fresh(); changeStatus(db, change());
  assert.throws(() => db.exec("UPDATE audit_events SET after_status='open'"), /append-only/);
  assert.throws(() => db.exec('DELETE FROM audit_events'), /append-only/);
  assert.equal(audits(db), 1); db.close();
});
await test(14, 'audit reader checks permission and organization scope', () => {
  const db = fresh(); changeStatus(db, change());
  assert.equal(readAudit(db, 'adm', 'org-a').length, 1);
  assert.throws(() => readAudit(db, 'ed', 'org-a'), (e: unknown) => e instanceof DomainError && e.code === 403);
  assert.throws(() => readAudit(db, 'bob', 'org-a'), (e: unknown) => e instanceof DomainError && e.code === 403);
  db.exec("UPDATE memberships SET role='admin' WHERE user_id='bob'");
  assert.equal(readAudit(db, 'bob', 'org-b').length, 0); db.close();
});
await test(14, 'role revocation is read from current database state', () => {
  const db = fresh(); changeStatus(db, change());
  db.prepare('UPDATE memberships SET role=? WHERE user_id=? AND org_id=?').run('viewer', 'ed', 'org-a');
  assert.throws(() => changeStatus(db, change({ status: 'open' })),
    (e: unknown) => e instanceof DomainError && e.code === 403);
  assert.equal(status(db), 'done'); assert.equal(audits(db), 1); db.close();
});

await test(15, 'wrong retry passes the successful-response smoke check', () => {
  const provider = new ProviderSimulator(); assert.equal(wrongRetry(provider, 'message', ['none']), 'receipt-1');
  assert.equal(provider.count(), 1); provider.close();
});
await test(15, 'independent oracle exposes duplicate acceptance after a lost acknowledgment', () => {
  const provider = new ProviderSimulator(); wrongRetry(provider, 'message', ['lose-ack', 'none']);
  assert.equal(provider.count(), 2);
  observations.wrong_retry = { attempts: 2, provider_acceptances: provider.count(), trace: provider.trace };
  provider.close();
});
await test(15, 'outbox insertion failure rolls back task, audit and intent together', () => {
  const db = fresh(true); db.exec(`CREATE TRIGGER reject_outbox BEFORE INSERT ON notification_outbox
    BEGIN SELECT RAISE(ABORT,'injected outbox failure'); END;`);
  assert.throws(() => changeStatus(db, change(), enqueue), /injected outbox failure/);
  assert.equal(status(db), 'open'); assert.equal(audits(db), 0); assert.equal(countQueue(db), 0); db.close();
});
await test(15, 'unknown outcome retries with one key and creates one provider acceptance', () => {
  const db = fresh(true); const provider = new ProviderSimulator(); changeStatus(db, change(), enqueue);
  const now = Date.parse(FIXTURE_NOW);
  assert.equal(deliverOne(db, provider, now, { fault: 'lose-ack' }).outcome, 'retry-scheduled');
  assert.equal(queue(db).state, 'pending'); assert.equal(provider.count(), 1);
  assert.equal(deliverOne(db, provider, now + 999).outcome, 'idle');
  assert.equal(deliverOne(db, provider, now + 1000).outcome, 'sent');
  assert.equal(provider.count(), 1); assert.equal(queue(db).attempts, 2);
  assert.equal(deliverOne(db, provider, now + 2000).outcome, 'idle');
  observations.correct_retry = { attempts: queue(db).attempts, provider_acceptances: provider.count(),
    simulated_retry_delay_ms: 1000, final_state: queue(db).state, trace: provider.trace };
  db.close(); provider.close();
});
await test(15, 'known pre-acceptance rejection remains pending and later succeeds', () => {
  const db = fresh(true); const provider = new ProviderSimulator(); changeStatus(db, change(), enqueue);
  const now = Date.parse(FIXTURE_NOW);
  deliverOne(db, provider, now, { fault: 'reject-before-accept' }); assert.equal(provider.count(), 0);
  assert.equal(deliverOne(db, provider, now + 1000).outcome, 'sent');
  assert.equal(provider.count(), 1); db.close(); provider.close();
});
await test(15, 'same key with different payload conflicts and preserves original acceptance', () => {
  const provider = new ProviderSimulator(); provider.send('event-1', 'original');
  assert.throws(() => provider.send('event-1', 'changed'),
    (e: unknown) => e instanceof ProviderFailure && e.kind === 'conflict');
  assert.equal(provider.count(), 1); provider.close();
});
await test(15, 'worker quarantines a payload conflict for review', () => {
  const db = fresh(true); const provider = new ProviderSimulator(); changeStatus(db, change(), enqueue);
  provider.send(queue(db).event_id, 'conflicting prior payload');
  assert.equal(deliverOne(db, provider, Date.parse(FIXTURE_NOW)).outcome, 'quarantined');
  assert.equal(queue(db).state, 'quarantined'); assert.equal(provider.count(), 1); db.close(); provider.close();
});
await test(15, 'retry budget stops at five transient failures without claiming delivery', () => {
  const db = fresh(true); const provider = new ProviderSimulator(); changeStatus(db, change(), enqueue);
  for (let i = 0; i < 5; i++) deliverOne(db, provider, queue(db).next_attempt_at,
    { fault: 'reject-before-accept' });
  assert.equal(queue(db).attempts, 5); assert.equal(queue(db).state, 'quarantined');
  assert.equal(provider.count(), 0); db.close(); provider.close();
});
await test(15, 'database reopen after acknowledgment crash preserves dedupe and queue recovery', async () => {
  const memory = fresh(true); changeStatus(memory, change(), enqueue);
  const queuePath = join(runDir, 'queue.db'); const providerPath = join(runDir, 'provider.db');
  await backup(memory, queuePath); memory.close();
  let db = new DatabaseSync(queuePath); let provider = new ProviderSimulator(providerPath);
  const now = Date.parse(FIXTURE_NOW);
  assert.throws(() => deliverOne(db, provider, now, { crashAfterAck: true }), /Injected crash/);
  assert.equal(queue(db).state, 'pending'); assert.equal(provider.count(), 1);
  db.close(); provider.close();
  db = new DatabaseSync(queuePath); provider = new ProviderSimulator(providerPath);
  assert.equal(deliverOne(db, provider, now).outcome, 'sent');
  assert.equal(provider.count(), 1); assert.equal(queue(db).attempts, 2);
  observations.reopen_recovery = { queue_state: queue(db).state, attempts: queue(db).attempts,
    provider_acceptances: provider.count(), actual_process_kill: false,
    mechanism: 'exception at crash point, close both SQLite connections, reopen both files' };
  db.close(); provider.close();
});
await test(15, 'distinct business events with equal payload remain distinct', () => {
  const provider = new ProviderSimulator(); provider.send('event-a', 'same payload');
  provider.send('event-b', 'same payload'); assert.equal(provider.count(), 2); provider.close();
});
await test(15, 'duplicate intent insertion is rejected by event identity', () => {
  const db = fresh(true); changeStatus(db, change(), enqueue); const row = queue(db);
  assert.throws(() => db.prepare(`INSERT INTO notification_outbox(event_id,payload,next_attempt_at)
    VALUES (?,?,?)`).run(row.event_id, row.payload, row.next_attempt_at), /UNIQUE/);
  assert.equal(countQueue(db), 1); db.close();
});

const elapsedMs = performance.now() - totalStart;
const baselineAfter = Object.fromEntries(baselinePaths.map(path => [path, digest(path)]));
assert.deepEqual(baselineAfter, baselineBefore);
const counts = Object.fromEntries([14, 15].map(chapter => [chapter, {
  total: rows.filter(row => row.chapter === chapter).length,
  passed: rows.filter(row => row.chapter === chapter && row.passed).length,
}]));
const evidence = {
  run_id: runId, started_at: startedAt, ended_at: new Date().toISOString(),
  environment: { node: process.version, platform: process.platform, arch: process.arch,
    sqlite: process.versions.sqlite, executable: process.execPath },
  invocation: [process.execPath, ...process.argv.slice(1)],
  status: rows.every(row => row.passed) ? 'PASS' : 'FAIL', counts, elapsed_ms: elapsedMs,
  human_attention_seconds: null, model_tokens: null, monetary_cost: null,
  model_experiment: false, external_network: false, tests: rows, observations,
  source_hashes: Object.fromEntries(['access-audit.ts','outbox.ts','run-labs.ts'].map(name => [name, digest(join(root,name))])),
  preserved_baseline_before: baselineBefore, preserved_baseline_after: baselineAfter,
  limits: ['Single local worker; no concurrent leasing test.', 'No HTTP or UI integration.',
    'Injected synchronous faults; no real external provider or production deployment.',
    'Provider dedupe retention is unbounded in simulator.',
    'Reopen recovery uses connection close/reopen, not actual process termination.',
    'Wall time is one correctness run, not a benchmark or human labor measure.'],
};
const filename = join(evidenceDir, `${runId}.json`);
writeFileSync(filename, JSON.stringify(evidence, null, 2) + '\n');
writeFileSync(join(evidenceDir, `${runId}.log`), rows.map(row => `${row.passed ? 'PASS' : 'FAIL'} CH${row.chapter} ${row.name}${row.error ? ': ' + row.error : ''}`).join('\n') + '\n');
console.log(JSON.stringify({ status: evidence.status, counts, elapsed_ms: elapsedMs, evidence: filename }));
if (evidence.status !== 'PASS') process.exitCode = 1;
