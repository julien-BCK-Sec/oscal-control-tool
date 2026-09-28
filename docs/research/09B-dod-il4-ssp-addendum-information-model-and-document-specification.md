# 09B — DoD IL4 SSP Addendum Information Model and Document Specification

Research and document specification for Milestone 09B. No information model,
schema, UI, or renderer was implemented. Architecture review accepted this
record on 2026-09-28.

Date: 2026-09-28
**Status:** Complete
**ADR:** ADR-034 (accepted)
**Depends on:** Milestone 09A, ADR-033, ADR-029, ADR-030, ADR-031, ADR-032

---

## 1. Executive conclusion

Control Freak should generate its own **DoD IL4 SSP Addendum**. The document
records the DoD-specific additions and adjustments in the current
`dod-cloud-il4-rev5` framework, plus the project responses already stored
for those items. It accompanies a broader SSP. It does not replace one, and
it does not claim that a FedRAMP Moderate authorization exists.

The historical file
`vendor/dod/cloud-il4-rev5/templates/IL4-Mod-SSP-Addendum-v1.8.docx`
remains a structural and design reference only (ADR-033). Requirements and
generated content come from the pinned Rev. 5 source set and the existing
canonical framework, parameter-resolution, and SSP-synthesis paths.

The first useful export does **not** need new canonical fields. Missing
facts stay visible. Concepts the historical template collected, and that
Control Freak does not yet model, are omitted with an explicit scope
statement rather than printed as blank official-looking tables.

**Accepted document population:**

```text
32 detailed items + 1 membership note + 312 not reprinted = 345
```

The 32 detailed items are 10 GRRs + 22 NIST controls/enhancements. The 22
NIST items are 12 controls not in FedRAMP Moderate plus 10 FedRAMP Moderate
controls with a Table D-1 parameter adjustment. SC-18 is the membership
note. The other 312 FedRAMP Moderate controls stay in the 345-item
framework and are not reprinted.

**Next implementation step:** Milestone 09D, the addendum view model and
renderer, on the current domain model. 09C is not required. 09D is not
started by this record.

---

## 2. How to read this record

Each significant recommendation is labeled as one of:

- **Source-supported fact** — pinned repository source, or a named external
  authority retrieved for this milestone.
- **Existing architecture** — an accepted ADR or implemented Control Freak
  behavior. 09B does not change it.
- **Accepted decision** — architecture review accepted this recommendation
  on 2026-09-28. Acceptance does not implement it.

---

## 3. Sources inspected

### 3.1 Pinned Rev. 5 set

| Source | Repository form | Role in this specification |
| --- | --- | --- |
| NIST SP 800-53 Rev. 5 catalog, OSCAL catalog `5.2.0`, SHA-256 `01f37cf90ea99d92242c936cbfbdebcc338eef1f71454e2acac36cc56e9bc062` | `vendor/oscal/v1.2.2/catalogs/NIST_SP-800-53_rev5_catalog.json` | Normative control text and ODP identity |
| FedRAMP Security Controls Baseline, Rev. 5 Moderate, SHA-256 `fa3282f0f31356d8b001c64fcc105091826f0de88a294e380afd1e0b56a9830c` | `vendor/dod/cloud-il4-rev5/FedRAMP_Security_Controls_Baseline.xlsx` | FedRAMP Moderate selection and assignments. 323 items |
| DoD Rev 5 SSP Addendum Controls v1.2, IL4 Moderate sheet, workbook SHA-256 `80475917868603d65c01a0e82be7cdd9e12095ea08047b397a8244a9177b6fcd`, modified 2025-12-03 | `vendor/dod/cloud-il4-rev5/extracts/addendum-il4-moderate.json` | PA-facing 345-item population, GRR text, DoD columns. Extract only |
| CSP SRG V1R7 Appendix D Table D-1, 30 June 2026, package Y26M06, PDF SHA-256 `fcb472f563283f293e224fcf72987584deb6019482a264a6536c2d5c1a5df51f` | `vendor/dod/cloud-il4-rev5/extracts/appendix-d-il4-parameter-notes.json` | 23 IL4-applicable rows. FedRAMP+ delta. Not the full population |
| IL4 per-ODP mappings | `vendor/dod/cloud-il4-rev5/extracts/il4-parameter-mappings.json` | Empty `mappings` array. Unchanged |
| Generated framework | `src/data/framework/generated/dod-cloud-il4-rev5.json` | Read-only inspection. Counts 183 / 152 / 10 / 345. Not modified |
| Historical DOCX, SHA-256 `4c511a6b4b8e7e69922e980f8064e6059d30944dcf8506f6070eacfcdc7530ea` | `vendor/dod/cloud-il4-rev5/templates/IL4-Mod-SSP-Addendum-v1.8.docx` | Structural/design reference only (ADR-033) |

**Source-supported fact.** The original Addendum workbook is **not** pinned.
`vendor/dod/cloud-il4-rev5/local/` is gitignored and contains only
`.gitignore`. 09B did not retrieve, reconstruct, or substitute the xlsx.
The hash-locked extract is the repository representation. `SOURCES.md`
records the workbook SHA-256 and the fail-closed regeneration rule.

**Source-supported fact.** The CSP SRG V1R7 PDF and zip are not committed.
Table D-1 IL4 rows are the pinned extract. 09B did not re-extract the PDF
and did not invent V1R7 section numbers for GRR discussions.

### 3.2 External authorities retrieved 2026-09-28

These are distinguished from the pinned requirements path.

| Source | What it supports | What it does not do |
| --- | --- | --- |
| DISA Cloud Connection Process Guide, Version 3, December 2025, `https://dl.dod.cyber.mil/wp-content/uploads/cloud/pdf/DoD%20Cloud%20CPG%20Final%2019%20Dec%202025.pdf` | A current DISA process guide still lists "System Security Plan (SSP) and SSP Addendum(s)" as separate package artifacts. It defines a DoD Mission Sponsor as the Component responsible for the connection. It cites CNSSI 4009 for terms such as authorizing official and authorization to operate | It does not specify addendum section contents, control population, or origination checkboxes. It does not replace SRG V1R7 or the Addendum workbook |
| DISA *DoD Cloud Authorization Process* note, `https://dl.dod.cyber.mil/wp-content/uploads/cloud/pdf/unclass-dod_cloud_authorization_process.pdf` (already cited by 09A and the 06B audit) | The public note still lists a DoD SSP Addendum beside the SSP, SAP, and other package artifacts | It does not name the historical DOCX, Template (Version 2), or `v1.8` |
| FedRAMP legacy SSP guidance, `https://www.fedramp.gov/legacy/playbook/csp/authorization/ssp/`, page dated as legacy content on 24 June 2026 | The legacy Rev. 5 SSP used seven control-origination categories and five implementation-status values. Inheritance meant a pre-existing FedRAMP authorization, with name, FedRAMP ID, and date | FedRAMP marks this material as legacy. `SOURCES.md` says the FedRAMP 2026 Consolidated Rules are **not** the IL4 base. This page is not imported into the framework |
| FedRAMP Consolidated Rules for 2026, public notices and the Security Decision Record reference (optional adoption 4 July 2026; Rev. 5 obtain date 1 January 2027 in the retrieved pages) | FedRAMP is replacing the traditional SSP with a Certification Package Overview and a Security Decision Record. The retrieved SDR rule lists implementation status as Implemented, Partially Implemented, Planned, Alternative Implementation, or Not Applicable, and describes inheritance in the implementation summary | Not the IL4 base. Not adopted as Control Freak vocabulary. Recorded so the legacy seven-way checkbox set is not treated as current FedRAMP authority by default |

**Source-supported fact.** The HTML still served at
`https://dl.dod.cyber.mil/wp-content/uploads/cloud/` is Cloud Computing SRG
**Version 1 Release 3, 6 March 2017**. Already recorded as stale in
`SOURCES.md`. Not used.

**Contradiction, fail closed.** FedRAMP's own program is moving off the SSP
template. DoD's December 2025 Cloud CPG still asks for an SSP and an SSP
addendum, and Control Freak's pinned IL4 base remains FedRAMP Moderate
Rev. 5 plus the DoD overlay. The proposed addendum documents that pinned
composition. It is not a FedRAMP 2026 certification package, and it is not
a filled legacy FedRAMP SSP appendix.

A current CNSSI 1253 publication was not retrieved. The pinned Addendum
extract mentions CNSSI 1253 only inside NIST discussion text (national
security system categorization guidance). It does not define CNSSI type
identifiers for IL4. Absence of a retrieved CNSSI PDF is not proof that
DoD no longer uses CNSSI 1253 anywhere. It is enough to refuse inventing
CNSSI identifiers in this document.

---

## 4. Purpose and document identity

**Accepted decision.** The document is a **Control Freak DoD IL4 SSP
Addendum**.

Accepted title:

> Control Freak DoD IL4 SSP Addendum

Accepted subtitle:

> Documented against DoD Cloud Impact Level 4 (FedRAMP Rev. 5 Moderate + DoD IL4 overlay)

The subtitle names the Control Freak framework composition. A provenance
section lists the pinned source versions and hashes. The subtitle does not
say "Template", "DISA", or "official".

| Topic | Accepted rule |
| --- | --- |
| What it claims | A Control Freak-generated addendum of DoD IL4 additions, adjustments, GRRs, and the project responses recorded for those items |
| Cover identity | `systemName`. `systemNameShort` only when authored. SSP organization is `organizationName`. `systemIdentifier` when authored |
| Generator identity | The cover and footer say the file was generated by Control Freak |
| Document version | No authored SSP version in the first export. Control Freak project revision is labeled as a project revision, not as a FedRAMP or DoD document version |
| Generated date | Export-time timestamp, labeled as generated time |
| Provenance | Framework id `dod-cloud-il4-rev5`, source titles, versions, and the pinned SHA-256 values already stored on the generated artifact |
| Specification identity | Layout id `cf-il4-addendum-docx`, version `1.0`, distinct from `cf-ssp-docx` 1.0 |

**Accepted decision.** The document must not claim to be an official DoD,
DISA, or FedRAMP template; an authorization; a Provisional Authorization; an
Authority to Operate; evidence of IL4 authorization; evidence of FedRAMP
authorization; or evidence of DoD approval.

Scope statement, required in the document body:

- Framework selection does not categorize the system and does not authorize it.
- Missing information is labeled. Empty lists mean "not documented," not
  "none exist."
- Unresolved parameters, authoritative-value-required, and source conflicts
  stay unresolved.
- Linked Evidence is a reference. It is not an assessment result.
- This file is not the historical DISA Word template and was not produced by
  filling that template.
- Controls in the FedRAMP Moderate baseline that DoD has not added or
  adjusted are omitted here on purpose. They remain in the 345-item
  framework. Their implementations, when documented, are in the separate
  Control Freak System Security Plan. That plan is not a FedRAMP SSP.
- Control implementation responsibility, control origination, leveraged
  authorizations, inventories, diagrams, sponsors, cloud service model, and
  cloud deployment model are not recorded in this version. Omission is not
  a claim that none exist.

---

## 5. Relationship to a FedRAMP Moderate SSP

**Source-supported fact.** The historical template describes itself as an
addendum to a FedRAMP Moderate baseline SSP and says a CSP without a
Federal AO-approved Moderate SSP must provide a complete SSP instead
(09A). The December 2025 Cloud CPG still lists an SSP and SSP addendum(s)
as separate artifacts.

**Existing architecture.** `dod-cloud-il4-rev5` is FedRAMP Moderate Rev. 5
plus a DoD overlay (ADR-029). Selecting it does not create a FedRAMP
authorization, a DoD authorization, or a second SSP record. The generic
Control Freak SSP (`cf-ssp-docx` 1.0) already prints the full selected
framework, including all 345 IL4 items.

**Accepted decision.**

- The addendum is explicitly an addendum to the system's broader SSP
  documentation. It is not itself a FedRAMP Moderate SSP.
- Generation does not require a referenced FedRAMP SSP. If none is
  recorded, the scope statement says so. Control Freak does not infer one
  from framework selection or from `leveragedFromFedrampModerate`.
- A baseline-SSP identifier, version, and date are not V1 canonical data.
  If a later milestone records one, it is an **external artifact
  reference** (section 12), not a copy of the FedRAMP package and not a
  leveraged authorization.
- The addendum repeats only the system facts a reader needs to know which
  system the delta belongs to, plus the full text of each included
  requirement. It does not reprint the 312 unchanged FedRAMP Moderate
  controls. Those narratives have one canonical home: `ControlImplementation`
  on the project, already exported by the generic SSP.
- Do not maintain a second copy of boundary, categorization, or control
  narratives inside an "addendum metadata" object.

---

## 6. Document population rule

**This is a required architecture decision.**

**Source-supported fact.** The PA-facing control **population** is the
Addendum IL4 Moderate sheet: 345 items (SOURCES.md, ADR-029). CSP SRG
Table D-1 is the FedRAMP+ **delta**, not that population. The current pin
has 23 IL4-applicable Table D-1 rows (`TABLE_D1_IL4_COUNT`). Twelve NIST
items are in the Addendum and not in the pinned FedRAMP Moderate baseline
(`DOD_ADDED_NIST_BASE_IDS` and `DOD_ADDED_NIST_ENHANCEMENT_IDS`). All twelve
appear in Table D-1. Ten GRRs are not NIST controls.

Computed from the current generated artifact, without modifying it:

| Class | Count |
| --- | --- |
| Framework items | 345 |
| In FedRAMP Moderate | 323 |
| Not in FedRAMP Moderate | 22 (12 NIST additions + 10 GRRs) |
| Table D-1 IL4 rows | 23 |
| Table D-1 inclusion-only | 6 (MA-5(5), SA-9(6), SA-9(7), SA-9(8), SC-12(6), SC-18) |
| `leveragedFromFedrampModerate` false | 30 |

`leveragedFromFedrampModerate` is provenance only (ADR-029 amendment,
Milestone 06B). It is not the population rule. Eight FedRAMP members with
real Table D-1 adjustments are marked leveraged **false** (AC-7, CM-7(5),
IA-5(1), MA-5(1), PE-15, SA-9(1), SA-9(5), SC-17). Using the flag as
"print these" would drop other adjustments (MA-6, PS-4) and would mix GRRs
with a column the CSP SRG does not define.

**Accepted decision.** The addendum prints an **IL4 delta view**:

1. All ten GRRs (`grr-1` through `grr-10`).
2. All twelve NIST controls that are not in FedRAMP Moderate.
3. Each FedRAMP Moderate control whose Table D-1 row is a parameter
   adjustment (`explicit-value`, `dspav-must-be-used`, or
   `may-use-fedramp`), not `inclusion-only`.

**Detail set (32 = 10 GRRs + 22 NIST controls/enhancements):**

| Group | Identifiers |
| --- | --- |
| GRRs | GRR-1, GRR-2, GRR-3, GRR-4, GRR-5, GRR-6, GRR-7, GRR-8, GRR-9, GRR-10 |
| Not in FedRAMP Moderate | AU-5(1), MA-5(5), PS-3(4), SA-4(5), SA-9(3), SA-9(6), SA-9(7), SA-9(8), SC-12(6), SC-18(2), SC-24, SC-46 |
| FedRAMP Moderate, Table D-1 adjustment | AC-7, CM-7(5), IA-5(1), MA-5(1), MA-6, PE-15, PS-4, SA-9(1), SA-9(5), SC-17 |

**Membership note, not a full control section (1):** SC-18. It is already
in FedRAMP Moderate. Table D-1 lists it with an empty parameter value
(`inclusion-only`). Printing a full "DoD change" section would invent an
adjustment. Omitting the name would hide a Table D-1 row. One sentence
states that membership and points at the generic SSP for the
implementation.

**Not reprinted (312):** the other FedRAMP Moderate controls. The document
states the count and the reason. It does not print a 312-row matrix.

Accepted accounting:

```text
32 detailed items + 1 membership note + 312 not reprinted = 345
```

**Why not all 345.** The authoring framework stays complete. A second
document that repeats every leveraged FedRAMP control would duplicate the
generic SSP and would no longer be an addendum. The historical template's
purpose, the Cloud CPG's split between SSP and addendum, and Table D-1's
role as the FedRAMP+ delta all point at a delta document. The 345-item
workbook remains the population authority for the framework, not a
requirement to reprint every row as narrative.

**Why not "Table D-1 plus GRRs" alone.** Five inclusion-only rows are
DoD-added controls (MA-5(5), SA-9(6), SA-9(7), SA-9(8), SC-12(6)). They
are not in FedRAMP Moderate. An addendum that skipped them because they
lack a parameter value would drop selected requirements. They are in
group 2 above.

**Why not the historical Table 11-1.** That matrix is a Rev. 4-oriented
187-row table (09A). It is not the 345-item set.

The renderer filters the existing framework read model with this rule. It
does not create a second framework, and it does not drop the 312 items
from authoring, Evidence, or the generic SSP.

SC-46 remains conditional on a Cross Domain Solution. The entry states that
condition. Control Freak does not mark the control not applicable.

---

## 7. V1 document structure

Historical sections were kept only where the current source set or the
existing canonical model supports them.

| Section | Class | Basis |
| --- | --- | --- |
| Cover | REQUIRED | System identity the reader needs. Control Freak title and disclaimer. No seal, no classification line |
| Document status and generation metadata | REQUIRED | Separates export time, project revision, layout id, and source pins |
| Table of contents | REQUIRED | Same mechanism as `cf-ssp-docx` 1.0: a Word TOC field over real headings. Page numbers are a `PAGE` field. Both update when a word processor opens the file. This is not the historical template's cached TOC |
| Purpose, scope, and relationship to the broader SSP | REQUIRED | States the delta rule, the non-claims, and the concepts this version does not record |
| Source and framework provenance | REQUIRED | Pinned sources and hashes from the generated artifact. States that the historical DOCX is not the content source |
| System identification | REQUIRED | Existing `ProjectMetadata`: name, short name, identifier, SSP organization, overview, operational status and remarks. Placeholders when empty |
| Authorization boundary and environment | REQUIRED | Existing distinct narratives. No CAP/NIPRNet delta field |
| Security categorization and information types | REQUIRED | Authored FIPS 199 values, derived high-water mark only when all three system values exist, authored DoD cloud impact assertion, information types. Never inferred from IL4. Not labeled CNSSI |
| SSP roles | REQUIRED | Existing `systemRoles`. Empty collection copy when none are recorded. Project authorizing official is not described as the DISA AO |
| Interconnections | REQUIRED | Existing interconnection fields. Empty collection copy. No agreement-signer columns |
| Population accounting | REQUIRED | 345 / 32 / 1 / 312, with the rule in section 6. Makes the omission visible |
| DoD General Readiness Requirements | REQUIRED | All ten, in identifier order, before the NIST delta |
| IL4 NIST additions and adjustments | REQUIRED | The 22 NIST detail items, grouped by family, plus the SC-18 membership note |
| Appendix: how to read parameters and unresolved states | REQUIRED | Short reader key for the existing resolution states. Not a second resolution engine |
| Revision history | OMIT | Not ControlActivity and not project revision history. Generation metadata covers this version |
| Prepared-by / prepared-for tables, addresses, logos | OMIT | One SSP organization. Logos are not generated |
| Classification marking | OMIT | No semantic basis. Do not print UNCLASSIFIED |
| Signature / approval blocks | OMIT | Signing is not export |
| CNSSI 1253 tables and digital-identity level | OMIT | Not in the pinned IL4 field set. Do not derive from FIPS or from framework selection |
| DoD sponsor and NIPRNet sponsor | OMIT | Not modeled. Scope statement. A blank sponsor table would look like an authoring gap |
| Cloud service model and deployment model | OMIT | Not modeled. Scope statement. IL4 selection does not imply either |
| Leveraged-authorization register | OMIT | Not modeled. Scope statement says absence is not "none exist" |
| Inventories, ports/protocols/services, diagrams, data-flow figures | OMIT | Not modeled. Do not emit the historical sample `80/TCP` row |
| Historical Table 11-1 | OMIT | Wrong catalog generation |
| Mission Owner / SLA control responses | OMIT | Not in the 345-item population. See section 16 |
| Responsible-role line and origination checkboxes | OMIT | Not modeled. Scope statement. Do not print empty lines that look like missed checkboxes |

---

## 8. Information ownership

Primary owner, one category per concept. V1 uses only concepts that already
exist, plus export-time metadata.

### 8.1 Already canonical, used in V1

| Concept | Owner | Existing model |
| --- | --- | --- |
| System name, short name, identifier | CANONICAL PROJECT DATA | `ProjectMetadata` |
| SSP organization | CANONICAL PROJECT DATA | `organizationName`. Not the tenant, not a separate CSP-versus-preparer pair |
| Overview, including purpose | CANONICAL PROJECT DATA | `systemDescription` |
| Authorization boundary | CANONICAL PROJECT DATA | `authorizationBoundary` |
| Environment of operation | CANONICAL PROJECT DATA | `environmentOfOperation` |
| Operational status and remarks | CANONICAL PROJECT DATA | SP 800-18 vocabulary already stored. Not an ATO state |
| FIPS 199 CIA and rationale | CANONICAL PROJECT DATA | `securityCategorization`. Overall impact is not stored |
| Derived overall impact | DERIVED DATA | Shown only when all three authored system CIA values exist. Labeled derived. Not persisted |
| DoD cloud impact assertion | CANONICAL PROJECT DATA | `dodCloudImpactLevel`. Distinct from `frameworkId`. Not an authorization |
| SSP roles | CANONICAL PROJECT DATA | `systemRoles`. Documentation records, not application users |
| Information types and per-type CIA | CANONICAL PROJECT DATA | `informationTypes`. Titles are not validated as CNSSI names |
| Interconnections | CANONICAL PROJECT DATA | Existing fields only |
| Implementation narrative | CANONICAL PROJECT DATA | `ControlImplementation.narrative`, including GRRs |
| Implementation documentation status | CANONICAL PROJECT DATA | `not-started`, `in-progress`, `implemented`, `not-applicable` |
| Control statements, GRR question text, ODP identity, overlay class, supplements, applicability | FRAMEWORK / SOURCE DATA | Framework read model. Immutable |
| Resolved statement and unresolved-insert list | DERIVED DATA | `src/ssp/` using `src/domain/parameter-resolution.ts`. One path |
| Evidence references | CANONICAL PROJECT DATA for the Evidence record; the link is operational | Title, type, lifecycle, collection date. Not an assessment |
| Workflow owner, review status | Operational metadata | Not printed as responsibility, origination, or implementation status |
| Generated timestamp, layout id, layout version | EXPORT-TIME DATA | Not stored on the project |
| Framework id, source versions, source hashes, project id, project revision, schema version | EXPORT-TIME DATA copied from saved server state | Project revision is not an SSP version |

### 8.2 Deferred, not in V1

See section 18. Accepting this research does not add these fields.

---

## 9. Control entry

**Existing architecture.** The future renderer consumes the SSP view model
(`SspFrameworkItem` and parameter resolution). It does not synthesize a
second statement.

For each of the 32 detail items, in this order:

1. Identifier and title (`originId` / display id, not a historical heading).
2. Family.
3. Kind: NIST base, NIST enhancement, or GRR.
4. Baseline relationship, from `selectionProvenance`: in FedRAMP Moderate
   or not. `leveragedFromFedrampModerate` may be shown as provenance and
   must be labeled as the Addendum column, not as parameter authority and
   not as a leveraged authorization.
5. Authoritative requirement text: NIST statement for NIST items; GRR
   `controlText` for GRRs. Overlay prose is not merged into that text.
6. Framework assignment and guidance blocks already produced for the
   generic SSP, with their source labels and classification captions.
7. Supplements (SC-17's DODI 8520.02 pointer is a supplement, not an ODP
   value).
8. Notices: source conflict, authoritative value required, conditional
   applicability.
9. Per-insert parameter resolutions and annotations from the existing
   engine (section 11).
10. Implementation documentation status, labeled as documentation status.
11. Implementation narrative, or `[Not yet documented: Implementation narrative]`.
12. Evidence references, or the existing "no linked evidence" sentence.

**Not in the V1 entry:** responsible role, origination, customer-responsibility
split, risk acceptance, "configured by customer" as a status, multipart
answer rows, historical `DoD Assignment:` sentences from the Word file.

A default unedited item is `not-started` with an empty narrative
(`DEFAULT_CONTROL_IMPLEMENTATION`). The document shows that status and the
narrative placeholder. It does not treat the default as a DoD "No" or as
not applicable.

---

## 10. GRR presentation

**Source-supported fact.** All ten rows exist in the Addendum extract as
`GRR-1` through `GRR-10`, family "DoD General Readiness Requirements".
Question text is the extract's `controlText`. Several `discussion` fields
cite **CC SRG V1R4** section numbers. The extract shares source typos with
the historical template ("capabailities" in GRR-7, "Raliance" in GRR-8).

**Existing architecture.** GRRs are first-class framework items
(`itemKind` other / SSP kind `grr`). Authors store one narrative and one
of the four documentation statuses. Current `dspavStatus` for every GRR is
`not-indicated`. They are not NIST ODPs.

**Accepted decision.**

- One subsection per GRR, identifier order, in their own section ahead of
  the NIST delta.
- Heading is the framework identifier and title: `GRR-9`, `GRR-10`. Do not
  copy the historical solution-table mislabels GR-10 and GR-15.
- Question text and discussion are framework/source data, printed as
  pinned, including the V1R4 citations and the source typos. 09B does not
  edit the extract. A V1R7 section crosswalk was not available from a
  pinned page-level source, so new section numbers are not invented.
- The project response is the same narrative model as a NIST control. Parts
  (a)/(b)/(c) stay inside the question text. V1 does not add a structured
  answer per part.
- Status is the existing documentation-status label. It is not Yes, No,
  Partial, Equivalent, Planned, or In process. GRR-10 does not gain a
  special "Not Applicable (not SaaS)" value. SaaS is not inferred.
- No responsible-role line on GRR-5.
- Evidence uses the same reference block as NIST items.
- Empty narrative uses the standard placeholder. The question itself is
  never replaced by the placeholder.

---

## 11. Parameter presentation

**Existing architecture, unchanged.** `src/domain/parameter-resolution.ts`
is the only resolution path. IL4 per-ODP mappings stay empty, so IL4 ODPs
remain `control-level-unmapped`. Overlay prose is not substituted into
individual inserts. `may-use-baseline` is not automatic inheritance.
`documented-deviation`, `dspav-assertion`, and `conflict-proceeding` do not
replace an authoritative value. Aggregate catalog parameters stay hidden;
child ODP ids are the authoring units.

**Accepted decision.** The addendum shows that result. It does not bind
historical labels such as `Parameter (a) (1)` to catalog ids.

| Reader-visible state | What is printed | What is not done |
| --- | --- | --- |
| CSP / organization-defined value | The authored `string[]` for that catalog parameter id, inside the resolved statement when the insert is eligible | Not inferred from the narrative |
| Unresolved organization-defined insert | `[Unresolved ODP: {id} — {label}]` and the parameter in the unresolved list | A blank "Parameter 1" row is not a value |
| FedRAMP base, inherited for IL4 | Control-level assignment block and classification caption | Not copied into each insert while mappings are empty |
| DoD permits FedRAMP value | Classification caption. Substitution only after `accept-permitted-baseline` | The permitted value is not a silent winner. AU-5(1) keeps Addendum provenance when the pinned FedRAMP Moderate baseline has no row |
| DoD explicit or satisfied by the Addendum | Control-level overlay block with its source label | Not imported from the historical `DoD Assignment:` sentences. Not a per-ODP mapping |
| Authoritative value required | Existing notice: DoD requires an authoritative assignment and Control Freak has not guessed one. Current artifact: AC-7, MA-5(1), PE-15, SA-9(3) | AC-7's Table D-1 paragraph is not promoted to a resolved ODP. The current classifier leaves AC-7 unresolved because of the DSPAV fallback. 09B does not reclassify it |
| Source conflict | Existing notice. No winner. Current artifact: IA-5(1) | The historical DOCX is not a tie-break |
| Nested parameters, selections, multiple inserts | Catalog structure and the per-insert walk already used by SSP synthesis | Not the Word file's bracketed sentences |
| Documented deviation or other project annotation | Annotation beside the parameter, labeled as project documentation | Does not override the framework value and is not Mission Owner approval |

---

## 12. Fail-closed presentation

Reuse the generic SSP conventions.

| Situation | Wording |
| --- | --- |
| Missing text field | `[Not yet documented: {Field label}]` |
| Empty collection | The existing empty-collection sentence for roles, information types, or interconnections. An empty list is not a claim that none exist |
| Unresolved ODP | `[Unresolved ODP: {id} — {label}]` |
| Authoritative value required | The existing "DoD assignment required" notice |
| Source conflict | The existing "Source interpretation requires review" notice |
| Conditional applicability | The existing conditional notice. Not automatically not applicable |
| Not applicable | Only when `ControlImplementation.status` is `not-applicable`. Label: "Not applicable". This is the author's documentation status, not a DoD applicability determination |
| Concept not in this version | One scope statement for the whole document (section 4). Do not also print a placeholder line inside every control |
| External artifact not supplied | Not a V1 section. The scope statement covers diagrams, inventories, and a baseline SSP |
| Default status | "Not started" when the implementation record was never edited |

The document must not invent parameter values, authorization status,
categorization, sponsors, responsible roles, origination, leveraged
authorizations, inventories, interconnections, evidence, or artifact
references.

No additional IL4-specific placeholder vocabulary is required. The existing
notices already name the unresolved authority states.

---

## 13. System-level model assessment

| Candidate | Recommendation | V1 |
| --- | --- | --- |
| System name, short name, identifier, organization, overview | Reuse `ProjectMetadata` | Include |
| Authorization boundary, environment, operational status, remarks | Reuse | Include |
| FIPS categorization, information types, DoD cloud impact assertion | Reuse. Do not infer | Include, with placeholders |
| SSP roles, including system owner, authorizing official, system security officer | Reuse. Label the authorizing official as the official recorded for the system | Include |
| Document version and revision history | Defer. Export-time generation metadata is enough for V1. An authored version would be document metadata, not `project.revision` | Omit |
| Baseline SSP reference | Defer. External artifact reference. Not leveraged authorization and not framework inheritance | Omit |
| DoD sponsor, NIPRNet sponsor | Defer. Framework-specific documentation records if ever added. Do not disguise them as `systemRoles` `other`. Sponsorship is not authorization and not a funding commitment | Omit |
| Cloud service model (IaaS / PaaS / SaaS, more than one allowed) | Defer. Generally useful canonical project data, not IL4-only. Not inferred from narratives | Omit |
| Cloud deployment model (public / private / community / hybrid) plus explanation | Defer. Generally useful canonical data. DoD-specific tenant limits are a separate, later, framework-specific fact | Omit |
| Customer versus CSP responsibility narrative | Defer. Generally useful. Do not overload `systemDescription` | Omit |
| Leveraged authorizations | Defer. External authorization reference. See section 14 | Omit |
| Inventories, PPS, architecture and data-flow diagrams | Defer. External artifact references. Do not build a CMDB | Omit |
| CNSSI 1253 identifiers and objective rollup | Defer / do not derive. See section 15 | Omit |
| CAP / NIPRNet boundary delta | Defer. Authors may write it in the existing boundary narrative. No new field | Omit |
| Addresses, logos, classification, signatures | Intentionally unsupported in the first addendum | Omit |

`ProjectMetadata` is not modified in 09B.

---

## 14. Responsibility, origination, status, and leveraged authorizations

These six ideas stay separate.

| Concept | Meaning | V1 |
| --- | --- | --- |
| SSP role / contact | A documentation record on the system (`systemRoles`) | Print existing roles |
| Control implementation responsibility | Which SSP role or roles are responsible for implementing a framework item | Not recorded. Not `ControlRecord.owner` |
| Workflow ownership | Application assignment (`owner` / `coOwner`) | Not printed |
| Control origination | Where the implementation comes from (provider corporate, system-specific, customer, shared, inherited from another authorization, and similar) | Not recorded. Not framework inheritance and not `may-use-baseline` |
| Inheritance from an external system | A named external authorization the offering relies on | Not recorded. Not the Addendum leveraged-from-FedRAMP column |
| Framework baseline / overlay inheritance | FedRAMP value stands, or DoD adjusts it, as read-only overlay class | Print the existing classification caption |

### 14.1 Responsibility

**Accepted decision.** If a later milestone adds responsibility, it is
framework-independent canonical data: zero or more references to existing
`systemRoles` ids, on each framework item. Multiple roles are allowed.
Free text and application user ids are not the model. The concept is
useful for NIST, CMMC, FedRAMP, and DoD output. It is not IL4-only.

It is **not** required for the first addendum. The pinned Rev. 5 workbook
has no responsibility column. Printing an empty "Responsible Role" line
would look like a missed answer. The scope statement is the honest V1
representation.

### 14.2 Origination

**Source-supported fact.** The historical template and the FedRAMP legacy
SSP page use seven categories, with "check all that apply," and an
inherited line that names a pre-existing authorization and a date. The
FedRAMP legacy page says inheritance is from a FedRAMP-authorized IaaS or
PaaS. The historical DoD template says "pre-existing Provisional
Authorization." Those are related and not identical. The pinned OSCAL SSP
schema (1.2.2) defines implementation status
(`implemented`, `partial`, `planned`, `alternative`, `not-applicable`) and
does not define that seven-value origination enum. The FedRAMP 2026
Security Decision Record material retrieved for this milestone describes
inheritance in an implementation summary and does not use the seven
checkboxes. That 2026 material is not the IL4 base.

**Accepted decision.** Do not adopt the seven historical labels as
canonical data in this milestone. Any later origination model must remain
distinct from implementation status, responsibility, framework
inheritance, parameter inheritance, leveraged-authorization records,
evidence, and workflow ownership. An "inherited" origination, if added
later, references a leveraged-authorization record rather than a free-text
PA date on the control. V1 does not print origination checkboxes.

### 14.3 Implementation status

**Accepted decision.** The existing `ControlImplementation.status` enum is
sufficient for V1. Presentation uses the current labels: Not started, In
progress, Implemented, Not applicable. Those words are documentation
status. They are not mapped onto the historical Yes / Partial / Equivalent
/ Planned / risk-acceptance set, and they are not mapped onto the FedRAMP
legacy or 2026 status lists. Mapping would add distinctions Control Freak
does not store.

GRRs use the same enum. No GRR-specific result model. No enum change in
09B.

### 14.4 Leveraged authorizations

**Source-supported fact.** In the Cloud CPG and the public authorization
note, "leverage" refers to reuse of an authorization package or assessment,
not to a control's parameter value. The Addendum column
`Leveraged from FedRAMP Moderate` remains workbook provenance (06B).

**Accepted decision.** A leveraged authorization, if modeled later, is a
user-authored **reference** to an external decision:

- provider or system name;
- authorization type as the user records it (not a Control Freak claim that
  a PA or ATO is valid);
- identifier;
- date granted, when the user supplies it;
- scope note;
- optional external artifact reference.

It is not inferred from framework inheritance, FedRAMP baseline membership,
parameter inheritance, a third-party hostname in a narrative, or Evidence.
Control Freak does not validate the authorization. V1 omits the register
and says leveraged authorizations are not recorded.

---

## 15. CNSSI 1253

**Source-supported fact.** The historical template has CNSSI 1253 type
tables and a categorization rollup. The pinned IL4 extract does not add
CNSSI identifiers. NIST discussion text in that extract points at CNSSI
1253 for national security systems. The Cloud CPG cites CNSSI 4009 for
glossary terms, which is a different instruction. Selecting IL4 does not
establish a CNSSI category (ADR-030).

**Accepted decision.** V1 prints authored FIPS 199 values and information
types under those names. It does not add CNSSI identifier storage, does not
copy FIPS impacts into a CNSSI table, and does not derive a CNSSI rollup
from information types. A high-water mark is only the existing derived
overall impact when all three **system** CIA values exist. Availability
assessment is not assumed.

---

## 16. Mission Owner / SLA

**Source-supported fact.** Historical Attachment 10 lists controls a mission
owner might place in an SLA. Several of those identifiers are outside the
345-item population. AC-2(13) is inside the population because FedRAMP
Moderate includes it (`addendumLeveragedFromFedrampModerate: true`). The
Word file's SLA label on that identifier is a different claim (09A). The
December 2025 Cloud CPG defines a Mission Sponsor for the connection. It
does not adopt Attachment 10 as the IL4 control set.

**Accepted decision.** Omit Attachment 10 responses from the first export.
Do not add those controls to the framework. Do not store SLA answers on
AC-2(13). AC-2(13) is a FedRAMP Moderate item and is not in the delta
detail set, so it is not reprinted.

The scope statement includes one sentence: a historical IL4 template
described some controls as possible mission-owner SLA responsibilities;
that list is not this addendum's control set, and a matching identifier in
the 345-item population is not an SLA assignment.

Mission Owner approval of a parameter value is an external act. A
`documented-deviation` does not record that approval.

---

## 17. Evidence and external references

**Existing architecture.** The generic SSP lists, per item, Evidence title,
type, lifecycle status, and collection date. It states that linked Evidence
has not been independently assessed merely because it is linked. Storage
keys and binaries are not exported.

**Accepted decision.** The addendum uses that same block for each GRR and
each NIST detail item. No URLs are added. Attachments are not embedded.
Presence of Evidence is not implementation proof and not authorization.

Inventories, diagrams, connection agreements, and a FedRAMP SSP file stay
outside Control Freak until a later external-reference model exists. V1
does not invent locators.

---

## 18. Deferred canonical changes

Accepted as deferred. Illustrative only. Not approved TypeScript. Not a
schema. Not authorized for implementation by ADR-034.

V1 requires **no** `ProjectMetadata` change, no SQL migration, and no new
parameter or origination fields.

| Concept | Semantics | Framework-independent | Owner | Cardinality | First export |
| --- | --- | --- | --- | --- | --- |
| Cloud service model | User-asserted IaaS, PaaS, and/or SaaS. Not inferred | Yes | CANONICAL PROJECT DATA | Zero or more of those three values | Defer |
| Cloud deployment model | User-asserted public, private, community, or hybrid, plus optional explanation. Not inferred. DoD tenant limits are not this field | Yes | CANONICAL PROJECT DATA | One model or absent; explanation only with hybrid | Defer |
| Control implementation responsibility | References to `systemRoles` ids. Not workflow owner | Yes | CANONICAL PROJECT DATA | Zero or more per framework item | Defer |
| Control origination | Deferred until vocabulary is chosen against then-current authority. Must not reuse overlay inheritance | Yes, if added | CANONICAL PROJECT DATA | A set, if the chosen authority is multi-valued | Defer. Do not freeze the seven legacy labels now |
| Leveraged authorization reference | User-documented pointer to an external authorization. Not validated | Yes | EXTERNAL REFERENCE, stored as project documentation of that pointer | Zero or more | Defer |
| External artifact reference | Kind, title, identifier, date, locator note. Kinds may include baseline SSP, diagrams, inventories, PPS, agreements. Content is not copied | Yes | EXTERNAL REFERENCE | Zero or more | Defer |
| DoD sponsor and NIPRNet sponsor | Name, title, organization, email, phone. Not an AO and not an authorization | No. DoD connection context | FRAMEWORK-SPECIFIC PROJECT DATA | Zero or one of each | Defer |
| Authored addendum version and revision log | User document metadata. Not project revision and not ControlActivity | Yes | CANONICAL PROJECT DATA, document metadata | Optional | Defer |

Migration, if a later milestone adds any of these: additive fields on
`project_json` with in-memory defaults of empty/absent. No backfill. No
inference. Historical snapshots stay historical. UI would be ordinary
System-tab or control-summary editing, server-validated, tenant-scoped.
Export would read the new fields and would still placeholder anything
absent. None of that is authorized by 09B.

---

## 19. Generation metadata

| Item | Class | V1 |
| --- | --- | --- |
| Generated timestamp | EXPORT-TIME | Yes, labeled generated |
| Layout id and version `cf-il4-addendum-docx` `1.0` | EXPORT-TIME | Yes |
| Control Freak application version, if the build already exposes one to the generic SSP | EXPORT-TIME | Same rule as the generic SSP. Do not invent a version |
| Framework id and title | Saved project + registry | Yes |
| Source titles, versions, SHA-256 pins | FRAMEWORK / SOURCE DATA on the generated artifact | Yes |
| Document specification version | The layout version above | Yes |
| Project id and project revision | Saved server state | Yes, labeled project revision |
| Schema version | Saved server state | Yes |
| User-authored document version | Not modeled | No |
| Deterministic document id | Not required. The file is not stored. Identity is project id + generated timestamp + layout version | No new id |

---

## 20. Visual and layout intent

**Accepted decision.** Informed by the historical addendum's formal cover,
numbered sections, and repeated control blocks. Implemented as a new
Control Freak layout, not as a copy of the pin.

- Cover with the title in section 4, system name, SSP organization, and
  generated date.
- No DoD seal, no official marks, no classification footer.
- Footer text: generated by Control Freak, layout id and version, page
  number. Not `UNCLASSIFIED`.
- Restrained headings. A single heading color is acceptable as document
  styling. It must not imitate an issued DoD publication.
- Gray header row on structured tables, consistent with a readable
  government-document tone and with the existing SSP tables.
- Control entries repeat the same block shape so a 32-item body stays
  scannable.
- Running header may show the system name when it is authored, and the
  document title. It does not show a fake version `0.00`.

---

## 21. Renderer recommendation

**Accepted decision.** Option A. Programmatic generation with the existing
`docx` dependency, through a new layout module. No new dependency.

Pipeline:

```text
canonical project data
        +
framework read model
        +
parameter resolution (existing)
        +
SSP synthesis (existing)
        |
        v
IL4 addendum view model
  (filter to the delta, add scope and provenance)
        |
        v
cf-il4-addendum-docx 1.0
        |
        v
in-memory DOCX
```

The view model may select and arrange `SspFrameworkItem` values. It must
not re-walk catalog inserts or reclassify overlay status.

| Option | Verdict |
| --- | --- |
| A. Existing `docx` library | Recommended. Same server-only pattern as the generic SSP. Tables, headings, header, footer, TOC field, and page field are already proven in `cf-ssp-docx` 1.0. Tests can unzip and assert text. Output stays clearly Control Freak-owned. Hundreds of controls are not required; the detail set is 32 items |
| B. A new Control Freak-owned DOCX template filled by Open XML | Rejected for V1. A binary template becomes a second artifact to keep aligned with canonical content. ADR-033 already rejected filling the historical pin. Tagging a derivative recreates that maintenance problem |
| C. Hybrid | Rejected for the same reason. Prepare-a-template-then-patch is extra process without a fidelity requirement the `docx` library cannot meet |

TOC and page numbers remain Word fields, as in the generic SSP. Tests
should assert the field instructions exist. They should not pretend the
server computed final page numbers.

The generic SSP renderer is not modified to become this document.

---

## 22. Minimum viable V1

### Required

Without these, the file would be misleading or unusable:

- Control Freak identity, title, and the non-claim disclaimer.
- Scope statement, including the delta rule and the list of concepts not
  recorded.
- Source provenance and generation metadata.
- System identification, boundary, environment, categorization, roles, and
  interconnections from existing data, with placeholders and empty-collection
  sentences.
- All ten GRRs with pinned question text, documentation status, narrative
  or placeholder, and evidence references.
- The 22 NIST detail items with canonical synthesis, overlay notices, and
  the same narrative/evidence treatment.
- The SC-18 membership note.
- The 345 / 32 / 1 / 312 accounting.
- Fail-closed parameter and conflict behavior.

### Useful but deferrable

Cloud service and deployment models, sponsors, responsibility, origination,
leveraged-authorization references, external artifacts, authored document
version, customer/CSP responsibility narrative, interconnection agreement
metadata.

### Future enhancement

CNSSI identifiers, digital-identity level, classification markings,
signatures, logos, addresses, inventory CMDB, embedded diagrams, Mission
Owner/SLA responses, GRR part-level answers, a richer status enum, IL4
per-ODP mappings, OSCAL `set-parameters`, population of the historical
DOCX.

V1 does not achieve its boundary by hiding the 312 omitted controls or by
inventing defaults for deferred concepts.

---

## 23. 09A gap reconciliation

Dispositions:

- **include** — print from an existing model in V1.
- **derive** — compute from existing data under a rule already implemented.
- **defer** — real concept, later model, omitted from V1 with the scope
  statement.
- **omit** — do not carry the historical slot forward.
- **external** — authoritative content stays outside; V1 does not store a pointer.
- **unsupported** — deliberately not synthesized.

| Document concept | 09A status | 09B disposition | Ownership | Existing model | Proposed model change | Required for first export | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| U01 CSP name | PARTIAL | include | CANONICAL PROJECT DATA | `organizationName` as SSP organization | None | Yes | One organization. Not also a preparer |
| U02 System name | DIRECT | include | CANONICAL PROJECT DATA | `systemName` | None | Yes | |
| U03 Document version | MISSING | defer | EXPORT-TIME for generation; authored version later | Project revision is a different number | Optional authored version later | No | Do not print project revision as an SSP version |
| U04 Version date | MISSING | include as generated time | EXPORT-TIME DATA | `generatedAt` | None | Yes | Labeled generated, not authored |
| U05 Classification | MISSING | omit | INTENTIONALLY UNSUPPORTED | None | None | No | Do not print UNCLASSIFIED |
| U06 Prepared-by organization | PARTIAL | omit | CANONICAL PROJECT DATA | Same field as U01 | None | No | Duplicate of SSP organization |
| U07 Prepared-by address | MISSING | omit | INTENTIONALLY UNSUPPORTED | None | None | No | |
| U08 Prepared-by logo | EXTERNAL | omit | INTENTIONALLY UNSUPPORTED | None | None | No | |
| U09 Prepared-for CSP | PARTIAL | omit | CANONICAL PROJECT DATA | Same field as U01 | None | No | |
| U10 Prepared-for address | MISSING | omit | INTENTIONALLY UNSUPPORTED | None | None | No | |
| U11 Prepared-for logo | EXTERNAL | omit | INTENTIONALLY UNSUPPORTED | None | None | No | |
| U12 Revision history | MISSING | defer | CANONICAL PROJECT DATA later | None | Optional log later | No | Not ControlActivity |
| U13 Signature block | EXTERNAL | unsupported | INTENTIONALLY UNSUPPORTED | None | None | No | Signing is not export |
| U14 Header system name | DERIVED | derive | DERIVED DATA | `systemName` | None | Yes | Placeholder in the header if the name is missing |
| U15 Header version and date | MISSING | include generated date only | EXPORT-TIME DATA | `generatedAt` | None | Yes | No fake version |
| U16 CSO short name | DIRECT | include | CANONICAL PROJECT DATA | `systemNameShort` | None | Yes, as placeholder if empty | Empty stays empty of invented abbreviations |
| U17 FedRAMP authorization precondition | EXTERNAL | omit | INTENTIONALLY UNSUPPORTED | Framework id is not an authorization | None | No | Scope statement |
| U18 FIPS CIA | PARTIAL | include | CANONICAL PROJECT DATA | `securityCategorization` | None | Yes | Not copied into CNSSI |
| U19 Information type name | DIRECT | include | CANONICAL PROJECT DATA | `informationTypes[].title` | None | Yes | Not validated as a CNSSI name |
| U20 CNSSI identifier | MISSING | omit | INTENTIONALLY UNSUPPORTED | None | None in V1 | No | Do not invent ids |
| U21 Per-type CIA | PARTIAL | include | CANONICAL PROJECT DATA | Information-type impacts | None | Yes | FIPS vocabulary |
| U22 Objective rollup | PARTIAL | derive only for system CIA | DERIVED DATA | Existing high-water mark | None | Yes, only when all three system values exist | Not derived from the type table |
| U23 System categorization | PARTIAL | include | CANONICAL PROJECT DATA | `securityCategorization` | None | Yes | Labeled FIPS 199. Not inferred from IL4 |
| U24 Digital identity level | MISSING | omit | INTENTIONALLY UNSUPPORTED | None | None | No | SP 800-63 guidance on IA controls is framework text, not a system level |
| U25 Digital identity worksheet | EXTERNAL | external | EXTERNAL REFERENCE | None | None in V1 | No | |
| U26 Baseline system owner | EXTERNAL | include the SSP role only | CANONICAL PROJECT DATA | `system-owner` role | None | Yes | Not a copy from a FedRAMP package |
| U27 NIPRNet sponsor | MISSING | defer | FRAMEWORK-SPECIFIC PROJECT DATA | None | Sponsor record later | No | Not an `other` role |
| U28 DoD sponsor | MISSING | defer | FRAMEWORK-SPECIFIC PROJECT DATA | None | Sponsor record later | No | Not a funding commitment |
| U29 Authorizing official | PARTIAL | include | CANONICAL PROJECT DATA | `authorizing-official` role | None | Yes | Not "the DISA AO" |
| U30 DISA AO contact | EXTERNAL | unsupported | INTENTIONALLY UNSUPPORTED | None | None | No | Do not hard-code a name |
| U31 Security responsibility section | EXTERNAL | omit | CANONICAL PROJECT DATA | `system-security-officer` is a role, not this section | None | No | |
| U32 Operational status | DIRECT | include | CANONICAL PROJECT DATA | `operationalStatus` | None | Yes | Not an ATO state |
| U33 Operational status remarks | DIRECT | include | CANONICAL PROJECT DATA | `operationalStatusRemarks` | None | Yes | |
| U34 Service model | MISSING | defer | CANONICAL PROJECT DATA | None | Multi-value later | No | Not inferred |
| U35 Major Application / GSS label | STATIC | omit | INTENTIONALLY UNSUPPORTED | None | None | No | Historical pairing. Not stored |
| U36 Customer vs CSP responsibility | MISSING | defer | CANONICAL PROJECT DATA | `systemDescription` is not this split | Later narrative | No | |
| U37 Deployment model | MISSING | defer | CANONICAL PROJECT DATA | None | NIST deployment model later | No | IL4 does not imply a model |
| U38 Hybrid explanation | MISSING | defer | CANONICAL PROJECT DATA | None | With deployment model | No | |
| U39 Leveraged-authorization intent | MISSING | defer | EXTERNAL REFERENCE | None | With the register | No | Not framework inheritance |
| U40 Leveraged-authorization register | MISSING | defer | EXTERNAL REFERENCE | None | Reference records later | No | A date is not invented |
| U41 Leveraged-authorization contacts | MISSING | defer | EXTERNAL REFERENCE | None | With the register | No | |
| U42 Authorization boundary | DIRECT | include | CANONICAL PROJECT DATA | `authorizationBoundary` | None | Yes | |
| U43 CAP / NIPRNet boundary delta | MISSING | omit as a separate field | CANONICAL PROJECT DATA | May be written in the boundary narrative | None | No | No new field |
| U44 Environment | DIRECT | include | CANONICAL PROJECT DATA | `environmentOfOperation` | None | Yes | |
| U45 Hardware inventory | MISSING | defer | EXTERNAL REFERENCE | None | Artifact reference later | No | No invented columns |
| U46 Software inventory | MISSING | defer | EXTERNAL REFERENCE | None | Artifact reference later | No | |
| U47 Network inventory | MISSING | defer | EXTERNAL REFERENCE | None | Artifact reference later | No | |
| U48 Data-flow description | MISSING | defer | EXTERNAL REFERENCE | None | Artifact reference later | No | |
| U49 Diagrams | EXTERNAL | external | EXTERNAL REFERENCE | Diagrams deferred since 07A | Pointer later, not embed | No | |
| U50 Ports, protocols, services | MISSING | defer | EXTERNAL REFERENCE | None | Not a CMDB in V1 | No | Do not export the sample row |
| U51 Connected system name | DIRECT | include | CANONICAL PROJECT DATA | `interconnections[].name` | None | Yes | |
| U52 Connected organization | DIRECT | include | CANONICAL PROJECT DATA | `interconnections[].organization` | None | Yes | |
| U53 Information communicated | DIRECT | include | CANONICAL PROJECT DATA | `informationExchanged` | None | Yes | |
| U54 Agreement name and date | MISSING | defer | EXTERNAL REFERENCE | None | None in V1 | No | |
| U55 Agreement signer | MISSING | defer | EXTERNAL REFERENCE | None | None in V1 | No | |
| U56 Interface characteristics | PARTIAL | include existing prose fields only | CANONICAL PROJECT DATA | `description` | None | Yes | No new interface model |
| U57 Interconnection security notes | PARTIAL | include | CANONICAL PROJECT DATA | `securityNotes` | None | Yes | |
| U58 CAP / BCAP / NIPRNet facts | MISSING | omit | INTENTIONALLY UNSUPPORTED as a structured field | Direction is not this | None | No | |
| U59–U68 GRR-1 through GRR-10 | PARTIAL | include | FRAMEWORK / SOURCE DATA for the question; CANONICAL PROJECT DATA for narrative and status | `grr-1`…`grr-10`, `ControlImplementation` | None | Yes | No new status vocabulary. No GR-15 label |
| U69 Historical requirement prose | STATIC | omit | FRAMEWORK / SOURCE DATA | Rev. 5 statement via synthesis | None | Yes, the Rev. 5 text | Do not import Word prose |
| U70 Table 11-1 | STATIC | omit | FRAMEWORK / SOURCE DATA | 345-item registry | Population filter only | Yes, the accounting counts | Do not paste a Rev. 4 matrix |
| U71 Responsible role | MISSING | defer | CANONICAL PROJECT DATA | `ControlRecord.owner` is workflow | Role references later | No | |
| U72 Implementation status | PARTIAL | include | CANONICAL PROJECT DATA | Four documentation states | None | Yes | Do not extend the enum |
| U73 Control origination | MISSING | defer | CANONICAL PROJECT DATA if later | None | Vocabulary not frozen | No | Not overlay inheritance |
| U74 Inherited PA identity | MISSING | defer | EXTERNAL REFERENCE | None | Points at a leveraged-authorization reference if origination is added | No | Distinct from U40 and from baseline inheritance |
| U75 Implementation narrative | DIRECT | include | CANONICAL PROJECT DATA | `narrative` | None | Yes | Only for items in the delta set, plus GRRs |
| U76 Multipart narrative | PARTIAL | include as one narrative | CANONICAL PROJECT DATA | One string | None | Yes | No part rows |
| U77 Parameter rows | PARTIAL | include via existing resolution | FRAMEWORK / SOURCE DATA and CANONICAL PROJECT DATA | `parameterRecords`, `resolveParameter` | None. Mappings stay empty | Yes | Historical labels are not ODP ids |
| U78 DoD guidance in the Word file | STATIC | include current overlay blocks only | FRAMEWORK / SOURCE DATA | Supplements and overlay assignments on the Rev. 5 model | None | Yes, for detail items | Not the Word file's guidance |
| U79 Policy citation | PARTIAL | include Evidence metadata | EXTERNAL REFERENCE for the file; Evidence record is canonical | Evidence title, type, lifecycle, collection date | None | Yes | Not a page-level citation. Not an assessment |
| U80 Attachment 10 framing | STATIC | omit, with one scope sentence | INTENTIONALLY UNSUPPORTED as framework content | Not the 345-item set | None | Yes, the one sentence | |
| U81 Mission Owner responses | MISSING | unsupported | INTENTIONALLY UNSUPPORTED | AC-2(13) is a FedRAMP item, not an SLA row | None | No | |
| U82 Mission Owner AO approval | EXTERNAL | unsupported | INTENTIONALLY UNSUPPORTED | `documented-deviation` is not approval | None | No | |
| U83 SLA file | EXTERNAL | external | EXTERNAL REFERENCE | None | None in V1 | No | |
| U84 FedRAMP baseline SSP file | EXTERNAL | defer | EXTERNAL REFERENCE | Generic SSP is a different document | Pointer later | No | Not inferred |
| U85 SAR, PA, authorization decision | EXTERNAL | unsupported | INTENTIONALLY UNSUPPORTED | None | None | No | |
| U86 Connection agreement file | EXTERNAL | external | EXTERNAL REFERENCE | None | None in V1 | No | |
| U87 Historical boilerplate | STATIC | omit | INTENTIONALLY UNSUPPORTED | None | New scope prose | Yes, the new scope section | Do not copy broken footnotes or wrong-family sentences |

---

## 24. Subsequent milestones

**Accepted decision.** 09C is not required. No canonical model, schema, or
UI change is required before the first export.

- **Next implementation milestone: 09D.** IL4 addendum view model,
  `cf-il4-addendum-docx` 1.0, DOCX route parallel to the generic SSP,
  provenance, placeholders, tests, manual document review. No schema, no
  UI fields, no per-ODP mappings, no change to `cf-ssp-docx`. 09D is not
  started by closing 09B.
- Responsibility, origination, sponsors, service and deployment models,
  leveraged authorizations, inventories, diagrams, CNSSI 1253 data, Mission
  Owner/SLA responses, and authored document-version support stay deferred.

---

## 25. Decisions requested

Architecture review accepted the recommendations below. Section 27 records
that acceptance. Each item separates fact, existing architecture, and the
decision.

1. **Purpose.** Fact: DoD still treats an SSP addendum as a package artifact
   beside an SSP (Cloud CPG V3, December 2025). Existing: ADR-033 requires a
   Control Freak-owned document. **Proposal:** title and non-claims in
   section 4.
2. **FedRAMP relationship.** Fact: the historical addendum accompanied a
   Moderate SSP. Existing: framework selection is not that authorization.
   **Proposal:** section 5. No baseline-SSP field in V1.
3. **V1 sections.** **Proposal:** section 7.
4. **Population.** Fact: 345-item workbook population, 23-row Table D-1
   delta, 12 additions, 10 GRRs. **Proposal:** section 6.
5. **GRRs.** **Proposal:** section 10. Same narrative and status as NIST
   controls. Pinned question text. No historical mislabels.
6. **Parameters.** Existing: ADR-032. **Proposal:** section 11. No new
   mappings.
7. **Missing data.** Existing: SSP placeholders and notices. **Proposal:**
   section 12. Deferred concepts use the scope statement, not per-control
   blank lines.
8. **Baseline SSP reference.** **Proposal:** defer as an external artifact
   reference. Not V1.
9. **Sponsors.** **Proposal:** defer as framework-specific records. Not V1.
   Not `other` roles.
10. **Service and deployment models.** **Proposal:** defer as
    framework-independent canonical data. Not V1. Not inferred.
11. **Leveraged authorizations.** **Proposal:** defer as external
    references. Not V1. Not the leveraged-from-FedRAMP column.
12. **Inventories and PPS.** **Proposal:** external references later. Not a
    CMDB. Not V1.
13. **CNSSI 1253.** **Proposal:** do not model. Do not derive.
14. **Responsibility.** **Proposal:** later, framework-independent, role
    references. Not V1. Not workflow owner.
15. **Origination.** Fact: legacy seven-way labels are not current FedRAMP
    authority by default, and they are not in the pinned DoD workbook.
    **Proposal:** do not freeze that vocabulary. Not V1.
16. **Implementation status.** **Proposal:** existing four states are
    sufficient. No enum change. No GRR-specific results.
17. **Mission Owner / SLA.** **Proposal:** omit responses. One scope
    sentence. Do not change the population. AC-2(13) is not an SLA row.
18. **Evidence.** **Proposal:** same metadata block and safety sentence as
    the generic SSP. No embedded files.
19. **Generation metadata.** **Proposal:** section 19.
20. **Visual safety.** **Proposal:** section 20. No seal. No classification
    marking.
21. **Renderer.** **Proposal:** Option A, section 21.
22. **V1 boundary.** **Proposal:** section 22.
23. **09C.** **Proposal:** do not schedule authoring unless review pulls a
    deferred concept into V1.
24. **09D.** **Proposal:** renderer only, after this STOP is accepted, on
    the current canonical model.

---

## 26. Explicitly unchanged

09B did not change application behavior, `src/`, project schema, SQL,
dependencies, framework populations, generated framework data, IL4 per-ODP
mappings, parameter resolution, the generic SSP renderer, or deployment
configuration. The historical DOCX was not edited and was not populated.
The Addendum workbook was not reconstructed.

---

## 27. Accepted disposition

Architecture review accepted this specification on 2026-09-28. ADR-034 is
accepted. The approved decisions are:

1. The addendum is a delta document accompanying broader SSP documentation.
   It does not duplicate the 345-item authoring framework.
2. V1 population accounting is
   `32 detailed items + 1 membership note + 312 not reprinted = 345`.
   The 32 detailed items are `10 GRRs + 22 NIST controls/enhancements`.
3. The V1 section set and explicit scope omissions in section 7 are
   accepted.
4. No new canonical project fields are required before the first export.
5. Responsibility, origination, DoD/NIPR sponsors, service and deployment
   models, leveraged authorizations, inventories/PPS, diagrams, CNSSI 1253
   data, Mission Owner/SLA responses, and authored document-version support
   remain deferred as specified above.
6. `ControlImplementation.status` stays the existing four states.
7. Parameter resolution and SSP synthesis stay the existing paths. The IL4
   per-ODP mapping set stays empty.
8. Fail-closed placeholder and unresolved behavior in section 12 is
   accepted.
9. Evidence/reference and generation-metadata behavior are accepted.
10. Visual safety rules are accepted: Control Freak identity, no DoD seal,
    no copied UNCLASSIFIED footer, and no implication that the output is an
    official DoD template or authorization artifact.
11. Renderer option A is accepted: programmatic DOCX generation with the
    existing `docx` dependency. Layout id `cf-il4-addendum-docx` / `1.0`.
12. 09C is not required for V1.
13. The next implementation milestone is 09D, limited to the view model and
    renderer on the accepted canonical model. 09D is not started.

Closing 09B does not implement the information model, schema, UI, or
renderer.
