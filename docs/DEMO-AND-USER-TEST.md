# Rehearsal and acceptance sessions

Use this as the current manual demo and user-test guide. Confirm the dated capability claims in [STATUS.md](STATUS.md) before every rehearsal; use [OPERATIONS.md](OPERATIONS.md) for service checks. Recorded responses, machine timing and simulated participation must remain visibly labelled.

## Three-minute pilot demonstration

1. **Recognize an issue (20 seconds).** Open the e-ID dossier. “This is a historical vote from September 2025. We begin with the question people actually voted on, not a chatbot blank page.”
2. **Understand and compare (40 seconds).** Show the short explanation and both attributed positions. “The app helps you understand a public decision and inspect competing arguments. It does not recommend how you should vote.”
3. **Check evidence (45 seconds).** Ask **What does the official video say?** Click its citation, then Play cited moment. “This is an official Federal Council explainer. Parliamentary debate coverage is our next evidence milestone.” Show the publisher-caption label. Do not imply the whole video transcript is indexed.
4. **Change language (25 seconds).** Switch EN/FR UI, then open the German, Italian or Romansh clip. “Publisher captions and curated originals remain distinct from machine translation. We do not claim automatic Romansh translation.”
5. **Professional workflow (30 seconds).** Open Research view, Sources & evidence, select two passages and export the cited briefing. “Journalists and parliamentary teams use the same sources in a research layout.”
6. **Identity vision (20 seconds).** Open the optional identity concept. “Understanding is useful without a passport. Selective disclosure is a future optional layer; current accounts and inference use servers.”

Current implementation facts: live NVIDIA Nemotron inference; a completed NVIDIA Parakeet French transcription; VSS video upload with zero processed analysis chunks. Riva and VSS analysis are not yet demonstrated. If GPU access fails, use the explicitly labelled recorded-response bundle, not a claim that inference is live.

## Participant tasks

Recruit three actual Swiss prospective users and one journalist/parliamentary professional. Do not populate this table from agent testing. Obtain their consent before recording feedback; avoid collecting political affiliations or identity documents.

| Participant | Task | Completed without help? | Source correctly identified? | Time | Confusion / quote | Follow-up |
|---|---|---|---|---|---|---|
| Citizen 1 | Explain e-ID in own words; find one supporting source | Pending | Pending | — | — | — |
| Citizen 2 | Distinguish an attributed argument from a fact | Pending | Pending | — | — | — |
| Citizen 3 | Switch language; find and play the cited passage | Pending | Pending | — | — | — |
| Professional | Compare evidence and export a briefing | Pending | Pending | — | — | — |

Ask after each task: What did you believe this source was? What information was missing? Which words or controls were unclear? Would you return for another dossier? These are usability questions, not a test of political knowledge.

## Manual acceptance checklist

- Check every rehearsed claim against its particular linked passage, not only against the collection as a whole.
- Verify each displayed vote date/result against the linked federal source.
- Verify actual player position against the indexed start within two seconds; record device/browser and observed position.
- Review the FR/DE/IT/RM wording with competent speakers, especially negation and attributed positions.
- Confirm signup email, login, saving, logout, expired session and cross-account separation with real consenting users.
- Rehearse with the GPU tunnel closed using the replay bundle. Confirm the recorded label and no hidden live dependency.
- Make and inspect a real screen recording before the feature freeze. This repository does not yet contain a screen-recorded walkthrough.

## Six-day handover

- **17 September:** local implementation, five dossiers, NVIDIA/Supabase access, official explainer media and initial evidence journey built. VSS analysis and parliamentary flagship remain open.
- **18 September:** resolve source-verified parliamentary footage; review timestamps/transcripts and test account email delivery.
- **19–20 September:** language review, richer evidence, deployment and citizen/professional trials. Contributors should hand over runnable commands and actual failure reports.
- **21 September:** fix consequential findings. Only attempt identity if the core gates pass; cap at four hours.
- **22 September:** freeze, record walkthrough, test offline package and rehearse pitch.
- **23 September:** presentation and contingency only.
