# Swiss civic companion: voice and visual direction

> Historical roadmap and design source. Durable product direction is consolidated in the [product specification](../../PRODUCT-SPEC.md); current implementation is in [status](../../STATUS.md).

17 September 2026 — roadmap amendment following Tomas's ElevenLabs and Aristotle direction. This document plans the next implementation; voice, canton coverage and the visual redesign are not yet shipped. Existing source verification, historical labels and acceptance gates remain in force.

## Product proposition

Understand Swiss public decisions by talking them through, reading clear explanations, and checking original evidence. One conversation supports typing, speech input and optional spoken answers. The professional Research view keeps the same evidence visible beside that conversation.

“Help me understand what we are voting on” is the entrance. “Show me where that comes from” is the defining action. A citizen can ask for the strongest attributed arguments on either side or challenge an explanation. The companion supports the person's reasoning without inferring their political affiliation or recommending a personalized voting choice.

Keep Midnight Vote — Swiss Pilot as the working product name. A new public-facing name and the relationship to the Midnight parent brand remain open. Identity stays optional and downstream of understanding.

## Newly available resources

| Resource | What is known | What still needs checking |
|---|---|---|
| ElevenLabs Creator for three months | User reports free promotional access | Activation, workspace, whether promotion covers Agents/API, actual credit balance, renewal date and overage settings |
| NVIDIA Cloud Account “AI Parliament” | User screenshot shows ACTIVE | Service entitlements, credit balance, quotas, regions and expiry; account status alone proves none of these |
| LaunchPad GPU environment | Previous SSH/model/ASR checks succeeded | Recheck service availability before each rehearsal; do not equate this with the separate cloud account |

Do not put account numbers, personal email addresses, private keys or the account screenshot into public evidence bundles. Promotion duration does not imply unlimited use. No new paid usage, public endpoints or account settings are established by this planning update.

## ElevenLabs choice

Reception.ai is a packaged phone receptionist for business calls, scheduling and operations. Our product needs an embedded conversational interface over our own evidence. Use ElevenLabs speech APIs for the first bounded slice; evaluate ElevenAgents for continuous conversation. Do not introduce a telephone number, receptionist workflow or separate CRM into the pilot.

The current public ElevenAgents pricing page lists 275 included call minutes for Creator, with external LLM usage separately metered. An older help article lists a different allowance. Verify the actual promotional workspace before planning consumption; do not assume Creative, API, Agents and Reception entitlements are interchangeable.

Sources: [Reception overview](https://elevenlabs.io/docs/reception-ai/overview), [current Agents pricing](https://elevenlabs.io/pricing/agents), [custom LLM integration](https://elevenlabs.io/docs/eleven-agents/customization/llm/custom-llm). Checked 17 September 2026. No ElevenLabs agent has been created or paid plan changed by this amendment.

## One conversation, multiple input and output modes

The mobile entrance offers **Ask about a vote**, **Talk it through**, and **Explore dossiers**, alongside explicit canton and language selectors. Voice is opt-in. Reading and typing work without microphone permission or an account.

First voice slice:

1. Tap the microphone; see listening, stop and cancel states.
2. Speak a question. Show the recognized text, with correction available before submission in the first pilot.
3. Submit through the same dossier-scoped evidence API used by chat.
4. Render the answer and citations. Speak the validated answer text through ElevenLabs, with stop/mute controls.
5. Open a cited document or exact video passage without losing the conversation.

Keep a short-lived conversational context containing the selected dossier, language and explicit follow-up references. The current single-turn question matcher must be extended: speech alone will not make “why?”, “the other argument”, or “what about that claim?” work. Resolve those references into a scoped request; ask for clarification when ambiguous. Never reuse evidence from a different dossier simply because it appeared earlier in the session.

The voice model does not invent an alternative answer after citation validation. Spoken factual content must come from the same validated result as the visible answer. Speak attribution in ordinary language, e.g. “The referendum committee argued…”, while showing the corresponding source chip. Identify original speech, publisher captions, editorial text and AI translation distinctly.

A continuous ElevenAgents session is a second slice: turn detection, interruption, transcript updates and synchronized source events. It must call our evidence tools for factual answers. If provider orchestration cannot preserve validated wording and citations, retain push-to-talk plus speech playback for the presentation.

## Architecture

```text
Typed question ──────────────────────────────┐
Mic → ElevenLabs speech recognition → text ─┤
                                            ↓
                          Pilot conversation / scope API
                                            ↓
                  Selected canton + voting day + dossier
                                            ↓
                  Verified official records and evidence
                                            ↓
                      NVIDIA bounded answer generation
                                            ↓
                     Claim/source validation and refusal
                                            ↓
                  Visible answer + citations + optional TTS
```

NVIDIA remains responsible for evidence processing and grounded generation. Existing Parakeet transcription stays useful for archived recordings; it is not presented as Riva. VSS analysis remains an unresolved gate. ElevenLabs handles the conversational audio interface, avoiding a second live ASR deployment as a prerequisite for the first voice demo.

Keep provider adapters server-side. Proposed boundaries: `POST /api/speech/transcribe`, `POST /api/speech/synthesize`, and a versioned conversation endpoint over the existing research functions. Set input size/duration limits, session limits, timeouts and usage counters. Mint short-lived browser credentials only when the chosen provider transport requires them; never send a permanent provider key to the frontend.

The existing local SSH tunnel cannot be called by ElevenLabs cloud services. A full ElevenAgents custom-LLM deployment needs a separately secured, authenticated HTTPS application gateway; do not expose the GPU service directly. The speech-API-first approach can use outbound server requests and keep the existing NVIDIA tunnel during local rehearsal.

Measure end-of-utterance → transcript → first supported answer → first audible answer. Previous text inference measurements are not voice latency measurements. If the answer takes several seconds, show the transcript and a clear research state; do not conceal the delay with unsupported filler.

Privacy copy must say that audio goes to the speech provider and questions/evidence go to server inference. Default application behavior: no persisted raw audio and no saved conversation unless explicitly requested. Confirm provider-side recording/retention settings separately before promising any retention policy. Neither this pipeline nor ordinary Supabase accounts establish local, sovereign identity. Never pass passport data to the voice workflow.

## “What are the current voting subjects in my canton?”

This is a new data capability, not just a voice prompt. Add one pilot canton first, chosen explicitly by the user. Geneva is a provisional recommendation for a French-first demo, not a confirmed choice. Preserve federal dossiers for all users; expand cantonal coverage after the demo.

Use official canton voting pages and federal information, with a human-checked snapshot for the selected voting day. Store jurisdiction level, canton code, municipality where applicable, voting date, status, original official question, source URL, retrieval time and review state. Municipal items require an explicit municipality and verified local coverage. Location selection is a relevance preference, not proof of voting eligibility.

Proposed tool: `list_ballots(canton, municipality?, asOf, language)` returns verified records and coverage metadata. `answer_dossier`, `compare_arguments` and `open_evidence` continue to use stable dossier/evidence IDs. Do not use unconstrained model knowledge or a fixed four-times-per-year assumption to produce a “current” list.

Conversation when location is unknown: “Which canton?” If the user asks about municipal matters: “Which municipality?” No background geolocation is necessary. If the catalogue is stale or unavailable, state the missing coverage and link to the official page. Distinguish “no verified data in this pilot” from “no ballots scheduled”. Do not relabel the five historical dossiers as current.

Pilot acceptance: correctly resolve one canton and one date, distinguish federal/cantonal/municipal scope, show the last-checked date, open official sources, and refuse unsupported locality/date combinations. “Debate this with me” means exploring attributed perspectives and uncertainties, not pretending to represent an actual official or campaign.

## Swiss visual direction inspired by Aristotle

Reference inspected: [Aristotle](https://www.heyaristotle.com/), public landing page, hero and subsequent content sections. Its signed-in application was not inspected; do not claim a full application audit.

Observed elements: an immersive illustrated architectural threshold, warm landscape light, large serif headlines, sparse navigation, a character within the scene, paper-like transitions and faint notebook grids. The public product description also emphasizes speaking, listening and interruption. The desired transfer is this warm cultural world and conversational welcome, expressed through original Swiss imagery.

Proposed creative direction: **a Swiss civic salon and atlas**. A welcoming public room opens onto Switzerland; citizens can explore questions together, with reliable sources always close at hand.

| Design element | Swiss interpretation |
|---|---|
| Architectural hero | Illustrated civic interior or public arcade opening onto a Swiss town-and-landscape scene |
| Companion | An original fictional civic guide; explore a contemporary Helvetia as an allegory, clearly independent of government |
| National figures | Curated historical portraits/objects in contextual editorial features, with sources and dates; history is not decoration presented as evidence |
| Symbols | Cantonal geography, local architectural details, botanical motifs, subtle red accents and multilingual annotations |
| History | Timeline cards and archival illustrations; mark legends such as William Tell as legends, and distinguish period images from generated artwork |
| Typography | Expressive, readable serif for editorial headings; clear sans-serif for controls, transcripts and source metadata |
| Palette | Warm paper, deep ink, stone, restrained vermilion, lake blue and forest green |
| Motion | Gentle scene changes and a restrained listening animation; reduced-motion support |

Represent cities, rural areas and the different language regions, with varied historical and contemporary civic perspectives. Switzerland should feel lived-in, not reduced to mountains, watches or a wall of flags. Historical personalities should not appear to endorse today's ballot positions. A fictional guide can have its own licensed voice; cloning a public figure's voice is unnecessary.

Mobile: illustrated welcome → canton/language → one conversation with a visible transcript and source drawer. Desktop: the same visual language around a quieter split workspace with conversation, arguments, video and transcript. Keep scenic art away from dense evidence text; preserve contrast and reading speed. Use real reviewed source material inside evidence panels, never decorative generated “archives”.

Suggested brand promise: **Understand Switzerland. Make up your own mind.** This is proposed copy, not a final naming decision.

Before changing the working interface, make a concrete mobile-and-desktop visual concept from this brief and inspect it against the Aristotle reference. The user has approved the reference direction; a full reskin has not been implemented in this update.

## Revised delivery order through 23 September

| Date | Work and gate |
|---|---|
| Thu 17 | Record reference direction and resources; confirm ElevenLabs entitlement and pilot canton; preserve working core |
| Fri 18 | Up to half a day for speech input → existing cited answer → spoken playback; in parallel work allocation, prioritize the missing parliamentary source. Stop the voice spike if it compromises the real-evidence gate |
| Sat 19 | Implement the Swiss visual system on home, dossier and conversation; desktop Research retains source visibility. Add conversation scope/follow-up handling |
| Sun 20 | Verify one canton's official ballot snapshot if feasible; integrate language switching, microphone denial, stop/cancel and provider-failure states |
| Mon 21 | Human trials and language/claim review; measured voice latency, citation and interruption checks. Continuous ElevenAgents conversation only if the bounded voice slice and evidence gates pass |
| Tue 22 | Feature freeze, voice/text rehearsal, screen recording and explicit offline fallback; retain text when speech services fail |
| Wed 23 | Presentation and contingency; no new services or infrastructure changes |

The schedule reallocates effort; it does not add a second product. Cut live identity integration first, then continuous voice and broad canton expansion. Keep identity as the concept already implemented. If one current canton cannot be verified, demonstrate voice over the genuine historical e-ID dossier and say exactly what coverage is available.

Voice acceptance additions: EN/FR speech input and output; visible/correctable transcription; microphone denial leaves chat usable; cancel stops capture; stop silences playback; citations identify every material spoken claim; unsupported answers remain unsupported when spoken; no provider key in the browser; usage/latency measured. DE/IT and Swiss-German accents need explicit trials before promising quality. Romansh retains curated text/video until the selected speech models and actual samples establish adequate support.

## Three-month opportunity

Use the promotion for recurring user testing after the hackathon: pronunciation and language quality, returning conversations, additional verified cantons, and professional briefing feedback. Record actual usage costs before expiry. Investigate institutional willingness to pay after demonstrating repeat value; do not derive a business model from temporary free infrastructure.
