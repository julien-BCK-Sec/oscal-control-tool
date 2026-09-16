# Milestone 07A — SSP System Characteristics

## Status

Implemented.

## Purpose

Establish the canonical system-level information model required for future
human-readable System Security Plan generation.

Milestone 07A begins the Milestone 7 Human-Readable SSP workstream.

Milestone 6 is complete with v0.6.2 and remains focused on DoD Cloud Impact
Level 4 framework support and tailoring correctness.

Milestone 7 is a new product capability:

> Generate useful, human-readable security documentation from Control Freak's
> canonical project data without making OSCAL, a framework-specific template,
> or generated prose the product domain.

07A does **not** generate DOCX or PDF.

Its purpose is to ensure that the canonical project model contains enough
authoritative system-level information for a future SSP generator to consume.

---

# 1. Background

The SSP readiness assessment performed after Milestone 06B found that the
current Control Freak model is strong enough to represent:

- framework selection;
- framework requirements and control statements;
- implementation narratives;
- implementation status;
- evidence;
- control-level ownership metadata;
- review and collaboration workflow;
- NIST control and enhancement identity;
- DoD IL4 overlay provenance and tailoring semantics.

However, the canonical project domain contains very little structured
information about the system itself.

The current project metadata is essentially:

- system name;
- organization name;
- system description.

Important SSP information may appear inside implementation narratives or demo
prose, but prose is not an authoritative structured system model and cannot be
reliably consumed by document generation.

The existing OSCAL SSP exporter demonstrates the same limitation by using
placeholder or synthetic system-characteristics data.

A future human-readable SSP must therefore not be implemented as:

> control narratives → Word document

The system-level domain must be established first.

---

# 2. SSP Product Direction

The initial human-readable SSP will be a:

> **Control Freak System Security Plan**

Its information model should be informed primarily by current NIST
SP 800-18 Rev. 2 system-plan concepts and should also support the information
needed by the frameworks Control Freak currently supports.

The initial Control Freak SSP is **not**:

- an official FedRAMP certification package;
- a FedRAMP 2026 Certification Package Overview;
- a FedRAMP Security Decision Record;
- a DoD Cloud Provisional Authorization package;
- the DoD SSP Addendum;
- a CMMC certification artifact;
- an OSCAL document rendered into Word.

Future framework-specific exporters or package artifacts may consume the same
canonical domain.

OSCAL remains a separate machine-readable interchange/export path.

The canonical Control Freak domain must not become an OSCAL-shaped domain.

---

# 3. Architectural Principles

07A must preserve the following principles.

## 3.1 Canonical data before documents

Information that represents a fact about the system belongs in the canonical
Control Freak domain.

DOCX-specific information belongs in a future document/view model or renderer.

Do not add Word/template concepts to the project domain.

## 3.2 Framework-neutral system model

System characteristics should be modeled independently of NIST, CMMC, FedRAMP,
or DoD IL4 wherever the underlying fact is framework-neutral.

Examples:

- authorization boundary;
- environment of operation;
- system owner;
- information types;
- interconnections.

Framework-specific interpretation may consume those facts later.

## 3.3 Framework selection is not categorization

Selecting a framework does not establish an authoritative system
categorization.

For example:

`dod-cloud-il4-rev5`

means that the project is documenting against that framework.

It must not automatically mean:

> This system has been formally categorized, assessed, authorized, or approved
> at Impact Level 4.

Any categorization or impact-level information represented by Control Freak
must be explicitly modeled with appropriate provenance/meaning.

## 3.4 Tenant identity is not SSP organization identity

The Better Auth organization/tenant represents application tenancy and access
control.

It must not automatically be treated as the organization identified in an SSP.

An SSP organization profile and SSP roles are system documentation data.

## 3.5 Collaboration roles are not SSP roles

Control Freak workflow assignments such as:

- owner;
- reviewer;
- collaborator;

must not automatically become:

- system owner;
- authorizing official;
- ISSO;
- ISSM;
- control implementation responsibility;

or other SSP roles.

These concepts must remain distinct.

## 3.6 Do not build a CMDB

Control Freak is not becoming a general asset inventory or CMDB.

07A should model the system characteristics necessary to describe the system in
a security plan.

Detailed asset inventory, software inventory, network discovery, and similar
capabilities are out of scope unless a minimal representation is demonstrably
required for the canonical SSP model.

## 3.7 Missing information must remain missing

Do not infer authoritative SSP facts from:

- framework selection;
- implementation narratives;
- tenant membership;
- evidence;
- demo prose;
- workflow state.

If a value has not been explicitly documented, the canonical model should
represent it as absent.

Future document generation may render that absence as an explicit placeholder.

---

# 4. Architecture STOP — Canonical SSP System Model

Before implementation, inspect the current repository and produce a proposed
07A domain design.

This is the primary architecture STOP for the milestone.

Do not implement the schema or UI until this design is reviewed.

The proposal must answer the questions in Sections 4.1 through 4.8.

## 4.1 Project document evolution

Determine whether the system-characteristics domain should extend the existing
versioned project document.

The expected direction is likely:

`project_json schema v1 → schema v2`

but this is not predetermined.

Compare that approach against introducing dedicated relational tables.

Prefer the simplest architecture consistent with:

- tenant isolation;
- project versioning;
- restore semantics;
- validation;
- future SSP generation;
- future framework-specific exporters.

Explain the migration strategy for existing projects.

Existing projects must remain usable.

## 4.2 System identity

Determine the minimum canonical representation for:

- system name;
- system identifier;
- organization;
- system description;
- system purpose;
- system type if useful.

Avoid framework-specific identifiers unless there is a clear need.

## 4.3 System roles

Design a small system-level role model sufficient for SSP documentation.

Consider roles such as:

- system owner;
- authorizing official;
- security officer / ISSO / equivalent;
- other named accountable roles.

Do not hard-code a large federal personnel taxonomy if a smaller extensible
model is sufficient.

A role may need:

- role/type;
- name;
- title;
- organization;
- contact information.

Determine the appropriate minimum.

## 4.4 Authorization boundary and environment

Determine how Control Freak should represent:

- authorization/security boundary;
- environment of operation;
- system purpose/overview.

These should be canonical system facts rather than text reconstructed from
control narratives.

Do not attempt to create a graphical boundary editor in 07A.

## 4.5 Information types and categorization

Determine the minimum model for:

- information types;
- confidentiality impact;
- integrity impact;
- availability impact;
- overall security categorization where appropriate;
- DoD impact-level documentation where appropriate.

Be conservative.

Do not infer categorization from the selected framework.

Do not claim authorization or certification.

If different frameworks require different categorization concepts, separate
the canonical system facts from framework-specific interpretation.

## 4.6 Interconnections and external dependencies

Determine a minimal system-level representation for:

- external systems/services;
- interconnections;
- connection purpose;
- information exchanged;
- trust/dependency relationship where useful.

Do not implement a network modeling platform.

The goal is sufficient structured information to describe important system
relationships in an SSP.

## 4.7 Diagrams

Determine what 07A should do about:

- authorization boundary diagrams;
- architecture diagrams;
- data-flow diagrams.

The expected V1 direction is likely to support references/uploads later rather
than build a diagram editor.

Determine whether 07A needs any canonical diagram metadata now or whether this
can safely wait for the document-generation milestone.

## 4.8 Future consumers

Verify that the proposed model can reasonably support future:

- Control Freak human-readable SSP;
- NIST SP 800-18-shaped documentation;
- CMMC / NIST SP 800-171 SSP documentation;
- DoD IL4 system documentation;
- existing NIST OSCAL SSP export improvements;
- future framework-specific authorization artifacts.

Do not redesign the model around speculative future formats.

---

# 5. Expected 07A Information Scope

The architecture review should determine the exact schema.

At minimum, evaluate canonical representation of the following.

## Required 07A candidates

- system identifier;
- system name;
- organization profile;
- system description;
- system purpose;
- authorization/security boundary;
- environment of operation;
- key system roles;
- information types;
- security categorization / impact information;
- external systems or interconnection summaries.

## Optional candidates

Include only if they fit naturally without broadening the milestone:

- service model;
- deployment model;
- hosting model;
- system type;
- laws/regulations/policies references;
- diagram metadata/reference.

## Explicitly not required in 07A

- detailed hardware inventory;
- detailed software inventory;
- ports/protocols/services inventory;
- cryptographic module inventory;
- full network topology;
- automatic architecture discovery;
- CMDB functionality;
- control inheritance;
- control origination;
- customer/CSP/shared responsibility;
- per-ODP resolution;
- project-authored ODP values;
- POA&M;
- assessment results;
- authorization decisions;
- approval/signature workflow;
- DOCX;
- PDF;
- AI-generated SSP prose.

---

# 6. UI Requirements

After architecture approval, provide a straightforward way to author the new
system characteristics.

Prefer extending the existing Project details experience rather than creating
an unnecessarily complex new application area.

The UI should:

- clearly distinguish system information from framework selection;
- make optional/unfilled information obvious;
- avoid compliance or authorization claims;
- preserve existing sentence-case UI conventions;
- work for NIST, CMMC, and IL4 projects;
- remain usable for projects that do not yet contain the new fields.

Do not require every SSP field before a project can be used.

Control authoring must continue to work even when system characteristics are
incomplete.

---

# 7. Persistence and Versioning

New canonical system-characteristics data must participate correctly in
project persistence and versioning.

Verify:

- create;
- read;
- update;
- migration;
- validation;
- named version creation;
- version restore;
- tenant isolation;
- demo bootstrap;
- normal deployment mode.

If the project document schema changes, introduce an explicit schema version
and deterministic migration behavior consistent with existing architecture.

Do not silently discard new fields during restore.

---

# 8. Demo Data

Update canonical demo data so at least one project demonstrates realistic
system-characteristics authoring.

The Snow Goose / Strategic Goose Operations Platform demo is a useful candidate
because existing prose already describes many system concepts.

However:

- do not parse existing narratives to derive canonical values;
- explicitly populate the new structured fields;
- keep demo values clearly fictional;
- do not change framework semantics.

The demo should help validate that the information model can describe a
realistic cloud system without becoming a CMDB.

---

# 9. Existing OSCAL Export

07A is not an OSCAL-export milestone.

However, inspect the existing NIST OSCAL SSP exporter after the canonical
system model is implemented.

Where the new canonical data can replace an existing synthetic or placeholder
value safely and unambiguously, propose or implement that improvement if it is
small and does not broaden the milestone.

Do not:

- redesign OSCAL export;
- enable IL4 OSCAL export;
- add CMMC OSCAL export;
- use OSCAL as the canonical SSP domain;
- invent missing OSCAL values.

If consuming the new data requires material OSCAL design work, document it for
later instead.

---

# 10. Per-ODP Relationship

Per-ODP parameter resolution remains a known limitation but is not a
prerequisite for 07A or the first honest human-readable SSP.

Current control-level effective-assignment logic must not be treated as a
complete per-ODP resolution model.

A future SSP V1 may:

- preserve the authoritative catalog statement;
- show unresolved ODPs explicitly;
- show framework assignments as sourced information;
- avoid claiming that a fully resolved effective statement has been produced.

Before Control Freak synthesizes fully substituted control requirements or
FedRAMP-style parameter tables, a later milestone must introduce:

- framework-derived resolution per ODP;
- provenance per ODP;
- project-authored organization-defined parameter values;
- explicit unresolved/conflict/DSPAV states.

Do not implement that work in 07A.

---

# 11. Future Milestone Direction

07A should leave the repository ready for the following expected sequence.

## 07B — Human-Readable SSP DOCX V1

Expected scope:

- SSP document/view model;
- deterministic DOCX renderer;
- Control Freak-owned SSP format;
- system-characteristics sections;
- framework/control implementation sections;
- explicit missing-data placeholders;
- generation provenance;
- NIST, CMMC, and IL4 projects;
- no false compliance/authorization claims.

OSCAL remains a sibling exporter.

## 07C — Parameter and Control Fidelity

Expected scope:

- per-ODP framework resolution;
- project-authored ODP values;
- per-ODP provenance;
- safe requirement substitution;
- improved SSP parameter presentation;
- evaluate control origination/inheritance/shared responsibility.

These boundaries may be refined based on what is learned during 07A and 07B.

---

# 12. Validation Requirements

After architecture approval and implementation, validate at minimum:

- existing tests remain green;
- new domain/schema tests;
- migration tests for existing projects;
- persistence round-trip;
- version snapshot/restore;
- tenant isolation;
- demo bootstrap idempotence;
- relevant UI tests;
- lint;
- production build;
- repository diff check.

Add regression coverage demonstrating that:

1. an existing pre-07A project still loads;
2. new system-characteristics fields persist;
3. named versions preserve the fields;
4. restoring a version restores the fields;
5. framework selection does not automatically populate categorization;
6. tenant organization membership does not automatically become SSP
   organization/roles;
7. missing fields remain absent rather than being inferred.

---

# 13. Documentation

Update durable documentation as appropriate, including:

- current state;
- architecture;
- decisions/ADRs;
- roadmap;
- user guide;
- this milestone document.

Record the SSP product-direction decision durably.

Document clearly that:

- Control Freak's future SSP is a human-readable product artifact;
- OSCAL is a separate export/interchange representation;
- framework selection is not authorization/categorization;
- SSP organization/roles are distinct from application tenancy/workflow;
- per-ODP fidelity remains future work.

---

# 14. Workflow

Use the simplified milestone workflow.

## Phase 1 — Architecture

Inspect the actual repository and authoritative sources needed to validate the
proposed domain.

Produce the 07A architecture proposal.

STOP only for the consequential architecture decisions identified in Section 4.

Do not implement before that review.

## Phase 2 — Implementation

After architecture approval:

- implement the approved model;
- migrate existing data safely;
- implement UI authoring;
- update demo data;
- add tests;
- update documentation;
- run validation;
- self-review the complete diff;
- correct minor implementation/test/documentation issues discovered during
  self-review;
- commit;
- push;
- report.

Do not introduce separate approval gates for routine Git mechanics.

STOP during implementation only if a genuinely consequential issue is
discovered, such as:

- approved schema cannot represent a required concept;
- migration would be destructive;
- tenant/security boundary changes;
- authoritative requirements contradict the approved design;
- scope would need to expand materially;
- a new architecture decision is required.

Production deployment remains a separate release decision unless explicitly
authorized.

---

# 15. Definition of Done

Milestone 07A is complete when:

1. The Control Freak SSP V1 product identity is recorded architecturally.
2. Canonical system-characteristics data is modeled independently of document
   rendering.
3. Existing projects migrate/load safely.
4. Users can author the approved system characteristics.
5. System information is clearly separated from framework selection,
   application tenancy, and collaboration workflow.
6. Framework selection does not imply categorization or authorization.
7. New data participates correctly in project versioning and restore.
8. Demo data demonstrates the model.
9. Existing framework/control functionality remains intact.
10. Existing OSCAL behavior is not regressed.
11. Tests, lint, build, and diff validation pass.
12. Durable documentation is updated.
13. The resulting canonical domain is sufficient for 07B to begin building a
    human-readable SSP document/view model and DOCX renderer without inventing
    system-level facts.

---

# 16. Out of Scope

Explicitly out of scope for 07A:

- DOCX generation;
- PDF generation;
- official FedRAMP template generation;
- FedRAMP 2026 CPO/SDR generation;
- DoD SSP Addendum generation;
- complete DoD PA package generation;
- per-ODP resolution;
- project-authored ODP values;
- control inheritance/origination modeling unless architecture review proves
  it is unavoidable for the system-characteristics domain;
- POA&M generation;
- SAP/SAR generation;
- continuous-monitoring package generation;
- automated diagrams;
- CMDB/asset discovery;
- AI-generated SSP narratives;
- digital signatures;
- IL5/IL6;
- IL4 OSCAL SSP export.

---

# 17. First Action

Begin with the Phase 1 architecture review.

Do not implement yet.

Return:

## 07A Architecture Proposal

### Current-state findings
Relevant existing domain/schema/versioning/UI behavior.

### Proposed canonical model
Exact proposed types/schema and field semantics.

### Persistence strategy
Project document schema versioning/migration approach and rationale.

### System roles model
Exact proposed representation.

### Categorization model
Exact proposed representation and safeguards against inference from framework
selection.

### Interconnection model
Minimum proposed representation.

### Diagram handling
What belongs in 07A versus later.

### Existing OSCAL impact
What, if anything, should consume the new canonical fields during 07A.

### UI proposal
Where and how the fields will be authored.

### Migration/versioning behavior
Existing project, named-version, restore, and demo behavior.

### Decisions requiring approval
Only consequential decisions.

### Risks / unresolved questions

### Recommended implementation plan
Work packages after architecture approval.

STOP after the architecture proposal.