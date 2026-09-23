# Operations and deployment

This is the canonical runbook for the Swiss pilot runtime. It consolidates the former dated runbooks and release notes; those originals remain in the historical archive.

## Runtime layout

| Layer | Implementation |
| --- | --- |
| Browser | React 19 / Vite civic workspace mounted under `/Switzerland/` in production. |
| Application API | Node.js server on port 4318 with built-in SQLite, server-managed sessions and explicit JSON endpoints. |
| Public corpus | `parliament.sqlite`, `public-processing.sqlite`, `public-embeddings.sqlite`, selected public media and alignment receipts. |
| Private application data | Supabase Auth plus per-user rows; separate from public corpus packaging and backups. |
| GPU services | Nemotron on remote loopback 30081, Riva Translate on 30082 and VSS/RTVI embeddings on 8017. |
| Production connection | Restricted `swiss-model` SSH tunnel maps the three services into the private application network. |

## Local application

Install and build the frontend, then start the API:

```bash
npm ci --prefix frontend
npm run build --prefix frontend
npm start
```

The default URL is `http://127.0.0.1:4318/`. Frontend development can use `npm run dev --prefix frontend` alongside the API.

A fresh clone has seeded example dossiers but not the operator's ignored databases or media. Model-backed features require `.env` values described by [`.env.example`](../.env.example). Keep every model, Supabase, email and backup credential server-side.

## Model connectivity

The application expects OpenAI-compatible inference at `INFERENCE_BASE_URL`, using `INFERENCE_MODEL`. Production currently sets:

```text
INFERENCE_MODEL=nvidia/nvidia-nemotron-nano-9b-v2
```

Translation and VSS use separate service URLs:

```text
TRANSLATION_BASE_URL=http://127.0.0.1:4320
VSS_EMBED_BASE_URL=http://127.0.0.1:4321
```

The production container resolves equivalent ports through `swiss-model-tunnel`. `deploy/switzerland/model-access.conf` restricts the dedicated no-shell account to local forwarding for 30081, 30082 and 8017, disables TTY/agent/X11/remote forwarding, and forces a non-interactive command. Do not reuse an operator key or expand the port allowlist casually.

Probe configured services without sending application evidence:

```bash
npm run probe:nvidia
```

Health only shows that an endpoint responded. It does not prove output quality, continuing availability or completion of an offline batch.

## Production release

Production uses `deploy/switzerland/compose.hostinger.yaml`. The Swiss application remains isolated from the existing midnight.vote root application and is mounted at `/Switzerland/`.

Release preparation follows these boundaries:

1. Build and test the application.
2. Build the frontend with `VITE_PUBLIC_PATH=/Switzerland/`, then run `scripts/prepare-swiss-release.mjs` (code, public data and semantic index archives). For a code-only update that leaves both data volumes untouched, `scripts/prepare-swiss-code-release.mjs` is enough.
3. Rehearse locally: `docker compose -f deploy/switzerland/compose.hostinger.yaml` with archives served from the host.
4. Verify archive hashes and excluded paths before upload.
5. Upload through the resumable release helper.
6. Start or update only the scoped Swiss service and verify `/Switzerland/api/health` plus representative API/browser paths.

### What the VPS fetches (23 September 2026 layout)

`scripts/prepare-swiss-release.mjs` emits three checksummed archives, staged under `Switzerland/bootstrap/<sha256>.tgz` for upload, and a `release.json` with their URLs and hashes:

| Archive | Contents | Compose variables |
|---|---|---|
| `backend.tgz` | `server/`, `config/`, `bootstrap.mjs`, `package.json`, `package-lock.json` | `APP_ARCHIVE_URL`, `APP_ARCHIVE_SHA256` |
| `public-data.tgz` | corpus database without import revision history, seed database with saved sources emptied, manifests, alignment receipts | `PUBLIC_DATA_URL`, `PUBLIC_DATA_SHA256` |
| `semantic-index.tgz` | int8 E5 index and the pinned ONNX query model | `SEMANTIC_INDEX_URL`, `SEMANTIC_INDEX_SHA256` |

The container launcher streams the backend archive into the `swiss-releases` volume, verifies it, runs `npm ci --omit=dev` once per release and starts `bootstrap.mjs`. The bootstrap streams each data archive to disk while hashing it, applies it once per checksum and never replaces `sessions.sqlite` or an existing `pilot.sqlite`. Nothing is held in memory, so a multi-gigabyte corpus fits a small container. Remove the archives from hosting once the VPS reports `bootstrap corpus: applied`.

Memory: 1.5 GB (`SWISS_MEM_LIMIT`, default) is enough with `HYBRID_RETRIEVAL=off`. Semantic search loads the 1.2 GB index and the query model, so set `HYBRID_RETRIEVAL=on` only with `SWISS_MEM_LIMIT=4g` (the 23 September rehearsal peaked at 3.1 GB with 3 GB allowed). `SEMANTIC_WORKERS` (default 2 in production) bounds the search threads, because a container sees the host's cores rather than its CPU quota. Disk: allow about 3× the corpus archive during the first bootstrap (archive, staging copy, previous files).

Model keys (`NVIDIA_API_KEY`, `OPENAI_API_KEY`, `TYPESAFE_API_KEY`) are set in the protected hosting environment, never in the compose file or the archives. With `NVIDIA_API_KEY` set, answers continue on NVIDIA's hosted catalog when the LaunchPad tunnel is gone; `INFERENCE_PROVIDER=nvidia-catalog` forces that route.

The public package may contain public parliamentary records, processing receipts, selected official media and source code. It must not contain `.env` files, private keys, session stores, account exports, feedback, service-role credentials or backup keys.

## Authentication and external providers

The application supports email/passwordless and password flows, persistent encrypted server sessions, refresh handling, account settings and MFA endpoints. Adapter code does not prove a provider is activated.

Follow [the authentication provider checklist](AUTH-PROVIDERS-CHECKLIST.md) for redirect URLs, branded email templates, sender configuration, Google enablement and real account lifecycle tests. Apple remains disabled without the required developer membership. Organization SSO is out of the current product scope.

## Public-corpus backup and recovery

Public corpus backup is separate from private account backup:

```bash
node scripts/backup-public-corpus.mjs
node scripts/restore-public-corpus.mjs <archive>
```

The public backup encrypts allowed files with AES-256-GCM, verifies authenticated decryption before publication and rejects unexpected restore paths. Configure `CORPUS_BACKUP_KEY_FILE` and `CORPUS_BACKUP_DIRECTORY` using protected persistent storage. Keep the encryption key under separate recovery custody and copy archives to independently controlled off-device storage.

Application-row backup excludes secrets and sessions. A restore requires an explicit Supabase target and protected service-role credential; preserving row IDs does not recreate missing authentication users. Do not enable scheduled privileged backup work without operator approval and a restore rehearsal.

## Monitoring and failure behavior

- `/api/health` reports configured application modes, not a semantic model evaluation.
- Provider timeouts and invalid model output return explicit unavailable states.
- The application can continue serving original public records when GPU services are down.
- Processing job failures stay in their ledgers and can be retried; they are not counted as complete.
- Session refresh failure must preserve the previous validated snapshot.
- The H100 LaunchPad allocation is temporary infrastructure. Tunnel restart handling cannot extend that allocation.

## Release acceptance

Before a production update, run:

```bash
npm run docs:check
npm test
npm run test:api --prefix frontend
npm run test:sites --prefix frontend
npm run build --prefix frontend
```

Then verify on the scoped public mount:

- health and static assets;
- both 200/46-seat chamber snapshots;
- one original-text read/search flow;
- one supported cited answer and one unsupported refusal;
- translation failure as well as success;
- bounded video behavior and disclosure;
- anonymous versus signed-in persistence;
- feedback failure handling without leaking conversation context.

Record live-provider results with a date. Do not turn a single successful smoke test into a service-level guarantee.
