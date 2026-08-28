---
title: Product limitations
summary: A single, honest list of what's out of scope today, gathered from across the guide.
section: reference
order: 10
related: welcome, frameworks, dod-cloud-il4, oscal-export
---

Control Freak is deliberately scoped to compliance authoring and control
governance — not a broad enterprise GRC suite. This page collects the
limitations mentioned throughout the guide in one place.

> **Limitation:** Control Freak is not an assessment or certification tool.
> It does not produce MET / NOT MET determinations, SPRS scores, CMMC
> certification status, FedRAMP authorization, DoD authorization,
> Provisional Authorization, or an Authority to Operate.

## Not a compliance or assessment tool

- Control Freak does not certify, assess, or authorize anything. It does
  not produce MET / NOT MET determinations, SPRS scores, CMMC certification
  status, FedRAMP authorization, DoD authorization, Provisional
  Authorization, or an Authority to Operate.
- Evidence coverage and implementation completion are program-management
  counts about your documentation, never a compliance score. See
  [Track Evidence coverage](/help/evidence-coverage).
- A NIST SP 800-53 Moderate project is a NIST Moderate project, not a
  FedRAMP package. DoD Cloud Impact Level 4 includes FedRAMP Moderate as a
  source layer of a DoD overlay; selecting it is still not authorization.
  See [Choose and understand frameworks](/help/frameworks) and
  [DoD Cloud Impact Level 4](/help/dod-cloud-il4).

## Standards and OSCAL

- Supported frameworks are NIST SP 800-53 Rev. 5 (Low/Moderate/High),
  CMMC Level 2, and DoD Cloud Impact Level 4. Other baselines, including
  IL5, IL6, and additional CMMC levels, are not implemented.
- CMMC Level 2 and DoD Cloud Impact Level 4 projects cannot export OSCAL.
  Control Freak has no approved OSCAL profile pinned for those frameworks.
  That is not a claim that OSCAL cannot represent overlays. See
  [OSCAL export](/help/oscal-export).
- OSCAL schema validation is structural only. It does not prove semantic
  correctness, cross-reference integrity, or policy compliance.
- There is no OSCAL import. You cannot bring an existing SSP into Control
  Freak; every project is authored from scratch inside the product.

## Evidence

- Evidence is scoped to a single project — there is no organization-wide
  Evidence library shared across projects.
- There is no formal Evidence approval workflow, separate from control
  review.
- Uploaded files are not virus-scanned.
- Evidence is never exported as OSCAL.

## Collaboration

- Collaboration (discussions, assignments, notifications) applies to
  controls only — not to projects or to Evidence records.
- Notifications are in-app only. There is no email, Slack, or Microsoft
  Teams delivery.
- There is no in-app **Restore** for a deleted comment, and no in-app
  **Reassign** for an assignment — remove and recreate an assignment
  instead. See [Collaboration](/help/collaboration).
- Control Freak does not enforce a single active owner or reviewer per
  control; nothing prevents overlapping assignments.

## Workflow automation

- Rules run synchronously and do not cascade — a rule's own actions never
  trigger other rules. There is no queue, scheduler, or retry.
- Priority, severity, and tag conditions/actions are not usable yet;
  controls have no such fields in this version.

## Accounts and access

- There is no public sign-up. Every account is either invited into an
  existing organization or provisioned by an operator.
- No production email delivery is wired into every deployment by default —
  check with your administrator if you're not receiving invitation or
  verification email.
- There is no social login, SSO, passkeys, MFA, or SCIM provisioning.
- Roles apply per organization, not per project — see
  [Roles and permissions](/help/roles-and-permissions).

## Other

- There is no cross-project or global search; search is scoped to the
  current project's controls or Evidence.
- Projects can be deleted but not archived; only Evidence records have an
  archive state.
- Restoring a version does not roll back control metadata, activity
  history, discussions, assignments, or Evidence links, and never changes
  a project's framework. See [Version history](/help/version-history).
