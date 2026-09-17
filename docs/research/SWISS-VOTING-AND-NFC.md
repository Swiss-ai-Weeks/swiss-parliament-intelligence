# Swiss voting, NFC and the proposed participation journey

Research checked 14 September 2026. Official sources describe the present system; proposed app behaviour below is a design recommendation. Federal popular votes are the confirmed first scope. This document does not establish legal authorization to run elections.

## What people do today

There are three different things the product must name correctly:

| Process | Who decides | What our app can do initially |
|---|---|---|
| Parliamentary division | Members of a chamber | Explain the division and connect speeches, business items and recorded votes |
| Federal popular vote | The officially entitled electorate | Explain ballot items, show official dates/instructions and report official results |
| App consultation | Participants meeting the consultation's stated policy | Collect a non-binding opinion once the participation and privacy mechanisms are validated |

An optional federal referendum may be requested by 50,000 eligible citizens or eight cantons within 100 days of official publication. Mandatory referendums occur for specified decisions without such a request. Consequently, a parliamentary business item is not automatically an upcoming public ballot. The app needs a reviewed link between the two. [Parliament: referendums](https://www.parlament.ch/fr/%C3%BCber-das-parlament/Pages/faktenblatt-referenden.aspx)

The federal system also permits popular initiatives proposing constitutional changes, with 100,000 valid signatures within 18 months. Constitutional changes generally require both a popular and cantonal majority; ordinary optional referendums use a popular majority. These are different decision rules, which must come from the official ballot definition rather than an AI inference. [Federal Chancellery: 2026 Confederation guide](https://www.bk.admin.ch/dam/en/sd-web/KYXe43NjDhNT/The%20Swiss%20Confederation.%20A%20brief%20guide%202026.pdf)

Federal political rights generally begin at 18 for Swiss citizens, subject to the applicable statutory conditions. Registration matters: Swiss citizens living abroad must register with a Swiss representation and apply for electoral registration. A nationality claim is therefore insufficient to establish a person's entitlement in a particular official ballot. [City of Bern: voting rights](https://www.bern.ch/themen/stadt-recht-und-politik/abstimmungen-und-wahlen/allgemeine-informationen/stimm-und-wahlrecht/), [FDFA: political rights abroad](https://www.schweiz-zypern.eda.admin.ch/en/political-rights)

For a concrete present-day example, Zurich's instructions describe completing the ballot, sealing the ballot envelope, signing the voting certificate and returning the materials, or voting at the polling place. Deadlines and practical arrangements are local. Our app should link to the user's responsible authority, not invent one nationwide last-posting date. A user-entered municipality only selects information; it does not verify residence. [Canton Zurich: how to vote](https://www.zh.ch/de/politik-staat/wahlen-abstimmungen/so-stimme-ich-ab.html)

Some ballots include an initiative, a direct counter-proposal and a subsidiary preference question. Voting yes to both is possible; the extra question expresses a preference if both pass. A single yes/no widget is therefore insufficient for every federal voting day. Elections of representatives have other ballot mechanics and are outside the first scope. [FDFA-hosted Swiss Democracy Passport, explanation of double yes](https://www.eda.admin.ch/dam/de/sd-web/IZNezN3rJir0/20210915-SwissDemocracyPassport_EN_2021Edition.pdf)

## A recurring calendar, not a fixed quarterly poll

Use official voting events. Reserved dates do not guarantee that a federal vote will take place; the Federal Council determines the items at least four months in advance. As checked, the official upcoming page lists 27 September and 29 November 2026. Revalidate this feed before publication. [Federal Council: upcoming votes](https://www.admin.ch/en/upcoming-federal-popular-votes), [Chancellery: reserved dates](https://www.bk.admin.ch/fr/dates-reservees-pour-les-votations)

Proposed recurring experience:

1. **Announcement:** next confirmed voting day, official ballot wording, source publication date, language and optional municipality selection.
2. **Understanding:** plain-language explanation, separately attributed arguments and recommendations, parliamentary evidence and cited questions.
3. **Preparation:** review each item, including linked counter-proposals; optional reminders; official postal/polling instructions. No default answers.
4. **Optional consultation:** explain its organizer, eligibility policy, closing time and non-binding status; verify eligibility only here.
5. **Submission:** explicit review and confirmation; distinguish pending, accepted, failed and unknown outcomes. App acceptance never means official acceptance.
6. **Results:** official results and app consultation outcomes appear separately with their own dates, denominators and status.
7. **Follow-through:** source-backed updates about implementation and the next announced event. No inferred political profile.

## Switzerland already has regulated internet voting

E-voting exists as limited trials, with authorization tied to cantons and electorates. Recent Chancellery announcements include Lucerne's authorization for a limited electorate and the September 2026 authorization for Neuchâtel. Do not show a universal “vote online” button based on Swiss nationality. Eligibility and availability must be checked against the authority's current instructions. [Chancellery: e-voting announcements](https://www.bk.admin.ch/de/medienmitteilungen-e-voting)

Swiss Post describes voter-specific security codes delivered with voting materials and choice return codes used to check the recorded selection. Its approach includes individual and universal verification. A passport scan does not replace that full process. [Swiss Post: verification](https://www.post.ch/fr/notre-profil/portrait/poste-et-politique/la-poste-dans-le-monde-numerique/vote-electronique-un-systeme-pour-la-suisse)

The Chancellery describes independent examination of cryptography, software, infrastructure/operations and intrusion resistance, alongside public scrutiny. Cantons procure systems; federal authorities set the framework and authorize trials. Integrating official voting would require an institutional project and the applicable examinations, not a branding change to the consultation. [Chancellery: examination of systems](https://www.bk.admin.ch/en/examination-of-systems)

## What NFC can and cannot establish

An authentic chip can support proof of document attributes. That is distinct from proving that the present user is its rightful holder, that they have no second credential, and that they belong to the electoral register for this event. Each claim needs its own evidence and threat model.

Do not assume every Swiss citizen has a compatible document. Fedpol currently schedules an optional biometric identity card for 2 November 2026, while a non-biometric option remains available. Its e-ID programme is a separate product, currently scheduled for the first half of 2027. Neither announcement establishes compatibility with our app. [Fedpol: current projects](https://www.fedpol.admin.ch/en/current-projects)

| Component | Intended responsibility | Evidence still needed |
|---|---|---|
| Phone and NFC document provider | Validate supported document, prove requested attributes | Physical Swiss-document tests, supported phones, issuer trust roots, expiry checks, holder binding and recovery |
| App account / Midnight Passport | Session, user-controlled account and permissions | Actual SDK readiness, integration and recovery behaviour |
| Consultation eligibility service | Verify the exact policy and a fresh challenge | Domain/event binding, replay protection, scope-specific duplicate prevention and multiple-document policy |
| Midnight participation protocol | Enforce agreed participation rules with appropriate disclosure | Selected circuits, verifier boundary, privacy review, key custody, tally and failure handling |
| MAIS adapter | Optional agent identity/attestation integration | Version-pinned proposal mapping and tested implementation; no assumed compliance |

Midnight Passport's SDK README calls it an identity and wallet layer and identifies its status as planning/specification. It is not evidence of NFC citizenship verification. [Midnight Passport SDK](https://github.com/midnightntwrk/midnight-passport-sdk)

ZKPassport is one candidate: its published flow uses a mobile app to read a document and generate proofs, including age or nationality checks. Evaluate it against the existing Rarimo work before changing providers. Provider claims are not our device-test results, and a per-document identifier does not by itself establish lifetime one-person uniqueness across renewals or multiple documents. [ZKPassport](https://zkpassport.id/)

The provider's privacy policy also describes request outcomes, optional diagnostics and, when enabled by the requesting organization, stored proofs, queries, results and organization-specific pseudonyms. Therefore “the passport remains local” must not become “no data is processed anywhere.” Document the exact deployment configuration and retention. [ZKPassport privacy policy](https://zkpassport.id/privacy-policy)

MAIS remains a published draft proposal; the PR references implementation work, but reviewing a proposal is not an interoperability or security test. Use a replaceable adapter and identify exactly which version and features have been tested. Agent identity can attribute a report; it cannot establish that the report is true. [MAIS proposal](https://github.com/midnightntwrk/midnight-improvement-proposals/pull/110)

## Proposed private consultation progression

**Stage 1 — useful without identity:** ship the evidence journey and a visibly synthetic participation walkthrough. Public reading never requires a passport or wallet. No real political responses are collected in the walkthrough.

**Stage 2 — validated eligibility:** test physical NFC on supported devices, including cancellation, poor reads, unsupported/expired documents and proof replay. Request minimal policy predicates, such as Swiss nationality and age threshold, rather than birth date or passport number. The product policy must explicitly say it does not check the official electoral register.

**Stage 3 — private non-binding participation:** select and review a protocol that separates the eligibility check from the ballot. Define who could learn an individual answer from plaintext, logs, timestamps, identifiers, traffic or repeated aggregate releases. A publicly revealed ballot, a profile-linked choice, or an observable one-vote tally change cannot be sold as a secret ballot. Synthetic tests alone cannot establish privacy.

The earlier local referendum review recorded a reveal flow that exposed choices and no physical NFC evidence. Treat that report as a reason to inspect the actual candidate implementation, not a fresh audit or proof that all Midnight approaches share that limitation. Do not carry its public reveal behaviour into a feature called private voting.

**Stage 4 — possible official partnership:** investigate with a canton/election authority how eligibility registers, approved authentication, multi-channel duplicate prevention, ballot secrecy, verification, accessibility, auditability and incident recovery would work. The authority would need to determine whether an NFC credential has any authorized role. Existing official channels remain necessary unless and until an approved integration exists.

## Research questions to close before collecting real responses

- Which Swiss documents and phones actually work, and what percentage of prospective users can complete verification unassisted?
- What does the provider verify about the holder, and how are reissued/multiple documents handled?
- Is a proof verified directly by the selected Midnight implementation, or does it trust an intermediary's attestation? Who operates that intermediary?
- Can any operator connect identity and choice? What happens if operators collude or a device is compromised?
- What is the receipt allowed to prove without becoming a transferable proof of the selected answer?
- Can users correct a submission? If so, how does replacement preserve privacy and count exactly once? Default prototype policy is one final submission, explicitly explained before confirmation.
- Who organizes and funds consultations, reviews question wording, resolves disputes and publishes the methodology?
- What minimum cohort and release policy is defensible? Thresholds alone do not stop inference from overlapping or repeated results.

These questions determine whether the participation promise is credible. They do not block the challenge's public video-intelligence demonstration.
