---
title: Glossary
summary: Short definitions for terms that mean something specific inside Control Freak.
section: reference
order: 20
related: welcome, authoring-controls, evidence, dod-cloud-il4
---

- **Assignment** — a specific organization member assigned to a control as
  Owner or Reviewer, distinct from the free-text Owner field. See
  [Collaboration](/help/collaboration).
- **Control / requirement** — one item from a project's framework. NIST SP
  800-53 projects say "control"; CMMC Level 2 projects say "requirement"
  for the same kind of item. DoD Cloud Impact Level 4 uses "control" for
  NIST items and "General Readiness Requirement" for DoD GRRs.
- **DoD Cloud Impact Level 4** — the Control Freak framework derived from
  NIST SP 800-53 Rev. 5, FedRAMP Rev. 5 Moderate, and the DoD IL4 overlay.
  Selecting it is not an authorization or assessment result. See
  [DoD Cloud Impact Level 4](/help/dod-cloud-il4).
- **DSPAV** — a DoD Specific Assignment Value. Control Freak may know that
  one is required without having the current authoritative value from
  public source material. It does not guess those values.
- **Coverage state** — one of Not required, Optional — no evidence,
  Optional — evidence present, Required — missing evidence, or
  Required — evidence present, computed per control. See
  [Track Evidence coverage](/help/evidence-coverage).
- **Evidence** — a project-scoped record (optionally with an uploaded file)
  that substantiates a control's implementation. See
  [Evidence](/help/evidence).
- **Evidence requirement** — a per-control setting (Required, Optional, or
  Not required) that determines whether missing Evidence counts as a gap.
- **Evidence Version** — one immutable uploaded file bound to an Evidence
  record; replacing a file creates a new version rather than overwriting
  the old one.
- **Framework** — the control catalog a project is documented against:
  NIST SP 800-53 Rev. 5 (Low/Moderate/High), CMMC Level 2, or DoD Cloud
  Impact Level 4. Chosen at project creation and immutable afterward.
- **General Readiness Requirement (GRR)** — a DoD overlay item in the IL4
  framework. GRRs are first-class framework items, not NIST controls.
- **Freshness** — how current an Evidence record's review due date is:
  Current, Due soon, Overdue, or No review date.
- **Implementation** — the narrative text describing how a control is
  satisfied.
- **Implementation status** — governance metadata on a control (Draft, In
  Review, Approved, Implemented, Deprecated), independent of Review status
  and Narrative status.
- **Named version** — an immutable, user-created milestone in a project's
  version history.
- **Narrative status** — whether the implementation narrative text has been
  written (Not started, In progress, Implemented, Not applicable).
- **Organization** — the tenant that owns projects and team members; roles
  are assigned per organization.
- **Project** — a single documentation effort against one framework.
- **Review status** — where a control is in the review workflow (Not
  Reviewed, Ready for Review, Under Review, Changes Requested, Approved),
  changed only through named review actions. See
  [Review workflow](/help/review-workflow).
- **Revision** — a project's save counter; increments on every save. Not
  the same as a named version.
- **Snapshot** — an automatic or recovery-triggered point-in-time capture
  of a project's implementation content, distinct from a named version.
- **SSP (System Security Plan)** — the OSCAL document Control Freak can
  export for NIST SP 800-53 projects. CMMC Level 2 and DoD Cloud Impact
  Level 4 projects do not export OSCAL.
