# Content and reader acceptance evidence — 18 September 2026

Implements [CONTENT-READER-SPEC.md](CONTENT-READER-SPEC.md) on `feat/swiss-citizen-pilot`. Local starting commit matches the user-linked fork: `cbc963d`.

## Imported content

| Official session | Published transcript records | Indexed speech paragraphs | Speakers |
| --- | ---: | ---: | ---: |
| 5213 — special session, April 2026 | 758 | 2,469 | 140 |
| 5215 — autumn 2026, snapshot on 18 September | 1,071 | 3,575 | 195 |

Autumn is ongoing. These counts describe published records returned by the query, not complete future coverage. Across existing summer/e-ID content and new imports, the database contains 16,471 speech paragraphs, 1,056 proposals, 271 imported profiles and three session records. The net increase is 5,977 passages because 67 autumn passages already existed. Imported individual-vote coverage was not expanded in this increment.

Raw official responses and resumable manifests remain in ignored `data/parliament/session-5213` and `session-5215`. UI now shows per-session snapshot dates and an ongoing-session notice.

## Measured compute output

Existing Launchpad credentials worked. GPU 0 remained allocated to existing services; Canary used GPU 1. No shared containers were restarted.

| Recording | Language | Canary words | Canary processing seconds | New timing candidates | VSS chunks |
| --- | --- | ---: | ---: | ---: | ---: |
| 374416 | DE | 317 | 6.09 | 0 | 35 |
| 374417 | FR | 708 | 7.00 | 1 | 54 |
| 374783 | IT | 499 | 6.10 | 6 | 42 |

Canary durations exclude initial model loading. Seven new paragraph candidates passed automated alignment checks; none is human-reviewed. German text remains readable without claiming alignment. The summer media queue now has nine processed recordings, 400 VSS chunks and 24 machine-aligned paragraph candidates. The separate earlier e-ID recording is outside those summer counts.

New media, Canary outputs, VSS receipts and full vectors are retained on the authorized server and copied locally with provenance checks. Existing private loopback tunnels were restored for inference, translation and video embedding. This is not supervised tunnel persistence.

## Storage

`node scripts/snapshot-public-content.mjs` creates a consistent SQLite export and an explicitly allowlisted source archive. It excludes account storage, `.env`, SSH credentials and media (already stored separately on the GPU host).

Uploaded archive: `/home/nvidia/swiss-parliament-intelligence/public-content-2026-09-18T08-36-51-379Z.tar.gz` (33,818,291 bytes), with adjacent JSON manifest. Local and remote SHA-256 both equal `62d4faea264ca21477497ff99b0c47200ee3b97b1bd2d791e16dae575035d47c`. Server disk reported approximately 1.6 TB available. This is an additional snapshot, not a tested disaster-recovery service.

## Verification

- 33 backend tests, two frontend API tests and four Sites packaging tests passed.
- Production frontend build passed.
- Live four-case NVIDIA evaluation passed status/scope/citation checks: three supported source-language cases in approximately 4.9–6.0 seconds and one unsupported question refused. These checks do not establish semantic or translation accuracy.
- Browser verified the populated reader, Italian-only results (352 passages), and expansion of adjacent paragraphs from the same intervention.
- Public reader endpoints use SQLite only, with no inference/video dependency.

Remaining acceptance work is tracked in the specification: participant tasks, language and timing review, complete e-ID topic narrative, supervised providers, and durable refresh/worker infrastructure. No public deployment or GitHub push is claimed.
