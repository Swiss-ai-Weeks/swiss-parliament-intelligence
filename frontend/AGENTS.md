# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Approved product direction

### Parliamentary intelligence update — 17 September 2026

Tomas requested continued real AI processing, broad parliamentary ingestion, politician vote histories, source-based investigation of position changes, and a clear distinction between current proceedings and historical votes. The new Parliament view uses real official OData imports. Never interpret missing vote records as abstentions, current party membership as historical membership, or procedural text carrying a chair ID as their speech. Comparisons require reviewed role and proposal-version context; no automatic hypocrisy or integrity score. See `../docs/research/PARLIAMENT-INTELLIGENCE-UPDATE.md`.

### User direction update — voice and Swiss branding, 17 September 2026

Tomas selected https://heyaristotle.com/ as the design reference: immersive illustration, warm serif typography, a personable conversational experience and a counter-trend feel. Translate that direction into distinctly Swiss figures, symbols, history and regional details. Keep source panels readable and professional across mobile and desktop. Voice and text should share one evidence-backed conversation, with explicit canton selection for future local ballot discovery. ElevenLabs Creator access is user-reported for three free months; verify the actual Agents/API entitlement. See `../docs/VOICE-AND-SWISS-BRAND-PLAN.md` for the updated implementation order. This is a durable approved direction; the current interface has not yet been reskinned or given speech support.

### User-approved implementation — 17 September 2026

Build Midnight Vote — Swiss Pilot as the responsive default experience, preserving the existing application at `/legacy`. Use restrained Swiss editorial styling, ivory backgrounds, generous spacing and muted red accents. Citizens are primary, with explicit Research view available on mobile and desktop. Five historical voting dossiers, anonymous reading, ordinary Supabase accounts and source-linked AI actions are approved. Optional private identity remains a clearly labelled concept until core acceptance passes. Official explainers must never be labelled parliamentary debate recordings; distinguish publisher captions, editorial summaries and machine processing. These decisions supersede the older dark desktop-first prototype direction below for the pilot.

### User direction update — 14 September 2026

The user has shifted the next product cycle toward a simple citizen journey in a responsive web app, with desktop evidence inspection, federal popular votes first and local ballots later. Public information remains accessible without passport verification; proposed verified participation stays non-binding. See `../docs/README.md` and `../docs/PRODUCT-SPEC.md` for research, acceptance criteria and open decisions. Current work is documentation, not an approved replacement visual layout. The older desktop-first audience/journey preferences below describe the existing prototype and must not override this newer user direction. Keep exact navigation and provider choices open until the relevant implementation specification is settled.

### Existing prototype reference

- Desktop-first, dark, evidence-centered interface based on `design/approved-conversational-briefing.png`.
- Dashboard is the default home and the first navigation item. It summarizes tracked proposals, upcoming parliamentary activity, recent evidence, and voting context.
- Keep the default Ask experience simple; advanced research controls belong behind the Investigate mode.
- Ask Parliament opens directly on the question composer. Do not repeat an Ask/Investigate mode switch inside that screen because both destinations already exist in persistent navigation.
- Original parliamentary video, transcript, and source metadata must remain visually primary over AI interpretation.
- The source sidebar includes a compact "Speakers in this debate" portrait list directly below "About this source".
- The core demo journey is Dashboard → Ask → cited source → full Debate → Investigate → Proposal Tracker.
- Personalization is explicit: people, parties, proposals, and topics are items the user chooses to follow. Never infer or label a user's political affiliation.
- The dashboard greeting uses the account display name, falling back to "Citizen". Settings owns this preference along with language, notifications, and privacy controls.
- Calendar is a first-class workspace. Each event is selectable and opens an adjacent detail inspector with an action to open the related debate/proposal or create an alert.
- Alerts are monitoring rules created from explicit filters or a natural-language prompt. AI suggestions are always rendered as editable chips before a rule is saved.
- Investigate's AI filter builder is assistive only: it proposes period, level, type, topic, and chamber filters for review before search.
- Prototype screens consume one normalized fixture model so that debate IDs, people, timestamps, proposal stages, and citations remain consistent and can later be replaced by API responses.
- Keep persistence temporary and explicit: `usePersistentState`/localStorage is only for demo continuity; production preferences, follows, alerts, history, and saved research must come from the authenticated backend.
- Keep network access behind `src/services/api.js` (`createApiClient`). Screens should consume a provider rather than calling `fetch` directly so fixtures can be replaced by the real API without a UI rewrite.

### Cleisthenes update — 17 September 2026

The assistant is named Cleisthenes, with an original friendly Greek-inspired illustrated avatar. User requests an always-available bottom-right compact chat, expandable into its own page, fewer competing controls, visual support and an Apple-like restrained finish within the Swiss / Hey Aristotle direction. Keep source details progressively disclosed and preserve chat when expanded. Continue current-session ingestion, multilingual retrieval, speed and genuine parliamentary-video alignment. Stance-change work is explicitly paused; hide its controls. Voice is still a later integration. The new avatar is a generated raster asset at `public/images/cleisthenes.png`.

### Profile and retrieval feedback — 17 September 2026

Tomas wants varied questions to select relevant checked sources, particularly party-background follow-ups after a politician’s speech. Keep official profile fields, party self-description and personal parliamentary statements distinct. Provide official portraits, declared background, dated individual votes, and verified professional contacts. AI correspondence is an editable draft with an email-app handoff; never send automatically. Use concise About / Votes / Write sections, paginate long voting histories, and state import coverage. Do not infer personal ideology or restart stance-change analysis.

### UX refinement — 17 September 2026
Use Parliament / Dossiers / Saved as destinations; Research is a dossier-level mode, not a duplicate main navigation item. All AI entry cards open the same contextual Cleisthenes chat with visible source scope and a focused composer. Avoid permanent flagship shortcuts in general directories. Style disclosure panels, segmented choices, inputs and buttons using the shared cream, muted-red and rounded-surface language. Appllama's Craft New Chat pattern informed the context label, suggestion chips and clear composer; retain original Swiss branding.

### Reader-first update — 17 September 2026
Use Topics & votes / Thèmes et votations in the navigation. People seek documents, subjects, speakers and statements; use Read the debate as the search entry. Always show matching text even without timed video. Keep experimental image similarity in advanced tools. Official portraits and canton/chamber context belong in profiles. Never replace an empty AI answer with a generic coverage disclaimer. See ../docs/TOPICS-AND-READER-ROADMAP.md.

### Conversation and citation feedback — 18 September 2026
Use short topic chips rather than full-question suggestion cards; selecting one prepares an editable prompt. Keep one concise AI/source note in the chat footer. Remove the generic all-imported-evidence banner and repeated provider labels; retain a concise label for an explicit person/proposal/passage scope and recorded replay status. Preserve conversations across navigation, expansion/collapse and reload. Recent chats may be stored on-device for this pilot, clearly labelled with delete controls; do not imply account sync. Citations open a separate source inspector with original context, official portrait when available, dated speaker/role information, proposal context, bounded video start/end when actually aligned, and editable follow-up questions. Never invent timings or portraits to fill missing coverage.

### Contextual research feedback — 18 September 2026
Keep original debate words visible with in-place translation and a target-language choice. Highlight query terms, tolerate accents/plurals and small spelling errors, and disclose fuzzy matches. Require meaningful terms together, not OR matches on generic words. Source actions must open Cleisthenes scoped to the selected passage with the research query in the editable prompt. Show both video boundaries and stop playback at the end. Visual image similarity is never evidence of spoken subject matter. Synthetic translation audio must be labelled separately from original recordings; ElevenLabs app access is not configured yet.

### Approved Greek–Swiss integration — 18 September 2026
Use the finalized Civic Companion Design Lovable project dfabf414-608e-48cf-a632-e32b28e67c17 and the local brand-exploration/BRANDBOOK.md plus REVISION-02.md. Warm rag paper #F3EDDF, ink #252823, limestone #D9CBB4, lake #7E9BA5, sage #87907A, terracotta #A24F40; Source Serif 4 headings and IBM Plex Sans UI. Preserve the portico, Swiss landscape, original mascot and scroll sequence at the entry. Use restrained editorial layouts for research, clear source types and functioning reading preferences. Landing demos must route to live features; eligibility proofs and community voting must not appear operational. The canonical proposed public mount is /Switzerland/; the existing midnight.vote root site and API must remain separate. See ../docs/GREEK-SWISS-INTEGRATION.md.

### Landing demos — 18 September 2026
The user explicitly requested interactive simulations in all three landing chapters: quote/timestamp/translation research; a polished phone showing selective eligibility proofs (Swiss citizen, 18+, optional canton) with the real Midnight Network SVG; and a scripted Cleisthenes discussion leading to a simulated community vote with a fingerprint confirmation. This supersedes the earlier instruction to replace demos with static live-feature cards. Clearly label fictional words/timing and future proof/voting flows; do not access identity data, biometrics or a network transaction. Keep a path into the real app. Blend the closing message into the Geneva artwork without a hard horizontal seam.
