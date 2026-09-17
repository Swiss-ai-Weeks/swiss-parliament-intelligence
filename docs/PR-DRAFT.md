# Add the Swiss citizen intelligence pilot with evidence-linked NVIDIA processing

People need a readable route from a public issue to the original parliamentary evidence. This introduces the Midnight Vote Swiss Pilot while preserving the earlier interface at `/legacy`: historical dossiers, Cleisthenes source-linked chat, parliamentary research, profiles, saved evidence and briefings.

The pilot imports official parliamentary text and distinguishes originals from machine output. Server-side NVIDIA adapters support chat and full-passage translation. The video pipeline processes recordings with Cosmos embeddings and language-constrained Canary ASR. Users search aligned spoken evidence or separately labelled visual scenes and open the corresponding video moments.

Validation includes automated backend/frontend checks, a production build, live DE/FR/IT processing and translation evaluations, and browser verification of timestamped playback. Six recordings yielded 269 VSS chunks and 17 machine-aligned paragraph candidates. Human timing/translation review and full-session ingestion remain outstanding. Visual similarity is not evidence for political claims.

Secrets, account data, databases, downloaded media and raw provider outputs are excluded from Git. See `docs/SESSION-PIPELINE.md` and `docs/PILOT-RECAP.md` for reproduction and limitations. Intended destination: the user's own fork, pending selection. This draft has not been submitted upstream.
