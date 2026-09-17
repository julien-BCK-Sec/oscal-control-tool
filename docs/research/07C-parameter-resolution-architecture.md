# 07C — Parameter Resolution Architecture

**Status:** Architecture proposal. Not approved for implementation.  
**Date:** 2026-09-17  
**Release baseline:** v0.7.0 (`56e71ff`)  
**Milestone:** `docs/milestones/07C-parameter-resolution-control-fidelity.md`

This document is the Milestone 07C architecture/research deliverable. It
does not change runtime behavior.

Labels used below:

- **Code fact** — observed in the current repository implementation
- **Artifact fact** — observed in pinned vendor extracts, catalogs, profiles,
  or schemas
- **Recommendation** — proposed 07C behavior awaiting approval
- **Unresolved** — requires a product decision or later evidence

---

## 1. Current-state parameter data flow

**Code fact.** Parameters today travel through this path:

```
NIST SP 800-53 Rev. 5 catalog JSON
        +
NIST Low/Moderate/High OSCAL profiles (include-controls only)
        → src/framework/nist-sp-800-53-rev5/derive.ts
        → generated nist-sp-800-53-rev5-{low,moderate,high}.json
        → FrameworkRegistry / FrameworkControl.parameters.organizationDefined

FedRAMP Moderate baseline XLSX + DoD SSP Addendum + Table D-1 extract
        + same NIST catalog
        → src/framework/dod-cloud-il4-rev5/derive.ts
        → generated dod-cloud-il4-rev5.json
        → runtime mapper (control-level OverlayParameterMetadata
           → FrameworkParameterMetadata)

CMMC Level 2 CSV
        → no catalog parameters / no insert tokens

Authoring UI
        → renderAuthoringRequirement() may positionally inline
           control-level effectiveAssignmentText into insert tokens
        → ControlImplementation { status, narrative } only is saved

project_json schema v2
        → metadata + implementations; no parameter records

SSP document/view model
        → humanizeSourceStatement() replaces every insert with
           [Unresolved ODP: id — label]
        → mapOverlayForSsp() copies control-level assignment blocks
           beside the source statement; does not inline

DOCX renderer
        → prints sourceStatement, unresolvedParameters, overlay blocks
        → no independent resolution logic

NIST OSCAL SSP exporter
        → implemented-requirement description = narrative
        → no set-parameters
```

**Code fact.** Framework content remains read-only reference data (ADR-004,
ADR-026, ADR-029). Implementation narratives are the only per-control
project-authored requirement content.

**Code fact.** AC-7 end-to-end:

1. Catalog defines six parameter IDs (`ac-07_odp.01` … `ac-07_odp.06`).
   Statement inserts `.01`, `.02`, and `.03`. `.04`–`.06` appear only inside
   `.03` select choices.
2. NIST Low/Moderate/High derivation copies those catalog params and leaves
   insert tokens in `statement`. No assignments.
3. IL4 derivation copies the same six catalog params, then classifies the
   **control** as `authoritative-value-required` from Addendum/Table D-1
   prose. FedRAMP assignment text for AC-7 is empty. The Addendum/DoD
   paragraph is not attributed to any ODP ID.
4. Authoring UI may try to inline the whole Addendum paragraph using
   `AC-7 a. [value]` fragment parsing. That parser looks for
   `ControlId path [brackets]` lines; AC-7's Addendum prose is not in that
   shape, so inlining fails closed for this control.
5. Persistence stores only the implementation narrative.
6. SSP/DOCX keep all three statement inserts unresolved and show the DoD
   assignment as a separate block plus a DSPAV notice.
7. OSCAL export (NIST projects only) emits the narrative, not parameter
   settings.

---

## 2. Authoritative parameter shapes

### 2.1 OSCAL catalog parameter (pinned schema v1.2.2)

**Artifact fact.** A catalog `param` is identified by `id` and may include
`label`, `guidelines`, `select`, `values`, `constraints`, `usage`, `class`,
`props`, `links`, `remarks`, and deprecated `depends-on`.

`select` is:

```ts
{
  "how-many"?: "one" | "one-or-more"; // omitted ⇒ only one value permitted
  choice: string[]; // markup line; may contain {{ insert: param, … }}
}
```

**Artifact fact.** Pinned catalog schema: “Without this setting, only one
value should be assumed to be permitted.”

OSCAL `values` are `string[]`. There is no integer, duration, date, or enum
datatype in the catalog parameter model.

### 2.2 Pinned NIST catalog contents

**Artifact fact.** `vendor/oscal/v1.2.2/catalogs/NIST_SP-800-53_rev5_catalog.json`:

| Observation | Count |
| --- | ---: |
| Catalog controls (including enhancements) | 1196 |
| Distinct parameter IDs | 1600 |
| Duplicate parameter IDs | 0 |
| Parameters with `select` | 133 |
| `how-many: one-or-more` | 97 |
| `how-many` omitted (schema default: one) | 36 |
| `how-many: one` explicit | 0 |
| Parameters with `values` | 0 |
| Parameters with `constraints` | 0 |
| Parameters with `usage` / `class` / `depends-on` | 0 |
| Parameters with `props` | 1600 |
| `aggregates` property occurrences | 331 |
| Select choices containing nested inserts | 71 |
| Statement insert tokens whose ID is not a catalog param | 0 |
| Catalog params never inserted in a statement (nested in other params) | 73 |

**Artifact fact.** Every parameter has `props`. Typical names:

- `alt-identifier` (legacy `ac-7_prm_1` style)
- `label` / `alt-label` (SP 800-53A presentation)
- `aggregates` (parent param listing child ODP IDs), e.g. AC-6(1) `ac-6.1_prm_2`

**Artifact fact.** AC-7 is a representative mixed shape:

- `.01` number (assignment / free text)
- `.02` time period (assignment / free text)
- `.03` one-or-more selection whose choices nest `.04`, `.05`, `.06`
- `.04`–`.06` are conditional on selected choices

A legitimate organization value for `.02` may be `15 minutes` or prose such
as `Immediately upon receipt of a validated termination event`.

### 2.3 OSCAL profile `modify` / `set-parameter`

**Artifact fact.** Pinned NIST Low/Moderate/High profiles have `imports`,
`merge.as-is`, and `back-matter` only. They do **not** contain `modify`.

**Code fact.** NIST derivation fails closed if `modify` / `set-parameters`
appear (`UNSUPPORTED_PROFILE_FEATURES_THAT_ALTER_FRAMEWORK`).

**Artifact fact.** Profile `modify.set-parameters` *can* carry `param-id`,
`values`, `select`, `constraints`, and `props`. That structure is unused by
the currently pinned NIST baselines.

### 2.4 OSCAL SSP `set-parameter`

**Artifact fact.** SSP 1.2.2 `set-parameter` is:

```ts
{
  "param-id": string;
  values: string[]; // minItems 1
  remarks?: string;
}
```

It appears on `control-implementation`, `implemented-requirement`, and
`by-component`. Selection is not a distinct SSP field; selected choices
become string `values`. The current exporter uses none of these locations.

### 2.5 FedRAMP Moderate assignments used by IL4

**Code fact.** IL4 does not read a FedRAMP OSCAL profile. It parses
`vendor/dod/cloud-il4-rev5/FedRAMP_Security_Controls_Baseline.xlsx`
(`fedramp-defined assignment` column) into control-level prose.

**Artifact / code fact.** Typical assignment lines:

```text
AC-1 (c) (1) [at least every 3 years]
AC-1 (c) (2) [at least annually] [significant changes]
```

No OSCAL parameter IDs appear in those cells. Of 137 IL4 items with FedRAMP
assignment text, 65 have the same number of `[brackets]` as statement insert
tokens; 72 have fewer brackets than inserts (partial assignment). Zero have
more brackets than inserts. Zero assignment texts mention `_odp` / `_prm_`
IDs.

### 2.6 Table D-1 / Addendum

**Artifact fact.** Table D-1 extract has 23 IL4-applicable rows:

| `tableD1AdjustmentKind` | Count |
| --- | ---: |
| `dspav-must-be-used` | 10 |
| `inclusion-only` | 6 |
| `explicit-value` | 4 |
| `may-use-fedramp` | 3 |

Parameter cells are control-level prose (`DSPAV must be used.`,
`CSP/CSO may use FedRAMP value.`, or multi-sentence AC-7 text). None mention
OSCAL parameter IDs.

---

## 3. Framework parameter inventory

Counts are **regression observations** from the current pinned artifacts and
generated JSON, not architecture invariants.

| Framework | Selected items | Items with catalog params | Distinct catalog param IDs | Statement insert IDs | Select params | Framework assignments |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| NIST Low | 149 | 108 | 445 | 335 | 41 | none |
| NIST Moderate | 287 | 198 | 643 | 473 | 64 | none |
| NIST High | 370 | 254 | 767 | 565 | 76 | none |
| CMMC Level 2 | 110 | 0 | 0 | 0 | 0 | n/a (no ODP model) |
| DoD Cloud IL4 | 345 | 232 | 723 | 535 | 71 | control-level only |

Statement insert IDs < distinct param IDs because nested select parameters
are catalog params that are not themselves statement inserts.

### IL4 control-level classification (current generated artifact)

Generated JSON uses overlay `dspavStatus`. Runtime maps that field onto
`FrameworkAuthoritativeValueStatus` (**code fact**, `runtime.ts`):

| Generated `dspavStatus` | Runtime `authoritativeValueStatus` | Items |
| --- | --- | ---: |
| `csp-organization-defined` | `csp-organization-defined` | 186 |
| `fedramp-base-inherited` | `baseline-inherited` | 132 |
| `not-indicated` (GRRs) | `not-indicated` | 10 |
| `satisfied-by-addendum-value` | `satisfied-by-overlay` | 6 |
| `authoritative-value-required` | `authoritative-value-required` | 4 |
| `fedramp-explicitly-referenced` | `may-use-baseline` | 3 |
| `dod-explicit` | `overlay-explicit` | 3 |
| `source-conflict` | `source-conflict` | 1 (`ia-5.1`) |
| **Total** | | **345** |

**Code fact.** 152 IL4 items have two or more catalog ODPs and a **single**
control-level status. Example: `si-7.1` has 16 ODPs classified together as
`fedramp-base-inherited`.

**Code fact.** Project-authored parameter values: **zero**. Schema v2 has no
place to store them. Demo narratives must not be treated as ODP values
(**requirement**, and **code fact** that nothing reads narratives for ODPs).

**Recommendation.** Do not force CMMC into NIST ODP semantics. CMMC
statements are 800-171 requirement prose without insert tokens.

---

## 4. Where current semantics are lost

**Code fact.**

1. **NIST profile assignments never exist** because pinned profiles have no
   `modify`, and derivation rejects `modify`.
2. **Catalog `props` are dropped**, including `alt-identifier` and
   `aggregates`. Aggregate grouping and legacy IDs are not in the read model.
3. **`how-many` omitted is stored as absent**, not as OSCAL's default `one`.
   Presentation then joins choices without a “one of” caption.
4. **Select choice nested inserts are not modeled as edges.** They remain
   raw `{{ insert }}` strings inside `choices[]`.
5. **FedRAMP/DoD assignments are control-level strings**, not
   `param-id → values[]`.
6. **IL4 classification is control-level.** Different ODPs on one control
   cannot have different statuses.
7. **Authoring inlining is positional**, matching `[bracket]` order to insert
   tokens inside a parsed statement path. It is not param-id mapping. SSP
   generation correctly refuses to use it (07B / ADR-031).
8. **Project persistence has no parameter records.** Narratives cannot fill
   that gap.
9. **OSCAL export has no `set-parameters`.** Even authored future values
   would be dropped today.
10. **Table D-1 / Addendum cannot be attributed to ODP IDs** from pinned
    evidence. Guessing from similar prose is forbidden.

---

## 5. Proposed framework parameter-resolution model

Framework resolution is **immutable reference data**. It is generated and/or
derived at runtime from pinned artifacts. It is never stored as editable
project JSON.

**Recommendation.** Expand catalog identity on `FrameworkControl` and add a
per-parameter resolution list. Keep today's control-level overlay metadata
as a **summary** until a parameter is explicitly mapped.

```ts
export type ParameterSelectHowMany = "one" | "one-or-more";

export type CatalogParameterChoice = {
  key: string; // stable: zero-based index as decimal string in 07C
  text: string;
  nestedParameterIds: readonly string[];
};

export type CatalogParameterSelect = {
  howMany: ParameterSelectHowMany; // omitted catalog how-many ⇒ "one"
  choices: readonly CatalogParameterChoice[];
};

export type CatalogParameter = {
  id: string;
  controlId: string;
  label: string;
  description: string;
  altIdentifiers: readonly string[];
  aggregatedParameterIds: readonly string[];
  select?: CatalogParameterSelect;
};

export type FrameworkParameterMappingBasis =
  | "catalog-unassigned"
  | "oscal-set-parameter" // unused with current NIST profiles
  | "pinned-overlay-mapping"
  | "control-level-unmapped";

export type FrameworkParameterResolution = {
  controlId: string;
  parameterId: string;
  /**
   * Reuse existing runtime overlay vocabulary. For NIST L/M/H this is
   * `csp-organization-defined`. For unmapped IL4 ODPs this copies the
   * control-level status; `mappingBasis` says it is not yet attributed
   * to this parameter ID.
   */
  status: FrameworkAuthoritativeValueStatus;
  mappingBasis: FrameworkParameterMappingBasis;
  /** OSCAL-compatible strings when a public mapped value exists. */
  values: readonly string[];
  sources: readonly FrameworkProvenanceText[];
  /** Present when this ODP is not attributed; points at control overlay. */
  controlOverlaySummary?: {
    status: FrameworkAuthoritativeValueStatus;
    effectiveAssignmentText: string | null;
    effectiveAssignmentSource: string | null;
  };
};
```

`parameterId` is unique in the pinned catalog (**artifact fact**), but
`controlId` is still stored so orphan checks survive catalog edits.

**Recommendation.** Generate per-parameter rows for every catalog param on
selected controls:

- NIST L/M/H: `status: "csp-organization-defined"`,
  `mappingBasis: "catalog-unassigned"`, `values: []`.
- IL4: same catalog rows, `mappingBasis: "control-level-unmapped"`,
  `status` copied from the control-level runtime status, plus
  `controlOverlaySummary`, **unless** a pinned mapping file names that
  `parameterId`.
- GRRs: no catalog params; control overlay `not-indicated` only.
- CMMC: no parameter resolutions.

Do not invent a parallel status vocabulary. Overlay-generated `dspavStatus`
stays an IL4 derivation concern; application-facing 07C code should use
`FrameworkAuthoritativeValueStatus`.

**Recommendation.** Do not treat the existing positional inliner as a
mapping basis. Optional later pinning may cite it as a *candidate generator*
only.

Keep current `FrameworkParameterMetadata` control-level fields during 07C
so 06B presentation and SSP overlay blocks do not regress.

---

## 6. Proposed project-authored parameter model

**Recommendation.** Persist project records separately from catalog and
from implementation narratives.

```ts
export type AuthoredAssignment = {
  form: "assignment";
  /** One or more free-form strings. Not a number/duration/date/enum. */
  values: readonly string[];
};

export type AuthoredSelection = {
  form: "selection";
  howMany: ParameterSelectHowMany;
  selectedChoiceKeys: readonly string[];
  /** Nested records for insert IDs in the selected choices only. */
  nested?: Readonly<Record<string, AuthoredParameterBody>>;
};

export type AuthoredParameterBody = AuthoredAssignment | AuthoredSelection;

export type ProjectParameterIntent =
  | "organization-defined"
  | "accept-permitted-baseline"
  | "dspav-assertion"
  | "documented-deviation"
  | "conflict-proceeding";

export type ProjectParameterRecord = {
  controlId: string;
  parameterId: string;
  intent: ProjectParameterIntent;
  body?: AuthoredParameterBody;
  notes?: string;
  /** Required for dspav-assertion: where the org says the value came from. */
  dspavSourceNote?: string;
};

export type ProjectParameterRecords = Readonly<
  Record<string, ProjectParameterRecord>
>;
```

Record key: `parameterId` (catalog-unique). `controlId` is duplicated on the
record for restore/orphan checks.

Why this is more than `value: string`:

- OSCAL SSP uses `values: string[]`.
- Catalog `select` needs chosen alternatives, cardinality, and nested ODPs.
- DSPAV assertions and deviations must not look like ordinary org-defined
  values.

Why this is not an application datatype system:

- `values` remain strings.
- UI helpers (duration widgets, checkboxes) are presentation only.
- A time-period ODP may store `15 minutes` or a paragraph of prose.

**Recommendation.** Aggregate catalog params (`aggregates` props) are not
independently authored. Authors edit child ODP IDs. The aggregate remains
catalog grouping metadata.

---

## 7. `project_json` schema version and migration

**Recommendation.** Advance **schema v2 → schema v3**.

Rationale (same pattern as 07A): new user-authored canonical fields belong
in `project_json` so named versions and restore already cover them. No
relational table: parameter records are project document data, like
implementations. No SQL migration; `projects.schema_version` is already an
integer (**code fact**).

```ts
export const PROJECT_DOCUMENT_SCHEMA_VERSION = 3 as const;

export type StoredProjectCore = {
  id: string;
  name: string;
  frameworkId: string;
  metadata: ProjectMetadata;
  implementations: Record<string, ControlImplementation>;
  parameterRecords: Record<string, ProjectParameterRecord>;
};
```

Migration:

- Load v1 → current v2 metadata migration, then attach
  `parameterRecords: {}`.
- Load v2 → `{ ...v2.project, parameterRecords: {} }`, persist v3 on next
  save (same as v1→v2).
- Create always writes v3.
- Historical v1/v2 snapshots remain readable.
- Restore applies the restored document's parameter records after in-memory
  migrate; live `projects.framework_id` still does not switch (ADR-026).
- Missing `parameterRecords` is `{}`, never inferred from narratives.

**Code fact.** `frameworkId` is immutable after create. Framework-change
orphans in 07C mean **catalog/param identity drift** when generated
artifacts change, not in-app framework switching.

Orphan rule:

- If a stored `parameterId` is absent from the live selected framework,
  keep the record, mark it `orphan` at read time, exclude it from
  synthesis/OSCAL, show it in UI as leftover documentation.
- Do not delete on save.
- Do not rebind it to a similarly labeled new ID.

---

## 8. Resolution / precedence

**Recommendation.** Effective parameter state is computed, never stored as
a denormalized winner on the project.

```text
catalog parameter
    +
framework parameter resolution
    +
optional project record
    =
EffectiveParameter
```

```ts
export type EffectiveParameterState =
  | { kind: "unresolved-organization-defined" }
  | { kind: "resolved-organization-defined"; body: AuthoredParameterBody }
  | { kind: "framework-value"; values: readonly string[]; status: FrameworkAuthoritativeValueStatus; source: FrameworkProvenanceText }
  | { kind: "permitted-baseline-available"; values: readonly string[]; accepted: boolean; body?: AuthoredParameterBody }
  | { kind: "authoritative-value-required"; assertion?: AuthoredAssignment }
  | { kind: "source-conflict"; proceeding?: AuthoredParameterBody }
  | { kind: "control-overlay-unmapped"; controlSummary: NonNullable<FrameworkParameterResolution["controlOverlaySummary"]>; documentation?: ProjectParameterRecord }
  | { kind: "documented-deviation"; framework: EffectiveParameterState; deviation: AuthoredParameterBody }
  | { kind: "orphan"; record: ProjectParameterRecord };
```

### Answers to 13.1–13.7 / questions C–F

**C. Framework-authoritative values (assigned, inherited).**  
A project **must not replace** the framework value as the effective
requirement value. If the organization operates differently, store
`intent: "documented-deviation"`. Synthesis keeps the framework value in
the requirement text and shows the deviation as a notice. Do not convert
framework-assigned into organization-defined.

**Organization-defined catalog ODPs (NIST L/M/H, and IL4 params whose
framework status is `csp-organization-defined` and mapping is attributed).**  
A project-authored `organization-defined` body **does** resolve that ODP
for SSP synthesis. Unmapped IL4 rows do not, even when the copied control
status is `csp-organization-defined`.

**Inherited FedRAMP (once mapped to a param ID).**  
Same as framework-authoritative. Until mapped, IL4 inherited prose stays
control-level unmapped (see §11).

**D. Explicitly permitted baseline (`may-use-baseline`).**  
This is not automatic inheritance. Framework exposes the permitted FedRAMP
strings. The ODP stays unresolved until the project either
`accept-permitted-baseline` or authors an organization-defined body.
This is stricter than the current authoring inliner and matches 07B SSP
behavior (no silent inlining).

**E. DSPAV.**  
`authoritative-value-required` is not organization-defined. A project may
store `intent: "dspav-assertion"` with string values and
`dspavSourceNote`. That does not change framework status. Synthesis never
treats the assertion as a normal ODP substitution. Show the unresolved or
DSPAV placeholder in the source statement and the assertion as a labeled
block.

**F. Source conflicts.**  
Authors may store `conflict-proceeding` (how the organization proceeded).
The conflict remains visible. No synthesized winner.

**Partial resolution.**  
Each insert token is resolved independently. A control with three ODPs and
two resolved bodies yields two substitutions and one placeholder. The
control is never marked “resolved” as a whole.

---

## 9. DoD IL4 per-ODP findings

**Code fact.** 06B classifications are control-level and cannot be mapped
faithfully onto individual ODPs from current pinned evidence.

**Artifact fact.** Neither Table D-1 nor Addendum/FedRAMP cells contain
OSCAL parameter IDs.

**Recommendation.** Fail closed:

1. Keep 06B control-level status as the overlay summary (no 06B regression).
2. Emit per-ODP rows with `mappingBasis: "control-level-unmapped"` until a
   **pinned mapping file** names `controlId` + `parameterId` + mapping
   basis. Copy the control-level `FrameworkAuthoritativeValueStatus`.
3. Do not guess AC-7 `.01` = “three unsuccessful attempts” from prose
   similarity.
4. Do not use “bracket count equals insert count” (65 IL4 items) as
   authority. Those rows are **candidates** for a later human-pinned file.

Proposed pin file (not created in this research phase):

`vendor/dod/cloud-il4-rev5/extracts/il4-parameter-mappings.json`

```ts
{
  source: { /* hashes of Addendum / Table D-1 / FedRAMP workbook */ };
  mappings: Array<{
    controlId: string;
    parameterId: string;
    status: FrameworkAuthoritativeValueStatus;
    values: string[];
    evidence: string; // quote or cell reference, not inferred paraphrase
  }>;
}
```

Empty `mappings` is valid and is the 07C starting point.

Representative controls:

| Control | Catalog ODPs | Current control status | Per-ODP mapping now? |
| --- | ---: | --- | --- |
| AC-1 | 9 (incl. aggregate) | `fedramp-base-inherited` | No. FedRAMP only assigns (c)(1)/(c)(2). |
| AC-7 | 6 | `authoritative-value-required` | No. Mixed privileged/non-privileged/DSPAV prose. |
| AU-5(1) | 3 | `may-use-baseline` | No. One FedRAMP fragment `AU-5(1)-3 […]`. |
| SC-24 | 3 | `satisfied-by-addendum-value` | No. Three brackets, but not bound to IDs in the pin. |
| IA-5(1) | 2 | `source-conflict` | No. Conflict is control-level. |
| SC-46 | 0 catalog params | conditional CDS | N/A at ODP layer. |
| GRR-1 | 0 | `not-indicated` | N/A. |

**Recommendation.** IL4 project ODP authoring is allowed as documentation,
but SSP **does not inline** those values while `mappingBasis` is
`control-level-unmapped`. Overlay assignment blocks and notices remain
the 06B/07B presentation. NIST L/M/H get full per-ODP synthesis in 07C
without waiting for IL4 pins.

---

## 10. DSPAV handling

**Recommendation.**

- Framework: `authoritative-value-required` (and `satisfied-by-overlay` when
  the public Addendum already supplies a mapped value).
- Never invent DSPAV.
- Never recast DSPAV as organization-defined.
- Project optional `dspav-assertion` is labeled “organization asserts this
  is the DSPAV obtained from the restricted source,” with `dspavSourceNote`.
- SSP: keep DSPAV notice; do not replace insert tokens with the assertion.

---

## 11. Source-conflict handling

**Code fact.** Only `ia-5.1` is classified `source-conflict` in the current
IL4 artifact. FedRAMP additional guidance and DoD assignment both exist;
`effectiveAssignmentText` is null.

**Recommendation.** Preserve both source blocks. Project
`conflict-proceeding` is commentary. SSP notices stay. No winner.

---

## 12. Framework-change / orphan behavior

**Code fact.** Projects cannot switch `frameworkId`. Restores do not switch
it.

**Recommendation.** Orphans happen when a future derivation drops or
renames a parameter ID. Keep stored records, surface `orphan`, exclude from
synthesis and OSCAL. Do not auto-migrate by label similarity.

---

## 13. Proposed authoring UX

**Recommendation.** Minimum 07C authoring lives on the control workspace,
not as a new product area.

- Primary label: catalog `label` + guideline sentence. Parameter ID is
  secondary metadata (plus alt-identifier if present).
- Show framework status/provenance in sentence case, not color alone.
- Organization-defined: textarea for assignment; checkbox/radio for
  catalog select, **plus** a textarea so a listed choice is never the only
  legal path when the catalog param is actually free text. Select params
  use selection form; assignment params never become dropdowns by guessing
  types.
- Framework-assigned / inherited: read-only framework values; optional
  deviation note.
- May-use-baseline: actions “Use permitted FedRAMP value” or “Author
  organization value.”
- DSPAV: assertion fields clearly labeled; not a normal ODP editor.
- Conflict: proceeding note; conflict banner remains.
- IL4 unmapped: show control overlay summary; ODP editors are
  “documentation only, not used in SSP substitution until mapped.”
- CMMC / GRRs: no ODP editor.
- Permissions: write with `control.edit_implementation` (same as
  narratives). `project.read` can view. Reviewer/viewer cannot edit.
  Tenant isolation via existing project save.
- Do not infer from the narrative field.

Reuse design-system form controls. No third-party widget kit.

---

## 14. SSP document-model changes

**Recommendation.** Keep `sourceStatement` as the unresolved/humanized
catalog statement (07B). Add computed fields consumed by the renderer; do
not put resolution rules in `src/export/ssp-docx`.

```ts
export type SspParameterResolution = {
  id: string;
  label: string;
  state: EffectiveParameterState["kind"];
  displayText: string | null; // substitution text when allowed
  placeholder: string | null;
  provenanceLabel: string | null;
};

export type SspFrameworkItem = {
  // existing 07B fields…
  sourceStatement: string;
  resolvedStatement: string; // sourceStatement with allowed substitutions only
  parameterResolutions: SspParameterResolution[];
  // frameworkAssignments / notices unchanged for overlay summary
};
```

Substitution rules for `resolvedStatement`:

- Replace an insert only when effective state is
  `resolved-organization-defined` or `framework-value` with
  `mappingBasis` other than `control-level-unmapped`, or accepted
  permitted baseline.
- Partial: mix values and `[Unresolved ODP: …]` / DSPAV placeholders.
- Never use implementation narratives.
- Never inline unmapped IL4 overlay paragraphs into inserts.
- Visual/template redesign remains out of scope.

---

## 15. OSCAL export recommendation

**Recommendation (question I):** **Do not consume project parameter
resolutions in 07C OSCAL export.** Follow-on work package after 07C.

Reasons:

- Canonical domain must stay OSCAL-independent; the current exporter is a
  thin adapter of narratives and 07A characteristics.
- Faithful `set-parameters` needs mapped `param-id` + `values[]`. IL4
  overlay values are not mapped. Emitting unmapped guesses would over-claim.
- Selection can be exported later as selected choice strings in `values`
  plus `remarks`.
- CMMC/IL4 OSCAL SSP remain disabled.

When a follow-on adapter runs, NIST L/M/H
`resolved-organization-defined` records belong on
`implemented-requirement.set-parameters` (control-scoped), not system
implementation. Do not invent profile `modify` output.

---

## 16. Responsibility / origination

**Recommendation: Option B — defer.**

Responsibility (CSP / customer / shared / inherited / hybrid) is orthogonal
to parameter identity. It is per-control or per-statement origination, not
an ODP. Including it would expand 07C into FedRAMP package semantics the
milestone explicitly excludes. Parameter resolution is already large
because of IL4 unmapped overlay.

A later milestone can add `implementationOrigination` beside implementations
without changing the parameter model.

---

## 17. Security, tenancy, versioning, demo

**Recommendation.** Parameter records inherit the project tenant boundary
and `project.read` / `control.edit_implementation`. Cross-tenant 404
unchanged. No separate audit table; `project_json` snapshots already
version the document. Autosave is the existing project save. Concurrent
edits follow current revision/conflict behavior.

**Demo (explicit seed, never inferred):**

| Example | Project |
| --- | --- |
| Org-defined assignment `5` / `15 minutes` | NIST Moderate flagship, AC-7 `.01`/`.02` |
| Unresolved org-defined | same project, another ODP left empty |
| Flexible prose time period | NIST Low early-stage |
| Selection + nested | NIST Moderate AC-7 `.03` |
| Framework-authoritative / inherited | IL4 AC-1 overlay summary; no fake per-ODP pin |
| May-use FedRAMP | IL4 AU-5(1) |
| DoD explicit / DSPAV | IL4 AC-7, MA-5(1) |
| Source conflict | IL4 IA-5(1) |
| Partial resolution | NIST High, one control with mixed filled/empty ODPs |

---

## 18. Testing strategy

- Persistence: v2→v3 migrate; empty records; no narrative inference;
  restore; orphan display; tenant isolation; viewer cannot write.
- Framework: catalog IDs; select howMany default; nested choice IDs;
  NIST all org-defined; IL4 unmapped unless pinned; 06B control statuses
  unchanged; 345 / 10 GRRs.
- Resolution engine: each status × project intent matrix; partial inserts;
  deviation does not replace framework value.
- SSP: unresolved / full / partial; prose value; DSPAV placeholder;
  conflict notice; no overlay inlining without mapping.
- UI: org-defined textarea; select not forced on assignment params;
  read-only framework values.
- Regression: NIST L/M/H, CMMC, IL4 06B representatives, 07B Word SSP,
  NIST OSCAL export unchanged, no new CMMC/IL4 OSCAL.

---

## 19. Proposed implementation work packages

No intermediate STOP for mechanical steps. STOP if implementation would
change these recommendations (especially IL4 mapping authority, schema
shape, or OSCAL export scope).

1. **Framework parameter identity** — catalog props/select/nesting;
   per-ODP resolution rows; IL4 `control-level-unmapped`; pin-file
   loader (empty mappings OK); keep 06B control-level metadata.
2. **Schema v3 persistence** — `parameterRecords`; migrate/load/save/
   restore/orphan; authorization tests.
3. **Resolution engine** — precedence/state machine; no UI/DOCX logic
   duplication.
4. **Authoring UI + Help** — control workspace editors; CMMC/GRR skipped;
   IL4 documentation-only until mapped.
5. **SSP synthesis + demo seed** — `resolvedStatement` / per-insert
   placeholders; explicit demo records; renderer remains presentation.

OSCAL `set-parameters` is **not** a 07C work package.

After approval, expected flow: implement WP1–WP5 → validate → self-review →
commit/push → report → release decision. Consequential architecture drift
still STOPs.

If approved, record the decision as **ADR-032** at the start of
implementation (this file remains the research source).

---

## 20. Risks, assumptions, unresolved questions

**Assumptions**

- v0.7.0 remains the implementation baseline.
- CMMC stays outside NIST ODP semantics.
- Empty IL4 mapping file is acceptable for 07C delivery of NIST ODP
  authoring + honest IL4 overlay blocks.

**Risks**

- Users may expect IL4 AC-7 inserts to become “3 attempts / 15 minutes.”
  That would be inferred mapping and is rejected.
- Stricter `may-use-baseline` (no auto-accept) may surprise users of the
  current authoring inliner.
- Aggregate vs child ODP UX can confuse if alt-identifiers are shown as
  primary labels.

**Unresolved (need approval or later pins)**

1. Should 07C include a human-reviewed subset of the 65 IL4
   bracket-count-matched controls as the first pin file, or ship empty?
2. For `may-use-baseline`, is explicit acceptance required (recommended)
   or is displaying the FedRAMP value as default-effective acceptable?
3. May a DSPAV assertion ever appear inside `resolvedStatement` with a
   DSPAV caption, or only as a sibling block (recommended: sibling only)?
4. Should aggregate parameters be hidden entirely from the editor
   (recommended) or shown as read-only groupings?
5. Follow-on OSCAL export timing after 07C.

---

## 21. Direct answers A–I

| | Answer |
| --- | --- |
| **A** | Persist OSCAL-compatible `values: string[]`, plus a `selection` form (`howMany` + `selectedChoiceKeys` + nested bodies) when the catalog param has `select`. No integer/duration/date/enum types. |
| **B** | Catalog identity, framework resolutions, overlay summaries, and pin mappings are immutable reference data. Project records, notes, DSPAV assertions, deviations, and conflict proceedings are project data. |
| **C** | No override of framework-authoritative values. Document a deviation; effective requirement keeps the framework value. |
| **D** | `intent: "dspav-assertion"` + strings + source note. Status stays `authoritative-value-required`. |
| **E** | Authors document a proceeding; the conflict stays visible. |
| **F** | Per-insert substitution; unresolved placeholders remain; control is not wholesale “resolved.” |
| **G** | Yes. Schema v3 with `parameterRecords`. In-memory migrate; no SQL migration. |
| **H** | Defer responsibility/origination. |
| **I** | Defer NIST OSCAL `set-parameters` to a follow-on. |

---

## 22. Implementation non-goals (reconfirmed)

SSP template redesign, PDF, diagrams, official packages, CMMC/IL4 OSCAL,
assessment scoring, AI/narrative inference, and application-level ODP
datatypes remain out of scope.
