# Greek–Swiss pilot integration

Date: 18 September 2026. Status: implemented locally; production release pending routing and runtime setup.

## Design source

The user approved the local `brand-exploration/BRANDBOOK.md` and `REVISION-02.md`, and the finalized [Civic Companion Design landing](https://lovable.dev/projects/dfabf414-608e-48cf-a632-e32b28e67c17). Landing source was imported from commit `4e57fed61b440814e7d895ba45d69189989834da`; subsequent hero/footer adjustments from `ea07851` were incorporated. Lovable supplied a read-only integration handoff. Its project remains unpublished.

The portico, Alpine landscape, mascot and Geneva footer were exported from the approved preview/local brand assets. The D3 mark is from the local brand book. Fonts are self-hosted Source Serif 4 and IBM Plex Sans; notices are in `frontend/public/brand/licenses/`. Art is illustrative, not a claim of government affiliation or a literal geographic scene.

## Implemented behavior and acceptance

- `/` introduces the pilot with the approved scene and scroll sequence. Enter the pilot opens Parliament; feature actions open real research, settings and historical topics.
- Topics & votes uses warm paper, serif headlines, a sage featured topic and flat editorial rows. Historical outcomes remain labelled as historical.
- Parliament retains original statements, profiles, coverage and research controls. Read the debate precedes the secondary processing/coverage control.
- Dossier Sources replaces the ambiguous Evidence label, explains provenance and offers editorial/video filtering. Full official sources remain linked.
- Settings offers language, larger quotations and reduced motion, persisted in this browser. It accurately explains local conversations, account saving and future identity features. No eligibility proof or voting flow is presented as operational.
- `/Switzerland/` builds use matching asset/API/media paths; the server can restrict itself to this mount. `/Switzerland` redirects preserving the query. Root APIs are not exposed by the mounted server.

Validation: production frontend build; 43 server tests including mount isolation and nested media URLs; two frontend API tests; four Sites packaging tests. Browser checks cover landing entry, Parliament, Topics, Settings persistence and responsive layout. Existing AI/citation/search tests remain green. Container recipe is prepared, but has not been built or run on Hostinger.

## Production findings and release boundary

Read-only Hostinger inspection identified midnight.vote on hosting account `u665780279`, order `55519490`, document root `/home/u665780279/domains/midnight.vote/public_html`. The root already contains a separate site, `api/`, assets and an Apache SPA fallback. There is no Switzerland directory. A whole-site static archive deployment would risk replacing the existing site and would not provide this pilot's Node/SQLite backend.

VPS `1684196` (`hermes-agent.vps`) is running existing Hermes and Midnight/Rarimo services, including an edge proxy on ports 80/443. Do not replace that compose project or its proxy configuration wholesale.

Prepared files: `deploy/switzerland/Dockerfile` and `compose.yaml`. The service binds only loopback port 4318. Before deployment:

1. Verify the chosen port is free and build/test the image. Prepare a separate `public-data` directory owned by container UID 1000. Restore a SQLite-consistent public-content snapshot, including the media/portrait files referenced by it; omit local credentials and unrelated files.
2. Create server-only `pilot.env` with verified production inference/translation endpoints and optional Supabase settings. The local LaunchPad SSH tunnel is not a durable production service. Never put credentials into the frontend or Git.
3. Establish a supported route from the existing midnight.vote Hostinger site to the isolated VPS service for `/Switzerland` and `/Switzerland/*`, preserving the prefix. The hosting connector's whole-site static deploy does not establish this route. Root `/api/` and the current root SPA must remain untouched. Confirm reverse-proxy support/access before attempting the release.
4. Back up the existing host routing, stage the exact small routing change and obtain the Hostinger-required write confirmation naming the resource/account. Deploy only the isolated service and prefix route.
5. Verify HTTPS entry, assets, health, original passages, a media range request, translation, a cited answer and account behavior. Also verify the existing root site/API. If any check fails, remove only the new prefix route and stop the isolated service; preserve its data for diagnosis.

No production files, DNS records or containers were changed during this integration. No new NVIDIA access is needed for the local UI; a durable production inference connection is still a release prerequisite. UI copy beyond the existing language coverage remains English or French; original parliamentary text retains its source language.
