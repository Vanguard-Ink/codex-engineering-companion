import { DatabaseSync } from 'node:sqlite';
import { createHash, randomBytes } from 'node:crypto';

export const FIXTURE_NOW = '2026-09-06T12:00:00.000Z';
export function createDb() {
  const db = new DatabaseSync(':memory:');
  db.exec(`PRAGMA foreign_keys=ON;
    CREATE TABLE organizations(id TEXT PRIMARY KEY, name TEXT NOT NULL);
    CREATE TABLE users(id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL);
    CREATE TABLE memberships(user_id TEXT REFERENCES users(id), org_id TEXT REFERENCES organizations(id), role TEXT NOT NULL, PRIMARY KEY(user_id,org_id));
    CREATE TABLE sessions(token_hash TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),expires_at TEXT NOT NULL);
    CREATE TABLE projects(id TEXT PRIMARY KEY,org_id TEXT NOT NULL REFERENCES organizations(id),name TEXT NOT NULL,archived INTEGER NOT NULL CHECK(archived IN (0,1)));
    CREATE TABLE tasks(id TEXT PRIMARY KEY,project_id TEXT NOT NULL REFERENCES projects(id),title TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN ('open','in_progress','done')),due_at TEXT);
    INSERT INTO organizations VALUES ('org-a','Aster Studio'),('org-b','Birch Labs');
    INSERT INTO users VALUES ('alice','alice@example.test'),('bob','bob@example.test');
    INSERT INTO memberships VALUES ('alice','org-a','member'),('bob','org-b','member');
    INSERT INTO projects VALUES ('p-a','org-a','Website refresh',0),('p-old','org-a','Retired website',1),('p-b','org-b','Private launch',0);
    INSERT INTO tasks VALUES
      ('t-overdue','p-a','Review navigation','open','2026-09-05T12:00:00.000Z'),
      ('t-progress','p-a','Repair mobile menu','in_progress','2026-09-06T11:59:59.999Z'),
      ('t-future','p-a','Prepare release','open','2026-09-07T12:00:00.000Z'),
      ('t-equal','p-a','Check exact deadline','open','2026-09-06T12:00:00.000Z'),
      ('t-done','p-a','Approve color palette','done','2026-09-01T12:00:00.000Z'),
      ('t-null','p-a','Explore next release','open',NULL),
      ('t-archived','p-old','Old migration','open','2026-09-01T12:00:00.000Z'),
      ('t-other','p-b','Confidential review','open','2026-09-01T12:00:00.000Z');`);
  return db;
}
export const digest = (value: string) => createHash('sha256').update(value).digest('hex');
export function createSession(db: DatabaseSync, userId: string, now: Date) {
  const token=randomBytes(32).toString('hex');
  const expires=new Date(now.getTime()+60*60*1000).toISOString();
  db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(digest(token),userId,expires);
  return token;
}
