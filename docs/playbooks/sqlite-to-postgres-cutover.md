# Playbook: SQLite → PostgreSQL Cutover

## Purpose

Step-by-step procedure for the one-shot, offline SQLite → PostgreSQL data
migration approved in ADR-016 (`docs/decisions.md`). This is the
Milestone 1 / Work Package 2 cutover for existing project data.

This playbook is procedure-specific. See `docs/playbooks/database-migrations.md`
for general migration principles, and
`src/persistence/migrate/sqlite-to-postgres.ts` for the migrator implementation.

## Scope

Migrates, in order:

1. `projects` — with `organization_id` set to the organization id supplied on
   the command line (required).
2. `project_snapshots` — automatic, named, and pre-restore snapshots.
3. `control_records` — ownership, implementation status, review status.
4. `control_activities` — the append-only activity stream.

Preserves: primary identifiers, `revision`, ISO timestamp strings,
`project_json` content (verbatim, including narratives), snapshot type and
ordering, control record uniqueness, and activity ordering (by `created_at`).

Not in scope: Better Auth, organization/user/membership persistence (Work
Package 3), or any PostgreSQL → SQLite reverse sync.

## Principles

- **Not dual-write.** The application reads/writes either SQLite or
  PostgreSQL at any given time, never both.
- **Idempotent by row id.** Re-running the migrator against a target that
  already has some or all rows skips existing ids; it never duplicates rows.
  Pass `--strict` to fail loudly instead of skipping when an existing target
  row's content does not match the source (should not happen in normal
  single-run cutovers; useful for detecting an unexpected prior partial or
  divergent write).
- **One-shot.** This procedure is designed to run once per environment as
  part of a maintenance window, not on a recurring schedule.
- **No secrets or narrative content in logs.** The migrator and this
  procedure only ever print row counts, ids, and timestamps — never
  `project_json` bodies, implementation narratives, or connection
  credentials.

## Stop condition

**Application writes to the source SQLite database must be stopped before
running this migration for a production cutover.** The migrator does not
lock the source file and does not detect concurrent writes. Running it while
the application is still writing to SQLite can produce a target snapshot
that misses rows written after the migrator read the source tables.

The CLI (`npm run db:migrate:sqlite-to-pg`) prints this stop condition every
time it runs as a reminder — it does not enforce it programmatically.

## Procedure

### 1. Stop writes

Stop the application instance(s) writing to the source SQLite database
(e.g. scale the Render service to zero, or stop the local dev server). Confirm
no process still holds the SQLite file open.

### 2. Back up the SQLite file

```bash
cp /var/data/oscal-author.db /var/data/oscal-author.db.bak-$(date +%Y%m%d%H%M%S)
```

Keep this backup until the PostgreSQL cutover is formally accepted. Rollback
(below) depends on it.

### 3. Apply PostgreSQL migrations

Target database must exist and be reachable. Apply the forward-only Drizzle
PostgreSQL migrations (including the `organization_id` column added for this
work package):

```bash
DATABASE_URL="postgres://user:pass@host:5432/oscal_control_tool" npm run db:migrate
```

This is idempotent — safe to run again if it was already applied.

### 4. Create an initial organization and administrator

Better Auth and the Organization/User/Membership entities are introduced in
a **later** work package (Milestone 1, Work Package 3). For this cutover,
supply an organization id created out of band (e.g. a UUID you generate and
plan to reuse when Work Package 3 introduces the real `organizations` table
and Better Auth bootstrap). Record the id — it is required by the migrator
and by the later organization-creation step.

```bash
ORG_ID=$(node -e "console.log(require('node:crypto').randomUUID())")
echo "Organization id for this cutover: $ORG_ID"
```

### 5. Run the migrator

Dry run first (no writes — counts and validation only):

```bash
DATABASE_PATH=/var/data/oscal-author.db \
DATABASE_URL="postgres://user:pass@host:5432/oscal_control_tool" \
npm run db:migrate:sqlite-to-pg -- --organization-id "$ORG_ID" --dry-run
```

Review the printed report. Then run for real:

```bash
DATABASE_PATH=/var/data/oscal-author.db \
DATABASE_URL="postgres://user:pass@host:5432/oscal_control_tool" \
npm run db:migrate:sqlite-to-pg -- --organization-id "$ORG_ID"
```

Equivalent using explicit flags instead of environment variables:

```bash
npm run db:migrate:sqlite-to-pg -- \
  --sqlite /var/data/oscal-author.db \
  --postgres "postgres://user:pass@host:5432/oscal_control_tool" \
  --organization-id "$ORG_ID"
```

If the run is interrupted or needs to be repeated, run the same command
again — rows already present in the target are skipped, not duplicated.

### 6. Verify

The migrator prints a verification report (see template below). Additionally:

- Open a small number of representative projects through
  `createPostgresProjectRepository` (or a temporary script) and confirm
  metadata, implementations, and named versions match SQLite.
- Export OSCAL for at least one representative project and confirm it
  validates against the pinned OSCAL 1.2.2 SSP schema (unchanged exporter
  behavior — see `docs/oscal-standards-alignment.md`).
- Confirm `control_activities` read in the application order (`created_at`
  descending) matches the SQLite history for a project with review workflow
  activity.

Do not proceed to step 7 while the report shows orphan rows or a revision
mismatch.

### 7. Switch the application to PostgreSQL

Set `DATABASE_URL` in the application's production environment and remove
(or stop relying on) `DATABASE_PATH`. Restart the application. Confirm:

- `/api/health` returns `{"status":"ok"}`.
- Project list, project workspace, review workflow, and version history load
  correctly for the migrated organization.

Keep the SQLite deployment artifact and its backup available for rollback
until the release is formally accepted.

## Rollback

Rollback is **restoration of the previous SQLite deployment and its
backup**. There is no PostgreSQL → SQLite reverse synchronization (ADR-016).

1. Point the application back at the backed-up SQLite file
   (`DATABASE_PATH=/var/data/oscal-author.db.bak-<timestamp>`, restored to
   the live path).
2. Restart the application on the SQLite path.
3. Confirm `/api/health` and representative project loads succeed.
4. Any writes accepted against PostgreSQL after cutover and before rollback
   are lost from the application's point of view (they remain in PostgreSQL
   but are not synced back). Treat rollback as a decision to discard those
   writes, and communicate that explicitly before rolling back.

Because the migration is additive/idempotent, PostgreSQL can be safely
re-migrated from the same (or a newer) SQLite backup after fixing the issue
that triggered rollback.

## Verification report template

The migrator prints a report in this shape (`formatMigrationReport` in
`src/persistence/migrate/sqlite-to-postgres.ts`); record it for the
completion report:

```markdown
# Migration verification

## Source

- Source database: /var/data/oscal-author.db
- Source schema/version: SQLite Drizzle schema (src/persistence/sqlite/schema.ts)
- Copy or fixture date:

## Commands

- Migration command: `npm run db:migrate:sqlite-to-pg -- --organization-id <id>`
- Verification command: same command (report is printed automatically)

## Counts

| Entity | Source | Target before | Target after | Inserted | Skipped |
| --- | ---: | ---: | ---: | ---: | ---: |
| projects | | | | | |
| project_snapshots | | | | | |
| control_records | | | | | |
| control_activities | | | | | |

## Integrity checks

- project_snapshots without a matching project: (count / sample ids)
- control_records without a matching project: (count / sample ids)
- control_activities without a matching control_record: (count / sample ids)
- Sample project revision checks: (project id, source revision, target revision, match)
- Activity ordering: preserved via `created_at` (verbatim ISO-8601 copy; see module doc comment)
- OSCAL export comparison: (pass/fail, project id used)

## Warnings

- (non-strict content conflicts, if any)

## Recovery procedure

- Restore SQLite from `/var/data/oscal-author.db.bak-<timestamp>` and point
  `DATABASE_PATH` back at it. No PostgreSQL → SQLite sync.
```

## Example: local end-to-end dry run

Useful before touching any real deployment:

```bash
# 1. Seed a local SQLite demo project (if not already present)
DATABASE_PATH=./data/oscal-control-tool.sqlite npm run db:seed:demo

# 2. Start a local PostgreSQL (or use an existing empty database) and apply migrations
DATABASE_URL=postgres://localhost:5432/oscal_control_tool_dev npm run db:migrate

# 3. Dry run
DATABASE_PATH=./data/oscal-control-tool.sqlite \
DATABASE_URL=postgres://localhost:5432/oscal_control_tool_dev \
npm run db:migrate:sqlite-to-pg -- --organization-id "$(node -e "console.log(require('node:crypto').randomUUID())")" --dry-run

# 4. Real run, then re-run to confirm idempotency (should report 0 inserted, all skipped)
DATABASE_PATH=./data/oscal-control-tool.sqlite \
DATABASE_URL=postgres://localhost:5432/oscal_control_tool_dev \
npm run db:migrate:sqlite-to-pg -- --organization-id "$ORG_ID"
```
