# 06B — IL4 Tailoring Semantics Audit

Research/architecture-validation deliverable. No implementation code was
changed to produce this document. Scope: verify whether the Milestone 06A
(`dod-cloud-il4-rev5`) derivation correctly distinguishes NIST control
population, FedRAMP Moderate baseline membership/tailoring, and DoD
IL4-specific tailoring, or whether it silently treats "DoD did not override"
as "use the FedRAMP value" without authoritative support.

Status: complete. Architecture verdict: **B — needs correction**, narrowly
scoped (see Phase 5). Population/membership layer: **A — correct**.

---

## 0. Method and source access note

Per user authorization during this audit, live network access to **official
DoD/DISA domains only** was used to resolve one specific gap: the repo's
pinned extracts (`vendor/dod/cloud-il4-rev5/extracts/*.json`) carry
per-control values but no methodology/glossary text, so the semantic
question in Phase 2 could not be answered from committed material alone.

Retrieved and hash-verified against the values already recorded in
`vendor/dod/cloud-il4-rev5/SOURCES.md` (i.e. this is the same pinned
artifact WP2 already committed to, fetched fresh for text extraction only —
not a new/different source):

| Artifact | URL | SHA-256 (fetched) | Matches pinned? |
| --- | --- | --- | --- |
| Cloud Computing Y26M06 SRG zip | `dl.dod.cyber.mil/wp-content/uploads/stigs/zip/U_Cloud_Computing_Y26M06_SRG.zip` | `9470b9caadd3ff44b90e608c524012fa719c9b3541b3f0bb027b38b5b9e67971` | Yes, exact match |
| `U_Cloud_Service_Provider_V1R7_SRG.pdf` (inside zip) | n/a (extracted) | `fcb472f563283f293e224fcf72987584deb6019482a264a6536c2d5c1a5df51f` | Yes, exact match |

Also fetched (official `dl.dod.cyber.mil` domain, not previously pinned by
this project — used only for the DoD-process "leverage" terminology
question in §2.5, not for any control/parameter fact):

- DISA Cloud Assessment Division, *DoD Cloud Authorization Process*
  (June 2024), `dl.dod.cyber.mil/wp-content/uploads/cloud/pdf/unclass-dod_cloud_authorization_process.pdf`.

**Blocked source:** the DoD Rev 5 SSP Addendum Controls v1.2 workbook itself
(the source of the "Leveraged from FedRAMP Moderate" column) has no stable
public URL — it lives behind a Salesforce/LWC Communities login at
`public.cyber.mil/dccs/dccs-documents/` — and was not accessible. No
column-level glossary or instructions text for that workbook could be
retrieved from any official source. This is reported as a blocked source,
not inferred. See §2.4.

No blog, consultant, or 3PAO material was used to establish any semantic
conclusion in this document. General web search was used only to locate
official-domain URLs, never as an authority for a claim.

---

## 1. Phase 2 — Authoritative source findings

### 2.1 The FedRAMP+ methodology (direct authoritative definition)

CSP SRG V1R7, 30 June 2026, §3.5 "FedRAMP+" (p.8):

> "FedRAMP+ is the concept of leveraging the work done as part of the
> FedRAMP assessment and adding specific security controls with adjusted
> parameter values or adjusting baseline parameter values necessary to meet
> and ensure DoW's critical mission requirements. ... Refer to Appendix D:
> FedRAMP+ Security Controls and Parameter Values."

§5.1.1 "DoW FedRAMP+ Security Controls" (p.28):

> "DoW FedRAMP+ refers to a tailored baseline of security controls developed
> for each DoW information Impact Level. These baselines include the
> FedRAMP Moderate or High baselines and therefore apply only to Impact
> levels 4/5/6. The FedRAMP+ security controls include NIST 800-53 Rev 5
> security controls, parameter values, and enhancements not included in the
> FedRAMP baselines."

§5.1.2 "Parameter Values for Security Controls and Enhancements" (p.28):

> "Both FedRAMP and the DoW have defined minimum requirements in security
> controls and enhancement parameters. ... For controls required by
> FedRAMP and the DoW, the parameter values are defined in Appendix D."

Appendix D preamble (p.114, immediately before Table D-1):

> "DoW/FedRAMP predefined and CSP-defined parameter values assessed for
> DoW PA award are inherited by the Mission Owners' systems/applications.
> If the Mission Owner needs alternate values for these inherited values,
> they must be negotiated with the CSP and reflect the change in their
> SLA/contract.
>
> In addition to parameter values required for the implementation of
> FedRAMP+ security controls, **Table D-1 contains security controls where
> the value is nonexistent or requires adjustment. The controls listed
> that are part of the FedRAMP baseline must use the value listed in the
> table.**"

**Reading of this text.** Table D-1 is explicitly framed as a *delta* list
("FedRAMP+ Additions/Adjustments to Parameter Values") — DoD lists only the
controls where it adds or adjusts a value. The base architecture the SRG
itself describes is: FedRAMP Moderate parameter values apply, and DoD's
Table D-1 supersedes them where DoD chose to list an entry. This is direct,
non-inferred authoritative support for the *general* principle "FedRAMP
Moderate is the base, Table D-1 is the DoD overlay of adjustments" — i.e.
the Option B (base + overlay) architecture approved in ADR-029 is textually
correct at the methodology level.

**What this text does NOT say.** It does not say anything about the
specific SSP Addendum workbook column "Leveraged from FedRAMP Moderate"
(that column belongs to a different document — see §2.4). It also does not
state a literal rule of the form "if DoD is silent, use the FedRAMP
value" as a general-purpose fallback instruction — that behavior is an
*implication* of Table D-1 being a delta list, not a quoted rule. The
distinction matters for the verdict in Phase 5: the architecture's
direction (base + delta) is authoritatively supported; the code's specific
*mechanism* for detecting "did DoD adjust this control" (an empty Addendum
cell) is not itself validated by this text, because the code does not
consult Table D-1 membership at all — see §2.3.

### 2.2 Table D-1 (verbatim, IL4-applicable rows, from the pinned V1R7 PDF)

| Control | Table D-1 parameter value | Impact Level |
| --- | --- | --- |
| AC-7 | "For privileged users, DoW requires an account lock after three unsuccessful attempts for Impact Levels 2/4/5 and after five unsuccessful attempts for accounts using a SIPR token. All levels must be configured to require an administrator unlock the account. For nonprivileged users, if rate limiting, DoW will allow 10 attempts with the account automatically unlocked after 30 minutes. If rate limiting is not used, normal DSPAV will be required." | IL4,5,6 |
| AU-5(1) | "CSP/CSO may use FedRAMP value." | IL4,5,6 |
| CM-7(5) | "DSPAV must be used." | IL4,5,6 |
| IA-5(1) | "DSPAV must be used." | IL4,5,6 |
| PE-15 | "DSPAV must be used." | IL4,5,6 |
| PS-3(4) | "All information systems. Users: U.S. citizens... Administrators: U.S. citizens..." | IL4,5,6 |
| MA-5(1) | "DSPAV must be used." | IL4 |
| MA-5(5) | (blank — listed for inclusion only) | IL4,5,6 |
| MA-6 | "CSP/CSO may use FedRAMP value." | IL4,5,6 |
| PS-4 | "CSP/CSO may use FedRAMP value." | IL4,5,6 |
| SA-4(5) | "DSPAV must be used." | IL4,5,6 |
| SA-9(1) | "DSPAV must be used." | IL4,5,6 |
| SA-9(3) | "DSPAV must be used." | IL4,5,6 |
| SA-9(5) | "SA-9(5)-1 [...]. SA-9(5)-2 [U.S./U.S. Territories...]. SA-9(5)-3 [all data, systems, or services]." | IL4,5,6 |
| SA-9(6)/(7)/(8) | (blank — listed for inclusion only) | IL4,5,6 |
| SC-12(6) | (blank — listed for inclusion only) | IL4,5,6 |
| SC-17 | "DODI 8520.02, Public Key Infrastructure (PKI) and Public Key Enabling (PKE)." | IL4,5,6 |
| SC-18 | (blank — listed for inclusion only) | IL4,5,6 |
| SC-18(2) | "DSPAV must be used." | IL4,5,6 |
| SC-24 | "DSPAV must be used." | IL4,5,6 |
| SC-46 | "DSPAV must be used." | **If CDS is used** |

Only **21 controls** are listed in Table D-1 as IL4-applicable, out of the
345-item IL4 population. Every one of them is either a FedRAMP-Moderate
member or one of the 12 `DOD_ADDED_NIST_*_IDS`. This is a clean,
independent cross-check against `DOD_ADDED_NIST_BASE_IDS` /
`DOD_ADDED_NIST_ENHANCEMENT_IDS` in `identities.ts`: all 12 DoD-added IDs
(`sc-24`, `sc-46`, `au-5.1`, `ma-5.5`, `ps-3.4`, `sa-4.5`, `sa-9.3`,
`sa-9.6`, `sa-9.7`, `sa-9.8`, `sc-12.6`, `sc-18.2`) appear in Table D-1.
The population/membership layer is corroborated by this independent
primary source. **No membership problem found.**

SC-46's "If CDS is used" applicability (rather than "IL4,5,6") is the
authoritative source for the code's `applicability.kind: "conditional"` —
confirmed correct, not a Control Freak invention.

### 2.3 The central Phase 2 question — answer

> Does DoD explicitly establish that, for a row marked "Leveraged from
> FedRAMP Moderate = Yes," the applicable FedRAMP-defined parameter
> assignments remain authoritative unless the DoD Addendum supplies a
> different value?

**Partially supported, but not as literally asked, and not through the
mechanism the code uses.**

- The CSP SRG (§2.1 above) *does* authoritatively establish the general
  architectural principle: Table D-1 is a delta list; FedRAMP values stand
  except where Table D-1 lists an adjustment. This supports ADR-029's
  base+overlay model as a matter of DoD-published methodology.
- The CSP SRG does **not** mention the SSP Addendum workbook, its
  "Leveraged from FedRAMP Moderate" column, or any per-row leverage flag at
  all. That column is a workbook-specific artifact of a different document
  (the SSP Addendum, not the CSP SRG), and its precise semantics — which of
  categories (a)–(e) in the audit brief it signals — could not be verified
  because the workbook itself is inaccessible (§2.4).
- Critically, **the derivation code does not implement "Table D-1 lists an
  adjustment, else inherit FedRAMP."** It implements "the Addendum's
  `dodFedrampPlusParameters` cell (column K) is non-empty, else inherit
  FedRAMP" (`derive.ts` branch order, described in the Phase 1 report).
  Empirically, for the current 345-row Addendum, "column K non-empty"
  and "listed in the CSP SRG's Table D-1" are the same 21 controls (cross-
  checked in §2.2) — so the *outcome* is currently equivalent to applying
  the authoritative Table D-1 rule. But the code never asserts this
  equivalence; it is not derived from Table D-1 at all, and nothing fails
  closed if a future Addendum revision adds column-K text for a control
  that Table D-1 does not list (or vice versa).

**Conclusion for this specific question: classify as
`fedramp-explicitly-inherited` only for the 3 controls where DoD's own
Table D-1 text literally says "CSP/CSO may use FedRAMP value"
(AU-5(1), MA-6, PS-4). For the other 132 controls where the code inherits
FedRAMP silently, the correct classification is a distinct, weaker category
— see §4 — because the authoritative support is structural/indirect (Table
D-1 is a delta list) rather than an explicit per-control statement, and the
code's mechanism for detecting "no DoD delta" is not tied to Table D-1
membership.**

### 2.4 "Leveraged from FedRAMP Moderate" — blocked source, not inferred

Per the audit brief, categories (a)–(e) were not to be conflated:

- (a) FedRAMP implementation reusable
- (b) FedRAMP control selection inherited
- (c) FedRAMP ODP assignment inherited
- (d) FedRAMP additional guidance inherited
- (e) some combination

**Finding: none of (a)–(e) can be confirmed from any accessible authoritative
source.** The SSP Addendum workbook (source of this column) is not publicly
retrievable — no stable URL, served from a Salesforce/LWC Communities
library at `public.cyber.mil/dccs/dccs-documents/` that requires
authenticated access this session does not have. The CSP SRG, which is
accessible and was fully text-extracted, never uses the phrase "leveraged
from FedRAMP Moderate" or otherwise defines a comparable per-control flag.

What *is* independently verifiable, from the DISA *DoD Cloud Authorization
Process* briefing (June 2024, official `dl.dod.cyber.mil` domain): DoD's
general use of the word "leverage" in this program is about **authorization
package / assessment-artifact reuse** — "leverages a CSO's FedRAMP JAB
P-ATO," "leveraged for enterprise/Mission Owner use," "maximize the reuse of
existing body of evidence by leveraging existing security package" — i.e.
category (e)-adjacent, closer to (a) than to (c). This is process-level
usage, for a different document, about a different unit of analysis (whole
CSO authorization, not a single control's parameter value) — it cannot be
read across to confirm what the Addendum spreadsheet's per-row flag means,
and this audit does not attempt to.

**Reported per instruction: this specific question is unsupported/unresolved
from available material.** The empirical finding that stands is narrower and
weaker than "leveraged means parameter inheritance": in the current 345-row
dataset, `leveragedFromFedrampModerate = "Yes"` and "Addendum column K is
empty while a FedRAMP assignment exists" happen to coincide on all 133 rows
where either condition holds (verified by direct comparison against the raw
extract, not sampling). That is a data correlation, not a confirmed
semantic definition, and the current code does not even use this flag to
gate its behavior (see Phase 1 finding — the flag is carried into
`selectionProvenance` as inert metadata only).

### 2.5 AU-5(1) provenance anomaly — investigated, not just a labeling bug

Per instruction 5, this was investigated for whether it's isolated labeling
or a broader modeling problem.

**Finding: it is a genuine anomaly in the authoritative source, and the
code's handling of it compounds rather than surfaces the anomaly.**

- `au-5.1` is **not** part of the pinned FedRAMP Moderate baseline (the real
  323-row `FedRAMP_Security_Controls_Baseline.xlsx` has no AU-5(1) row —
  confirmed via `selectionProvenance.inFedrampModerate: false` in the
  generated artifact, and via the fact that FedRAMP's own baseline count
  validation in `derive.ts` would fail if AU-5(1) were miscounted).
- Yet Table D-1 (the authoritative CSP SRG, §2.2 above) lists **AU-5(1):
  "CSP/CSO may use FedRAMP value"** — instructing CSPs to use "the FedRAMP
  value" for a control that has no FedRAMP Moderate baseline value to use.
  This is DoD's own source material assuming a FedRAMP value exists where,
  for the pinned FedRAMP Moderate baseline, it does not. (It plausibly
  exists in FedRAMP's *High* baseline or a FedRAMP optional/additional
  control set outside what Control Freak has pinned — this audit did not
  chase that further since it is out of scope for IL4 Moderate/MMx and
  would require pinning a new source; flagged as a limitation.)
  Both the Addendum extract's own column I ("AU-5(1)-3 [75%, or one month
  before expected negative impact]") and Table D-1 assume this "FedRAMP
  value" is well-defined, without saying where it actually comes from if
  not the pinned Moderate baseline.
- Control Freak's `classifyParameters` (branch `mayUseFedramp`, `derive.ts`
  lines 122–125) hardcodes `effectiveAssignmentSource = FEDRAMP_SOURCE`
  ("fedramp-moderate-baseline") whenever the "may use FedRAMP value" text
  is seen, **regardless of whether a real FedRAMP Moderate baseline row
  backs the value it's echoing.** For AU-5(1), the text it echoes
  (`"AU-5(1)-3 [75%, or one month before expected negative impact]"`) is
  sourced from `addendumRow.fedrampAssignment` (the Addendum's own copy,
  since `fedrampById.get("au-5.1")` is `undefined`) — correctly labeled as
  `ADDENDUM_SOURCE` in the `parameters.fedrampAssignment` field itself — but
  then the `effectiveAssignmentSource` overwrites that with the hardcoded
  `FEDRAMP_SOURCE` string. The UI presentation layer
  (`overlayPresentation.ts`) then displays this as `"FedRAMP Moderate"` via
  `SOURCE_LABELS["fedramp-moderate-baseline"]`, which is a **factually
  incorrect provenance claim** shown to an authoring user: it says this
  value is FedRAMP Moderate baseline text when it is DoD's Addendum-carried
  reference figure for a control FedRAMP Moderate doesn't select.
- Scope of the bug: this exact pattern (`mayUseFedramp` branch +
  `fedrampRow` undefined) only occurs for `AU-5(1)` among the 345 items —
  `MA-6` and `PS-4` also hit the `mayUseFedramp` branch but both *do* have
  real FedRAMP Moderate baseline rows, so their `FEDRAMP_SOURCE` label is
  accurate. **This is a narrow, single-control provenance bug, not a
  systemic pattern across the dataset** — but it reveals a structural gap:
  nothing in `classifyParameters` ties `effectiveAssignmentSource` to
  whether `fedrampRow` (the real baseline) is actually present, for this
  branch specifically. The same class of bug would recur for any future
  Addendum revision that adds a new "may use FedRAMP value" row for a
  control outside FedRAMP Moderate's selection.

---

## 2. Phase 3 — Representative control matrix

Provenance keys: **NIST-catalog** = pinned NIST SP 800-53 Rev.5 OSCAL catalog.
**FedRAMP-real** = pinned `FedRAMP_Security_Controls_Baseline.xlsx` row.
**FedRAMP-echo** = Addendum workbook's own copy of a FedRAMP-labeled cell
(columns I/J), used only when no real FedRAMP row exists. **DoD-Addendum** =
Addendum workbook column K. **CSP-SRG-D-1** = CSP SRG Table D-1 (cross-check
only, not the derivation input).

### AC-1 — Policy and Procedures

| Field | Value |
| --- | --- |
| NIST ODPs | 9 ODPs: personnel/roles (x2), policy level selection, official, review frequency/events (x4) |
| FedRAMP assignment | `AC-1(c)(1) [at least every 3 years] / AC-1(c)(2) [at least annually][significant changes]` — **FedRAMP-real** |
| DoD assignment | none (column K empty) |
| DSPAV | not indicated in Table D-1 (AC-1 absent from the table) |
| Addendum `leveraged` flag | Yes |
| CF effective behavior | effective = FedRAMP text; `dspavStatus: not-indicated`; `effectiveAssignmentSource: fedramp-moderate-baseline` |
| Authoritative IL4 behavior | AC-1 not in Table D-1 → no DoD adjustment exists → FedRAMP value structurally stands per §2.1's delta-list reading |
| Provenance | FedRAMP-real (verified: `AC-1` present in the pinned baseline, 323-count validated) |
| Confidence | High for the value being correct; Medium for the *mechanism* (see §2.3 — code doesn't check Table D-1 membership) |
| Discrepancy | None in output. Architectural: silent fallback, unverified against Table D-1 or against the `leveraged` flag's real meaning. |

### AC-2 — Account Management

Same shape as AC-1: FedRAMP-real assignment present (24hr/8hr/8hr notification
windows, quarterly/annual review), column K empty, `leveraged = Yes`, Table D-1
does not list AC-2. Same conclusion: output value likely correct, mechanism
unverified. No discrepancy in value; architectural risk identical to AC-1.

### AC-7 — Unsuccessful Logon Attempts

| Field | Value |
| --- | --- |
| FedRAMP assignment | none; FedRAMP additional guidance only: "In alignment with NIST SP 800-63B" |
| DoD assignment | full text, matches CSP-SRG-D-1 verbatim (three attempts/administrator unlock for privileged; 10 attempts/30-min unlock for nonprivileged if rate limiting; else normal DSPAV required) |
| DSPAV | conditional — resolved value given, but with an embedded fallback-to-DSPAV clause |
| Addendum `leveraged` flag | No |
| CF effective behavior | `dspavStatus: authoritative-value-required`; effective = DoD text (with conditionality note preserved) |
| Authoritative IL4 behavior | Matches Table D-1 verbatim |
| Provenance | DoD-Addendum, cross-checked identical against CSP-SRG-D-1 |
| Confidence | High |
| Discrepancy | None |

### IA-5(1) — Password-based Authentication

| Field | Value |
| --- | --- |
| FedRAMP assignment | none; additional guidance present (NIST 800-63B compliance, 14-char minimum for non-MFA fallback, crypto requirements) |
| DoD assignment | numeric value present in Addendum column K (quarterly list update; 15-char/mixed-class/50%-change/24hr-min/60day-max password rules) |
| DSPAV | CSP-SRG-D-1 says "DSPAV must be used" (generic pointer, no number) — the Addendum has a number the SRG's own table doesn't carry |
| Addendum `leveraged` flag | No |
| CF effective behavior | `dspavStatus: source-conflict`; `interpretationConflict: true`; no effective value computed; UI shows non-dismissible notice |
| Authoritative IL4 behavior | Ambiguous by design in the source material: FedRAMP guidance and DoD's Addendum value both facially apply and neither authoritative document states which wins for a CSP not consulting the CAC-gated RMF KS DSPAV table |
| Provenance | Both FedRAMP-real (guidance) and DoD-Addendum (value), genuinely conflicting on the record |
| Confidence | High that "no winner" is the correct behavior |
| Discrepancy | None — this is the one control where the implementation's conservatism is fully validated by the source ambiguity itself |

### SA-9(5) — External System Services: Processing, Storage, and Service Location

| Field | Value |
| --- | --- |
| FedRAMP assignment | `SA-9(5)-1 [information processing, information or data, AND system services]` — FedRAMP-real |
| DoD assignment | Same SA-9(5)-1 text, plus two additional DoD-only sub-assignments (SA-9(5)-2 U.S. jurisdiction restriction; SA-9(5)-3 "all data, systems, or services") |
| DSPAV | none required; concrete value given |
| Addendum `leveraged` flag | No |
| CF effective behavior | effective = full DoD text (superset of FedRAMP's); `dspavStatus: not-indicated` |
| Authoritative IL4 behavior | Matches Table D-1 verbatim |
| Provenance | DoD-Addendum, cross-checked identical against CSP-SRG-D-1 |
| Confidence | High |
| Discrepancy | None |

### SC-17 — Public Key Infrastructure Certificates

| Field | Value |
| --- | --- |
| FedRAMP assignment | none |
| DoD assignment | "DODI 8520.02, Public Key Infrastructure (PKI) and Public Key Enabling (PKE)." — policy pointer, not an ODP fill-in value |
| DSPAV | none |
| Addendum `leveraged` flag | No |
| CF effective behavior | Routed to `dodSupplements` (hardcoded `SUPPLEMENT_IDS`), not to `effectiveAssignmentText`; correctly excluded from inline substitution since it isn't a parameter value |
| Authoritative IL4 behavior | Matches Table D-1 verbatim; correctly modeled as supplemental implementation guidance, not a parameter |
| Provenance | DoD-Addendum, cross-checked identical against CSP-SRG-D-1 |
| Confidence | High |
| Discrepancy | None |

### SC-46 — Cross Domain Policy Enforcement

| Field | Value |
| --- | --- |
| Selection provenance | Not in NIST Moderate, not in FedRAMP Moderate — pure DoD addition |
| DoD assignment | "Implement a policy enforcement mechanism [Selection: physically; logically]..." |
| DSPAV | CSP-SRG-D-1: "DSPAV must be used"; Addendum has since resolved it with the selection text above |
| Applicability | CSP-SRG-D-1: **"If CDS is used"** (not IL4,5,6 blanket) — authoritative source for the conditional flag |
| CF effective behavior | `dspavStatus: satisfied-by-addendum-value`; `applicability.kind: conditional`, `condition: cds`; item stays in the 345 population |
| Authoritative IL4 behavior | Matches Table D-1 and its conditional scope verbatim |
| Provenance | DoD-Addendum, cross-checked identical against CSP-SRG-D-1 |
| Confidence | High |
| Discrepancy | None |

### No-DoD-delta examples (AC-3, SC-7, CM-6)

All three: `fedrampAssignment: null`, `dodAssignment: null`,
`dspavStatus: not-indicated`, `effectiveAssignmentText: null`. Not in Table
D-1. Not in the FedRAMP baseline's assignment/guidance columns either. These
render in the UI with unresolved bracketed NIST ODPs (e.g. "[organization-
defined access control policy]") and no overlay panel at all
(`buildOverlayPresentation` returns `null` when there's nothing to show).
Correctly modeled as pure CSP-organization-defined territory — no
discrepancy, and no architecture risk, since nothing is being silently
inherited here (there's no FedRAMP value to inherit in the first place).

---

## 3. Phase 4 — Complete classification audit

Computed programmatically over all 345 generated items
(`src/data/framework/generated/dod-cloud-il4-rev5.json`), one classification
per item's composite `parameters` block. See caveat below about
per-control vs. per-ODP granularity.

| Classification | Count | Meaning |
| --- | --- | --- |
| `fedramp-inherited-by-silence` (audit-defined; **not** `fedramp-explicitly-inherited`) | **132** | Addendum column K empty, a FedRAMP assignment exists, effective value = FedRAMP text. Empirically 100% aligned with `leveraged=Yes` and directionally consistent with the SRG's delta-list design (§2.1), but not individually confirmed by an explicit DoD statement and not gated by the code on either signal. |
| `no-assignment-any-layer` (CSP-organization-defined) | **186** | No FedRAMP assignment, no DoD assignment, not in Table D-1. Pure NIST catalog ODP, correctly left unresolved for CSP/authoring input. |
| `dod-explicit` (plain DoD value, `not-indicated` dspav) | **3** | PS-3(4), SA-9(5), SC-17 — DoD supplied a value/requirement directly, matches Table D-1. |
| `dod-explicit` (Addendum resolved a DSPAV Table D-1 only marks generic) | **6** | CM-7(5), SA-4(5), SA-9(1), SC-18(2), SC-24, SC-46 (SC-46 also conditional) — Table D-1 says "DSPAV must be used" with no number; the more current/specific Addendum has since published the actual value. Correctly modeled as `satisfied-by-addendum-value`. |
| `dod-explicit` (conditional DSPAV fallback, e.g. AC-7) | **1** | AC-7 — DoD gives a concrete value with an embedded "else normal DSPAV" clause; matches Table D-1 verbatim. |
| `fedramp-explicitly-inherited` (Table D-1 literally states "may use FedRAMP value") | **3** | AU-5(1) *(see §2.5 provenance caveat)*, MA-6, PS-4 |
| `dod-dspav-required` (blocked, no public value anywhere) | **3** | MA-5(1), PE-15, SA-9(3) — Addendum itself says "No DSPAV available, refer to control text." Correctly not guessed. |
| `source-conflict` | **1** | IA-5(1) |
| `not-applicable` (GRR — no NIST ODP concept) | **10** | GRR-1…GRR-10 |
| **Total** | **345** | |

**Answering the audit's specific count requests:**

- ODPs inheriting a FedRAMP value because authoritative DoD material
  **explicitly** permits/requires it: **3** (`fedramp-explicitly-inherited`
  — AU-5(1), MA-6, PS-4; note the AU-5(1) provenance caveat in §2.5).
- ODPs with a DoD value: **10** (1 AC-7-style + 6 Addendum-resolved-DSPAV +
  3 plain DoD-explicit = 10 controls with a concrete, source-backed DoD
  value in the effective field or in `dodSupplements`).
- ODPs requiring DSPAV (blocked, no public value): **3** (MA-5(1), PE-15,
  SA-9(3)). If AC-7's conditional fallback clause is also counted as
  "may require DSPAV," that's **4**, but AC-7 does have a resolved primary
  value, so it's kept in the `dod-explicit` bucket above.
- Remaining CSP-organization-defined: **186**.
- Conflicting/unresolved: **1** (IA-5(1), `source-conflict`).
- The 132 `fedramp-inherited-by-silence` items are reported **separately**
  from the 3 `fedramp-explicitly-inherited` items per instruction 3/6 — they
  must not be summed into one "FedRAMP inherited" count, because only the
  3 have direct authoritative backing for that specific inheritance.

**Per-control vs. per-ODP granularity gap (a modeling finding in its own
right).** The audit brief asks for a count "across every NIST
organization-defined parameter present in the IL4 framework." The current
architecture does not support that: `OverlayParameterMetadata` carries
exactly one `dspavStatus` / `effectiveAssignmentText` per *control*, not per
individual NIST ODP id. AC-1 has 9 distinct ODP ids in the catalog
(`ac-01_odp.01`…`.08` plus the legacy `ac-1_prm_1`); its single FedRAMP
assignment string only actually addresses two of them (`(c)(1)` and
`(c)(2)` review timing) — the "personnel or roles," "official," and
"events" ODPs have no FedRAMP or DoD value anywhere and remain genuinely
CSP-organization-defined, but the composite classification above (and the
UI's single "Effective requirement" block) does not distinguish "this
control has one fully-resolved ODP and eight open ones" from "this control
has one open ODP." This is out of scope to fix as part of this audit, but
it means the counts above are a control-level proxy, not a literal per-ODP
count, and should be labeled as such wherever cited.

---

## 4. Current values that appear semantically wrong

1. **AU-5(1) `effectiveAssignmentSource`** is labeled `fedramp-moderate-
   baseline` when the text it carries is not backed by any row in the
   pinned FedRAMP Moderate baseline (§2.5). This is a confirmed, narrow
   (one-control) provenance-labeling defect with a real source-level
   ambiguity behind it (DoD's own Table D-1 references a "FedRAMP value"
   that doesn't exist in the pinned Moderate baseline).
2. **No other individual effective value was found to be factually wrong**
   against the retrieved authoritative CSP SRG Table D-1 — every DoD-
   explicit, DSPAV-blocked, source-conflict, and conditional-applicability
   value cross-checked exactly against the primary source text in §2.2.
3. **The 132 `fedramp-inherited-by-silence` values are not shown to be
   wrong** — cross-checking confirms none of those 132 controls appear in
   Table D-1, which is consistent with "DoD did not adjust this control."
   But this is a *currently-empty-diff* observation, not a property the
   derivation code enforces. See Phase 5.

---

## 5. Phase 5 — Architecture verdict

Per instruction 8, these are reported as separable answers.

### 5a. Are the current output values currently correct?

**Yes, with one narrow exception.** Of 335 non-GRR items, 334 effective
values (or correctly-absent effective values, for source-conflict/DSPAV-
blocked items) match what the authoritative CSP SRG Table D-1 and the DoD
Addendum extract actually say, cross-checked directly against primary text
in this audit. AU-5(1)'s `effectiveAssignmentSource` label is wrong (§2.5,
§4.1); its `effectiveAssignmentText` value itself ("CSP/CSO may use FedRAMP
value," resolving to the Addendum's own reference figure) is not shown to
be factually wrong, only mislabeled.

### 5b. Is the derivation architecture semantically sound?

**No — needs correction, narrowly scoped.** Specifically:

- **Control population / baseline membership: sound.** The Addendum-driven
  membership model, cross-checked against Table D-1's 21 IL4 rows and the
  12 `DOD_ADDED_NIST_*_IDS`, is independently corroborated by this audit.
  No change needed here.
- **Parameter assignment resolution: unsound as a *mechanism*, even though
  currently correct as *output*.** The silent-fallback-to-FedRAMP branch
  (132 controls) is not derived from, or verified against, any explicit
  authoritative signal — not Table D-1 membership, not the Addendum's own
  `leveragedFromFedrampModerate` flag (parsed but unused for this
  purpose), not any quoted DoD rule. Its current correctness is a property
  of today's 345-row dataset, not a property the code establishes or
  would preserve under a future Addendum revision. The
  `dspavStatus: "not-indicated"` label conflates two semantically distinct
  situations (true "nothing applies here" vs. "silently defaulted to
  FedRAMP"), which also makes it impossible for a downstream consumer
  (UI, export, future SSP generation) to tell them apart.
- **Supplemental guidance: sound.** SC-17's DODI 8520.02 pointer is
  correctly modeled as `dodSupplements`, excluded from parameter
  substitution, matches Table D-1 verbatim.
- **Effective-value resolution / provenance: has one confirmed bug**
  (AU-5(1), §2.5) rooted in a structural gap — `effectiveAssignmentSource`
  is set by branch identity, not by which underlying row (`fedrampRow` vs.
  Addendum-echo) actually supplied the text.
- **Presentation:** `overlayPresentation.ts` inlines "Effective requirement"
  identically for `dod-explicit`, `dod-explicit-addendum-satisfies-dspav`,
  `fedramp-explicitly-inherited`, and `fedramp-inherited-by-silence` cases
  alike. An authoring user currently cannot tell, from the UI, "DoD said
  this explicitly" from "DoD said nothing and Control Freak defaulted to
  FedRAMP." Given ADR-029/WP4's stated goal ("Overlay UI does not... compute
  assignment winners"), the *UI* correctly doesn't compute a winner — but
  the *derivation* already has, and the UI presents that pre-computed
  winner without flagging which of these two very different justifications
  produced it.
- **OSCAL implications:** none currently, since IL4 OSCAL SSP export is
  disabled (ADR-029/WP6). But if/when that changes, exporting a
  `fedramp-inherited-by-silence` value as if it had the same authority as a
  `dod-explicit` or `fedramp-explicitly-inherited` value would misrepresent
  provenance in a generated SSP — this is a forward-looking risk worth
  recording now (see Phase 6, IL5/SSP impact).

---

## 6. Phase 6 — Correction plan (not implemented)

Smallest safe change, consistent with ADR-029's existing base+overlay model
— this refines the *inside* of the overlay's parameter classification, it
does not replace the architecture:

1. **Add a distinct `DspavStatus` value** (or an orthogonal boolean/enum
   field) separating today's overloaded `"not-indicated"` into:
   - `"no-dod-position"` (nothing in FedRAMP or DoD — the 186 CSP-org-
     defined items; unchanged behavior)
   - `"fedramp-inherited-unconfirmed"` (today's 132 silent-fallback items —
     same effective value, but tagged as *not* individually DoD-confirmed)
   Keep `"may-use-fedramp"` reserved for the 3 controls where DoD's own
   text literally says so (already correct).
2. **Gate the silent-fallback branch on an explicit, checkable signal**
   rather than pure absence. Two options, either alone or combined:
   - Consult `leveragedFromFedrampModerate` as a *necessary* (not
     sufficient) precondition for the fallback, and fail derivation closed
     (add to `problems`) if a future row has DoD silence *and*
     `leveraged !== "Yes"` with a FedRAMP value present — today that
     combination doesn't occur (verified empirically, §2.3), so this
     is a zero-behavior-change guard against silent drift, not a value
     change.
   - Additionally cross-check against a pinned Table D-1 membership set
     (the extract already exists — `appendix-d-il4-parameter-notes.json`
     — it would need a small addition: a `parameterValues`-independent
     "listed in Table D-1" boolean per control) so the derivation can
     assert "this control is correctly outside Table D-1" rather than
     inferring it from column-K emptiness alone.
3. **Fix the AU-5(1)-class provenance bug**: in the `mayUseFedramp` branch,
   set `effectiveAssignmentSource` from whichever row actually supplied
   `fedrampAssignment` (`fedrampRow ? FEDRAMP_SOURCE : ADDENDUM_SOURCE`),
   the same logic already used two lines above it for the
   `parameters.fedrampAssignment` field itself. Add a regression test
   pinned to AU-5(1) asserting `effectiveAssignmentSource !== "fedramp-
   moderate-baseline"` when `selectionProvenance.inFedrampModerate ===
   false`.
4. **Surface the distinction in presentation**: `overlayPresentation.ts`'s
   `effectiveRequirement` block should carry the new status through to a
   visible label (e.g. "FedRAMP Moderate (no DoD-specific position on
   record)" vs. "DoD IL4" vs. "FedRAMP Moderate (DoD: may use FedRAMP
   value)"), so authoring users see the actual justification rather than a
   uniform "Effective requirement" chip. This is additive UI copy, not a
   new computation.
5. **Regenerate the artifact** (`npm run derive:framework`) and update
   `derive.test.ts` to assert the new status distribution (132 /
   186 / 10 / 3 / 3 / 1 / 10 by the categories in §4) so the classification
   itself becomes a tested invariant rather than an implicit byproduct of
   branch order.
6. **Do not** change control population, GRR handling, SC-46 conditionality,
   IA-5(1) conflict handling, or the DSPAV-blocked behavior — all four are
   confirmed correct against primary source text in this audit and are out
   of scope for correction.

**Explicitly not recommended:** rewriting the model as three independent,
unlinked layers (NIST / FedRAMP / DoD) with no derived "effective" value at
all. ADR-029 and WP4 already establish that Control Freak intentionally
does compute one deterministic effective value for authoring convenience
while preserving the underlying layers — this audit found that choice
sound; the fix is to make the *classification* of how that value was
reached honest and verified, not to remove it.

---

## 7. Impact assessment

**Impact on Milestone 06A.** No population, count, or GRR change. No
change to any of the 5 controls already treated with maximum conservatism
(IA-5(1) conflict, MA-5(1)/PE-15/SA-9(3) DSPAV-blocked). One label fix
(AU-5(1)). One new status distinction threaded through derive → runtime →
presentation. All changes are additive to the existing `DspavStatus`/
`FrameworkAuthoritativeValueStatus` enums (both already have room per
`runtime.ts`'s explicit mapping function) — no schema/database change, no
change to the 345-item population, consistent with 06A's "no schema
change" and "read-only framework artifact" constraints.

**Impact on future IL5 support.** IL5's baseline is FedRAMP High plus a
different DoD overlay (WP1 already noted IL5 no longer leverages FedRAMP
Moderate at all per current-web-search context, though that specific claim
sits outside this audit's pinned sources and would need its own WP1-style
verification before an IL5 milestone). Whatever correction is made here
should be done in the shared `derive.ts`/`runtime.ts` pattern (or a shared
helper) so an IL5 derivation inherits the *fixed* classification model
rather than reintroducing the same silent-fallback ambiguity independently.

**Impact on future human-readable SSP generation.** This is the most
consequential finding for that roadmap item: an IL4 SSP generator that
narrates "effective requirement" text verbatim would currently present 132
FedRAMP-Moderate-sourced values with no visible signal that DoD never
individually confirmed them, and would mislabel AU-5(1) as FedRAMP Moderate
baseline text. Recommend the Phase 6 classification fix land *before* any
SSP-generation work begins, since SSP narrative text is exactly the
audience "does this look DoD-authored when it wasn't reviewed by DoD" risk
matters most for.

---

## 8. Files that would need modification if correction is approved

- `src/framework/dod-cloud-il4-rev5/types.ts` — extend `DspavStatus` (or
  add a parallel field) for the new distinction.
- `src/framework/dod-cloud-il4-rev5/derive.ts` — `classifyParameters`:
  gate the silent-fallback branch, fix `mayUseFedramp` provenance.
- `src/framework/dod-cloud-il4-rev5/runtime.ts` — extend
  `mapAuthoritativeValueStatus` for the new status value(s).
- `src/data/framework/types.ts` — extend
  `FrameworkAuthoritativeValueStatus` union.
- `src/data/framework/generated/dod-cloud-il4-rev5.json` — regenerated
  output (via `npm run derive:framework`, not hand-edited).
- `src/components/controlBrowser/overlayPresentation.ts` — surface the new
  status distinction in the effective-requirement label/source text.
- `src/framework/dod-cloud-il4-rev5/derive.test.ts` — new/updated
  assertions for AU-5(1) provenance and the classification distribution.
- `src/components/controlBrowser/overlayPresentation.test.ts` — presentation
  coverage for the new label.
- `vendor/dod/cloud-il4-rev5/extracts/appendix-d-il4-parameter-notes.json`
  and `parse-appendix-d.ts` — only if the Table-D-1-membership cross-check
  (Phase 6, item 2) is adopted; would need a `listedInTableD1: boolean`
  field added to the extract schema.
- `docs/decisions.md` (ADR-029 amendment, not a new ADR) — document the
  classification refinement and its authoritative basis (this document).
- `docs/current-state.md` — update the "known non-conflicting assignments"
  language to reflect the new distinction once implemented.
