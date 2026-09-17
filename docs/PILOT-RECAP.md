# Swiss citizen pilot — recap, 17 September 2026

## Working now

- Responsive Midnight Vote Swiss Pilot, with the earlier team interface preserved at `/legacy`.
- Five historical federal dossiers, source-linked Cleisthenes chat, ordinary account adapter, saved evidence and briefings.
- 900 proposal records and 10,494 indexed paragraphs. Summer text covers 30 sittings and 242 speakers; autumn coverage and individual profile/vote histories remain selective.
- Real Nemotron chat on H100 GPU 0; Riva Translate and Cosmos embeddings on GPU 1. Inference is server-side, not local-device processing.
- Six DE/FR/IT recordings, 22.16 minutes: 269 real VSS chunks with raw vectors retained locally.
- Canary ASR with explicit source languages produces 17 accepted machine-aligned paragraph candidates (DE 1, FR 5, IT 11), up from two Italian candidates. Original Bulletin text remains primary; human timing review is pending. One German recording still yields zero candidates.
- Parliament's “Find a parliamentary moment” searches playable spoken evidence or separately labelled visual scenes. Visual matches never substantiate political claims. Visual queries are English; spoken search uses original-language terms. Existing multilingual chat retrieval remains separate.
- Full-passage machine translations preserve originals/citations. Language and number checks reject some bad outputs, including a known hallucinated motion number. Terminology/fluency still need Swiss-language review.

## Validation and limits

Initial live visual search took 0.86 seconds; the next API check took 0.77 seconds. These are small warm smoke tests, not latency guarantees. DE/FR spoken searches returned playable sources; an unrelated “purple elephant on Mars” query returned none. Browser inspection confirmed four visual players loaded at their returned 90, 165, 25 and 65 second positions. This tests playback mechanics, not human alignment accuracy or visual relevance.

VSS completion took 3.45–5.30 seconds per recording after upload. Download, transfer, initial loading and encoder compilation add time. Six of 2,172 queued recordings is a processing proof, not full-session video coverage.

Next: human timing/translation review; a reviewed positive/absent-scene video-search evaluation; a locked ingestion worker with retry/backoff, storage limits and model/media invalidation; broader current-session/vote coverage; user testing and presentation rehearsal. Visual search currently returns nearest scenes, possibly irrelevant, without a calibrated rejection threshold. ElevenLabs voice, selective-disclosure identity and stance-change analysis were not added.

## Repository direction

Upstream is `Swiss-ai-Weeks/swiss-parliament-intelligence`. Work is isolated locally on `feat/swiss-citizen-pilot`, based on `8d665e8` from the existing prototype branch.

Recommended: fork under the user's account, then open a draft PR inside that fork against the original prototype baseline. Keep upstream for fetching updates and submit focused reusable changes there only when the team wants them. This lets citizen branding, identity concepts and other pilot choices evolve independently. Publication awaits the user's repository choice.

Git excludes `.env`, keys, databases, provider outputs and downloaded media. `scripts/package-demo.mjs` creates a separate local bundle of public records, media and processing receipts, excluding accounts/credentials. The bundle is not automatically published. Offline spoken search/playback work; fresh visual queries and translations require the GPU services.
