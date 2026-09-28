# Milestone 09A — DoD IL4 SSP Addendum Template Analysis & Mapping

**Status:** Complete (2026-09-28)  
**Milestone type:** Research / architecture  
**Implementation authorized:** No  
**Architecture decision:** ADR-033  
**Research record:** `docs/research/09A-dod-il4-ssp-addendum-template-mapping.md`  
**Pinned source:** `vendor/dod/cloud-il4-rev5/templates/IL4-Mod-SSP-Addendum-v1.8.docx`  
**SHA-256:** `4c511a6b4b8e7e69922e980f8064e6059d30944dcf8506f6070eacfcdc7530ea`  
**Depends on:** 06A, 06B, 07A, 07B, 07C, 08A  
**Primary source artifact:** `IL4 Mod SSP Addendum v1.8.docx`  
**Target framework:** `dod-cloud-il4-rev5`

---

## 1. Purpose

Control Freak can currently author structured system characteristics, control
implementations, evidence references, framework-aware organization-defined
parameters, and human-readable SSP content.

The current generic SSP renderer intentionally produces a Control Freak-owned
human-readable SSP rather than attempting to reproduce an external government
template.

The next objective is to determine whether Control Freak can produce a
high-fidelity DoD Information Impact Level 4 SSP Addendum using the supplied
DoD Word template as the output document itself.

Milestone 09A does **not** implement that exporter.

The purpose of this milestone is to analyze the complete supplied IL4 SSP
Addendum, map its authorable content to the existing Control Freak domain
model, identify missing information and semantic gaps, and determine the
technical feasibility of populating the original DOCX while preserving its
native Word structure and appearance.

The output of 09A must provide enough evidence to make two subsequent
architecture decisions:

1. what additional canonical information, if any, Control Freak should model;
2. how Control Freak should populate the pinned IL4 DOCX template without
   creating a second SSP/control/parameter interpretation.

---

## 2. Source Document

The user-supplied source document is:

`IL4 Mod SSP Addendum v1.8.docx`

The document internally identifies itself as:

> Department of Defense (DoD) Addendum to the  
> FedRAMP+ System Security Plan  
> Information Impact Level 4  
> Template (Version 2)

The document is approximately 85 pages and contains system-level SSP
information, DoD General Readiness Requirements, additional and modified
security controls, DoD parameter assignments, control implementation
information, and Mission Owner/SLA material.

The template describes itself as an addendum to a FedRAMP Moderate baseline
SSP. Its instructions indicate that changed/additional material is supplied in
the addendum and read in conjunction with the baseline SSP.

The template also permits a CSP to provide a complete SSP incorporating the
DoD additions and changes.

### 2.1 Source authority caution

The supplied filename contains `v1.8`, while the document cover identifies
itself as `Template (Version 2)`.

The document also contains historical references to earlier DoD Cloud
Computing SRG material.

Therefore:

- do not infer current authority from the filename;
- do not infer current authority from the internal template version;
- do not silently treat historical SRG references as current requirements;
- do not silently substitute a different template.

Currentness and provenance are explicit research questions in this milestone.

---

## 3. Source Pinning

The supplied DOCX should be preserved as an immutable research/source artifact
under the existing DoD vendor tree.

Preferred location:

`vendor/dod/cloud-il4-rev5/templates/IL4-Mod-SSP-Addendum-v1.8.docx`

The original document must not be edited.

Record alongside the pinned source, using the repository's existing provenance
conventions where possible:

- original filename;
- repository path;
- SHA-256;
- date added;
- internal document title/version;
- known source/provenance;
- authority/currentness status;
- relationship to other pinned DoD IL4 artifacts.

If provenance cannot be established authoritatively, record that fact rather
than inventing provenance.

---

## 4. Existing Architectural Invariants

09A must respect the architecture established by previous milestones.

### 4.1 Canonical domain remains authoritative

Control Freak's canonical project/domain model remains the source for authored
project information.

The template must not become a second project data model.

### 4.2 Framework data remains separate from project data

Immutable NIST, FedRAMP, DoD IL4, catalog, baseline, overlay, and source
information remains framework/source data.

Do not copy framework facts into project-authored fields merely because the
Word template displays them.

### 4.3 Parameter resolution remains canonical

`src/domain/parameter-resolution.ts` remains the authoritative parameter
precedence/resolution path.

The IL4 Word template must not introduce another interpretation of:

- CSP-defined values;
- FedRAMP baseline inheritance;
- DoD explicit values;
- DoD permission to use a FedRAMP value;
- authoritative-value-required states;
- source conflicts;
- documented deviations;
- nested parameters;
- selection parameters.

### 4.4 Existing IL4 fail-closed behavior remains authoritative

The following existing semantics remain unchanged:

- no guessed IL4 per-ODP mappings;
- IL4 per-ODP mapping count remains 0 unless a separately approved milestone
  establishes authoritative mappings;
- DSPAV/restricted-source project assertions do not become authoritative
  values;
- source conflicts do not receive invented winners;
- `may-use-baseline` requires explicit acceptance;
- documented deviations do not replace framework-authoritative values.

### 4.5 SSP synthesis remains canonical

The existing SSP view-model / synthesis layer remains responsible for deciding
what Control Freak says about a system and its controls.

A future IL4 template adapter should consume canonical SSP/domain information.

It should not independently reconstruct control semantics from Word-template
text.

---

## 5. Scope

09A must analyze the complete supplied template.

Do not analyze only representative pages or selected control families.

The analysis must cover every meaningful category of authorable content found
in the document.

At minimum, investigate the following.

### 5.1 Document metadata

- Cloud Service Provider name
- Cloud Service Offering / information system name
- system abbreviation
- document version
- document date
- classification/footer treatment
- prepared-by organization
- prepared-for organization
- organization addresses
- logos
- revision history
- document approvals/signatures

### 5.2 System identification and categorization

- CSO identification
- FedRAMP Moderate baseline SSP reference
- CNSSI 1253 information types
- information-type identifiers
- confidentiality categorization
- integrity categorization
- availability categorization
- overall/baseline categorization presentation
- digital identity level

### 5.3 System and DoD roles

- information system owner
- DoD NIPRNet connection sponsor
- DoD CSO sponsor/advocate
- authorizing official
- assignment of security responsibility
- named contacts
- titles
- organizations
- addresses
- phone numbers
- email addresses
- other role/contact structures discovered in the template

### 5.4 System characteristics

- operational status
- cloud service model
- cloud deployment model
- allowed tenant model
- hybrid deployment explanation
- leveraged authorizations
- leveraged authorization contacts
- system/component boundary
- system environment

### 5.5 Inventories and architecture

- hardware inventory
- software inventory
- network inventory
- data flow
- ports
- protocols
- services
- purpose
- consumers / "used by"
- diagrams or referenced architecture material
- other inventory structures discovered in the document

### 5.6 Interconnections

Investigate both the general System Interconnections section and
control-specific interconnection requirements.

Determine what the template requires for:

- connected system;
- connected organization;
- connection agreement;
- agreement signer;
- agreement date;
- interface characteristics;
- security requirements;
- information communicated;
- CAP / BCAP / NIPRNet-related information;
- other connection metadata.

Do not assume the current `interconnections[]` model is sufficient merely
because the names are similar.

### 5.7 DoD General Readiness Requirements

Analyze every GRR present in the template.

Determine how the template represents:

- requirement/question text;
- subparts;
- implementation status;
- responsible role;
- implementation/solution narrative;
- equivalent implementation;
- planned implementation;
- applicability;
- references to related NIST controls.

Compare this with Control Freak's existing first-class GRR representation.

### 5.8 Security controls

Analyze all control families and all control structures included in the
template.

At minimum determine how the template represents:

- control ID;
- control enhancement ID;
- title;
- requirement text;
- DoD additional requirement text;
- DoD guidance;
- parameter assignments;
- parameter selections;
- responsible role;
- implementation status;
- control origination;
- inherited controls;
- inherited authorization identification;
- implementation narrative;
- multipart implementation narrative;
- alternative/equivalent implementation;
- not-applicable state;
- risk-acceptance state;
- references to policies/procedures;
- tables embedded inside individual control requirements.

### 5.9 Mission Owner / SLA controls

Analyze Attachment 10 and all other Mission Owner/SLA material.

Determine whether these items are:

- framework controls;
- optional documentation;
- customer responsibility declarations;
- informational requirements;
- separate package material;
- or another semantic category.

Do not automatically merge Mission Owner/SLA controls into the existing IL4
framework population.

09A must determine their relationship to the canonical framework before any
implementation decision.

### 5.10 Attachments and external material

Inventory all template content that expects or references external artifacts,
including as applicable:

- diagrams;
- policies;
- procedures;
- assessment artifacts;
- FedRAMP package artifacts;
- authorization information;
- digital identity worksheets;
- connection agreements;
- SLA material;
- signatures;
- logos;
- other attachments.

Determine whether each item belongs in canonical project data, evidence,
reference metadata, export-time configuration, or outside Control Freak.

---

## 6. Mapping Classification

Every meaningful authorable template element must be classified using one of
the following statuses.

### DIRECT

Existing canonical Control Freak data maps to the template field without
semantic reinterpretation.

Example:

`systemShortName -> CSO abbreviation`

only if inspection confirms that the semantics actually match.

### DERIVED

The value can be safely and deterministically derived from canonical data.

Derived values must not require assumptions.

### PARTIAL

Control Freak models some, but not all, of the information required by the
template element.

The report must identify exactly what is present and what is missing.

### MISSING

Control Freak does not currently model the information.

Do not force a nearby field into service simply to improve mapping coverage.

### STATIC

The material is template boilerplate, instructions, framework text, headings,
footnotes, fixed labels, or other content that should ordinarily remain part
of the source template rather than becoming project-authored data.

### EXTERNAL

The material represents something Control Freak should not fabricate from
project data, such as:

- a signature;
- approval;
- assessment result;
- authorization decision;
- external artifact;
- authoritative external value;
- third-party document.

An EXTERNAL classification does not necessarily mean Control Freak can never
reference or attach the item.

It means it cannot safely synthesize the substantive fact from unrelated
project data.

---

## 7. Mapping Requirements

The final mapping must identify, for each meaningful template element:

- template section;
- page or structural location where practical;
- template field/table/authoring concept;
- intended semantic meaning;
- mapping classification;
- current Control Freak source, if any;
- exact canonical property/model where applicable;
- framework/source property where applicable;
- derivation rule, if DERIVED;
- missing portion, if PARTIAL;
- recommended future ownership;
- relevant semantic risk;
- notes.

A mapping entry should not be considered DIRECT solely because two fields have
similar labels.

---

## 8. Control-Level Semantic Analysis

A major purpose of 09A is to determine whether Control Freak currently has
enough structured control information to populate the IL4 control sections
faithfully.

Analyze the template's control summary structure.

In particular, investigate:

### 8.1 Responsible role

Determine:

- whether the template expects one or multiple responsible roles;
- whether this is a reference to an SSP role record or free text;
- whether it is control-level or statement-level;
- whether current Control Freak ownership/reviewer fields are semantically
  equivalent.

Do not assume application workflow ownership is SSP responsibility.

07C explicitly deferred responsibility/origination semantics.

### 8.2 Implementation status

Compare template statuses with current `ControlImplementation.status`.

Determine whether the current status model can faithfully represent the
template's distinctions, including where present:

- implemented;
- partially implemented;
- not implemented / risk acceptance sought;
- planned;
- alternative implementation / equivalence;
- not applicable;
- GRR-specific Yes/Partial/In process/Planned/Equivalent/No variants.

Do not collapse distinctions during analysis.

### 8.3 Control origination

Analyze the template's origination categories, including:

- Service Provider Corporate;
- Service Provider System Specific;
- Service Provider Hybrid;
- Configured by Customer;
- Provided by Customer;
- Shared;
- Inherited from a pre-existing authorization.

Determine whether Control Freak currently models these semantics.

Do not equate these with application ownership.

### 8.4 Inheritance

Analyze how inherited controls are represented.

Pay particular attention to the template instruction that inherited SaaS/PaaS
controls may require the inherited checkbox and an implementation description
of "inherited."

Determine how this relates to:

- framework baseline inheritance;
- SSP control inheritance;
- leveraged authorization inheritance.

These are distinct concepts and must not be conflated.

### 8.5 Policy/procedure references

The template instructs authors to explicitly reference policies and procedures
by title and date/version and make the referenced location easy for reviewers
to find.

Determine whether current Evidence/reference structures can faithfully express
this or whether a separate structured reference concept is needed.

---

## 9. Parameter and Requirement Analysis

The template contains organization-defined values, DoD assignments, FedRAMP
values, selections, and modified/enhanced control requirements.

Compare these structures with the 06B/07C parameter architecture.

For each relevant template pattern, determine whether existing Control Freak
semantics can faithfully produce it.

Explicitly analyze:

- CSP organization-defined values;
- FedRAMP baseline values;
- DoD explicit assignments;
- DoD permission to use FedRAMP values;
- authoritative external/DSPAV values;
- source conflicts;
- selections;
- multiple values;
- nested values;
- unresolved values;
- documented deviations;
- per-insert synthesis.

The template must not become an authority for per-ODP mapping merely because
it visually contains assignment text.

If the supplied template contains information that appears to establish an
authoritative parameter mapping not present in the currently pinned Rev. 5
source model, record it as research evidence only.

Do not change the IL4 per-ODP mapping set in 09A.

---

## 10. Currentness and Provenance Research

09A must investigate the current status of the supplied template using
authoritative sources where available.

Prefer:

- DoD Cyber Exchange;
- DISA;
- official DoD publications;
- official current DoD Cloud Computing SRG artifacts.

Determine as far as the evidence permits:

1. the origin of the supplied template;
2. the meaning of filename `v1.8`;
3. the meaning of internal `Template (Version 2)`;
4. the SRG revision/release against which it was written;
5. whether this exact template remains current;
6. whether it has been superseded;
7. whether a Rev. 5 SSP/Addendum template exists;
8. the relationship between this template and the currently pinned:
   - DoD Cloud Computing SRG;
   - DoD Rev. 5 SSP Addendum Controls v1.2;
   - Table D-1 IL4 tailoring semantics;
9. whether the correct future Control Freak export target should be:
   - this exact template;
   - a newer official template;
   - a different DoD artifact;
   - or a generated equivalent based on a current authoritative structure.

If authoritative public evidence is insufficient, say so.

Do not use a vendor/blog copy as authority for a replacement template.

Do not silently replace the supplied artifact.

---

## 11. DOCX Technical Analysis

09A must inspect the actual Word package sufficiently to determine how a
future high-fidelity template renderer should work.

This is analysis only.

Do not implement the renderer.

Investigate at minimum:

- DOCX package structure;
- document XML;
- paragraph/run structure;
- tables;
- nested tables;
- styles;
- numbering;
- section breaks;
- headers;
- footers;
- page numbering;
- fields;
- content controls;
- legacy form fields;
- checkboxes;
- bookmarks;
- hyperlinks;
- relationships;
- images;
- DoD seal/logo handling;
- footnotes/endnotes;
- table of contents;
- captions;
- cross-references;
- page/section orientation;
- repeating control structures;
- placeholder patterns;
- revision/track-changes state if present.

Determine which portions can be safely populated while preserving the original
document structure.

---

## 12. High-Fidelity Export Goal

The future exporter should not create a Control Freak document that merely
resembles the DoD template.

The desired architecture is:

    Canonical Control Freak project data
                    |
                    v
    Canonical framework / parameter resolution
                    |
                    v
    Canonical SSP view/synthesis model
                    |
                    v
    DoD IL4 template adapter
                    |
                    v
    Pinned official/source DOCX template
                    |
                    v
    Populated IL4 SSP Addendum DOCX

The future output should preserve the original template's native formatting
where technically feasible, including:

- styles;
- tables;
- headings;
- headers/footers;
- section layout;
- numbering;
- boilerplate;
- footnotes;
- captions;
- control ordering;
- images;
- page structure.

09A must determine whether direct mutation of the DOCX package is technically
preferable to reconstructing the document using the existing `docx` library.

Do not assume the existing renderer technology is appropriate.

---

## 13. Renderer Technology Research

Evaluate the technical options for populating the existing DOCX.

At minimum consider:

1. existing `docx` package capabilities;
2. direct Open XML package/XML manipulation;
3. a template-aware DOCX library;
4. a hybrid approach.

For each viable option, evaluate:

- formatting preservation;
- ability to populate existing tables;
- checkbox/form-field handling;
- content control support;
- headers/footers;
- TOC preservation/update implications;
- image preservation;
- cross-reference preservation;
- ability to add/remove repeated rows or sections;
- server-side compatibility;
- Next.js compatibility;
- licensing;
- maintenance risk;
- deterministic testing;
- security implications of processing DOCX packages.

Do not add a dependency in 09A.

Do not modify `package.json` or `package-lock.json`.

The report should recommend a renderer architecture, not install one.

---

## 14. Gap Analysis

The report must produce a concrete gap inventory.

Group missing/partial information into useful categories.

At minimum consider:

### General SSP/document metadata

Examples may include:

- document version;
- revision history;
- prepared-by information;
- document classification handling.

### DoD-specific system metadata

Examples may include:

- NIPRNet sponsor;
- DoD sponsor/advocate;
- DISA AO information;
- CNSSI-specific information;
- digital identity level.

### Cloud characteristics

Examples may include:

- SaaS/PaaS/IaaS model;
- deployment model;
- tenant model;
- hybrid deployment explanation.

### Authorization/leveraging metadata

Examples may include:

- FedRAMP baseline SSP reference;
- leveraged authorizations;
- authorization dates;
- authorizing officials;
- assessment organizations;
- leveraged authorization contacts.

### Architecture and inventory

Examples may include:

- hardware;
- software;
- network inventory;
- data flow;
- ports/protocols/services;
- diagrams.

### Responsibility and origination

Examples may include:

- SSP responsible roles;
- control origination;
- customer responsibility;
- inherited authorization.

### Control-level documentation

Examples may include:

- richer implementation statuses;
- multipart GRR answers;
- equivalence/risk-acceptance documentation;
- structured policy/procedure references.

### External/package artifacts

Examples may include:

- signatures;
- connection agreements;
- external assessment artifacts;
- digital identity worksheet;
- SLA attachments.

---

## 15. Future Data Ownership Classification

For every identified gap, recommend one of the following future ownership
categories.

### CANONICAL PROJECT DATA

Information intrinsic to the documented system and useful across frameworks.

### FRAMEWORK-SPECIFIC PROJECT DATA

Authored project information specifically required by DoD IL4 or another
framework and inappropriate as generic system metadata.

### DERIVED DATA

Information that should be computed from canonical state.

### FRAMEWORK/SOURCE DATA

Immutable information supplied by the authoritative framework/template/source.

### EXTERNAL REFERENCE / ARTIFACT

Information represented by a referenced or attached external document.

### EXPORT-TIME DATA

Information legitimately specific to a generated document instance rather
than the underlying system.

Use this category sparingly.

### INTENTIONALLY UNSUPPORTED

Information Control Freak should not attempt to model or synthesize.

Do not recommend adding every Word-template cell to `ProjectMetadata`.

---

## 16. Required Research Deliverable

Create or complete:

`docs/research/09A-dod-il4-ssp-addendum-template-mapping.md`

The report must become the durable research record for this milestone.

At minimum it must contain:

1. Executive conclusion
2. Source document identification
3. Provenance/currentness findings
4. Relationship to current pinned DoD IL4 sources
5. Template structural overview
6. Complete section inventory
7. Field-by-field mapping
8. GRR mapping
9. Security-control mapping
10. Parameter/resolution mapping
11. Responsibility/origination analysis
12. Current Control Freak coverage
13. Missing/partial information
14. Gap ownership recommendations
15. DOCX/Open XML structural analysis
16. Renderer technology analysis
17. High-fidelity population feasibility
18. Semantic risks and traps
19. Recommended 09B scope
20. Recommended future template-rendering milestone scope
21. Explicit deferred/out-of-scope items

---

## 17. Mapping Summary Metrics

The final report must include summary counts for:

- DIRECT
- DERIVED
- PARTIAL
- MISSING
- STATIC
- EXTERNAL

Counts should be based on a documented mapping unit.

The report must define what constitutes one mapping unit so the numbers are
reproducible and meaningful.

Also summarize coverage by major area, for example:

- document metadata;
- system characteristics;
- DoD-specific metadata;
- inventories/architecture;
- interconnections;
- GRRs;
- controls;
- parameters;
- responsibility/origination;
- external/package artifacts.

The purpose is not to produce a flattering coverage percentage.

The purpose is to make the remaining work measurable.

---

## 18. Recommended 09B Decision

09A must recommend a bounded 09B milestone.

09B should address only the information-model gaps that are necessary and
architecturally appropriate before template export.

The recommendation must distinguish between:

- information that should be added to Control Freak;
- information already modeled sufficiently;
- information that belongs to evidence/attachments;
- information that should remain framework/source data;
- information that should remain external;
- information that should not be modeled.

Do not implement 09B during 09A.

---

## 19. Future Template Export Milestone

09A must also recommend the scope of the later template-rendering milestone.

The future renderer should, subject to the research findings:

- use a pinned source template;
- consume canonical SSP/domain data;
- preserve source formatting;
- populate fields deterministically;
- preserve unresolved states honestly;
- never invent authorization/assessment facts;
- never invent authoritative parameter values;
- clearly represent missing documentation;
- preserve framework boilerplate separately from authored project content;
- be testable without Microsoft Word installed on the server.

The future milestone must define what happens when Control Freak lacks data
required by the template.

The default principle should be fail-visible, not fabricate.

---

## 20. Out of Scope for 09A

The following are explicitly out of scope:

- implementing the IL4 DOCX exporter;
- changing the generic Control Freak SSP renderer;
- redesigning the generic SSP DOCX;
- changing the project schema;
- adding project metadata fields;
- SQL migrations;
- changing the System UI;
- changing control authoring UI;
- changing GRR authoring UI;
- implementing responsibility/origination;
- implementing leveraged authorizations;
- implementing inventory management;
- implementing attachments;
- adding IL4 per-ODP mappings;
- changing parameter precedence;
- OSCAL `set-parameters`;
- changing framework populations;
- adding Mission Owner/SLA controls to the framework population;
- adding dependencies;
- changing production;
- deployment;
- starting 09B;
- starting the template-rendering milestone.

---

## 21. Semantic Safety Rules

09A must follow these rules throughout the analysis.

1. **Do not infer authorization.**  
   Selecting or documenting IL4 does not mean a system is DoD-authorized.

2. **Do not infer FedRAMP authorization.**  
   Framework selection does not establish an existing FedRAMP Moderate
   authorization.

3. **Do not infer categorization from framework selection.**  
   IL4 framework selection must not silently populate project categorization.

4. **Do not invent missing SSP facts.**

5. **Do not treat template boilerplate as project-authored evidence.**

6. **Do not treat a template's historical statement as current authority
   without verification.**

7. **Do not create a second control-resolution path.**

8. **Do not create a second parameter-resolution path.**

9. **Do not equate Control Freak workflow ownership with SSP responsibility.**

10. **Do not equate framework inheritance with SSP control origination or
    inherited authorization.**

11. **Do not treat Mission Owner/SLA controls as ordinary IL4 framework
    controls without evidence.**

12. **Do not optimize the mapping to produce a high coverage percentage.**

---

## 22. Validation

Because 09A is research/architecture work, normal application behavior should
remain unchanged.

At completion confirm:

- no application source behavior changed;
- no project schema changed;
- no SQL migration was added;
- no package dependency changed;
- no framework population changed;
- no IL4 per-ODP mapping was added;
- no SSP renderer changed;
- no production configuration changed.

If source pinning or documentation changes affect repository validation, run
the appropriate non-destructive checks.

At minimum run:

`git diff --check`

If application/source files were unexpectedly modified, investigate before
completion.

---

## 23. Milestone Completion Criteria

09A is complete when:

- the supplied source DOCX is pinned immutably;
- source provenance/currentness has been researched as far as authoritative
  evidence permits;
- the complete template has been analyzed;
- all meaningful authorable template concepts have been inventoried;
- mapping classifications have been assigned;
- mapping summary counts exist;
- current Control Freak coverage is understood;
- missing information is explicitly identified;
- responsibility/origination gaps are understood;
- Mission Owner/SLA semantics are understood sufficiently to avoid accidental
  framework changes;
- DOCX structure has been technically inspected;
- renderer approaches have been evaluated;
- a recommended 09B scope exists;
- a recommended future template-rendering architecture exists;
- the durable research report is complete;
- no implementation work has begun.

---

## 24. Architecture STOP — accepted disposition

Architecture review accepted 2026-09-28. Final decisions are ADR-033.

Accepted disposition:

1. The pinned `IL4-Mod-SSP-Addendum-v1.8.docx` is **not** an authoritative
   requirements source for `dod-cloud-il4-rev5`.
2. Control Freak will **not** populate that historical DOCX with the current
   Rev. 5 control population.
3. The document **is** accepted as a structural/design reference for a future
   Control Freak-owned DoD IL4 SSP Addendum.
4. Authoritative requirements and generated content continue to come from the
   pinned Rev. 5 source set and the canonical Control Freak model.
5. Control Freak is **not** waiting for a replacement official Word template.
   The intended future export is a Control Freak-owned addendum informed by
   this document's structure.
6. Responsibility/origination and other missing SSP concepts remain inputs to
   a later architecture milestone. They are not part of closing 09A.
7. Closing 09A changes no framework population, parameter-resolution
   semantics, IL4 per-ODP mappings, project schema, SSP renderer, or
   application behavior.

Do not start 09B or a template-rendering milestone without a separate
approval.

---

## 25. Final Report Expected from the Agent

At the architecture STOP, report:

1. source artifact pinned path and SHA-256;
2. provenance/currentness conclusion;
3. relationship to current DoD IL4 pinned sources;
4. number of mapping units analyzed;
5. DIRECT count;
6. DERIVED count;
7. PARTIAL count;
8. MISSING count;
9. STATIC count;
10. EXTERNAL count;
11. strongest areas of existing Control Freak coverage;
12. largest information-model gaps;
13. responsibility/origination findings;
14. GRR findings;
15. Mission Owner/SLA findings;
16. parameter-resolution findings;
17. DOCX/Open XML findings;
18. recommended rendering technology/architecture;
19. recommended 09B scope;
20. recommended future template-rendering milestone scope;
21. files added/changed;
22. validation performed;
23. repository/working-tree state;
24. unresolved questions requiring human decision.

Do not continue beyond the architecture STOP.