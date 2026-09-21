# Landing account flow

> Historical implementation note. Preserved for UX provenance; use the [product specification](../../PRODUCT-SPEC.md), [user guide](../../USER-GUIDE.md) and [authentication checklist](../../AUTH-PROVIDERS-CHECKLIST.md).

18 September 2026.

Header, hero and closing Get started actions open a native modal account dialog. Existing signed-in users continue to the civic dashboard. The landscape, mascot, scroll narrative and interactive demos remain intact. An explicit guest path keeps public reading open.

The popup reuses email sign-up, verification, sign-in and recovery. It adds Google, Apple and Discord through a strict server-side provider allowlist and PKCE. The verifier stays on the server. Organization SSO uses a configured Supabase SAML provider ID, not an arbitrary organization or redirect supplied by the browser.

Current live provider discovery: email enabled; Google, Apple, Discord and organization SSO disabled. Buttons reflect this. Adapters and mocked tests are complete; real social sign-in has NOT been verified or activated.

## Activation

Configure each OAuth application and secret directly in the provider/Supabase consoles, never in frontend code or chat. Use the callback supplied by Supabase for the provider application, and permit the pilot's exact application callback in Supabase redirect settings. Keep the existing root midnight.vote deployment separate from the proposed /Switzerland/ mount. Test verification, cancellation, expired flow, logout and callback state on the intended deployed origin.

Apple web OAuth requires its own configuration and secret lifecycle; see [Supabase Apple guide](https://supabase.com/docs/guides/auth/social-login/auth-apple). Discord setup is documented in the [Discord guide](https://supabase.com/docs/guides/auth/social-login/auth-discord). Institutional sign-in requires an actual configured SAML connection and applicable plan support: [Supabase SSO guide](https://supabase.com/docs/guides/auth/enterprise-sso/auth-sso-saml). Set SUPABASE_SSO_PROVIDER_ID only after that connection exists. No paid feature or subscription was enabled here.

## Conversion evaluation

The change creates a clearer account entry; it does not establish a CTR improvement. Measure landing visit → CTA click → modal open → authentication started → verified account → first saved source. Also track guest entry and abandonment so public access is not penalized. No new analytics service or tracking was installed.

Validate email and provider flows with owned test accounts after activation. Automated tests cover provider discovery, fail-closed behaviour, PKCE construction and the configured SSO request; they do not substitute for real provider testing.
