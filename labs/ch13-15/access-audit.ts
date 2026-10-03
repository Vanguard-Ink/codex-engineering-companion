import type { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';

export type Status = 'open' | 'in_progress' | 'done';
export type AuditEvent = {
  eventId: string; orgId: string; actorId: string; taskId: string;
  before: Status; after: Status; occurredAt: string; requestId: string;
};
export type Change = {
  actorId: string | null; orgId: string; taskId: string;
  status: string; requestId: string; now: string;
};
export class DomainError extends Error {
  code: number;
  constructor(code: number, message: string) { super(message); this.code = code; }
}

// This migration extends the preserved baseline. Existing membership roles are unchanged.
export function migrateAudit(db: DatabaseSync): boolean {
  const version = (db.prepare('PRAGMA user_version').get() as { user_version: number }).user_version;
  if (version === 14) return false;
  if (version !== 0) throw new Error('Unsupported migration baseline');
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(`CREATE TABLE audit_events(
      event_id TEXT PRIMARY KEY,
      org_id TEXT NOT NULL REFERENCES organizations(id),
      actor_id TEXT NOT NULL REFERENCES users(id),
      task_id TEXT NOT NULL REFERENCES tasks(id),
      before_status TEXT NOT NULL,
      after_status TEXT NOT NULL,
      occurred_at TEXT NOT NULL,
      request_id TEXT NOT NULL
    );
    CREATE TRIGGER audit_no_update BEFORE UPDATE ON audit_events
      BEGIN SELECT RAISE(ABORT, 'audit is append-only'); END;
    CREATE TRIGGER audit_no_delete BEFORE DELETE ON audit_events
      BEGIN SELECT RAISE(ABORT, 'audit is append-only'); END;
    PRAGMA user_version=14;`);
    db.exec('COMMIT');
    return true;
  } catch (error) {
    try { db.exec('ROLLBACK'); } catch { /* Preserve the original failure. */ }
    throw error;
  }
}

function membership(db: DatabaseSync, actorId: string | null, orgId: string): string {
  if (!actorId) throw new DomainError(401, 'Sign in required');
  const row = db.prepare('SELECT role FROM memberships WHERE user_id=? AND org_id=?')
    .get(actorId, orgId) as { role: string } | undefined;
  if (!row) throw new DomainError(403, 'Organization access denied');
  return row.role;
}

// actorId must come from authenticated server state, never a request-body claim.
// afterAudit is a local transactional extension point; it must not call a network.
export function changeStatus(db: DatabaseSync, change: Change,
  afterAudit?: (db: DatabaseSync, event: AuditEvent) => void) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const role = membership(db, change.actorId, change.orgId);
    if (!['owner', 'admin', 'editor'].includes(role)) {
      throw new DomainError(403, 'Task edit permission required');
    }
    if (!['open', 'in_progress', 'done'].includes(change.status)) {
      throw new DomainError(400, 'Invalid status');
    }
    if (!change.requestId.trim() || !Number.isFinite(Date.parse(change.now))) {
      throw new DomainError(400, 'Request metadata required');
    }
    const task = db.prepare(`SELECT t.status, p.archived FROM tasks t
      JOIN projects p ON p.id=t.project_id WHERE t.id=? AND p.org_id=?`)
      .get(change.taskId, change.orgId) as { status: Status; archived: number } | undefined;
    if (!task) throw new DomainError(404, 'Task not found in organization');
    if (task.archived) throw new DomainError(409, 'Project is archived');
    if (task.status === change.status) {
      db.exec('COMMIT');
      return { changed: false, eventId: null };
    }
    const event: AuditEvent = {
      eventId: randomUUID(), orgId: change.orgId, actorId: change.actorId!,
      taskId: change.taskId, before: task.status, after: change.status as Status,
      occurredAt: change.now, requestId: change.requestId,
    };
    db.prepare('UPDATE tasks SET status=? WHERE id=?').run(event.after, event.taskId);
    db.prepare('INSERT INTO audit_events VALUES (?,?,?,?,?,?,?,?)').run(
      event.eventId, event.orgId, event.actorId, event.taskId,
      event.before, event.after, event.occurredAt, event.requestId);
    afterAudit?.(db, event);
    db.exec('COMMIT');
    return { changed: true, eventId: event.eventId };
  } catch (error) {
    try { db.exec('ROLLBACK'); } catch { /* Preserve the original failure. */ }
    throw error;
  }
}

export function readAudit(db: DatabaseSync, actorId: string | null, orgId: string) {
  const role = membership(db, actorId, orgId);
  if (!['owner', 'admin'].includes(role)) throw new DomainError(403, 'Audit permission required');
  return db.prepare(`SELECT * FROM audit_events WHERE org_id=?
    ORDER BY occurred_at, event_id`).all(orgId);
}
