# Swiss release and H100 processing — 18 September 2026

## Release state

- `/switzerland` redirects to `/Switzerland/`, serving the Swiss application assets instead of the general site's fallback. Both responses were checked on the public domain.
- The general landing response SHA-256 is unchanged: `447170f56db02ae4866995e5de28d545d5220b79e26dafa09e950f61d9fcc5b7`.
- Shared hosting contains only public assets, recordings, source and sanitized public database packages under `Switzerland/`. No sessions, account exports, keys or environment files are in those packages. The seed database's saved table is emptied and vacuumed before packaging.
- `/Switzerland/media/parliament-408554.mp4` returns HTTP 206 for a byte-range request. The real landing demonstration renders from the public domain.
- Isolated Compose project `swiss-civic-pilot` on the existing VPS has a healthy Node API and persistent data volume. Standard Node/Alpine images are used because the hosting deployment runner pulls images without building Git contexts. Application and initial public data archives are SHA-256 verified before extraction.
- **Approved and applied:** the existing production proxy has a scoped `/Switzerland/api/*` handler. Both chamber endpoints return 200 with reconciled 200/46 totals. A real cited Nemotron answer returned in 3.3 seconds and Riva translation in 6.1 seconds through the public API. Google is disabled in the Supabase provider configuration.
- The model private key is generated on the VPS and remains in its own named volume. H100 authorization uses the dedicated `swiss-model` no-shell account. Its SSH Match block allows only local TCP forwarding to ports 30081/30082/8017, denies remote and Unix-socket forwarding, and forces `/bin/false` for sessions. The key is restricted to the observed NVIDIA gateway address (the gateway masks the original VPS source address). Configuration was validated with `sshd -t` and effective settings checked with `sshd -T -C`. No existing private SSH key is copied.
- Email/Google provider acceptance and production feedback sender configuration remain separate outstanding checks.

## Packaging and routing

`deploy/switzerland/compose.hostinger.yaml` is the production configuration. The Git-build Dockerfiles and `compose.yaml` remain useful for environments supporting builds. `bootstrap.mjs` initializes only an empty public data volume, then starts the API with persistent encrypted sessions. A restart does not overwrite application data.

Build with `VITE_PUBLIC_PATH=/Switzerland/`, then run `scripts/prepare-swiss-release.mjs`. It rejects a root-path build. The release uploader accepts destinations under the two Swiss mounts only. Windows cannot create distinct `Switzerland` and `switzerland` directories: the local `switzerland-alias` staging folder is explicitly mapped to the lowercase redirect destination.

The fixed HTTPS PHP bridge forwards only Swiss API requests and does not act as an arbitrary proxy. The existing site's root index, root rewrite rules, API and assets are untouched. Upload assets before activating the Swiss index and rewrite rules.

## Public text embeddings

The H100 run embedded every imported speech passage: **16,471 passages, 16,488 chunks, 1,024 dimensions**. Long passages use overlapping token windows, rather than dropping text beyond 512 tokens. Model: `intfloat/multilingual-e5-large`, revision `3d7cfbdacd47fdda877c5cd8a79fbcc4f2a574f3`. Runtime after model loading: 214 seconds on H100 NVL.

`data/public-embeddings.sqlite` exists locally and is included in the production public bootstrap package. It stores the official record ID, source hash, model and revision, character boundaries and normalized float32 vector. `scripts/validate-public-embeddings.mjs` verifies all imported IDs, source hashes, vector dimensions/norms and text boundaries. The index is persisted; semantic retrieval integration and evaluation are still pending.

## Recording queue and durable receipts

The GPU processes 3,346 official recording jobs from sessions 5215, 5214 and 5213, prioritising the current session. Only official Parliament recording links are accepted. Work runs on GPU 1; interactive chat on GPU 0 remains running. Each media file is hashed. Canary transcribes 300-second audio windows, with timestamps shifted back to the full recording timeline. Disk reserve and per-recording size limits stop uncontrolled storage growth.

The remote working directory is `/home/nvidia/swiss-parliament-intelligence`. `public-processing.sqlite` records job state; `session-output/*-canary.json` stores full transcripts and word timings. Errors remain explicit and can be retried. A completed ASR receipt is not a human-reviewed quote alignment.

At the 15:53 UTC checkpoint, 111 queue entries were complete. The ledger and receipts were copied locally. `scripts/import-public-processing.mjs` validated 110 new receipts against the source queue and persisted their full text, timing payload and provenance into the local processing database. Older receipts without the new source metadata were skipped, not relabelled as verified. By 16:08 UTC, the GPU ledger recorded 212 completed jobs. Processing continues on the H100; these checkpoint counts do not claim full-session completion.

Refresh the remote SQLite snapshot using SQLite backup, then copy it and the receipts. Do not overwrite a local processing database containing imported transcripts: copy subsequent job ledgers to a separate checkpoint filename, then run the receipt importer. Keep this pipeline strictly public-only.

## Backup and validation

Public backup now includes the official corpus, text vector database, public processing database, public media/receipts and Git-tracked code. It excludes account databases, private conversations and secrets. AES-256-GCM keys remain separate from the archive.

The vector backup was decrypted into an isolated directory and passed SQLite integrity checking with all 16,488 rows. A subsequent 51-file backup included the public processing database and restored successfully, including all 110 locally checkpointed ASR transcripts. Daily off-device scheduling and independent key custody remain operational work, not completed claims.

Release checks: 61 backend tests, 2 API-client tests, 4 Sites packaging tests, production Vite build, PHP 8.3 syntax check, embedding validation, real browser landing screenshot and public media range request. Provider mocks do not prove email delivery, OAuth configuration or final production AI connectivity.

All changes are published only to `tomasgarro/swiss-parliament-intelligence`, branch `feat/swiss-citizen-pilot`. Upstream/main is unchanged.

## Existing service observation

The production proxy update retained exactly the previous protected environment and all existing service definitions apart from the new route. Hostinger recreated the project containers. The existing CICO service subsequently reported unhealthy; its logs show the Midnight preview RPC connection closing during startup. Its code waits for issuer-wallet synchronization before starting HTTP, so it may be resynchronizing; recovery has not yet been verified. The PostgreSQL, verifier, proof server and proxy remained running. This is an outstanding existing-service recovery check; do not claim the whole pre-existing stack passed acceptance.

The NVIDIA connection still depends on the temporary LaunchPad allocation. Container restart handling preserves the VPS key and session data, but cannot extend the allocation. Use `deploy/switzerland/model-access.conf` for the dedicated GPU account limits; validate before reloading SSH. Do not grant this key access to the operator account or any additional ports.
