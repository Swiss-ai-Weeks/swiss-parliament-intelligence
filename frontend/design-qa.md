# Design QA

## Comparison target

- Source visual truth: `design/approved-conversational-briefing.png`
- Source-detail crop: `design/reference-source-panel-crop.png`
- Browser-rendered implementation: `http://localhost:4173/` in the Codex in-app Browser, tab 1; inline viewport capture recorded during QA.
- Viewport: 1440 × 1024 CSS px.
- Source pixels: 1487 × 1058 at 1×.
- Implementation pixels: 1440 × 1024 at `devicePixelRatio` 1.0000000149.
- Normalization: both full views were displayed together at native aspect ratio; the 2.5% source-size difference was treated as expected. Focused source-panel crops were compared at approximately the same 400 px width.
- States: Dashboard, Ask, full Debate, Investigate, and Proposal Tracker; English active and video paused.

## Full-view comparison evidence

The approved source and all five final browser states were opened together in one comparison input. The implementation preserves the source's charcoal palette, teal active states, compact top bar, typography, border treatment, and evidence-first hierarchy across the expanded product. Ask retains the source's three-column composition; Dashboard, Debate, Investigate, and Proposal Tracker extend the same system without looking like separate concepts.

## Focused-region comparison evidence

The source's lower source-panel crop and the implementation's matching 395 × 454 px browser crop were opened together. The implementation keeps the source metadata rhythm and inserts a clearly separated portrait list before Related moments. Portrait crop, label contrast, list spacing, and the View all control remain legible at the target viewport.

## Findings

- No remaining P0, P1, or P2 mismatches.
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

## Implementation checklist

- [x] Match approved desktop hierarchy and palette.
- [x] Add speaker portraits below About this source.
- [x] Implement the primary citation-to-source interaction.
- [x] Verify visible modes, language state, video state, and speaker expansion.
- [x] Verify browser console, optimized build, and Sites packaging tests.
- [x] Build and verify the connected Dashboard → Ask → Debate → Investigate → Proposal Tracker journey.
- [x] Keep all personalized political signals explicit and user-selected.

## Follow-up polish

- Replace fictional portraits with licensed official Parliament headshots when the team confirms the production data source.

final result: passed
