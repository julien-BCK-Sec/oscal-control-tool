# Milestone 03D — Evidence Coverage, Freshness & Reporting

## Status

Implemented (uncommitted until review).

## Objective

Extend the Evidence capabilities introduced in Milestones 03A through 03C by adding control-level evidence coverage, freshness indicators, expiring-evidence views, scalable evidence browsing, and lightweight reporting.

This milestone should make it possible for project teams to answer practical questions such as:

* Which controls require evidence?
* Which required controls currently have no linked Evidence?
* Which Evidence records are approaching review or expiration?
* Which controls rely on stale or archived Evidence?
* Which Evidence records support multiple controls?
* Which areas of a project require attention before an assessment or review?

This milestone should build on the existing Evidence aggregate, Evidence Versions, Evidence Picker, control associations, Evidence Requirement model, and domain-event architecture without redesigning them.

---

## Scope

This milestone includes:

* Evidence coverage calculation
* Missing-evidence indicators
* Evidence freshness calculation
* Expiring-evidence indicators
* Project Evidence overview
* Control Evidence coverage indicators
* Scalable Evidence browser improvements
* Search and filtering
* Summary metrics
* Lightweight reporting / inventory export
* Authorization enforcement
* Tests
* Documentation

This milestone excludes:

* Organization-wide Evidence libraries
* Cross-project Evidence sharing
* Formal Evidence approval workflow
* Assessor findings
* Assessment execution
* POA&M management
* Virus scanning
* OCR
* AI document analysis
* Advanced analytics
* Scheduled jobs
* Email notifications
* New workflow engine primitives
* OSCAL Evidence export
* External BI integrations

---

## Architectural Review Required

Before making ANY implementation changes:

Review:

* Milestones 03A, 03B, and 03C
* ADR-024
* ADR-025
* Evidence aggregate and Evidence Version model
* Evidence Requirement on ControlRecord
* Evidence-to-control associations
* Evidence search and keyset pagination
* Evidence Picker
* EvidenceBrowser
* Project workspace and ControlEvidencePanel
* Authorization model
* Workflow engine and DomainEventBus
* Existing dashboard/reporting conventions
* Existing export patterns
* Existing date handling conventions

Critically evaluate the proposed architecture rather than assuming it is correct.

If any significant architectural concern, ambiguous product rule, or better design is identified:

STOP after the architectural review.

Present:

* The concern
* The recommendation
* The rationale
* The impact on later milestones

Do not implement until those recommendations have been reviewed.

---

# Architectural Decisions to Validate

Challenge the following assumptions before implementation.

---

## 1. Coverage is derived, not persisted

Evidence coverage should be computed from existing authoritative data rather than stored as a duplicated status.

The primary inputs are:

* `ControlRecord.evidenceRequirement`
* Active Evidence-to-control links
* Evidence lifecycle status
* Evidence freshness / review date

Do not create a persistent `evidence_coverage_status` column unless analysis demonstrates a strong reason.

The application should derive states such as:

* Not Required
* Optional / No Evidence
* Required / Missing Evidence
* Required / Evidence Present
* Required / Evidence Needs Attention

The architectural review should refine these names if better product terminology exists.

---

## 2. Evidence requirement semantics

The existing values remain authoritative:

* `required`
* `optional`
* `not_required`

Expected interpretation:

### Required

A control with no eligible linked Evidence is considered missing Evidence.

### Optional

A control may have Evidence but is not incomplete solely because no Evidence is linked.

### Not Required

No Evidence is expected.

The UI must clearly distinguish:

* Evidence is missing
* Evidence is optional and absent
* Evidence was explicitly marked not required

Never collapse those states into the same visual result.

---

## 3. Eligible Evidence

Coverage calculations should count only Evidence that is eligible to support a control.

At minimum:

* Archived Evidence should not count toward active coverage.
* A valid current Evidence record may count even when no binary version exists unless product review determines otherwise.

The architectural review must decide whether:

* Evidence without a current uploaded Version counts as Evidence present
* Draft Evidence counts toward coverage
* Only `current` Evidence counts toward satisfactory coverage

Do not invent these semantics silently during implementation.

If this decision is material, STOP and request approval.

---

## 4. Freshness is derived from dates

Do not mutate Evidence status automatically merely because time passes.

Freshness should be calculated from Evidence metadata such as:

* collection date
* review due date

Suggested derived states:

* Current
* Due Soon
* Overdue
* No Review Date

Do not add scheduled jobs merely to mark Evidence expired.

The architectural review should recommend the exact freshness model and threshold behavior.

---

## 5. Due-soon threshold

The application needs a consistent definition of “due soon.”

Evaluate whether the threshold should be:

* Fixed at 30 days
* Configurable per project
* Configurable per organization
* Deferred as a global application constant for this milestone

Prefer the smallest correct implementation that does not unnecessarily constrain later configuration.

Do not build a broad settings framework solely for this threshold.

---

## 6. Control-level coverage

Each control should expose an Evidence summary without loading the full Evidence library.

A control-level summary may include:

* Evidence Requirement
* Number of active linked Evidence records
* Number with current file Versions
* Number due soon
* Number overdue
* Overall derived coverage state

The summary should be computed efficiently.

Avoid N+1 queries when rendering a control list.

---

## 7. Project-level coverage

Projects should expose aggregate Evidence metrics.

Potential metrics include:

* Total controls
* Controls requiring Evidence
* Required controls with Evidence
* Required controls missing Evidence
* Controls marked Optional
* Controls marked Not Required
* Evidence due soon
* Evidence overdue
* Archived Evidence count

The architectural review should determine which metrics are meaningful and can be calculated accurately using the current model.

Do not produce a single “compliance percentage” unless its semantics are clearly defined and defensible.

---

## 8. Avoid misleading compliance scores

Evidence coverage is not equivalent to compliance.

Do not label Evidence coverage as:

* Compliance Score
* Control Compliance
* Audit Readiness Score

unless a later assessment model defines those concepts.

Preferred language should describe exactly what is measured, such as:

* Evidence Coverage
* Required Evidence Coverage
* Evidence Freshness

---

## 9. Evidence Browser scalability

The current EvidenceBrowser should evolve from a simple list-oriented interface to a scalable browse/search surface.

Reuse the server-side search infrastructure introduced in 03C where practical.

The Evidence browser should support useful filtering such as:

* Search query
* Evidence type
* Evidence status
* Owner
* Freshness
* Has current file
* Linked / unlinked
* Archived inclusion

Avoid duplicating Evidence search logic.

---

## 10. Search architecture

Reuse or extend the existing Evidence search contract rather than creating a second unrelated query system.

Where possible:

* Preserve keyset pagination
* Preserve stable ordering
* Reuse `EvidenceSearchResult`
* Extend the DTO only when required

Do not add PostgreSQL FTS or trigram search unless performance evidence justifies it.

The leading-wildcard `ILIKE` tradeoff from 03C remains acceptable at current project scope unless testing indicates otherwise.

---

## 11. Evidence coverage query model

Coverage reporting may require repository methods specialized for aggregation.

It is acceptable to introduce dedicated reporting/query repositories or read models if that keeps aggregate calculations efficient and avoids polluting the Evidence aggregate.

Do not force all reporting through individual Evidence CRUD repositories if doing so causes excessive queries.

Prefer clearly named read/query services over embedding SQL in React components.

---

## 12. Current Evidence Version

Evidence Version metadata may contribute to reporting.

Useful facts may include:

* Has current version
* Current version uploaded at
* Current version filename
* Current version MIME type

Do not expose:

* storage key
* object-store provider details
* bucket information
* internal filesystem paths

Coverage should not depend on storage-provider availability.

---

## 13. Control UI

Controls should expose Evidence coverage in a way that is immediately understandable.

Potential presentation:

* Required — 0 Evidence — Missing
* Required — 2 Evidence — Current
* Optional — No Evidence
* Not Required
* Required — Evidence Due Soon

Do not overload the control workspace with a large dashboard.

Use compact indicators that link or scroll to the existing Evidence panel where appropriate.

---

## 14. Project Evidence overview

Add a project-level Evidence overview suitable for everyday program management.

The overview should answer:

* What needs attention?
* Which controls lack required Evidence?
* What Evidence is due soon?
* What Evidence is overdue?
* What Evidence has no control associations?

Favor actionable information over decorative metrics.

This may be:

* A dedicated Evidence overview section within the project
* An improved Evidence tab
* A small project Evidence dashboard

Review the existing project navigation before choosing the final location.

---

## 15. Evidence attention views

Provide focused views or filters for:

### Missing Required Evidence

Controls where:

* Evidence Requirement is `required`
* No eligible Evidence is linked

### Due Soon

Evidence whose review due date falls within the approved threshold.

### Overdue

Evidence whose review due date has passed.

### Unlinked Evidence

Active Evidence records associated with no controls.

### Archived

Archived Evidence records, excluded by default from active views.

These should be derived from authoritative data.

---

## 16. Reporting / export

Provide a lightweight Evidence inventory/reporting capability.

The minimum useful export should be evaluated during architecture review.

A CSV export is likely sufficient for 03D.

Potential fields:

* Project
* Control ID
* Evidence Requirement
* Evidence ID
* Evidence Title
* Evidence Type
* Owner
* Evidence Status
* Collection Date
* Review Due Date
* Freshness
* Current Version Filename
* Current Version Uploaded At

Do not introduce PDF report generation unless there is a compelling existing project pattern.

Do not export binary Evidence content.

---

## 17. Authorization

Reuse existing permissions wherever possible.

Expected behavior:

* Evidence browsing/reporting requires `evidence.read`
* Control coverage views also require appropriate project/control read access
* Export should require read access to every included record
* Cross-project and cross-organization access must fail closed

Do not introduce a broad `reporting.admin` permission solely for this milestone.

If a dedicated export permission is genuinely needed, raise it during architectural review.

---

## 18. Archived Evidence

Archived Evidence:

* Remains visible when explicitly requested
* Does not count toward active Evidence coverage
* Remains included in historical version access where authorized
* Must not become newly associated with controls

Do not physically delete archived Evidence as part of reporting or freshness logic.

---

## 19. Domain events and workflow integration

Milestone 03D must not redesign the Workflow Engine.

Existing Evidence domain events remain authoritative.

It is acceptable to expose new event facts if required by reporting or future workflows, but do not add new workflow triggers/actions solely because a dashboard exists.

Future workflow examples may include:

* Required Evidence missing
* Evidence due soon
* Evidence overdue

However, scheduled evaluation of those conditions is explicitly out of scope unless an existing event naturally triggers them.

Document future automation opportunities without implementing schedulers.

---

## 20. Performance

Coverage and reporting must remain efficient as projects grow.

Review:

* Existing indexes
* Association query performance
* Aggregation query shape
* Evidence date indexes
* ControlRecord evidence requirement indexes if needed

Avoid:

* One database query per control
* One version query per Evidence result
* Loading the entire Evidence library into client state

Add indexes only where justified by query patterns.

---

## 21. UX and accessibility

All Evidence coverage states must be understandable without relying solely on color.

Use:

* Text labels
* Icons where useful
* Existing design-system tokens
* Accessible status descriptions

Tables and filters must be keyboard accessible.

Empty states should explain what the user can do next.

Examples:

* “No controls are missing required Evidence.”
* “No Evidence is due in the next 30 days.”
* “This project has no unlinked Evidence.”

---

## 22. Future compatibility

Design this milestone so future work can add:

* Organization-wide Evidence library
* Assessments
* Evidence approval
* Assessor findings
* POA&M
* Scheduled Evidence reminders
* Evidence collection campaigns
* Advanced reporting
* AI Evidence analysis

without replacing the coverage model.

Avoid assessment-specific terminology in the core Evidence reporting layer.

---

# Proposed Derived Models

The exact names should be validated during architecture review.

## EvidenceFreshness

Suggested conceptual states:

* current
* due_soon
* overdue
* no_review_date

Freshness is derived and should not be persisted unless architecture review identifies a compelling reason.

---

## ControlEvidenceCoverage

Suggested shape:

* projectId
* controlId
* evidenceRequirement
* activeEvidenceCount
* evidenceWithCurrentVersionCount
* dueSoonCount
* overdueCount
* coverageState

This should be a read model / DTO rather than a new aggregate.

---

## ProjectEvidenceSummary

Suggested shape:

* totalControls
* requiredControls
* requiredWithEvidence
* requiredMissingEvidence
* optionalControls
* notRequiredControls
* dueSoonEvidence
* overdueEvidence
* unlinkedEvidence
* archivedEvidence

Do not expose misleading percentages unless clearly named and mathematically defined.

---

# API / Query Requirements

The architectural review should determine the best exact boundaries.

Likely needs include:

* Project Evidence summary query
* Paginated missing-Evidence control query
* Paginated due-soon Evidence query
* Paginated overdue Evidence query
* Paginated unlinked Evidence query
* Extended Evidence browser search/filter contract
* Evidence inventory export

Prefer server-side queries and dedicated DTOs.

Do not return raw database rows directly to client components.

---

# UI Deliverables

At minimum, provide:

## Project Evidence Overview

A project-level view containing:

* Evidence Coverage summary
* Missing Required Evidence
* Due Soon
* Overdue
* Unlinked Evidence

The layout should prioritize actionable items.

---

## Control Coverage Indicator

Controls requiring Evidence should clearly show their current Evidence coverage.

Example concepts:

* Missing Evidence
* Evidence Present
* Due Soon
* Overdue
* Optional
* Not Required

The final terminology should be approved during architecture review.

---

## Evidence Browser Improvements

Add scalable filtering/search suitable for larger project Evidence collections.

Reuse the search architecture from 03C.

---

## Evidence Inventory Export

Provide a lightweight downloadable inventory, preferably CSV unless architecture review recommends otherwise.

---

# Testing Requirements

Add or update tests covering:

## Freshness

* No review date
* Future current date
* Due-soon threshold boundary
* Due date exactly today
* Overdue date
* Time-zone-safe date handling

## Coverage

* Required + no Evidence
* Required + active Evidence
* Required + archived Evidence only
* Optional + no Evidence
* Not Required + no Evidence
* Multiple Evidence links
* Evidence shared across multiple controls
* Evidence without current binary Version
* Evidence with current Version

## Project summary

* Counts are accurate
* Archived Evidence excluded from active counts
* Unlinked Evidence counted correctly
* Controls without lazily-created ControlRecords handled correctly
* Tenant/project isolation

## Evidence browser

* Search
* Filters
* Pagination
* Freshness filtering
* Archived inclusion
* Current-version filtering

## Authorization

* Viewer/read role can view allowed reporting
* Cross-project access denied
* Cross-org access denied
* Actor resolution fails closed

## Export

* Correct records included
* Unauthorized records excluded
* CSV escaping
* No storage keys exposed
* No binary data exposed

## Regression

* Existing Evidence CRUD works
* Upload/download works
* Evidence Picker works
* Evidence association works
* Workflow behavior unchanged
* OSCAL export remains unchanged

Use existing test patterns and tooling.

Do not introduce a new test framework unless necessary.

---

# Documentation Requirements

Update as appropriate:

* `docs/current-state.md`
* `docs/architecture.md`
* `docs/roadmap.md`
* `docs/design-system.md` only if shared UI patterns change
* Milestone documentation
* ADRs only when a material architectural decision requires one

Document:

* Evidence coverage semantics
* Freshness calculation
* Due-soon threshold
* Reporting/query architecture
* Export behavior
* Limitations
* Deferred workflow automation opportunities

---

# Deliverables

Produce:

* Evidence freshness model
* Control Evidence coverage read model
* Project Evidence summary
* Efficient server-side coverage queries
* Missing Required Evidence view
* Due Soon view
* Overdue view
* Unlinked Evidence view
* Improved scalable Evidence Browser
* Control coverage indicators
* Project Evidence overview
* Evidence inventory export
* Necessary database indexes
* Tests
* Documentation

---

# Success Criteria

A project user can quickly determine:

* Which controls require Evidence
* Which required controls have no eligible Evidence
* Which Evidence records are due soon
* Which Evidence records are overdue
* Which Evidence records are unlinked
* Whether a specific control has adequate Evidence coverage according to the defined Evidence Requirement model

The application:

* Does not treat Evidence coverage as equivalent to compliance
* Clearly distinguishes Required, Optional, and Not Required
* Derives freshness rather than mutating records based on time
* Does not count archived Evidence as active coverage
* Does not require manual browser refresh to see updated Evidence states
* Uses scalable server-side queries
* Preserves tenant and project isolation
* Does not expose storage-provider internals
* Does not redesign 03A–03C architecture

All tests pass.

Lint passes with zero warnings.

Production build passes.

No commits.

---

# Completion Report

At completion provide:

1. Executive summary
2. Architectural decisions made
3. Final coverage semantics
4. Final freshness semantics
5. Files added
6. Files modified
7. Database/index changes
8. Query/API contracts
9. Authorization behavior
10. UI/UX behavior
11. Export behavior
12. Tests added or modified
13. Remaining limitations
14. Recommendations for Milestone 04 / Assessment Management
15. Verification results:

* `npm test`
* `npm run lint`
* `npm run build`

Do not create commits.
