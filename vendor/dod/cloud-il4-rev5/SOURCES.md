# DoD Cloud IL4 (Rev. 5) vendor pins and provenance

Pinned and recorded official sources used to **derive** the DoD Impact Level 4
Moderate / MMx overlay artifact (`dod-cloud-il4-rev5`). This identity is
registered in `FrameworkRegistry` and product-selectable as of WP4.

Do not replace these with unofficial mappings, consultant spreadsheets, or
guessed RMF Knowledge Service DSPAV values.

The PA-facing control population is the **DoD Rev 5 SSP Addendum Controls v1.2
IL4 Moderate sheet**, not Appendix D of the Cloud Computing SRG.

## Retrieval date

2026-08-27

## Artifacts in this directory

| Path | Publisher | Role | Pinned in git? |
| --- | --- | --- | --- |
| `FedRAMP_Security_Controls_Baseline.xlsx` | FedRAMP / GSA | FedRAMP Rev. 5 Moderate selection, assignment values, and additional guidance | Yes |
| `extracts/addendum-il4-moderate.json` | DISA (derived extract) | Deterministic cell extract of Addendum **IL4 Moderate** | Yes (extract only) |
| `extracts/appendix-d-il4-parameter-notes.json` | DISA (derived extract) | Table D-1 IL4 parameter notes for provenance / DSPAV pointers | Yes (extract only) |
| `local/rev5_ssp_addendum_controls.xlsx` | DISA | Optional local copy of the Addendum workbook | **No** (gitignored) |

NIST SP 800-53 Rev. 5 catalog and Moderate profile remain under
`vendor/oscal/v1.2.2/` (see that `SOURCES.md`). They supply **normative control
text**, ODP identifiers, and the NIST Moderate ID list for completeness checks.
They are **not** the IL4 selection base.

## Authoritative sources (not all stored as binaries)

### FedRAMP Security Controls Baseline

- **Title:** FedRAMP Security Controls Baseline
- **Publisher:** FedRAMP / GSA
- **Version:** Rev. 5 Moderate sheet (“Moderate Baseline”)
- **Authoritative URL:** https://www.fedramp.gov/resources/documents/FedRAMP_Security_Controls_Baseline.xlsx
- **Retrieval date:** 2026-08-27
- **Local filename:** `FedRAMP_Security_Controls_Baseline.xlsx`
- **SHA-256:** `fa3282f0f31356d8b001c64fcc105091826f0de88a294e380afd1e0b56a9830c`
- **Format:** Excel (.xlsx)
- **Role:** FedRAMP Moderate population (181 base / 142 enhancements / 323 total) and FedRAMP assignment / extra-guidance columns
- **Redistribution:** Official public FedRAMP document. Pinned like other official government workbooks already in this repository (NIST SP 800-171 R2 xlsx). This is not a license-unlimited claim; it is a public US government baseline used as derivation input.

### DoD Rev 5 SSP Addendum Controls v1.2

- **Title:** DoD Rev 5 SSP Addendum Controls v1.2
- **Publisher:** DISA (DCCS document library)
- **Version:** v1.2; workbook modified 2025-12-03T20:15:28Z
- **Authoritative URL:** https://public.cyber.mil/dccs/dccs-documents/ (Salesforce library; **no stable direct file URL**)
- **Retrieval date:** 2026-08-27 (manual copy onto the development machine)
- **Local filename when present:** `rev5_ssp_addendum_controls.xlsx` (Downloads or `local/`)
- **SHA-256:** `80475917868603d65c01a0e82be7cdd9e12095ea08047b397a8244a9177b6fcd`
- **Format:** Excel (.xlsx)
- **Role:** Complete PA-facing IL4 Moderate population (345 items including GRR-1…GRR-10), DoD FedRAMP+ parameter column, leveraged-from-FedRAMP flag
- **Redistribution / pinning decision:** **Do not commit the xlsx.** The workbook has no in-file license text, is served from a DCCS Salesforce library without a stable URL, and public accessibility is not treated as unlimited redistribution proof. Git stores a **hash-locked sheet extract** instead.

Regenerate the extract only when the authoritative workbook is available:

```
DOD_IL4_REGENERATE_ADDENDUM_EXTRACT=1 npm run derive:framework
```

Optional path override: `DOD_IL4_ADDENDUM_XLSX=/path/to/rev5_ssp_addendum_controls.xlsx`.
The derive step **fails closed** if the file’s SHA-256 does not match.

### Cloud Computing SRG Y26M06 / CSP SRG V1R7

- **Title:** Cloud Service Provider SRG
- **Publisher:** DISA
- **Version:** V1R7, 30 June 2026, package Y26M06
- **Authoritative URL:** https://dl.dod.cyber.mil/wp-content/uploads/stigs/zip/U_Cloud_Computing_Y26M06_SRG.zip
- **Public distribution:** https://public.cyber.mil/ (SRG §1.5)
- **Retrieval date:** 2026-08-27
- **Local filenames (not committed):** `U_Cloud_Computing_Y26M06_SRG.zip`, `U_Cloud_Service_Provider_V1R7_SRG.pdf`
- **SHA-256 (zip):** `9470b9caadd3ff44b90e608c524012fa719c9b3541b3f0bb027b38b5b9e67971`
- **SHA-256 (CSP PDF):** `fcb472f563283f293e224fcf72987584deb6019482a264a6536c2d5c1a5df51f`
- **Format:** Zip of PDFs
- **Role:** IL4 definition, FedRAMP+ semantics, Appendix D DSPAV/conditionality cross-check, GRR §4.7 provenance, privacy/CDS context
- **Redistribution / pinning decision:** **PDF/zip not committed.** The SRG is not the complete IL4 population. Table D-1 IL4 notes are stored as a small verified extract whose `pdfSha256` must match V1R7.

### NIST SP 800-53 Rev. 5 catalog (existing pin)

- **Title:** NIST SP 800-53 Revision 5 catalog (OSCAL)
- **Publisher:** NIST
- **Version:** catalog `5.2.0` / oscal-content commit `78650f02ad9321bb7b817846f8fbd4f2bcd620de`
- **Path:** `vendor/oscal/v1.2.2/catalogs/NIST_SP-800-53_rev5_catalog.json`
- **SHA-256:** `01f37cf90ea99d92242c936cbfbdebcc338eef1f71454e2acac36cc56e9bc062`
- **Role:** Normative statements and organization-defined parameter identifiers

### Intentionally not pinned

- RMF Knowledge Service DSPAV tables (`https://rmfks.osd.mil/`) — CAC-restricted; values are **not guessed**
- FedRAMP 2026 Consolidated Rules — not the IL4 base
- Stale HTML Cloud Computing SRG V1R3 (March 2017)
- IL4 High / IL5 / IL6 Addendum sheets
- Unofficial FedRAMP+ crosswalks

## Derivation

`scripts/derive-dod-cloud-il4-framework.ts` reads:

1. NIST catalog + Moderate profile `with-ids` (completeness / provenance only)
2. Pinned FedRAMP Moderate workbook
3. Addendum IL4 Moderate extract
4. Appendix D IL4 parameter-note extract

Output: `src/data/framework/generated/dod-cloud-il4-rev5.json`

This is **not** a general OSCAL `modify` engine and does **not** register a
`FrameworkProvider`.
