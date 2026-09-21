# Conversation and source inspection — 18 September 2026

> Historical checkpoint. Preserved for implementation provenance; use [current status](../../STATUS.md), [product specification](../../PRODUCT-SPEC.md) and [architecture](../../ARCHITECTURE.md) for current guidance.

## User outcome

Start with a compact topic suggestion, continue an earlier conversation, and inspect the original evidence behind an answer without losing the conversation.

## Acceptance contract

- Topic chips use short labels and prepare editable questions rather than immediately sending them.
- A generic conversation has no all-imported-evidence banner. Explicit source scope and replay status stay visible; one concise footer explains AI fallibility and device storage.
- Navigation, language changes and compact/expanded transitions do not clear messages.
- Recent chats persist on this browser/device: at most 20 conversations and 40 messages per conversation. Users can resume or delete them. No account/cloud synchronization is implied. Storage failures show an explicit warning.
- A pending answer belongs to the conversation that submitted it, even if the user opens another chat. Deleted conversations cannot be recreated by a late response.
- Citations open a separate source inspector: speaker identity, available official portrait, current profile distinguished from dated speech, proposal, original text and adjacent paragraphs.
- A verified machine alignment shows the start/end range and starts playback at that range. Playback pauses at its end, with a replay action. Missing timings remain explicit; no guessed offsets.
- Follow-ups prepare editable questions scoped to the selected passage or identified person. Passage scope is enforced during retrieval and included in the answer cache key.

## Implementation evidence

Sarah Wyss example: official Bulletin paragraph `377394-2`, business `20260031`, 17 June 2026. Downloaded the official 305-second recording, transcribed with NVIDIA Canary on GPU 1, retained checksummed output. Candidate timing: **79.92–111.20 seconds**, 90% monotonic token overlap. Bulletin editing changes the initial spoken “Diese” to “Die”; alignment now permits a single initial-word substitution while retaining unique five-token interior/end anchors, length limits, ordered timestamps and at least 85% overlap. Human timing review remains pending. Browser playback visibly started at 1:20.

Portrait correction: public profile IDs and portrait filename numbers differ. The official councillor service maps Sarah's ID 4318 to number 3214. Importers now resolve this mapping and validate an image response. 270 of 271 imported identities have verified responding portrait URLs; one remains a text fallback. Source mapping URL, check time and portrait number are retained. The bounded portrait-only importer preserves enriched profile and vote data.

Relevant files: `frontend/src/pilot/Cleisthenes.jsx`, `CitationInspector.jsx`, `chat-history.mjs`; `server/debate-reader.mjs`, `parliament-ai.mjs`, `official-portrait.mjs`; `scripts/sync-portrait.mjs`.

Validation: 37 backend tests and six frontend API/packaging checks passed; production build passed. Browser checks exercised compact suggestions, real live answer citations, the official portrait, video seek, original context a source-scoped follow-up, history restoration after collapse/reload, and a 390px mobile layout. Device history is a pilot feature, not authenticated account history; conversations from before this change cannot be recovered retrospectively.

