# UX refinement — 17 September 2026

> Historical UX checkpoint. Preserved as design provenance; use the [product specification](../../PRODUCT-SPEC.md) and [user guide](../../USER-GUIDE.md).

Evidence: the four user-provided screenshots and live browser checks of the dossier and parliamentary flows. Appllama MCP research inspected Craft: Notes, Documents, AI / New Chat (1487937127/oth_1b9u5): contextual source chip, prompt suggestions and rounded composer. Appllama's separately named usage/design skills were not found in the installed skill folders; its available MCP documentation and screen reference were used. Product Design audit guidance informed the flow checks. No third-party component package was required: reusable React controls and the existing Phosphor icons fit the current design system.

1. **Parliament tools:** inconsistent native forms and bare disclosures now share rounded panels, padded controls, clear focus states and segmented spoken/visual choices. They remain progressively disclosed. English-only visual query guidance is explicit.
2. **Record discovery:** removed the permanent e-ID shortcut from the general directory. The empty state explains selecting a proposal/person; empty “Original passages” headings are hidden.
3. **Contextual AI:** dossier and record entry cards now open one Cleisthenes chat. Suggested actions prefill an editable question and retain action type. The composer receives focus; loading and errors appear in the conversation. Retry keeps the failed question. Changing context invalidates outstanding responses to avoid displaying an answer against the wrong record.
4. **Navigation:** Parliament / Dossiers / Saved are destinations. Reading / Research are dossier modes. All dossiers returns to the same collection used by the header. Expanding chat and returning preserves its originating route.

Live test found the chat SSH tunnel had dropped; restored the local 4319 → GPU 30081 tunnel and verified a real e-ID result answer with its official citation. This is a development-infrastructure fix, not persistent tunnel supervision.

Accessibility checks are bounded: semantic buttons, pressed states, keyboard focus styles and focused chat input. This is not a full assistive-technology audit. Existing DE/IT/RM detailed-view copy still has English fallback.
