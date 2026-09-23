# Cleisthenes product proposal

**Status:** proposed direction for the hackathon submission. This document does not override implemented-capability limits in [STATUS.md](STATUS.md) or system truth in [ARCHITECTURE.md](ARCHITECTURE.md).

## The decision

**Cleisthenes is the product. Midnight is the privacy and trust layer.**

The current experience already behaves this way: people ask Cleisthenes questions, inspect evidence with Cleisthenes and return to Cleisthenes for follow-ups. The `midnight.vote` domain can remain the host for the hackathon, but the interface, README and presentation should introduce **Cleisthenes** first.

**Cleisthenes** is the canonical product and companion name. Keep this spelling consistent in user-facing copy, documentation, code comments and presentation material.

Recommended product line:

> **Cleisthenes is your evidence-backed AI civic companion for understanding public decisions.**

Recommended supporting line:

> Ask about Parliament, a proposal or a vote. Cleisthenes finds the relevant public record, explains it in your language and keeps the original sources close.

Midnight should appear as a capability statement, not the main product promise:

> **Privacy powered by Midnight.** Selective disclosure can prove that a participation rule is satisfied without exposing unnecessary identity data.

Today this remains a labelled future participation layer. Public research does not require a passport, proof of humanity or proof of eligibility.

## Positioning

**For** people who need to understand a Swiss public decision but do not have the time or specialist knowledge to reconstruct it from fragmented records,

**Cleisthenes** is an AI civic companion that turns official parliamentary material, proposals and vote information into concise, multilingual and source-linked explanations.

**Unlike** generic chatbots, voter-matching tools or parliamentary databases,

**Cleisthenes** keeps each important claim connected to the original public record, including the speaker, context and—where processed—the exact recording passage. Midnight adds a separate path for privacy-preserving eligibility and participation instead of making identity a prerequisite for understanding.

This positioning should guide scope: if a feature does not help someone understand a decision, verify the evidence, remember useful research or participate with clear consent, it is secondary.

## Product architecture

| Layer | User promise | Current or proposed responsibility |
| --- | --- | --- |
| **Cleisthenes** | Help me understand and decide for myself. | Conversation, retrieval, explanations, comparison, translation, citations and research continuity. |
| **Public record** | Let me verify what the answer is based on. | Parliament, people, proposals, votes, recordings, transcripts, dates, outcomes and source revisions. |
| **Personal library** | Let me keep the evidence that matters to me. | Saved passages, briefings, follows and conversations, with clear account/device storage language. |
| **Midnight privacy layer** | Let me prove only what a participation rule needs. | Future selective-disclosure eligibility or proof-of-humanity policy for a clearly non-binding consultation. |
| **Participation** | Let me respond knowingly and on my own terms. | Labelled consultation flow, distinct from official voting and unavailable until its protocol is reviewed. |

## Proposed information architecture

The current top-level structure separates the assistant from the records it helps people understand. The proposed structure makes the assistant the front door and the public record its evidence library.

1. **Ask Cleisthenes** — default home and continuing conversation.
2. **Explore** — topics, proposals and popular votes in a citizen-readable catalogue.
3. **Parliament** — sessions, chambers, people, businesses, speeches and recordings for deeper research.
4. **Library** — saved sources, briefings, follows and conversation history.

Settings and account remain utilities. Midnight appears in privacy/participation explanations and at the point where selective disclosure becomes relevant.

On a phone, Cleisthenes should use a full-height conversation view with a focused source reader. On desktop, it can keep a compact panel over an evidence page, but expanding it should create a deliberate two-column answer-and-source workspace rather than a larger floating window.

## Live UX review: immediate evidence

This is a targeted live inspection performed on 22 September 2026, not the final combined accessibility audit. The final audit still needs saved screenshots at desktop and mobile widths, keyboard testing and assistive-technology checks.

### Landing and shell

- The landing already introduces the companion, but `midnight.vote` remains the dominant wordmark and browser title. The product and the character therefore feel like two different brands.
- The editorial paper palette, Swiss landscape, typography and character are distinctive and should stay.
- “Understand / Stay private / Participate” is a useful story, but the product should begin with the everyday outcome—understanding a decision—before explaining the underlying privacy technology.

### Home

- The prominent Cleisthenes composer is the right primary action.
- Parliament, topics, saved research, agenda, calendar, follows and updates all compete on one long dashboard. The first screen needs a clearer hierarchy: ask, continue recent research, or open an upcoming decision.
- The compact chat launcher duplicates the central composer. After Cleisthenes becomes the product, these should feel like one continuous conversation rather than two entrances.

### Parliament

- The live route remained on “Loading official records…” without an error, retry or diagnostic path during inspection.
- This is a submission blocker because Parliament is the core evidence collection. Loading, empty, partial and failure states must be distinct.
- The destination should start with understandable entry points—current session, people, proposals and search—before exposing expert controls.

### Topics and votes

- The current filter row is comprehensive but reads like a database query form. A citizen first needs recognizable decisions, dates and themes.
- Only five records are visible in the current catalogue, while the processed Parliament corpus is much larger. The interface should state the difference between curated dossiers and searchable parliamentary evidence.
- “Search with Cleisthenes” and the persistent Cleisthenes panel are two versions of the same action. Search should become a scoped Cleisthenes question with the scope visibly editable.

### Dossier

- The overview, debate, timeline and sources structure is strong. Source types and historical-vote status are visible.
- The page is dense and repeats AI entry points in the dossier card and floating panel. One persistent scoped conversation should replace repeated action buttons.
- The right-side source list is useful on desktop, but it competes with the chat overlay. Expanding a citation should deliberately switch to a source-reading layout.

### Conversation

- The character, calm opening state and claim-level source cards are differentiating strengths.
- Suggestion chips fill the composer but do not submit. Keeping prompts editable is good, but the behavior needs a clearer affordance or a one-click/send choice.
- The inspected English conversation returned one claim in English and one in French. Answer-language consistency is a submission-level acceptance requirement.
- The compact panel covers the source content it is meant to support. The expanded experience should prioritize answer, nearby citations and focused source inspection.
- Model progress, missing evidence and provider failure need different messages. The implemented source-only fallback is the correct reliability direction.

The detailed response model, research workflow, language contract and video/law/source interaction are specified in [Cleisthenes research answer experience](CLEISTHENES-ANSWER-EXPERIENCE.md).

## UX programme

### Submission slice

1. Rebrand the visible shell, browser title, README and product story to Cleisthenes while keeping the `midnight.vote` domain and infrastructure references.
2. Make the primary journey unmistakable: ask → receive a short cited answer → open the supporting passage → inspect the original source.
3. Fix Parliament's unresolved loading state and add retry, partial-data and empty states.
4. Enforce the requested answer language across every claim and translation state.
5. Remove duplicate AI entry points where they create competing composers; preserve the scoped conversation.
6. Make corpus coverage visible: curated dossiers, imported parliamentary records, processed recordings and unavailable media are separate counts.
7. Validate the core journey at 360 px and 1280 px with keyboard operation, visible focus, touch targets, loading, failure and source inspection.

### Product refinement after submission

1. Redesign Home around three intents: ask a question, prepare for an upcoming decision, or continue saved research.
2. Turn Explore into a citizen catalogue with upcoming/recent decisions, topic collections and plain-language cards; keep advanced filters progressively disclosed.
3. Turn Parliament into the deeper evidence explorer with explicit sessions, people, proposals, speeches and recording coverage.
4. Make expanded Cleisthenes a two-column research workspace on desktop and a conversation/source stack on mobile.
5. Unify Library, follows and conversation history around saved evidence rather than generic account content.
6. Run task-based comparison testing against Perplexity/Craft patterns without copying their visual identity: concise answer hierarchy, persistent composer, visible scope and nearby sources.

## Data completeness programme

“Full data” must be expressed as a measurable coverage contract rather than a general claim.

### Current processed corpus

- 185 official sessions declared for the 1990–2026 archive boundary; 121 are text-complete today.
- 1,041,964 public passages exported locally; the immutable active H100 batch indexed its first 109,980 into 110,063 E5 chunks.
- 205,797 recording jobs reconciled: 5,618 locally known complete, 20,307 initially placed in the active Canary handoff and 185,490 added by the one hundred and seven later-session imports.
- 3,327 receipts in the earlier three-session checkpoint accepted by the current provenance rules; seven official media URLs returned 404 in that completed worker run.
- 7,988 machine timing candidates across 2,919 recordings after the latest active-worker checkpoint; none should be presented as human-reviewed timing.
- Nine recordings / 400 visual chunks in the bounded Cosmos VSS pilot.

The earlier three-session H100 batch is complete for its defined queue. The archive-wide E5 and Canary handoff is now running against the larger reconciled backlog. Neither milestone is **the complete history of Swiss Parliament**.

### Definition of complete

For every declared session or archive range, publish a coverage ledger containing:

1. official records discovered;
2. official-text passages imported;
3. media URLs found, unavailable or changed;
4. ASR completed, rejected or pending;
5. alignment candidates produced and human-reviewed;
6. embeddings produced and indexed;
7. language, model and pipeline revision;
8. last reconciliation time and known source gaps.

### Expansion sequence

1. Close the current twelve-receipt validation gap: seven media 404s, eleven legacy receipts without current provenance metadata and one silent clip overlap the completed worker totals as documented in status.
2. Decide the archive boundary needed for the demo and presentation; do not say “all Parliament” unless that boundary is complete.
3. Reconcile all businesses, people and vote records referenced by the selected sessions.
4. Expand session-by-session with resumable processing and the same coverage ledger.
5. Human-review the small set of video moments used in the public demo before expanding visual search.

## Submission plan

### P0 — product truth and demo reliability

- Cleisthenes-first naming and positioning.
- One supported question-to-source journey that works repeatedly.
- Parliament loading/error recovery.
- Answer-language consistency.
- Accurate data-coverage language and final H100 status.
- Desktop/mobile and forced-outage rehearsal.

### P1 — clarity and navigation

- Simplified Home hierarchy.
- Citizen-first Explore cards with advanced filters disclosed later.
- Clear separation between curated dossiers and the broader parliamentary corpus.
- One scoped Cleisthenes conversation instead of repeated assistant entry points.

### P2 — broader product vision

- Library/follows refinement.
- Full archive expansion and human-reviewed video moments.
- Midnight selective-disclosure participation flow after protocol and privacy review.
- The separate Jev model investigation is intentionally out of scope for this proposal.

## Submission narrative

1. **Problem:** Swiss civic evidence exists, but it is fragmented across debates, proposals, votes, languages and long recordings.
2. **Product:** Cleisthenes is an AI civic companion that helps a person understand a decision without surrendering the source or the decision itself.
3. **Demonstration:** Ask a real question, receive a concise cited answer, open the exact public record and inspect the original passage.
4. **Technology:** NVIDIA models process and explain multilingual public evidence; the application attaches and validates sources rather than treating the model as the authority.
5. **Privacy vision:** Midnight can add selective disclosure for clearly defined participation rules, while research remains open and identity-minimized.
6. **Boundary:** Cleisthenes informs and supports participation; it does not cast an official vote or claim completeness beyond the published coverage ledger.

## Acceptance before submission

- A first-time visitor can explain what Cleisthenes does after the landing screen.
- A user can complete question → cited answer → original source without assistance.
- Every displayed claim uses the requested language and resolves to a readable source.
- Provider failure produces retrieved sources or a specific recovery state, not a blank page or generic 502.
- Parliament never remains indefinitely on an unexplained loading message.
- Mobile chat does not hide the composer, active answer or source-opening action.
- The README, product specification, browser title, navigation and presentation use the same product hierarchy.
- The data claim names the exact archive range, success counts, gaps and review state.

