# Roadmap

## Completed

**Milestone 1 – Platform Foundation** (implemented on `feat/platform-foundation`)

PostgreSQL, organizations, Better Auth, RBAC, invitations, tenant-isolation
tests, and authenticated invite-only demo. See
`docs/milestones/01-platform-foundation.md` and ADR-014 through ADR-019.

**Milestone 1.1 – Local development bootstrap**

Docker Compose PostgreSQL for local development, standalone scripts load
`.env.local` / `.env`, and documented `docker compose up -d` → migrate →
bootstrap → `npm run dev` onboarding.

**Milestone 02A – Collaboration** (implemented on `feat/collaboration-02a`)

Threaded control discussions, mentions, in-app notifications, assignments,
collaboration activity history, and tenant-aware authorization. See
`docs/milestones/02A-collaboration.md` and ADR-020.

**Milestone 02B – Domain Event Infrastructure** (implemented on
`feat/domain-events-02b`)

Strongly typed domain events, `DomainEventPublisher`, in-process
`DomainEventBus`, handler isolation, process-local diagnostics, and
post-success publication from authorized mutations. See
`docs/milestones/02B-domain-event-infra.md` and ADR-021.

**Milestone 02C – Workflow Automation** (implemented on
`feat/workflow-automation-02c`)

Event-driven workflow engine with pluggable triggers/conditions/actions,
org-admin rule administration, execution history, and no-cascade safety.
See `docs/milestones/02C-workflow-automation.md`, `docs/workflows.md`, and
ADR-023.

**Milestone 03A – Evidence Management Foundation** (implemented on
`feat/evidence-management-03a`)

Project-scoped Evidence aggregate, control associations, evidence
requirement on ControlRecord, RBAC, audit/events, and browse/CRUD UI without
binary uploads. See `docs/milestones/03A-evidence-management.md` and ADR-024.

**Milestone 03B – Evidence Storage & Versioning** (implemented on
`feat/evidence-storage-03b`)

Immutable Evidence Versions, object storage abstraction (filesystem
dev/test; S3-compatible production), app-proxied upload/download, version
history UI. See `docs/milestones/03B-evidence-storage-and-versioning.md` and
ADR-025.

**Milestone 03C – Searchable Evidence Picker** (implemented on
`feat/evidence-picker-03c`)

Reusable presentational Evidence Picker, project-scoped server search with
keyset pagination, control linking integration. See
`docs/milestones/03C-evidence-picker.md`.

**Milestone 03D – Evidence Coverage, Freshness & Reporting** (implemented)

Derived control/project Evidence Coverage, freshness from review due date,
scalable Evidence Browser filters, authorized CSV inventory. See
`docs/milestones/03D-evidence-coverage-and-reporting.md` and ADR-024
amendment. Evidence Coverage is not a compliance score.

**Milestone 04A – Multi-Framework Foundation** (implemented)

In-process `FrameworkRegistry`, durable project `frameworkId`, and pinned
NIST SP 800-53 Rev. 5 Low / Moderate / High profiles. Existing projects
remain Moderate. Coverage, control browsing, Evidence links, and OSCAL SSP
export resolve the project's selected framework. See
`docs/milestones/04A-multi-framework-foundation.md`, ADR-002 amendment, and
ADR-026.

**Milestone 04B – Framework UX and Runtime Hardening** (implemented)

Canonical `projects.framework_id` runtime identity, control-write validation
(including review and workflow), registry-driven Low / Moderate / High
presentation, and compatibility for existing documents and named versions.
See `docs/milestones/04B-framework-ux-and-hardening.md` and ADR-026
amendment.

**Milestone 04C – CMMC Level 2 Framework Support** (implemented)

CMMC Level 2 as a registered framework (`cmmc-level-2-nist-sp-800-171-r2`)
backed by pinned NIST SP 800-171 Rev. 2 artifacts (32 CFR Part 170). 110
requirements, CMMC operational IDs, Evidence and workflow against those IDs,
OSCAL SSP export disabled for CMMC. Not CMMC assessment or certification.
See `docs/milestones/04C-cmmc-level-2-framework-support.md`, ADR-026
amendment, and ADR-027.

**Milestone 05A – Consolidate and Modernize the Demo Dataset** (implemented)

One canonical demo environment: Canadian Goose Defence System flagship
(Strategic Goose Operations Platform) plus supporting Low / High / CMMC /
evidence-gap projects, Contoso tenant isolation, idempotent bootstrap, and
separated destructive reset. See `docs/milestones/05A-consolidate-modernize-demo-dataset.md`
and `docs/demo-data.md`.

**Milestone 05B – Normal and Demo Deployment Lifecycle** (implemented)

One production startup command (`npm start`) with `DEPLOYMENT_MODE=normal`
or `DEPLOYMENT_MODE=demo`. Shared canonical demo library, retired
`SEED_DEMO_PROJECT` production switch, explicit demo password, Evidence S3
startup validation. See `docs/milestones/05B-normal-demo-deployment-lifecycle.md`,
`docs/deployment.md`, and ADR-028.

**Milestone 05C – Render Deployment and Seeded Demo Verification** (implemented)

Hosted demo on Render: Ohio Docker web service, managed PostgreSQL, S3
Evidence, `DEPLOYMENT_MODE=demo`, custom domain, canonical 05A dataset,
real Evidence upload, NIST OSCAL SSP export, and redeploy without reset.
See `docs/milestones/05C-render-deployment-seeded-demo-verification.md`,
`docs/deploy-render.md`, and `docs/deployment.md`.

**In-app Help / User Guide** (implemented)

Markdown-sourced Help Center (`/help`, `/help/{slug}`) rendering
`docs/user-guide/` content through a dependency-free parser, in-memory
full-text search, and targeted contextual links (`HelpLink`) on the
control editor, Evidence tab, OSCAL export control, overlay metadata
panel, and workflow automation rule list. Tests cover manifest ordering,
path-traversal-safe slug resolution, contextual anchors, and that every
internal `/help/{slug}` and `related` link resolves. See
`docs/current-state.md` ("In-app Help / user guide").

**Milestone 06A – DoD Impact Level 4 Framework Support** (implemented)

DoD Cloud Impact Level 4 (`dod-cloud-il4-rev5`) as a registered overlay
framework: FedRAMP Rev. 5 Moderate plus the DoD IL4 Addendum overlay,
345 framework items including 10 General Readiness Requirements, overlay
presentation, generic Evidence/workflow on all item IDs, OSCAL SSP export
disabled (no approved/pinned IL4 OSCAL profile), and a complementary
Snow Goose Cloud IL4 demo project. Not FedRAMP authorization, DoD
authorization, Provisional Authorization, or an ATO. See
`docs/milestones/06A-dod-impact-level-4-framework-support.md`, ADR-029,
and `docs/user-guide/dod-cloud-il4.md`.

## Future directions

The following items are candidate product and engineering directions. They are
not ordered by priority or committed release sequence. Individual items may
become milestones as their scope and dependencies become clearer.

### Assessment, findings, and remediation

- **Assessment management** — assess documented controls/requirements
  independently from authoring status, review approval, and Evidence Coverage.
  Assessment semantics must remain distinct from documentation completeness
  and compliance/certification claims.

- **Findings and observations** — record deficiencies, observations, and other
  assessment results against controls/requirements, with ownership, status,
  history, and supporting Evidence.

- **POA&M and remediation tracking** — connect findings to remediation plans,
  milestones, owners, due dates, Evidence, and closure/verification.

- **Assessor-oriented views** — focused read/review experiences for examining
  implementation narratives, Evidence, assessment results, and findings
  without exposing unnecessary administrative functionality.

### Evidence and continuous monitoring

- **Organization-wide Evidence library** — allow appropriately authorized
  Evidence reuse across projects while preserving project, organization, and
  framework boundaries.

- **Evidence review and approval** — optionally distinguish Evidence lifecycle
  state from whether Evidence has been reviewed or accepted for a particular
  purpose.

- **Automated Evidence ingestion** — accept Evidence and Evidence Versions from
  trusted external systems such as CI/CD pipelines, security scanners, cloud
  platforms, and other integrations.

- **Evidence source management** — identify where automated Evidence originated,
  including source system, execution/build, commit, environment, collection
  time, and integrity/provenance metadata.

- **Scheduled Evidence monitoring and reminders** — periodically evaluate the
  existing derived Evidence Coverage/freshness read model (missing-required,
  due-soon, overdue) on a schedule and notify, without persisting
  time-derived status as new Evidence state.

- **Continuous Evidence health** — surface missing, stale, failed, or changed
  automated Evidence while keeping Evidence presence distinct from assessment
  or compliance status.

### Frameworks and mappings

- **Additional frameworks** — extend the registry beyond NIST SP 800-53 Rev. 5
  Low / Moderate / High, CMMC Level 2, and DoD Cloud Impact Level 4.
  Candidates include CMMC Levels 1/3, DoD Cloud IL5 / IL6, NIST CSF,
  ISO/IEC 27001, CIS Controls, PCI DSS, privacy/NSS overlays, and other
  useful frameworks.

- **Cross-framework mappings** — represent relationships among controls and
  requirements so common implementation and Evidence can be understood across
  frameworks without claiming that mapped requirements are automatically
  equivalent or satisfied.

- **Official framework artifacts** — adopt authoritative machine-readable
  profiles/catalogs when available, including official CMMC OSCAL artifacts if
  published and appropriate.

### OSCAL and authorization artifacts

- **Richer OSCAL SSP generation** — expand machine-readable system
  implementation output beyond the current supported SSP subset (today:
  metadata, a single hardcoded system component, placeholder system
  characteristics, and control-implementation entries — no ports/protocols,
  leveraged authorizations, multiple components, or diagrams).

- **OSCAL Component Definitions** — describe reusable system components and
  their control implementations in machine-readable form.

- **OSCAL assessment artifacts** — investigate Assessment Plan, Assessment
  Results, POA&M, and related OSCAL models as assessment capabilities mature.

- **OSCAL import** — ingest supported machine-readable authorization artifacts
  while preserving provenance and avoiding destructive interpretation of
  unsupported content.

(Human-readable Word/PDF authorization outputs are covered under
**Authorization package generation**, below.)

### Secure software delivery

- **Robust CI/CD security pipeline** — establish authoritative automated
  verification for builds and pull requests, including tests, linting,
  type-checking, SAST, software composition/dependency analysis, secret
  scanning, container/IaC scanning, and DAST where appropriate.

- **Software supply-chain assurance** — generate and retain SBOMs, artifact
  hashes, build provenance/attestations, vulnerability results, and other
  release evidence.

- **Security regression testing** — preserve important authorization,
  tenant-isolation, input-handling, and other security properties as explicit
  automated tests. A dedicated tenant-isolation and authorization suite
  already exists (`src/server/tenant-isolation.test.ts`,
  `src/authz/authorize.test.ts`, and others); the gap is CI enforcement and
  broader coverage, not a from-scratch suite.

- **Staging security verification** — run appropriate DAST and deployment
  verification against a representative deployed environment before release.

### Continuous authorization and control-to-code traceability

Control Freak itself should be the initial reference system for this work.
These capabilities are intended to produce continuous implementation Evidence
about Control Freak as software, while establishing patterns that may later be
generalized for other systems.

- **Repository compliance manifest** — define machine-readable descriptions of
  Control Freak security capabilities such as authentication, authorization,
  tenant isolation, audit logging, Evidence storage, deployment, and secure
  development.

- **Control-to-code traceability** — associate security capabilities with
  implementation claims, relevant source code, configuration, automated tests,
  and applicable controls.

- **Control-aware automated tests** — allow selected security tests to identify
  the security capability and controls for which they provide verification
  Evidence without claiming that a passing test alone satisfies a control.

- **Automated build Evidence** — turn CI/CD outputs such as test results, SAST,
  SCA, SBOMs, container scans, DAST, provenance, and deployment verification
  into attributable Evidence for a specific build/release.

- **Control Evidence matrix** — show relationships among security capabilities,
  implementation claims, source/tests, applicable controls, Evidence sources,
  and Evidence freshness.

- **Control Freak self-assessment project** — use a real Control Freak project
  to document and continuously collect Evidence about the Control Freak
  application itself, dogfooding the authorization model.

The traceability model should use language such as "mapped to", "supports",
"implements aspects of", and "provides Evidence for". A source file, automated
test, scan result, or other individual artifact must not be treated as proving
that an entire control is satisfied.

- **Control Freak Security Posture dashboard** — provide a privileged
  administrative view of Control Freak's own security-relevant configuration,
  operational state, and verification health without exposing secrets.

  The dashboard may surface observations such as:

  - production/deployment mode and environment hardening;
  - HTTPS, secure-cookie, session, and security-header configuration;
  - authentication and account-security posture;
  - database connectivity, TLS, backup, and recovery verification;
  - Evidence object-storage configuration, encryption, access controls, and
    lifecycle expectations;
  - software supply-chain status such as CI verification, SAST, dependency
    scanning, SBOM generation, container scanning, and DAST;
  - authorization and tenant-isolation regression-test health;
  - automated Evidence freshness and failed/stale security checks;
  - important missing or unsafe configuration detected at runtime or deployment
    time.

  Findings should be presented as attributable security posture observations
  with severity/context and remediation guidance where appropriate, not as a
  compliance score or claim that Control Freak is FedRAMP-, CMMC-, or otherwise
  compliant.

  The dashboard should reuse authoritative configuration, CI/CD, deployment,
  and Continuous Evidence data rather than maintaining a second manually
  updated security-status model.

  **Builds on:** secure CI/CD, operational hardening, automated Evidence
  ingestion, software supply-chain assurance, and Continuous Evidence.

  **Builds toward:** Control Freak dogfooding its own Continuous ATO model,
  control-to-code traceability, release/security attestations, and change-aware
  authorization monitoring.

### Authorization package generation

- **FedRAMP SSP document generation** — generate a human-readable SSP using
  the applicable official FedRAMP SSP template, populated from authoritative
  Control Freak project, system, control, implementation, Evidence, and
  authorization data. Preserve the structure and expected presentation of the
  official template rather than producing a generic Control Freak report.

- **DoD / Impact Level SSP generation** — support applicable DoD authorization
  package templates and profiles, including environments targeting defined
  Impact Levels such as IL4, where authoritative templates and requirements
  are available.

- **Template-driven authorization packages** — maintain versioned output
  templates separately from project data so government/program template
  revisions can be supported without changing the underlying Control Freak
  domain model.

- **Authorization package completeness checking** — identify required SSP
  sections, tables, diagrams, attachments, implementation narratives, and
  other package information that cannot yet be generated because required
  project data is missing. Distinct from Evidence Coverage (per-control
  evidence presence, ADR-024): this is package/section-level completeness,
  not control-level evidence presence.

- **OSCAL-backed document generation** — where appropriate, use the same
  authoritative data and OSCAL representations that support machine-readable
  authorization artifacts to populate human-readable SSP documents. OSCAL
  should complement rather than replace required program-specific documents.

- **Repeatable package regeneration** — regenerate an SSP after system,
  implementation, Evidence, or control changes without requiring teams to
  manually reassemble a large Word document.

- **Package provenance** — record the project/version, framework/profile,
  template version, generation time, and other information necessary to
  understand exactly what state of the system produced an exported
  authorization package.

  Builds on the OSCAL SSP exporter's existing `metadata.last-modified`,
  `metadata.version`, and back-matter profile stamping.

### Workflow and automation

- **Visual workflow viewer** — render existing workflow rules graphically so
  triggers, conditions, actions, and branching behavior can be understood at a
  glance.

- **Visual workflow designer** — create and edit workflow automation through a
  visual node/transition experience while retaining the existing workflow
  engine as the authoritative execution model.

- **Workflow templates** — reusable starting points for common review,
  Evidence, notification, and remediation workflows.

- **Richer workflow execution** — asynchronous/queued execution, approval
  steps, timers, SLA/deadline handling, and more expressive branching where
  justified. See `docs/workflows.md` ("Current limitations") for the
  authoritative list this bullet tracks; keep both documents in sync.

- **Durable domain events** — investigate an outbox, durable event store, or
  external broker when workflow reliability/scaling requirements require it.

### Integrations and notifications

- **GitHub/source-control integration** — associate commits, pull requests,
  builds, security results, and release artifacts with implementation and
  Evidence.

- **Security-tool integrations** — ingest useful outputs from SAST, DAST, SCA,
  vulnerability management, CSPM, SIEM, and related systems.

- **Cloud integrations** — collect selected configuration and security
  telemetry from cloud platforms as attributable Evidence. Distinct from the
  existing S3-compatible object storage used for Evidence binaries
  (ADR-025), which is a storage backend, not a telemetry source.

- **Production transactional email delivery** — wire a real transactional
  email provider for the existing Better Auth verification/invitation
  flows. Production currently sends no email at all; the sink is a
  dev-only stub.

- **Slack and Teams notification channels** — extend the current in-app
  notification model to external chat delivery channels where appropriate.

- **Webhooks and integration API** — provide secure machine-to-machine
  interfaces for Evidence ingestion and external automation.

### Enterprise and platform capabilities

- **Enterprise identity** — investigate SSO/OIDC/SAML, stronger authentication
  controls, and SCIM/provisioning where required.

- **API/service identities** — scoped credentials and authorization for CI/CD,
  integrations, and other non-human actors.

- **Audit trail expansion** — strengthen security/administrative audit
  visibility, retention, querying, and export. Builds on the existing
  control-scoped `ControlActivity` stream and organization-admin,
  process-local `event.diagnostics.read`; the gap is a durable
  security/admin-level log (authentication, permission and role changes,
  membership changes), not general activity logging.

- **Operational hardening** — continue work on rate limiting, session controls,
  security headers, backup/recovery verification, health monitoring, and
  production operational controls.

- **Horizontal scaling** — resolve the single-instance constraints already
  documented in ADR-021 (in-process `DomainEventBus`) and ADR-023
  (synchronous in-process workflow execution) before multi-instance
  deployment.

- **Direct object-store transfers** — presigned/direct upload and download when
  scale justifies moving binary transfer away from the application process.

- **Search scaling** — PostgreSQL full-text/trigram or another justified search
  strategy if project/Evidence libraries outgrow the current ILIKE approach.

### User experience and assistance

- **Ongoing UI/UX refinement** — continue improving navigation, responsive
  behavior, accessibility, Evidence interaction, control/requirement authoring,
  and high-friction workflows.

- **Contextual product assistance** — continue evolving the in-app Help system
  and targeted contextual guidance without scattering Help affordances across
  every field.

  **Builds on:** the in-app Help / User Guide (Completed).

- **AI-assisted authoring** — investigate assistive drafting, summarization,
  Evidence discovery, and related capabilities with explicit human review,
  provenance, authorization boundaries, and no automatic compliance claims.

### Reporting and visibility

- **Readiness and Evidence dashboards** — provide useful aggregate visibility
  into documentation, Evidence health, review state, assessment state, and
  remediation while keeping those concepts separate. Extends the existing
  per-project completion percentage and Evidence attention cards
  (Milestone 03D, Project Overview) into cross-project and
  organization-wide views.

- **Trend/history reporting** — show how Evidence freshness, findings,
  assessment results, and other meaningful states change over time.

- **Portable reports** — generate human-readable Evidence inventories,
  assessment reports, remediation/POA&M outputs, and other stakeholder
  deliverables from authoritative project data. Evidence inventory CSV
  export is implemented (Milestone 03D); assessment reports and POA&M
  outputs remain future work pending Assessment Management and POA&M
  tracking.

### Automated environment assessment and Evidence collection

- **Cloud environment collectors** — collect attributable technical
  observations from deployed environments using read-only integrations.

- **AWS collector** — initially investigate Prowler as a collector for AWS
  configuration/security observations and map supported checks to relevant
  framework controls and requirements.

- **Native AWS Evidence sources** — investigate direct collection from AWS
  Config, Security Hub, CloudTrail, Inspector, and selected service APIs where
  these provide stronger or more authoritative Evidence than third-party
  scanner output.

- **Normalized technical observations** — represent collector, environment,
  resource, check, result, timestamp, raw source data, and provenance
  independently from framework-specific compliance conclusions.

- **Observation-to-control mappings** — map technical observations to controls
  and assessment objectives for which they provide relevant Evidence without
  treating a passing automated check as proof that the entire control is
  satisfied.

- **Automated Evidence creation** — preserve selected observations as
  versioned Evidence associated with applicable controls/requirements.

- **Configuration drift detection** — compare current observations with prior
  observations and identify changes that may invalidate existing Evidence or
  require control review/reassessment.

- **Evidence-grounded implementation drafting** — optionally generate proposed
  control implementation narratives from verified system information and
  technical observations, with explicit provenance and mandatory human review.

- **Continuous technical verification** — periodically re-evaluate supported
  technical control objectives and surface changed, failed, stale, or missing
  observations.

- **Multi-cloud collector model** — keep collector interfaces provider-neutral
  so AWS/Prowler support can later extend to Azure, GCP, Kubernetes, GitHub,
  CI/CD systems, vulnerability scanners, and other authoritative sources.

Automated technical checks represent observations and Evidence, not independent
claims of compliance, certification, or authorization.

## Roadmap principles

Future work should preserve the distinctions among:

- documentation completeness;
- Narrative status;
- Implementation status;
- Review status and approval;
- Evidence presence and Evidence Coverage;
- Evidence freshness;
- assessment results;
- findings and remediation;
- compliance, certification, and authorization.

Automation, mappings, passing tests, Evidence Coverage, and successful security
scans may provide valuable implementation or assessment Evidence, but must not
be presented as independently proving compliance or authorization.

Where practical, new reporting and automation capabilities should derive from
authoritative domain data rather than introducing duplicate persisted state.