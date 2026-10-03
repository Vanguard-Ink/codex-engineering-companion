import assert from 'node:assert/strict';
export function weakOverdue(task, now) {
  return task.dueAt !== null &&
    Date.parse(task.dueAt) < now.getTime();
}
const now = new Date('2026-09-06T12:00:00.000Z');
assert.equal(weakOverdue({dueAt:'2026-09-05T00:00:00.000Z',status:'open'},now),true);
assert.equal(weakOverdue({dueAt:'2026-09-07T00:00:00.000Z',status:'open'},now),false);
// The weak predicate wrongly includes a completed task: this is the intended counterexample.
assert.equal(weakOverdue({dueAt:'2026-09-05T00:00:00.000Z',status:'done'},now),true);
console.log('2 happy-path checks and 1 counterexample reproduced');
