# Product research and specification

**Cleisthenes is implemented:** persistent compact/expanded chat, current-session batch ingestion, multilingual query expansion, bounded answer caching and two genuine parliamentary video alignments. See the latest section of [the runbook](PILOT-RUNBOOK.md). Stance-change work is paused; voice remains pending.

**Parliament update, 17 September:** [Working data explorer and competitor extension](research/PARLIAMENT-INTELLIGENCE-UPDATE.md): official proposals, attributed speeches, individual votes, coverage limits, stance-comparison gates and the next ingestion stages.

**Latest direction, 17 September:** [Voice and Swiss branding roadmap amendment](VOICE-AND-SWISS-BRAND-PLAN.md) incorporates the ElevenLabs promotion, Aristotle reference, unified voice/chat journey and a bounded single-canton pilot. [Pilot runbook](PILOT-RUNBOOK.md) describes the implementation that actually exists. The 14 September research below remains background; newer approved scope takes precedence.

Updated 14 September 2026. This package responds to Tomas's revised direction: meet the parliamentary-video challenge, make the citizen journey simple, and investigate Midnight participation and business opportunities before expanding implementation.

**Product recommendation:** a citizen companion for understanding federal popular votes, following the parliamentary evidence, and optionally participating in a clearly non-binding consultation. The reusable asset is the evidence pipeline; the proposed differentiator is the connection between understanding, verifiable sources, and participation.

## Read in this order

1. [Product specification](PRODUCT-SPEC.md): journeys, scope, acceptance criteria and delivery slices.
2. [Competitive landscape](research/COMPETITIVE-LANDSCAPE.md): current alternatives, positioning and business hypotheses.
3. [Swiss voting and NFC](research/SWISS-VOTING-AND-NFC.md): present voting procedures, identity distinctions and possible progression to official integration.

## Decisions and status

| Item | Status |
|---|---|
| Federal popular votes first; local ballots later | Explicitly confirmed by Tomas |
| Citizen-friendly, responsive web experience; desktop evidence inspection | User direction |
| Public parliamentary information; optional verified participation | User direction |
| Platform participation stays non-binding | User direction |
| Passport provider, branding, exact navigation and commercial buyer | Open |
| Private ballot protocol and production NFC support | Require technical validation; not delivered by this research |

The repository currently contains an interactive frontend and API seam. Its fixtures, simulated playback controls and saved demo preferences are not proof of a working parliamentary ingestion pipeline or election system. This update adds research and specifications, not those capabilities. Existing journalist-first and desktop-first descriptions document the earlier prototype; the citizen priority above guides the next specification cycle.

Start with one real recording → timestamped evidence → cited answer → playable source. In parallel, test a ballot-companion storyboard with prospective users. Expand the implementation only as each slice's acceptance evidence becomes available. The earlier three-product exploration sprint is an opportunity backlog, not three equal development commitments competing with the challenge.
