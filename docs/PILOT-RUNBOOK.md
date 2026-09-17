# Midnight Vote — Swiss Pilot

Implemented 17 September 2026. The default UI is the citizen pilot; `/legacy` retains the earlier application. Existing hosting files remain intact. The API and SQLite database require a persistent single-instance Node host: publishing only the static frontend does not deploy the backend.

## Local operation

Node 24 is installed. From the repository root, `npm start` runs the API on 4318. From `frontend`, `npm run dev -- --host 127.0.0.1` runs Vite on 5173. The API is also capable of serving the production frontend directly after `npm run build` in `frontend`; set `PUBLIC_ORIGIN` to the actual origin. Keep the server bound to loopback for this local demo.

`.env` is ignored. The pilot Supabase project is `qtrgnmdxpigxgsmwzkcl`, Midnight Vote Swiss Pilot, tomas.cardano, Zurich, created at the user-confirmed $0/month quote. Public reading requires no account. Email confirmation is enabled. Sessions are opaque HttpOnly cookies; the API revalidates the Supabase user on protected operations. Saved passages are keyed by authenticated user ID. Sessions expire after at most an hour; sign in again. Server restart also clears sessions. Real user signup/email delivery remains a manual acceptance check; configure allowed confirmation redirects for the eventual deployed origin.

## NVIDIA connection

The authorized task key is in ignored `data/pilot-launchpad-key`; never include it in a bundle or repository. Registered public-key fingerprint: `SHA256:n3sGmWwwEKQJMBxz74QA//8d+V4LKzgkry+ME6lUKfs`.

From this repository, reconnect the private model tunnel with:

```powershell
ssh -N -i data/pilot-launchpad-key -o IdentitiesOnly=yes -o BatchMode=yes -o UserKnownHostsFile=data/launchpad-known-hosts -L 127.0.0.1:4319:127.0.0.1:30081 -p 12516 nvidia@global.prd.ga.launchpad.nvidia.com
```

The current API uses `http://127.0.0.1:4319/v1` and `nvidia/nvidia-nemotron-nano-9b-v2`. This private tunnel does not expose a public inference endpoint. `npm run probe:nvidia` checks configured access. The shared deployment was inspected without restarting its containers. Two H100 NVL GPUs were present; GPU0 was substantially occupied. The isolated ASR run used GPU1.

Actual French transcription used existing NVIDIA NeMo Parakeet `nvidia/parakeet-tdt-0.6b-v3`, not Riva. Raw output is `artifacts/nvidia-parakeet-fr.json` (31 segments, approximately 225 seconds). No automated Romansh claim is made.

The 90-second VSS spike uploaded and finalized successfully. `artifacts/vss-upload.json` and `vss-complete.json` preserve actual outputs. Completion reports `chunks_processed: 0`: VSS analysis/embeddings are NOT demonstrated. The current profile has optional downstream processing; confirm those services and GPU budget before enabling another profile. Do not replace the team's running deployment. Active repository: `/home/nvidia/swiss-parliament-intelligence/video-search-and-summarization` on the node. The older colleague guide is contextual material, not an executable runbook.

## Evidence and import

Five historical ballots have official source links and explicitly editorial EN/FR summaries. Metadata and text live in `server/catalog.mjs`; imported evidence is preserved on restart. DE/IT/RM dossier summaries/navigation exist, with English fallback disclosed for remaining detailed UI text. Independent language review is outstanding.

Four e-ID videos are linked by the official publisher at https://www.eid.admin.ch/en/abstimmungsvideo-zur-e-id-ist-veroeffentlicht-e . They are Federal Council explainers, NOT parliamentary debate footage. Their original DE/FR/IT/RM publisher captions are cached in `data/imports`. Local H.264/AAC video copies retain the original timeline. One opening caption passage per language is indexed, with stable SHA-derived IDs and source URL. Viewing the whole clip does not imply its full transcript was ingested. The French machine transcript is retained separately. Confirm redistribution terms before distributing media outside the local pilot.

`node scripts/prepare-official-clips.mjs` prepares manifests from cached captions and measured ffprobe durations. `node scripts/import-evidence.mjs <manifest>` validates provenance, declared duration, ordered timestamps and languages before import. Already imported media is rejected. The generic importer trusts the operator's declared duration: verify it with ffprobe and review the actual recording before using another manifest.

To complete the flagship, add a source-verified 10–20-minute parliamentary extract with speaker identities and reviewed transcript. The existing shared parliamentary sample lacks its original source URL and is deliberately excluded from public evidence.

## AI and failures

Four bounded actions retrieve only the selected dossier. Narrow unsupported question families refuse before inference. JSON-schema output binds citation IDs and original quotes to supplied records. This checks citation mechanics, not semantic entailment: human review remains necessary. Machine translations are shown as AI output; editorial translations and publisher captions have separate labels.

Provider failures return visible errors. There is no silent model-to-replay fallback. Set `DEMO_REPLAY_FILE=artifacts/live-evaluation.json` only for an explicit rehearsal/replay; captured question, action and language must match exactly. UI labels recorded answers. Remove that variable for live mode. Remove inference configuration for explicitly labelled prepared editorial extracts.

## Verification and rehearsal

`npm test` verifies ownership, session expiry/logout, API scope/origin boundaries, citation rejection and provider failure. `npm run evaluate` runs 15 supported and five unsupported frozen retrieval cases. `node --env-file=.env scripts/evaluate-live.mjs` adds actual inference latency/results and multilingual action checks. Reports retain failures; status/citation passes do not establish answer quality. Initial and prompt-only reports are retained alongside the latest report.

Frontend validation: `npm run build`, `npm run test:api`, `npm run test:sites` from `frontend`. Browser checks cover desktop and a 390px mobile viewport. Test a real confirmed Supabase account separately. Do not present mocked authentication tests as proof of email delivery.

Rehearse: open e-ID → compare attributed arguments → ask “What does the official video say?” → inspect its citation → play the passage → switch among official language clips → Research view → select evidence → export cited Markdown → optional identity concept. Historical dates remain visible. Identity is a walkthrough only; no passport data, proof, or voting submission is collected.

`npm run export:evidence` exports public evidence and its checksum. After a production frontend build, `node scripts/package-demo.mjs` creates `artifacts/demo-bundle` with static app, public-only SQLite, local media and explicitly recorded responses. It excludes saved interests, Supabase credentials and SSH keys. Run `npm start` within that folder using Node 24, then open localhost:4318. Stop the live API first or use another port. No installation or GPU is required for the replay bundle.

## Remaining acceptance gates

- Source-verified long parliamentary flagship; VSS analysis and Riva service remain incomplete.
- Independent review of material claims/translations; multilingual UI polish beyond EN/FR.
- Real confirmed-account ownership/logout/expiry checks with two users.
- Three Swiss citizen trials and one professional briefing trial, recorded by actual participants.
- Screen-recorded walkthrough and deployed HTTPS environment; local prototype is not public deployment.
- Four-hour identity integration attempt only after core acceptance; currently deliberately a concept.

Feature freeze remains 22 September; 23 September is presentation contingency. Cut live identity and additional controls before weakening source verification.

Final 17 September check: 40/40 live status/citation cases passed after isolating generation by source record. The offline bundle served recorded responses with the recorded-replay label and delivered local video byte ranges (HTTP 206). French desktop and Romansh mobile playback visibly started at the annotated five-second passages. Independent semantic review and physical-device timing trials remain outstanding.

## Parliamentary explorer — 17 September implementation

Open `/?view=parliament`, or use the Parliament navigation item. The new view exposes real official proposals, public representatives, timelines, vote records and attributed Bulletin passages. 101 proposals, 13 e-ID events, four roll calls / 800 individual decisions, 254 current membership records and 247 speech paragraphs were imported. Members include the Federal Council; not all are MPs. Current proposal metadata is a snapshot, not an upcoming ballot feed. Only e-ID has a populated debate/vote history in this slice.

Commands:

```powershell
npm run sync:parliament
node scripts/sync-parliament.mjs --business=20230073 --recent=100
node scripts/sync-parliament.mjs --cached=true
```

The cache command rebuilds from the last manifest's exact query URLs and validates raw hashes. It does not refresh official data. Raw responses live in ignored `data/parliament/raw`, the run manifest in `data/parliament/last-run.json`, and the searchable public database in `data/parliament.sqlite`. Speech replacement is transactional so failed imports retain the prior speech index. Broad Voting queries timed out; the importer now queries each vote ID. This is a bounded importer, not a scheduled or full-archive backfill job.

The new `/api/parliament` API supports business/person detail, passage search, scoped questions and guarded comparison. Retrieval is lexical and works best in source languages. Text snippets excluded when DisplaySpeaker is false or language of speech is absent are retained in raw snapshots, but not attributed as speeches. Original source links use SubjectId and TranscriptId; no video offsets are invented.

Real NVIDIA output is preserved in `artifacts/parliament-live-spike.json` and `artifacts/parliament-evaluation.json`. Five new status/citation smoke cases passed (two supported, three unsupported/empty-scope); supported answers took about 4–19 seconds, and a separate first request took 22 seconds. This is not a semantic accuracy score. Review of the outputs showed that generated text can repeat a speaker's first-person wording; the UI therefore always displays the source speaker/date beside each generated point. Stance comparison remains blocked until role/version review; no personal integrity labels.

The offline bundle includes the public parliamentary database and these processing artifacts. Its archived chat replay still covers the original dossier evaluation only: unrecorded parliamentary questions refuse in replay mode. Raw paragraph search and imported vote histories remain available without a GPU. The ZIP must be regenerated after rebuilding the bundle.

See [competitive findings and next ingestion stages](research/PARLIAMENT-INTELLIGENCE-UPDATE.md). Remaining gates: genuine parliamentary video alignment, broader/resumable ingestion, semantic retrieval evaluation, one manually adjudicated cross-year pair, current ballot/calendar sources, user testing, voice and design work.

### Cleisthenes, ingestion and compute — 17 September

The user's chosen assistant name is **Cleisthenes**. Persistent bottom-right avatar opens a compact chat, expandable to `/?view=chat`; messages stay in memory during expansion/collapse and clear on reload. No background conversation storage is added. Chat shows the selected proposal/person or all imported evidence as an explicit scope, with source details collapsed. Voice is still pending. Stance-comparison controls are hidden at the user's request.

Current-session ingestion: `node scripts/sync-current-session.mjs` discovers the session containing today's date and imports four distinct proposals among its latest 20 published roll calls. The September run discovered official session 5215 (14 September–2 October 2026) and imported 20254623, 20254616, 20254549, 20254599. Checkpoints resume interrupted runs; `--refresh` reimports completed IDs. This is a selected batch, not full session coverage. Current totals: 101 businesses, 29 status events, 314 speech paragraphs, eight roll calls, 1,600 individual voting decisions and 254 membership records. Every record keeps its official source URL. Current/session and historical filters remain separate.

Retrieval now uses Nemotron to generate French, German and Italian search terms, then combines lexical results by rank. It is query expansion, not an embedding index. Failure of query translation is recorded in response metadata and falls back to original-language retrieval. Source-isolated answer generation overlaps two model requests; the answer cache lasts ten minutes and keys on question, language, person/business scope, model and evidence revisions. Cached answers are explicitly labelled. Six live status/citation checks passed: EN/DE/IT e-ID, repeated question, current-session cybercrime and unsupported weather. Measured supported fresh requests: 3.5–9.7 seconds; repeated answer: 16 ms. These timings are from a small warm-service smoke test, not a latency SLA. Outputs in `artifacts/cleisthenes-evaluation.json` still require language/semantic review.

The official Jessica Jaccoud parliamentary recording (14 March 2024, transcript 336838, 189.92 seconds) is cached as `data/media/parliament-336838.mp4`. Its download URL was read from the official parliament page's player configuration: `https://par-pcache.simplex.tv/content/simvid_1.mp4?externalid=336838`. It is parliamentary speech, not the federal explainer used earlier. Genuine NVIDIA Parakeet word timestamps align official paragraphs 336838-2 at 92.48 seconds and 336838-4 at 158.00 seconds. `node scripts/align-parliament-video.mjs` requires a unique five-token prefix match and the following paragraph boundary. Metadata includes a media hash. ASR has recognition/code-switching errors; the displayed text is the authoritative Bulletin text. Alignment is explicitly machine-produced, with human timing review pending. No claim that the whole speech was word-perfect or every paragraph was aligned.

Compute inventory checked live: two NVIDIA H100 NVL GPUs, each reporting 95,830 MiB total memory. GPU 0 had 85,777 MiB allocated and 0% compute utilization at that instant, with Nemotron Nano 9B v2 and VSS services running. GPU 1 had 4 MiB allocated before the job. The parliamentary ASR ran with `CUDA_VISIBLE_DEVICES=1` using `nvidia/parakeet-tdt-0.6b-v3`; its 190-second recording completed transcription in about 0.7 seconds after model loading, with 17 segment outputs. This is NeMo Parakeet, not Riva. GPU memory allocation is not the same as active compute utilization.

Today GPU 0 supplies actual chat inference and multilingual query expansion. GPU 1 is used for bounded ASR jobs. VSS service health is green, but earlier processing returned zero analyzed chunks; VSS visual reasoning is not an accepted capability yet. Next compute allocation: keep interactive inference isolated, batch ASR/video alignment on GPU 1, then benchmark a multilingual embedding/reranking service there before choosing it. Do not launch an additional large model into GPU 0's remaining memory without measuring headroom. ElevenLabs voice should consume these grounded answers and preserve source cards; no ElevenLabs voice integration is claimed in this change.

Cleisthenes avatar: generated using the built-in image generation tool, saved to `frontend/public/images/cleisthenes.png`. The original output remains in the Codex generated-images directory. Final prompt:

> Use case: stylized-concept. Create one square app avatar illustration of Cleisthenes, a friendly fictional ancient Greek civic guide, a small personable pet-like philosopher bust with curly dark hair, short rounded beard, warm curious eyes, simple ivory toga and one tiny muted Swiss-red scarf detail. Premium tactile clay and softly carved marble illustration, restrained warm cream background, subtle sage laurel, beautifully simple silhouette legible at 48 pixels, sophisticated playful editorial feel, gentle studio lighting. Centered head and shoulders with generous breathing room. No text, no lettering, no watermark, no logos, no UI, no pedestal. Original character, not a reproduction of an existing app mascot. Intended for a Swiss civic intelligence assistant.
# Processing update: 17 September 2026

VSS now processes real video: three full DE/FR/IT parliamentary interventions, 115 five-second chunks, raw vectors retained locally. Dedicated Riva Translate runs on GPU 1, with passage translation available in Parliament view. Chat remains on GPU 0. See `SESSION-PIPELINE.md` for exact services, model revision, commands, evaluations and remaining gaps. VSS embeddings are not yet used in citizen search. Translation has a known rejected hallucinated-reference case; original sources remain primary.
