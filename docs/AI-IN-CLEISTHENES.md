# How AI is used in Cleisthenes

One page for judges, teammates and newcomers: every AI component, what it does for the reader, and what it
is never allowed to do. Numbers are measured on 23 September 2026 unless stated otherwise.

## The short version

Cleisthenes answers questions about Swiss parliamentary debates. **AI finds, reads, translates and
explains; deterministic code decides what counts as evidence.** Every sentence in an answer links to the
official record, and a statement that its source does not support is withheld before you see it.

## Technology → feature → outcome

| Technology (where it runs) | What it does in the product | What the reader gets | Never allowed to |
|---|---|---|---|
| **NVIDIA Nemotron Nano 9B v2** (NIM on H100, NVIDIA LaunchPad; falls back to NVIDIA's hosted API catalog) | Understands the question, translates search terms into French, German and Italian, recognises named initiatives, extracts one claim per source, reviews each claim against its source, writes the final answer, resolves "he / that initiative" in follow-ups | A direct, sectioned answer in the reader's language, built only from checked sources; follow-ups that remember the conversation | Cite a source it was not given; use its own memory as evidence; recommend how to vote |
| **NVIDIA Canary 1B v2** (ASR, H100 batch) | Transcribes parliamentary video with word timestamps | 11,092 recordings transcribed; 14,556 passages linked to the exact video moment | Replace the official transcript: the Official Bulletin text is always the quoted source |
| **Alignment code** (deterministic) | Matches Canary words to Official Bulletin paragraphs (≥85% word overlap) | "Watch the video · 2:53–3:42" opens at the moment the quoted words were spoken | Present a timing as human-reviewed: every video moment is labelled *machine-aligned, review pending* |
| **multilingual-e5-large** (embeddings, H100 batch; queries on CPU) | Indexes 1,140,943 passages by meaning (597 s on one H100); searches them by meaning across languages | An English question finds the German and French speeches that answer it (on-topic passages 40/48 vs 35/48 with keywords alone) | Decide relevance alone: semantic ranks are fused with full-text search, then claims are still verified |
| **NVIDIA Riva Translate** | Translates original speeches and evidence quotes | "Show translation" next to every original, labelled *machine translation* | Replace the original words, which stay one click away |
| **TypeSafe Jev** (hosted, shadow mode) | Second, independent check of claims against sources, with calibrated confidence | Scores a mistranslated claim 0.61 (held back below the 0.8 threshold) and the faithful one 0.90; 7/8 on the evaluation set | Write answer text or change an answer while in shadow mode |
| **OpenAI gpt-6-luna with web search** (hosted) | Only for questions the record cannot answer: upcoming sessions, latest news | A separate block, *Beyond the parliamentary record · web sources*, with links and date | Mix into record citations or appear as parliamentary evidence |
| **NVIDIA Cosmos Embed** (VSS, experimental) | Visual similarity search in parliamentary video | Exploratory "find similar scenes" tool | Be treated as evidence of what was said |
| **Deterministic code** | Source IDs, quotations, dates, roles, vote counts, coverage figures, refusals, scopes | Every number and quote is exact and traceable; voting-advice questions are refused before any model runs | — |

## One question, step by step

*"What are the arguments for and against the initiative 'No to a Switzerland of 10 million'?"*

1. **Understand**: Nemotron recognises the named initiative; code resolves it to official business 25.026.
2. **Search**: full-text search in FR/DE/IT plus E5 semantic search over that debate's 1,149 passages.
3. **Read**: six passages chosen for substance and for different speakers and parliamentary groups.
4. **Check**: one claim per source, each reviewed against its source; unsupported claims are withheld.
5. **Write**: one answer in the reader's language, every paragraph with numbered citations.
6. **Show**: the featured evidence moment plays the official video at the aligned timestamp; the drawer
   shows the original words, a labelled translation, the speaker's role and the official record link.

Typical time: 8–15 seconds. The reader sees each step as it happens ("Searching 134 parliamentary
sessions…", "Checking 6 statements against their sources…").

## Built on NVIDIA

| Workload | Hardware / service | Scale |
|---|---|---|
| Live answers | Nemotron Nano 9B v2 on H100 (NIM) | 8–15 s per researched answer |
| Speech recognition | Canary 1B v2 on H100 | 11,092 recordings so far (~350/hour, still running) |
| Semantic index | multilingual-e5-large on H100 | 1,140,943 passages in 597 s (~1,900/s) |
| Translation | Riva Translate | On demand, cached |
| After the GPU allocation | NVIDIA API catalog (hosted Nemotron) | Automatic fallback, same prompts |

## Honest limits

- Official text is searchable for 134 of 185 sessions (1999–2026); earlier sessions have no digital transcript.
- Video moments are machine-aligned and not yet reviewed by people.
- A speech is one person's intervention, not a decision of Parliament; answers say who said what.
- Vote records cover the National Council's individual roll calls; a missing record is not an abstention.

See also: [Architecture](ARCHITECTURE.md) · [Status](STATUS.md) · [Session pipeline](SESSION-PIPELINE.md)
