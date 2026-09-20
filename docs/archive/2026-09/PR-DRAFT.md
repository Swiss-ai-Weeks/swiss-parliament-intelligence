# Swiss citizen pilot: source-linked AI, debate reading and official profiles

> Historical pull-request draft. Preserved for delivery provenance; use the [README](../../../README.md) and [current status](../../STATUS.md).

This PR adds the Midnight Vote Swiss Pilot while retaining the previous interface at `/legacy`. Citizens can understand five historical ballots, inspect original parliamentary passages, ask Cleisthenes source-linked questions, explore public representatives and save/export evidence.

The reader journey uses Parliament / Topics & votes / Saved, with Reading and Research modes inside a topic. Debate search now returns matching text even when no video has been aligned: the reported `president` query returns 20 readable passages instead of an empty video result. Scoped overview prompts retrieve available passages directly, and empty answers explain their limitation instead of showing only a coverage disclaimer. Experimental image search is behind advanced controls.

## AI and data
- Server-side NVIDIA adapters for chat, translation, Canary ASR and Cosmos video embeddings; resumable imports and source/hash provenance.
- Official profiles, canton/chamber/party fields, verified portrait links and dated vote records. A lightweight directory sync enriched 271 people locally; 77 portrait URLs passed validation. Detailed vote histories are loaded separately.
- Six recordings yielded 269 visual chunks and 17 machine-aligned paragraph candidates. Text coverage is much larger: 10,494 paragraphs. These are snapshots, not complete archive coverage.
- Supabase accounts and account-owned saved material; optional private identity remains a labelled concept.

## Validation
- 32 backend tests, including unaligned text retrieval and scoped-overview regression checks.
- Six frontend/API/packaging tests and production build.
- Live local verification: scoped proposal 25.4623 overview returned three cited claims in 5.8 seconds; restored NVIDIA video connection returned four exploratory matches from 269 chunks.
- Browser checks of navigation, contextual chat and the revised reading flow.

## Remaining work
Human translation/timing review, robust provider supervision, wider media coverage, missing portraits and richer linked-document topic pages remain open. Visual similarity cannot establish what was said or whether a described event occurred. Voice and stance-change analysis are not delivered here.

Secrets, account data, SQLite databases, downloaded media and raw provider outputs are ignored and excluded. The repository contains import scripts and a reproducible runbook; a fresh clone does not contain the local parliamentary corpus or live GPU access. See `docs/USER-GUIDE.md`, `docs/TOPICS-AND-READER-ROADMAP.md`, `docs/SESSION-PIPELINE.md` and `docs/PILOT-RECAP.md`.
