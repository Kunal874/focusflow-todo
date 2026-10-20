# FocusFlow delivery checklist

The user selected a local-first build. Hosted deployment and private-repository evaluator access are subsequent delivery decisions, not resources silently provisioned by this project.

## Implemented

- [x] React Native CLI Android project with TypeScript.
- [x] Email/password registration, login, secure token storage, session restoration, logout.
- [x] Express/TypeScript API, Argon2id password hashes, verified one-hour JWTs.
- [x] Real MongoDB persistence, including a persistent local development database.
- [x] Task title, description, scheduled date-time, deadline, and priority.
- [x] Create, list, edit, complete/reopen, and confirmed deletion.
- [x] Status/priority filters and four sorting modes, including weighted smart sorting.
- [x] Loading, empty, error, retry, duplicate-submit and stale-session handling.
- [x] Standalone local APK build with bundled JavaScript; no Metro needed.
- [x] Production HTTPS and private-signing build guards.
- [x] Package checks and Android build workflow.

## Verification

- [x] API: 17 integration/regression tests against disposable MongoDB.
- [x] API: TypeScript, ESLint, and production JavaScript build.
- [x] Mobile: 27 Jest/component tests.
- [x] Mobile: TypeScript and ESLint.
- [x] Windows: standalone arm64-v8a + x86_64 APK compiles and its signature/JS bundle verify.
- [ ] Install APK and complete native UI walkthrough.
- [ ] Confirm session/task restoration after app restart on Android.
- [ ] Capture screenshots and a short demo.
- [x] Final arm64-v8a + x86_64 APK built locally, bundled JavaScript/signature verified. Desktop copy: artifacts/FocusFlow-local.apk.
- [ ] Confirm CI Android artifact.

The emulator installation command was blocked by an automatic policy check; explicit user approval was requested. Do not report the native UI walkthrough as completed until it runs.

## Before external submission

- [ ] Review/merge the implementation pull request, or share the implementation branch explicitly.
- [ ] Grant evaluator access to the private repository and assets, or choose public visibility.
- [ ] Configure a reachable HTTPS API/MongoDB deployment for use away from the developer PC.
- [ ] Build a production APK with that HTTPS URL and a private release keystore.
- [ ] Repeat the evaluation walkthrough against the deployment.
- [ ] Provide source, APK, screenshots, demo, setup instructions, and known limits.
- [ ] Submit the assignment form deliberately.

## Known limits

Sessions expire after one hour and need a new login. Immediate server-side token revocation, password recovery, email verification, offline writes, reminders, and pagination are not included in this assignment version.

The generated React Native/Metro/CLI dependency tree reports npm audit advisories, including an unpatched braces glob-pattern denial-of-service advisory propagated through build tooling. A forced npm audit downgrade would replace the selected native template with an incompatible React Native version. Keep build input trusted and review upstream patches before a production release. The API dependency audit had no reported vulnerabilities when installed.

Docker Compose configuration validates, but a container build has not been exercised because Docker Desktop's daemon is not running. Native local MongoDB development/testing is verified separately.
