# Frontend data contract

The prototype is intentionally API-ready but does not require the live parliamentary pipeline to continue frontend work. Its current fixtures should eventually be replaced behind one data service without changing screen components.

## Minimum entities

- `Person`: id, name, party, canton, chamber, portrait URL
- `Debate`: id, business ID, title, chamber, session, date, video URL, duration, language, speakers
- `TranscriptSegment`: id, debate ID, speaker ID, start/end seconds, original text, translated text, confidence
- `EvidenceMoment`: id, transcript segment ID, quote, topic labels, relevance score, source metadata
- `Proposal`: id, title, stage, next event, lead department, timeline, related debate IDs, related vote IDs
- `Vote`: id, proposal ID, chamber, date, yes/no/abstained totals, result, member votes when available
- `AskResponse`: question, generated answer sections, citation evidence IDs, generation time, scope
- `DashboardSummary`: upcoming events, tracked proposals, followed entities, recent evidence, recent votes

## First integration endpoints

1. `GET /dashboard` — the signed-in user's explicit follows and summary cards.
2. `POST /ask` — answer plus evidence IDs; each citation must resolve to a source moment.
3. `GET /evidence/{id}` — quote, speaker, timestamp, confidence, and parent debate.
4. `GET /debates/{id}` — video metadata, speakers, chapters, and proposal link.
5. `GET /debates/{id}/transcript` — timestamped segments with optional translations.
6. `GET /proposals/{id}` — status, timeline, debates, votes, and next event.
7. `GET /search/evidence` — filters and ranked evidence moments for Investigate.

## Backend guarantees the UI depends on

- Stable IDs across Ask, Debate, Investigate, and Proposal Tracker.
- Every AI claim returns at least one resolvable evidence ID.
- Timestamps use seconds internally; the frontend formats them for display.
- Original language is always available; translations are labelled and optional.
- Machine-generated transcript confidence is exposed rather than hidden.
- Follows are explicit user choices. No political affiliation is inferred.

## Suggested integration order

Connect `/ask` and `/evidence/{id}` first because they power the demo's strongest interaction. Add debate/transcript data second, proposal status third, and personalized dashboard data last. Until an endpoint is ready, retain the fixture provider for that domain.
