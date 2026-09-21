# Swiss production update — 18 September, evening

> Historical production checkpoint. Counts and release state are superseded; use [status](../../STATUS.md) and [operations](../../OPERATIONS.md).

Deployed to https://midnight.vote/Switzerland/ after explicit user approval. The landing Get started actions now open the account dialog, with email/guest access and accurately disabled unconfigured social/SSO providers. Provider activation is deferred until the user returns. Cleisthenes uses the `civic-evidence-v2` answer workflow, source attribution checks and explicit unsupported-answer behavior.

Only Swiss static assets/index and the isolated `swiss-civic-pilot` compose project were updated. Existing protected environment values, public-data bootstrap, account volume and separate Midnight stack were preserved. No schema migration or public evidence replacement was performed. The new party index and machine timing candidates remain staging material.

Backend archive SHA256: `68f823127de88bc36e617387c09356d474737b53f003d2d522edaa804e47bbad`.

Hostinger action: `115360245`. The recreated Swiss API reported healthy; model tunnel running; initialization completed successfully. Live API checks then passed 4/4: English answer 5.738 s, cached English 0.831 s, French 5.557 s, unsupported question 3.154 s. Supported claims carried exact quotations from returned evidence. This is citation-mechanics validation, not independent semantic adjudication. See `evaluations/production-request-path-2026-09-18.json`.

The request-path harness was corrected to send the URL's **origin**, excluding `/Switzerland`, in the Origin header. The first malformed test request was correctly denied. Production origin validation was not weakened.

Browser checks confirmed the deployed landing opens the account dialog, social providers remain disabled, email fields load, and Explore without an account opens the civic dashboard. No account was created and email delivery/OAuth activation was not tested. Build and existing automated suites passed before deployment.

## Rollback

Preserve the compose service definitions and protected environment. Set only APP_ARCHIVE_URL to `https://midnight.vote/Switzerland/bootstrap/dc41617025461e6c27b23236a6fbe6bcaa1a4747ed4eb5ce2da406367a971c2b.tgz` and APP_ARCHIVE_SHA256 to that filename's hash, then redeploy **only** `swiss-civic-pilot`. Restore the previous Swiss frontend index/assets from the prior release artifact. Do not delete or reinitialize the data volume. Do not restart the shared Midnight project. Previous production source and its bootstrap values remain in the existing release runbook.

Current local release package: `artifacts/swiss-code-release-2026-09-18T20-33-33-244Z`. `scripts/prepare-swiss-code-release.mjs` reproduces code-only packaging from a `/Switzerland/` frontend build. Packages contain no account data or secrets. The production model still depends on temporary NVIDIA LaunchPad availability.

At 20:46 UTC the independent H100 worker reported 1,958 complete ASR jobs and seven failed jobs out of 3,346 queue entries. This is remote transcription progress, not reviewed video alignment or VSS completion. All 69 backend tests passed after the release.
