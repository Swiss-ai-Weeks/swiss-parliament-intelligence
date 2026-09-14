# Design QA

## Comparison target

- Source visual truth: `design/approved-conversational-briefing.png`
- Source-detail crop: `design/reference-source-panel-crop.png`
- Browser-rendered implementation: `http://localhost:4173/` in the Codex in-app Browser, tab 1; inline viewport capture recorded during QA.
- Viewport: 1440 × 1024 CSS px.
- Source pixels: 1487 × 1058 at 1×.
- Implementation pixels: 1440 × 1024 at `devicePixelRatio` 1.0000000149.
- Normalization: both full views were displayed together at native aspect ratio; the 2.5% source-size difference was treated as expected. Focused source-panel crops were compared at approximately the same 400 px width.
- States: Dashboard, simplified Ask, full Debate, Investigate, Proposal Tracker, Saved Research, History, Settings, Calendar, and Alerts; English active and video paused.

## Full-view comparison evidence

The approved source and all five final browser states were opened together in one comparison input. The implementation preserves the source's charcoal palette, teal active states, compact top bar, typography, border treatment, and evidence-first hierarchy across the expanded product. Ask retains the source's three-column composition; Dashboard, Debate, Investigate, and Proposal Tracker extend the same system without looking like separate concepts.

The follow-up comparison opened the approved source together with the simplified Ask screen, Settings profile, and Saved Research library. Removing the duplicated Ask/Investigate selector improves hierarchy while preserving the reference's question, answer, and source proportions. The new account screens reuse the same spacing, typography, borders, teal focus states, and navigation behavior.

The latest implementation adds a Parlacta-inspired advanced filter builder, selectable calendar events with a detail inspector, and an AI-assisted alert composer. The browser verification attempt for these latest states was blocked by the Codex usage-window limit before a rendered capture could be collected. Static build and test checks remain green, but this pass cannot claim visual QA completion for the newest states.

## Focused-region comparison evidence

The source's lower source-panel crop and the implementation's matching 395 × 454 px browser crop were opened together. The implementation keeps the source metadata rhythm and inserts a clearly separated portrait list before Related moments. Portrait crop, label contrast, list spacing, and the View all control remain legible at the target viewport.

## Findings

- Existing screens have no remaining P0, P1, or P2 mismatches. Latest Calendar, Alerts, and AI filter-builder screens require a browser capture when the usage window is available again.
- The personalized dashboard greeting, Settings form, Saved Research list, and History list remain legible without horizontal overflow at the browser's 1280 × 720 default viewport.
- [P3] Dashboard and advanced research intentionally use denser information layouts than Ask because they support scanning and evidence collection on desktop.
- [P3] The generated parliamentary still depicts a fictional speaker rather than the exact person in the visual concept. This is intentional for a safe prototype asset and does not change layout or task clarity.
- [P3] Several institutional glyphs use the closest Phosphor icon instead of the exact concept icon. Their size, weight, and hierarchy match the reference closely enough for the prototype.

## Required fidelity surfaces

- Fonts and typography: Inter 400/500/600/700 matches the neutral Swiss editorial feel. The first comparison found answer and source type too compact; the final pass increased body sizes, line height, and vertical rhythm to match the source density.
- Spacing and layout rhythm: header, left navigation, main workspace, and 395 px source rail align with the reference. The answer now fills the viewport proportionally. The speaker list is a deliberate extension below About this source.
- Colors and visual tokens: charcoal surfaces, cool grey borders, white hierarchy, teal interaction accents, and restrained red institutional accent match the source. Contrast remains strong.
- Image quality and asset fidelity: the main 16:9 parliamentary still and three dedicated portrait assets are sharp, correctly cropped, and use one consistent editorial art direction. No image placeholders or code-drawn substitutes remain.
- Copy and content: question, three-point answer, timestamps, source metadata, and related moments follow the approved concept. Speaker names and metadata are plausible demo content.

## Interaction verification

- Dashboard is the default route; primary and left-navigation Ask actions open the simple briefing.
- Citation selection updates source number, timestamp, speaker, quote, and progress.
- View in full debate opens the complete video/transcript workspace.
- Transcript moment selection and English translation toggle update visibly.
- Investigate displays filters, ranked evidence, a two-item evidence collection, notes, and export affordance.
- Proposal Tracker switches between Overview, Debates, and Votes; Follow/Following state toggles correctly.
- Settings display-name save updates the dashboard greeting from “Citizen” to the chosen name in the current prototype session.
- Settings Profile, Notifications, and Privacy tabs navigate correctly; the account avatar opens Settings.
- Saved Research filters its mock collection and each saved item routes to the appropriate workspace.
- History entries route to their source experience. The destructive Clear History control was visually inspected but not activated during QA.
- Previous/next source controls work.
- Video play/pause state and accessible label update.
- Ask/Investigate and DE/FR/IT/EN selections update visibly.
- View all expands the fourth speaker and Show less collapses it.
- Console warnings/errors checked: none.

## Comparison history

1. Initial comparison found a P2 density mismatch: the answer and source metadata were too small and left excess empty space. Increased answer typography, line height, section gaps, card padding, navigation labels, and source metadata sizing.
2. Second comparison found a P2 legibility mismatch in the newly added speaker/source-detail region. Increased source headings, metadata type, portrait size, speaker labels, and row spacing.
3. Final full-view and focused-region comparison found no actionable P0/P1/P2 issues.
4. Expanded-product comparison checked Dashboard, Debate, Investigate, and Proposal Tracker alongside the approved Ask reference at 1440 × 1024. No cross-screen hierarchy, token, density, or overflow defects required correction.
5. Follow-up comparison checked the simplified Ask, Settings, and Saved Research screens alongside the approved reference at the browser's 1280 × 720 default viewport. No actionable P0/P1/P2 issues were found; no corrective visual iteration was required.

## Implementation checklist

- [x] Match approved desktop hierarchy and palette.
- [x] Add speaker portraits below About this source.
- [x] Implement the primary citation-to-source interaction.
- [x] Verify visible modes, language state, video state, and speaker expansion.
- [x] Verify browser console, optimized build, and Sites packaging tests.
- [x] Build and verify the connected Dashboard → Ask → Debate → Investigate → Proposal Tracker journey.
- [x] Keep all personalized political signals explicit and user-selected.
- [x] Remove the duplicated Ask/Investigate switch from Ask Parliament.
- [x] Verify personalized greeting, account settings, Saved Research filters, and History navigation.
- [ ] Capture and compare Calendar, Alerts, and AI filter-builder states after browser access is restored.

## Follow-up polish

- Replace fictional portraits with licensed official Parliament headshots when the team confirms the production data source.

final result: blocked
