# Frontend accessibility and responsive audit

## Completed in the prototype

- All shared navigation items expose `aria-current="page"` when active, and the sidebar is labelled as primary navigation.
- Interactive controls use native buttons, links, form controls, and fieldsets so keyboard navigation follows browser defaults.
- Focus-visible rings use a high-contrast teal outline with an offset from the control.
- Icon-only controls in the source/video and calendar surfaces have accessible labels.
- Loading regions use `role="status"` and `aria-live`; failures use `role="alert"`.
- Reduced-motion preferences disable the loading spinner animation and transitions.
- The desktop three-column layout collapses to a two-column tablet layout and a stacked mobile layout; the source inspector is hidden on smaller screens to preserve usable content width.

## Verify with the connected backend

- Confirm every live result row receives a meaningful accessible name from API data.
- Test keyboard traversal with a screen reader on Ask, Investigate, Calendar, Alerts, and Settings.
- Add focus management when a route opens a modal or moves into a detail inspector.
- Verify colour contrast against the final brand tokens and translated copy lengths.
