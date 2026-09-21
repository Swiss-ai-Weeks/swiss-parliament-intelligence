# Content and debate reader — increment 18 September 2026

> Historical increment specification. Preserved for decision provenance; use the [current product specification](../../PRODUCT-SPEC.md) and [architecture](../../ARCHITECTURE.md).

Status: implemented locally; acceptance evidence below. This document defines this increment, not completion of the wider roadmap.

## Reader outcome

A visitor can find an original parliamentary passage, identify its speaker and recorded role, read adjacent paragraphs, and follow the official source without an account or a working GPU service. Keep the existing ivory, serif and muted-red visual direction.

## Requirements and acceptance

| ID | Required behavior | Verification |
| --- | --- | --- |
| READ-01 | Browse imported text chronologically, 20 paragraphs per page; paragraph 10 follows 9, not 1. | `server/tests/debate-reader.test.mjs` |
| READ-02 | Filter by session, speaker, original language and sitting date; literal phrase search in original text. | Store test and live API/browser checks |
| READ-03 | A proposal scope includes secondary business links recorded on a subject. | Store test |
| READ-04 | Context includes up to two preceding/following paragraphs from the same intervention. | Store test and browser check |
| READ-05 | Display original source, date, speaker and role; translations remain separately labelled. | Browser check |
| READ-06 | A session still underway is labelled as a dated snapshot, not a completed session. | Coverage UI |
| READ-07 | Timeline events link to their imported official records. Popular ballot results remain separate. | Proposal UI |
| DATA-01 | GPU batch inputs carry official download provenance and a media checksum. | Existing media/import validators |
| DATA-02 | Retain machine output separately; accepted timing candidates still require human review. | Canary receipt import |
| DATA-03 | Persist public source snapshots and outputs on the authorized compute host; exclude credentials and user accounts. | Public-only archive and remote checksum verification |

## Contract

`GET /api/parliament/read`: optional `business`, `person`, `session`, `language`, `date` (YYYY-MM-DD), `q` and `offset`. Returns `passages`, `total`, `offset`, `nextOffset` and speaker facets. Search is literal case-insensitive substring matching, not semantic retrieval; SQLite case folding is limited for non-ASCII characters. Dates currently follow stored official timestamps, which the existing importer normalizes to UTC.

`GET /api/parliament/context?id=<passage-id>`: returns selected ID and adjacent paragraphs from the same official intervention; unknown IDs return 404. Both routes read only the public parliamentary database and do not call AI providers.

## Content operations

Session ingestion uses cached, checksummed official API pages. Re-running a session resumes that frozen snapshot; it does not refresh ongoing proceedings. Until versioned refresh and reconciliation land, never describe a rerun as a fresh synchronization. Media, roll calls and text are separate coverage measures.

The private Launchpad host retains batch media, machine transcripts and VSS receipts in `/home/nvidia/swiss-parliament-intelligence`. Local authoritative text stays available when that host is unavailable. GPU 0 is reserved for existing interactive services; bounded Canary jobs run on GPU 1 alongside existing services.

## Remaining gates

Five unfamiliar reader tasks with real participants; independent language/timing review; complete e-ID proposal-to-ballot narrative and original-document inventory; resumable membership/portrait import; versioned session refresh, worker lock, bounded retries and durable failed-job ledger; supervised private tunnels with tested capability readiness. These are not certified by passing unit tests or successful GPU receipts. Broader historical import does not establish complete career vote histories.

## Development convention

Future increments should name the reader outcome, source schema, failure behavior, requirement IDs and acceptance evidence before implementation. Update this document or add a focused specification when behavior changes. Keep measured outcomes separate from planned capabilities.
