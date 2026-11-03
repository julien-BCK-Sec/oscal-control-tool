# Milestone 09D — DoD IL4 SSP Addendum DOCX Renderer

**Status:** Implemented — pending acceptance  
**Type:** Implementation  
**Depends on:** Milestone 09B, ADR-034  
**Implementation authorized:** Yes  
**Production deployment authorized:** No  
**Acceptance STOP:** Yes

---

## 1. Purpose

Implement the first Control Freak-generated **DoD IL4 SSP Addendum DOCX** using
the architecture accepted in Milestone 09B and ADR-034.

The export is a Control Freak-owned document. It is not:

- a populated copy of the historical IL4 Word document;
- an official DoD or DISA template;
- a FedRAMP template;
- evidence of FedRAMP authorization;
- evidence of DoD IL4 authorization;
- an ATO or Provisional Authorization artifact.

The document is a human-readable delta companion to the system's broader SSP
documentation.

It must be generated from the existing canonical Control Freak model without
introducing a second framework, parameter-resolution, or control-synthesis
path.

---

## 2. Accepted Architecture

ADR-034 is authoritative for this milestone.

The DoD IL4 authoring framework remains:

- 335 NIST controls/enhancements;
- 10 DoD General Requirements;
- 345 total framework items.

The V1 addendum is a delta document:

- 10 GRRs printed in detail;
- 12 NIST controls/enhancements not present in FedRAMP Moderate printed in
  detail;
- 10 FedRAMP Moderate controls/enhancements with a DoD Table D-1 parameter
  adjustment printed in detail;
- SC-18 represented by a membership/inclusion note only;
- 312 remaining FedRAMP Moderate items not reprinted.

The required accounting is:

    32 detailed items + 1 membership note + 312 not reprinted = 345

The 32 detailed items are:

    10 GRRs + 22 NIST controls/enhancements

The renderer must derive and validate this population from canonical framework
metadata and accepted IL4 semantics.

Do not create a hand-maintained second list merely to make the expected counts
pass.

---

## 3. Detailed NIST Delta Population

The accepted detailed NIST population consists of two semantic groups.

### 3.1 Not present in FedRAMP Moderate

The expected current-pin set is:

- AU-5(1)
- MA-5(5)
- PS-3(4)
- SA-4(5)
- SA-9(3)
- SA-9(6)
- SA-9(7)
- SA-9(8)
- SC-12(6)
- SC-18(2)
- SC-24
- SC-46

Expected count: **12**

### 3.2 FedRAMP Moderate items with a DoD Table D-1 parameter adjustment

The expected current-pin set is:

- AC-7
- CM-7(5)
- IA-5(1)
- MA-5(1)
- MA-6
- PE-15
- PS-4
- SA-9(1)
- SA-9(5)
- SC-17

Expected count: **10**

### 3.3 Membership note only

- SC-18

SC-18 is already part of FedRAMP Moderate and Table D-1 identifies it as an
inclusion-only item. It must not be presented as though DoD supplied a new
control statement or parameter adjustment.

These lists are acceptance expectations for the currently pinned source set.
Implementation should derive membership from the existing canonical framework
and source metadata rather than introduce a new competing source of truth.

If the canonical metadata cannot reproduce these exact sets without unsafe
inference, STOP and report the architectural mismatch rather than hard-code
around it.

---

## 4. Scope

09D includes:

1. a DoD IL4 Addendum view model;
2. population derivation from the canonical IL4 framework;
3. reuse of canonical SSP/control synthesis;
4. DOCX rendering;
5. an authenticated export endpoint;
6. export UI integration;
7. document metadata and source provenance;
8. fail-closed missing/unresolved presentation;
9. automated tests;
10. representative generated-document inspection;
11. documentation updates.

09D does not add new canonical project fields.

---

## 5. Explicitly Out of Scope

Do not:

- modify the 345-item IL4 framework population;
- modify FedRAMP Moderate population;
- modify NIST source data;
- modify DoD source data;
- modify Table D-1 semantics;
- modify parameter precedence;
- add IL4 per-ODP mappings;
- implement OSCAL `set-parameter`;
- change project JSON schema solely for this export;
- add SQL migrations;
- add responsibility fields;
- add control-origination fields;
- add DoD sponsor fields;
- add NIPRNet sponsor fields;
- add cloud service/deployment model fields;
- add leveraged-authorization storage;
- add inventories;
- add ports/protocols/services;
- add diagrams;
- add CNSSI 1253 fields;
- add Mission Owner/SLA controls or responses;
- add an authored document-version field;
- populate or patch the historical DOCX;
- add a new binary Word template;
- add a new DOCX dependency;
- change the generic SSP document specification merely to support this export;
- redesign the general Controls workspace;
- deploy to production.

If implementation appears to require one of these changes, STOP and report why.

---

## 6. Historical DOCX Role

The pinned historical document:

`vendor/dod/cloud-il4-rev5/templates/IL4-Mod-SSP-Addendum-v1.8.docx`

remains a structural/design reference under ADR-033.

It may be consulted for:

- document organization;
- visual hierarchy;
- table concepts;
- control presentation ideas;
- general addendum readability.

It must not supply:

- current control population;
- current control text;
- parameter identifiers;
- parameter values;
- current source semantics;
- authorization facts;
- project facts.

Do not open, modify, populate, copy, or patch the historical DOCX as the
generated artifact.

The new document must be generated independently.

---

## 7. Renderer Architecture

Use programmatic DOCX generation with the repository's existing exact-pinned
`docx` dependency.

Introduce a dedicated layout identity:

    cf-il4-addendum-docx
    version 1.0

The expected flow is:

    canonical project data
              +
    canonical IL4 framework data
              +
       parameter resolution
              +
         SSP synthesis
              |
              v
    IL4 Addendum view model
              |
              v
    cf-il4-addendum-docx / 1.0
              |
              v
            DOCX

The view model must isolate document semantics from DOCX layout mechanics.

Do not make DOCX rendering code responsible for deciding:

- framework membership;
- parameter precedence;
- effective control statements;
- project-data defaults;
- authorization state.

Those decisions belong upstream.

---

## 8. Reuse Existing SSP Architecture

Inspect and reuse the architecture established by 07B and 07C.

Where practical, reuse existing canonical representations for:

- system identity;
- system description;
- organization;
- authorization boundary;
- environment;
- operational status;
- security categorization;
- information types;
- DoD cloud impact assertion;
- SSP roles;
- interconnections;
- implementation status;
- implementation narrative;
- evidence metadata;
- synthesized control statements;
- parameter-resolution summaries.

Do not duplicate generic SSP transformation logic inside the IL4 renderer.

If a reusable generic SSP transformation should be extracted without changing
its semantics, a small refactor is permitted when necessary for clean reuse.

Such a refactor must:

- preserve existing generic SSP output behavior;
- have tests demonstrating no regression;
- remain bounded to reuse required by 09D.

Do not use 09D as a general SSP refactor.

---

## 9. IL4 Addendum View Model

Create a dedicated, typed, renderer-independent view model.

The exact TypeScript structure is an implementation decision, but it must
represent at least:

### Document identity

- document title;
- Control Freak generator identity;
- layout id/version;
- generated timestamp;
- project id;
- project revision where available;
- framework id;
- source provenance.

### System information

- system name;
- short name/identifier;
- organization;
- description/purpose where appropriate;
- operational status;
- authorization boundary;
- environment;
- security categorization;
- DoD cloud impact assertion;
- information types;
- SSP roles;
- interconnections.

### Population summary

- total framework population;
- detailed-item count;
- detailed GRR count;
- detailed NIST count;
- membership-note count;
- not-reprinted count;
- explanatory text describing the delta semantics.

### GRRs

All ten GRRs, with:

- canonical identifier;
- title;
- authoritative requirement/question text;
- documentation status;
- implementation/project narrative;
- evidence metadata where present.

### NIST delta entries

All 22 detailed NIST controls/enhancements, with:

- identifier;
- title;
- family;
- relevant source/provenance;
- baseline/overlay relationship;
- authoritative/current requirement context;
- canonical synthesized statement;
- parameter-resolution information;
- documentation status;
- project implementation narrative;
- evidence metadata;
- unresolved/conflict notices where applicable.

### Membership note

SC-18, with enough information to explain why it is acknowledged but not
reprinted as a detailed DoD adjustment.

The view model should be testable without generating a DOCX.

---

## 10. Population Derivation

Population selection must use the accepted canonical IL4 semantics.

Do not use:

- historical Table 11-1;
- historical DOCX control membership;
- `leveragedFromFedrampModerate` as the selection authority;
- a manually maintained renderer-only array;
- string matching against rendered prose.

The current canonical source/model should allow the renderer to distinguish:

1. GRRs;
2. NIST items not in FedRAMP Moderate;
3. FedRAMP Moderate items with applicable Table D-1 parameter adjustments;
4. Table D-1 inclusion-only items;
5. unchanged FedRAMP Moderate items.

The derivation must fail closed if these categories cannot be determined
unambiguously.

For the current pins, assert exactly:

    total framework items:          345
    detailed items:                  32
    detailed GRRs:                   10
    detailed NIST items:             22
    membership notes:                 1
    not reprinted:                   312

And:

    32 + 1 + 312 = 345

---

## 11. Source Provenance

The document must identify the authoritative source family used to construct
the IL4 model.

Use the repository's pinned provenance rather than hard-coded marketing text.

The generated document should identify, as appropriate:

- NIST SP 800-53 Rev. 5;
- FedRAMP Moderate Rev. 5;
- DoD Rev. 5 SSP Addendum Controls v1.2;
- Cloud Computing SRG V1R7 / relevant IL4 Table D-1 source;
- framework id `dod-cloud-il4-rev5`.

Where hashes or pin identifiers are available and appropriate for the
generation-metadata section, include them through the view model.

Do not claim that the historical DOCX is part of the authoritative
requirements chain.

The historical document need not be mentioned in the generated addendum.

---

## 12. Cover and Document Identity

The cover should be professional and restrained.

Suggested title:

**DoD IL4 System Security Plan Addendum**

It must also identify that the document is generated by Control Freak.

Include project/system identity using existing canonical fields.

Include an explicit scope statement making clear that:

- the document is generated from the project's Control Freak documentation;
- it describes DoD IL4 additions/adjustments relative to the applicable
  FedRAMP Moderate Rev. 5 baseline model used by Control Freak;
- it is not an official DoD-issued template;
- generation does not establish FedRAMP authorization, DoD authorization,
  IL4 authorization, an ATO, or a Provisional Authorization.

Use concise professional language. Do not make the disclaimer dominate the
document.

Do not use:

- DoD seal;
- DISA seal;
- FedRAMP logo;
- copied official branding;
- `UNCLASSIFIED` markings without project-authored classification authority.

---

## 13. V1 Document Structure

Implement the accepted V1 structure from ADR-034.

At minimum:

1. Cover
2. Document Status and Generation Metadata
3. Table of Contents
4. Purpose and Scope
5. Source Provenance
6. System Identification
7. Authorization Boundary and Environment
8. Security Categorization and Information Types
9. SSP Roles
10. Interconnections
11. IL4 Addendum Population
12. DoD General Requirements
13. DoD IL4 NIST Control Delta
14. Parameter Interpretation / Reading Notes
15. Generation Notes, if required

Section naming may be refined for readability without changing semantics.

The scope section must state the V1 omissions accepted by ADR-034 rather than
rendering misleading empty official-style tables for unsupported concepts.

---

## 14. Explicit V1 Omissions

The document scope must clearly but concisely explain that V1 does not model or
assert:

- classification markings;
- signatures;
- official logos;
- physical addresses;
- revision history;
- CNSSI 1253-specific tables;
- DoD sponsor information;
- NIPRNet sponsor information;
- cloud service model;
- cloud deployment model;
- leveraged-authorization register;
- hardware/software inventories;
- ports/protocols/services inventory;
- architecture/data-flow diagrams;
- Mission Owner/SLA responses;
- per-control Responsible Role;
- control-origination checkboxes;
- authored document version.

Do not render a large sequence of empty sections for these concepts.

One concise scope statement is preferred.

---

## 15. Missing Project Data

Use the established generic SSP placeholder convention where applicable:

    [Not yet documented: {Field label}]

Do not invent values for missing project fields.

Do not convert absence into:

- "None";
- "Not applicable";
- "No";
- "Unknown";

unless that exact value is canonically authored or semantically established by
the model.

Repeated structures with no authored entries should have an explicit,
human-readable empty state where needed to prevent ambiguity.

For example, absence of interconnection records must not be represented as a
claim that the system has no interconnections.

---

## 16. Parameter Presentation

Use the existing canonical parameter-resolution path and 07C synthesis.

Do not add IL4 per-ODP mappings.

The document must faithfully represent the currently modeled resolution state,
including:

- CSP organization-defined values;
- FedRAMP base inherited values;
- FedRAMP values explicitly permitted by DoD;
- DoD explicit assignments;
- values satisfied by the DoD Addendum;
- unresolved values;
- authoritative-value-required;
- source conflict;
- nested parameters;
- selections;
- multiple inserts;
- documented annotations/deviations where already supported.

The document must not make unresolved prose look resolved.

It must not infer individual ODP mappings from:

- historical parameter labels;
- historical `DoD Assignment:` text;
- control-level overlay prose;
- visual proximity in a source document.

---

## 17. Required Parameter Acceptance Cases

Automated tests and generated-document review must explicitly exercise the
following current-pin cases.

### AC-7

Verify the DoD assignment-required/fail-closed behavior is visible and is not
silently resolved.

### IA-5(1)

Verify the existing source conflict remains visibly unresolved.

Do not choose a winner.

### SC-46

Verify the conditional Cross Domain Solution context remains visible and is
not converted into a blanket project applicability claim.

### AU-5(1)

Verify its unusual provenance is preserved:

- semantic class reflects DoD explicitly permitting/referencing the FedRAMP
  value;
- effective assignment provenance remains the DoD SSP Addendum where that is
  the canonical source;
- it must not be falsely presented as membership in the FedRAMP Moderate
  baseline.

### MA-5(1), PE-15, SA-9(3)

Verify authoritative-value-required behavior remains unresolved.

### MA-6 / PS-4

Verify DoD-permitted FedRAMP-value semantics are represented without implying
that the value came from the DoD source.

### SC-18

Verify membership-note-only behavior.

It must not appear among the 22 detailed NIST entries.

---

## 18. Control Statement Presentation

The renderer must consume the canonical synthesized control statement.

Do not reconstruct effective statements in the renderer.

For each detailed NIST item, clearly distinguish:

- requirement identity/context;
- source/overlay relationship;
- resolved/synthesized statement;
- parameter resolution state;
- project implementation narrative;
- documentation status;
- evidence.

Avoid reproducing redundant source text where it adds no reviewer value.

The generated document should make it clear which text describes the
requirement and which text is the project's response.

---

## 19. DoD General Requirements

Render all ten canonical GRRs:

- GRR-1
- GRR-2
- GRR-3
- GRR-4
- GRR-5
- GRR-6
- GRR-7
- GRR-8
- GRR-9
- GRR-10

Use canonical IDs and titles.

Use the pinned canonical requirement/question text as stored, including source
typos or historical references that remain present in the authoritative
extract.

Do not silently edit authoritative source text.

Do not reproduce the historical DOCX's incorrect GR-10 / GR-15 table labels.

For V1, use the existing:

- `ControlImplementation.status`;
- single implementation/project narrative;
- evidence metadata.

Do not introduce a second GRR status model.

---

## 20. Documentation Status

Use the existing four-state `ControlImplementation.status` model unchanged:

- Not started
- In progress
- Implemented
- Not applicable

Present it as documentation/project implementation status according to the
existing canonical semantics.

Do not reinterpret it as:

- assessor finding;
- compliance determination;
- authorization decision;
- control effectiveness rating.

---

## 21. Evidence

Use the same safety boundary established by the generic SSP renderer.

Evidence may include metadata such as:

- title;
- type;
- lifecycle/status where already canonical;
- collection date where available.

Do not claim that linked evidence:

- proves implementation;
- has been independently assessed;
- has been validated;
- satisfies an assessor;
- establishes compliance.

Reuse existing evidence transformation logic where practical.

---

## 22. Population Accounting Section

Include a concise section explaining the relationship between the authoring
framework and this addendum.

It should communicate that the current Control Freak IL4 framework contains
345 items and that the addendum intentionally presents the DoD delta rather
than duplicating the complete FedRAMP Moderate SSP content.

Present the current-pin accounting:

| Category | Count |
| --- | ---: |
| Detailed DoD General Requirements | 10 |
| Detailed NIST controls/enhancements | 22 |
| Detailed items | 32 |
| Membership note only | 1 |
| FedRAMP Moderate items not reprinted | 312 |
| Total IL4 authoring population | 345 |

The text must not imply that the 312 items are unnecessary or out of scope for
the system.

They remain part of the effective IL4 authoring framework and broader SSP
documentation.

---

## 23. SC-18 Membership Note

SC-18 requires a specific non-control-entry presentation.

Explain that:

- SC-18 is already present in the FedRAMP Moderate baseline;
- the current IL4 Table D-1 treatment is inclusion-only;
- no separate DoD parameter adjustment is being represented;
- therefore the addendum acknowledges its membership without duplicating the
  broader SSP implementation entry.

Use canonical metadata to support this statement.

Do not present SC-18 as one of the 22 detailed NIST delta items.

---

## 24. Table of Contents

Provide a usable Word table of contents consistent with what the existing
`docx` library can generate.

Use proper heading levels throughout the document.

If Word must refresh field-derived page numbers after opening, document that
limitation rather than implementing brittle Open XML manipulation solely to
cache TOC pagination.

The generated file must remain valid and usable without requiring Word-specific
post-processing for its substantive content.

---

## 25. Visual Design

Produce a polished, professional document appropriate for security/compliance
review.

The historical DOCX may inform visual restraint but is not a pixel-perfect
target.

Prefer:

- strong document hierarchy;
- restrained heading styles;
- readable typography;
- consistent spacing;
- structured tables;
- clear control-entry boundaries;
- sensible page breaks;
- headers/footers;
- page numbers where supported;
- repeatable rendering across large documents.

Avoid:

- excessive decoration;
- imitation DoD branding;
- copied official seals;
- excessive per-control page breaks;
- dense walls of source metadata;
- giant empty tables;
- UI-like card styling that reads poorly in Word.

The footer should identify the document as Control Freak-generated.

---

## 26. Export Endpoint

Add an authenticated project export endpoint consistent with the existing SSP
export architecture.

Preferred route:

    GET /api/projects/[projectId]/exports/il4-addendum.docx

Requirements:

- authenticated;
- tenant-isolated;
- project access enforced;
- appropriate read permission consistent with SSP export;
- viewer/read-only users may export if existing SSP export policy allows it;
- in-memory generation;
- no persistent generated document;
- safe content-disposition filename;
- correct DOCX content type;
- no cross-tenant information leakage.

The endpoint must reject use when the project's framework is not the supported
DoD IL4 framework.

Use a clear client-safe error rather than generating a semantically invalid
document for another framework.

---

## 27. Export UI

Expose the IL4 Addendum export from the existing project export/workspace UI.

Requirements:

- only show/enable the action when the project uses the supported DoD IL4
  framework;
- clearly label it as an IL4 Addendum;
- distinguish it from the generic SSP DOCX;
- do not call it an official DoD template;
- preserve existing OSCAL capability restrictions;
- do not enable IL4 OSCAL export as part of this milestone.

Suggested user-facing label:

**IL4 Addendum (Word)**

Use existing export interaction patterns.

Do not redesign the export UI beyond what is necessary to add the action
cleanly.

---

## 28. Filename

Use a deterministic, safe filename based on project/system identity.

The filename should make clear that the artifact is an IL4 SSP Addendum.

Sanitize unsafe filesystem/header characters.

Do not include claims such as:

- approved;
- authorized;
- certified;
- official.

---

## 29. Automated Testing

Add focused tests for the view model, population derivation, renderer, endpoint,
and UI behavior as appropriate.

At minimum test:

### Population

- total framework population = 345;
- detailed items = 32;
- GRRs = 10;
- detailed NIST = 22;
- membership notes = 1;
- not reprinted = 312;
- exact 12 non-FedRAMP set;
- exact 10 Table D-1-adjusted FedRAMP set;
- SC-18 membership-only;
- ordinary unchanged FedRAMP Moderate control excluded from detailed delta.

### GRRs

- exactly GRR-1 through GRR-10;
- canonical titles/text;
- project narrative/status represented;
- no historical GR-15 mislabel.

### Parameters

- AC-7;
- IA-5(1);
- SC-46;
- AU-5(1);
- MA-5(1);
- PE-15;
- SA-9(3);
- MA-6;
- PS-4.

### Project data

- authored system characteristics render;
- missing system characteristics use explicit placeholders;
- absence of repeating data does not become a false "none" assertion.

### Evidence

- metadata renders;
- no assessment/compliance claim is introduced.

### Security

- authentication required;
- tenant isolation;
- viewer behavior consistent with generic SSP export;
- unsupported framework rejected.

### Regression

- existing generic SSP export still works;
- existing NIST OSCAL export remains unchanged;
- IL4 OSCAL remains unavailable;
- framework counts remain unchanged;
- IL4 per-ODP mapping count remains unchanged.

---

## 30. DOCX Structural Validation

Automated validation should verify more than a non-empty buffer.

Where practical, inspect the generated DOCX package and assert:

- valid ZIP/DOCX package;
- expected core document parts;
- expected heading text;
- expected population text/counts;
- all ten GRRs present;
- all 22 detailed NIST IDs present;
- SC-18 membership note present;
- a representative unchanged FedRAMP control is absent from detailed entries;
- no historical DoD seal asset;
- no copied `UNCLASSIFIED` footer;
- no accidental historical template content.

Do not make tests depend on exact byte-for-byte DOCX output unless there is a
specific deterministic reason.

---

## 31. Representative Manual Artifacts

Generate representative local DOCX artifacts for manual review.

At minimum generate an addendum for the existing IL4 demo project, expected to
be Snow Goose unless repository state establishes a different canonical IL4
demo project.

Also use targeted fixtures/tests where needed to exercise parameter states that
the demo project does not naturally expose.

Manual review should inspect:

- cover;
- TOC;
- system sections;
- placeholders;
- population accounting;
- GRR readability;
- control readability;
- parameter presentation;
- AC-7;
- IA-5(1);
- SC-46;
- AU-5(1);
- SC-18 note;
- evidence presentation;
- headers/footers;
- page breaks;
- overall visual density.

The manual artifact is for acceptance review and does not become a source file
or template.

---

## 32. Performance and Size

The renderer must be practical for the 32 detailed-item delta.

Record representative:

- generation time;
- DOCX byte size.

There is no need to establish an artificial microbenchmark target, but
generation should not introduce obviously disproportionate latency relative to
the existing generic SSP renderer.

If performance is unexpectedly poor, investigate before acceptance.

---

## 33. Documentation

Update durable documentation to describe:

- IL4 Addendum export capability;
- delta semantics;
- population accounting;
- supported framework;
- renderer/layout id and version;
- safety/non-authorization semantics;
- known V1 omissions;
- parameter behavior;
- relationship to the generic SSP;
- continued unavailability of IL4 OSCAL export;
- any TOC or Word-refresh limitation.

Do not describe the capability as production-available until it is actually
released/deployed.

---

## 34. Implementation Workflow

09D is an implementation milestone.

Once implementation begins, the agent may:

- inspect;
- implement;
- add/refactor bounded internal helpers;
- add tests;
- run tests;
- run lint/build;
- generate local artifacts;
- self-review;
- fix ordinary implementation defects;
- update milestone documentation.

Do not STOP merely for routine implementation mechanics.

STOP if implementation exposes a consequential architecture issue, including:

- canonical metadata cannot derive the accepted delta population;
- a new project field is actually required for truthful V1 output;
- parameter semantics would need to change;
- the renderer would require a second synthesis path;
- a framework/source contradiction changes the accepted 09B contract;
- schema or SQL changes appear necessary;
- a new dependency appears necessary;
- security/access semantics would need to differ materially from existing SSP
  export architecture.

Do not paper over such a problem with renderer-specific hard-coding.

---

## 35. Validation

Before the Acceptance STOP, run at minimum:

    npm test
    npm run lint
    npm run build
    git diff --check

Also run the repository's relevant framework/source derivation or validation
commands used by prior IL4 milestones.

Confirm:

- FedRAMP Low population unchanged;
- FedRAMP Moderate population unchanged;
- FedRAMP High population unchanged;
- CMMC population unchanged;
- DoD IL4 population remains 345;
- DoD GRR population remains 10;
- IL4 per-ODP mapping set remains at the accepted current count;
- no SQL migration was introduced;
- no dependency was added;
- generic SSP export remains supported;
- NIST OSCAL behavior remains supported;
- IL4 OSCAL remains unavailable.

Record exact validation results in the milestone closeout material.

---

## 36. Self-Review

Before the Acceptance STOP, review the implementation specifically for:

- duplicate source-of-truth lists;
- renderer-owned business logic;
- unsafe inference;
- authorization implications;
- stale Rev. 4 content;
- accidental use of the historical DOCX as authority;
- incorrect delta membership;
- hidden unresolved parameters;
- incorrect provenance;
- cross-tenant export risk;
- Word formatting defects;
- generic SSP regressions;
- accidental IL4 OSCAL enablement.

Fix ordinary defects before reporting.

---

## 37. Acceptance STOP

When implementation, automated validation, self-review, and representative DOCX
generation are complete:

**STOP.**

Do not:

- declare 09D accepted;
- release/tag;
- deploy to production;
- push unless separately authorized;
- start another milestone.

Report:

1. implementation summary;
2. files changed;
3. IL4 Addendum view-model architecture;
4. population derivation mechanism;
5. exact population counts;
6. document section structure;
7. GRR rendering;
8. NIST delta rendering;
9. parameter behavior;
10. AC-7 result;
11. IA-5(1) result;
12. SC-46 result;
13. AU-5(1) result;
14. SC-18 membership-note result;
15. placeholder behavior;
16. evidence behavior;
17. endpoint and authorization behavior;
18. UI behavior;
19. DOCX structural validation;
20. representative generation time and file size;
21. automated test results;
22. lint result;
23. build result;
24. framework/population regression results;
25. self-review findings and fixes;
26. documentation changes;
27. repository status;
28. any remaining limitations or acceptance-review items.

Provide the generated representative DOCX for manual review where the
environment permits it.

Wait for manual/architecture acceptance before release or deployment.