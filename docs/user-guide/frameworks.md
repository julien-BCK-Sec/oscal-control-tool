---
title: Frameworks and standards
summary: The frameworks Control Freak supports today, how "control" and "requirement" terminology differs by framework, and what a framework choice does and does not mean.
section: frameworks
order: 10
related: oscal-export, authoring-controls, limitations
---

## Supported frameworks

Control Freak currently supports exactly four frameworks, grouped into two
families when you create a project:

- **NIST SP 800-53 Rev. 5** — Low, Moderate, or High baseline.
- **CMMC** — Level 2, which is identical to the 110 requirements across 14
  families defined in NIST SP 800-171 Revision 2 (February 2020, as
  adopted by 32 CFR Part 170).

A project has exactly one framework, chosen at creation and immutable
afterward. There is no framework-switch operation and no project that spans
multiple frameworks.

## "Control" vs. "requirement"

NIST SP 800-53 projects use the word **control**; CMMC Level 2 projects use
the word **requirement** for the exact same kind of item, and every screen
that lists, searches, or counts them (the Controls/Requirements tab, Evidence
coverage copy, project cards, validation messages) follows suit
automatically based on the project's framework. There is no functional
difference between the two — it's the same workflow with framework-accurate
labeling.

CMMC requirement identifiers also look different from NIST control
identifiers. A NIST control like `ac-2` displays as `AC-2`, and an
enhancement like `ac-2.1` displays as `AC-2 (1)`, nested under its parent
in the control tree. A CMMC requirement displays as its full CMMC
identification number, for example `AC.L2-3.1.1`, and always appears as a
flat item within its family — CMMC requirements are not nested the way NIST
enhancements are. The control editor also shows the original NIST SP
800-171 numbering (for example `3.1.1`) alongside the CMMC identifier, and
you can search by either form.

## What a framework choice does not mean

Selecting a framework in Control Freak is a documentation choice, not a
certification, assessment, or authorization decision:

> **Note:** Control Freak does not claim FedRAMP authorization, CMMC
> certification, C3PAO assessment, MET / NOT MET determinations, or SPRS
> scoring for any project, regardless of which framework it uses.

The NIST SP 800-53 Rev. 5 Moderate baseline is the closest built-in analog
to a FedRAMP Moderate package, and Control Freak's demo content uses it that
way for realism — but there is no FedRAMP-specific policy layer, profile, or
feature in the product. A project using the Moderate baseline is a NIST SP
800-53 Moderate project, nothing more, unless your organization's own
authorization process says otherwise outside the tool.

For CMMC Level 2 projects specifically, Evidence coverage and implementation
completion are program-management facts about your documentation — never a
CMMC assessment result, a MET / NOT MET determination, an SPRS score, or a
certification status. See [Evidence coverage and reporting](/help/evidence-coverage).

## Where the framework content comes from

NIST SP 800-53 Rev. 5 control text and baselines are derived from pinned,
official NIST OSCAL profiles and catalog content. CMMC Level 2 requirement
text is derived from the pinned NIST SP 800-171 Revision 2 security
requirements, with the official NIST publication as the normative source.
Control Freak does not fetch standards content over the network at runtime
and does not substitute a different revision — framework content is
read-only reference data, never something you or your organization edits.
