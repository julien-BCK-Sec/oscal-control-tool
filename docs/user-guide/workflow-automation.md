---
title: Workflow automation
summary: Creating automation rules that react to project events, and reading their execution history — organization-admin only.
section: administration
order: 30
related: roles-and-permissions, collaboration
---

## What a workflow rule is

A workflow rule reacts to something that happens in a project — a trigger
event — and, if its conditions match, runs one or more actions. Rules are
managed from **Workflows** (`/organizations/{org}/workflows`, linked
alongside **Team** from the projects list), visible only to organization
administrators.

## Triggers, conditions, and actions

**Triggers:** Control created, Control updated, Control assigned,
Assignment completed, Discussion created, Discussion resolved.

**Conditions** (all conditions on a rule must match — there is no "any of"
option): Control status, Control category, Framework, Assigned user,
Assigned role. A rule with no conditions runs for every event of its
trigger type.

**Actions:** Notify user, Notify role, Assign user, Assign role, Set due
date, Change status. Every rule needs at least one action.

> **Limitation:** Priority, severity, and tag conditions/actions appear in the
> catalog but aren't usable yet — Control Freak has no priority, severity,
> or tag fields on controls in this version.

## Creating a rule

From **Create workflow**, fill in a name, optional description, the
trigger, an **Enabled** toggle, then add conditions and actions with
**Add condition** / **Add action**. Save with **Create workflow**, or
**Save changes** when editing an existing rule. A rule can be
**Disabled** and **Enabled** again from the rule list without deleting it,
and **Delete** removes a rule along with its execution history — you're
asked to confirm because that history can't be recovered afterward.

## Execution history

Select **Runs** on a rule to see its execution history: each run's status
(Succeeded, Failed, Skipped, or Duplicate), the triggering event, whether
conditions matched, and the result of each action, including any error.

## What automation does not do

Rules run synchronously, in-process, as soon as their trigger event occurs
— there's no queue, scheduler, or retry. A rule's own actions do not
trigger other rules (no cascading), which keeps automation predictable but
also means you can't chain rules together to create multi-step automations.
