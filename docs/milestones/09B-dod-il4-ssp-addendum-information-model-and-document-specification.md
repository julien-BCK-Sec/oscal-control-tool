# Milestone 09B — DoD IL4 SSP Addendum Information Model & Document Specification

**Status:** Complete (2026-09-28)
**Type:** Research / architecture / document specification
**Implementation authorized:** No
**Depends on:** Milestone 09A, ADR-033
**Architecture decision:** ADR-034 (accepted)
**Research record:** `docs/research/09B-dod-il4-ssp-addendum-information-model-and-document-specification.md`
**Next implementation milestone:** 09D (not started)

---

## 1. Purpose

Define the authoritative information model and document specification for a
future **Control Freak-owned DoD IL4 SSP Addendum**.

Milestone 09A established that the pinned historical document:

`vendor/dod/cloud-il4-rev5/templates/IL4-Mod-SSP-Addendum-v1.8.docx`

is not an authoritative requirements source for the current
`dod-cloud-il4-rev5` framework and must not be populated directly with the
current Rev. 5 control population.

ADR-033 nevertheless accepts that document as a structural and design
reference.

Control Freak will therefore define its own current DoD IL4 SSP Addendum whose:

- document organization and presentation may be informed by the historical
  addendum;
- requirements come from the currently pinned Rev. 5 authoritative source set;
- project-specific content comes from canonical Control Freak project data;
- control and parameter content comes through the existing canonical framework,
  parameter-resolution, and SSP-synthesis paths;
- missing information remains explicit rather than being inferred or invented.

09B defines that future document and determines what information Control Freak
must possess to generate it faithfully.

09B does **not** implement the information model, UI, schema, or renderer.

---

## 2. Architectural Context

The current DoD IL4 model is intentionally composed rather than flattened.

The authoritative requirements/content path remains:

    FedRAMP Moderate Rev. 5
                +
       NIST SP 800-53 Rev. 5
                +
    DoD Rev. 5 SSP Addendum
         Controls v1.2
                +
      Cloud Computing SRG /
        IL4 Table D-1
                |
                v
    Canonical Control Freak
          IL4 framework
                |
                v
    Parameter resolution
                |
                v
       SSP synthesis

The future document path is expected to become:

    Canonical project data
                +
    Canonical framework data
                +
    Parameter resolution
                +
       SSP synthesis
                |
                v
    DoD IL4 Addendum view model
                |
                v
    Control Freak DoD IL4
        SSP Addendum DOCX

The historical DOCX may inform the final document structure and visual design,
but it does not sit in the requirements path.

---

## 3. Existing Architecture That Must Be Preserved

09B must preserve the architectural decisions already accepted through 06A,
06B, 07A, 07B, 07C, 08A, 09A, and ADR-033.

In particular:

1. Domain/project data and framework/source data remain separate.

2. Framework-derived values must not become editable project facts.

3. `src/domain/parameter-resolution.ts` remains the canonical parameter
   precedence/resolution path.

4. The existing canonical SSP synthesis path remains authoritative for control
   statement synthesis.

5. DoD IL4 remains:

   **FedRAMP Moderate Rev. 5 + DoD IL4 overlay**

   rather than a separately flattened framework authored by hand.

6. The current IL4 population remains:

   - 335 NIST controls/enhancements;
   - 10 DoD General Requirements;
   - 345 total framework items.

7. The current IL4 per-ODP mapping set remains empty unless a separately
   authorized milestone establishes authoritative mappings.

8. `leveragedFromFedrampModerate` is not parameter authority.

9. Framework inheritance is not the same concept as SSP control origination.

10. Application workflow ownership is not the same concept as SSP Responsible
    Role.

11. A leveraged authorization is not the same concept as framework inheritance.

12. DoD cloud impact-level assertion does not imply authorization.

13. Selecting `dod-cloud-il4-rev5` does not imply that the system is authorized,
    approved, or formally categorized at IL4.

14. Missing project information must not be inferred from framework selection,
    implementation status, workflow state, evidence, or other unrelated data.

---

## 4. Source Set

09B must begin by reviewing the actual pinned source set used by the current
DoD IL4 implementation.

At minimum, inspect:

- the pinned FedRAMP Moderate Rev. 5 baseline/profile;
- the pinned NIST SP 800-53 Rev. 5 catalog/control material;
- the pinned DoD Rev. 5 SSP Addendum Controls v1.2 source/extract;
- the pinned Cloud Computing SRG V1R7 material relevant to IL4 and Table D-1;
- existing DoD source provenance in
  `vendor/dod/cloud-il4-rev5/SOURCES.md`;
- the 09A research report;
- ADR-033;
- the historical pinned DOCX as a structural/design reference.

Where the original DoD Rev. 5 SSP Addendum Controls v1.2 spreadsheet is
available in the repository, inspect the original artifact as well as the
derived/extracted representation.

If the original authoritative spreadsheet is not currently pinned, document
that fact. Do not silently reconstruct or substitute it during 09B.

External research may be used to verify current DoD/DISA/Cyber Exchange
documentation and terminology, but current authoritative material must be
distinguished from historical/template-derived material.

---

## 5. Primary Deliverable

Create:

`docs/research/09B-dod-il4-ssp-addendum-information-model-and-document-specification.md`

This document must be detailed enough to serve as the architecture contract for
subsequent implementation milestones.

It must define:

1. the purpose and scope of the Control Freak IL4 SSP Addendum;
2. the intended relationship to a FedRAMP Moderate SSP;
3. the complete document structure;
4. the information required by each section;
5. the authoritative source of every information category;
6. which information is already modeled by Control Freak;
7. which information must be derived;
8. which information is currently missing;
9. which historical-template concepts should be retained, changed, or omitted;
10. the proposed canonical ownership of missing information;
11. the control and GRR presentation model;
12. the parameter presentation model;
13. unresolved/missing-data behavior;
14. document-generation metadata requirements;
15. the proposed implementation boundaries for subsequent milestones.

---

## 6. Document Identity and Scope

09B must explicitly define what the future document claims to be.

The expected concept is a:

**Control Freak DoD IL4 SSP Addendum**

It is intended to document the DoD IL4-specific additions, adjustments,
requirements, and project responses associated with the current Control Freak
DoD IL4 framework.

09B must determine and document:

- proposed document title;
- whether a subtitle should identify the relevant DoD Rev. 5 source set;
- document version semantics;
- generated date semantics;
- project/system identity shown on the cover;
- whether the document explicitly identifies itself as generated by Control
  Freak;
- how source/version provenance is represented;
- what disclaimer or scope statement is appropriate.

The document must not claim to be:

- an official DoD template;
- a DISA-issued template;
- a FedRAMP-issued template;
- an authorization;
- a Provisional Authorization;
- an Authority to Operate;
- evidence of IL4 authorization;
- evidence of FedRAMP authorization;
- evidence of DoD approval.

---

## 7. Relationship to the FedRAMP Moderate SSP

The historical addendum was designed to accompany a FedRAMP baseline SSP.

09B must define the relationship of the future Control Freak IL4 Addendum to
the system's broader SSP documentation.

Determine:

- whether the document is explicitly an addendum to a FedRAMP Moderate SSP;
- how the document behaves when the project has no separately identified
  FedRAMP Moderate SSP;
- whether Control Freak should identify a referenced baseline SSP;
- whether a baseline SSP identifier/version/date belongs in canonical project
  data;
- whether that concept instead belongs under leveraged authorization or an
  external-artifact/reference model;
- whether the addendum should repeat any baseline information for usability;
- what must not be duplicated because it would create conflicting sources of
  truth.

Do not infer that a FedRAMP Moderate authorization exists merely because IL4 is
modeled as a FedRAMP Moderate baseline plus DoD overlay.

---

## 8. Complete Document Structure

Define the proposed section hierarchy for the new addendum.

Use the historical document as a structural reference, but evaluate each
section against current Rev. 5 needs.

At minimum evaluate whether the document should contain:

- cover page;
- document control/version information;
- revision history;
- table of contents;
- purpose/scope;
- source/framework provenance;
- system identification;
- system description;
- organization;
- system owner;
- security contacts/roles;
- authorization boundary;
- operational status;
- security categorization;
- information types;
- CNSSI 1253-related information;
- DoD cloud impact-level assertion;
- cloud service model;
- cloud deployment model;
- DoD sponsor information;
- NIPRNet sponsor information;
- authorizing official information;
- leveraged authorization information;
- system environment;
- system architecture;
- hardware/software/component inventory;
- ports, protocols, and services;
- interconnections;
- data flows;
- diagrams and external attachments;
- DoD General Requirements;
- IL4 security-control requirements;
- parameter/assignment presentation;
- unresolved requirements;
- generation metadata;
- appendices;
- Mission Owner / SLA material.

For every candidate section, classify it as:

- REQUIRED;
- OPTIONAL;
- CONDITIONAL;
- OMIT;
- EXTERNAL REFERENCE.

Explain the reasoning and authoritative basis.

Do not preserve a historical section solely because it exists in the old
template.

---

## 9. Information Ownership Model

Every proposed document field or repeating structure must have an explicit
information owner.

Use these categories:

### CANONICAL PROJECT DATA

Information authored about the system/project independent of a particular
framework where practical.

Examples may include system identity, environment, boundary, roles, and
interconnections.

### FRAMEWORK-SPECIFIC PROJECT DATA

Project-authored information whose meaning exists specifically because of the
DoD IL4 documentation context.

Use this category sparingly. Do not make generally useful SSP concepts
IL4-specific merely because 09B discovered them.

### FRAMEWORK / SOURCE DATA

Immutable information derived from pinned authoritative sources.

Examples include control identifiers, control text, overlay relationships,
source-defined assignments, and source provenance.

### DERIVED DATA

Information computed from canonical project/framework data under an explicit
rule.

Derivation must be deterministic and documented.

### EXPORT-TIME DATA

Information generated solely for a document instance, such as generation
timestamp or generator version.

### EXTERNAL REFERENCE / ARTIFACT

Information whose authoritative content lives outside Control Freak and should
be referenced rather than reproduced as canonical authored data.

### INTENTIONALLY UNSUPPORTED

Information deliberately excluded from the first IL4 Addendum implementation.

For every field proposed by 09B, identify exactly one primary ownership
category.

---

## 10. Reconcile the 09A Mapping

09A identified 87 mapping units:

- 11 DIRECT;
- 1 DERIVED;
- 24 PARTIAL;
- 31 MISSING;
- 6 STATIC;
- 14 EXTERNAL.

09B must revisit every PARTIAL and MISSING unit.

For each one, determine:

- whether the concept belongs in the new document at all;
- whether it is still required under the current source set;
- whether it is generally useful SSP information or DoD-specific;
- whether Control Freak already has a semantically correct field elsewhere;
- whether a new canonical field/model would be required;
- whether it can be derived safely;
- whether it should remain an external reference;
- whether it should be intentionally unsupported in the first release.

Do not automatically implement or propose storage for all historical-template
fields.

Produce a final gap table containing at least:

| Document concept | 09A status | 09B disposition | Ownership | Existing model | Proposed model change | Required for first export | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |

---

## 11. System-Level Information Model

Evaluate the existing `ProjectMetadata` / SSP system-characteristics model
against the proposed addendum.

Explicitly assess:

- system name;
- system short name / identifier;
- organization;
- description/purpose;
- authorization boundary;
- environment;
- operational status;
- security categorization;
- information types;
- DoD cloud impact assertion;
- roles;
- interconnections.

Determine what additional system-level concepts are genuinely required.

Candidates from 09A include:

- document version;
- baseline SSP reference;
- DoD sponsor;
- NIPRNet sponsor;
- authorizing official;
- cloud service model;
- cloud deployment model;
- leveraged authorizations;
- inventories;
- ports/protocols/services;
- data-flow references;
- architecture diagram references;
- CNSSI 1253 identifiers.

For each candidate, recommend one of:

- reuse existing canonical model;
- extend existing canonical model;
- introduce a new canonical model;
- framework-specific project data;
- external reference/artifact;
- derive;
- intentionally defer.

Do not modify `ProjectMetadata` during 09B.

---

## 12. SSP Roles vs Control Responsibility

09A established that historical-template **Responsible Role** is not equivalent
to:

- `ControlRecord.owner`;
- an SSP contact/person record;
- workflow ownership.

09B must design the semantics before any implementation occurs.

Determine whether control responsibility should be represented as:

- one responsible SSP role;
- multiple responsible roles;
- role identifiers referencing canonical SSP roles;
- free text;
- another model.

Evaluate whether the concept is useful across NIST, CMMC, FedRAMP, and DoD
outputs rather than being IL4-only.

The proposed model must distinguish:

1. SSP/system role/contact;
2. control implementation responsibility;
3. application workflow ownership;
4. control origination;
5. inheritance from an external system/service;
6. framework baseline/overlay inheritance.

Do not conflate these concepts.

If a new canonical responsibility model is recommended, specify it
conceptually, but do not implement it.

---

## 13. Control Origination

09A found the historical seven-category FedRAMP-style origination model.

09B must determine whether the future Control Freak IL4 Addendum needs control
origination and, if so, define its semantics.

Evaluate the historical categories, including concepts such as:

- Service Provider Corporate;
- Service Provider System Specific;
- Service Provider Hybrid;
- Configured by Customer;
- Provided by Customer;
- Shared;
- inherited from a pre-existing authorization.

Do not assume historical labels remain the correct current model.

Research current authoritative terminology where necessary.

Explicitly distinguish origination from:

- implementation status;
- responsibility;
- framework inheritance;
- parameter inheritance;
- leveraged authorization;
- evidence;
- workflow ownership.

Determine whether origination should become a general canonical SSP concept
rather than an IL4-specific field.

No implementation is authorized in 09B.

---

## 14. Implementation Status

The historical template and the existing Control Freak implementation-status
model do not necessarily use the same vocabulary.

09B must compare:

- current `ControlImplementation.status`;
- historical control status fields;
- GRR response/status vocabulary;
- any relevant current DoD/FedRAMP terminology.

Determine:

- whether existing control implementation status is sufficient;
- whether GRRs require a separate response/result model;
- whether document presentation can map existing states without semantic loss;
- whether additional canonical states would be required.

Do not change the existing enum during 09B.

---

## 15. DoD General Requirements

The future document must account explicitly for all ten canonical GRRs:

`grr-1` through `grr-10`.

09B must specify:

- section organization;
- authoritative requirement/question text;
- project response model;
- status/result presentation;
- responsible-role presentation if applicable;
- evidence/reference presentation if applicable;
- unresolved behavior;
- whether GRRs use the same implementation narrative model as NIST controls;
- whether any GRR-specific structured answers are required.

Historical template defects such as the GR-9/GR-10/GR-15 labeling errors must
not be copied into the new document.

The current ten GRRs remain first-class framework items.

Do not change their framework population during 09B.

---

## 16. Security Control Presentation

Define the exact conceptual structure of a security-control entry in the future
addendum.

Evaluate inclusion of:

- control identifier;
- title;
- family;
- baseline/overlay relationship;
- source/provenance;
- requirement/control text;
- DoD-specific adjustment;
- organization-defined parameters;
- resolved assignment values;
- unresolved parameter indicators;
- implementation status;
- responsible role;
- control origination;
- implementation narrative;
- evidence references;
- external references;
- notes/deviation documentation.

The specification must distinguish:

- authoritative requirement text;
- framework-derived effective requirement;
- project-authored implementation narrative;
- parameter values;
- project-authored annotations;
- evidence metadata.

Do not create a second control-statement synthesis implementation.

The future renderer must consume canonical SSP/control synthesis.

---

## 17. Which Controls Appear in the Addendum

09B must explicitly define the document population rule.

Do not assume that a DoD IL4 addendum should blindly print all 345 framework
items.

Evaluate at least these approaches:

1. all 345 IL4 framework items;
2. only requirements added or changed by DoD relative to FedRAMP Moderate;
3. all ten GRRs plus DoD-added/adjusted NIST requirements;
4. another source-supported composition.

The historical purpose of an addendum was to document changes/additions relative
to the FedRAMP baseline.

The current Control Freak framework nevertheless contains the complete
effective IL4 population for authoring.

09B must decide which representation best matches the purpose of the generated
document while preserving enough context for a reviewer to understand each
requirement.

The decision must be based on current authoritative semantics, not convenience
or the historical control table alone.

This is a required architecture decision.

---

## 18. Parameter Presentation

09B must define how organization-defined parameters and DoD/FedRAMP assignments
appear in the addendum without changing the existing parameter-resolution
semantics.

The specification must account for:

- CSP organization-defined values;
- FedRAMP base inherited values;
- FedRAMP values explicitly permitted by DoD;
- DoD explicit assignments;
- values satisfied by the DoD Addendum;
- authoritative-value-required cases;
- source conflicts;
- unresolved values;
- nested parameters;
- selections;
- multiple inserts;
- documented deviations/annotations.

The existing 07C resolution model remains authoritative.

Historical labels such as:

`Parameter (a) (1)`

must not be treated as canonical parameter identifiers unless independently
supported by current authoritative source mappings.

The historical `DoD Assignment:` text must not be imported as current
per-ODP authority.

The IL4 per-ODP mapping set remains unchanged during 09B.

---

## 19. Fail-Closed Document Behavior

Define document behavior when required information is absent or unresolved.

The document must never invent:

- parameter values;
- authorization status;
- categorization;
- sponsors;
- responsible roles;
- control origination;
- implementation status;
- leveraged authorizations;
- system inventories;
- interconnections;
- evidence;
- external artifact references.

09B must define consistent presentation conventions for:

- not yet documented;
- unresolved parameter;
- authoritative value required;
- source conflict;
- not applicable, where genuinely supported;
- external artifact not supplied;
- intentionally unsupported field.

Where appropriate, reuse the existing SSP convention:

`[Not yet documented: {Field label}]`

but determine whether additional IL4-specific unresolved states require
different wording.

Missing information must remain visible to the reader.

---

## 20. Leveraged Authorizations

09B must define what a leveraged authorization means in the SSP information
model.

It must not be inferred from:

- framework inheritance;
- FedRAMP Moderate baseline membership;
- parameter inheritance;
- use of a third-party service;
- evidence records.

Determine what information would be required to document a leveraged
authorization faithfully, potentially including:

- provider/system;
- authorization type;
- authorization identifier;
- authorization date;
- expiration/status where applicable;
- scope;
- external artifact/reference.

Determine whether this should be:

- canonical SSP data;
- an external authorization/reference model;
- intentionally deferred.

No implementation is authorized.

---

## 21. Inventories, PPS, Architecture, and Diagrams

Evaluate the historical requirements for:

- hardware inventory;
- software inventory;
- components;
- ports;
- protocols;
- services;
- architecture diagrams;
- authorization-boundary diagrams;
- data-flow diagrams.

Determine which are:

- necessary for the first Control Freak IL4 Addendum;
- better represented as structured canonical data;
- better represented as external attachments/references;
- already represented elsewhere;
- intentionally deferred.

Avoid turning Control Freak into a CMDB solely to reproduce a historical table.

The first export may reference authoritative external artifacts where that is
the safer architecture.

---

## 22. CNSSI 1253 and Security Categorization

09B must evaluate the historical CNSSI 1253 material against the current
Rev. 5 IL4 documentation need.

Determine:

- what current authoritative source requires;
- what Control Freak already captures through FIPS/security categorization and
  information types;
- whether CNSSI-specific identifiers or overlays need separate storage;
- whether values can be derived;
- whether this section should be included, conditional, externally referenced,
  or deferred.

Do not infer CNSSI categorization from DoD IL4 selection.

---

## 23. Mission Owner / SLA Controls

09A established that the historical Attachment 10 describes controls that a
mission owner may place in an SLA and that these are not automatically part of
the 345-item IL4 framework population.

09B must determine how, if at all, this concept appears in the future document.

Possible dispositions include:

- omit from first export;
- informational appendix;
- external reference;
- conditional optional section;
- future separate model.

Do not merge Mission Owner/SLA controls into the framework population without
separate authoritative evidence and architecture approval.

Explicitly document the distinction between a control already present in the
345-item population and a historical template labeling that same identifier as
a potential SLA responsibility.

---

## 24. Evidence and External References

Determine how the addendum should present Control Freak evidence.

The existing SSP V1 intentionally exports evidence metadata without claiming
that evidence has been independently assessed or validated.

Preserve that safety property.

Determine:

- whether evidence is listed per control/GRR;
- which metadata is appropriate;
- whether URLs/identifiers should be shown;
- how external artifacts are referenced;
- whether attachments are embedded or merely referenced in the first release.

Do not treat the presence of evidence as proof of implementation or
authorization.

---

## 25. Document Generation Metadata

Define generation metadata for the future addendum.

At minimum evaluate:

- generated timestamp;
- Control Freak version;
- framework ID;
- framework/source versions;
- source pin identifiers;
- document specification version;
- project identifier;
- document version supplied by the user;
- whether generated artifacts need a deterministic document identifier.

Separate:

- project-authored document metadata;
- source provenance;
- export-time metadata.

---

## 26. Visual and Layout Specification

The historical DOCX is accepted as a design reference.

09B should define enough visual intent for a later renderer without attempting
pixel-perfect implementation.

Evaluate retaining concepts such as:

- formal cover page;
- DoD-oriented addendum title;
- restrained government-document visual style;
- section numbering;
- table of contents;
- blue section headings;
- gray structured tables;
- repeated control summary blocks;
- page headers/footers;
- page numbering;
- classification/footer text only where semantically appropriate.

Do not copy a DoD seal, official marks, classification markings, or other
elements in a way that implies the generated document is issued by DoD.

If `UNCLASSIFIED` or similar markings are considered, determine their semantic
basis rather than copying the historical footer automatically.

The document must be clearly identifiable as Control Freak-generated.

---

## 27. Renderer Architecture Recommendation

09B must recommend the architecture for the eventual renderer, but must not
implement it.

Because ADR-033 establishes that the historical DOCX is not the output
template, reconsider the 09A Open XML conclusion in the context of a
Control Freak-owned document.

Compare at least:

### A. Programmatic generation using the existing `docx` dependency

### B. A new Control Freak-owned DOCX template populated through Open XML

### C. Hybrid generation

The recommendation should consider:

- maintainability;
- fidelity;
- tables;
- TOC behavior;
- headers/footers;
- pagination;
- repeatable control sections;
- testing;
- deterministic output;
- future template evolution;
- ability to represent hundreds of controls;
- accessibility;
- preservation of authoritative content boundaries.

Do not add or change dependencies.

---

## 28. Proposed Canonical Model Changes

09B must produce a consolidated proposal for any canonical information-model
changes required before the first IL4 Addendum can be generated faithfully.

For each proposed change include:

- concept;
- semantics;
- why it is required;
- whether it is framework-independent;
- proposed ownership;
- cardinality;
- relationship to existing models;
- migration implications;
- UI implications;
- export implications;
- whether required for first export or deferrable.

Do not write production TypeScript interfaces as if they were approved.

Illustrative schemas may be used to make the architecture concrete, but they
must be labeled proposed/non-authoritative until the architecture STOP is
accepted.

---

## 29. Minimum Viable IL4 Addendum

Define a bounded **first useful export**.

The first export should not require every possible SSP feature if a smaller
document can faithfully represent the current DoD IL4 addendum requirements.

Identify:

### Required for V1

Information and features without which the document would be materially
misleading or unusable.

### Useful but deferrable

Information that improves completeness but can safely remain an explicit
placeholder or external reference.

### Future enhancement

Information that should not block the first export.

The V1 boundary must not be achieved by silently omitting required information
or inventing defaults.

---

## 30. Subsequent Milestone Boundaries

09B must recommend the implementation sequence after architecture approval.

Expected shape:

### 09C — Approved Information Model & Authoring

Potential scope:

- approved canonical model additions;
- project schema migration if required;
- domain types;
- validation;
- authoring UI;
- demo data;
- tests;
- no renderer unless explicitly included by the accepted 09B architecture.

### 09D — DoD IL4 SSP Addendum Renderer

Potential scope:

- IL4 Addendum view model;
- renderer;
- DOCX output;
- source/generation metadata;
- missing/unresolved presentation;
- tests;
- manual document review.

If the 09B findings support a different decomposition, recommend it explicitly.

Do not begin either milestone.

---

## 31. Required Architecture Decisions

The 09B research report must conclude with explicit recommendations for at
least the following:

1. Exact purpose of the Control Freak DoD IL4 SSP Addendum.
2. Relationship to a FedRAMP Moderate SSP.
3. Complete V1 document section set.
4. Which controls appear in the addendum and why.
5. GRR presentation model.
6. Parameter presentation model.
7. Missing/unresolved-data behavior.
8. Whether baseline SSP references need modeling.
9. Whether DoD/NIPR sponsor information needs modeling.
10. Whether cloud service/deployment models need modeling.
11. Whether leveraged authorizations need modeling.
12. Whether inventories/PPS need modeling or external references.
13. Whether CNSSI 1253 information needs modeling.
14. Whether control implementation responsibility becomes canonical data.
15. Whether control origination becomes canonical data.
16. Whether existing implementation status is sufficient.
17. Mission Owner/SLA disposition.
18. Evidence/reference presentation.
19. Generation metadata.
20. Visual identity/safety rules.
21. Renderer architecture.
22. Minimum viable V1 boundary.
23. Proposed 09C scope.
24. Proposed 09D scope.

Each recommendation must distinguish:

- source-supported fact;
- existing Control Freak architecture;
- proposed architecture decision.

---

## 32. ADR Requirement

If 09B recommends changes to the canonical SSP information model, prepare a
**proposed ADR** describing the information-model architecture.

Do not mark that ADR accepted before the Architecture STOP is reviewed.

The ADR should focus on durable semantics rather than the visual details of one
DOCX.

If multiple genuinely independent architecture decisions warrant separate
ADRs, explain why before creating unnecessary ADR proliferation.

---

## 33. Explicitly Out of Scope

09B must NOT:

- implement the IL4 DOCX exporter;
- modify the generic SSP renderer;
- modify application source code;
- modify the project JSON schema;
- add a SQL migration;
- add UI fields;
- change dependencies;
- modify framework populations;
- modify the 345-item IL4 population;
- add Mission Owner/SLA controls to the framework;
- change parameter precedence;
- add IL4 per-ODP mappings;
- implement OSCAL `set-parameter`;
- infer new parameter mappings from the historical DOCX;
- populate the historical DOCX;
- replace the historical pinned DOCX;
- claim the historical DOCX is official/current;
- claim the future Control Freak document is an official DoD template;
- infer authorization/categorization;
- begin 09C;
- begin 09D;
- deploy anything.

---

## 34. Semantic Safety Requirements

The research and proposed design must fail closed.

Do not:

- infer a FedRAMP authorization;
- infer a DoD authorization;
- infer an ATO or PA;
- infer IL4 authorization from framework selection;
- infer system categorization from IL4 selection;
- infer sponsor or AO information;
- infer control responsibility from workflow ownership;
- infer control origination from framework inheritance;
- infer leveraged authorization from baseline inheritance;
- treat evidence presence as implementation proof;
- treat historical template text as current authority;
- turn historical parameter labels into canonical ODP IDs;
- treat a source conflict as resolved;
- hide unresolved authoritative values;
- invent missing SSP data;
- create a second parameter-resolution path;
- create a second control-statement synthesis path.

---

## 35. Research Quality Requirements

The research report must clearly identify the basis of significant conclusions.

Use:

- pinned repository sources;
- existing ADRs/milestones;
- current Control Freak implementation;
- the historical pinned DOCX;
- authoritative current DoD/DISA/Cyber Exchange sources where external
  verification is needed.

When a current authoritative source cannot be obtained, say so explicitly.

Do not turn absence of a publicly visible document into proof that no such
document exists.

Do not silently reconcile contradictory sources.

Record contradictions and recommend fail-closed behavior.

---

## 36. Validation

Because this is an architecture/research milestone, validation is primarily
repository and scope validation.

At minimum run:

    git diff --check

Confirm that 09B has not changed:

- application behavior;
- `src/`;
- project schema;
- SQL schema/migrations;
- dependencies;
- framework populations;
- generated framework data;
- IL4 per-ODP mappings;
- parameter-resolution behavior;
- SSP renderer behavior;
- deployment configuration.

If scripts or source inspection are used for research, they must not mutate
generated artifacts unless explicitly authorized.

---

## 37. Architecture STOP

When the research report, proposed information model, document specification,
and proposed implementation boundaries are complete:

**STOP.**

Do not implement the proposed architecture.

Do not begin 09C.

Do not begin a renderer.

Do not modify schema or application code.

Report:

1. executive conclusion;
2. proposed V1 document structure;
3. document population rule;
4. relationship to FedRAMP Moderate;
5. authoritative content/source model;
6. 09A gap reconciliation;
7. required canonical data additions;
8. responsibility recommendation;
9. origination recommendation;
10. implementation-status recommendation;
11. GRR model;
12. parameter presentation;
13. leveraged-authorization recommendation;
14. inventory/PPS recommendation;
15. CNSSI recommendation;
16. Mission Owner/SLA disposition;
17. evidence/reference model;
18. fail-closed placeholder model;
19. generation metadata;
20. visual/layout recommendation;
21. renderer recommendation;
22. minimum viable V1 boundary;
23. proposed ADR(s);
24. proposed 09C scope;
25. proposed 09D scope;
26. files changed;
27. validation performed;
28. repository state;
29. architecture decisions requiring approval.

Wait for architecture review before proceeding.

---

## 38. Architecture STOP — accepted

Architecture review accepted this specification on 2026-09-28. Decisions
are ADR-034.

Accepted accounting:

```text
32 detailed items + 1 membership note + 312 not reprinted = 345
```

The 32 detailed items are 10 GRRs + 22 NIST controls/enhancements. The 22
NIST items are 12 controls not in FedRAMP Moderate plus 10 FedRAMP Moderate
controls with a Table D-1 parameter adjustment. SC-18 is the membership
note. The other 312 FedRAMP Moderate items are not reprinted.

09C is not required for the first export. The next implementation
milestone is 09D, limited to the addendum view model and renderer on the
accepted canonical model. 09D is not started by this closeout.

No application, schema, framework, parameter-mapping, or renderer change
is authorized by closing 09B.