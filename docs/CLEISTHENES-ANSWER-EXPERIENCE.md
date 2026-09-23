# Cleisthenes research answer experience

**Status:** proposed product and technical contract for the next answer-experience implementation. This extends the [Cleisthenes product proposal](CLEISTHENES-PROPOSAL.md) and remains subject to the coverage boundaries in [STATUS.md](STATUS.md).

## Outcome

Cleisthenes should feel like a civic research companion, not a search result that emits two disconnected snippets.

For a substantive question, the user should receive:

1. a direct answer in the selected interface language;
2. a coherent explanation that develops the important points;
3. visible distinctions between facts, attributed positions, disagreements and uncertainty;
4. claim-level links to the exact supporting quotation, video moment, law, vote record or proposal fragment;
5. a short, inspectable account of the research process without exposing hidden chain-of-thought;
6. an easy path to continue the conversation without losing scope.

## What the current screenshots show

The supplied comparison answer contains two short paragraphs, each followed by a large source box. This creates four visually separate blocks instead of one answer. It also mixes English and French in an English conversation.

The source view confirms the quoted French passage and official-record link, but leaves most of the page empty. It does not show surrounding context, an interface-language translation, related legal or proposal material, or playable media. Opening a source therefore feels like leaving the answer rather than going deeper into it.

Keep:

- visible scope (`Electronic identity`);
- clear attribution and date;
- original wording;
- the path to the official publisher;
- a persistent follow-up composer.

Change:

- replace one large box per claim with a continuous answer article and compact inline citations;
- make the source view a useful evidence reader rather than a sparse endpoint;
- enforce one answer language while preserving labelled originals;
- show media, legal provisions and neighboring context when those relationships exist in the data.

## Answer anatomy

The default answer should adapt to the question rather than always using the same number of cards.

### 1. Direct answer

Two to four sentences that answer the question immediately. For comparisons, state the principal contrast and name whose position is being described.

### 2. Developed explanation

Use short titled sections only when they help. Typical sections are:

- **What supporters argued**
- **What opponents argued**
- **What the law or proposal would change**
- **What happened next**
- **What remains uncertain**

Paragraphs can synthesize several verified evidence units, but every material claim must retain one or more citation references. Do not repeat the same source box after every paragraph.

### 3. Evidence moments

Surface the strongest evidence in the answer:

- a quotation with speaker, role and date;
- a playable video moment with exact start/end boundaries;
- the relevant article or section of a law;
- the official proposal/business fragment;
- the official vote question or result.

An evidence moment can appear inline when it is central. Remaining sources belong in a compact source list or side panel.

### 4. Research process summary

Show a concise, factual trace such as:

> Searched 18 imported records across the e-ID dossier and parliamentary debate. Used 4 sources: 2 official explanations, 1 referendum argument and 1 vote record. One source was available only in French; the answer was rendered in English while the original remains available.

This is an operational summary, not private model reasoning. It may disclose:

- collections searched;
- filters and scope;
- number and types of records considered;
- evidence selected;
- missing or conflicting evidence;
- translation and review steps;
- freshness and coverage limits.

It must not expose hidden chain-of-thought, speculative deliberation or unsupported confidence scores.

### 5. Follow-up actions

Offer two or three contextual continuations, for example:

- “Show the strongest privacy objection”
- “What changed between the rejected and accepted e-ID proposals?”
- “Play the parliamentary passage”

Follow-ups inherit the visible scope unless the user changes it.

## Visual behavior

### Compact panel

- Present the direct answer and the first developed section.
- Use small numbered or named citation chips at the end of the relevant sentence or paragraph.
- Show one primary action: **Open full answer**.
- Allow a central video moment to play inline when the panel has enough width.
- Keep the composer visible, but do not let it cover the active citation or playback controls.

### Expanded answer

Desktop uses a two-column research view:

- left: question, answer, sections and follow-ups;
- right: selected evidence, video/quotation/context and source metadata.

Mobile uses a stacked view:

- answer first;
- citation opens a focused evidence sheet;
- back returns to the same scroll position in the answer;
- video controls and composer remain reachable without overlap.

### Citation interaction

Clicking a citation selects—not replaces—the evidence reader.

The evidence reader should show, when available:

1. source type, publisher, speaker/authority and date;
2. the cited fragment highlighted inside neighboring context;
3. original language first, plus a clearly labelled interface-language translation;
4. video playback at the exact passage boundary;
5. related law article, proposal/business or vote record;
6. official-source link and processing/review status.

A source with only a quotation should use a compact drawer or sheet rather than an almost-empty full page.

## Single-language contract

The interface language controls all generated answer prose, headings, labels, progress messages and suggested follow-ups.

- English interface → English answer.
- French interface → French answer.
- German interface → German answer.
- Italian interface → Italian answer.
- Romansh remains limited to reviewed/curated material until automated support is accepted.

Original evidence is never rewritten or hidden. It appears under **Original source · FR/DE/IT/RM**. If a translation is available, it appears under **English translation** or the selected language and is labelled as editorial, model-generated or human-reviewed.

Before returning an answer, the server should verify that generated prose uses the requested language. A failed language check triggers one bounded repair attempt. If it still fails, return the verified sources and a specific translation-unavailable state rather than mixed-language prose.

## Research workflow

The current source-isolated generation protects attribution, but it naturally produces disconnected answer fragments. Preserve that safety and add a verified synthesis stage.

### Stage 1 — understand the task

Classify the requested operation without answering it:

- explain;
- compare positions;
- trace a timeline or process;
- identify a legal/proposal change;
- summarize a person or debate;
- verify a claim;
- translate or inspect a source.

Resolve visible scope: entire imported corpus, topic, proposal, person, selected passage or conversation follow-up.

### Stage 2 — build a retrieval plan

Choose relevant source families based on the operation:

- comparison → supporting and opposing attributed material;
- legal change → proposal text, law/article and parliamentary explanation;
- process/timeline → business stages, dates, decisions and later vote/result;
- speech question → speaker passage plus neighboring transcript and related business;
- media request → evidence with validated media/timing metadata.

This plan is structured server data, not free-form hidden reasoning.

### Stage 3 — retrieve and rank evidence

Search across the scoped multilingual record. Retrieve enough candidates for coverage, then rank for:

- direct relevance;
- source authority;
- attribution clarity;
- date and version fit;
- diversity of relevant positions;
- usable original context;
- validated media availability.

Do not manufacture balance. If only one relevant position is present, say so.

### Stage 4 — extract evidence units

Process each selected source independently. Produce only structured units:

- factual or attributed proposition;
- exact evidence ID;
- exact quotation/fragment attached by the server;
- source type;
- speaker/authority and date;
- language;
- media/law/proposal relationship when verified.

### Stage 5 — verify

Run the existing source-entailment and attribution guards over every unit. Remove unsupported units before synthesis. Record rejected units only as aggregate diagnostics, never as user-facing facts.

### Stage 6 — synthesize

Generate the direct answer and sections using only verified evidence units. The synthesis model never receives unsupported retrieved text as factual context and cannot create a new evidence ID. Each material sentence cites one or more verified unit IDs.

### Stage 7 — language and presentation checks

- verify requested answer language;
- check names, dates and numbers against evidence;
- attach typed source actions;
- prefer a validated video moment when it directly supports a central claim;
- label translations and machine timing;
- generate the factual research-process summary.

### Stage 8 — degrade safely

If retrieval succeeds but generation, verification or language repair fails, return a source-only research result with the selected evidence and explanation. Never turn an infrastructure failure into “insufficient evidence.”

## Proposed response contract

```json
{
  "status": "ok",
  "language": "en",
  "answer": {
    "lead": "…",
    "sections": [
      {
        "title": "Arguments in favour",
        "paragraphs": [
          { "text": "…", "citationIds": ["c1", "c2"] }
        ]
      }
    ]
  },
  "citations": [
    {
      "id": "c1",
      "evidenceId": "…",
      "sourceType": "video",
      "title": "…",
      "speaker": "…",
      "date": "2026-09-14",
      "originalLanguage": "de",
      "quote": "…",
      "translation": { "language": "en", "text": "…", "reviewState": "machine" },
      "video": { "url": "…", "start": 227, "end": 253, "timingReview": "machine" },
      "officialUrl": "…"
    }
  ],
  "researchSummary": {
    "scope": "Electronic identity dossier",
    "recordsConsidered": 18,
    "sourcesUsed": 4,
    "sourceTypes": ["official-explanation", "referendum-argument", "vote-record"],
    "limitations": ["No human-reviewed parliamentary video timing for this claim"]
  },
  "suggestedFollowUps": ["…"]
}
```

Keep the existing `claims` response during migration or add a versioned endpoint. Do not silently break saved conversations or recorded-demo fixtures.

## Data relationships needed

To open the correct destination, an evidence record needs typed links rather than a generic URL:

- `video`: recording ID, URL, validated start/end, transcript passage and timing review;
- `quotation`: passage ID, neighboring passage IDs and original language;
- `law`: instrument ID, version/date, article/section and official anchor or document page;
- `proposal`: business ID, stage/version and official record fragment;
- `vote`: event/item ID, official question, result status and source;
- `person`: stable person ID, role at the cited date and official profile.

Missing relationships remain absent and visible as coverage gaps. Cleisthenes must not infer a law article or video timestamp from semantic similarity alone.

## Implementation slices

### Slice A — richer answer without changing retrieval

- stop truncating the UI to three disconnected claims;
- add a verified synthesis step over existing reviewed claims;
- enforce requested-language output;
- render a continuous answer with inline citations;
- replace the sparse source page with a compact evidence drawer when only text exists.

### Slice B — research process and typed sources

- return `researchSummary` and typed citation metadata;
- add neighboring transcript context;
- connect existing validated video metadata to citations;
- preserve original/translation labels.

### Slice C — broader process intelligence

- intent-specific retrieval plans;
- timeline, legal-change and cross-version answer structures;
- conflict and missing-evidence disclosure;
- law/proposal/vote relationship reconciliation.

## Acceptance

- A comparison question produces one coherent comparison, not two unrelated cards.
- Every material statement opens its exact evidence fragment.
- A video citation begins at the stored start boundary and stops at the stored end boundary.
- A law citation opens the known article/section or clearly states that exact anchoring is unavailable.
- Generated prose, headings and follow-ups remain in the selected interface language.
- Original-language evidence remains visible and labelled.
- The research summary accurately reports scope and source counts without exposing hidden reasoning.
- The user can move answer → evidence → answer without losing scroll position or conversation scope.
- Forced generation, review, translation and media failures each produce a distinct, recoverable state.
