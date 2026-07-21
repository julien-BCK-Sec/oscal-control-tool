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

5. In-session editor state
   - Working copy with debounced database autosave
   - Bounded undo/redo (not database revisions)
   - Optimistic concurrency via `revision`

6. OSCAL
   - Export (current)
   - Import / schema validation (partial — SSP schema validation current)

7. FedRAMP policy evaluation (future, separate)
   - Consolidated Rules — not a catalog/profile substitute

React components never contain OSCAL serialization, profile/catalog parsing, or Drizzle/SQLite types.

## Persistence flow

```text
UI (ProjectWorkspace)
  → Server Actions (src/app/actions/projects.ts)
    → ProjectRepository
      → SQLite (projects + project_snapshots)
```

Runtime domain `Project` is assembled with `FrameworkProvider` controls at export time.
