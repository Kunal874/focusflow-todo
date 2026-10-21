# FocusFlow

A React Native CLI Android to-do app written in TypeScript, with an Express API and MongoDB. Register or log in, then create, edit, complete, reopen, and delete your own tasks. Each task has a title, description, scheduled date-time, deadline, and priority.

The implementation is complete on [feat/focusflow-app](https://github.com/Kunal874/focusflow-todo/tree/feat/focusflow-app), with [pull request #9](https://github.com/Kunal874/focusflow-todo/pull/9) ready for review. This is a **local app**: the API runs on your PC, and hosting was excluded by the user's final delivery choice. The native emulator walkthrough passes; see the [Android verification report](docs/android-verification.md) and [screenshots](docs/screenshots/README.md).

## Features

- Email/password authentication with Argon2id hashes and one-hour JWTs.
- Android-backed secure token storage, session restoration, logout, and offline retry.
- Owner-scoped MongoDB records; one account cannot read or modify another's tasks.
- Native date/time pickers, confirmed deletion, status and priority filters.
- Four sorts: smart, deadline, scheduled time, and priority.
- Paper, ink, and mint interface with progress summary, empty/error states, and accessible control labels.
- Standalone local APK with bundled JavaScript; Metro is unnecessary for this build.

Smart sorting puts overdue pending tasks first and completed tasks last. Other pending tasks combine priority (50%), deadline urgency over 72 hours (35%), and scheduled-time urgency over 24 hours (15%). Stable date/ID tie-breakers make ordering predictable. The [design](docs/superpowers/specs/2026-10-21-focusflow-design.md) describes the formula.

## Run locally on Windows

Prerequisites: Node.js 24, Java 17, Android SDK and a running Android emulator/USB device. This machine has Java and Android tools under `C:\CODE`; see [Windows setup](docs/windows-setup.md). Dependencies and generated files stay outside Git.

In a PowerShell terminal at the repository root:

```powershell
cd server
npm ci
npm run dev:local
```

The runner downloads a real MongoDB binary on first use, creates a private `.env` secret, and keeps database files in `server/.local/mongodb`. MongoDB binds to loopback; the API listens on port 3000. Leave this terminal running. An occupied preferred MongoDB port selects another port and the API connects to that managed instance. Run only one local runner against these data files.

In a second terminal:

```powershell
Invoke-RestMethod http://127.0.0.1:3000/api/health
cd mobile
npm ci
npm run build:local -- -PreactNativeArchitectures=arm64-v8a,x86_64
```

Expected health response: `status: ok`, `database: connected`. The APK is `mobile/android/app/build/outputs/apk/local/app-local.apk`. The local delivery copy is `artifacts/FocusFlow-local.apk`, with a SHA-256 file alongside it. APKs are ignored by Git. [GitHub Actions](https://github.com/Kunal874/focusflow-todo/actions/workflows/ci.yml) builds and uploads a private `FocusFlow-local` artifact for successful runs.

Install the local APK on your emulator or phone when ready:

```powershell
adb install -r mobile/android/app/build/outputs/apk/local/app-local.apk
adb shell am start -n com.focusflow.local/com.focusflow.MainActivity
```

The default URL `http://10.0.2.2:3000/api` reaches this PC from the standard Android emulator. In the app's **Server settings**, choose the USB preset after running `adb reverse tcp:3000 tcp:3000`, or enter this PC's LAN URL for a phone on the same network. Changing servers signs out. For LAN access, Windows must allow the API through the firewall on the trusted network. The PC and API must stay on.

For development with Metro, run `npm start` in `mobile`, then `npm run android` in another terminal there.

## Check the project

```powershell
cd server
npm run lint
npm run typecheck
npm test
npm run build
# With dev:local already running in a different terminal:
npm run test:live

cd ../mobile
npm run lint
npm run typecheck
npm test -- --runInBand
```

The server suite uses disposable real MongoDB instances. The live smoke check creates synthetic accounts and verifies authentication, persistence, date validation, completion/reopening, deletion, and two-user isolation against localhost only. It deletes its task; synthetic accounts remain in the development database.

Latest local checks: 17 backend tests and 27 mobile tests pass, along with both packages' lint/typecheck and the server build. Android standalone builds have compiled with arm64-v8a and x86_64. The real Android walkthrough also passes, including registration/login, native pickers, CRUD/status, filters, account isolation, restart persistence, offline recovery, and activity recreation.

## Structure

```text
mobile/src/
  app/                  navigation and design tokens
  components/           shared controls
  features/auth/        forms, secure sessions, reducer/context
  features/tasks/       list, form, API state, sorting and validation
  lib/                  HTTP, URL configuration and keychain helpers
server/
  src/                  app bootstrap, authentication, tasks, middleware
  scripts/              persistent local database and live smoke check
  tests/                API integration and local-startup regression tests
.github/workflows/      package checks and standalone Android build
```

React Context and reducers manage auth/task state. Task writes update the UI after server confirmation; distinct writes to one task queue in order. Session generations prevent delayed responses from populating another user's workspace. The API derives ownership from the verified token and validates the merged dates on edits.

## Deployment and limits

The local APK permits development HTTP and uses a debug signing key. Production builds require `FOCUSFLOW_API_URL` with HTTPS plus private signing variables `FOCUSFLOW_KEYSTORE`, `FOCUSFLOW_STORE_PASSWORD`, `FOCUSFLOW_KEY_ALIAS`, and `FOCUSFLOW_KEY_PASSWORD`; then run `npm run build:release` in `mobile`. Keep secrets and keystores outside Git. The backend supports Node.js hosting or the included Dockerfile; [API documentation](docs/api.md) covers configuration. Docker Compose configuration validates, but its container build has not been exercised here.

Sessions expire after one hour. Password recovery, email verification, offline writes, push reminders, pagination, and immediate token revocation are outside this version. The React Native/Metro/CLI dependency tree has upstream npm audit advisories, including unpatched glob-pattern denial of service in build tooling; avoid untrusted build inputs and review upstream fixes before production. A forced audit downgrade would replace the selected native template with an incompatible version. The server dependency audit reported no vulnerabilities when installed.

## Assignment delivery

- [Local APK, demo and screenshot assets in the private draft release](https://github.com/Kunal874/focusflow-todo/releases)
- [Android verification report](docs/android-verification.md)
- [Screenshot gallery](docs/screenshots/README.md)
- [Requirements and evaluation walkthrough](docs/requirements.md)
- [API contract and examples](docs/api.md)
- [Build plan](docs/superpowers/plans/2026-10-21-focusflow.md)
- [Verification and submission checklist](docs/submission-checklist.md)

This repository is private. Grant evaluator access or choose visibility before sharing it. Screenshots and the recorded demo are included in the local delivery package/private draft release. Hosting is excluded from this delivery; the APK needs the local API and MongoDB running on the PC, reachable through the emulator, USB forwarding, or the same LAN. The [assignment form](https://forms.gle/UZZKMsXApTA2H64J9) has not been submitted. [Cloud preparation status](docs/hosting.md) records the unused resources created before hosting was cancelled.
