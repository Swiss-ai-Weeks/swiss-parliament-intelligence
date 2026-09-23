# Current implementation and corpus status

## Live pilot — 23 September 2026, evening

What runs at [midnight.vote/Switzerland](https://midnight.vote/Switzerland/), checked on the live site the same evening:

- **Deploy:** the full archive and the int8 E5 meaning index on the Hostinger VPS, with hybrid (keyword + meaning) retrieval on, a 4 GB container and two search threads.
- **Answers:** Nemotron Nano 9B v2 as an NVIDIA NIM on LaunchPad GPU 0, reached over the SSH tunnel. The 10-million question was answered in 21.3 s with 4 citations from 1,149 records considered.
- **Fallback:** the NVIDIA API catalog key is configured, so answers switch to Nemotron 3 Super 120B when the GPU is unreachable. The switch was verified end to end locally; it was not exercised on the live site, to keep the GPU path serving.
- **Web research:** enabled (`gpt-6-luna`, daily cap 60). A news question returned the separate "Beyond the parliamentary record" block with 3 web sources.
- **TypeSafe Jev:** off on the live pilot; its shadow evaluation (below) ran locally.
- **Canary worker:** still running on GPU 1. At 19:21 UTC it had finished 11,144 of the 20,307 recordings in its current queue. Transcripts count below only after they are pulled back, validated and imported.

## Update — 23 September 2026

These counts supersede the archive-wide figures in the sections below; the validated-baseline snapshot contract that follows is unchanged.

| Measure | Value |
| --- | ---: |
| Declared sessions (1990–2026) | 185 |
| Sessions with official text | 134 (1999–2026; the official service has no digital transcripts for the 51 older sessions) |
| Official text passages | 1,140,943 |
| E5 semantic index | 1,140,943 passages / 1,141,140 vectors (H100, 597 s; int8 serving index verified by SHA-256) |
| Recording jobs | 221,752 |
| Validated Canary transcripts | 11,092 |
| Published machine-aligned video moments | 14,556 (none human-reviewed) |
| Profiles | 790 people; 254 of 254 current members with complete official profiles and vote histories |
| Hybrid retrieval evaluation | 40/48 on-topic passages vs 35/48 lexical on 8 topic questions |
| TypeSafe Jev shadow evaluation | 7/8 relations correct (jev-1.13.0, 604 ms) |


## Snapshot contract

Snapshot date: **22 September 2026**. Counts below were reproduced from the local validated public corpus and processing artifacts after the completed H100 batch was imported. They are not a live H100 worker counter and do not describe the entire history of Swiss Parliament.

<!-- session-status: {"passages":16224,"recordingJobs":3346,"e5Chunks":16241,"canaryReceipts":3327,"timingCandidates":4899,"timingRecordings":1738,"vssRecordings":9,"vssChunks":400,"humanReviewedTimings":0} -->

| Session | Official-text passages | Recording jobs | E5 chunks | Validated Canary receipts | Machine timing candidates | VSS | Human-reviewed timings |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 5213 — special session, 27–30 April | 2,469 | 492 | 2,471 | 492 | 920 across 320 recordings | 0 | 0 |
| 5214 — summer session, 1–19 June | 10,180 | 2,172 | 10,190 | 2,160 | 2,986 across 1,081 recordings | 9 recordings / 400 chunks | 0 |
| 5215 — autumn session, imported snapshot | 3,575 | 682 | 3,580 | 675 | 993 across 337 recordings | 0 | 0 |
| Additional imported records without a session ID | 0 | — | 0 | — | — | — | — |
| **Total** | **16,224** | **3,346** | **16,241** | **3,327** | **4,899 across 1,738 recordings** | **9 / 400** | **0** |

Run `npm run docs:status` from an operator checkout containing the ignored databases and manifests to reproduce these counts. `npm run docs:check` compares the committed marker with the same artifacts when they are available.

The archive-wide import is a separate, newer ledger: **121 of 185 declared sessions** are text-complete, producing **1,041,964 public embedding inputs** and **205,797 recording jobs**. Of those recording jobs, **5,618 are already known complete** and **200,179 are locally pending**. The immutable H100 handoff currently running covers the first 14 sessions—109,980 E5 inputs and 20,307 initial Canary jobs. E5 completed with 110,063 chunks. The one hundred and seven later imports form a next delta of 931,984 passages and 185,490 recording jobs. The latest SHA-256-verified active-worker checkpoint contained 2,280 provenance-valid transcripts; six empty or no-speech receipts were rejected. Alignment staging over all 5,607 validated receipts produced **7,988 machine candidates across 2,919 recordings**; none is labelled human-reviewed. Remote outputs are not counted as locally validated until they return through their respective validation/import paths.

The profile ledger contains **780 discovered people**, including **254 active officials**. **76 profiles are enriched** with official detail and a terminating full Voting-service query, **270 portraits are identity-verified**, and **704 profiles remain queued**. Active officials are processed before historical profiles; archive discovery can increase the total as older speakers appear.

## How to read the columns

- **Official-text passages** are normalized paragraphs from displayed-speaker records in the Official Bulletin. They are authoritative text for this product; procedural and non-displayed text is excluded from personal speech attribution.
- **Recording jobs** are queue entries derived from displayed speech records. Queued does not mean downloaded or processed.
- **E5 chunks** are normalized, 1,024-dimensional vectors from `intfloat/multilingual-e5-large`, revision `3d7cfbdacd47fdda877c5cd8a79fbcc4f2a574f3`. Long passages can produce multiple overlapping chunks.
- **Validated Canary receipts** passed local source/session/language/model/hash/duration checks before import into `public-processing.sqlite`. They are machine transcripts, not Official Bulletin replacements.
- **Machine timing candidates** match Canary word timings to official paragraphs. They still require media-availability and human timing review before being represented as accepted exact clips.
- **VSS** is a bounded visual-embedding pilot using Cosmos Embed1. It is separate from ASR and spoken-text alignment.
- **Human-reviewed timings** counts accepted reviewed candidates. No blanket human-review acceptance is recorded in this snapshot.

## Why some counts differ from old notes

The repository contains two kinds of processing checkpoint:

- Per-session `media-jobs.json` files retain small pilot downloads, ASR/VSS receipts and local stage transitions. For example, the session manifests mark 11 Canary jobs complete in total.
- `public-processing.sqlite` is the consolidated checkpoint imported from the completed resumable H100 worker. It contains 3,327 validated receipts: 492 for session 5213, 2,160 for session 5214 and 675 for session 5215.

Historical notes recorded the worker at 111, 251, 812 and 1,958 completed jobs at different times. Those figures remain useful as dated execution evidence but are not the current local imported snapshot. The final worker ledger contains 3,339 completed jobs and seven official-media 404 failures. Eleven older receipts lacked the source metadata required by the current importer, and one valid five-second media file contained no speech; none of those twelve receipts were promoted into the validated transcript database.

## Capability status

| Capability | Current state | Remaining acceptance |
| --- | --- | --- |
| Official parliamentary text | Imported, revisioned, searchable and source-linked for the stated snapshot. | Versioned refresh/reconciliation for changing sessions and broader archive coverage. |
| Current retrieval | FTS5 plus Nemotron-generated FR/DE/IT query terms. | Evaluate and intentionally integrate the E5 index; do not imply it already ranks production results. |
| Cited answers | Live Nemotron path implemented with isolated evidence calls, exact server-attached quotes and automated claim review. | Independent multilingual and semantic review over a larger adjudicated set. |
| Translation | Riva Translate path implemented with source preservation, cache binding and number/language gates. | Swiss-language review, broader terminology evaluation and durable service availability. |
| Recording ASR | A validated three-session baseline is published; an archive-wide H100 Canary worker is active and 5,607 receipts have passed the current local provenance contract. | Continue checksummed checkpoints, investigate official-media failures and process the remaining archive queue. |
| Video alignment | 4,899 machine candidates produced; selected machine-aligned examples can be shown with disclosure. | Human timing review and publication workflow. |
| Visual retrieval | Nine recordings / 400 chunks in the retained pilot. | Evaluate citizen value and failure modes before expanding. |
| Accounts | Email/passwordless flows, persistent encrypted sessions, saved material and MFA controls implemented. | Live provider, email-delivery and lifecycle acceptance. |
| Chamber explorer | Versioned 200-seat National Council and 46-seat Council of States snapshots. | Revalidate each refreshed official seating snapshot before publication. |
| Profiles | 780 discovered people are queued with active officials first; 76 have complete official detail/vote queries and 270 have verified portraits. | Continue official enrichment, preserve bounded pagination and distinguish historical from active office. |
| Private eligibility and community voting | Labelled interactive concepts only. | Protocol integration and independent security review; no official vote is cast today. |

## Known boundaries

- The autumn session was still underway when imported; the 5215 figures are a dated published-material snapshot.
- Imported roll calls cover only selected work. Missing records are not abstentions.
- Current party/group data must not be projected backward without dated evidence.
- Seven official media URLs returned 404 in the final H100 worker ledger.
- Public processing excludes private accounts, saved research, conversations and feedback.
