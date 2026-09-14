# Backend handoff checklist

The frontend is ready to connect through `VITE_API_BASE_URL`. Set that variable in the deployment environment; do not hard-code service URLs in screen components.

## First endpoints to implement

1. `GET /dashboard` — return `trackedProposals` (or `proposals`) with `id`, `title`, `status`, `next`, and `progress`.
2. `POST /ask` — accept `{ question, scope }` and return an answer plus source evidence IDs.
3. `GET /evidence/{id}` — resolve every citation to a speaker, quote, timestamp, and parent debate.
4. `GET /debates/{id}` and `/debates/{id}/transcript` — power the video/transcript workspace.
5. `GET /search/evidence` — accept query and filter parameters and return ranked evidence moments.

## Integration acceptance criteria

- Non-2xx responses remain actionable: the UI shows a retryable error state and preserves the user's draft input.
- Empty arrays return a meaningful empty state, not a blank panel.
- API responses use stable IDs that match citations, debates, proposals, and speakers.
- Authentication and CORS are agreed before enabling the variable in production.
- Fixtures remain available for local demo mode when `VITE_API_BASE_URL` is unset.
