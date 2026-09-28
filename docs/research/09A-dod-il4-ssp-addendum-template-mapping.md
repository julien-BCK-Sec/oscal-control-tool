# 09A — DoD IL4 SSP Addendum Template Mapping

Research record for Milestone 09A. No exporter, schema, framework, or
parameter-resolution change was made. Architecture review accepted
2026-09-28. Final decisions are ADR-033. 09B and template rendering are not
started.

Date: 2026-09-28  
**Status:** Complete  
**ADR:** ADR-033

---

## 1. Executive conclusion

The supplied Word file is a historical DoD IL4 SSP **addendum template**
written against the Cloud Computing Security Requirements Guide, version 1,
release 4 (the document says 15 January 2022). Its internal title is
**Template (Version 2)**. The filename token `v1.8` is not in the document
and was not established from an authoritative public source.

It is **not** an authoritative requirements source for `dod-cloud-il4-rev5`,
and Control Freak will **not** populate that historical DOCX with the current
Rev. 5 control population.

Control Freak's IL4 framework remains the pinned Rev. 5 composition: FedRAMP
Rev. 5 Moderate, the DoD Rev 5 SSP Addendum Controls v1.2 extract, NIST
SP 800-53 Rev. 5 catalog text, and CSP SRG V1R7 Table D-1 as the
FedRAMP+ delta (ADR-029, ADR-032). The Word template's control sections use
an earlier catalog. They include Rev. 4 identifiers that are absent from the
345-item population (AC-23, SA-12, SA-19, and many Rev. 4 enhancement
numbers). Filling this DOCX from the Rev. 5 model would either drop required
Rev. 5 items or invent Rev. 4 statements. Neither is acceptable.

What Control Freak can already say, without a second interpretation, is the
canonical SSP: system identity, operational status, boundary, environment,
information-type names, a partial interconnection summary, control and GRR
narratives, and fail-closed parameter resolution. That is not enough to
populate this historical template faithfully, and it must not be forced to.

**Accepted disposition (ADR-033):** keep the DOCX pinned as an immutable
structural/design reference. Do not wait for a replacement official Word
template. The intended future export is a Control Freak-owned DoD IL4 SSP
Addendum whose organization and presentation may be informed by this
document, while requirements and generated content come only from the pinned
Rev. 5 sources and the canonical Control Freak model. Do not add this file's
control text, Mission Owner/SLA set, or parameter sentences to the framework.
Responsibility, origination, richer statuses, inventories, leveraged
authorizations, and related gaps remain inputs to a later architecture
milestone; they are not part of closing 09A.

---

## 2. Source document identification

| Fact | Value |
| --- | --- |
| Original filename | `IL4 Mod SSP Addendum v1.8.docx` |
| Pinned path | `vendor/dod/cloud-il4-rev5/templates/IL4-Mod-SSP-Addendum-v1.8.docx` |
| SHA-256 | `4c511a6b4b8e7e69922e980f8064e6059d30944dcf8506f6070eacfcdc7530ea` |
| Size | 527292 bytes |
| Date added | 2026-09-28 |
| Internal title | Department of Defense (DoD) Addendum to the FedRAMP+ System Security Plan |
| Internal subtitle | Information Impact Level 4 |
| Internal version line | Template (Version 2) |
| Package core properties | None (`docProps/` is absent) |
| Edit status | Bytes copied to the preferred filename. Content was not edited. |

The file was read in full: every body block, the 187-row control matrix,
every GRR, every control-summary table, Attachment 10, headers, footers,
footnotes, relationships, and the Open XML part inventory. Analysis was not
limited to representative pages.

---

## 3. Provenance and currentness

### What the document says about itself

Two passages name the SRG revision. Both say **version 1, release 4**. One
dates that SRG **January 15, 2022**. The document tells the reader the SRG
may be found at `https://cyber.mil/dccs/dccs-documents/` (relationship
`rId15` in the package).

The filename `v1.8` does not occur in the text. **Template (Version 2)** is
the only version the document states for itself. Those two labels are not
the same fact, and neither was treated as proof of current authority.

The template describes itself as an addendum to a FedRAMP Moderate baseline
SSP: only DoD general requirements, controls added to that baseline, and
controls whose parameters or refinements differ. It also says a CSP without
a Federal AO-approved FedRAMP Moderate SSP must provide a complete SSP
instead of this addendum alone. Selecting `dod-cloud-il4-rev5` in Control
Freak does not establish that baseline authorization.

### What was retrieved

| Source | Retrieved | Result |
| --- | --- | --- |
| Document body and footnotes | Local pin | SRG V1R4, 15 January 2022, as cited by the template |
| `https://public.cyber.mil/dccs/` and `https://public.cyber.mil/dccs/dccs-documents/` | 2026-09-28 | Pages exist. The document library is a Salesforce (LWR) application. The unauthenticated response did not include a file listing, a Word-template title, or a `v1.8` identifier |
| `https://dl.dod.cyber.mil/wp-content/uploads/cloud/pdf/unclass-dod_cloud_authorization_process.pdf` | Previously retrieved in 06B; still the public DISA process note | Lists "DoD SSP Addendum" as a package artifact. It does not name this DOCX, `v1.8`, or Template (Version 2) |
| `vendor/dod/cloud-il4-rev5/SOURCES.md` | Repository pin, retrieval 2026-08-27 | Current SRG used by Control Freak is CSP SRG **V1R7**, 30 June 2026, package Y26M06. PA-facing population is **DoD Rev 5 SSP Addendum Controls v1.2** (xlsx extract, not a Word template) |
| Older public HTML at `https://dl.dod.cyber.mil/wp-content/uploads/cloud/` | 2026-09-28 | Still serves SRG **Version 1 Release 3, 6 March 2017**. Already recorded as a stale page in `SOURCES.md`. Not used as authority |

An unofficial copy of an SRG PDF titled Version 1, Release 4, 14 January 2022
was found on a training site. It was **not** used as authority. The one-day
difference from the template's "January 15, 2022" is recorded and not
resolved. The template's own citation is the evidence for what this DOCX
claims to implement.

Vendor and law-firm pages that describe a July 2024 Excel Rev. 5 addendum
were not used as authority for a replacement template. They are consistent
with the repository's existing pin (the v1.2 workbook, not a Word file) and
were not allowed to change that pin.

### Answers required by the milestone

1. **Origin.** A DISA-oriented IL4 FedRAMP+ SSP addendum template whose body
   cites CC SRG V1R4 and the DCCS document library. The specific handoff that
   produced the filename `v1.8` is not in the file and was not found on a
   public authoritative listing.
2. **Filename `v1.8`.** Unexplained by the document and by the public sources
   retrieved. Not treated as a DISA version.
3. **Template (Version 2).** The cover's own version line. It does not match
   `v1.8`, and it does not match Addendum workbook v1.2 or SRG V1R7.
4. **SRG the template was written against.** Version 1, Release 4, dated in
   the template as 15 January 2022. Footnotes cite V1R4-era section numbers
   (for example 5.10.2.3, 5.6.2, 5.1.6). Several footnotes are broken Word
   cross-references (`Error! Reference source not found.`).
5. **Does this exact template remain current?** No evidence that it does.
   The SRG pin Control Freak already uses is V1R7 (30 June 2026).
6. **Superseded?** The SRG revision it names is not the pinned current SRG.
   Whether DISA still accepts this Word file in a legacy package was not
   stated by the public pages retrieved. Absence of a public "superseded"
   stamp is not evidence that the file is current.
7. **Rev. 5 SSP/Addendum template.** The authoritative Rev. 5 artifact pinned
   in this repository is the Excel workbook *DoD Rev 5 SSP Addendum Controls
   v1.2*, not a Word template. No official Rev. 5 Word addendum was found or
   substituted.
8. **Relationship to pinned IL4 sources.** See section 4.
9. **Future export target.** Not this DOCX. See section 19.

---

## 4. Relationship to current pinned DoD IL4 sources

| Pinned source | Role today | Relationship to this DOCX |
| --- | --- | --- |
| FedRAMP Security Controls Baseline xlsx (Rev. 5 Moderate) | Selection and FedRAMP assignment base | This DOCX's Table 11-1 is an older FedRAMP Moderate column set. It is not that workbook |
| DoD Rev 5 SSP Addendum Controls v1.2 extract | 345-item PA-facing population, including GRR-1–GRR-10 | This DOCX is a different artifact. It does not list the Rev. 5 population |
| NIST SP 800-53 Rev. 5 catalog | Normative statements and ODP ids | This DOCX's control prose is earlier catalog language (`the information system`, `the organization`) and includes identifiers absent from Rev. 5 |
| CSP SRG V1R7 Appendix D / Table D-1 | FedRAMP+ delta and DSPAV pointers | This DOCX cites SRG V1R4 and contains no DSPAV wording |

GRR titles and question text in the Word file are close to the pinned
Addendum extract, including the extract's typos ("Raliance", "capabailities").
The extract's GRR `discussion` fields still cite **CC SRG V1R4** section
numbers. That means the Rev. 5 workbook carried GRR prose forward. It does
**not** mean the Word file's NIST control sections are Rev. 5 requirements,
and it is not a reason to edit GRR text in this milestone.

Identifier overlap is not equivalence. Examples from the 345-item set:

- Present in both, with different catalog generations: AC-2, AC-6(1), AC-8,
  AC-17(3), AC-18(1), AC-18(3), AU-2, CA-2, CA-3, CM-2(3), CM-3(4), IR-2,
  IR-9, IR-9(2), MP-2, MP-6, SC-7(12), SC-28(1), and AC-6(7).
- In the Word detail sections and **not** in the 345-item set: AC-6(8),
  AC-17(6), AC-23, AT-3(2), AT-3(4), AU-4(1), AU-6(4), AU-6(10), AU-12(1),
  CA-3(5), CM-3(6), CM-4(1), CM-5(6), IA-2(9), IA-5(13), IA-5(4), IR-4(3),
  IR-4(4), IR-4(6), IR-4(7), IR-4(8), IR-5(1), IR-6(2), MA-4(3), MA-4(6),
  PE-3(1), SA-12, SA-19, SC-7(10), SC-23(1), SC-23(3), SI-2(6), SI-4(12),
  SI-4(19), SI-4(20), SI-4(22), SI-10(3).
- Word Attachment 10 IDs absent from the population: AC-3(4), AC-16,
  AC-16(6), IA-3(1), PS-4(1), PS-6(3), SC-7(11), SC-7(14).
- AC-2(13) is in the 345-item set because it is in FedRAMP Rev. 5 Moderate
  (`addendumLeveragedFromFedrampModerate: true`). The Word file instead
  labels AC-2(13) as an SLA control. Those are different claims. AC-2(13)
  stays a FedRAMP-inherited framework item. Attachment 10 is not merged.

Rev. 5 supply-chain controls in the population use the SR family (for
example `sr-2`, `sr-3`) and `sa-22`. The Word file still has SA-12 and SA-19.

---

## 5. Template structural overview

The package is a WordprocessingML document, US Letter, portrait, three
sections. Body size is about 3.2 MB of XML.

| Structure | Count |
| --- | --- |
| Paragraphs | 3469 |
| Tables | 162 |
| Table rows / cells | 770 / 1770 |
| Styled headings | Title 4, Heading 1 × 12, Heading 2 × 34, Heading 3 × 34, Heading 4 × 68 |
| Content controls (`w:sdt`) | 1, the table of contents |
| Fields | TOC plus 41 `PAGEREF` instructions |
| Hyperlinks | 134, almost all TOC links |
| Bookmarks | 140, almost all TOC targets |
| Footnotes | 49 |
| Images | DoD seal (JPEG, 116×116) and a 1×1 PNG spacer |
| Form fields, legacy checkboxes, `w14:checkbox` | 0 |
| Tracked insertions/deletions | 0 |
| Comments | 0 |
| Nested tables | 0 |
| Text boxes | 2 |
| Sections | 3, all `12240×15840` portrait, `nextPage` after the first |
| Embedded fonts | Century Schoolbook (4 faces), Noto Sans Symbols (2 faces) |

Checkboxes are the Unicode ballot box (`☐`) in ordinary runs. They are not
Word checkbox controls. "Check all that apply" is an instruction, not a
data type.

Strikethrough formatting appears on 543 paragraphs (cover labels and TOC
text). It is direct run formatting, not revision markup. A future editor
must not treat it as tracked changes and must not strip it while replacing
nearby text.

The TOC is a content control (`docPartGallery` = Table of Contents) with
cached page numbers. Editing body text will not update those numbers without
a word processor field refresh. Server-side export cannot honestly rewrite
the TOC page column.

---

## 6. Complete section inventory

Front matter, in order:

1. Cover: CSP name, information system name, version, version date,
   UNCLASSIFIED, prepared-by table, prepared-for table.
2. Revision history (date, description, version, author).
3. Executive summary (boilerplate plus offering name).
4. Introduction. States the addendum scope and the reciprocity premise.
5. DoD information impact levels (boilerplate; four levels).
6. Instructions. Inheritance rule for "-1" controls, policy/procedure
   citation rule, SaaS/PaaS inherited checkbox rule, and the statement that
   "organization defined" in the control section means the CSP unless DoD
   has defined the value. The CSP may delete this introductory section.
7. TOC.
8. System Security Plan approvals: two CSP signature lines. No DoD signature
   block.

Numbered body sections follow FedRAMP SSP section numbers that do not match
the heading outline. Table numbers are inconsistent (Table 2-1 under
categorization, Table 8-1 for service layers, Table 7-2 for deployment,
Table 11-1 for the control matrix).

| Template section | What it contains |
| --- | --- |
| CSP / cloud service offering | Boilerplate overview with offering name and abbreviation |
| Categorization | FIPS-style CIA checkbox table; CNSSI 1253 information-type table; objective rollup; baseline categorization; digital identity pointer |
| Information system owner | Prose pointing at the FedRAMP SSP system owner, plus NIPRNet sponsor and DoD CSO sponsor/advocate tables |
| Authorizing official | Prose. The DoD AO for this assessment is "the DISA AO" with a placeholder for the current officeholder. JAB / Federal agency authorization is a precondition, not a field Control Freak may infer |
| Assignment of security responsibility | Heading only. Footnote: expected unchanged from the FedRAMP SSP |
| Operational status | Heading only. Footnote: expected unchanged from the FedRAMP SSP |
| Information system type | Service-model checkboxes, deployment-model checkboxes, leveraged-authorization tables and contacts |
| Component and boundaries | Heading only. Footnote: section 8 of the baseline SSP, update if the DoD CAP or NIPRNet connection changes it |
| System environment | Empty headings for hardware, software, network, and data flow. One ports/protocols/services table with a sample `80/TCP` row |
| System interconnections | Heading only. Footnote: include NIPRNet and CAP if the baseline SSP omitted them |
| IL4 DoD NIST controls | Intro, ten GRRs, Table 11-1 (187 rows), then family sections |
| Attachment 10 | Mission Owner (SLA) controls. Cites SRG section 5.1.6 |

Families in the detail section: AC, AT, AU, CA, CM, CP, IA, IR, MA, MP, PE,
PL, PS, RA, SA, SC, SI. Several families contain only the sentence that
there are no additional controls or enhanced parameters for IL4. That
sentence is boilerplate, and it is sometimes copied from the CA family into
unrelated families ("no additional assessment and authorization security
controls").

Attachment 10 families: AC, IA, PS, SC.

---

## 7. Field-by-field mapping

### Mapping unit

One mapping unit is one authorable semantic slot, or one repeating-row
schema counted once, or one GRR response, or one control-authoring pattern
counted once for the whole control section.

The same checkbox group repeated on dozens of controls is one unit. Blank
extra rows in a table are not extra units. Boilerplate that must stay in
the template is a unit only when a future exporter has to decide to leave
it untouched. A similar Control Freak label is not enough for DIRECT.

Instance counts (how many controls repeat a pattern) are noted in the
control and GRR sections. They are not the summary counts.

### Register

| ID | Section | Slot | Meaning | Class | Canonical source | Ownership | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- |
| U01 | Cover | CSP name | Cloud service provider name | PARTIAL | `organizationName` is the SSP organization, which may be the CSP and may be a preparer | CANONICAL PROJECT DATA if it is the SSP organization; do not overload it for both preparer and CSP | Two different organizations share one field today |
| U02 | Cover | Information system name | CSO / system name | DIRECT | `systemName` | CANONICAL PROJECT DATA | None if the project system is the CSO |
| U03 | Cover | Version | Document version `#.#` | MISSING | Project revision is not an SSP version | EXPORT-TIME DATA | Do not print the app revision as a FedRAMP version |
| U04 | Cover | Version date | Document date | MISSING | `generatedAt` is export time, not an authored date | EXPORT-TIME DATA | |
| U05 | Cover / footer | Classification | UNCLASSIFIED template marking the CSP may change | MISSING | None | EXPORT-TIME DATA or CANONICAL PROJECT DATA only if classification is actually modeled later | Do not leave "UNCLASSIFIED" as if Control Freak decided it, and do not invent a marking |
| U06 | Prepared by | Organization name | Organization that prepared the document | PARTIAL | `organizationName` only when that is the preparer | CANONICAL PROJECT DATA | Same collision as U01 |
| U07 | Prepared by | Address | Street, suite, city lines | MISSING | None. Roles have no address | CANONICAL PROJECT DATA | |
| U08 | Prepared by | Logo | Image placeholder | EXTERNAL | None | EXTERNAL REFERENCE / ARTIFACT | Do not generate a logo |
| U09 | Prepared for | CSP organization name | CSP identified separately from the preparer | PARTIAL | `organizationName` only when the SSP organization is the CSP | CANONICAL PROJECT DATA | |
| U10 | Prepared for | Address | CSP address | MISSING | None | CANONICAL PROJECT DATA | |
| U11 | Prepared for | Logo | Image placeholder | EXTERNAL | None | EXTERNAL REFERENCE / ARTIFACT | |
| U12 | Revision history | Date, description, version, author | Document change log | MISSING | None | EXPORT-TIME DATA | Not ControlActivity and not project revision history |
| U13 | Approvals | CSP signature block | Named official, date, title, corporate attestation | EXTERNAL | None | INTENTIONALLY UNSUPPORTED as a synthesized fact. A scanned signature may be attached later | Signing is not export |
| U14 | Header | System name | Running header | DERIVED | `systemName` | DERIVED DATA | |
| U15 | Header | Version and date | Running header | MISSING | None | EXPORT-TIME DATA | |
| U16 | Body | CSO abbreviation | Short name in boilerplate | DIRECT | `systemNameShort` | CANONICAL PROJECT DATA | Empty short name must stay empty |
| U17 | Categorization | FedRAMP Moderate authorization | Precondition that a Federal AO accepted a Moderate package | EXTERNAL | Framework selection is not an authorization | INTENTIONALLY UNSUPPORTED | Do not infer FedRAMP authorization |
| U18 | Table 2-1 | FIPS CIA checkboxes | Low/Moderate/High for C/I/A | PARTIAL | `securityCategorization` when the user authored it | CANONICAL PROJECT DATA | The template then requires CNSSI 1253. Do not copy FIPS into the CNSSI tables |
| U19 | Table 2-2 | Information type name | CNSSI 1253 type name | DIRECT | `informationTypes[].title` | CANONICAL PROJECT DATA | The title is only DIRECT if the author used a CNSSI type name. Control Freak does not enforce that catalog |
| U20 | Table 2-2 | CNSSI 1253 identifier | Official type id | MISSING | None | FRAMEWORK-SPECIFIC PROJECT DATA | Do not invent identifiers from titles |
| U21 | Table 2-2 | Per-type C/I/A | Confidentiality, integrity, availability | PARTIAL | `informationTypes[]` impact fields, FIPS vocabulary | CANONICAL PROJECT DATA | Not a CNSSI catalog |
| U22 | Table 2-3 | Objective rollup | Low/Moderate/High per objective from the type table | PARTIAL | SSP can derive a FIPS high-water mark only when all three **system** CIA values exist | DERIVED DATA only under a future explicit CNSSI rule | Footnote 10 leaves availability assessment to the mission owner. A high-water mark would be an assumption |
| U23 | Table 2-4 | System baseline categorization | Chosen C/I/A for the system | PARTIAL | `securityCategorization` | CANONICAL PROJECT DATA | Template label is CNSSI. Do not fill it from framework IL4 |
| U24 | Digital identity | Level | "Choose an item" | MISSING | None | FRAMEWORK-SPECIFIC PROJECT DATA | SP 800-63-3 is cited; do not invent a level |
| U25 | Digital identity | Worksheet | FedRAMP Attachment 3 | EXTERNAL | None | EXTERNAL REFERENCE / ARTIFACT | |
| U26 | System owner | Baseline system owner | Person identified in the FedRAMP SSP, not re-collected here | EXTERNAL | `systemRoles` `system-owner` is a related record, not this section's cells | EXTERNAL REFERENCE / ARTIFACT for the addendum. The role record remains CANONICAL PROJECT DATA for Control Freak's own SSP | Do not treat the empty heading as a request to copy the role into a FedRAMP package |
| U27 | Table 3-2 | NIPRNet connection sponsor | Name, title, DoD organization, address, phone, email | MISSING | No role type. `other` plus a label would be a disguised mapping | FRAMEWORK-SPECIFIC PROJECT DATA | Sponsorship is not authorization and not an application user |
| U28 | Table 3-3 | DoD CSO sponsor/advocate | Same columns as U27 | MISSING | None | FRAMEWORK-SPECIFIC PROJECT DATA | Footnote 11: advocate is not a funding commitment |
| U29 | Authorizing official | Project AO | A documented AO role | PARTIAL | `systemRoles` `authorizing-official` | CANONICAL PROJECT DATA | The template's AO for **this** assessment is the DISA AO, not the project's AO |
| U30 | Authorizing official | DISA AO contact | Current DISA authorizing official | EXTERNAL | None | INTENTIONALLY UNSUPPORTED | Officeholder changes. Do not hard-code a name |
| U31 | Security responsibility | Section body | Expected to stay in the FedRAMP SSP | EXTERNAL | `system-security-officer` is not this section | EXTERNAL REFERENCE / ARTIFACT | |
| U32 | Operational status | Status | System operational status | DIRECT | `operationalStatus` | CANONICAL PROJECT DATA | Vocabulary is SP 800-18 style. It is not an ATO state. The template heading is empty and the footnote expects the baseline SSP value |
| U33 | Operational status | Remarks | Free-text qualification | DIRECT | `operationalStatusRemarks` | CANONICAL PROJECT DATA | |
| U34 | Service model | SaaS / PaaS / IaaS | Checkbox, possibly more than one | MISSING | None | CANONICAL PROJECT DATA | Do not infer from narratives |
| U35 | Service model | Major Application / General Support System | Fixed label beside each service model | STATIC | None | FRAMEWORK/SOURCE DATA | Leave the printed pairing. Do not store it as project data |
| U36 | Service model | Customer vs CSP responsibility | Narrative the template requires throughout the SSP | MISSING | `systemDescription` is not this delineation | CANONICAL PROJECT DATA | |
| U37 | Deployment | Model and allowed tenants | Public, DoD private/community, Federal community, Hybrid | MISSING | None | FRAMEWORK-SPECIFIC PROJECT DATA | IL4 selection does not imply a deployment model |
| U38 | Deployment | Hybrid explanation | Free text on the hybrid row | MISSING | None | FRAMEWORK-SPECIFIC PROJECT DATA | |
| U39 | Leveraged authorizations | Intent sentence | Plans to leverage, or does not | MISSING | None | FRAMEWORK-SPECIFIC PROJECT DATA | Do not infer from framework inheritance |
| U40 | Table 7-3 | Leveraged authorization register | System, provider/owner, date granted, AO, assessment organization | MISSING | None | FRAMEWORK-SPECIFIC PROJECT DATA | A date granted is an external authorization fact. Model the reference only when the user documents it. Do not invent the date |
| U41 | Table 7-4 | Leveraged authorization contacts | AO and assessor name, title, organization, address, phone, email | MISSING | None | FRAMEWORK-SPECIFIC PROJECT DATA | |
| U42 | Boundaries | Authorization boundary | Boundary narrative | DIRECT | `authorizationBoundary` | CANONICAL PROJECT DATA | |
| U43 | Boundaries | CAP / NIPRNet delta | Change from the FedRAMP boundary because of the DoD connection | MISSING | None | FRAMEWORK-SPECIFIC PROJECT DATA | |
| U44 | Environment | Environment of operation | Narrative | DIRECT | `environmentOfOperation` | CANONICAL PROJECT DATA | |
| U45 | Hardware | Inventory | No columns are defined; the heading is empty | MISSING | None | CANONICAL PROJECT DATA | Do not invent a schema from the heading alone beyond "an inventory exists" |
| U46 | Software | Inventory | Empty heading | MISSING | None | CANONICAL PROJECT DATA | |
| U47 | Network | Inventory | Empty heading | MISSING | None | CANONICAL PROJECT DATA | |
| U48 | Data flow | Description | Empty heading | MISSING | None | CANONICAL PROJECT DATA | |
| U49 | Data flow | Diagram | Referenced architecture material | EXTERNAL | None. Diagrams were deferred in 07A | EXTERNAL REFERENCE / ARTIFACT | |
| U50 | PPS | Ports, protocols, services, purpose, used by | Repeating table. The `80/TCP` / Tomcat row is a sample | MISSING | None | CANONICAL PROJECT DATA | Do not export the sample row as system fact |
| U51 | Interconnections | Connected system name | | DIRECT | `interconnections[].name` | CANONICAL PROJECT DATA | The general section heading is empty; CA-3 has the real columns |
| U52 | Interconnections | Connected organization | | DIRECT | `interconnections[].organization` | CANONICAL PROJECT DATA | |
| U53 | Interconnections | Information communicated | | DIRECT | `interconnections[].informationExchanged` | CANONICAL PROJECT DATA | |
| U54 | CA-3 table | Agreement name and date | | MISSING | None | FRAMEWORK-SPECIFIC PROJECT DATA or EXTERNAL REFERENCE | |
| U55 | CA-3 table | Signer role and name | | MISSING | None | FRAMEWORK-SPECIFIC PROJECT DATA | |
| U56 | CA-3 prose | Interface characteristics | | PARTIAL | `description` or `securityNotes` can hold prose, not a distinct interface model | CANONICAL PROJECT DATA | |
| U57 | CA-3 prose | Security requirements | | PARTIAL | `securityNotes` | CANONICAL PROJECT DATA | |
| U58 | Interconnections | CAP / BCAP / NIPRNet facts | | MISSING | Direction on `interconnections[]` is not this | FRAMEWORK-SPECIFIC PROJECT DATA | |
| U59 | GR-1 | DoD PKI response | Question, parts a–c, status Yes/Planned/No | PARTIAL | Framework statement for `grr-1`; `ControlImplementation.narrative`; status enum does not match | Narrative: CANONICAL PROJECT DATA. Question text: FRAMEWORK/SOURCE DATA | See GRR section. Template labels the solution table consistently |
| U60 | U60 | GR-2 | DoD IP addressing response | Status adds Partial and In process | PARTIAL | `grr-2` | Same split | |
| U61 | GR-3 | Data locations response | Status uses Equivalent | PARTIAL | `grr-3` | Same split | |
| U62 | GR-4 | Management plane response | | PARTIAL | `grr-4` | Same split | |
| U63 | GR-5 | CSO personnel response | Four parts plus a Responsible Role line | PARTIAL | `grr-5` | Same split. Responsible role is MISSING inside this otherwise partial unit | |
| U64 | GR-6 | Private connection response | | PARTIAL | `grr-6` | Same split | |
| U65 | GR-7 | Internet-based capabilities | Two parts. Status has no Equivalent | PARTIAL | `grr-7` | Same split | |
| U66 | GR-8 | Internet access reliance | | PARTIAL | `grr-8` | Same split | |
| U67 | GR-9 | Back-door protection response | | PARTIAL | `grr-9` | Same split | Solution table is mislabeled GR-10 |
| U68 | GR-10 | Defense in depth response | | PARTIAL | `grr-10` | Same split | Solution table is mislabeled GR-15 |
| U69 | Controls | Requirement and DoD assignment prose | Printed control text | STATIC | Rev. 5 `FrameworkControl.statement` is a different text and must not be replaced by this prose | FRAMEWORK/SOURCE DATA inside the template file | Do not import this prose into the framework |
| U70 | Table 11-1 | Population matrix | FedRAMP column, DoD-added column, parameter column, SLA marks | STATIC | The 345-item registry | FRAMEWORK/SOURCE DATA | Do not regenerate this matrix from Rev. 5 and paste it into this table |
| U71 | Control summary | Responsible role | One free-text line per control | MISSING | `ControlRecord.owner` is workflow ownership | CANONICAL PROJECT DATA, new concept, already deferred by ADR-032 | Not an application user id |
| U72 | Control summary | Implementation status | Implemented, partially implemented, risk acceptance sought, planned, alternative/equivalent, not applicable; sometimes "configured by customer" | PARTIAL | `ControlImplementation.status`: `not-started`, `in-progress`, `implemented`, `not-applicable` | CANONICAL PROJECT DATA if the vocabulary is extended by a future ADR | Do not collapse the template's distinctions, and do not map workflow `implementationStatus` |
| U73 | Control summary | Control origination | Seven FedRAMP-style checkboxes, check all that apply | MISSING | None | CANONICAL PROJECT DATA, deferred by ADR-032 | Not framework inheritance |
| U74 | Origination | Inherited PA identity | System name and PA date on the inherited checkbox | MISSING | Leveraged-authorization register (also missing) is related and not the same slot | FRAMEWORK-SPECIFIC PROJECT DATA | Distinct from baseline inheritance and from U40 |
| U75 | Control body | Single implementation narrative | "What is the solution and how is it implemented?" | DIRECT | `ControlImplementation.narrative` | CANONICAL PROJECT DATA | Only for a control that exists in the selected framework. This template's extra IDs have nowhere to go |
| U76 | Control body | Multipart narrative | Part a / b / c rows | PARTIAL | One narrative string | CANONICAL PROJECT DATA | |
| U77 | Control summary | Parameter rows | "Parameter", "Parameter 1", "Parameter a", and similar blanks | PARTIAL | `parameterRecords` and `resolveParameter` only when a row is a real catalog ODP. These labels are not ODP ids. IL4 per-ODP mappings are empty | FRAMEWORK/SOURCE DATA for printed DoD assignments; CANONICAL PROJECT DATA for CSP values after a future approved mapping | This template is not authority to add mappings |
| U78 | Control body | DoD guidance and additional requirements | Printed guidance | STATIC | Overlay supplements on the Rev. 5 model, which are not this text | FRAMEWORK/SOURCE DATA | |
| U79 | Instructions | Policy and procedure citation | Title and date/version, plus a findable location | PARTIAL | Evidence title, type, and collection date can reference a document. They are not a citation with section or page | EXTERNAL REFERENCE / ARTIFACT plus a possible future citation record | Evidence is not an assessment result |
| U80 | Attachment 10 | Instructional framing | SRG 5.1.6 controls a mission owner might put in an SLA | STATIC | Not the 345-item set | FRAMEWORK/SOURCE DATA as template text only | Do not add these IDs to the population |
| U81 | Attachment 10 | MO/SLA responses | Same summary pattern as other controls, for IDs that are mostly outside the population | MISSING | AC-2(13) exists as a FedRAMP Moderate enhancement, not as an SLA item | INTENTIONALLY UNSUPPORTED until a separate decision | Do not file SLA answers on the FedRAMP AC-2(13) row just because the identifier matches |
| U82 | Attachment 10 | Mission Owner AO approval | Template says the Mission Owner AO approves certain CSP-defined values | EXTERNAL | A `documented-deviation` does not approve anything | INTENTIONALLY UNSUPPORTED | |
| U83 | Package | SLA / contract file | | EXTERNAL | None | EXTERNAL REFERENCE / ARTIFACT | |
| U84 | Package | FedRAMP baseline SSP and repository artifacts | | EXTERNAL | None | EXTERNAL REFERENCE / ARTIFACT | |
| U85 | Package | Assessment results, SAR, authorization decision, PA | | EXTERNAL | None | INTENTIONALLY UNSUPPORTED as synthesized facts | |
| U86 | Package | Connection agreement file | Distinct from agreement metadata | EXTERNAL | None | EXTERNAL REFERENCE / ARTIFACT | |
| U87 | Front matter | Instructions, impact-level explainer, "no additional controls" sentences, family introductions | Boilerplate | STATIC | None | FRAMEWORK/SOURCE DATA in the template | Includes copy-paste errors. Preserve them if this file is ever filled; do not "correct" them into the framework |

### Counts

Counted from the register (U01–U87). One row is one mapping unit.

| Class | Count | Units |
| --- | --- | --- |
| DIRECT | 11 | U02, U16, U19, U32, U33, U42, U44, U51, U52, U53, U75 |
| DERIVED | 1 | U14 |
| PARTIAL | 24 | U01, U06, U09, U18, U21, U22, U23, U29, U56, U57, U59–U68, U72, U76, U77, U79 |
| MISSING | 31 | U03, U04, U05, U07, U10, U12, U15, U20, U24, U27, U28, U34, U36–U41, U43, U45–U48, U50, U54, U55, U58, U71, U73, U74, U81 |
| STATIC | 6 | U35, U69, U70, U78, U80, U87 |
| EXTERNAL | 14 | U08, U11, U13, U17, U25, U26, U30, U31, U49, U82–U86 |
| Total | 87 | |

Coverage by area, using the same units:

| Area | Units | DIRECT | DERIVED | PARTIAL | MISSING | STATIC | EXTERNAL |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Document metadata | U01–U16 | 2 | 1 | 3 | 7 | 0 | 3 |
| Categorization and identity | U17–U25 | 1 | 0 | 4 | 2 | 0 | 2 |
| Roles | U26–U31 | 0 | 0 | 1 | 2 | 0 | 3 |
| Cloud and system characteristics | U32–U44 | 4 | 0 | 0 | 8 | 1 | 0 |
| Inventories and architecture | U45–U50 | 0 | 0 | 0 | 5 | 0 | 1 |
| Interconnections | U51–U58 | 3 | 0 | 2 | 3 | 0 | 0 |
| GRRs | U59–U68 | 0 | 0 | 10 | 0 | 0 | 0 |
| Controls, parameters, citations | U69–U79 | 1 | 0 | 4 | 3 | 3 | 0 |
| Mission Owner/SLA and package artifacts | U80–U87 | 0 | 0 | 0 | 1 | 2 | 5 |

These counts are not a coverage score. Most PARTIAL units are partial because a nearby field exists and the template's distinction does not.

---

## 8. GRR mapping

All ten template GRRs correspond by title and question text to `grr-1` through
`grr-10` in the pinned Rev. 5 Addendum extract. The question text is
framework/source data. Control Freak already has first-class items for them.
Authors can store one narrative and one of four documentation statuses.

That is not a faithful GRR response.

| GRR | Template status vocabulary | Parts | Responsible role line | Template defect |
| --- | --- | --- | --- | --- |
| GR-1 | Yes, Planned, No | a, b, c | No | None on the solution label |
| GR-2 | Yes, Partial, In process, Planned, No | One cell | No | Only status set with "In process". Summary label is "Requirement Summary" |
| GR-3 | Yes, Planned, Equivalent, No | One cell | No | |
| GR-4 | Yes, Planned, No | One cell | No | |
| GR-5 | Yes, Partial, Planned, Equivalent, No | a, b, c, and a fourth part in the question | Yes | |
| GR-6 | Yes, Planned, Equivalent, No | One cell | No | |
| GR-7 | Yes, Partial, Planned, No | a, b | No | Shared typo "capabailities" with the pinned extract |
| GR-8 | Yes, Partial, Planned, Equivalent, No | a, b | No | Title typo "Raliance", also in the pinned extract |
| GR-9 | Yes, Partial, Planned, Equivalent, No | One cell | No | Solution table is labeled GR-10 |
| GR-10 | Yes, Partial, Planned, Equivalent, No, Not Applicable (not SaaS) | One cell | No | Solution table is labeled GR-15. The SaaS exception is on this status line only |

GR-2's status set is the only one with "In process". The "Not Applicable (not
SaaS)" option appears only on GR-10. It is not a general IL4 rule.

`ControlImplementation.status` cannot represent Yes versus Implemented,
Partial versus in-progress, Equivalent, Planned, or No. Putting those words
into the narrative would hide a structured answer inside prose. The GRR
question itself must stay the framework statement. 09A does not change GRR
text even where the template and the extract share a typo.

Related NIST control lists printed under some GRRs (GR-1 lists IA-2 and
others) are references, not extra framework items.

---

## 9. Security-control mapping

Table 11-1 is a 187-row Rev. 4-oriented matrix. Columns are control id,
description, FedRAMP Moderate baseline controls, Level 4 controls added per
the DoD SRG, and Level 4 controls with DoD SRG parameters. SLA items are
marked in the added column (for example "SLA: AC-2 (13)"). The table includes
the whole FedRAMP-style baseline, not only the detail sections. It is STATIC
relative to this file (U70). It is not the 345-item Rev. 5 population.

The detail sections document a much smaller set: additional controls and
enhanced-parameter controls, plus Attachment 10. Heading 4 yields the control
list in section 4 of this report. Several families then say there is nothing
additional. Those sentences are boilerplate (U87), including sentences copied
from the wrong family.

Each detailed control follows the same shape:

- Heading with id and title.
- Requirement prose, often with `[DoD Assignment: …]` or, twice,
  `[FedRAMP Assignment: …]`.
- Optional "DoD Additional Guidance" or "Additional DoD Requirement".
- A summary table: id, "Control Summary Information" or "Control Enhancement
  Summary Information", Responsible Role, zero or more Parameter rows,
  sometimes Implementation Status, sometimes Control Origination.
- A solution table, sometimes split into Part a / Part b / Part c.

About 62 summary tables say "Control Summary Information" and 10 say
"Control Enhancement Summary Information". The words are not a reliable
base-versus-enhancement flag. AC-8 is an enhancement summary on a base
control. The template also says "Implementation Type" on some IR controls
and "Implementation Status" on others, with the same checkbox idea.

Origination is not on every control. Where it appears, the full set is:

- Service Provider Corporate
- Service Provider System Specific
- Service Provider Hybrid (Corporate and System Specific)
- Configured by Customer (Customer System Specific)
- Provided by Customer (Customer System Specific)
- Shared (Service Provider and Customer Responsibility)
- Inherited from a pre-existing Provisional Authorization, with system name
  and PA date

A shorter origination line on some controls stops after Hybrid. "Configured
by customer" also appears inside the **status** line on a few controls.
The template itself mixes origination into status. A mapping must not.

The instructions say "-1" controls cannot be inherited and must be described
by the service provider, and that SaaS/PaaS inheritance from IaaS requires
the inherited checkbox and an implementation description of "inherited".
That inherited checkbox is control origination (U73, U74). It is not
`selectionProvenance.overlayMarksLeveragedFromExternalBaseline`, and it is
not the leveraged-authorization table.

Control Freak can store one narrative per framework item (U75). It cannot
store parts (U76), a responsible role (U71), or origination (U73). Its
status set covers implemented and not-applicable only in part (U72). Items
that are not in the 345-item set have no `controlId` to attach a narrative
to. Writing those narratives into a similarly numbered Rev. 5 control would
be a false mapping.

Known template defects, recorded so a future filler does not "fix" them by
changing framework data:

- CA-3(5) solution prompt says CA-3(3).
- SI-2(6) is written twice, once under additional controls and once under
  enhanced parameters, with different parameter rows.
- AC-16(6) summary table is labeled AC-16(1).
- AC-16's matrix description says "Account Management".
- GR-9 and GR-10 solution labels, above.

---

## 10. Parameter and resolution mapping

`src/domain/parameter-resolution.ts` stays the only resolution path. This
template does not change it. IL4 per-ODP mappings stay empty.

What the template actually contains:

| Pattern | Times seen in the plain text | How Control Freak treats the same idea |
| --- | --- | --- |
| `DoD Assignment:` inside requirement prose | 70 | Printed template text (U69). Not a catalog ODP id. Not a new mapping |
| `FedRAMP Assignment:` | 2 | Same. The pinned FedRAMP workbook remains the FedRAMP value source |
| `organization-defined` / `organization defined` | 4 | The instructions say this means the CSP unless DoD defined it. That matches the existing CSP-versus-authoritative split only at the sentence level |
| `DoD Selection:` | 2 | Catalog selections already exist on Rev. 5 ODPs. These sentences are not those ODPs |
| `CSP defines` … approved by the DISA AO or Mission Owner AO | 16 | Authoritative external approval. A project value here would be a `dspav-assertion` style note at best, not a substituted value. The template never says DSPAV |
| Blank "Parameter n" / "Parameter a" rows | 24 + 13 + 11 plus lettered variants | U77. Labels are local (`Parameter (a) (1)`, `Parameter 1 SC-7 (12)`). They are not `ac-1_prm_1`-style ids |

Resolution states the template does not represent, and must not be collapsed:

- CSP organization-defined values can be stored in `parameterRecords` for a
  real catalog ODP. They cannot be placed in "Parameter 1" until a mapping
  exists. 09A does not create that mapping.
- FedRAMP baseline values stay framework data (`baseline-inherited`). The
  template's FedRAMP column in Table 11-1 is not the Rev. 5 workbook.
- DoD explicit assignments in this file are historical sentences. Where the
  pinned Rev. 5 model has an overlay value, that model wins. Where it says
  `authoritative-value-required` or `source-conflict`, this DOCX is not a
  winner.
- `may-use-baseline` still needs explicit acceptance. The phrase does not
  appear in this DOCX.
- Documented deviations still do not replace authoritative values. Mission
  Owner AO "approval" in Attachment 10 is an external act (U82).
- Nested parameters and selections stay catalog structure. This file's
  bracketed assignments are not nested ODP trees.
- Unresolved inserts stay unresolved. A blank parameter row is not a value.
- Per-insert synthesis stays in `src/ssp/`. The Word adapter, if one is ever
  approved, consumes that result. It does not parse Word assignment text.

No row in this DOCX was promoted to `vendor/dod/cloud-il4-rev5/extracts/il4-parameter-mappings.json`.

---

## 11. Responsibility and origination

Responsible Role is one free-text line on the control summary, and on GR-5.
The template does not say it is a lookup into an SSP role table. It does not
repeat per statement part except where the narrative is split into parts.
Multiple roles are possible only by typing more than one name into the line.
Nothing in the file makes it a user id.

`ControlRecord.owner` and `coOwner` are application workflow assignment.
`systemRoles` are SSP documentation records (`system-owner`,
`authorizing-official`, `system-security-officer`, `other`). ADR-032 deferred
responsibility and origination. 07C said not to treat workflow ownership as
SSP responsibility. This template confirms they are different: the role line
sits beside implementation status and origination, in the FedRAMP control
summary, not in an assignment widget.

Origination is the seven-way FedRAMP checkbox set in section 9, and only on
some controls. "Check all that apply" means more than one category can be
true. Inheritance here means "this control's implementation is inherited
from a named pre-existing PA", with a date. That is a third concept:

| Concept | What it is | Modeled today |
| --- | --- | --- |
| Framework baseline inheritance | FedRAMP value stands because Table D-1 does not adjust it | Yes, read-only overlay class |
| SSP control origination "Inherited" | This offering inherits the control from a lower layer or a named PA | No |
| Leveraged authorization | A separate system, date granted, AO, and assessor | No |

Customer-configured and customer-provided are origination, not workflow
roles and not Mission Owner/SLA membership.

---

## 12. Current Control Freak coverage

Strongest fit, still not a DoD package:

- System name, short name, operational status and remarks, authorization
  boundary, environment of operation.
- Information-type titles, with the CNSSI-catalog caveat on U19.
- Interconnection name, organization, and information exchanged.
- One implementation narrative per framework item, including the ten GRRs.
- Parameter resolution for real catalog ODPs, fail-closed for IL4.
- Evidence as a reference list, not as a policy citation and not as an
  assessment.

The generic SSP (`cf-ssp-docx` 1.0) already prints those facts with
placeholders. It is a Control Freak document. It does not fill this template,
and this milestone does not change that renderer.

---

## 13. Missing and partial information

Grouped for later scoping. Unit ids point at the register.

**General SSP / document metadata.** Version, date, classification, addresses,
revision history (U03–U05, U07, U10, U12, U15). Preparer versus CSP is only
partially available (U01, U06, U09).

**DoD-specific system metadata.** NIPRNet sponsor, DoD advocate, CNSSI
identifier, digital identity level, CAP/NIPRNet boundary delta (U20, U24,
U27, U28, U43, U58). DISA AO contact stays external (U30).

**Cloud characteristics.** Service model, responsibility split, deployment
model, hybrid explanation (U34, U36–U38).

**Authorization / leveraging.** Intent, register, contacts, and the inherited
PA line on a control (U39–U41, U74). The fact of a FedRAMP authorization stays
external (U17).

**Architecture and inventory.** Hardware, software, network, data flow, and
ports/protocols/services (U45–U48, U50). Diagrams stay external (U49).

**Responsibility and origination.** Responsible role and the origination set
(U71, U73).

**Control-level documentation.** Status vocabulary, GRR status and parts,
multipart narratives, parameter-row binding, policy citations (U59–U68, U72,
U76, U77, U79).

**External / package artifacts.** Logos, signatures, worksheets, agreements,
FedRAMP package files, assessment results, SLA files, Mission Owner approval
(U08, U11, U13, U25, U49, U82–U86).

---

## 14. Gap ownership recommendations

| Gap | Recommended ownership | In a template-export milestone? |
| --- | --- | --- |
| Document version, date, revision history, running header version | EXPORT-TIME DATA | Only after an export target exists |
| Classification marking | EXPORT-TIME DATA until a real marking model is approved | Do not default to UNCLASSIFIED |
| Preparer and CSP as two organizations, with addresses | CANONICAL PROJECT DATA | Not required to decide the export target |
| CNSSI identifier, digital identity level, sponsors, deployment, leveraged authorizations, CAP delta | FRAMEWORK-SPECIFIC PROJECT DATA | Not in the next milestone. They are real DoD package facts and they are not justified by a retired Word layout alone |
| Service model and customer/CSP responsibility split | CANONICAL PROJECT DATA | Same. Useful beyond IL4, still not 09B |
| Inventories and PPS | CANONICAL PROJECT DATA | Later. The template does not even define inventory columns |
| Diagrams, logos, signatures, package files, DISA AO identity, FedRAMP authorization, assessment results | EXTERNAL REFERENCE / ARTIFACT or INTENTIONALLY UNSUPPORTED | Never synthesize |
| Responsible role and origination | CANONICAL PROJECT DATA | The only model gap already deferred by ADR-032 that every FedRAMP-shaped control summary needs, independent of this file |
| Richer implementation status and GRR answer structure | CANONICAL PROJECT DATA, new ADR | Decide with responsibility. Do not sneak the template's mixed "configured by customer" status into the enum |
| Parameter-row binding for this DOCX | Do not create | Would be a second resolution path |
| Attachment 10 membership | Do not add to the framework | Separate decision, not an export convenience |
| Printed control prose, Table 11-1, guidance, GSS/Major Application labels | FRAMEWORK/SOURCE DATA inside the pinned file | Leave it in the file |

Do not add these cells to `ProjectMetadata` as a flat copy of the Word tables.

---

## 15. DOCX / Open XML structural analysis

Package parts: `[Content_Types].xml`, `_rels/.rels`, `word/document.xml`,
`word/styles.xml` (172 styles), `word/numbering.xml` (22 numbering
definitions), `word/settings.xml`, `word/fontTable.xml`, `word/footnotes.xml`,
`word/theme/theme1.xml`, nine headers, five footers, two images, six embedded
fonts. No `docProps`, no comments, no endnotes, no custom XML, no glossary.

`settings.xml` embeds TrueType fonts. It has no `trackRevisions` flag.

Sections:

1. Starts page numbering at 1. Headers `header1`, `header4` (first),
   `header2` (even). Footers `footer3`, `footer2` (first), `footer1` (even).
2. Next page. Headers `header3`, `header5`, `header6`. Footer `footer4`.
3. Next page. Headers `header7`, `header9`, `header8`. Footer `footer5`.

Header text that exists is a running SSP title plus placeholders
`<Information System Name>`, `<Cloud Service Offering>`, version `<0.00>`,
and `<Date>`. Several header parts are empty. Footers that have text say
`UNCLASSIFIED` or `[UNCLASSIFIED]` plus the word Page. Page numbers are not
a `PAGE` field in the footer text that was extracted; the TOC uses
`PAGEREF`.

Population that preserves appearance means copying the package and replacing
specific runs or cloning table rows. It does not mean rebuilding sections,
styles, numbering, the seal, or footnotes.

Safe to populate, if a renderer were approved for this file:

- Placeholder runs that are a single text node, after checking the run is
  not split.
- Empty table cells in the revision history, information-type table,
  sponsor tables, leveraged-authorization tables, and PPS table, by writing
  into the existing `w:t` or by cloning a row's XML.
- Narrative cells in the solution tables, same way.

Unsafe or not honest without Word:

- Updating the TOC page numbers.
- Treating ballot-box characters as form fields. A checked state is a
  different character in the same run, and the run often contains every
  option at once (`☐ Implemented☐ Partially implemented…`). Replacing that
  string is possible and brittle.
- Splitting or merging runs that carry strikethrough on the cover and TOC.
- Repairing broken footnote cross-references.
- Adding or removing controls. The control sections are not a repeated
  content control. They are hand-authored tables with inconsistent column
  text. Cloning "a control" has no single prototype.
- Refreshing `PAGEREF` fields.

Images: the seal is a 116×116 JPEG. The PNG is 1×1. Both should be left in
place. Logos are empty placeholders ("Insert logo here"), not the seal.

There is no `w:ins` / `w:del`. Strikethrough is formatting.

---

## 16. Renderer technology analysis

No dependency was added. `docx` 9.7.1 is already pinned for the generic SSP.
The `docx` library builds a new document. It does not open this package, so
it cannot keep this file's styles, sectPr, footnotes, seal, or numbering.
Using it would produce a look-alike, which the milestone rejects.

| Option | Fit for this file |
| --- | --- |
| `docx@9.7.1` reconstruction | Poor. New document. Loses the template. Already used for `cf-ssp-docx` 1.0, which is a different product |
| Direct Open XML on a copy of the pin | The only option that keeps the package. Node can unzip, edit XML, and rezip without Word. Tests can assert XPath and ZIP contents. Risk: split runs, inconsistent control tables, TOC staleness, zip-bomb/XXE if the parser is ever pointed at an untrusted upload. The pin is trusted; a parser must still refuse entity expansion |
| A template library that needs `{tags}` or content controls | Poor on the unmodified file. There is one content control, the TOC. Adding tags means a derivative template, which is a second artifact to maintain. Commercial docxtemplater features are unnecessary to evaluate until a target template exists |
| Hybrid: prepare a derivative with stable slots, fill those at runtime | Workable only after a human accepts a derivative of an approved template. It is extra process, not a reason to tag this historical file |

Licensing: `docx` is already in the tree. No new license was accepted.
Server and Next.js: a future filler must stay server-only, like the current
SSP route, and must not mark a government template as a Control Freak layout
id.

**Recommendation if this exact file were the approved target:** copy the
pinned ZIP and patch `word/document.xml` text nodes and cloned rows. Do not
rebuild with `docx`. Do not update TOC page numbers; say that page numbers
are the template's cached values. Checkboxes stay visible and unchecked
unless the canonical model has a real boolean for that option.

**Accepted architecture (ADR-033):** do not build that filler. The
historical DOCX is a design reference only. A future Control Freak-owned
IL4 addendum should use a new layout over the existing `docx` generation
path, consuming Rev. 5 canonical content. Direct Open XML mutation remains
documented as the approach that would preserve this pin's formatting if a
human later reversed ADR-033, which is not the current plan.

---

## 17. High-fidelity population feasibility

Technically, parts of this DOCX can be filled in place. The seal, styles,
headers, footers, footnotes, and boilerplate can survive a careful XML edit.

Faithful population from Control Freak cannot. The file's control catalog is
not the canonical framework. Parameter blanks are not ODP ids. Status,
origination, and responsibility do not exist as canonical fields. Missing
facts would have to be fabricated or the document would be full of holes
while still looking like an official addendum. The fail-visible rule is
compatible with XML editing. It is not compatible with calling the result a
complete IL4 addendum.

Cached TOC pages would be wrong after edits. That alone keeps the output
from being a finished Word document without a field refresh the server does
not have.

---

## 18. Semantic risks and traps

1. Inferring a DoD authorization, a FedRAMP authorization, or a CNSSI
   categorization from `dod-cloud-il4-rev5`.
2. Treating Template (Version 2) or the filename `v1.8` as the current DISA
   artifact.
3. Importing Rev. 4 control sentences, Table 11-1, or "DoD Assignment"
   brackets into the Rev. 5 framework or into per-ODP mappings.
4. Using a shared GRR typo as a reason to edit the pinned extract.
5. Mapping workflow owner to Responsible Role.
6. Mapping `baseline-inherited` or `may-use-baseline` to the inherited
   origination checkbox.
7. Mapping `not-started` / `in-progress` onto Yes / Partial / Planned /
   Equivalent / risk acceptance.
8. Copying FIPS categorization into the CNSSI tables.
9. Exporting the sample PPS row (`80/TCP`, Tomcat).
10. Filling AC-2(13) from Attachment 10, or the reverse.
11. Checking a box because a narrative is non-empty.
12. Printing UNCLASSIFIED because the template footer does.
13. Repairing GR-9/GR-10/CA-3(5)/SI-2(6) labels by "correcting" framework ids.
14. Updating the generic SSP renderer as a shortcut to this template.

---

## 19. Accepted 09A disposition and next-milestone inputs

Architecture review accepted the research conclusion in ADR-033. The
export-target question is closed for this pin:

- the historical DOCX is not a Rev. 5 requirements source;
- it will not be populated with the current control population;
- it is a structural/design reference for a future Control Freak-owned DoD
  IL4 SSP Addendum;
- Control Freak is not waiting for a replacement official Word template.

09B is not started by this record. When a later architecture milestone is
approved, the research gaps that remain inputs include:

- SSP responsible role and control origination (ADR-032 deferred);
- richer implementation-status and GRR answer vocabularies;
- inventories, ports/protocols/services, and diagrams;
- leveraged authorizations and CAP/NIPRNet connection metadata;
- DoD-specific roles and cloud service/deployment characteristics;
- CNSSI 1253 identifiers and digital-identity documentation;
- document version, revision history, classification marking, and package
  attachments.

Those are information-model questions. They are not an invitation to import
this file's Rev. 4 control text or Mission Owner/SLA membership into the
framework.

Out of any immediate follow-on unless separately approved:

- Project schema, SQL, System UI, control UI, GRR UI.
- Per-ODP mappings, parameter precedence, framework population.
- Mission Owner/SLA controls.
- Direct Open XML population of this historical DOCX.
- New DOCX dependencies.

---

## 20. Recommended future Control Freak-owned IL4 addendum

The intended future export is a Control Freak-owned DoD IL4 SSP Addendum.

Structure and presentation may be informed by this historical document:
section organization, control-summary presentation, GRR presentation, and
general visual/document approach.

Requirements and generated content must come only from:

- FedRAMP Moderate Rev. 5;
- NIST SP 800-53 Rev. 5;
- DoD Rev. 5 SSP Addendum Controls v1.2;
- the current pinned Cloud Computing SRG / IL4 Table D-1 semantics;
- Control Freak's canonical framework and parameter-resolution logic.

Preconditions for a future rendering milestone:

- An approved Control Freak layout identity for the IL4 addendum, distinct
  from `cf-ssp-docx` 1.0 and distinct from copying this historical pin.
- Canonical SSP synthesis as the only semantic input. No second control or
  parameter interpretation.
- Responsibility and origination modeled only if a later ADR accepts them.
  Until then, those concepts stay visibly empty or out of the layout.
- Fail-visible output: missing data remains a placeholder the reader can see.
  Unresolved ODPs stay unresolved. Authoritative-value-required and
  source-conflict stay those states. No invented AO, PA, 3PAO result, or
  FedRAMP authorization.

Recommended renderer shape:

```
canonical project data
  -> framework read model and parameter resolution
  -> SSP view model
  -> Control Freak IL4 addendum layout
  -> generated DOCX
```

The existing `docx` library remains appropriate for a Control Freak-owned
layout. Direct mutation of the historical pin is not the architecture.
The historical DOCX stays an immutable design reference, not an output
shell.

When data is missing, the default is an explicit gap, not a guessed value
and not a silently omitted section.

---

## 21. Explicitly deferred and out of scope

Not done in 09A, and not authorized by this report:

- IL4 DOCX exporter
- Changes to `src/export/ssp-docx/` or `cf-ssp-docx` 1.0
- Project schema, migrations, System UI, control UI, GRR UI
- Responsibility, origination, leveraged authorizations, inventories,
  attachments
- IL4 per-ODP mappings, parameter precedence, OSCAL `set-parameters`
- Framework population changes, including Attachment 10
- New dependencies, `package.json`, or `package-lock.json`
- Editing the pinned DOCX
- 09B implementation
- Production or deployment changes

---

## Architecture STOP — closed

Architecture review accepted 2026-09-28. Decisions are ADR-033.

09A is complete. Do not start 09B or a template-rendering milestone without
a separate approval. Do not add responsibility/origination, inventories,
leveraged authorizations, framework population changes, per-ODP mappings,
or application behavior while closing this record.
