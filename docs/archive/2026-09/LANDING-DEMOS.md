# Landing interactive previews

> Historical implementation note. Preserved for UX provenance; use the [product specification](../../PRODUCT-SPEC.md) and [demo guide](../../DEMO-AND-USER-TEST.md).

18 September 2026. Supersedes the static feature cards described in GREEK-SWISS-INTEGRATION.md.

The approved three-chapter landing now demonstrates the intended journey using local, interactive simulations styled like the pilot. Real app entry buttons remain available.

- Research: four selectable stages plus a play/pause walkthrough. Open a fictional German quote, inspect the illustrative 14:32–14:48 range, and switch between original wording and an English sample translation. The video is an illustrated placeholder, not a recording or evidence for a real politician.
- Privacy: a phone retains masked personal details while a staged proof preview reveals Swiss citizenship, age 18+ and optionally canton Geneva. The real Midnight Network horizontal black SVG comes from the user's Midnight brand-assets folder. The demo explicitly lists name, address, full birth date, document and unnecessary details as not shared in the proposed flow. No identity API, wallet or network transaction is called.
- Participation: choose a question, see a brief thinking state and a scripted balanced answer, then choose Yes, No or Undecided and confirm with a fingerprint animation. The final state explicitly says that nothing was submitted or stored. No biometrics, authentication or official voting is performed.
- Footer: the closing message overlays the upper artwork area. A gradient mask blends its texture into the page without a horizontal edge.

Acceptance: production build passed. Browser checks covered original/translated quote states, proof completion, question/thinking/answer flow, disabled confirmation before choosing, and confirmation of Undecided. At 390 px, the page has no horizontal overflow or broken images. Animation timers clean up on chapter changes; visual motion respects system and app reduced-motion preferences. These are illustrative product previews, not claims that identity proofs or voting are implemented.
