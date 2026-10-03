import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import type { AuditEvent } from './access-audit.ts';

export function migrateOutbox(db: DatabaseSync) {
  db.exec(`CREATE TABLE notification_outbox(
    event_id TEXT PRIMARY KEY REFERENCES audit_events(event_id),
    payload TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'pending'
      CHECK(state IN ('pending','sent','quarantined')),
    attempts INTEGER NOT NULL DEFAULT 0,
    next_attempt_at INTEGER NOT NULL,
    receipt TEXT, last_error TEXT
  );`);
}

export function enqueue(db: DatabaseSync, event: AuditEvent) {
  const payload = JSON.stringify({ orgId: event.orgId, taskId: event.taskId,
    status: event.after, recipient: 'organization-admins' });
  db.prepare(`INSERT INTO notification_outbox(event_id,payload,next_attempt_at)
    VALUES (?,?,?)`).run(event.eventId, payload, Date.parse(event.occurredAt));
}

export class ProviderFailure extends Error {
  kind: 'transient' | 'conflict';
  constructor(kind: 'transient' | 'conflict', message: string) { super(message); this.kind = kind; }
}
export type Fault = 'none' | 'reject-before-accept' | 'lose-ack';
export type ProviderEvent = { key: string; kind: string; receipt?: string };

// Separate SQLite state stands in for a cooperating provider's durable dedupe store.
// This is a deterministic single-process simulator, not a network implementation.
export class ProviderSimulator {
  db: DatabaseSync;
  trace: ProviderEvent[] = [];
  constructor(path = ':memory:') {
    this.db = new DatabaseSync(path);
    this.db.exec(`CREATE TABLE IF NOT EXISTS accepted(
      event_key TEXT PRIMARY KEY, payload_hash TEXT NOT NULL,
      receipt TEXT UNIQUE NOT NULL, payload TEXT NOT NULL
    );`);
  }
  send(key: string, payload: string, fault: Fault = 'none'): string {
    this.trace.push({ key, kind: 'attempt' });
    if (fault === 'reject-before-accept') {
      this.trace.push({ key, kind: 'rejected-before-acceptance' });
      throw new ProviderFailure('transient', 'Provider unavailable before acceptance');
    }
    const hash = createHash('sha256').update(payload).digest('hex');
    const existing = this.db.prepare('SELECT payload_hash,receipt FROM accepted WHERE event_key=?')
      .get(key) as { payload_hash: string; receipt: string } | undefined;
    if (existing && existing.payload_hash !== hash) {
      this.trace.push({ key, kind: 'key-conflict' });
      throw new ProviderFailure('conflict', 'Idempotency key reused with different payload');
    }
    const receipt = existing?.receipt ?? `receipt-${this.count() + 1}`;
    if (!existing) {
      this.db.prepare('INSERT INTO accepted VALUES (?,?,?,?)').run(key, hash, receipt, payload);
      this.trace.push({ key, kind: 'accepted', receipt });
    } else this.trace.push({ key, kind: 'deduplicated', receipt });
    if (fault === 'lose-ack') {
      this.trace.push({ key, kind: 'acknowledgment-lost', receipt });
      throw new ProviderFailure('transient', 'Outcome unknown to caller');
    }
    this.trace.push({ key, kind: 'acknowledged', receipt });
    return receipt;
  }
  count(): number {
    return (this.db.prepare('SELECT count(*) AS n FROM accepted').get() as { n: number }).n;
  }
  close() { this.db.close(); }
}

export type OutboxRow = {
  event_id: string; payload: string; state: string; attempts: number;
  next_attempt_at: number; receipt: string | null; last_error: string | null;
};
// Exactly one local worker owns this queue. No claim about multiworker leasing.
export function deliverOne(db: DatabaseSync, provider: ProviderSimulator, now: number,
  options: { fault?: Fault; crashAfterAck?: boolean } = {}) {
  const row = db.prepare(`SELECT * FROM notification_outbox
    WHERE state='pending' AND next_attempt_at<=? ORDER BY next_attempt_at,event_id LIMIT 1`)
    .get(now) as OutboxRow | undefined;
  if (!row) return { outcome: 'idle' };
  const attempt = row.attempts + 1;
  db.prepare('UPDATE notification_outbox SET attempts=? WHERE event_id=?').run(attempt, row.event_id);
  let receipt: string;
  try {
    receipt = provider.send(row.event_id, row.payload, options.fault);
  } catch (error) {
    if (!(error instanceof ProviderFailure)) throw error;
    const state = error.kind === 'conflict' || attempt >= 5 ? 'quarantined' : 'pending';
    db.prepare(`UPDATE notification_outbox
      SET state=?,next_attempt_at=?,last_error=? WHERE event_id=?`)
      .run(state, now + Math.min(1000 * 2 ** (attempt - 1), 8000), error.message, row.event_id);
    return { outcome: state === 'pending' ? 'retry-scheduled' : 'quarantined' };
  }
  if (options.crashAfterAck) throw new Error('Injected crash after provider acknowledgment');
  db.prepare(`UPDATE notification_outbox SET state='sent',receipt=?,last_error=NULL
    WHERE event_id=?`).run(receipt, row.event_id);
  return { outcome: 'sent', receipt };
}

// Deliberately wrong candidate used only by the failure lab. Never the queue worker.
export function wrongRetry(provider: ProviderSimulator, payload: string, faults: Fault[]) {
  for (let attempt = 1; attempt <= faults.length; attempt++) {
    try { return provider.send(`attempt-${attempt}`, payload, faults[attempt - 1]); }
    catch (error) { if (!(error instanceof ProviderFailure)) throw error; }
  }
  throw new Error('Wrong candidate exhausted retries');
}
