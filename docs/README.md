# Developer documentation

This index separates current implementation truth from product direction, operating instructions, research and historical delivery notes.

## Start here

1. [Project README](../README.md) — product purpose, user journey and a two-minute technical overview.
2. [How AI is used in Cleisthenes](AI-IN-CLEISTHENES.md) — every AI component: technology → feature → outcome, and what each is never allowed to do.
3. [Architecture and data provenance](ARCHITECTURE.md) — data sources, request paths, AI responsibilities and trust boundaries.
4. [Current implementation and corpus status](STATUS.md) — dated coverage, validation and known gaps.
5. [Session, recording and GPU pipeline](SESSION-PIPELINE.md) — repeatable ingestion and processing stages.
6. [Operations and deployment](OPERATIONS.md) — local runtime, private GPU services, release, backup and recovery.

## Product and user experience

- [Cleisthenes product proposal](CLEISTHENES-PROPOSAL.md) — proposed product hierarchy, positioning, UX programme, data-completeness contract and submission plan.
- [Cleisthenes research answer experience](CLEISTHENES-ANSWER-EXPERIENCE.md) — coherent long-form answers, research-process summaries, single-language output and typed evidence actions.
- [Submission sprint and product roadmap](SPRINT-2026-09-22-SUBMISSION.md) — two-day priorities, model responsibilities, acceptance criteria and the production horizon.
- [Product specification](PRODUCT-SPEC.md) — current scope, journeys, non-goals and acceptance principles.
- [User guide](USER-GUIDE.md) — citizen-facing navigation and evidence interpretation.
- [Demo and user test](DEMO-AND-USER-TEST.md) — rehearsal flow and manual acceptance tasks.
- [Authentication provider checklist](AUTH-PROVIDERS-CHECKLIST.md) — external configuration and live acceptance still requiring operator access.

## Engineering and operations

- [Contribution and branch policy](../CONTRIBUTING.md)
- [Architecture and data provenance](ARCHITECTURE.md)
- [Session pipeline](SESSION-PIPELINE.md)
- [Operations](OPERATIONS.md)
- [Status](STATUS.md)
- [Environment template](../.env.example)

Use `npm run docs:check` after editing or moving documentation. Operators with the ignored public-processing artifacts can reproduce the status table with `npm run docs:status`.

## Research

The [`research/`](research/) directory contains product, market and public-system research. Research informs the product but is not proof that a capability is implemented.

- [Competitive landscape](research/COMPETITIVE-LANDSCAPE.md)
- [Parliament intelligence update](research/PARLIAMENT-INTELLIGENCE-UPDATE.md)
- [Swiss voting and NFC](research/SWISS-VOTING-AND-NFC.md)

## Historical record

Date-stamped implementation notes, benchmarks, design explorations and release checkpoints are preserved under [`archive/2026-09/`](archive/2026-09/). They describe what was known at a particular checkpoint and may be superseded by the canonical documents above.

Do not use an archived progress count as current status. Do not remove archived material merely because it has been consolidated; it remains useful provenance for decisions and measured experiments.
