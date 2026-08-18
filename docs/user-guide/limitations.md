---
title: Limitations and things Control Freak intentionally does not do
summary: A single, honest list of what's out of scope today, gathered from across the guide.
section: reference
order: 10
related: welcome, frameworks, oscal-export
---

Control Freak is deliberately scoped to compliance authoring and control
governance — not a broad enterprise GRC suite. This page collects the
limitations mentioned throughout the guide in one place.

## Not a compliance or assessment tool

- Control Freak does not certify, assess, or authorize anything. It does
  not produce MET / NOT MET determinations, SPRS scores, CMMC certification
  status, or a FedRAMP authorization to operate.
- Evidence coverage and implementation completion are program-management
  counts about your documentation, never a compliance score. See
  [Evidence coverage and reporting](/help/evidence-coverage).
- There is no FedRAMP-specific policy layer, profile, or rules engine. The
  NIST SP 800-53 Moderate baseline is used for realism in places, but
  choosing it does not make a project a FedRAMP package. See
  [Frameworks and standards](/help/frameworks).

## Standards and OSCAL

- Only NIST SP 800-53 Rev. 5 (Low/Moderate/High) and CMMC Level 2 are
  supported. There is no FedRAMP-specific, DISA, or other framework support.
- CMMC Level 2 projects cannot export OSCAL — no official profile exists to
  export against. See [OSCAL export](/help/oscal-export).
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
