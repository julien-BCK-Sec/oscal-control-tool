---
title: Human-readable SSP
summary: How to export a Control Freak System Security Plan as a Word document, what it includes, and what it is not.
section: frameworks
order: 18
related: oscal-export, projects, authoring-controls, dod-cloud-il4, limitations
---

## Export human-readable SSP (Word)

On **Project details**, select **Export human-readable SSP (Word)** to download
a Control Freak System Security Plan as a `.docx` file. The file is generated
on the server from the **last saved** project, including system
characteristics, implementation narratives, documentation status, linked
Evidence titles, and the selected framework.

Unsaved editor changes are not included. Missing information appears as
placeholders such as `[Not yet documented: Authorization boundary]`. Empty
lists mean the information has not been documented, not that nothing exists.

This export is available for every currently supported project framework:
NIST SP 800-53 Rev. 5 Low, Moderate, and High; CMMC Level 2; and DoD Cloud
Impact Level 4.

## Control Freak SSP vs OSCAL SSP

Control Freak has two sibling exports:

- **Export human-readable SSP (Word)** — a Control Freak-owned working
  security document (`cf-ssp-docx` layout 1.0).
- **Export OSCAL SSP (JSON)** — a machine-readable OSCAL 1.2.2 SSP, available
  only for NIST SP 800-53 projects.

The Word file is not OSCAL rendered into Word. OSCAL is not the Control Freak
SSP domain. See [OSCAL export](/help/oscal-export).

> **Limitation:** The Control Freak SSP is not an official FedRAMP, DoD, CMMC,
> or authorization package. Framework selection is not certification,
> assessment, a Provisional Authorization, or an Authority to Operate.

## Missing data and saved state

Placeholders are generated at export time. They are not stored in the
project. Incomplete role rows remain incomplete and are not presented as
complete accountable roles.

Named-version export is not offered. The Word file always reflects the live
saved project, including live Evidence and ControlRecord owner labels.
Restoring a named version does not by itself produce a historical SSP that
matches operational Evidence from that time.

## Organization-defined parameters

Catalog organization-defined parameters remain unresolved in this document.
The source statement is preserved, insert locations are shown as
`[Unresolved ODP: …]`, and any control-level framework assignment is shown
separately with provenance. Control Freak does not substitute a control-level
assignment into every parameter, invent DSPAV values, or choose a winner for
source conflicts.

Per-parameter resolution remains later work.

## Status semantics

**Implementation documentation status** in the Word file is the authored
implementation narrative status: Not started, In progress, Implemented, or
Not applicable. It is not review approval, Evidence coverage, completion
percentage, collaboration assignment, or authorization state.

An optional **Implementation owner (documentation label)** may appear when a
ControlRecord owner label is present. That label is not an SSP system role
and not a Better Auth user.

## Evidence references

Linked draft and active Evidence records may appear as titles with type,
lifecycle status, and collection date where present. Linked Evidence records
are not independently assessed or validated merely because they are linked.
Binaries are not embedded.

## Supported document sections

The V1 Word document includes a cover, document status, table of contents,
system identification and overview, system roles, authorization boundary and
environment, information types and security categorization, interconnections,
framework item implementations, and generation metadata. Diagrams are not
included.

Word refreshes the table of contents when the document is opened. Cached
contents do not invent page numbers.
