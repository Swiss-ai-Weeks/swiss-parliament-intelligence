# Parliamentary intelligence: implementation and competitive update

17 September 2026. Extends [the existing landscape](COMPETITIVE-LANDSCAPE.md) and the six-day pilot; this is not a claim that the full archive has been imported.

## What now works

The pilot has a Parliament view with searchable proposals and public representatives, official status labels, proposal history, roll-call details, attributed speech search and NVIDIA-generated answers linked to original passages. Data comes directly from the Swiss Parliament OData service, with content hashes, raw responses, retrieval manifests and retained record revisions. The original five citizen dossiers remain intact.

The first successful import contains 101 proposals (e-ID plus 100 recently updated records), 13 e-ID status events, four National Council roll calls with 800 individual decisions, 254 current membership records, and 247 attributed speech paragraphs. The membership service also includes Federal Council members; it is not a list of 254 MPs. Historical people can also appear from imported votes.

A quality check excluded procedural and legislative text that inherited a chair's person ID but was not displayed as speech. The 247 passages are official Bulletin text, not new ASR output. No parliamentary video alignment is claimed. Metadata in French does not imply that original speech or vote decision labels are French.

Parliamentary proceedings, completed parliamentary business and popular votes are separate. The e-ID popular vote is historical (28 September 2025). A recently modified record is not necessarily on today's voting agenda. No current ballot calendar has yet been connected.

## Competitors and reference products

| Product | Observed capability and source | Implication for this pilot |
|---|---|---|
| Swiss Parliament / Curia Vista / Official Bulletin | Authoritative proposal, debate and voting records; the live [OData metadata](https://ws.parlament.ch/odata.svc/$metadata) supplied the import schema. | Be a useful reading and explanation layer, retain official IDs and links, and preserve the difference between text and speech. |
| Parlacta | [Swiss policy monitoring](https://parlacta.ch/en/); the existing Sep14 report covers its monitoring/search positioning. Its [published facts](https://parlacta.ch/it/fakten/) describe broad parliamentary coverage. | Monitoring and cross-jurisdiction search are already competitive. Validate any announced AI capabilities before calling them deployed. Do not promise a uniquely comprehensive archive. |
| IWP Parlameter | [Tracking](https://parlameter.iwp.swiss/tracking) offers parliamentary voting exploration for the current legislature, filtering by person, council, business and session, party-line deviations, final votes and export. | Politician vote histories and party comparisons alone are not differentiation. |
| HowTheyVote.eu | [Methodology](https://howtheyvote.eu/about) explicitly limits coverage to roll calls, distinguishes abstention from non-participation, and offers downloadable data. | Put coverage and missingness beside the result; keep amendment, final and procedural votes distinct. |
| European Parliament Legislative Observatory | [OEIL](https://oeil.europarl.europa.eu/oeil/en) provides procedure records, documents, summaries and a part-session calendar. | Model dated events and sources, rather than one generic progress bar. Separate scheduled from completed events. |
| European Parliament open data | [Official vote results](https://www.europarl.europa.eu/plenary/en/votes.html) and the [Open Data Portal](https://data.europarl.europa.eu/en) are source infrastructure. | Prefer authoritative structured imports to AI extraction when structured records exist. |
| Parltrack | [parltrack.eu](https://parltrack.eu/) is referenced by HowTheyVote as an open-source legislative-process project; direct inspection was unavailable in this session. | Revisit dossier change monitoring; do not assert current features or availability without verification. |
| abgeordnetenwatch | Its [FAQ](https://www.abgeordnetenwatch.de/ueber-uns/faq) describes public questions, representative profiles and selected named votes; questions and answers are moderated. | Preserve dated statements and separate answers by a representative from our AI interpretation. |
| VoteInfo, easyvote, smartvote | Already assessed in the existing landscape: ballot information, accessible civic explanations and candidate questionnaires respectively. | Distinguish recorded behavior from a questionnaire answer, and editorial explanation from original evidence. |

Our product hypothesis is a connected citizen journey: **issue → changing proposal → attributed arguments → individual recorded decision → exact original source**, usable through text and later voice. Evidence that users prefer this combination to existing products is still required. No claim of unique market coverage is established.

## Import strategy: breadth without waiting for every video

1. **Now:** real official text and structured votes for the flagship; recent business metadata; raw snapshots and source-linked live inference. Completed as the first bounded slice.
2. **Next:** import proposal history and speeches for a reviewed selection of active autumn-session business. Expand roll calls by session and vote ID, checkpointing each page. Querying the large Voting table by business timed out; per-vote queries succeeded.
3. **Then:** backfill the current legislature in resumable jobs. Track counts by year, council, source language and record type. Keep separate historical membership intervals; a current party label must not replace party membership at the time of a vote.
4. Add the previous legislature for an explicit, reviewed cross-year case study. No representative-wide tendency score until the comparison set and denominators are meaningful.
5. Add semantic retrieval and reranking with a frozen multilingual evaluation. Current retrieval is lexical; source-language queries work best. Proper names in a free-text query are not a replacement for selecting a person scope.
6. Process selected video moments with NVIDIA ASR/VSS and align them to official text. Bulk video processing should follow validated retrieval demand, rather than delay access to already available official text.

SQLite is sufficient for the bounded pilot. Before a full parliamentary archive, measure index size, query latency, refresh duration and concurrent load; move search and object storage independently when needed. Keep the import and serving processes separate. Do not assume a deployment-scale database migration is needed before measurement.

## Stance-change investigation

Expose side-by-side original passages, dates, speaker identity and recorded role. Require review of speaker role, matching policy proposition, proposal version, amendments, changed circumstances and quoted speech. A committee rapporteur's statement may represent the committee rather than the speaker personally. Voting for an amended bill does not establish a reversal from opposing an earlier version.

The current comparison endpoint refuses unreviewed speaker roles. It can return a review-required candidate only when a future editorial review explicitly clears both passages as personal positions. The pilot makes no automated allegation of hypocrisy, dishonesty or motive, and offers no integrity score. The next useful test is one manually adjudicated same-speaker pair with a documented explanation, not a ranking of politicians.

## Delivery order through September 23

Keep the existing evidence journey as the acceptance baseline. Extend ingestion and evaluate real answers first; align a genuine parliamentary clip next; add one reviewed comparison case and a verifiable current event after that. Voice should reuse this evidence API. Broad canton coverage, full historical scoring and a complete Swiss redesign must not displace source accuracy or the recorded demo. The voice and Swiss-brand direction remains in [its accepted historical plan](../archive/2026-09/VOICE-AND-SWISS-BRAND-PLAN.md).
