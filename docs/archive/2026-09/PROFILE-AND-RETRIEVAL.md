# Profiles and source-aware questions — 17 September 2026

> Historical implementation note. Preserved for provenance; use [architecture](../../ARCHITECTURE.md), [status](../../STATUS.md) and the [product specification](../../PRODUCT-SPEC.md).

## Delivered

- Cleisthenes routes membership/background/contact questions to official structured member records, party-background questions to separately reviewed party material, and speech questions to multilingual Bulletin retrieval. Follow-ups retain resolved person/topic context; the previous question is no longer concatenated into the new query.
- The Socialist Party background contains three reviewed editorial summaries of its own primary description, labelled accordingly. These are not verbatim quotations, independent assessments, or Jessica Jaccoud’s individual policy platform.
- Jessica Jaccoud (10820): official portrait; membership and election dates; declared occupation/background; committee roles; parliamentary email; 3,968 individual Voting-service records. Original yes/no meanings and contemporary parliamentary group labels remain inspectable.
- Every existing directory profile can request an official profile/history import. Pagination stops only after an underfilled page, with a 20,000-record cap that fails before publishing partial results. Imports store raw response hashes and replace the enriched profile atomically. No automatic full-archive coverage claim.
- About / Votes / Write tabs. Vote-title and year filters, 20 rows per page. Contact links come from official PersonCommunication records; email is restricted to parliamentary addresses. No guessed social accounts.
- NVIDIA generates editable subject/body drafts. Copy or explicit email-client handoff only; no send endpoint and no sender identity invented.

## Reproduce

```powershell
node scripts/sync-person.mjs --person=10820
npm test
node scripts/evaluate-profiles.mjs
```

The API must be running for evaluation. It uses the existing server-only inference configuration. Inspect `artifacts/profile-evaluation.json` for actual model responses and timings. The rehearsed membership → party → climate → speech sequence returned the intended source types with live inference; observed latency was 1.6–11.5 seconds. These measurements are individual observations, not a percentile benchmark.

## Boundaries and next steps

This is checked, curated retrieval plus on-demand official API ingestion, not an unrestricted web-research agent. Only the Socialist Party’s background has been curated so far. Missing party material returns insufficient evidence rather than recycling speeches. Routing uses bounded multilingual rules; ambiguous follow-ups can still need a more explicit question. Vote questions direct users to exact history browsing; the assistant does not summarize a career from a few selected votes.

Expand party coverage using the same reviewed primary-source process. Add more official speech sessions separately; importing a person’s votes does not import all their speeches. An empty history for a Council of States member does not mean they never voted: the current Voting service covers National Council roll calls. No personal ideology, honesty, or stance-change score is inferred. Historical declared mandates without dates are explicitly labelled; no private residential contacts are imported into the product.

Official source: https://ws.parlament.ch/odata.svc/

Party primary source: https://www.sp-ps.ch/fr/le-ps-suisse-en-langage-simplifie/
