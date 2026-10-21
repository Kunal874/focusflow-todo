# FocusFlow delivery checklist

The local build is verified. The user subsequently authorized free Atlas/Render hosting and a signed APK that works away from the developer PC. Hosting is in progress; see [the handoff](hosting.md). Private-repository evaluator access is still a separate delivery decision.

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
- [x] Mobile: 28 Jest/component tests, including the hosted cold-start regression.
- [x] Mobile: TypeScript and ESLint.
- [x] Windows: standalone arm64-v8a + x86_64 APK compiles and its signature/JS bundle verify.
- [x] Install APK and complete native UI walkthrough on Android 16 / API 36.
- [x] Confirm secure session/task restoration and completed logout after app restart.
- [x] Capture native screenshots and a 54.23-second final-APK demo.
- [x] Final arm64-v8a + x86_64 APK built locally, bundled JavaScript/signature verified. Desktop copy: artifacts/FocusFlow-local.apk.
- [x] Confirm the local application CI Android build/artifact (run 39553307858). This run predates the hosted cold-start update.

The user approved installation/testing. Native checks now pass, including offline retry, two-account isolation and activity recreation. See [the verification report](android-verification.md) for evidence and limitations.

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
