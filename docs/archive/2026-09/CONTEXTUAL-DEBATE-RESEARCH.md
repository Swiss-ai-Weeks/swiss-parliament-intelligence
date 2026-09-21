# Contextual debate research

> Historical implementation note. Preserved for provenance; use the [current product specification](../../PRODUCT-SPEC.md) and [architecture](../../ARCHITECTURE.md).

Implemented 18 September 2026.

- Text search requires all non-stopword terms in query order within a local span (80 characters between matched words). Normalization handles accents and terminal plurals. Words of at least five characters allow one insertion/deletion/substitution; approximate matches disclose the observed word. Short identifiers such as ADN are not fuzzed. Results return original-text highlight offsets and source/person/proposal identity. At most 20 results.
- Every result preserves the original quotation. Translation offers EN/FR/DE/IT in place through the existing NVIDIA translation endpoint. Stale translation responses are ignored after target or passage changes.
- Listen reads the translation with an available device voice, explicitly synthetic and separate from the original recording. Missing device voices report unavailable. ElevenLabs API key is absent; dubbing and synchronized translated audio remain unimplemented.
- Ask Cleisthenes passes the exact passage ID and research phrase. Switching between passages by the same person creates the correct new scope.
- Text-aligned video shows start and end, seeks to the beginning and pauses at the end. These are machine-aligned paragraph ranges, not verified timing for individual highlighted words. Missing alignments remain text-only.
- Advanced visual results are image previews, explicitly unverified for speech. Their offsets must not be used as proof of spoken relevance.

Acceptance: plural/accent and one-character typo retrieval; unrelated single-term result rejected; original highlight offsets; primary/secondary proposal and person scope; missing video handled; browser search, translation and passage-specific handoff. Further work: word-level alignment review, multilingual concept retrieval, server-side ElevenLabs integration and synchronized dubbing.

Verification: frontend production build, 41 backend tests, two API-client tests and four Sites packaging tests pass. Live preview confirms the original query highlights relevant original words and the passage-specific chat draft retains the research phrase. NVIDIA French-to-English translation completed in place. The in-app browser has no English device voice, so audio reports unavailable there; audible playback is not verified in this host. An ElevenLabs connection is needed for consistent audio in this preview.
