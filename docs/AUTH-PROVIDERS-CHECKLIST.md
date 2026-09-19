# Sign-in activation: what I need from you

Status on 19 September 2026: Google is enabled and a production sign-in reached the correct account. Google remains in Testing with the owner's email explicitly allowed; public consent branding/release is pending. Passwordless email is deployed, Titan SMTP is configured, and a production magic-link request succeeded. Inbox delivery was confirmed by the owner, but the first link returned otp_expired. The revised confirmation flow has been sent for a fresh end-to-end test. Discord is not enabled: the prepared new application awaits the owner's acceptance of Discord's developer agreement. Apple remains disabled without an Apple Developer membership. Organization SSO was removed from the account UI: the user meant passwordless email, not enterprise SAML.

## Passwordless email release

Landing and in-app account entry default to email magic links; password access remains available. The API stores the PKCE verifier server-side, uses an HttpOnly flow cookie, and exchanges the callback once. New email users can create an account through the same flow. Request the link and open it in the same browser; never copy private links into chat or logs.

Supabase Site URL is `https://midnight.vote/Switzerland/`, with the exact production callback allowlisted. Titan SMTP uses `smtp.titan.email:465`, mailbox/sender `contact@midnight.vote`, and sender name `midnight.vote`. The owner entered the mailbox password directly in Supabase. The branded Magic link template was saved and its rendered preview checked. Editable template assets are in `deploy/switzerland/supabase-email-templates/`.

Production release archive SHA-256: `b8b6c63f1344f795257c7090b91fe1dd5a9c2862733c08d4f37ab8edb804ebf7`. The navbar and passwordless flow were deployed to `/Switzerland/`, preserving the existing API data volume and the root site. Validation: 71 backend tests, frontend build, four Sites tests, successful live Google callback/logout, and successful live email request. The revised email callback, a fresh email signup, Discord and public Google availability remain acceptance checks.

| Provider | What you need to locate | What I will configure/test |
|---|---|---|
| Google | Existing Google Cloud project name/ID and access to Google Auth Platform. An old project may be reusable; no new cloud compute is needed for login. | Inspect existing OAuth clients and consent branding; use a dedicated web client for this pilot, minimal identity scopes, callback URLs, then test login/cancel/logout. |
| Discord | An owned application in Discord Developer Portal, or permission to create one. | Configure its OAuth callback and connect client ID/secret to Supabase; test login and cancellation. |
| Apple | Active Apple Developer account; Team ID, Services ID and Sign in with Apple configuration. | Configure web sign-in and Supabase. Document the six-month client-secret renewal. |
| Organization SSO | A real organization identity provider, administrator contact and SAML connection details. | Verify Supabase plan support, configure the connection and then enable its button. This is not a generic social login provider. |

**Send project names/IDs only. Put secrets directly into the provider/Supabase settings or an agreed local secret file, never into chat.** I will not replace an existing application's credentials without checking what uses them.

Two different redirects matter:

1. Provider → Supabase: use the exact callback displayed in Supabase's provider settings (`https://<project-ref>.supabase.co/auth/v1/callback`).
2. Supabase → our app: the app's `/api/auth/callback` on its configured origin and mount. Local canonical origin is currently `http://localhost:5173`; use that hostname for authentication because cookies do not transfer between localhost and 127.0.0.1. Production is `https://midnight.vote/Switzerland/api/auth/callback`.

## Production email and redirect settings

The application already sends the production callback as `redirect_to` during sign-up, recovery and social authentication. Supabase must also allow that exact URL; otherwise it silently falls back to the project Site URL, which can send confirmation links to `localhost:3000`.

In Supabase Authentication URL Configuration:

- Set Site URL to `https://midnight.vote/Switzerland/`.
- Add the exact Redirect URL `https://midnight.vote/Switzerland/api/auth/callback`.
- Keep localhost URLs only as additional development redirects, never as the production Site URL.

In Authentication Email Templates, set the Confirm signup subject from `deploy/switzerland/supabase-email-templates/confirmation-subject.txt` and its body from `deploy/switzerland/supabase-email-templates/confirmation.html`. The template uses the account `display_name` metadata and `{{ .ConfirmationURL }}`, so it remains personalized while preserving the server-held PKCE flow.

After publishing those settings, create a fresh account and verify that the received link contains `redirect_to=https://midnight.vote/Switzerland/api/auth/callback`, returns to the dashboard, establishes the session cookie and shows the saved display name in the Home welcome.

Also prepare the public app name, support email, logo and actual privacy-policy URL for consent branding. Google can be tested with explicitly listed test users before public release. Public consent/brand verification may take additional time.

My activation gate: provider enabled in discovery; successful callback establishes the correct account; cancellation and expired PKCE fail cleanly; logout clears access; no secrets in browser bundles or logs. No paid subscriptions or new cloud machines are needed for the initial Google setup.

Official setup references: [redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls), [email templates](https://supabase.com/docs/guides/auth/auth-email-templates), [Google](https://supabase.com/docs/guides/auth/social-login/auth-google), [Apple](https://supabase.com/docs/guides/auth/social-login/auth-apple), [Discord](https://supabase.com/docs/guides/auth/social-login/auth-discord).

## Email link recovery follow-up

The first delivered email returned `otp_expired`; the cause is not confirmed. The revised template opens an intermediate confirmation screen before navigating to Supabase verification, reducing accidental consumption by simple email-link prefetching. It preserves the existing PKCE flow and same-browser requirement. The verification URL is held in the fragment, removed from browser history after loading, and accepted only for this Supabase project and the exact application callback. No request consumes the token until the user presses Confirm sign-in. A success screen checks the real account session before saying the user is signed in; expired/failed links offer a fresh request. The owner requested the Cleisthenes portrait and larger email typography; both are now published. Frontend follow-up deployed from `artifacts/auth-email-ui/site`, retaining the previously deployed backend.

The second attempt was rejected immediately by the new confirmation page. Found and fixed handling of percent-encoded nested verification URLs from email template rendering; a regression covers both forms and rejects off-domain links. A production dummy-token check now reaches Confirm sign-in without sending any verification request. Final real email completion is still pending. Requesting in Codex and opening in Chrome does not share the PKCE cookie: the user is testing a fresh request and click in the same browser.
