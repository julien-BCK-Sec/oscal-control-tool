# Milestone 03A — Evidence Management Foundation

## Status

Implemented on `feat/evidence-management-03a` (uncommitted until review).

## Objective

Introduce the foundational evidence management domain into Control Freak.

This milestone establishes the data model, architecture, and user experience for managing evidence associated with control implementations.

This milestone intentionally excludes binary file uploads, approval workflows, and reporting. Those will be addressed in later milestones.

---

# Scope

This milestone includes:

- Evidence domain model
- Evidence metadata
- Evidence CRUD
- Evidence-to-control associations
- Evidence requirement model
- Authorization
- Audit history
- Tests
- Documentation

This milestone excludes:

- Binary file upload
- Evidence version storage
- Object storage
- Review / approval workflow
- Evidence dashboards
- Reporting
- Notifications
- Workflow automation changes
- OSCAL import/export

---

# Accepted Architectural Decisions

See **ADR-024**. Summary:

1. Evidence is a first-class operational aggregate (not a file).
2. Evidence is project-scoped; M:N links to controls via `control_id`.
3. Evidence has a permanent stable UUID; future uploads are Evidence Versions.
4. Evidence requirement lives on ControlRecord; default is **`required`**.
5. ControlActivity fan-out on link/unlink + Evidence domain events.
6. Dedicated `evidence.*` permissions; reviewers read-only in 03A.
7. Prefer archive; hard-delete only draft with no associations.

### Default `evidence_requirement = required`

There is no strong architectural reason to default to optional. The milestone
rule that controls are not automatically incomplete when no evidence exists is
satisfied by the explicit `optional` and `not_required` values — not by the
default. Required-by-default makes gaps visible; authors intentionally relax
requirement when evidence is not expected.

---

# Deliverables

- ADR-024
- Migration `drizzle-pg/0005_happy_lethal_legion.sql` (+ SQLite column for cutover parity)
- Domain types under `src/data/evidence`
- Evidence repository/service, authorized wrappers, Server Actions
- Workspace Evidence tab + control Evidence panel
- Tests (domain, RBAC, authz/tenant, activity fan-out)
- Updated architecture / current-state / roadmap docs

---

# Success Criteria

A user can:

- create evidence
- edit evidence
- archive evidence
- associate evidence with controls
- specify whether evidence is Required, Optional, or Not Required
- browse evidence
- browse evidence associated with a control

All tests pass.

Lint passes.

Production build passes.

No commits (per task request).
