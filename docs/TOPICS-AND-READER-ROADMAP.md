# Topics, debates and people — next product increment

## Direction
Rename Dossiers to **Topics & votes** (FR: Thèmes et votations). A topic explains a public question; a parliamentary proposal is a dated legal/procedural record inside that topic. Keep those concepts separate from popular ballots. Historical results must never look like upcoming votes.

## What we observed
The public Parlacta dashboard (https://app.parlacta.ch/dashboard, inspected 17 September 2026) exposes open consultations, upcoming events over seven days, recent affairs and recent votes. Navigation separates calendar, affairs, people, consultations and advanced search. The anonymous view advertises follows, saved-search alerts and team position statements; those authenticated functions were not tested. Its national/cantonal/municipal breadth is useful, but we should not reproduce an equally dense dashboard or imply equivalent data coverage.

## Proposed reader journey
1. **Understand:** a plain-language question, concise explanation, jurisdiction and dated status. Show “being considered by Parliament”, “scheduled popular vote” and “past decision” as distinct states.
2. **What changed:** a chronological account of verified events, chamber decisions and next officially announced step. Separate an expected step from a confirmed date.
3. **Read the debate:** source documents and interventions, grouped by sitting and speaker. Search the text, filter by date/language/speaker, then read adjacent paragraphs. Video is an optional “Watch this extract” action on the same passage.
4. **Who said what:** attributed arguments with original text, date, role and translation label. Committee spokespersons are not automatically expressing their own position.
5. **Keep or share:** save passages, export a source-linked briefing, copy an official link, or draft a message to a verified public contact.

## Delivery order and completion gates
- **This PR:** simpler names/navigation, useful text matches without video, a bounded overview retrieval path, clear insufficient-evidence answers, official profile basics import and portraits where the official URL responds. Keep visual similarity under Advanced video tools.
- **Next 1–2 days:** one complete e-ID topic with proposal-to-ballot timeline, original documents and speaker-indexed transcript reading. Gate: five unfamiliar tasks completed without explaining our internal AI terminology; every event links to its official record.
- **Next ingestion increment:** resumable official membership and portrait import, per-person last-updated metadata, full canton names, chamber, party, committee memberships and elected/left dates. Individual votes remain a separate paginated job with explicit coverage; do not download every career history on page load. Gate: a representative sample across chambers/cantons, missing-photo fallback and source attribution.
- **Reliability alongside it:** supervised private provider connections, actual readiness checks for chat/translation/video, resumable bounded media batches, retries and a durable failed-job log. Gate: text browsing survives all GPU services being offline; each live capability reports tested readiness, not just configured environment variables.
- **Then expand to the other four topics:** use the same content schema and reviewed linking process. Add current/cantonal material only from verified official feeds. Do not label a partially imported session complete.

## Current limits and reproduced failures
17 September: 10,494 official text paragraphs; six processed recordings, 269 visual chunks and 17 machine-aligned paragraph candidates. Human timing review remains pending. The video service connection had dropped; restoring its private SSH tunnel recovered a live search (269 indexed chunks, four exploratory results). This is not persistent supervision.

The “president” query had 20 text matches but no timed video; the old UI hid all 20. Search now returns them as readable text. Generic scoped overview prompts previously searched for filler words: they now sample up to three available passages, preferring different speakers. This is a source-limited overview, not a comprehensive debate summary. Other unsupported questions still fail closed.

A live overview of proposal 25.4623 returned three cited claims in 5.8 seconds. An answer with no claims now says it cannot answer, rather than displaying only a collection disclaimer. Recorded evaluations do not replace language/content review.

## Data and identity rules
Use official portraits with source URLs; do not invent images or assume all historic portraits exist. Preserve prior enriched fields during lightweight imports. Membership at a past vote belongs to that date. Party background is not a person's inferred ideology. Stance-change analysis remains paused. Contact messages remain editable drafts; nothing is sent automatically.

Directory import verification: 271 existing people enriched from official membership records; 77 official portrait URLs responded successfully. The other 194 retain a text-only identity pending portrait resolution. No all-portrait completion claim. Re-run with `node scripts/sync-directory.mjs`; raw responses remain ignored in data/parliament/raw.
