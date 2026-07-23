# Milestone 02C – Workflow Automation

## Objective

Introduce a lightweight, extensible workflow automation engine that reacts to Domain Events and performs configurable actions without embedding automation logic inside business services.

The workflow engine should allow administrators to define automation rules that execute in response to domain events while keeping business logic completely unaware of workflow execution.

This milestone builds directly upon the Domain Event Infrastructure introduced in Milestone 02B.

---

# Outcomes

At the completion of this milestone, Control Freak will support:

- Event-driven workflow execution
- Configurable automation rules
- Trigger / Condition / Action architecture
- Workflow execution history
- Workflow diagnostics
- Safe execution with auditability
- Extensible architecture for future workflow capabilities

---

# Architectural Principles

Workflow automation is **not business logic**.

Business services publish Domain Events.

The Workflow Engine subscribes to those events.

Business services must never directly invoke workflow execution.

The architecture should remain:

```
Business Service
        │
        ▼
 Publish Domain Event
        │
        ▼
   Domain Event Bus
        │
        ▼
   Workflow Engine
        │
        ▼
 Evaluate Rules
        │
        ▼
 Execute Actions
        │
        ▼
 Workflow Audit
```

Business services remain completely unaware that workflows exist.

---

# Initial Trigger Catalog

Support the following event triggers:

## Controls

- Control Created
- Control Updated
- Control Assigned
- Assignment Completed

## Discussions

- Discussion Created
- Discussion Resolved

The implementation should make it easy to register additional triggers in future milestones without modifying the workflow engine itself.

---

# Initial Conditions

Conditions should intentionally remain simple.

Support:

- Control Status
- Control Category
- Framework
- Assigned User
- Assigned Role
- Severity
- Priority

Rules should evaluate using AND logic only.

Do **not** implement:

- nested conditions
- OR groups
- expression languages
- scripting
- custom code

These will be future enhancements.

---

# Initial Action Catalog

Support only a small set of actions.

## Notifications

- Notify User
- Notify Role

## Assignment

- Assign User
- Assign Role

## Metadata

- Add Tag
- Remove Tag

## Dates

- Set Due Date

## Status

- Change Status

Future actions should be pluggable without modifying existing execution logic.

---

# Workflow Model

Each workflow consists of:

```
Trigger

↓

Conditions

↓

Actions
```

Example:

```
Trigger:
    Control Assigned

Conditions:
    Priority == High

Actions:
    Notify Security Manager
    Set Due Date (+7 days)
```

---

# Domain Model

Introduce strongly typed workflow concepts.

Suggested entities:

- WorkflowRule
- WorkflowTrigger
- WorkflowCondition
- WorkflowAction
- WorkflowExecution
- WorkflowAudit

Avoid generic JSON blobs wherever practical.

Favor typed models that are easily extensible.

---

# Workflow Engine

The workflow engine should:

- Subscribe to Domain Events
- Identify matching workflow rules
- Evaluate conditions
- Execute actions
- Record execution history
- Continue processing additional rules even if one fails

Execution should remain synchronous during this milestone.

Do **not** introduce:

- queues
- background workers
- schedulers
- distributed execution
- retries

Those belong in future milestones.

---

# Administration UI

Add a Workflow administration page.

Administrators should be able to:

- View workflows
- Create workflows
- Edit workflows
- Enable / Disable workflows
- Delete workflows

A wizard is unnecessary.

Simple forms are sufficient.

Focus on clarity over visual complexity.

---

# Diagnostics

Every workflow execution should record:

- Triggering event
- Workflow evaluated
- Conditions evaluated
- Actions executed
- Execution duration
- Success / Failure
- Error message (if applicable)

Diagnostics should make troubleshooting straightforward.

---

# Safety

Prevent:

- Infinite execution loops
- Recursive workflow triggering
- Duplicate execution from the same event

Document any current limitations.

---

# Extensibility

The workflow engine should be designed so future milestones can easily introduce:

- approval workflows
- scheduled workflows
- reminders
- escalations
- SLA timers
- external integrations
- email actions
- webhooks
- queue-based execution

without redesigning the core engine.

Favor registration and composition over switch statements.

---

# Testing

Integration tests should verify:

- Trigger fires correctly
- Matching workflows execute
- Conditions evaluate correctly
- Disabled workflows are ignored
- Multiple workflows execute independently
- Failed actions are recorded
- Execution history is created
- Infinite-loop protection functions correctly

---

# Documentation

Update:

- Architecture documentation
- Workflow documentation
- ADR describing why workflows subscribe to Domain Events rather than being invoked directly by business services

Document:

- current limitations
- future expansion points

---

# Definition of Done

- Workflow engine implemented
- Configurable workflow rules
- Event-driven execution
- Business services remain unaware of workflows
- Administrative UI implemented
- Diagnostics implemented
- Tests passing
- Lint passing
- Build passing
- Documentation updated

