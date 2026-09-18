# Civic workspace delivery — 18 September 2026

## Implemented scope

Home, Parliament, Topics and Saved retain the Greek–Swiss visual language. The in-app wordmark opens Home; About opens the landing page. Dossier research state and conversation state survive this navigation. Existing dossier links, Research links and `/Switzerland/` remain supported.

Accounts have separate registration, verification, sign-in, recovery and Google OAuth paths. Registration accepts an optional display name. Email callbacks and OAuth use single-use PKCE exchanges. Opaque HTTP-only cookies reference encrypted, persistent server sessions with refresh handling. Anonymous chats remain browser-local; new signed-in chats sync automatically and old local chats require explicit import. Profiles, follows, preferences, saved sources, briefs and conversations use the existing Supabase project and per-user row-level policies. Existing user IDs and saved-source ownership are retained.

Home includes an official session/sitting calendar in Europe/Zurich, recent research, explicit follows and imported proposal updates. Topics provides text, topic, type, stage, date and source-language filters. Assisted discovery retains those filters. Dossiers have Overview, Debate, Timeline and Sources with citations and brief construction. The e-ID feature is explicitly a historical example dossier.

## Chamber source and publication contract

The 2D SVG uses the official chamber service's literal desk paths and architecture, not generated arcs or rearranged party blocks. The importer joins `SeatOrganisationNr` / `SeatOrganisationSr` to the complete active `MemberCouncil` roster through official PersonNumber and chamber IDs. The directory importer now includes all active representatives, including people with no imported speech.

Authoritative references:

- [National Council seating](https://www.parlament.ch/de/organe/nationalrat/sitzordnung-nr)
- [Council of States seating](https://www.parlament.ch/de/organe/staenderat/sitzordnung-sr)
- [Represented parties](https://www.parlament.ch/de/organe/fraktionen/im-parlament-vertretene-parteien)

The 2026-09-18 snapshots contain 200 occupied National Council seats and 46 occupied Council of States seats, with unique member IDs and no vacancies. National Council: 12 distinct parties; Council of States: seven parties plus one independent. Small parties remain individually represented. Party and parliamentary-group totals derive independently from the same assignment data. Presidency members are counted once.

`node scripts/sync-chambers.mjs` fetches both plans and the roster, checks the roster again for changes during import, validates all assignments and totals, then publishes immutable files and an atomic manifest. Any failed reconciliation prevents publication. The existing manifest remains authoritative. Versioned files live in `server/chamber-snapshots/`; later roster changes cannot rewrite an older file. Raw inputs and source hashes are retained by the import workflow. Unknown effective-date boundaries remain null; “as of” is the verified retrieval date, not an invented historical validity date.

The UI exposes the snapshot date, official plan, individual seats, pinned inspectors, member profiles, all legend entries, party/group overlays, keyboard selection, pan, pinch/zoom, reset and an accessible searchable list. Colour patterns distinguish similar hues. Party hues are identified as presentation colours where an authoritative brand colour was not established; they must not be described as universally official party-brand values.

## External configuration still required

The active Supabase project is `qtrgnmdxpigxgsmwzkcl`. The workspace migration has been applied. Email is enabled with confirmation required. Google is currently disabled. The implementation hides Google sign-in until the provider is enabled; no fake social-login button is displayed.

An authorised project administrator must configure Google credentials and callback allowlists in Supabase. The dashboard currently requires sign-in. Do not paste provider secrets into chat or commit them.

- Google authorised callback: `https://qtrgnmdxpigxgsmwzkcl.supabase.co/auth/v1/callback`
- Local Supabase allowed redirect: `http://127.0.0.1:4318/api/auth/callback`
- Future production allowed redirect: `https://midnight.vote/Switzerland/api/auth/callback`
- Production server settings: `PUBLIC_ORIGIN=https://midnight.vote`, `PUBLIC_BASE_PATH=/Switzerland`

Email links must be opened in the browser that requested them, within the one-hour flow window. Legacy implicit-token links do not establish a new session. Verification, recovery delivery, Google consent/cancellation and cross-device account use still need live-provider acceptance once configuration is available. No unsolicited registration or recovery emails were sent during development.

## Agenda, feed and broadcast boundaries

The [official session calendar](https://www.parlament.ch/en/ratsbetrieb/sessions/schedule) supplies published future date ranges; official Meeting records supply individual sittings. Scheduled times never imply a live broadcast. Agenda refresh runs hourly and retains a dated last snapshot on failure. Broadcast status is checked by the open chamber every minute, but remains unverified until a reliable live signal adapter is configured.

The dashboard checks updates every 30 minutes. These are metadata from the imported proposal collection; this polling does not itself run the proposal-ingestion pipeline. Following currently matches explicitly followed proposals. Party/person/topic follows are stored and visible, but their update adapters and canton-local coverage are not yet implemented.

SRF, RTS and SWI swissinfo remain attributed outbound links. Their article feeds are not activated because feed/republication permission has not been fully verified. [SRG usage conditions](https://www.srgssr.ch/de/nutzungsbedingungen) require review before republishing article material. Cleisthenes does not claim to have read these articles. Social profiles remain links. Citizen signatures, official voting and message submission remain future work.

## Backup configuration awaiting activation approval

No backup schedule or privileged export endpoint has been activated. Automatic approval review rejected the earlier privileged Supabase export/scheduler approach. The reviewable implementation now consists of `scripts/backup-application.mjs`, `scripts/restore-application.mjs` and inactive `deploy/civic-backup.service` / `.timer` files.

The service exports application rows, excluding secrets and sessions, encrypts with AES-256-GCM, checks authenticated decryption before publication, and retains named archives for 30 days. The proposed timer runs daily at 02:15 UTC. It requires a protected service-role credential, an independent protected 32-byte encryption-key file, persistent backup storage and a service account. These credentials must never enter the archive. Backups should be copied to separately controlled storage; encryption keys need separate recovery custody.

Required protected environment configuration:

```text
SUPABASE_URL=<existing project URL>
SUPABASE_SERVICE_ROLE_KEY=<provision securely>
BACKUP_KEY_FILE=/etc/midnight/backup.key
BACKUP_DIRECTORY=/var/backups/midnight-civic
```

Restoration procedure:

1. Provision an isolated target with the workspace schema and original auth user IDs. Application archives deliberately do not include auth credentials; auth disaster recovery is a separate responsibility.
2. Set `BACKUP_KEY_FILE` and run `node scripts/restore-application.mjs --file=<archive>` for an authenticated dry run.
3. Set explicit `RESTORE_SUPABASE_URL` and `RESTORE_SERVICE_ROLE_KEY` for the isolated target. Run the same command with `--apply`.
4. Compare row counts and original ownership, then test each account's visibility under RLS before approving production restoration.

The automated local restoration rehearsal passes. A remote Supabase restoration rehearsal, off-host archive storage, production scheduler activation and an atomic database-wide export strategy remain release gates. Activation requires approval for the privileged daily export job and a secure credential location.

## Acceptance evidence and remaining gates

- 56 server tests, two frontend API tests and four Sites tests pass; production frontend build passes.
- Real Supabase RLS isolation checked in a rolled-back transaction: own row visible, another user's update affects zero rows, cross-user insert denied.
- Both chambers: every SVG seat selected through the browser keyboard interface; all 246 pinned inspectors matched their member/seat labels. Rendered geometry checksums match the imported official paths. Zoom, chamber switching, small-party selection and a mobile member-profile flow checked.
- Mobile viewport checked at 390×844 without horizontal overflow; reduced-motion rules and keyboard seat controls included.
- Separate account forms, filtered assisted discovery, dossier navigation/back-state and calendar stale/false-live handling checked.
- Automated tests cover restart-safe encrypted sessions, refresh, single-use callbacks, account ownership, snapshot invariants, historical immutability, Zurich date boundaries, backup integrity and restoration.
- Remaining acceptance: real email/Google end-to-end flows, real cross-device chat/import tests, full assistive-technology and colour-vision review, remote backup restoration, independently verified live broadcast status, publisher ingestion permissions and broader follow-based news coverage.

Changes are intended for the existing pilot branch. Production deployment is a separate release step.
