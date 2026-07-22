# Architecture

The application separates these concerns:

1. Framework data (application-facing)
   - Read-only `Framework` / `FrameworkControl` types
   - Supplied by a `FrameworkProvider` (currently NIST Moderate)
   - Not raw OSCAL catalog or profile objects
   - Never persisted in the application database

2. Framework derivation (build-time)
   - Reads pinned NIST Moderate profile + SP 800-53 Rev. 5 catalog
   - Emits generated JSON under `src/data/framework/generated/`
   - Logic lives in `src/framework/nist-moderate/` (outside React)

3. Pinned NIST OSCAL content (vendor)
   - SP 800-53 Rev. 5 catalog
   - SP 800-53 Rev. 5 Moderate profile
   - OSCAL 1.2.2 JSON schemas

4. User project persistence
   - Application-facing `ProjectRepository`
   - SQLite via Drizzle (`better-sqlite3`), Node.js runtime
   - Hybrid schema: listable columns + validated `project_json`
   - Automatic snapshots and immutable named versions
   - UI mutates through Next.js Server Actions only

5. Control management metadata (`ControlRecord`)
   - Application-facing `ControlRecordRepository` / `ControlRecordService`
   - Separate `control_records` table scoped by `projectId` + `controlId`
   - Ownership / **implementationStatus** / **reviewStatus** fields — never
     written into OSCAL or `project_json` implementations
   - `implementationStatus` = implementation maturity (editable via metadata
     autosave); `reviewStatus` = review workflow only (changed via controlled
     transitions in `src/data/control-review` + `transitionReviewStatus`)
   - Lazy: missing rows resolve to draft / not_reviewed / unassigned defaults
     in the UI; first review action may create the row with those defaults
   - Append-only `control_activities` stream (`ControlActivityRepository`);
     metadata upserts and review transitions share one SQLite transaction with
     their activity inserts
   - Named version restore affects `project_json` only — ControlRecord review
     state and ControlActivity history remain live operational metadata

6. In-session editor state
   - Working copy with debounced database autosave
   - Bounded undo/redo (not database revisions)
   - Optimistic concurrency via `revision` (project document)
   - ControlRecord metadata drafts participate in the same autosave / undo path
   - Review workflow status is outside undo/autosave; updated via Server Action

7. OSCAL
   - Export (current)
   - Import / schema validation (partial — SSP schema validation current)

8. FedRAMP policy evaluation (future, separate)
   - Consolidated Rules — not a catalog/profile substitute

React components never contain OSCAL serialization, profile/catalog parsing, or Drizzle/SQLite types.

## Persistence flow

```text
UI (ProjectWorkspace)
  → Server Actions (src/app/actions/projects.ts, control-records.ts)
    → ProjectRepository / ControlRecordService / ControlActivityRepository
      → SQLite (projects + project_snapshots + control_records + control_activities)
```

Runtime domain `Project` is assembled with `FrameworkProvider` controls at export time.
ControlRecord metadata (including reviewStatus) and ControlActivity are not
included in OSCAL SSP export and are not rolled back by named project version restore.
