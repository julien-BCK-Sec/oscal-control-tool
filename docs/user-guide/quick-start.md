---
title: Quick start: document your first control
summary: A short product workflow for creating a project, documenting a control or requirement, adding Evidence, and submitting it for review.
section: getting-started
order: 15
related: projects, authoring-controls, evidence, review-workflow, oscal-export
---

This is a product workflow for documenting how your organization implements a
framework item. It is not a certification, assessment, or authorization
procedure. NIST SP 800-53 projects call these items **controls**; CMMC Level 2
projects call them **requirements**. The steps are the same.

> **Tip:** Each step below links to the full article when you need the
> details. You do not have to read the whole guide first.

## 1. Create a project

From the projects list, select **New project**, name it, and choose a
framework. Organization administrators and project managers can create
projects. See [Create and manage projects](/help/projects).

> **Warning:** The framework cannot be changed after the project is created.

## 2. Choose a framework

Pick the catalog this project will document against:

- **NIST SP 800-53 Rev. 5** — Low, Moderate, or High. These projects call
  items **controls**, and they can export an OSCAL SSP.
- **CMMC Level 2** — the 110 NIST SP 800-171 Rev. 2 requirements. These
  projects call items **requirements**, and they cannot export OSCAL.
- **DoD Cloud Impact Level 4** — FedRAMP Rev. 5 Moderate plus the DoD IL4
  overlay (345 framework items). These projects call NIST items
  **controls** and DoD GRRs **General Readiness Requirements**, and they
  cannot export OSCAL. See
  [DoD Cloud Impact Level 4](/help/dod-cloud-il4).

Choosing a framework does not confer certification, assessment, MET / NOT
MET, an SPRS score, or FedRAMP authorization. See
[Choose and understand frameworks](/help/frameworks).

## 3. Open a control or requirement

Open the project and use the Controls tab (labeled Requirements on CMMC
projects). Search or browse by family, then select an item to open the
editor. See [Document controls and requirements](/help/authoring-controls).

## 4. Read the framework requirement

Expand the **Requirement** panel. That text is the framework's own
statement — read-only reference, not your narrative.

## 5. Write an implementation narrative

In **Narrative**, describe how your organization implements the item.

## 6. Set Narrative status

Set **Narrative status** to match the writing: Not started, In progress,
Implemented, or Not applicable. This field only tracks whether the text
has been written. It does not submit the item for review and does not
change Implementation status or Review status. See
[the three status fields](/help/authoring-controls#the-three-status-fields-in-detail).

## 7. Add or link Evidence

From the control's **Evidence** panel, link existing project Evidence or
create a new record. An Evidence record is separate from any uploaded
file; Active Evidence can satisfy coverage even with no file. Draft and
Archived records do not. See [Add and manage Evidence](/help/evidence).

## 8. Submit the control for review

When the documentation is ready, use **Submit for Review**. That moves
**Review status** from Not Reviewed to Ready for Review. Authors can
submit; they cannot approve. See [Review workflow](/help/review-workflow).

## 9. Have a Reviewer review it

A reviewer (or anyone with the matching review permission) starts the
review, then approves or requests changes. Review approval does not
rewrite Narrative status or Implementation status, and it is not a CMMC
MET / NOT MET result.

## 10. Check Overview and Evidence coverage

Overview shows implementation completion and Evidence coverage counts.
Coverage is derived from each item's Evidence requirement plus linked
Active Evidence. It is not a compliance score. See
[Track Evidence coverage](/help/evidence-coverage).

## 11. Save a named version when useful

On the Version history tab, save a named version when you want a
restorable milestone. Restore replaces implementation content only — not
control metadata, collaboration, or Evidence. See
[Version history](/help/version-history).

## 12. Export OSCAL only when the framework supports it

On NIST SP 800-53 projects, **Export OSCAL SSP** on Project details
downloads a structurally validated SSP. CMMC and DoD Cloud Impact Level 4
projects do not offer this button. Schema validation proves structure, not
policy compliance. See [OSCAL export](/help/oscal-export).
