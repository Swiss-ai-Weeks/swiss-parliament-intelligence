# Cleisthenes UX review — analysis only

> Historical analysis. Preserved as design evidence; use the [product specification](../../PRODUCT-SPEC.md) for current decisions.

18 September 2026. No chatbot code was changed for this review.

## Evidence and scope

Fresh local desktop browser inspection, plus Appllama reference screenshots: Perplexity Answer Results (`1668000334/oth_t1yt6`) and Craft New Chat (`1487937127/oth_1b9u5`). These are visual references, not live competitor usability or speed tests. Local screenshots are under `artifacts/ux-audit-2026-09-18/` and are not part of the public source bundle.

Observed flow:

1. Open the civic dashboard and the compact Cleisthenes panel. Inspect welcome state and suggestions (`cleisthenes-start.png`).
2. Choose Data protection. It fills an editable question rather than sending automatically.
3. Send “What does Parliament say about data protection?” The panel displays “I couldn’t reach the model. Your question is ready to retry.” and Try again (`cleisthenes-unavailable.png`).
4. Inspect Perplexity's answer screen: concise lead, section headings, bullets, nearby source chips and a persistent follow-up composer (`perplexity-answer.png`).
5. Inspect Craft's welcome screen: suggested tasks and explicit document scope inside the composer (`craft-composer.png`).

The current app already has recent chats, new chat, expand and close controls. Do not add duplicate history features. This run did not produce a successful answer, so citation interaction quality, answer formatting and expanded-answer behaviour require a separate successful-path test. Earlier user screenshots show citations and recordings, but they are not proof of today's live behaviour.

Operator-local evidence was recorded as `cleisthenes-start.png`, `cleisthenes-unavailable.png`, `perplexity-answer.png` and `craft-composer.png` under the ignored `artifacts/ux-audit-2026-09-18/` directory. The screenshots are excluded from the public repository, so this archive does not present them as portable links.

## What to retain

The restrained paper palette, Cleisthenes character and serif welcome distinguish the product. The compact panel preserves the research page underneath. Suggestions are editable before submission. Failure is visible rather than disguised as a generated answer. The source-linked parliamentary focus is a useful product distinction.

## Improvements, ordered by impact

| Priority | Finding | Proposed change (not implemented) | Validation |
|---|---|---|---|
| P0 | A normal question failed to reach the model | Diagnose browser/API/provider path; offer readable retrieved sources if generation fails, explicitly labelled | Repeat supported queries and forced outages; distinguish generation failure from no evidence |
| P1 | Scope is not obvious in the global welcome composer | A compact context chip: “All imported records”, selected topic or person, with a clear change action; inspired by Craft | Ask users to predict what collection will be searched before sending |
| P1 | Research questions can be longer than the single visible input line | Auto-growing multiline composer, explicit send, predictable Enter/Shift+Enter, preserved draft | Keyboard and phone tasks with multi-part questions |
| P1 | Source inspection competes with conversation space in narrow panels | Short answer first, citations beside claims, expandable source cards and deliberate full-page reading; inspired by Perplexity | Can a user find the passage supporting a claim within 15 seconds? |
| P1 | Waiting and failure need differentiated meaning | “Finding sources” then “Writing answer”; retry for provider failure; specific insufficient-evidence state; no invented progress percentages | Test slow retrieval, slow inference, empty corpus and disconnect separately |
| P2 | Retry uses a plain browser-style button in the observed failure screen | Apply the app's quiet secondary-button styling and keep the question available | Visual consistency review across success/failure/empty states |
| P2 | “Chats stay on this device” can be confused with local inference | Explain storage separately from server processing in a short privacy disclosure | Ask users where questions are processed and stored |
| P2 | Four compact icon actions rely on familiarity | Retain accessible names and add hover/focus help; check touch targets and keyboard order | Keyboard-only and screen-reader pass |
| P2 | Welcome is calm but generic | Two contextual prompts based on the selected record, plus one example of inspecting a source | First useful question and first source-open rates |

## Comparison

| Dimension | Cleisthenes observed | Perplexity reference | Craft reference | Direction |
|---|---|---|---|---|
| Identity | Strong civic mascot and editorial palette | Utility-first answer layout | Quiet document workspace | Keep our identity |
| Starting a question | Two topic suggestions | Search-oriented composer | Task suggestions with source scope | Add contextual prompts and scope |
| Reading answers | Live path failed in this run | Lead answer, headings, bullets, source chips | Not evaluated in chosen screen | Validate successful path before redesign |
| Continuity | Recent chats, new chat, expand already present | Persistent follow-up input | Persistent composer | Refine existing controls |
| Evidence | Parliamentary quotations and recordings are product capabilities; successful flow not verified here | Nearby source chips | Document collection context | Make source type and exact claim connection clear |

## Review boundaries and next study

This is not an accessibility certification. Focus order, screen-reader announcements, contrast ratios, mobile keyboard overlap and touch targets were not comprehensively measured. Competitor library screenshots cannot establish accessibility or task success.

Before changing chat, run four tasks with three citizens and one research user: understand a topic, find a quoted passage, ask a follow-up with the right scope, recover from a forced outage. Record completion, source-finding time, wrong-scope questions and confidence calibrated against the actual evidence. Then test a small composer/context improvement, leaving the mascot and visual identity intact.
