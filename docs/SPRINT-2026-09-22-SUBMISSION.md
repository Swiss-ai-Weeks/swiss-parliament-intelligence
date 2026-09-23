# Cleisthenes submission sprint and product roadmap

**Sprint window:** two days. **Product horizon:** continued production work after the submission. This plan is outcome-driven; it is not a claim that the complete historical recording archive can be processed in two days.

## Strategy context

- **Hackathon outcome:** demonstrate a reliable question → reasoned answer → exact public source journey, with NVIDIA processing doing work a user can see and verify.
- **User problem:** Swiss civic evidence is fragmented across languages, records and long recordings; the current answer surface is too short and visually disconnected.
- **Product direction:** Cleisthenes is the civic AI companion. Midnight remains the privacy/selective-disclosure layer for future participation.
- **Technical constraint:** official text can be imported faster than decades of video can be downloaded, transcribed, aligned and reviewed. Coverage must therefore be published by stage and archive boundary.

## Two-day committed outcome

By submission, Cleisthenes should answer a broad parliamentary question in the requested language, show a coherent source-linked explanation, open the exact official passage and—where a validated alignment exists—open the corresponding recording moment. The application must expose an archive coverage ledger rather than implying that missing sessions or media are complete.

## Workstreams and acceptance

| Priority | Initiative | User outcome | Submission acceptance |
|---|---|---|---|
| P0 | Archive foundation | Users can search beyond three hand-picked sessions and see what is actually covered. | Official session discovery creates a versioned boundary, resumable text queue and per-stage coverage. Existing session import remains the worker. |
| P0 | Reliable research answer | Users receive one coherent explanation rather than disconnected claim boxes. | One requested language; answer has summary, developed reasoning, nearby citations and a visible limitations/research note. |
| P0 | Evidence actions | Users can verify a sentence without losing context. | Each citation opens the passage; aligned sources open the recording time; unavailable media is labelled, not hidden. |
| P0 | Demo resilience | The core flow does not collapse when a model fails. | Forced Nemotron/translation/video outages return retrieved sources or a specific recovery state. |
| P1 | Hybrid retrieval | Relevant evidence is found despite vocabulary and language differences. | Evaluate lexical + multilingual E5 fusion against the current retrieval set before enabling it by default. |
| P1 | Jev shadow decisions | We measure whether a specialized decision model improves evidence gating without risking the demo. | Jev decisions are recorded beside—not substituted for—the existing reviewer; no response changes until thresholds pass. |
| P1 | Citizen-first navigation | Parliament and Explore feel like part of Cleisthenes, not separate databases. | Loading/error/partial states are distinct; duplicated composers are removed from the tested path. |
| P1 | Profile coverage backlog | People pages disclose which official profile stages are complete. | Public profile ledger reports directory, biography/history, verified portrait and complete individual roll-call query separately. |

## AI responsibility map

| Component | Role | Must not do |
|---|---|---|
| Deterministic application code | Source IDs, exact quotes, permissions, archive coverage, dates, policy and failure handling. | Delegate identity, provenance or policy decisions to a model. |
| NVIDIA multilingual E5 | Candidate recall across languages and paraphrases. | Declare that a passage supports a claim. |
| NVIDIA Nemotron Nano 9B v2 | Source-bounded query expansion and answer synthesis. | Answer from model memory or invent citations. |
| NVIDIA Canary 1B v2 | Recording transcription and word timings used to propose alignments. | Replace the Official Bulletin or label timings human-reviewed. |
| NVIDIA Riva Translate 4B | On-demand translation while preserving the source text. | Change the legal/factual meaning silently. |
| NVIDIA Cosmos Embed1 | Experimental visual-scene retrieval for relevant video moments. | Prove that words were spoken or a claim is true. |
| Jev | Bounded classification, routing and evidence-support decisions, initially in shadow mode. | Write prose, perform date/count arithmetic, create a political truth score or process private user data. |

Jev's first implemented candidate is sentence-level evidence review because the existing system already has a typed accept/reject boundary. Code continues to enforce allowed source IDs and exact quotations. Jev evaluates the public claim/source relation as `supports`, `contradicts` or `says_nothing`; shadow mode does not alter the answer. A typed model result is a signal, not policy.

## Sequence

### Day 1 — corpus and answer contract

1. Discover the declared Swiss Parliament session range and publish the archive manifest.
2. Start the resumable official-text queue; continuously hand new recording jobs to the H100 pipeline.
3. Add the coverage endpoint and make the UI distinguish text, media, ASR, embedding and alignment completeness.
4. Implement the coherent answer contract and single-language gate.
5. Add Jev's provider-neutral shadow interface and evaluation receipts; keep it off by default.

### Day 2 — experience and proof

1. Render the longer answer with inline citations and a focused passage/video drawer.
2. Evaluate hybrid retrieval and enable it only if it beats lexical retrieval on the fixed question set.
3. Test desktop/mobile, keyboard use, slow loading and forced provider failures.
4. Freeze a coverage snapshot, demo dataset and five repeatable questions.
5. Rehearse the narrative: problem, Cleisthenes, exact evidence, NVIDIA pipeline, Midnight privacy direction, honest boundary.

## Roadmap — Now / Next / Later

| Stage | Initiative | Outcome | Metric | Notes |
|---|---|---|---|---|
| Now | Submission reliability and archive ledger | A credible, repeatable evidence journey | 5/5 demo questions complete without unsupported claims | Two-day commitment |
| Now | Official-text archive expansion | Broader question coverage | imported sessions / declared sessions | Queue is resumable; publish failures |
| Next | Historical H100 media processing | Exact recording moments across more sessions | validated receipts and reviewed alignments / recording jobs | Weeks, not two days |
| Next | Evaluated hybrid retrieval and Jev gate | Better recall with fewer unsupported sentences | retrieval recall and sentence-gate precision/recall | Promote only from recorded evaluation |
| Next | Parliament/Explore information architecture | Citizen-readable discovery | task completion and source-open rate | Use the existing UX audit |
| Later | Production hardening | Safe sustained public use | SLOs, accessibility, privacy/security review | Includes observability and abuse controls |
| Later | Midnight participation | Minimal-disclosure participation | protocol-specific proof and consent acceptance | Separate from research; never imply an official vote |

## Dependencies and risks

- Swiss Parliament endpoint stability, changed/404 media URLs and source pagination can slow ingestion; cached checksummed snapshots and resumable session progress limit rework.
- Full historical video processing is bounded by download availability, storage, H100 time and human review. The submission must never call a queued archive complete.
- Jev's current HTTP contract is implemented and unit-tested, but a live API-key evaluation and corpus-specific adjudication are still required. The integration remains server-side and in shadow mode until those gates pass.
- The public corpus, processing databases and account data must remain separate. Jev receives only bounded public evidence during evaluation.

## Definition of done for the submission

- `npm run archive:discover` writes an official boundary, session manifest and pending text queue.
- `npm run archive:import:text -- --limit=N` processes that queue sequentially, preserves each session's checkpoints and continues past a failed session; omit the limit for the full declared queue.
- `npm run profiles:backlog` publishes ordered profile gaps, and `npm run profiles:enrich -- --limit=N` fills official details, memberships, safe public contacts and roll-call history with per-profile failure receipts.
- `npm run evaluate:typesafe` runs the synthetic bilingual claim/source gate after `TYPESAFE_API_KEY` is configured; keep `TYPESAFE_MODE=shadow` until corpus-specific results justify enforcement.
- The API returns aggregate and per-session text/media/ASR/embedding/alignment coverage.
- Every answer is entirely in the requested language and every material factual sentence has a resolvable public source.
- Opening a citation keeps the conversation visible and shows exact passage context; validated timings expose a video action.
- No model outage produces a blank screen or fabricated answer.
- README, UI and demo consistently call the product **Cleisthenes** and describe Midnight as the privacy layer.
- The demo states the declared archive boundary, imported count, processing count and known gaps.
