# Citizen evidence and federal voting companion

Version 0.1 — 14 September 2026. Research-backed specification for the next development cycle; not a claim that the features below exist. Federal popular votes first is confirmed by Tomas. Numeric acceptance thresholds and implementation slices below are proposed engineering targets, not supplied hackathon judging rules.

## Product outcome

A citizen can understand an upcoming federal ballot, verify important claims against the original parliamentary material, and return for the result. An optional, clearly non-binding consultation explores privacy-preserving participation. The citizen chooses; an agent researches and explains.

The hackathon's parliamentary-video challenge remains the foundation. Our chosen minimal demonstration is one authorized recording processed into timestamped passages, a short briefing and cited follow-up answers with real source playback. Voting, NFC and agent credentials are additional hypotheses; they must not prevent the core demonstration from working.

## What exists and what changes

The repository provides an interactive frontend, normalized fixtures and `frontend/src/services/api.js` as an API seam. It is a useful interaction reference, not an implemented ingestion or voting backend. The existing source player includes simulated controls; acceptance requires real playback. LocalStorage persistence is demo continuity, not production handling of political choices.

The previous README prioritizes professional researchers and a desktop workspace. The new direction prioritizes a simple citizen journey on mobile; desktop retains convenient side-by-side evidence. Professional research remains a potential buyer workflow. Preserve useful components and the hosting setup; do not expand all existing navigation destinations before the essential journey works.

## Scope and user journeys

| Priority | Journey | Required experience |
|---|---|---|
| Core | Ask about a parliamentary issue | A concise supported answer; open an exact source moment; see original language and context |
| Next | Prepare for a federal voting day | Confirmed date, official questions, plain-language explanations, attributed arguments and official voting instructions |
| Next | Follow an issue over time | Explicit follows, optional reminders, official result and later source-backed developments |
| Exploration | Join a consultation | Clear non-binding status, optional eligibility proof, review, explicit submission and truthful receipt |
| Exploration | Delegate ongoing research | Review sources and permissions, run an identifiable agent, verify a signed report, revoke future access |
| Later | Local ballots or official vote casting | Separate scope and institutional requirements; no automatic activation |

Suggested mobile entry points are “Understand”, “Voting days” and “Saved”. These are a design starting point, not an approved visual redesign. A new visitor can browse without creating an account. Login is for saved preferences; nationality verification is for a specified consultation only.

### Journey A: question to evidence

Select an issue or ask a question → read a short answer → open a citation → play the corresponding video passage → inspect surrounding transcript → save the source if desired. On mobile, the source can open in a focused view; on desktop, keep the answer beside the evidence. Unsupported claims and missing material are explicitly marked, not filled with plausible text.

### Journey B: a recurring voting day

Open the next confirmed federal event → inspect its ballot items → compare source-attributed arguments → ask follow-up questions → consult official voting instructions → optionally join the separate consultation → return for official results and follow-through. An event may contain multiple items or linked initiative/counter-proposal questions. The schedule comes from official events, not a hard-coded quarterly recurrence.

Language and municipality are explicit preferences. Municipality selects relevant instructions in v1; it does not unlock local ballots or establish electoral eligibility. Original official wording remains available alongside labelled translations and AI explanations. Government recommendations, committee positions and AI synthesis are visually distinguishable.

### Journey C: optional consultation

Read organizer, question version, policy, closing time and privacy explanation → start eligibility verification → return from the phone flow → review answers with none preselected → explicitly confirm → see pending/accepted/rejected/unknown status. Explain at both entry and confirmation that this does not cast an official vote.

The initial walkthrough uses synthetic participants and responses. Real collection depends on a reviewed privacy design and validated eligibility integration. Unsupported devices, cancellation or failed proofs never block public research. A failed network request never creates an assumed successful ballot. Real vote choices must not be copied into the user's profile, agent context, telemetry or ordinary localStorage.

## Acceptance requirements

All requirements start **not evaluated**. Capture evidence against IDs; do not mark completion merely because a screen exists.

| ID | Requirement and acceptance scenario | Stage |
|---|---|---|
| E-01 | Given an authorized recording, ingestion preserves source URL, rights note, language, timestamp alignment and pipeline/model version. Output is labelled real or fixture. | Core |
| E-02 | Given a supported question, each material factual answer claim resolves to evidence. For a question outside the collection, the system says evidence is insufficient. | Core |
| E-03 | Clicking each evaluated video citation starts actual media within two seconds of the recorded passage start; surrounding context and original transcript remain accessible. A broken source produces an explicit error. | Core |
| E-04 | Evaluate at least one German, French and Italian sample. Manually review names, numbers, attribution and translation; record failures separately per language. Unknown speakers remain unknown. | Core |
| E-05 | Run a frozen set of 15 answerable and 5 unsupported questions. Record claim-level support and citation resolution, end-to-end latency, failure rate and GPU measurement method. Correct every unsupported material claim in the public demo path before presenting it. | Core |
| E-06 | At 360px and 1280px viewport widths, complete question → citation → source without clipped controls. Keyboard operation, focus order, readable labels and loading/error states are manually checked. | Core |
| V-01 | A voting-day card distinguishes reserved, confirmed, closed and cancelled events, includes source/last-checked time, and never generates an unofficial date from a recurrence rule. | Companion |
| V-02 | Each item separates official wording, explanation, attributed arguments, recommendations and source links. Missing opposing material is disclosed; the AI does not invent balance. | Companion |
| V-03 | A linked initiative/counter-proposal fixture supports both yes/no questions and the subsidiary preference question. Unanswered and deliberately blank responses remain distinct from no. | Companion |
| V-04 | Official postal/polling/e-voting guidance comes from the responsible authority. Completing an app consultation still shows that official voting must be done separately. | Companion |
| V-05 | Official results preserve their source status, including provisional/final wording. Consultation aggregates have a separate denominator and are never described as representative of Switzerland. | Companion |
| V-06 | Users opt into follows/reminders and can turn them off. Notifications contain no ballot choices; no political affiliation or preferred answer is inferred. | Companion |
| C-01 | Consultation entry, review and receipt state non-binding status. Synthetic mode is visibly labelled throughout and cannot be confused with verified eligibility. | Walkthrough |
| C-02 | The server checks the exact policy, verifier version, challenge freshness and consultation/domain binding. Wrong-policy, expired, revoked where applicable and replayed proofs fail. No client boolean grants access. | Eligibility validation |
| C-03 | Repeat submission with the same idempotency key cannot double-count; concurrent duplicates are tested. Closed or wrong-version submissions fail. Unknown outcomes can be reconciled without resubmitting a second ballot. | Before real collection |
| C-04 | An approved data-flow/threat-model review accounts for operator access, logs, network metadata, identifiers, key custody, tally releases and recovery. Individual choices are not publicly revealed or linked to account identity. | Before real collection |
| C-05 | A physical Swiss-document test records supported device/document versions, completion time, cancellation, read failure, expiry and holder-binding behaviour. No simulated result is presented as this test. | Eligibility validation |
| C-06 | A submission receipt confirms only what the selected protocol actually guarantees. It must not expose the selected answer. UI cannot claim end-to-end verification from a backend success response alone. | Before real collection |
| A-01 | A research mandate states agent, source scope, operations and expiry. Authorization is rechecked before every protected operation; revocation blocks subsequent operations. Previously obtained data cannot be retroactively erased by revocation. | Optional spike |
| A-02 | Modified reports fail signature checks; prohibited, expired and replayed requests fail. A valid signature means attributable content, not factual correctness or MAIS compliance. | Optional spike |
| A-03 | Embedded source instructions cannot change agent permissions. Agents cannot submit consultations, choose answers, sign a ballot or receive raw identity documents. | All agent work |

For E-05, define each “material factual claim” and label set in the evaluation manifest before running it. Report reviewed sample sizes; a tiny clean demo is not a measured production reliability rate. Human usefulness evaluation is separate from model scoring.

## Data and API boundaries

Preserve the existing evidence interface: question, authorized source collection, answer, citations and execution metadata. Execution metadata includes request ID, model/version, collection version, timings, token usage where available and measurement provenance. GPU consumption is unavailable unless measured; do not infer it directly from HTTP latency.

The legacy `Vote` in `frontend/DATA-CONTRACT.md` means a parliamentary division. Keep compatibility, but name it `ParliamentaryDivision` in new domain code. Add distinct entities:

| Entity | Minimum responsibility |
|---|---|
| PopularVoteEvent | Official ID, date, jurisdiction, publication/status, source and freshness |
| BallotItem | Official text and language, question type, related items, official decision rule and reviewed links to parliamentary business |
| Consultation | Organizer, versioned question set, policy, open/close times, privacy/protocol version and non-binding status |
| EligibilityChallenge / EligibilityResult | Minimal proof requirements, validity, verifier identity and scoped outcome; separate from profile |
| SubmissionStatus | Reconciliation and idempotency state; no profile-readable ballot choice |
| OfficialResult | Official source and status, counts, decision rule and publication time |
| ConsultationAggregate | Cohort definition, denominator, release policy, limitations and protocol reference |

Candidate routes, to finalize in the first implementation slice: `GET /popular-votes`, `GET /popular-votes/{id}`, `GET /consultations/{id}`, `POST /consultations/{id}/eligibility-challenges`, `POST /consultations/{id}/submissions`, and a receipt-scoped status endpoint. These are interface responsibilities, not a settled cryptographic wire format. An ordinary authenticated JSON ballot POST must not accidentally become the chosen privacy architecture.

Freeze a consultation's question and policy versions when it opens. A substantive correction cancels/reissues it with a visible explanation rather than silently changing a question people already answered. Default recommendation: one final submission per qualifying participant; changing an accepted answer requires a separately reviewed replacement protocol. Keep ballot drafts in memory in the first walkthrough, with explicit clearing on exit.

Keep application account, proof verification and ballot handling logically separated. A selected design must explain whether the NFC proof is verified directly or through a trusted attestation service. Merely using Midnight does not establish that separation or privacy. See [the voting research](research/SWISS-VOTING-AND-NFC.md) for unresolved protocol questions.

## Spec-driven implementation sequence

For each slice: write a one-page change specification with requirement IDs → settle data/error contracts → define acceptance examples → implement the smallest vertical path → collect test/manual evidence → update status and unresolved decisions. A PR describes observable behaviour, relevant requirement IDs and the exact validation performed. The specification changes when a product decision changes; code and docs must not silently diverge.

| Slice | Deliverable | Completion evidence |
|---|---|---|
| 0. Baseline | Confirm endpoint/model/auth/concurrency/window and licensed source set; inspect existing backend | Configuration without secrets, source manifest and measured request |
| 1. Evidence | Real recording → passages → answer → playable citation | E-01 through E-06 report and recorded walkthrough |
| 2. Voting companion | One real federal event plus one clearly synthetic complex-ballot fixture | V-01 through V-06; users can distinguish official information from interpretation |
| 3. Participation storyboard | Complete synthetic consultation journey and device handoff states | C-01; usability results; documented unresolved privacy/provider decisions |
| 4. One technical spike | Physical eligibility integration OR scoped agent mandate, chosen by evidence and available specialists | C-02/C-05 or A-01/A-02; accurate limitations |
| 5. Private pilot readiness | Reviewed protocol, deployment/data policy and submission integration | C-03/C-04/C-06; gated separately from hackathon demo |

For the remaining ten-day opportunity window, recommend days 1–2 for baseline/specification, 3–5 for the evidence path, day 6 for usability and comparison, 7–8 for the weakest essential capability and at most one spike, and 9–10 for evaluation/export/walkthrough. Calendar time and capacity remain dependent on the technical team's confirmed availability. The proposed 40 GPU-hours is a cap awaiting scheduling, not a claim of spare capacity or an instruction to interrupt the main deployment.

Connect `/ask` and `/evidence/{id}` before personalized dashboards, followed by debate/transcript. This resolves the inconsistent priority lists in the older handoff documents for this cycle. Keep calls behind `frontend/src/services/api.js`; preserve the worker and Sites build pipeline. Any future UI implementation must follow the applicable frontend instructions and run the relevant checks.

Use existing inference before evaluating another model. Record actual allocation duration and GPU count, utilization/memory samples when accessible, request counts and queue time. Separate shared-server measurements from attributable experiment usage. Export portable app code, permitted data, evaluation manifests and configuration before expiry; model-weight portability depends on its license.

## Opportunity and business validation

The [competitive memo](research/COMPETITIVE-LANDSCAPE.md) is the evidence base. Our recommended initial commercial hypothesis is distribution through an association, civic publisher or education partner that needs trustworthy multilingual explanations. Citizens can be the users while an organization pays for preparation, embedding or facilitation. No willingness to pay has yet been demonstrated.

| Opportunity | Concrete value to test | Cheapest useful evidence |
|---|---|---|
| Citizen ballot companion | Reach understanding and a verifiable source with less effort | Observe six prospective citizens across language needs on one ballot task |
| Briefing service for associations/publishers | Reduce editorial preparation while preserving traceable evidence | Two professionals compare their current process with one delivered briefing |
| Verified private consultation | Organizer trusts participation policy and citizens understand disclosure | Two organizer interviews and a synthetic end-to-end journey before real collection |
| Agent mandate infrastructure | Developers need portable delegation and revocation beyond ordinary application permissions | Two integrator interviews plus a bounded signed-report demonstration |
| Multilingual video/document reuse | Same pipeline solves an adjacent organization's actual recurring task | A permitted sample and a timed comparison, after core acceptance |

Ask people to show their current workflow, identify a recent failure and complete a task. Record task success, source-verification success, confusion, time, repeat-use intent and willingness to pilot. Seek permission before any interview recording; no outreach has been sent by this research work.

Use the earlier comparison weights only after gathering evidence: usefulness/repeat intent 40%, reliability 30%, differentiation 20%, operating cost 10%. Keep missing feedback marked missing; any selection without users is provisional. There are no numeric market or revenue forecasts here. The next commitment should follow observed usefulness, not the availability of a large GPU.

## Open decisions and owners to assign

| Decision | Recommended default / next evidence | Required before |
|---|---|---|
| Exact judging requirements | Product lead reconciles chosen MVP with organizer rubric | Claiming challenge completion |
| Source access/rights and endpoint | Technical lead confirms service and permitted artifacts | Real ingestion and GPU use |
| Language coverage and accessibility | Test DE/FR/IT now; mark unsupported content; assess Romansh need | Coverage claims |
| Identity provider | Compare physical tests and privacy/configuration, including existing Rarimo work | Real eligibility claims |
| Consultation policy and organizer | Explicit nationality/age policy, not electoral-register verification | Participant recruitment |
| Privacy and duplicate prevention | Specialist-reviewed protocol and multiple-document policy | Real responses |
| MAIS scope | Pin proposal version and map only implemented features | Interoperability claims |
| Buyer and distribution | Interview partners using a concrete briefing | Pricing or commercial expansion |

No model training, binding vote casting, campaign persuasion, sale of political profiles or commercial launch is included in this cycle.
