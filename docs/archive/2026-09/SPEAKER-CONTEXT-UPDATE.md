# Speaker context — 18 September 2026

> Historical implementation checkpoint. Preserved for provenance; use the [product specification](../../PRODUCT-SPEC.md), [architecture](../../ARCHITECTURE.md) and [status](../../STATUS.md).

Citation cards now include an expandable video player. The source inspector repeats that control and offers a prominent link to our own shareable member profile. Human-readable Parliament biographies are separate from raw data provenance links.

The directory import enriches all 271 known people: 269 have official parliamentary term history and 266 have declared roles. Unknown history stays unknown. First parliamentary entry is computed from that person's official National Council/Council of States history, not their current term or a namesake. Declared local/cantonal roles retain original wording and dates; they do not establish an exhaustive date when someone first entered politics.

The two reported examples, Anna Giacometti (4265) and Thomas Rechsteiner (4282), both first entered Parliament on 2 December 2019. Their separate current terms began 4 December 2023. Each has 9,782 individual vote records returned by the official service. This is service coverage, not a claim that every career decision was a recorded roll call.

The suggested “What issues has … discussed?” question now selects an overview within the person's imported speeches rather than searching for their name inside the speech text.

## Video availability

The full-recording resolver reads the selected intervention's official Bulletin page, extracts its published download template, verifies the transcript identifier and checks the video response. It does not fabricate a recording URL, substitute another speaker, or invent an exact quote timestamp. An unavailable recording retains the official transcript link. Previously saved chats resolve newly imported timings when their video panel opens.

For the reported passage `408554-8`, the official intervention was retrieved and processed on the existing NVIDIA H100 server. Automatic-language Parakeet output failed the text alignment checks; no timestamps were accepted from it. German-constrained Canary output produced eight accepted paragraph alignments. The quoted Digisanté passage matched at **227.84–253.36 seconds** (93.3% ordered token match), labelled machine-aligned and awaiting human timing review. The video file's SHA-256 is `88850fcff8c634f97b7ba30a552bb0fd8fedf1a42c63a1dfd3e8793563dc96b6`.

Receipts, downloaded media and alignments remain in the ignored local data workspace; the source recording is also on the existing NVIDIA host. The collection contains 3,380 interventions and 16,471 text passages. Universal exact timing is not achieved: edited text, absent recordings and failed matching must remain explicit. `scripts/import-canary-alignment.mjs --session=5215` now supports a selected session instead of a hard-coded summer session.

## Backup explanation and recommendation

A daily backup means an encrypted copy of application records such as saved research, preferences and conversations, retained for 30 days. Restoration testing means recovering that copy into a separate test database and checking its content and ownership.

“Privileged” refers to the export process being able to read records across accounts. A compromised broadly privileged credential could expose or modify more data than a normal user can. The earlier activation request was too technical and is not treated as approval.

Keep scheduling disabled for now. The safest activation path is a server-owned job with read-only access restricted to the required application tables, no public export endpoint, encryption keys stored separately from archives, separately controlled backup storage, and a successful isolated restoration rehearsal. The prepared service-role-based exporter has broader access and should be narrowed before activation. Never place credentials in the frontend, repository, chat or backup archive. No backup service was activated by this update.

All changes stay on `feat/swiss-citizen-pilot` in `tomasgarro/swiss-parliament-intelligence`. No upstream/main changes, merges or production deployment.
