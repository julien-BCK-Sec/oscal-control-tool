# Control Freak

Control Freak is a collaborative compliance authoring and control governance platform built around OSCAL.

Its goal is to help organizations create, review, maintain, and export high-quality security control implementations while remaining aligned with official compliance frameworks.

Control Freak treats OSCAL as an interchange and export format rather than the application's internal editing model.

---

## Current Status

Control Freak is currently under active development.

The current implementation includes:

- Collaborative compliance authoring
- NIST SP 800-53 Rev. 5 Moderate support
- OSCAL System Security Plan (SSP) export
- Review workflow
- Operational metadata
- Version history
- SQLite persistence
- Local-first deployment

See `docs/current-state.md` for the complete implementation status.

---

## Quick Start

### Requirements

- Node.js 20+ (or current LTS)
- npm

### Installation

```bash
npm install
cp .env.example .env.local   # optional
npm run db:migrate
npm run dev
```

Open:

```
http://localhost:3000
```

---

## Useful Commands

```bash
npm run dev
npm test
npm run lint
npm run build

npm run db:migrate
npm run db:generate
npm run db:studio

npm run derive:framework
```

---

## Documentation

| Document | Purpose |
|----------|---------|
| `docs/vision.md` | Product vision |
| `docs/roadmap.md` | Planned milestones |
| `docs/current-state.md` | Current implementation |
| `docs/architecture.md` | System architecture |
| `docs/decisions.md` | Architectural decisions (ADRs) |
| `docs/design-system.md` | UI design system |
| `docs/oscal-standards-alignment.md` | OSCAL and standards guidance |
| `docs/deploy-render.md` | Deployment guide |
| `docs/milestones/` | Milestone specifications |
| `docs/playbooks/` | Engineering playbooks |
| `AGENTS.md` | Instructions for AI and human contributors |

---

## Design Principles

- OSCAL is an export format, not the domain model.
- Framework content is read-only reference data.
- Operational metadata is separate from compliance content.
- The application domain model is independent of OSCAL.
- Standards alignment is preferred over proprietary formats.

---

## Contributing

Before making significant changes, read:

1. `AGENTS.md`
2. `docs/vision.md`
3. `docs/current-state.md`
4. `docs/architecture.md`
5. `docs/decisions.md`

Follow the appropriate milestone specification and playbooks when implementing new features.

---

## License

TBD