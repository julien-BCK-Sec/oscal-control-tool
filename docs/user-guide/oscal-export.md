---
title: OSCAL export
summary: How to export a System Security Plan, why some frameworks don't offer it, and what schema validation does and doesn't prove.
section: frameworks
order: 20
related: frameworks, dod-cloud-il4, limitations
---

## Exporting an SSP

On a NIST SP 800-53 project's **Project details** tab, select
**Export OSCAL SSP** to download a single OSCAL 1.2.2 System Security Plan
as a JSON file. It's built from the project's system name and description,
its imported baseline profile, and one implemented-requirement entry per
control with your narrative and, where mappable, an implementation status.

## CMMC projects don't have this button

CMMC Level 2 projects do not offer OSCAL export at all — the button doesn't
appear. This isn't a missing feature so much as an accurate limitation: no
official CMMC or NIST SP 800-171 Revision 2 OSCAL profile exists to export
against, and Control Freak will not invent or substitute one. The Project
details and Overview tabs explain this directly:

> **Limitation:** OSCAL SSP export is available for NIST SP 800-53
> projects. No official CMMC / SP 800-171 Rev. 2 OSCAL profile is pinned.

## DoD Cloud IL4 projects do not have this button

DoD Cloud Impact Level 4 projects also do not offer OSCAL export. Control
Freak does not currently have an approved, pinned authoritative OSCAL
profile capable of representing the implemented IL4 framework. That is
not a claim that OSCAL cannot represent overlays.

Control Freak will not export IL4 against the NIST Moderate profile or
invent a FedRAMP or DoD OSCAL profile. See
[DoD Cloud Impact Level 4](/help/dod-cloud-il4).

> **Limitation:** OSCAL SSP export is available for NIST SP 800-53
> projects. Control Freak has no approved OSCAL profile pinned for DoD
> Cloud Impact Level 4.

## What "valid" means here

The Overview tab's **Run OSCAL validation** button (also NIST-only) checks
the assembled SSP against the pinned official OSCAL SSP JSON schema.

> **Limitation:** This is **structural validation only** — it confirms the
> document is well-formed OSCAL, not that it is semantically complete or
> policy-compliant. It does not check cross-references between parts of the
> document, confirm that every control identifier maps to something
> meaningful outside the document, or evaluate your implementation against
> FedRAMP or any other policy layer.

Treat "OSCAL SSP valid" as "this file is structurally sound OSCAL," not as
"this system is compliant" or "this SSP is complete."

## No OSCAL import

Control Freak can export an SSP; it cannot import one. There is no way to
upload an existing OSCAL SSP and have Control Freak turn it into a project.
Every project starts from a blank framework baseline and is authored inside
the product.
