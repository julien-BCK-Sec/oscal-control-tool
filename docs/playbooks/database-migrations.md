# Playbook: Database Migrations

## Purpose

Use this playbook for schema changes and for the SQLite-to-PostgreSQL transition.

## Principles

- Production data is not disposable.
- Migrations move forward; previously applied migrations are not edited.
- Schema migration and data migration are separate concerns even when executed together.
- Test first against a clean database and a representative copy of existing data.
- Preserve stable identifiers and audit history.
- Prefer additive changes and staged cutovers.

## Before implementation

Document:

- source schema and database version;
- target schema and database version;
- tables and fields affected;
- data transformations and defaults;
- new constraints and indexes;
- expected row counts;
- downtime or write-freeze requirements;
- backup procedure;
- rollback or recovery strategy;
- verification queries;
- ownership of the production run.

Stop when any destructive transformation lacks explicit approval.

## Migration implementation

- Generate a new migration through the repository's approved Drizzle workflow.
- Do not hand-edit an applied migration.
- Do not delete migration history.
- Use transactions where supported and practical.
- Make data migration idempotent or make repeat execution fail clearly before changing data.
- Log progress without logging secrets or sensitive authored content.
- Validate foreign keys and uniqueness after migration.
- Preserve timestamps and identifiers unless the specification explicitly requires transformation.

## SQLite-to-PostgreSQL requirements

Migrate at minimum:

- projects;
- project snapshots;
- control records;
- control activities.

Verify:

- primary identifiers;
- project revisions;
- project JSON content;
- snapshot type and ordering;
- control record uniqueness;
- implementation and review statuses;
- activity actor, type, timestamp, and ordering;
- parent-child relationships;
- organization ownership defaults introduced by the platform milestone.

Do not assume SQLite and PostgreSQL serialize timestamps, booleans, JSON, or uniqueness identically.

## Clean-database test

Starting from no database:

1. Apply all migrations.
2. Start the application.
3. Run seed data through supported application or seed entry points.
4. Run repository and integration tests.
5. Confirm the health check.
6. Export and validate a representative OSCAL document.

## Existing-data test

Using a non-production copy:

1. Record source row counts.
2. Record representative identifiers and revisions.
3. Back up the copy.
4. Execute the migration.
5. Record target row counts.
6. Run orphan and constraint checks.
7. Open representative projects.
8. Verify versions, review states, and activity history.
9. Export and validate representative OSCAL.
10. Restart and repeat critical reads.
11. Test rerun behavior.

## Verification report template

```markdown
# Migration verification

## Source

- Source database:
- Source schema/version:
- Copy or fixture date:

## Commands

- Migration command:
- Verification command:

## Counts

| Entity | Before | After | Result |
| --- | ---: | ---: | --- |
| Projects | | | |
| Snapshots | | | |
| Control records | | | |
| Control activities | | | |

## Integrity checks

- Foreign keys:
- Orphans:
- Unique constraints:
- Project revisions:
- Activity ordering:
- OSCAL export comparison:

## Transformations and defaults

- 

## Warnings

- 

## Recovery procedure

- 
```

## Production execution

Before production migration:

- confirm a current backup;
- confirm maintenance or write-freeze requirements;
- confirm target database connectivity;
- confirm required secrets are present;
- confirm recovery procedure;
- confirm release owner approval.

During migration:

- capture start and end time;
- retain command output;
- stop on unexpected count or integrity failures;
- do not improvise destructive fixes.

After migration:

- run health check;
- run production smoke tests;
- verify representative projects;
- verify authentication and tenant boundaries;
- verify OSCAL export;
- monitor logs without exposing sensitive content;
- retain the source backup until the release is formally accepted.
