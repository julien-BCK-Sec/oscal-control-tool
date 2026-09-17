# Milestone 07B — Human-Readable SSP DOCX V1

## Status

Implemented and manually accepted.

Local demo smoke (2026-09-17): canonical demo environment bootstrapped;
demo authentication succeeded; **Export human-readable SSP (Word)** was
initiated from Project details; the DOCX downloaded and opened. That
verifies the end-to-end 07B architecture (canonical data → document/view
model → `cf-ssp-docx` layout → renderer → authenticated download). The
V1 layout is functional and is not the final desired presentation;
substantial template redesign is deferred and is not a 07B blocker.

## Purpose

Generate the first useful human-readable System Security Plan from Control
Freak's canonical project data.

Milestone 07A established the canonical system-characteristics domain required
for SSP generation.

Milestone 07B consumes that domain and introduces:

- an SSP document/view model;
- a deterministic DOCX generation pipeline;
- a Control Freak-owned human-readable SSP format;
- explicit completeness/placeholders;
- system-characteristics sections;
- framework/control implementation sections;
- generation provenance.

The resulting document must be useful to a human security practitioner without
claiming to be an official FedRAMP, DoD, CMMC, or other authorization package.

07B must not redesign the canonical product domain around Word, OSCAL, or a
framework-specific government template.

---

# 1. Background

Control Freak currently has several distinct layers of security-plan data.

## Canonical project data

Milestone 07A introduced `project_json` schema v2 with structured SSP system
characteristics including:

- system identity;
- SSP organization;
- system overview;
- authorization boundary;
- environment of operation;
- system roles;
- information types;
- optional FIPS 199 CIA categorization;
- optional DoD cloud impact-level assertion;
- interconnections;
- operational status.

These are canonical facts about the documented system.

## Control implementation data

Control Freak also represents:

- framework selection;
- framework controls/requirements;
- NIST controls and enhancements;
- CMMC requirements;
- DoD IL4 controls and GRRs;
- implementation narratives;
- implementation status;
- control metadata;
- Evidence;
- DoD IL4 overlay/provenance information.

## Machine-readable export

Control Freak has an OSCAL 1.2.2 SSP exporter for supported NIST SP 800-53
projects.

OSCAL remains a sibling machine-readable export path.

The human-readable SSP must not use OSCAL as its intermediate or canonical
representation.

---

# 2. Product Definition

The 07B output is a:

> **Control Freak System Security Plan**

It is a human-readable security-plan document generated from canonical Control
Freak project data.

Its information architecture should be informed primarily by current NIST
SP 800-18 Rev. 2 system-plan concepts while remaining useful for the
frameworks Control Freak currently supports.

The document may identify the framework against which the project is being
documented.

For example:

- NIST SP 800-53 Low;
- NIST SP 800-53 Moderate;
- NIST SP 800-53 High;
- CMMC Level 2;
- DoD Cloud Impact Level 4 / FedRAMP+ documentation framework.

Framework identification must not become a claim that the system is:

- compliant;
- certified;
- assessed;
- authorized;
- granted an ATO;
- granted a DoD PA;
- approved at a particular impact level.

The document must distinguish user-authored system facts from framework
selection.

---

# 3. What 07B Is Not

07B does not generate:

- an official FedRAMP SSP;
- a FedRAMP 2026 Certification Package Overview;
- a FedRAMP Security Decision Record;
- a DoD SSP Addendum;
- a complete DoD Cloud authorization package;
- a CMMC assessment result;
- an OSCAL document rendered as Word;
- a POA&M;
- a SAP;
- a SAR;
- a continuous-monitoring package.

The Control Freak SSP may later become a source for framework-specific
documents, but those outputs require separate product and template decisions.

---

# 4. Core Architecture

The human-readable SSP pipeline should maintain four conceptual layers.

## 4.1 Canonical product/domain model

Existing Control Freak data.

Examples:

- ProjectMetadata;
- ControlImplementation;
- framework-derived controls;
- framework-derived overlay metadata;
- Evidence references.

This layer represents facts and authored implementation content.

DOCX concepts must not be added here merely because the renderer needs them.

## 4.2 SSP document/view model

A new deterministic representation of what the generated SSP means.

This layer should translate canonical project/framework data into document
semantics such as:

- document metadata;
- ordered SSP sections;
- system-characteristics sections;
- control/requirement sections;
- framework provenance;
- unresolved-data indicators;
- completeness information;
- Evidence references;
- generation provenance.

The view model must not contain WordprocessingML or other DOCX implementation
details.

It should be testable independently from the DOCX renderer.

## 4.3 Template/layout adapter

Responsible for the Control Freak SSP presentation structure.

Examples:

- document title;
- section ordering;
- heading hierarchy;
- tables;
- labels;
- header/footer content;
- page-break rules;
- document version/template identity.

This layer may evolve independently from canonical project data.

## 4.4 DOCX renderer

Responsible only for producing a valid Word document from the SSP document
model/layout.

Examples:

- DOCX package creation;
- WordprocessingML;
- styles;
- tables;
- headings;
- page breaks;
- headers/footers;
- TOC field;
- document properties.

The renderer must not decide security semantics.

---

# 5. Architecture STOP — DOCX and Document Model

Before implementation, inspect the current repository and propose the exact
07B architecture.

This is the primary architecture STOP for the milestone.

Do not implement DOCX generation until this proposal is reviewed.

At minimum, resolve the questions in Sections 5.1 through 5.8.

## 5.1 DOCX generation approach

Evaluate appropriate Node/TypeScript DOCX generation approaches for the
current Next.js architecture.

Consider:

- deterministic output;
- maintainability;
- support for tables/styles/headers/footers/TOC fields;
- ability to test generated document structure;
- server-side compatibility;
- dependency maturity;
- security implications;
- future template support;
- future PDF conversion.

Do not assume a library before inspecting current dependencies and available
options.

Avoid adding a large office-document stack when a smaller solution is
sufficient.

## 5.2 SSP document/view model

Propose the exact TypeScript representation used between the Control Freak
domain and the renderer.

The model should be sufficiently semantic that:

- DOCX is only one possible renderer;
- a future PDF renderer could consume the same model;
- tests can validate document meaning without parsing DOCX;
- framework-specific additions can be represented without contaminating the
  canonical project domain.

Do not make the view model a generic arbitrary-document engine.

It exists specifically to represent a Control Freak SSP.

## 5.3 Template strategy

Determine whether V1 should:

- construct the Control Freak document programmatically;
- use a pinned Control Freak-owned DOCX template;
- use a hybrid approach.

Do not adopt a legacy FedRAMP Word template as the Control Freak domain or
default V1 document identity.

If an external template is proposed, identify:

- source;
- version;
- license/use considerations;
- hash/version pinning;
- maintenance implications.

## 5.4 Generation provenance

Determine what provenance should appear in the generated document and/or
generation metadata.

At minimum consider:

- Control Freak document type;
- template/layout version;
- project name;
- project revision/version;
- selected framework;
- generation timestamp;
- Control Freak application/release version if available.

Do not invent authorization, approval, or assessment metadata.

## 5.5 Completeness model

Determine how the document/view model should represent missing canonical
information.

The generator must distinguish:

- documented;
- not documented;
- not applicable where explicitly authored;
- unresolved framework parameter;
- source conflict;
- authoritative value required;
- conditional framework requirement.

Do not infer that an empty list means "none exist."

For example:

an empty interconnection list means:

> Interconnections have not been documented in Control Freak.

It does not mean:

> The system has no interconnections.

## 5.6 Control section structure

Determine the minimum useful control/requirement representation for V1.

Consider:

- control/requirement ID;
- title;
- family/domain;
- source statement;
- enhancement identity;
- implementation narrative;
- implementation documentation status;
- owner label where available;
- Evidence titles/references;
- framework provenance;
- IL4 overlay notes;
- GRRs.

Do not use the existing control-level Effective Requirement presentation as if
it were a complete resolved requirement.

## 5.7 Framework handling

Determine how one document model supports:

- NIST SP 800-53 Low;
- NIST SP 800-53 Moderate;
- NIST SP 800-53 High;
- CMMC Level 2;
- DoD Cloud IL4.

Prefer shared document structure with small framework-specific adaptations
rather than five independent generators.

Do not force CMMC requirements into NIST-specific terminology.

Do not hide IL4 GRRs because they do not have NIST control identities.

## 5.8 Persistence

Determine whether generating an SSP requires persistent generation records in
07B.

The expected direction is that the DOCX can be generated on demand without
adding a new persistence model unless there is a concrete need for generation
history.

If generation records are proposed, justify why they are canonical operational
data rather than information derivable at generation time.

Do not add database tables merely to record that someone downloaded a file.

---

# 6. SSP V1 Document Structure

The architecture review should refine the exact layout.

The first document should generally contain the following logical sections.

## Cover / document identity

At minimum:

- System Security Plan;
- system name;
- system short name if documented;
- system identifier if documented;
- SSP organization if documented;
- selected documentation framework;
- generated date/time;
- Control Freak SSP template/layout version.

The cover must make the document identity clear without claiming official
government-template status.

## Document status / completeness notice

Include a concise explanation that:

- the document reflects information recorded in Control Freak at generation
  time;
- missing information is explicitly identified;
- framework selection is not evidence of authorization/certification;
- unresolved framework values remain unresolved.

Do not fill the document with repeated legalistic disclaimers.

## Table of contents

Provide a Word-compatible table of contents field if practical.

The architecture proposal should determine whether Word must refresh the field
when the document opens.

## 1. System identification and overview

Include available canonical information such as:

- system name;
- short name;
- system identifier;
- SSP organization;
- system overview;
- operational status.

## 2. System roles

Render documented SSP roles.

Do not render Better Auth membership or collaboration assignments.

Incomplete draft role entries must not be presented as complete accountable
roles.

## 3. Authorization boundary and environment

Include:

- authorization boundary;
- environment of operation.

Missing values must receive explicit placeholders.

## 4. Information types and security categorization

Include:

- information types;
- per-information-type CIA where authored;
- system CIA categorization where authored;
- derived overall/high-water impact only if the architecture approves
  displaying it and all required inputs exist;
- categorization rationale;
- DoD cloud impact-level assertion where authored.

Any derived value must be labeled as derived.

DoD impact level must not be described as a PA, ATO, or authorization.

## 5. Interconnections

Render documented SSP-level interconnections.

Include available:

- name;
- external organization;
- purpose/description;
- information exchanged;
- direction;
- security notes.

An empty list must render as not documented rather than no interconnections.

## 6. Security requirements / control implementations

Render all items in the selected framework.

For NIST:

- base controls;
- enhancements.

For CMMC:

- CMMC requirement identity;
- NIST origin/reference where appropriate and already canonical.

For IL4:

- NIST controls;
- enhancements;
- DoD IL4 overlay/provenance information;
- GRRs.

The architecture review may divide this into family/domain subsections.

## Appendices / document metadata

V1 may include a small generated-document metadata appendix if useful.

Do not create fake approval/signature or assessment sections.

---

# 7. Missing Data and Placeholder Rules

Missing information must be visible and deterministic.

Use concise placeholders such as:

> [Not yet documented: Authorization boundary]

or another architecture-approved convention.

The placeholder system must distinguish missing data from authored values.

Do not persist placeholder text into canonical project data.

Do not turn placeholders into implementation narratives.

For collections:

- empty `systemRoles` = roles not documented;
- empty `informationTypes` = information types not documented;
- empty `interconnections` = interconnections not documented.

For optional assertions:

- null security categorization = categorization not documented;
- null DoD cloud impact level = DoD cloud impact level not documented.

The generator must never infer these from framework selection.

---

# 8. ODP and Effective Requirement Handling

Per-ODP resolution is deliberately deferred to Milestone 07C.

07B must therefore avoid producing control text that appears more resolved than
the canonical framework model actually supports.

For NIST/IL4 controls containing ODPs:

- preserve the authoritative source statement;
- preserve parameter identity where available;
- identify unresolved organization-defined parameters;
- show available framework assignment information separately and with
  provenance;
- do not substitute control-level assignment prose into every ODP;
- do not imply that a complete effective statement has been generated.

Where a framework-derived assignment exists only at control level, render it
as a clearly labeled sourced framework assignment/note.

Examples of semantic states that may need to be displayed include:

- FedRAMP base inherited for IL4;
- DoD IL4 adjustment;
- DoD permits FedRAMP value;
- CSP/organization-defined;
- authoritative DSPAV value required;
- source conflict;
- conditional applicability.

Do not resolve restricted DSPAV values.

Do not choose a winner for source conflicts.

Do not use `renderAuthoringRequirement()` or equivalent presentation helpers
as the SSP source of truth unless the architecture review proves they preserve
these rules.

---

# 9. Implementation Status

Control Freak currently has implementation-related status concepts with
different meanings.

07B must not silently collapse:

- implementation narrative status;
- ControlRecord workflow/review status;
- Evidence coverage;
- project completion percentage.

The SSP may include the authored implementation narrative status if it is
clearly labeled as documentation/implementation status and mapped
deterministically.

The architecture proposal must define the exact mapping/copy.

Do not render:

- review approval;
- Evidence coverage;
- completion percentage;
- collaboration status;

as compliance, assessment, authorization, or control effectiveness.

Do not create a new canonical status vocabulary in 07B unless architecture
review demonstrates it is required.

---

# 10. Evidence References

Evidence is canonical operational data but binary Evidence embedding is not
required in V1.

The SSP may reference linked Evidence records.

At minimum consider displaying:

- Evidence title;
- Evidence type/category if useful;
- relevant reference/identifier if already canonical.

Do not claim that Evidence has been assessed or validated merely because it is
linked.

Do not export internal Evidence coverage calculations as compliance results.

Do not embed Evidence binaries in the DOCX in 07B.

---

# 11. DOCX Requirements

The generated `.docx` should be a professional, readable security document.

At minimum support:

- title/cover page;
- consistent typography;
- heading hierarchy;
- numbered sections;
- tables;
- page breaks;
- headers and/or footers;
- page numbers if practical;
- generated-document metadata;
- Word-compatible TOC behavior;
- readable control sections;
- deterministic placeholder styling;
- framework/control identifiers that remain easy to scan.

Avoid decorative design that reduces usability as a working security document.

The document should remain usable when:

- system characteristics are largely empty;
- implementation narratives are incomplete;
- a project contains hundreds of controls;
- an IL4 project contains all 345 framework items.

---

# 12. Determinism

Document generation must be deterministic given explicitly controlled
generation inputs.

Tests must not depend on:

- current wall-clock time;
- random UUID generation;
- ZIP entry timestamps;
- unstable iteration ordering;
- environment-specific metadata.

Inject or normalize:

- generation timestamp;
- document IDs where required;
- template/layout version;
- ordering.

If the DOCX library itself introduces nondeterministic package metadata,
determine whether byte-for-byte determinism is practical.

At minimum, semantic document content must be deterministic.

If byte-for-byte determinism is not reasonably achievable, document that
limitation and test normalized DOCX structure instead.

Do not weaken semantic determinism merely to satisfy byte-level output.

---

# 13. File Naming

Generated filenames should be predictable and filesystem-safe.

The architecture proposal should define a convention such as:

`<system-name>-system-security-plan.docx`

or:

`<system-name>-ssp-<date>.docx`

Do not include sensitive system data beyond what is necessary for useful file
identity.

Filename generation must sanitize invalid filesystem characters.

---

# 14. Export UI

Add human-readable SSP export in a logical project-level location.

The exact UI should be proposed during architecture review.

Likely options include:

- Project details Export section;
- a dedicated Export action if the existing UI warrants it.

The UI should distinguish:

- Human-readable SSP (DOCX)
- OSCAL SSP (JSON), where available

Do not describe the human-readable SSP as OSCAL.

Do not describe either export as proof of compliance or authorization.

Generation should not require all SSP fields to be complete.

Where practical, show users that missing information will appear as
placeholders rather than blocking export.

---

# 15. Framework-Specific V1 Behavior

## NIST SP 800-53

Include:

- selected baseline identity;
- controls;
- enhancements;
- authoritative statements;
- implementation narratives;
- status;
- available Evidence references;
- unresolved ODP indication.

## CMMC Level 2

Include:

- CMMC requirement identity;
- requirement statement;
- NIST origin/reference where already available canonically;
- implementation narrative;
- status;
- Evidence references.

Do not call CMMC requirements "controls" where that would misrepresent the
canonical framework terminology.

Do not claim assessment or certification status.

## DoD Cloud IL4

Include:

- IL4 framework identity;
- NIST controls/enhancements;
- GRRs;
- FedRAMP/DoD overlay provenance;
- current control-level tailoring/assignment information;
- explicit DSPAV/conflict/conditional states where applicable;
- implementation narratives;
- Evidence references.

Do not generate the DoD SSP Addendum.

Do not claim PA/ATO.

Do not synthesize fully resolved ODP text.

---

# 16. Security and Privacy

SSP documents can contain sensitive architecture and system information.

07B must review:

- authorization on the export endpoint/action;
- tenant isolation;
- server-side generation;
- temporary-file behavior;
- logging;
- filename handling;
- error handling.

Do not log generated SSP content.

Do not expose project data across tenants.

Avoid writing generated SSP files to persistent server storage unless
architecturally required.

Prefer generation/streaming/download behavior that does not leave unnecessary
server-side artifacts.

Do not add external document-generation services in V1 unless explicitly
approved.

---

# 17. Testing Strategy

The architecture proposal must define a testable DOCX strategy.

Tests should emphasize document semantics rather than visual pixel comparison.

At minimum consider:

## Document-model tests

Validate:

- section ordering;
- system-characteristics mapping;
- missing-data placeholders;
- framework identity;
- control counts;
- enhancements;
- CMMC requirements;
- IL4 GRRs;
- IL4 overlay notes;
- Evidence references;
- status mapping;
- ODP handling;
- provenance.

## Renderer tests

Inspect generated DOCX package/XML for:

- valid DOCX structure;
- expected document text;
- heading styles;
- tables;
- headers/footers;
- TOC field if implemented;
- deterministic ordering;
- required package relationships.

Do not rely solely on "the library generated a file."

## Framework fixtures

At minimum include representative fixtures for:

- NIST Moderate;
- CMMC Level 2;
- DoD IL4.

Include IL4 fixtures demonstrating:

- ordinary FedRAMP inheritance;
- DoD adjustment;
- FedRAMP explicitly permitted;
- DSPAV-required value;
- source conflict;
- conditional control;
- GRR.

## Scale

Generate an SSP for the full IL4 population to ensure hundreds of framework
items do not break generation or produce pathological memory/runtime behavior.

---

# 18. Validation Requirements

After implementation, run at minimum:

- existing full test suite;
- new SSP document-model tests;
- new DOCX renderer/package tests;
- framework-specific generation tests;
- export authorization/tenant-isolation tests;
- full IL4 generation test;
- lint;
- production build;
- `git diff --check`.

If a new DOCX dependency is introduced, review the dependency deliberately and
record why it was selected.

Do not add unrelated dependencies.

---

# 19. Documentation

Update durable documentation as appropriate, including:

- current state;
- architecture;
- decisions/ADRs;
- roadmap;
- SSP product direction;
- user guide;
- export documentation;
- limitations;
- this milestone document.

Document:

- Control Freak SSP vs OSCAL SSP;
- what the DOCX represents;
- what it does not represent;
- missing-data behavior;
- framework-selection limitations;
- ODP limitation pending 07C;
- Evidence-reference semantics;
- status semantics;
- supported frameworks;
- filename/generation behavior.

Do not rewrite historical 06B or 07A documents to imply capabilities existed
before they did.

---

# 20. Explicit V1 Deferrals

Out of scope for 07B:

- PDF generation;
- official FedRAMP Word template generation;
- FedRAMP 2026 CPO/SDR generation;
- DoD SSP Addendum generation;
- DoD PA package generation;
- CMMC assessment/certification output;
- per-ODP framework resolution;
- project-authored ODP values;
- complete effective-requirement synthesis;
- control inheritance/origination/shared-responsibility modeling;
- customer responsibility matrices;
- POA&M;
- SAP/SAR;
- ConMon package;
- diagram generation;
- architecture-diagram editor;
- binary Evidence embedding;
- digital signatures;
- approval workflow;
- authorization decision tracking;
- AI-generated SSP prose;
- IL5/IL6 framework support;
- IL4 OSCAL SSP export;
- CMMC OSCAL export.

---

# 21. Future 07C Relationship

Milestone 07C is expected to improve control-section fidelity.

Expected future work includes:

- framework-derived resolution per ODP;
- mapping framework assignment prose to NIST parameter IDs;
- project-authored organization-defined parameter values;
- per-ODP provenance;
- explicit unresolved/conflict/DSPAV states;
- safe parameter substitution;
- improved effective requirement generation;
- evaluate control origination/inheritance/shared responsibility.

07B must not implement shortcuts that make 07C harder.

In particular, do not persist rendered requirement strings merely because DOCX
needs them.

The document model should make it possible for 07C to replace unresolved
parameter presentation with precise per-ODP resolution without redesigning the
renderer.

---

# 22. Workflow

Use the simplified milestone workflow.

## Phase 1 — Architecture

Inspect the actual repository and authoritative requirements relevant to the
document architecture.

Produce the 07B architecture proposal.

STOP only for consequential decisions such as:

- DOCX generation library/approach;
- SSP document/view-model architecture;
- template strategy;
- persistence of generation records, if proposed;
- a canonical-domain gap that would require changing 07A;
- a security/deployment constraint that materially changes generation.

Do not implement before architecture review.

## Phase 2 — Implementation

After architecture approval:

- implement the approved document/view model;
- implement DOCX generation;
- implement export UI/API;
- add tests;
- validate all supported frameworks;
- update documentation;
- self-review;
- fix minor implementation/test/documentation issues;
- commit;
- push;
- report.

Do not introduce separate approval gates for routine implementation or Git
mechanics.

STOP during implementation only if:

- the approved document model cannot represent required SSP semantics;
- 07A canonical data proves materially insufficient;
- DOCX generation requires an unsafe/external service;
- tenant/security boundaries would change;
- a dependency creates a material architectural/security concern;
- authoritative requirements contradict the approved design;
- material scope expansion is required.

Production deployment remains a later release decision.

---

# 23. Definition of Done

Milestone 07B is complete when:

1. A framework-neutral Control Freak SSP document/view model exists.
2. DOCX generation is deterministic at the documented level.
3. A user can export a human-readable SSP from a project.
4. The generated document uses canonical 07A system-characteristics data.
5. Missing system information is shown explicitly rather than invented.
6. NIST Low/Moderate/High projects generate successfully.
7. CMMC Level 2 projects generate successfully.
8. DoD IL4 projects generate successfully, including GRRs.
9. Framework selection is not presented as authorization/certification.
10. IL4 control-level overlay information is represented without pretending
    per-ODP resolution exists.
11. Source conflicts and authoritative-value-required states remain unresolved.
12. Implementation status is represented without conflating review,
    assessment, Evidence coverage, or authorization.
13. Evidence may be referenced without being represented as assessed.
14. OSCAL remains a separate sibling export.
15. Export authorization and tenant isolation are tested.
16. A full 345-item IL4 SSP can be generated successfully.
17. Existing project/schema/framework functionality is not regressed.
18. Full tests, lint, build, and diff validation pass.
19. Durable documentation is updated.
20. The architecture leaves a clean path for 07C per-ODP/control-fidelity work.

---

# 24. First Action

Begin with the Phase 1 architecture review.

Do not implement yet.

Return:

# Milestone 07B Architecture Proposal

## 1. Executive recommendation

Summarize the proposed document-generation architecture.

## 2. Current-state findings

Identify relevant existing domain, framework, export, API, UI, Evidence,
authorization, and deployment behavior.

Call out documentation/implementation mismatches.

## 3. SSP document/view model

Show the proposed TypeScript representation.

Explain how canonical project/framework data maps into it.

## 4. DOCX generation approach

Compare realistic approaches/libraries and recommend one.

Include dependency/security/maintenance considerations.

## 5. Template/layout strategy

Define how the Control Freak SSP layout is versioned and maintained.

## 6. Document structure

Define the exact V1 sections and major tables.

## 7. Missing-data/completeness model

Define deterministic placeholder semantics.

## 8. Control/requirement representation

Define NIST, CMMC, and IL4 behavior.

Explicitly address enhancements, GRRs, overlay provenance, ODPs, conflicts,
DSPAV, and conditional requirements.

## 9. Implementation-status mapping

Define exactly what status appears in the SSP and what does not.

## 10. Evidence representation

Define what Evidence metadata is included.

## 11. Generation provenance

Define document/template/project/framework/generation metadata.

## 12. DOCX determinism and testing

Define byte-level vs semantic determinism and the package/XML test strategy.

## 13. Export API/UI and security

Define generation endpoint/action, authorization, tenant isolation, temporary
file behavior, and UI placement.

## 14. Persistence

State whether any new persistence is required and justify it.

## 15. Framework-specific behavior

Describe NIST, CMMC, and IL4 adaptations.

## 16. Deferred information

Identify deliberately unsupported document concepts.

## 17. Authoritative-source validation

List only sources that materially influence the architecture, with
version/date and design conclusion.

## 18. Decisions requiring approval

Include only consequential decisions.

For each:

Decision:
Recommended option:
Alternative(s):
Why recommended:
Consequences:

## 19. Risks / unresolved questions

Only genuine unresolved issues.

## 20. Implementation plan after approval

Propose practical work packages.

Once approved, expected workflow is:

implement
→ validate
→ self-review
→ fix minor issues
→ update docs
→ commit
→ push
→ report

No separate STOPs for routine mechanics.

---

# STOP

STOP after the architecture proposal.

Do not implement DOCX generation, add dependencies, modify persistence, change
the UI, update durable documentation, commit, or push until the architecture
proposal has been reviewed.