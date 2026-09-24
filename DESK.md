# XAGRIA Private Desk — Stage 1

The public calculators remain at `/en`, `/es`, `/it` and their existing child paths. `/` is the gateway; `/desk` is deliberately outside locale routing. Public next-intl detection is retained. Middleware is placed beside `src/app` at `src/middleware.ts`, so Next.js actually loads it. No intelligence tools or database are implemented.

## Vercel configuration and release

Set these **server-only** variables separately in the appropriate Preview and Production environments:

- `XAGRIA_DESK_PASSPHRASE`: a unique, randomly generated passphrase, at least 16 non-padding characters (maximum 1,024 characters).
- `XAGRIA_SESSION_SECRET`: an independent cryptographically random secret, at least 32 non-padding characters (maximum 4,096 characters). Use at least 32 random bytes.

Do not prefix either with `NEXT_PUBLIC_`, commit them, paste them into issue/PR comments, or log them. Missing, short, identical or otherwise invalid configuration disables authentication. Restart/redeploy after changing environment variables. Rotating either value invalidates all previous sessions.

Keep this change on its feature branch until Preview has the variables and the protected flow has been tested on HTTPS. Do not merge into the Vercel production branch or deploy to production beforehand. Check actual Vercel origin handling, the production Secure cookie, login/logout and public locale routes in Preview.

Next.js was updated from 15.1.11 to 15.5.26 after npm audit identified critical advisories in the original version.

## Security boundaries

Sessions are HMAC-SHA256 signed, expire after eight hours, and contain no credentials or intelligence. Cookies are HttpOnly, SameSite=Strict, scoped to `/desk`, and Secure in production. Authentication POST routes require a matching Origin; login accepts only bounded URL-encoded forms. Passphrase hashes are compared in constant time. Private pages are dynamic and private responses are not cacheable.

Place private pages under `src/app/desk/(private)` and call `requireDeskSession()` **in each page**, before reading data. The protected layout is an additional check, not a substitute. Every future private Route Handler must call `hasDeskSession()` and return 401 before reading/changing data; layouts do not protect handlers. Every future Server Action must independently call `requireDeskSession()` before any work. Keep future desk endpoints under `/desk`, matching the cookie path. The login routes are intentionally public. The authenticated `/desk/api/session` endpoint exposes only session validity.

This is stateless single-owner authentication. Logout deletes the browser cookie; a copied token remains usable until expiry or credential rotation. There is no database or per-session revocation. No distributed login rate limiter is included: use a high-entropy passphrase and configure Vercel edge rate limiting for `/desk/login/submit` before public rollout. Do not rely on process-local rate counters across serverless instances.

## Verification

Use Node.js 24+ for the dependency-free test runner (it strips TypeScript):

```
npm ci
npm run build
npm run test:desk
```

The tests generate ephemeral credentials internally, start the production build on localhost:3198, and check public routes, locale detection, authentication and signed/expired/tampered cookies, logout, direct endpoint protection, origin checks and fail-closed configuration. No real Vercel secrets are needed. The tests do not claim browser interaction coverage of calculator arithmetic; calculator implementations, translation dictionaries and public layout remain unchanged.

Local verification completed: production build and all automated desk tests passed on Next.js 15.5.26. `git diff --check` passed. A Chromium UI smoke test could not run because the browser executable is unavailable in the execution environment; actual desktop/mobile browser and Vercel HTTPS checks remain release gates.

The final npm audit has no critical advisories. It still reports one high PostCSS advisory group in Next.js's nested build dependency and one moderate inherited Next.js finding; its suggested complete fix is a Next.js 16 major upgrade. Stage 1 does not accept or process user-supplied CSS. This remaining dependency issue is recorded rather than introducing an untested major framework migration.
