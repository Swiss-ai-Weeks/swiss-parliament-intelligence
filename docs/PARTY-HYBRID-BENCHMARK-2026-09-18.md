# Party retrieval: first comparative benchmark

Twelve official national-party pages now cover six parties in French and German. Sources and canonical URLs are in `config/party-sources.json`. The coding agent reviewed their extracted text and recorded hash-bound decisions in `config/party-source-reviews.json`: remove navigation, sharing controls and unrelated consultation listings; decode HTML entities; retain publisher attribution. This is **agent extraction review**, not independent human fact-checking or language approval. The pages remain party self-descriptions, not neutral findings or evidence of an individual politician's beliefs. Undated pages retain an unknown publication date. In particular, FDP Europe's historical descriptions must not be presented as today's EU relationship.

The importer rejected the first SP extraction because it selected a short membership help panel. The canonical programme-history page was used instead. The GLP redirect was inspected and replaced by its canonical national `glp.swiss` URL. The importer still refuses automatic redirects.

## H100 run

Pinned `intfloat/multilingual-e5-large`, revision `3d7cfbdacd47fdda877c5cd8a79fbcc4f2a574f3`, generated 17 overlapping chunks from 12 documents on GPU 1 (H100 NVL). Local validation passed source hashes, dimensions, normalization and chunk boundaries. GPU 0's interactive model was not restarted.

The 30 questions were frozen before this run: 24 supported questions (six topic families, each in EN/FR/DE/IT) and six unsupported probes. Both rankers use the same chunks and collapse results by document. BM25 uses accent normalization but no stemming, stopword removal or query translation. Hybrid uses equal-weight reciprocal rank fusion, k=60, without tuning.

| Ranker | Relevant source first | Relevant source in top 3 | MRR |
|---|---:|---:|---:|
| BM25 | 22/24 | 24/24 | 0.9514 |
| Multilingual E5 | 24/24 | 24/24 | 1.0000 |
| BM25 + E5 RRF | 24/24 | 24/24 | 1.0000 |

After the initial ~300 ms query, GPU query encoding plus ranking generally took 9–11 ms; one unsupported probe took ~61 ms. These are in-process timings over a tiny corpus, **not network or end-to-end chatbot latency**.

## What this does not establish

The questions and relevance labels were authored by the coding agent after examining the sources. They include party names, and six families translated four ways are not 24 independent topics. There are only 12 documents. This is a reproducible seed benchmark, not an independently adjudicated release gate. It shows no benefit of hybrid over dense retrieval yet.

Unsupported queries still retrieve similar documents. Their maximum dense similarity ranges from 0.7226 to 0.8026; supported queries range from 0.7819 to 0.9001. The overlap means a single similarity cutoff cannot perfectly separate these cases. No abstention threshold was selected, and unsupported probes are excluded from ranking accuracy. The new index is **not activated in production**.

Next: add reviewed topic documents and dated party decisions, test unnamed-party and ambiguous follow-ups against parliamentary distractors, independently label a held-out set, and evaluate answerability and attribution after retrieval. Keep party documents separate from personal speech and current vote outcomes. Promote only after a production-sized latency and unsupported-answer evaluation.

## Reproduction

1. `node scripts/ingest-party-sources.mjs` caches bounded public pages under ignored `data/parties/`.
2. `node scripts/review-party-sources.mjs` applies the reviewed hash manifest. A changed extraction fails closed and requires a new review.
3. Copy `reviewed-input.jsonl`, `config/party-retrieval-cases.json` and the two Python scripts to the authorized GPU workspace.
4. `CUDA_VISIBLE_DEVICES=1 devenv/bin/python embed-public-corpus.py reviewed-input.jsonl party-reviewed-embeddings.sqlite`
5. `CUDA_VISIBLE_DEVICES=1 devenv/bin/python benchmark-party-hybrid.py`
6. Download the index/report; run `node scripts/validate-party-embeddings.mjs data/parties/reviewed-input.jsonl data/parties/party-reviewed-embeddings.sqlite`.

Raw HTML, extracted text and vectors stay in ignored staging storage. Public query results and source/corpus hashes are preserved in `docs/evaluations/party-hybrid-2026-09-18.json`. Independent language review remains pending.
