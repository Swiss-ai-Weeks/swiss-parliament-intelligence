# Swiss production update — 19 September 2026

> Historical production checkpoint. Preserved for provenance; use [status](../../STATUS.md), [operations](../../OPERATIONS.md) and the [authentication checklist](../../AUTH-PROVIDERS-CHECKLIST.md).

Commit `d4794ebdd918278fb3589ccfdd7761f3c33b5b4c` was deployed to [midnight.vote/Switzerland](https://midnight.vote/Switzerland/). The account dialog now collects a display name, keeps email before alternate sign-in methods and replaces the form with a dedicated inbox state after signup or recovery. Home now opens with the member's name, provides a direct Cleisthenes composer, uses the verified National Council seating snapshot as a compact chamber preview and keeps calendar selection independent from the parliamentary agenda list. Calendar detail uses a popover, previous/next arrows and a custom month chooser.

This was a static frontend-only production update. The release uploaded Swiss assets and activated the Swiss index after the assets completed. It did not replace public evidence, databases, account storage, protected environment values, the scoped PHP proxy, the `swiss-civic-pilot` API container or the separate Midnight stack. Hostinger cache for the Swiss directory was cleared after activation.

Live checks passed: the page and API health endpoint returned HTTP 200, the page referenced `/Switzerland/assets/index-195fiQa6.js`, and the deployed Swiss bundle contained the new welcome, account confirmation state, month chooser and Cleisthenes composer. Before deployment, 69 backend tests, two frontend API tests, four Sites packaging tests and the production Vite build passed. Desktop and compact-layout browser checks covered account ordering, the confirmation state, calendar navigation/popover behavior and stable In Parliament results.

The personalized confirmation-email subject and HTML are versioned under `deploy/switzerland/supabase-email-templates`. They are not active until an authorized administrator signs into the existing `Midnight Vote Swiss Pilot` Supabase project, sets the production Site URL and callback allowlist, and publishes the template. The Supabase dashboard was left open at sign-in; no credentials were entered and no account was created. Follow `AUTH-PROVIDERS-CHECKLIST.md` and run a fresh end-to-end confirmation-link test after activation.

The branch is published only to `tomasgarro/swiss-parliament-intelligence`, branch `feat/swiss-citizen-pilot`. Upstream/main remains unchanged.
