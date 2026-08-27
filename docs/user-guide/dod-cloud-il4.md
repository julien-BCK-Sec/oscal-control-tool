---
title: DoD Cloud Impact Level 4
summary: What DoD Cloud Impact Level 4 means in Control Freak, how the 345-item overlay is presented, and what selecting it does and does not mean.
section: frameworks
order: 15
related: frameworks, oscal-export, authoring-controls, evidence-coverage, limitations
---

This page describes how Control Freak implements **DoD Cloud Impact Level 4**.
It is product documentation, not DoD, FedRAMP, DISA, authorizing official,
Provisional Authorization, or assessor guidance. Use the pinned
authoritative sources for program requirements.

## What DoD Cloud Impact Level 4 is in Control Freak

In Control Freak, DoD Cloud Impact Level 4 is a single, read-only
framework built from stacked source layers:

NIST SP 800-53 Rev. 5
        ↓
FedRAMP Rev. 5 Moderate
        ↓
DoD IL4 overlay
        ↓
Control Freak IL4 framework

That is not “NIST Moderate plus extra controls.” The IL4 framework
includes:

- the FedRAMP Moderate population
- FedRAMP parameter assignments and additional guidance
- DoD-added NIST controls and enhancements
- DoD parameter assignments
- DoD supplemental requirements
- DoD General Readiness Requirements
- applicability metadata
- source and provenance metadata

NIST normative statements remain the NIST catalog text. Control Freak
does not rewrite NIST controls as DoD-authored prose. FedRAMP and DoD
overlay material is shown beside that statement, as separate layers.

The durable framework identity is `dod-cloud-il4-rev5`. The create-form
label is **DoD Cloud Impact Level 4**, grouped under **DoD Cloud**.

> **Limitation:** Selecting DoD Cloud Impact Level 4 is a documentation
> choice. It is not FedRAMP authorization, DoD authorization, Provisional
> Authorization, an Authority to Operate, certification, a successful
> assessment, audit readiness, or a compliance determination.

## How to create an IL4 project

From the projects list, select **New project**, name it, and choose
**DoD Cloud → Impact Level 4**. Organization administrators and project
managers can create projects. NIST SP 800-53 Rev. 5 Moderate remains the
default for new projects.

The framework cannot be changed after the project is created. See
[Create and manage projects](/help/projects) and
[Choose and understand frameworks](/help/frameworks).

## Why the framework has 345 items

The IL4 framework population is 345 items:

- **323** FedRAMP Moderate NIST items
- **12** additional DoD-selected NIST items (2 base controls and 10
  control enhancements)
- **10** DoD General Readiness Requirements
- **345** total framework items

The two DoD-added base controls, relative to FedRAMP Moderate, include
SC-24 and SC-46. General Readiness Requirements are **not** NIST
controls.

## General Readiness Requirements

A **General Readiness Requirement** (GRR) is a first-class framework
item in the IL4 population. GRRs live in the **DoD General Readiness
Requirements** family, use identifiers such as `GRR-1`, and are not
nested as NIST enhancements.

You can write an implementation narrative, link Evidence, move the item
through review, discuss it, assign owners or reviewers, and apply
workflow automation — the same machinery as other framework items.

GRRs are still not an assessment result, authorization decision, or
DoD readiness determination. Control Freak records documentation against
them.

## How NIST, FedRAMP, and DoD layers appear

On an IL4 item, the Control Browser keeps source layers distinct. When
FedRAMP or DoD assignments are known, authoritative, and non-conflicting,
Control Freak may present a derived **Effective requirement** with those
values inserted inline for authoring convenience. That rendering is not
saved, does not rewrite the NIST catalog statement, and is not an OSCAL
`set-parameter`.

- **Effective requirement** — shown when substitution is deterministic.
  Known FedRAMP or DoD assignments appear inline. Remaining
  organization-defined parameters use their NIST catalog descriptions,
  not technical placeholders. A compact source label (for example,
  “Source: FedRAMP Moderate”) remains visible.
- **Source statement** — the untouched NIST catalog statement,
  available on demand and collapsed by default. Control Freak does not
  treat this as obsolete.
- **FedRAMP Moderate / DoD IL4** — additional guidance, supplemental
  requirements, unresolved assignments, source conflicts, and
  applicability notes that cannot safely be composed into the effective
  requirement.

Empty layers are omitted. Assignment values already shown inline are not
repeated as a separate card. Overlay material is never merged into the
stored NIST statement and is never saved onto the item's operational
fields.

For example, **AC-2** shows the quarterly privileged / annual
non-privileged review assignment in the effective requirement, while the
source statement keeps the original catalog wording. **SC-17** still shows
a DoD supplemental requirement separately without rewriting the NIST
statement.

Control Freak does **not** synthesize an effective requirement when
sources conflict or an authoritative assignment is unavailable. It also
does not guess unresolved DoD assignment values.

## Parameter assignments

NIST organization-defined parameters may be resolved by an authoritative
FedRAMP or DoD assignment when that value is present in the pinned
source material. When that value is known and non-conflicting, it may
appear inline in the **Effective requirement**, with provenance still
visible. Unresolved ordinary organization-defined parameters appear as
human-readable descriptions. Conflicting or unavailable authoritative
values stay in the overlay layers; Control Freak does not guess them.

They do not replace the stored NIST statement. They do not become an
OSCAL `set-parameter` on export, because IL4 has no OSCAL export in
Control Freak today.

## DoD assignment required

Some DoD parameters are known to require a **DoD Specific Assignment
Value (DSPAV)** from restricted source material that Control Freak
cannot read.

When that happens, Control Freak shows **DoD assignment required**. It
knows an authoritative assignment is required. It does **not** guess
the current value from the public sources, from RMF Knowledge Service,
or from similar controls.

**AC-7** is a representative example: the DoD overlay assignment that
is present in the public Addendum is shown, and the unresolved DSPAV
is called out separately. Do not treat a blank or “required” notice as
a value.

## Source interpretation requires review

When FedRAMP and DoD layers disagree about the same parameter,
Control Freak shows **Source interpretation requires review**. Both
authoritative source layers remain visible for human review. Control
Freak does not choose a winner, compute an effective assignment, or
mark the item noncompliant.

**IA-5 (1)** is the representative example. The FedRAMP Moderate layer
and the DoD IL4 layer are both displayed. Documentation in Help does
not resolve that conflict.

## Conditional applicability

Some IL4 items include applicability metadata. **SC-46** remains in the
345-item population and is identified as conditionally applicable when
a **Cross Domain Solution (CDS)** is used.

Control Freak does **not** automatically mark SC-46 not applicable. If
the item is out of scope for your system, that is an authoring decision
you record — not an automatic population change.

## Evidence coverage

Evidence Coverage on an IL4 project is counted against the **345**
framework items, including General Readiness Requirements.

> **Limitation:** Evidence Coverage is not a compliance score, an
> assessment result, authorization readiness, or an ATO determination.
> It is not FedRAMP authorization, DoD authorization, Provisional
> Authorization, certification, or audit readiness.

See [Track Evidence coverage](/help/evidence-coverage).

## OSCAL export

IL4 projects do not offer **Export OSCAL SSP**. The button does not
appear.

Control Freak does not currently have an approved, pinned authoritative
OSCAL profile capable of representing the implemented DoD IL4
framework. That is a product pinning limitation, not a claim that OSCAL
cannot represent overlays.

Control Freak will not export IL4 against the NIST Moderate profile or
invent a FedRAMP or DoD OSCAL profile. See
[OSCAL export](/help/oscal-export).

## Framework identity does not change later

A project's framework is chosen at creation and stored as a durable
identity. Existing projects do not silently change frameworks when
source documents, named versions, or derived artifacts are updated.

Restoring a named version restores implementation content. It does not
switch the live project's framework. See
[Version history](/help/version-history).
