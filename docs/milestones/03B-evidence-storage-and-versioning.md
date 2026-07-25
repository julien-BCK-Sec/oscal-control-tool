# Milestone 03B — Evidence Storage & Versioning

## Status

Implemented on `feat/evidence-storage-03b` (uncommitted until review).

## Objective

Extend the Evidence domain by introducing immutable Evidence Versions and production-ready binary file storage.

This milestone establishes how evidence artifacts are uploaded, stored, versioned, validated, and retrieved while preserving the permanent Evidence aggregate introduced in 03A.

Evidence remains the logical business object.

Evidence Versions represent immutable snapshots of uploaded artifacts.

This milestone should produce a storage architecture suitable for production deployments while remaining easy to develop locally.

---

# Scope

This milestone includes:

- Evidence Version domain
- Binary file upload
- Production-ready storage abstraction
- S3-compatible object storage support
- Local filesystem provider for development
- Download support
- Version history
- File validation
- MIME type detection
- SHA-256 checksum generation
- File metadata
- UI for managing Evidence Versions
- Tests
- Documentation

This milestone excludes:

- Approval workflows
- Evidence review
- Workflow automation changes
- Virus scanning
- OCR
- AI document analysis
- Evidence dashboards
- Reporting
- Organization-wide evidence library
- OSCAL import/export
- Full searchable Evidence Picker (deferred to
  `docs/milestones/03C-evidence-picker.md`)

---

# Accepted Architectural Decisions

See **ADR-024** (amended) and **ADR-025**. Summary:

1. Evidence remains the aggregate root; versions are immutable children.
2. `evidence.current_version_id` points at the current version (nullable).
3. Storage port with filesystem (dev/test) and S3-compatible (production).
4. Production fails closed without durable S3 configuration.
5. App-proxied Route Handlers for upload/download; no raw storage keys.
6. Configurable `EVIDENCE_UPLOAD_MAX_BYTES` (default 25 MiB).
7. Upload atomicity: put bytes → DB transaction → cleanup on failure.
8. Reuse `evidence.read` / `evidence.update`; no new permissions.
9. Control linking dropdown kept with sort + soft bound; picker in 03C.

---

# Deliverables

- ADR-025 + ADR-024 amendment
- Migration `drizzle-pg/0006_happy_raza.sql`
- `src/storage/` providers and config
- Evidence Version domain, repositories, services, authorized wrappers
- Upload/download APIs under `/api/projects/.../evidence/.../versions`
- Evidence Version UI on the Evidence tab
- Bounded control linking UX + 03C picker follow-up doc
- Tests and documentation updates

---

# Success Criteria

A user can:

- Upload a file to new Evidence
- Upload a replacement version
- Browse version history
- Download any version
- Identify the current version

Evidence Versions are immutable.

Binary files are not stored in PostgreSQL.

The storage implementation supports production deployment using S3-compatible object storage.

All tests pass.

Lint passes.

Production build passes.

No commits (per task request).
