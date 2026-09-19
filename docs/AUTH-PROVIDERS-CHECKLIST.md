# Sign-in activation: what I need from you

Email accounts already work. Google, Apple, Discord and organization SSO are implemented but disabled until their real provider connections exist. Start with Google, then Discord; Apple and institutional SSO can follow.

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
