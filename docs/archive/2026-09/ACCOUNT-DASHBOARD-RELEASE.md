# Account dashboard release — 19 September 2026

> Historical checkpoint. Preserved for implementation provenance; use [current status](../../STATUS.md), [product specification](../../PRODUCT-SPEC.md) and [operations](../../OPERATIONS.md) for current guidance.

Implemented preferred first names, profile portrait upload/removal, Saved research in Home, a success seal, and five account settings sections. Reading controls remain available anonymously. Account export, password recovery, TOTP enrollment/challenge/removal and global pilot logout use server-backed operations.

Security: enrolled TOTP requires AAL2 for protected account operations. A restrictive Supabase policy enforces equivalent assurance for direct civic_user_items access. Enrollment is not active until a valid code is verified. No backup recovery codes are implemented. Account removal is a support request with ownership verification.

Validation: 75 server tests, two frontend API tests, four Sites tests and production build passed. Mobile settings have no horizontal document overflow. Live user authenticator enrollment remains a user-led acceptance step.

Discord application 1550847345330233406 has the exact Supabase callback and is enabled. Its secret was transferred only to the approved Supabase provider form; no repository secret. Complete user sign-in still needs acceptance testing.

Google works with its existing Supabase hostname. A branded auth subdomain requires Supabase paid custom-domain setup; no upgrade made. Final privacy/terms require the operator legal name/address and retention review. Published pages identify these remaining details rather than asserting finalized legal terms.

