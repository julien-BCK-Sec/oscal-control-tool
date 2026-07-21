# OSCAL vendor pins (v1.2.2)

Pinned official NIST artifacts only. Do not replace these with unofficial mirrors
or FedRAMP-labeled substitutes unless an authoritative FedRAMP OSCAL source is
explicitly approved for this project.

## Schemas

Source repository: https://github.com/usnistgov/OSCAL  
Release tag: `v1.2.2`  
Release page: https://github.com/usnistgov/OSCAL/releases/tag/v1.2.2

| File | Release asset URL |
| --- | --- |
| `schema/oscal_ssp_schema.json` | https://github.com/usnistgov/OSCAL/releases/download/v1.2.2/oscal_ssp_schema.json |
| `schema/oscal_profile_schema.json` | https://github.com/usnistgov/OSCAL/releases/download/v1.2.2/oscal_profile_schema.json |
| `schema/oscal_catalog_schema.json` | https://github.com/usnistgov/OSCAL/releases/download/v1.2.2/oscal_catalog_schema.json |

Schema `$id` values declare OSCAL `1.2.2`.

## Catalogs and profiles

Source repository: https://github.com/usnistgov/oscal-content  
Pinned commit: `78650f02ad9321bb7b817846f8fbd4f2bcd620de` (2026-05-13)  
Path prefix: `nist.gov/SP800-53/rev5/json/`

| File | Upstream path |
| --- | --- |
| `catalogs/NIST_SP-800-53_rev5_catalog.json` | `nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json` |
| `profiles/NIST_SP-800-53_rev5_MODERATE-baseline_profile.json` | `nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_MODERATE-baseline_profile.json` |

Both content files declare `metadata.oscal-version: "1.2.2"` and catalog/profile
`metadata.version: "5.2.0"`.

Raw URLs at the pinned commit:

- https://raw.githubusercontent.com/usnistgov/oscal-content/78650f02ad9321bb7b817846f8fbd4f2bcd620de/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json
- https://raw.githubusercontent.com/usnistgov/oscal-content/78650f02ad9321bb7b817846f8fbd4f2bcd620de/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_MODERATE-baseline_profile.json

The SSP exporter references the Moderate profile URI above from back-matter
`rlinks` (single-file export). A future portable package should include the
profile and catalog locally instead of relying on that external URI.

## Intentionally not pinned

- Resolved profile catalogs (`*-resolved-profile_catalog.json`) — derived
  convenience artifacts; the profile and catalog are the primary source
  artifacts used by this application.
- `-min.json` variants — truncated for demos.
- Any FedRAMP baseline/profile — no official FedRAMP OSCAL profile has been
  located and approved as an input to this project.
- FedRAMP Consolidated Rules (`FedRAMP/rules`) — separate policy dataset; pin
  elsewhere later if needed, not under `vendor/oscal/`.

## SHA-256 checksums (at pin time)

```
d7f9bf67101829083472a8f058a5b5ef078e09b3f699ac0c4dbe33a5b0671b6a  schema/oscal_ssp_schema.json
04329bd68032f48825f712f79576b3fd00e129e59d3597beb56ed72c17277f66  schema/oscal_profile_schema.json
fdc559f5dff6848b1ebbe1898a69cc08263479f7c796e2f056412059e7489d0c  schema/oscal_catalog_schema.json
9030dbf1f13169947eb97eb101b4bd2f00d3c151b100455a923ac75803f00ea1  profiles/NIST_SP-800-53_rev5_MODERATE-baseline_profile.json
01f37cf90ea99d92242c936cbfbdebcc338eef1f71454e2acac36cc56e9bc062  catalogs/NIST_SP-800-53_rev5_catalog.json
```
