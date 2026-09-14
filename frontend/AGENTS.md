# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Approved product direction

- Desktop-first, dark, evidence-centered interface based on `design/approved-conversational-briefing.png`.
- Dashboard is the default home and the first navigation item. It summarizes tracked proposals, upcoming parliamentary activity, recent evidence, and voting context.
- Keep the default Ask experience simple; advanced research controls belong behind the Investigate mode.
- Ask Parliament opens directly on the question composer. Do not repeat an Ask/Investigate mode switch inside that screen because both destinations already exist in persistent navigation.
- Original parliamentary video, transcript, and source metadata must remain visually primary over AI interpretation.
- The source sidebar includes a compact "Speakers in this debate" portrait list directly below "About this source".
- The core demo journey is Dashboard → Ask → cited source → full Debate → Investigate → Proposal Tracker.
- Personalization is explicit: people, parties, proposals, and topics are items the user chooses to follow. Never infer or label a user's political affiliation.
- The dashboard greeting uses the account display name, falling back to "Citizen". Settings owns this preference along with language, notifications, and privacy controls.
- Prototype screens consume one normalized fixture model so that debate IDs, people, timestamps, proposal stages, and citations remain consistent and can later be replaced by API responses.
