# NIST SP 800-171 Revision 2 vendor pins

Pinned official NIST artifacts used to derive the CMMC Level 2 framework
(`cmmc-level-2-nist-sp-800-171-r2`). Do not replace these with unofficial
mirrors, consultant mappings, or NIST SP 800-171 Revision 3 content.

CMMC Level 2 security requirements are identical to NIST SP 800-171 R2
(32 CFR § 170.14(c)(3)). NIST has withdrawn Revision 2 in favor of
Revision 3; CMMC still incorporates Revision 2 by reference
(32 CFR § 170.2). Do not silently substitute Rev. 3.

## Artifacts

| File | Publisher | Role |
| --- | --- | --- |
| `NIST.SP.800-171r2.pdf` | NIST | Normative publication. PDF wins if CSV/XLSX disagree. |
| `sp800-171r2-security-reqs.csv` | NIST | Machine-readable derivation input (110 security requirements). |
| `sp800-171r2-security-reqs.xlsx` | NIST | Official spreadsheet companion to the CSV. Not parsed at derive time. |

## Retrieval

Retrieved 2026-08-18 from official NIST hosts. No runtime download.

| File | Source URL |
| --- | --- |
| PDF | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-171r2.pdf |
| CSV | https://csrc.nist.gov/CSRC/media/Publications/sp/800-171/rev-2/final/documents/sp800-171r2-security-reqs.csv |
| XLSX | https://csrc.nist.gov/CSRC/media/Publications/sp/800-171/rev-2/final/documents/sp800-171r2-security-reqs.xlsx |

Publication record: https://csrc.nist.gov/pubs/sp/800/171/r2/upd1/final  
DOI: https://doi.org/10.6028/NIST.SP.800-171r2  
Revision: February 2020 (includes updates as of January 28, 2021)

NIST CSRC states that the PDF is the authoritative source of the CUI
security requirements. If CSV/XLSX and PDF disagree, contact
sec-cert@nist.gov and treat the PDF as normative.

The CSV README advertised on the CSRC page was not retrievable (HTTP 404)
at pin time.

## Derivation

`scripts/derive-cmmc-level-2-framework.ts` reads the pinned CSV only.
It does not parse the PDF (no OCR). It constructs CMMC identification
numbers `DD.L#-REQ` per 32 CFR § 170.14(c)(1). Discussion text from the
CSV is not imported. Assessment objectives from NIST SP 800-171A are not
imported.

CMMC short names from the DoD Model Overview / Assessment Guide were not
pinned: official DoD PDF URLs returned HTTP 403 from this environment.
Display titles are therefore derived from the normative requirement
statement. Short-name differences must not change requirement semantics.

## SHA-256 checksums (at pin time)

```
298bdbfcf6a4890a564b225c893230a0b32b2e69e3b98dd898aaeb1d544c5e12  NIST.SP.800-171r2.pdf
0f4d59413bbcc9998da80495ce46ebfe0475e392803c4d2ed38d9941d83f138d  sp800-171r2-security-reqs.csv
7c7a3c17f13542b4b17ac4c2d1c60c4bc1934989c1a394e2e6c841919c09de3b  sp800-171r2-security-reqs.xlsx
```
