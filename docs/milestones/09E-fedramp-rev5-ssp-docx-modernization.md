# Milestone 09E — General SSP DOCX Modernization

**Status:** Implemented and **manually accepted** (final acceptance 2026-11-10)

**Acceptance date:** 2026-11-10 (final); initial presentation acceptance 2026-11-03

**Type:** Implementation

**Depends on:** Milestones 07A–07C, 09D; ADR-030, ADR-031, ADR-032, ADR-035

**Implementation authorized:** Yes

**Production deployment authorized:** No

**Acceptance STOP:** Completed — accepted; do not tag, release, or deploy in this closeout

### Closeout record

1. **Phase 1 architecture** approved 2026-11-03 (D1–D10, including the D8
   clarification that framework labeling uses the actual selected framework
   name). **ADR-035** accepted. Research:
   `docs/research/09E-fedramp-rev5-ssp-docx-architecture-review.md`. FedRAMP
   Rev. 5 Word references pinned under `vendor/fedramp/ssp-rev5/`.
2. **Phase 2 implementation** modernized the general SSP Word export to
   layout **`cf-ssp-docx` 2.0** in `src/export/ssp-docx/`. Formal cover,
   purpose/scope with explicit deferrals, Control Summary Information +
   solution-response control entries, and 09D-inspired visual language.
   Post-review presentation polish fixed orphaned response banners,
   redundant requirement duplication, repeated parameter-label readability,
   grammar, and TOC self-reference. Sample tooling:
   `scripts/generate-ssp-docx-samples.ts`.
3. **Canonical synthesis**, parameter-resolution semantics (ADR-032),
   framework populations, export authentication
   (`GET /api/projects/[projectId]/exports/ssp.docx`, `project.read`), and
   the 09D IL4 Addendum (`cf-il4-addendum-docx` 1.0) are unchanged. No
   schema migration. No official FedRAMP Word template fill.
4. **Final manual acceptance completed** (2026-11-10) for the
   `cf-ssp-docx` 2.0 general SSP renderer after review of both
   representative sample documents:
   - NIST Moderate: Strategic Goose Operations Platform System Security Plan
   - DoD IL4: Snow Goose Cloud Impact Level 4 System Security Plan
   Sample regeneration remains available via
   `scripts/generate-ssp-docx-samples.ts`. Generated sample binaries are not
   committed.
5. **Milestone accepted.** Not tagged, released, or deployed. Production
   remains **v0.7.0** until a later authorized release includes this work.

### Acceptance principle

Generated Control Freak Word SSPs are **professional, editable starting
points**. Layout and pagination vary with project content (control
population size, narrative length, tables, and Evidence density). Minor
human formatting adjustments before distribution or submission are an
**expected characteristic** of Word export, not automatically a renderer
defect. Reviewers should distinguish content or labeling defects from
ordinary Word pagination and field-refresh behavior.

### Known non-blocking limitations

- Occasional Control Summary Information / long-entry pagination splits can
  still occur in Word even when the solution banner stays with the start of
  the narrative cell.
- Word still refreshes the table of contents and page numbers on open.
  Cached TOC entries are not authoritative page numbers.
- Official FedRAMP package fields remain deferred (leveraged services,
  marketplace-shaped external-service tables, diagrams, ports/protocols,
  cryptographic-module tables, separation-of-duties matrices, approvals /
  signatures, appendices B–Q, per-control Responsible Role, and Control
  Origination checkboxes). They are named in purpose/scope and are not
  printed as empty official-looking tables.
- Filling an official FedRAMP Word template remains a separate roadmap
  authorization-package track (ADR-035).

## Objective

Modernize Control Freak's existing human-readable System Security Plan (SSP) Word export into a professional, structured, assessment-oriented document.

The resulting document should follow the recognizable organization and presentation conventions of the FedRAMP Rev. 5 SSP while remaining a Control Freak-generated, framework-aware SSP.

This milestone builds on the existing 07A, 07B, 07C, and 09D work. It does not replace the canonical SSP data model or introduce a competing control interpretation.

## Background

Milestone 07B established a functional human-readable SSP DOCX export.

Milestone 07C established canonical parameter-resolution behavior, including source conflicts and unresolved assignments.

Milestone 09D established a more formal DOCX presentation for the DoD IL4 SSP Addendum.

The 09D Addendum is a delta companion to the broader SSP. The general SSP must remain capable of presenting the full applicable framework population, including the FedRAMP Moderate controls that are not repeated in the IL4 Addendum.

## Scope

### In scope

- Review the current 07B general SSP renderer and canonical SSP view model.
- Identify and review the authoritative FedRAMP Rev. 5 SSP template.
- Establish a reproducible reference to the selected template and its version.
- Design a formal SSP cover and document identity section.
- Improve document structure, headings, control-family organization, tables, and pagination.
- Present available system characteristics, security categorization, roles, boundaries, and interconnections.
- Improve control implementation narrative presentation.
- Include documentation status and linked evidence where supported.
- Preserve canonical parameter values, unresolved assignments, conflicts, and provenance.
- Maintain framework-aware behavior for selected frameworks (actual framework name; NIST Moderate is not FedRAMP Moderate).
- Maintain compatibility with the existing authenticated export workflow.
- Reuse existing DOCX utilities and appropriate 09D presentation patterns.

### Out of scope

- Replacing the existing canonical SSP synthesis pipeline.
- Introducing a separate FedRAMP-specific source of control truth.
- Reinterpreting or silently resolving parameter conflicts.
- Changing framework membership or control populations.
- Automatically asserting compliance, assessment results, or authorization.
- Filling an official FedRAMP DOCX template without an explicit architectural decision.
- Adding invented system metadata or implementation narratives.
- Changing the 09D IL4 Addendum.
- Release, deployment, or production migration.

## Design principles

### 1. Canonical data remains authoritative

The general SSP must continue to consume the established canonical SSP view model.

The DOCX renderer is responsible for presentation, not control interpretation.

### 2. Framework-aware output

Framework labeling uses the **actual selected framework** title and identity.
NIST SP 800-53 Rev. 5 Moderate projects are labeled as NIST Moderate
documentation. They are not equated with FedRAMP Moderate and must not imply
FedRAMP authorization.

For DoD IL4 projects, retain accurate IL4 framework labeling. The general SSP
presents the full IL4 population; the 09D Addendum remains a separate companion.

Other supported frameworks must not be mislabeled as FedRAMP-authorized or forced into unsupported FedRAMP-specific sections.

### 3. Recognizable SSP presentation

Use the authoritative FedRAMP Rev. 5 SSP as a structural and visual reference.

Prioritize:
- Formal document identity
- Logical section hierarchy
- System characteristics
- Control-family grouping
- Control requirements
- Implementation responses
- Evidence references
- Readable assignment and parameter information
- Consistent tables, headers, footers, and page breaks

Do not copy official logos, signatures, classification markings, or authorization statements.

### 4. Implementation narratives are primary

The document should emphasize how controls are implemented.

Diagnostic details, source metadata, and provenance must remain available where necessary without overwhelming the main response.

Undocumented narratives should use concise, explicit placeholders rather than large empty response areas.

### 5. Fail closed

Missing assignments, unresolved parameters, source conflicts, and unavailable system metadata must remain visibly unresolved.

Do not invent authoritative values or silently select between conflicting sources.

### 6. No unnecessary schema changes

The initial design should map existing project data into the proposed SSP structure.

Any missing fields must be identified explicitly.

Schema additions require separate approval before implementation.

## Accepted document structure (`cf-ssp-docx` 2.0)

1. Cover and document identification — **Supported / Generic**
2. Document status and generation information — **Supported / Generic**
3. Purpose and scope (framework-aware; lists deferrals) — **Supported / Generic**
4. Table of contents — **Supported / Generic**
5. System identification and description — **Supported / Generic**
6. System environment and authorization boundary — **Supported / Generic**
7. Security categorization and information types — **Supported / Generic**
8. System roles and responsibilities — **Partial / Generic** (no addresses)
9. System interconnections — **Partial / Generic** (not FedRAMP leverage tables)
10. Security control implementation — **Supported / Generic**
11. Supporting references and generation record — **Supported / Generic**

**Explicitly deferred (named once in scope; no empty official shells):** leveraged FedRAMP-authorized services; marketplace-shaped external-service tables; diagrams; ports/protocols; cryptographic-module tables; separation-of-duties matrices; approvals/signatures/appendices B–Q; per-control Responsible Role and Control Origination checkboxes.

## Renderer architecture

```text
unchanged synthesis:  src/ssp/buildSspDocument (+ ADR-032 resolution)
changed presentation: src/export/ssp-docx → layout cf-ssp-docx 2.0
unchanged delivery:   GET /api/projects/{id}/exports/ssp.docx (project.read)
unchanged companion:  cf-il4-addendum-docx 1.0
```

## Acceptance criteria

| Criterion | Status |
| --- | --- |
| 1. Authoritative FedRAMP Rev. 5 SSP reference reviewed and recorded | **Met** |
| 2. Proposed structure architecturally approved | **Met** (ADR-035) |
| 3. Canonical SSP synthesis and parameter-resolution unchanged unless approved | **Met** |
| 4. Generated DOCX professional, readable, structurally appropriate | **Met** (final manual acceptance 2026-11-10) |
| 5. Framework-aware labeling (actual framework name; NIST ≠ FedRAMP Moderate) | **Met** |
| 6. IL4 Addendum remains a separate export | **Met** |
| 7. Undocumented values and unresolved assignments not fabricated or hidden | **Met** |
| 8. Control populations correct and complete for the selected framework | **Met** |
| 9. Export continues to enforce authentication and project-access controls | **Met** |
| 10. Automated tests, lint, build, and diff checks pass | **Met** at closeout |
| 11. Representative generated DOCX files available for manual visual review | **Met** (NIST Moderate + DoD IL4 samples reviewed) |
| 12. Manual acceptance recorded before milestone closeout | **Met** (final 2026-11-10) |

## Execution sequence

### Phase 1 — Architecture and document-design review

**Status: complete and approved (2026-11-03).**

### Phase 2 — Implementation

**Status: complete (2026-11-03), including post-review presentation polish.**

### Phase 3 — Closeout

**Status: complete (final acceptance 2026-11-10).** Manual acceptance of
`cf-ssp-docx` 2.0 and both reviewed samples recorded, including the
editable-starting-point acceptance principle. Project documentation
updated. Do not push, tag, release, or deploy without separate
authorization.

## Accepted architectural decisions (ADR-035)

| ID | Decision | Accepted proposal |
| --- | --- | --- |
| D1 | Reference disposition | Legacy FedRAMP Rev. 5 Word SSP + Appendix A Moderate are structural/presentation references only. Do not fill them. Not Consolidated Rules 2026 authority. |
| D2 | Generation approach | Continue programmatic Control Freak layout. Official-template population stays on the separate roadmap track. |
| D3 | Layout identity | **`cf-ssp-docx` 2.0**; document type remains Control Freak System Security Plan. |
| D4 | Presentation pattern | Reuse 09D formal cover/visuals and Control Summary + solution-banner rhythm without IL4 delta coupling. |
| D5 | Unsupported sections | One scope statement for deferrals; no empty official FedRAMP tables. |
| D6 | Schema changes | None for this implementation pass. |
| D7 | Synthesis / auth contract | Unchanged (`buildSspDocument`, ADR-032, `project.read` export). |
| D8 | Framework labeling | Use the **actual selected framework name**. Do not equate NIST Moderate with FedRAMP Moderate or imply FedRAMP authorization. DoD IL4 retains accurate IL4 labeling and the separate 09D Addendum relationship. |
| D9 | 09D relationship | No 09D changes; general SSP remains the full-population companion. |
| D10 | Sample tooling | General-SSP sample generator for NIST Moderate and DoD IL4. |

## Current decision gate

Milestone **09E is accepted** (final manual acceptance 2026-11-10). Phase 3
closeout is complete.

Do **not** push, tag, release, or deploy without separate authorization.
Production remains **v0.7.0** until a later authorized release includes this
work (and any other accepted milestones packaged with it).
