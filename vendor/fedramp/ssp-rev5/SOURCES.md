# FedRAMP Rev. 5 SSP Word templates — provenance

Pinned official FedRAMP Rev. 5 System Security Plan Word artifacts used as
**structural and presentation references** for Milestone 09E architecture
review.

These files are **not** derivation inputs for any Control Freak framework.
They are **not** output shells to populate. Control Freak must not claim that
filling these templates produces an official FedRAMP authorization package.

As of the retrieval date, FedRAMP marks these Word assets as **legacy**
during the transition to the FedRAMP Consolidated Rules for 2026. They remain
the last published Rev. 5 Word SSP front-matter and Appendix A Moderate
templates and are therefore the appropriate reference for recognizable SSP
organization. They are not current FedRAMP submission authority.

## Retrieval date

2026-11-03

## Artifacts in this directory

| Path | Publisher | Role | Pinned in git? |
| --- | --- | --- | --- |
| `templates/LEGACY_FedRAMP-High-Moderate-Low-LI-SaaS-Baseline-System-Security-Plan-(SSP).docx` | FedRAMP / GSA | Rev. 5 SSP front-matter Word template (High/Moderate/Low/LI-SaaS) | Yes (immutable pin; structural reference only) |
| `templates/LEGACY_SSP-Appendix-A-Moderate-FedRAMP-Security-Controls.docx` | FedRAMP / GSA | Rev. 5 SSP Appendix A Moderate control-response Word template | Yes (immutable pin; control-entry presentation reference only) |

## Authoritative sources

### FedRAMP High, Moderate, Low, LI-SaaS Baseline System Security Plan (SSP)

- **Title:** FedRAMP® (High, Moderate, Low, LI-SaaS) Baseline System Security Plan (SSP)
- **Publisher:** FedRAMP / GSA
- **Template revision history in file:** 1.0 (2023-06-30), 1.1 (2023-10-13), 1.2 (2026-06-16 — legacy deprecation notice on cover)
- **Internal title (body):** FedRAMP® (High, Moderate, Low, LI-SaaS) Baseline System Security Plan (SSP)
- **Authoritative listing:** https://fedramp.gov/legacy/ (Legacy System Security Plan Templates)
- **Direct URL used:** https://www.fedramp.gov/legacy/assets/LEGACY_FedRAMP-High-Moderate-Low-LI-SaaS-Baseline-System-Security-Plan-(SSP).docx
- **Historical non-legacy path (may redirect):** https://www.fedramp.gov/rev5/documents-templates/
- **Retrieval date:** 2026-11-03
- **Local filename:** `LEGACY_FedRAMP-High-Moderate-Low-LI-SaaS-Baseline-System-Security-Plan-(SSP).docx`
- **SHA-256:** `e6b7ebb88115f2c810ff8416d5e164315af381422dce6f53196345a972f90033`
- **Size:** 697977 bytes
- **Format:** Word (.docx)
- **Role:** Structural/visual reference for Control Freak general SSP modernization (`cf-ssp-docx`). Front matter only; security controls live in separate Appendix A templates.
- **Legacy notice in file:** dated 2026-06-23; states replacement by FedRAMP Consolidated Rules for 2026 (`https://fedramp.gov/2026`).

### SSP Appendix A — Moderate FedRAMP Security Controls

- **Title:** FedRAMP® System Security Plan (SSP) Appendix A: Moderate FedRAMP Security Controls
- **Publisher:** FedRAMP / GSA
- **Template revision history in file:** 1.0 (2023-06-30) … 1.4 (2026-06-17 — coversheet deprecation)
- **Authoritative listing:** https://fedramp.gov/legacy/
- **Direct URL used:** https://www.fedramp.gov/legacy/assets/LEGACY%20SSP-Appendix-A-Moderate-FedRAMP-Security-Controls.docx
- **Retrieval date:** 2026-11-03
- **Local filename:** `LEGACY_SSP-Appendix-A-Moderate-FedRAMP-Security-Controls.docx`
- **SHA-256:** `c10efd457111f9f54c6ab08fb7a8ce46d6ae6535a782a412b6a807a97b315db3`
- **Size:** 1334317 bytes
- **Format:** Word (.docx)
- **Role:** Control-entry presentation reference only (Control Summary Information; Responsible Role; Implementation Status; Control Origination; “What is the solution and how is it implemented?”). Not a Control Freak control-population source. Control Freak framework membership remains `FrameworkRegistry` / pinned baselines.

## Explicit non-uses

Do **not**:

- fill either DOCX as the Control Freak export shell;
- import FedRAMP logos, seals, signature blocks, or `fedramp.gov` footer branding into product output;
- treat Appendix A Moderate as the product framework for NIST Moderate projects;
- treat these legacy Word files as Consolidated Rules 2026 submission authority;
- invent FedRAMP Package IDs, authorization paths, or marketplace leverage claims.

Authoritative research for Milestone 09E Phase 1:
`docs/research/09E-fedramp-rev5-ssp-docx-architecture-review.md`.
