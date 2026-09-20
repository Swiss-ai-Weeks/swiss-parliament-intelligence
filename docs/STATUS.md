# Current implementation and corpus status

## Snapshot contract

Snapshot date: **18 September 2026**. Counts below were reproduced from the local validated public corpus and processing artifacts. They are not a live H100 worker counter and do not describe the entire history of Swiss Parliament.

<!-- session-status: {"passages":16471,"recordingJobs":3346,"e5Chunks":16488,"canaryReceipts":969,"timingCandidates":1460,"timingRecordings":502,"vssRecordings":9,"vssChunks":400,"humanReviewedTimings":0} -->

| Session | Official-text passages | Recording jobs | E5 chunks | Validated Canary receipts | Machine timing candidates | VSS | Human-reviewed timings |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 5213 — special session, 27–30 April | 2,469 | 492 | 2,471 | 0 | 0 | 0 | 0 |
| 5214 — summer session, 1–19 June | 10,180 | 2,172 | 10,190 | 294 | 467 across 165 recordings | 9 recordings / 400 chunks | 0 |
| 5215 — autumn session, imported snapshot | 3,575 | 682 | 3,580 | 675 | 993 across 337 recordings | 0 | 0 |
| Additional imported records without a session ID | 247 | — | 247 | — | — | — | — |
| **Total** | **16,471** | **3,346** | **16,488** | **969** | **1,460 across 502 recordings** | **9 / 400** | **0** |

Run `npm run docs:status` from an operator checkout containing the ignored databases and manifests to reproduce these counts. `npm run docs:check` compares the committed marker with the same artifacts when they are available.

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
- `public-processing.sqlite` is the consolidated checkpoint imported from the later resumable H100 worker. It contains 969 validated receipts: 294 for session 5214 and 675 for session 5215.

Historical notes recorded the worker at 111, 251, 812 and 1,958 completed jobs at different times. Those figures remain useful as dated execution evidence but are not the current local imported snapshot. Session 5213 was queued but has no consolidated Canary receipt in this snapshot.

## Capability status

| Capability | Current state | Remaining acceptance |
| --- | --- | --- |
| Official parliamentary text | Imported, revisioned, searchable and source-linked for the stated snapshot. | Versioned refresh/reconciliation for changing sessions and broader archive coverage. |
| Current retrieval | FTS5 plus Nemotron-generated FR/DE/IT query terms. | Evaluate and intentionally integrate the E5 index; do not imply it already ranks production results. |
| Cited answers | Live Nemotron path implemented with isolated evidence calls, exact server-attached quotes and automated claim review. | Independent multilingual and semantic review over a larger adjudicated set. |
| Translation | Riva Translate path implemented with source preservation, cache binding and number/language gates. | Swiss-language review, broader terminology evaluation and durable service availability. |
| Recording ASR | Resumable Canary worker and validated receipt import implemented. | Complete remaining queue, investigate explicit failures and preserve refreshed-media invalidation. |
| Video alignment | 1,460 machine candidates produced; selected machine-aligned examples can be shown with disclosure. | Human timing review and publication workflow. |
| Visual retrieval | Nine recordings / 400 chunks in the retained pilot. | Evaluate citizen value and failure modes before expanding. |
| Accounts | Email/passwordless flows, persistent encrypted sessions, saved material and MFA controls implemented. | Live provider, email-delivery and lifecycle acceptance. |
| Chamber explorer | Versioned 200-seat National Council and 46-seat Council of States snapshots. | Revalidate each refreshed official seating snapshot before publication. |
| Private eligibility and community voting | Labelled interactive concepts only. | Protocol integration and independent security review; no official vote is cast today. |

## Known boundaries

- The autumn session was still underway when imported; the 5215 figures are a dated published-material snapshot.
- Imported roll calls cover only selected work. Missing records are not abstentions.
- Current party/group data must not be projected backward without dated evidence.
- Six or seven unavailable official media URLs appear in different historical worker checkpoints; consult the corresponding dated report rather than combining failure counts across snapshots.
- Public processing excludes private accounts, saved research, conversations and feedback.
