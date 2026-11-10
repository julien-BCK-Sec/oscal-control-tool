# 09E — FedRAMP Rev. 5 SSP DOCX Architecture and Document-Design Review

Research record for Milestone 09E **Phase 1**. Architecture was approved
2026-11-03 (D1–D10, including the D8 clarification). **ADR-035** is accepted.
Phase 2 implementation follows this record; this file remains the Phase 1
architecture research artifact.

Date: 2026-11-03  
**Status:** Architecture approved; Milestone 09E finally accepted and closed out (2026-11-10)
**ADR:** ADR-035 (accepted)

---

## 1. Executive conclusion

Control Freak already owns a complete general SSP pipeline
(ADR-030 / ADR-031 / ADR-032):

```text
canonical project + framework + records + Evidence
  → src/ssp buildSspDocument (view model)
  → src/export/ssp-docx renderSspDocx (cf-ssp-docx 1.0)
  → authenticated GET .../exports/ssp.docx
```

That pipeline is functionally correct and fail-closed. Its **presentation**
has not received the formal document-design pass that Milestone 09D gave the
IL4 Addendum. Milestone 09E should modernize presentation by extending the
existing 07B exporter, not by creating a parallel FedRAMP-only exporter and
not by filling the official FedRAMP Word shell.

The authoritative Rev. 5 Word SSP front-matter template and Appendix A
Moderate control template have been retrieved, hashed, and pinned under
`vendor/fedramp/ssp-rev5/`. FedRAMP currently marks both as **legacy**
(June 2026) during the Consolidated Rules 2026 transition. They remain the
correct structural/visual reference for a recognizable SSP. They are not
current submission authority and must not become Control Freak output shells
(same disposition pattern as ADR-033 for the historical IL4 addendum).

**Accepted disposition (ADR-035):**

1. Keep canonical SSP synthesis and parameter resolution unchanged.
2. Treat the pinned FedRAMP Rev. 5 Word SSP + Appendix A Moderate as
   immutable structural/presentation references only.
3. Modernize `cf-ssp-docx` in place to layout **2.0** by reusing 09D
   presentation patterns (formal cover, navy/steel/Calibri language,
   Control Summary Information rhythm, solution banner) **without**
   coupling to IL4 delta logic.
4. Map only existing canonical fields into a recognizable SSP structure.
5. Name unsupported official FedRAMP front-matter concepts once in a scope
   statement. Do not print empty official-looking tables for them.
6. Require no `project_json` schema change for the first implementation pass.
7. Framework labeling uses the actual selected framework name. NIST Moderate
   is not FedRAMP Moderate and must not imply FedRAMP authorization. DoD IL4
   retains accurate IL4 labeling and the separate 09D Addendum relationship.

---

## 2. Template identification and version

### 2.1 Selected references

| Artifact | Role |
| --- | --- |
| FedRAMP High/Moderate/Low/LI-SaaS Baseline SSP (Word) | Front-matter organization, cover identity, section hierarchy, system-information tables |
| SSP Appendix A Moderate FedRAMP Security Controls (Word) | Per-control presentation: requirement, Control Summary Information, solution narrative |

Pins and hashes: `vendor/fedramp/ssp-rev5/SOURCES.md`.

| Fact | Front-matter SSP | Appendix A Moderate |
| --- | --- | --- |
| Pinned path | `vendor/fedramp/ssp-rev5/templates/LEGACY_FedRAMP-High-Moderate-Low-LI-SaaS-Baseline-System-Security-Plan-(SSP).docx` | `vendor/fedramp/ssp-rev5/templates/LEGACY_SSP-Appendix-A-Moderate-FedRAMP-Security-Controls.docx` |
| SHA-256 | `e6b7ebb88115f2c810ff8416d5e164315af381422dce6f53196345a972f90033` | `c10efd457111f9f54c6ab08fb7a8ce46d6ae6535a782a412b6a807a97b315db3` |
| Size | 697977 bytes | 1334317 bytes |
| Retrieval | 2026-11-03 from `fedramp.gov/legacy/assets/...` | same date / listing |
| Template rev. in file | 1.0 → 1.1 → **1.2** (2026-06-16 legacy cover notice) | 1.0 → … → **1.4** (2026-06-17 coversheet deprecation) |
| Legacy notice | 2026-06-23; replaced by Consolidated Rules 2026 | same program notice |

Earlier public filenames without the `LEGACY_` prefix referred to the same
Rev. 5 Word family. The legacy listing is now the reproducible official
download location.

### 2.2 Front-matter section inventory (reference)

Cover and identity:

- Title: FedRAMP® (High, Moderate, Low, LI-SaaS) Baseline System Security Plan (SSP)
- CSP name, CSO name, version, date
- Template revision history; prepared-by / prepared-for; document revision history
- Approvals / signature blocks
- Header identity stack; footer `fedramp.gov`
- Embedded Montserrat / Noto fonts

Body sections 1–12:

1. Introduction  
2. Purpose  
3. System Information (Table 3.1)  
4. System Owner  
5. Assignment of Security Responsibility  
6. Leveraged FedRAMP-Authorized Services  
7. External Systems and Services Not Having FedRAMP Authorization  
8. Illustrated Architecture and Narratives (ABD / DFD / network + narrative)  
9. Services, Ports, and Protocols  
10. Cryptographic Modules (DAR/DIT; points at Appendix Q)  
11. Separation of Duties  
12. SSP Appendices List  

Appendices A–Q are package attachments. Appendix A is a **separate** baseline
control document, not embedded in the front-matter file.

### 2.3 Appendix A control-entry inventory (reference)

Each control/enhancement uses:

- Heading with control id + title + baseline tags `(L)(M)(H)` etc.
- Control requirement text (FedRAMP/NIST; CSP must not rewrite)
- Optional Additional FedRAMP Requirements and Guidance
- **Control Summary Information** table:
  - Responsible Role
  - Implementation Status (checkboxes)
  - Control Origination (checkboxes; Table A-1 vocabulary)
- **`{id} What is the solution and how is it implemented?`** response region

This rhythm already informed `cf-il4-addendum-docx` 1.0 and is the preferred
control-entry pattern for general SSP modernization.

### 2.4 Currentness and authority

FedRAMP’s own materials state these Word templates are legacy reference during
the Consolidated Rules 2026 transition. Control Freak must therefore:

- use them as recognizable SSP design references;
- not claim official FedRAMP package identity;
- not wait for a replacement Word template before modernizing the product SSP
  (same reasoning as ADR-033).

Roadmap item “FedRAMP SSP document generation” that fills the official
template remains a **separate future** authorization-package track. 09E is
not that track.

---

## 3. Existing Control Freak SSP (current state)

### 3.1 Governing ADRs and milestones

| Source | Constraint for 09E |
| --- | --- |
| ADR-030 / 07A | Canonical system characteristics in `project_json`; missing stays missing |
| ADR-031 / 07B | Control Freak-owned `cf-ssp-docx` 1.0; programmatic `docx`; no binary government template as shell; auth `project.read` |
| ADR-032 / 07C | Parameter resolution outside the renderer; fail closed; no silent winners |
| ADR-033 / 09A | Historical IL4 Word pin is structural reference only — pattern to reuse for FedRAMP SSP pin |
| ADR-034 / 09B–09D | IL4 Addendum is a separate delta document; generic SSP still prints full IL4 population including FedRAMP Moderate items not reprinted in the addendum |
| Milestone 08A | Authoring UX only; does not redesign SSP DOCX |
| Milestone 09E | Architecture review authorized; implementation gated |

### 3.2 Current document structure (`cf-ssp-docx` 1.0)

1. Cover (document type, disclaimer, definition table)  
2. Document status  
3. Table of contents (Word TOC field)  
4. System identification and overview  
5. System roles  
6. Authorization boundary and environment  
7. Information types and security categorization  
8. Interconnections  
9. Security requirements / control implementations (family H2; item H3/H4)  
10. Appendix A — Generation metadata  

Visual language: default `docx` fonts, gray header cells, functional tables.
Explicit product docs: “functional, not the final desired presentation.”

### 3.3 Current control-entry presentation

Per item the renderer prints:

- definition table (kind, family, optional CMMC origin, documentation status, optional owner);
- source statement;
- resolved statement;
- unresolved ODPs / parameter annotations;
- sourced framework assignments / supplements / notices;
- implementation narrative;
- linked Evidence table or placeholder.

Narratives are present but diagnostic/source material often competes with the
implementation response. There is no Control Summary Information banner and
no solution-response cell comparable to Appendix A / 09D.

### 3.4 Export contract (preserve unless separately approved)

- `GET /api/projects/[projectId]/exports/ssp.docx`
- Session + `project.read`; cross-tenant 404
- `Content-Type` Word MIME; `Content-Disposition` attachment;
  `Cache-Control: private, no-store`
- In-memory only; not persisted
- UI: workspace export action for all supported frameworks

### 3.5 Test / sample tooling

- View-model and renderer tests under `src/ssp/` and `src/export/ssp-docx/`
- Auth tests under `src/server/ssp-docx-export.test.ts`
- Framework smoke including full IL4 345-item generation
- No dedicated general-SSP sample script (IL4 has
  `scripts/generate-il4-addendum-sample.ts`)

---

## 4. Gap analysis — current versus target

| Area | Current `cf-ssp-docx` 1.0 | FedRAMP Rev. 5 reference convention | 09E target |
| --- | --- | --- | --- |
| Document ownership | Control Freak SSP; clear disclaimer | Official FedRAMP branded package | Keep Control Freak ownership; stronger formal cover; still not official |
| Cover / identity | Minimal title + definition table | CSP/CSO/version/date/approvals/logos | Formal cover stack + system/framework identity; no logos/signatures |
| Visual language | Default fonts, gray tables | Montserrat + FedRAMP chrome | Reuse 09D navy/steel/Calibri patterns; do not embed FedRAMP fonts/logos |
| Front-matter depth | Identity, overview, roles, boundary, categorization, interconnections | Adds leveraged services, non-authorized externals, diagrams, ports, crypto tables, separation of duties, appendices list | Keep supported sections; defer unsupported concepts to a single scope note |
| Control body | Labeled paragraphs; diagnostics prominent | Requirement + Control Summary + solution response | Adopt summary/solution rhythm; keep diagnostics secondary |
| Parameters | Resolved + unresolved + annotations (07C) | FedRAMP/organization assignments inside requirement text | Preserve 07C synthesis; present readably under the control entry |
| Implementation status | Documentation status from `ControlImplementation.status` | FedRAMP implementation-status checkboxes | Keep documentation status; do not invent FedRAMP assessment statuses |
| Responsible role / origination | Optional ControlRecord owner label only | Responsible Role + Control Origination checkboxes | Defer new fields; do not print empty official checkboxes |
| Evidence | Linked Evidence references | Separate package artifacts / CIS-CRM etc. | Keep Evidence as documentation references |
| Framework labeling | Documented against selected framework title | FedRAMP baseline SSP + Appendix A | Framework-aware labels; never mislabel NIST/CMMC as FedRAMP-authorized |
| IL4 relationship | Full 345-item general SSP | N/A (FedRAMP template is not IL4 addendum) | Unchanged: general SSP remains full population; 09D stays separate |
| Template shell | Programmatic generation | Fill official DOCX | Continue programmatic generation (ADR-031) |

---

## 5. Section-to-data mapping

Classification key:

- **Supported** — existing canonical / synthesis data can populate honestly  
- **Partial** — some related data exists; FedRAMP-shaped fields missing  
- **Unsupported** — no honest data; defer (name in scope, do not fake)  
- **FedRAMP-specific** — meaningful only for FedRAMP submission context  
- **Generic SSP** — useful across frameworks  
- **Deferred this milestone** — explicitly out of 09E implementation

| Proposed section | Class | Primary data today | Notes |
| --- | --- | --- | --- |
| Cover and document identification | Supported / Generic | `systemName`, short name, identifier, `organizationName`, framework descriptor, layout id/version, `generatedAt`, project id/revision | Formalize; keep CF generator identity and non-authorization disclaimer |
| Document status and generation information | Supported / Generic | Completeness notice paragraphs; documentation-completeness counts | Retain fail-closed completeness language |
| Purpose and scope | Supported (new copy) / Generic | Framework id/title; layout identity; fixed product copy | State what is and is not modeled; framework-aware wording |
| Table of contents | Supported / Generic | Heading tree | Keep Word TOC field; Word refreshes page numbers |
| System identification and description | Supported / Generic | `systemName*`, `systemIdentifier`, `organizationName`, `systemDescription`, operational status + remarks | Maps to FedRAMP §3 partially; no service/deployment model fields |
| System environment and authorization boundary | Supported / Generic | `authorizationBoundary`, `environmentOfOperation` | Narrative only; no ABD/DFD images |
| Security categorization and information types | Supported / Generic | `securityCategorization`, derived overall impact when complete, `informationTypes`, optional `dodCloudImpactLevel` | Never infer from framework selection |
| System roles and responsibilities | Partial / Generic | `systemRoles` (owner, AO, SSO, other) | No postal address field; no ISSO-appointment attestation |
| System interconnections | Partial / Generic | `interconnections` | Not the FedRAMP split of leveraged-authorized vs non-authorized externals |
| Security control implementation | Supported / Generic | Full framework population via `buildSspDocument` | Family grouping; requirement/resolved statement; parameters; narrative; evidence; notices |
| Supporting references / generation record | Supported / Generic | Layout, project, framework, generation timestamp | Expand slightly for pin/layout clarity if useful |
| Leveraged FedRAMP-Authorized Services | Unsupported / FedRAMP-specific / Deferred | — | No leveraged-authorization model |
| External systems without FedRAMP auth (as FedRAMP table) | Unsupported / FedRAMP-specific / Deferred | — | Do not overload interconnections into marketplace-authorization claims |
| Illustrated architecture / diagrams | Unsupported / Deferred | — | ADR-031 already deferred diagrams |
| Services, ports, and protocols | Unsupported / Deferred | — | |
| Cryptographic modules tables | Unsupported / Deferred | — | |
| Separation of duties matrix | Unsupported / Deferred | — | |
| Official appendices B–Q / approvals / signatures | Unsupported / FedRAMP-specific / Deferred | — | Do not emit empty package appendix shells |
| Responsible Role (per control) | Unsupported / Deferred | Optional owner label ≠ SSP responsibility | ADR-034 already distinguishes these concepts |
| Control Origination | Unsupported / Deferred | Framework inheritance ≠ origination | ADR-032/034 |
| FedRAMP implementation-status checkboxes | Unsupported / Deferred | Documentation status only | |

---

## 6. Missing metadata and proposed deferrals

No schema change is proposed for the first 09E implementation pass.

### 6.1 Missing relative to FedRAMP front matter (defer)

- Cloud service model; cloud deployment model  
- FedRAMP Package ID; authorization path (JAB vs Agency)  
- Digital Identity Level  
- Fully-operational date / attestation  
- Prepared-by / prepared-for addresses  
- Authored document version / revision history  
- Signature / approval blocks  
- Leveraged FedRAMP-authorized service register  
- Marketplace-validated external-service tables  
- Architecture, data-flow, and network diagrams  
- Ports/protocols/services inventory  
- Cryptographic module inventory (Appendix Q shape)  
- Separation-of-duties matrix  
- Package appendices B–Q as attachments  

### 6.2 Missing relative to Appendix A control entries (defer)

- Per-control Responsible Role as an SSP responsibility reference  
- Control Origination vocabulary / multi-select  
- FedRAMP implementation-status checkbox set (as assessment semantics)  
- Customer responsibility / CIS-CRM workbook semantics  

### 6.3 Already available (use)

- System identity, organization, overview, boundary, environment  
- Roles, information types, FIPS CIA (+ derived overall when complete)  
- Optional DoD cloud IL assertion  
- Interconnections summary  
- Full framework control/requirement/GRR population  
- 07C parameter resolutions, unresolved ODPs, annotations, conflicts  
- Implementation narratives and documentation status  
- Linked Evidence references  
- Overlay assignments/supplements/notices for IL4 (and any future overlays)

### 6.4 Deferred product claims (never invent in renderer)

- FedRAMP authorization, P-ATO, ATO, marketplace status  
- Compliance scores or assessment results  
- Silent parameter-conflict winners  
- Framework-inferred categorization  

---

## 7. Proposed document design (`cf-ssp-docx` 2.0)

### 7.1 Architecture

Prefer extending the existing exporter:

```text
unchanged: assemble/load project → buildSspDocument (ADR-032 synthesis)
changed:   renderSspDocx presentation + layout constants (2.0)
unchanged: authenticated delivery contract
unchanged: cf-il4-addendum-docx 1.0
```

Separation to preserve:

1. Canonical SSP synthesis (`src/ssp`)  
2. Framework / parameter resolution (`src/parameters` + framework pins)  
3. Document view model (`SspDocument`)  
4. DOCX rendering (`src/export/ssp-docx`)  
5. Authenticated export delivery (`src/server/ssp-docx-export`)  

View-model changes, if any, should be presentation-supporting only (for
example scope-copy helpers or heading labels). No new control interpretation.

### 7.2 Proposed section order

1. Cover and document identification  
2. Document status and generation information  
3. Purpose and scope (includes explicit deferrals; framework-aware)  
4. Table of contents  
5. System identification and description  
6. System environment and authorization boundary  
7. Security categorization and information types  
8. System roles and responsibilities  
9. System interconnections  
10. Security control implementation  
    - families  
    - control id/title  
    - requirement / resolved requirement  
    - parameter assignments (resolved/unresolved)  
    - implementation documentation status  
    - implementation narrative (primary)  
    - linked evidence  
    - source conflicts / warnings (secondary)  
11. Supporting references and generation record  

### 7.3 Control-entry presentation

Adopt the Appendix A / 09D rhythm without FedRAMP checkboxes:

1. Heading: `{displayId} {title}`  
2. Compact **Control Summary Information** table using available fields only:
   - Kind / family  
   - Implementation documentation status  
   - Optional owner label (labeled as operational owner metadata, not
     Responsible Role)  
   - Optional CMMC origin id  
3. Requirement block: source statement; resolved statement when distinct  
4. Parameter block: resolved values + visible unresolved placeholders  
5. Solution banner: `{displayId} What is the solution and how is it implemented?`  
6. Narrative (or concise `[Not yet documented: Implementation narrative]`)  
7. Evidence references  
8. Collapsed/secondary provenance: assignments, supplements, notices,
   annotations  

Pagination: prefer `cantSplit` on summary/response pairs where practical;
avoid large empty response regions.

### 7.4 Framework-aware labeling

| Project framework | General SSP labeling rules |
| --- | --- |
| NIST Low/Moderate/High | Document against that NIST baseline title. Do **not** title the document a FedRAMP SSP. NIST Moderate is not a FedRAMP Moderate package. |
| DoD Cloud IL4 | Document against DoD Cloud IL4 / FedRAMP+ documentation framework. Print full 345-item population. State that the IL4 Addendum is a separate delta companion. Do not claim FedRAMP or DoD authorization. |
| CMMC Level 2 | Use requirement terminology. No MET/NOT MET/SPRS/certification claims. |

### 7.5 Visual language

Reuse proven 09D tokens where appropriate (navy `#17365D`, steel `#4F81BD`,
label fill `#DBE5F1`, Calibri, rule borders, formal header/footer), adapted
to general-SSP section titles. Do not copy FedRAMP Montserrat packaging,
logos, or `fedramp.gov` footers.

### 7.6 Layout identity

Bump layout version to **`cf-ssp-docx` 2.0** so generated files and tests can
distinguish the modernized presentation from V1 without implying a new
document type. Document type remains “Control Freak System Security Plan.”

---

## 8. Required architectural decisions (approval gate)

These decisions require explicit review before Phase 2.

### D1 — Reference disposition (proposed ADR-035 core)

**Proposal:** Pin and cite the legacy FedRAMP Rev. 5 Word SSP + Appendix A
Moderate as immutable structural/presentation references only. Do not fill
them. Do not treat them as Consolidated Rules 2026 authority.

### D2 — Continue programmatic Control Freak layout vs official-template fill

**Proposal:** Extend programmatic `cf-ssp-docx` (ADR-031). Official-template
population remains the separate roadmap authorization-package track.

### D3 — Layout version

**Proposal:** `cf-ssp-docx` **2.0** (same document type; presentation bump).

### D4 — Visual/control presentation pattern

**Proposal:** Reuse 09D formal patterns (cover, colors, Control Summary
Information, solution banner) without importing IL4 delta population logic.

### D5 — Unsupported FedRAMP sections

**Proposal:** Single purpose/scope statement listing deferrals. No empty
official tables for leveraged services, diagrams, ports, crypto modules,
separation of duties, approvals, or appendices B–Q.

### D6 — Schema / domain changes

**Proposal:** None for first implementation. Missing fields listed in §6
remain future milestones if product prioritizes them.

### D7 — Synthesis / parameter resolution / export auth contract

**Proposal:** Unchanged. Renderer presentation only.

### D8 — Framework labeling for NIST Moderate

**Proposal:** NIST Moderate projects remain labeled as NIST SP 800-53 Rev. 5
Moderate documentation. Recognizable FedRAMP-like structure must not become a
FedRAMP Moderate authorization claim.

### D9 — Relationship to 09D

**Proposal:** No 09D behavior changes. General SSP continues to carry the
full selected framework population for IL4 projects.

### D10 — Sample tooling

**Proposal:** Add a general-SSP sample generation script in Phase 2 analogous
to the IL4 sample tool, for manual visual acceptance.

---

## 9. Implementation plan (Phase 2 — only after approval)

Ordered work packages (not started):

1. Accept ADR-035 (or record amended decisions).  
2. Update `src/export/ssp-docx/layout.ts` constants for 2.0 structure/visuals.  
3. Rewrite `renderSspDocx.ts` presentation; keep consuming `SspDocument`.  
4. Minimal view-model helpers only if required for scope/heading copy.  
5. Update focused renderer/export tests; keep synthesis tests green.  
6. Add representative sample generator + checked-in review notes path if useful.  
7. Update user-guide / current-state / architecture docs for layout 2.0.  
8. Run `npm test`, `npm run lint`, `npm run build`.  
9. STOP for manual DOCX acceptance before closeout/commit authorization.

Non-goals for Phase 2: schema migration; 09D edits; official template fill;
dependency additions without justification; push/tag/release/deploy.

---

## 10. Inspection record

Inspected for this Phase 1 review:

1. Milestone 07A system characteristics and ADR-030  
2. Milestone 07B human-readable SSP DOCX and ADR-031  
3. Milestone 07C / ADR-032 parameter-resolution architecture  
4. Milestone 09D IL4 addendum renderer and ADR-033/034  
5. `docs/decisions.md`, `docs/architecture.md`, `docs/current-state.md`,
   `docs/oscal-standards-alignment.md`, `docs/roadmap.md`  
6. `src/ssp/*`, `src/export/ssp-docx/*`, `src/server/ssp-docx-export.ts`,
   export route and UI entry points  
7. SSP DOCX tests and IL4 sample tooling contrast  
8. Pinned FedRAMP Rev. 5 SSP front-matter DOCX and Appendix A Moderate DOCX  

No renderer implementation, schema modification, commit, push, tag, release,
or deploy was performed.
