# Playbook: Autonomous Milestone Execution

## Purpose

Use this playbook when an autonomous coding agent is asked to complete a substantial milestone with limited supervision.

## Human preparation

Before starting the agent:

1. Ensure the milestone specification is approved.
2. Resolve all decisions marked as prerequisites.
3. Confirm the working tree is clean or that existing changes are understood.
4. Update local `main` from the remote.
5. Create a dedicated feature branch.
6. Confirm development and test services are available.
7. Ensure no production credentials or production database access are exposed to the agent.
8. Decide whether the agent may commit and push.

Example branch name:

```text
feat/platform-foundation
```

## Recommended task prompt

```text
Complete docs/milestones/01-platform-foundation.md.

Follow AGENTS.md and all referenced repository documentation.
Work only on the current feature branch.
Complete work packages in order.
Run focused tests after each package.
Create one small logical commit per completed package; commits are authorized.
Do not merge, deploy, or access production data.
Stop if an ADR, destructive migration, authentication decision, vendor decision, or security assumption requires approval.
At the end, run the full required verification and provide the completion report defined in AGENTS.md.
```

Remove the commit sentence when commits are not authorized.

## Agent checkpoints

The agent should create a checkpoint after each work package through:

- a clean logical commit, when authorized;
- passing focused tests;
- an updated implementation checklist;
- a brief note in the completion report draft.

Do not use Git history rewriting as a checkpoint mechanism.

## Human review checkpoints

Review after any package involving:

- schema design;
- data migration;
- authentication;
- authorization;
- invitation tokens;
- destructive operations;
- deployment configuration;
- changes to existing ADRs.

The agent may continue unattended through ordinary implementation packages only when the milestone contains clear acceptance criteria and no stop condition is triggered.

## Failure handling

When a package fails:

1. Preserve the working tree.
2. Capture the failing command and exact error.
3. Determine whether the failure is caused by the current package or is pre-existing.
4. Do not weaken tests, lint, types, or security rules.
5. Do not perform destructive Git operations.
6. Stop when recovery requires a product or architecture decision.
7. Otherwise fix the issue in the same work package and rerun focused verification.

## Completion review

Before merging, a human should verify:

- milestone acceptance criteria;
- full diff and commit sequence;
- migration behavior on representative data;
- tenant-isolation tests;
- authentication and authorization behavior;
- secrets and environment variables;
- documentation updates;
- production deployment and rollback steps;
- `npm test`, `npm run lint`, and `npm run build` results.

## Merge and deployment

Autonomous implementation completion does not authorize merge or deployment.

Merge only after human review.

Deploy only after:

- migration backup is confirmed;
- rollback or recovery steps are available;
- production environment variables are configured;
- a production smoke-test plan is ready;
- the release owner explicitly approves deployment.
