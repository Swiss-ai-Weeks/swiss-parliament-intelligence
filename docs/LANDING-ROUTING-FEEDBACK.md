# Real recording, hosting diagnosis and public backups

18 September 2026. Branch: feat/swiss-citizen-pilot, Tomas's fork only.

The landing research example now plays official recording 408554, Thomas Rechsteiner on the electronic health record (25.082), 14 September 2026. The bounded passage is 227.84–253.36 seconds, aligned with NVIDIA Canary, pending human timing review. The German excerpt remains original; English is labelled an editorial translation. Explore opens the same proposal.

## Live hosting diagnosis

Read-only Hostinger checks confirmed account u665780279, domain midnight.vote, document root /home/u665780279/domains/midnight.vote/public_html. Its only root directories are brand, fonts, api, art and assets. There is no Swiss deployment. The final Apache rule is `RewriteRule ^ index.html [L]`, so /switzerland serves the existing general SPA, including its hash navigation. No evidence of overwriting the general app was found.

The application now canonicalises case variants of its configured /Switzerland mount while preserving queries. This only helps after requests reach this application. It cannot change the live host's fallback.

Production still needs an isolated Node backend and supported prefix reverse proxy to it, or separate static assets plus a configured backend proxy. Do not deploy a whole-site archive. No verified reverse-proxy write interface or running Swiss production backend has been established. The VPS is 1684196, hermes-agent.vps, with existing workloads. The prior release checklist in GREEK-SWISS-INTEGRATION.md still applies. No live hosting files or services were changed.

## Feedback

Send feedback appears in the app footer. The server fixes the recipient to contact@midnight.vote, sends plain text, accepts an optional reply address and never includes account information, chat history or page query parameters. Protection includes a single-use, ten-minute arithmetic check, a hidden bot field, bounded input, same-origin checks and conservative per-connection-address rate limits. This lightweight check is not a sophisticated bot defence; an edge CAPTCHA can be added if abuse warrants it. Behind a proxy, IP limits are shared unless a trusted proxy identity policy is configured; arbitrary forwarding headers are intentionally ignored.

The Resend adapter requires a restricted sending API key in FEEDBACK_RESEND_KEY and a verified FEEDBACK_FROM sender, server-side only. Reference: https://resend.com/docs/api-reference/emails/send-email. No service credentials were found, and no real email has been sent. Until configured, the UI explicitly offers an email link instead of pretending delivery works. Provider acceptance is not proof of inbox receipt.

## Public corpus protection

scripts/backup-public-corpus.mjs takes a SQLite-consistent official corpus snapshot; includes committed scripts/application code, public parliamentary recordings, alignment/ASR/Canary/VSS/embedding receipts; and exports original passages with source URLs and hashes as public-passages.jsonl for a retrieval backend. These are public sources, never private chats, feedback or account records. The existing local speech search remains usable; this export does not claim a new Supabase vector index has been deployed.

Each file uses AES-256-GCM with a fresh nonce. Every encrypted file is decrypted and hash-checked; the database is also restored to a separate temporary file and passes SQLite integrity_check. CORPUS_BACKUP_KEY_FILE must point to a protected 32-byte key outside CORPUS_BACKUP_DIRECTORY. Do not upload the key alongside the archives. Retain a recovery copy separately in a secret manager.

Local rehearsal is not disaster recovery. Before scheduling daily runs, provision off-device private object storage, a restricted writer/reader, independent recovery-key custody and a 30-day storage lifecycle. No broad Supabase service-role export, public export function, private-user RAG ingestion or production scheduler is enabled. GPU-only outputs not yet copied into the local corpus are not covered by the local backup.
