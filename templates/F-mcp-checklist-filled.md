# MCP integration checklist — filled example

Proposed tool: read-only documentation retrieval for an overdue task; not configured or executed in this edition.
Data classification: public vendor documentation only; no sessions, private tasks or credentials.
Capability boundary: read/search; no writes or shell access. Server identity, dependency lock, publisher, transport and authentication must be verified before enablement.
Trust: retrieved text is untrusted task data; it cannot authorize shell commands, widen scope or replace acceptance criteria.
Minimum context: exact product surface and date; return source URL and excerpt provenance.
Tests planned: auth failure, unavailable server, malformed result, hostile instruction text and unexpected permission request.
Fallback: use dated official docs directly; record NOT_TESTED instead of fabricating successful MCP calls.
Disposition: NOT_CONFIGURED / NOT_TESTED; approve a specific server only after evidence review.
Evidence: resources/compatibility.md; workflows/optional-codex-run.md covers CLI separately, not MCP proof.
