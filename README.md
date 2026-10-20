# FocusFlow

An Android to-do app planned for React Native CLI and TypeScript, backed by a Node.js API and MongoDB.

**Current status:** repository and build plan only. The mobile app, API, database, and APK have not been implemented.

## Build it step by step

We will complete one stage, run its checks, explain what changed, and commit it before moving on.

| Stage | Deliverable | Done when |
| --- | --- | --- |
| 0 | Repository and written plan | Private GitHub repo, design, setup notes, and tracked work exist |
| [1](https://github.com/Kunal874/focusflow-todo/issues/1) | Android development setup and app shell | The React Native TypeScript starter runs on an emulator or phone |
| [2](https://github.com/Kunal874/focusflow-todo/issues/2) | API and MongoDB connection | A health endpoint reports database availability |
| [3](https://github.com/Kunal874/focusflow-todo/issues/3) | Backend authentication | Register, login, and authenticated user lookup pass integration tests |
| [4](https://github.com/Kunal874/focusflow-todo/issues/4) | Task API | Users can create, read, update, complete, reopen, and delete only their own tasks |
| [5](https://github.com/Kunal874/focusflow-todo/issues/5) | Mobile authentication | Register/login screens, secure session restoration, and logout work |
| [6](https://github.com/Kunal874/focusflow-todo/issues/6) | Mobile task workflow | Tasks can be managed in the app and survive an app restart |
| [7](https://github.com/Kunal874/focusflow-todo/issues/7) | Smart sorting and UI polish | Deadline, schedule, and priority affect a tested ranking; filters work |
| [8](https://github.com/Kunal874/focusflow-todo/issues/8) | Verification and submission package | Checks pass, APK is tested, demo and setup instructions are ready |

See [GitHub issues](https://github.com/Kunal874/focusflow-todo/issues) for the stage checklist.

## Proposed stack

| Part | Choice | Reason |
| --- | --- | --- |
| Mobile | React Native Community CLI + TypeScript | Matches the assignment's native Android requirement |
| API | Node.js + Express + TypeScript | A small, easy-to-follow backend |
| Database | MongoDB + Mongoose | Persistent user and task records with schemas |
| Authentication | Argon2id password hashes + expiring JWT access tokens | Demonstrates the backend authentication flow |
| State | React Context + useReducer | Enough for authentication and a small task collection |
| Navigation | React Navigation native stack | Separate signed-in and signed-out flows |
| Token storage | react-native-keychain | Use platform-backed credential storage |
| Checks | Backend integration tests; React Native component/unit tests | Cover authentication, ownership, task operations, and sorting |

These are proposed implementation choices, not claims that dependencies are installed. Exact compatible package versions will be recorded when each package is scaffolded.

## Documents

- [Assignment requirements and acceptance checks](docs/requirements.md)
- [Design, data model, and API contract](docs/superpowers/specs/2026-10-21-focusflow-design.md)
- [Implementation plan](docs/superpowers/plans/2026-10-21-focusflow.md)
- [Windows setup and environment findings](docs/windows-setup.md)

## Planned layout

~~~text
focusflow-todo/
  mobile/                  # React Native CLI app; created in Stage 1
    android/
    src/
      app/
      components/
      features/auth/
      features/tasks/
      lib/
  server/                  # Express API; created in Stage 2
    src/
      auth/
      tasks/
      middleware/
    tests/
  docs/
  .github/workflows/       # Added with verification automation
~~~

The mobile and server packages will each have their own package.json and committed package-lock.json. No monorepo framework is needed.

## First build step

Prepare Java, Android Studio, the Android SDK, and a device using [the Windows setup guide](docs/windows-setup.md). Then generate and run the mobile starter. Node.js, npm, Git, and GitHub CLI are already available in the checked development environment.

There are no app install/run commands yet because product code has not been generated. Those commands will be added and verified as the stages are completed.

## Submission

Prepare a repository link, tested Android APK, screenshots, short demo, API/setup documentation, and an evaluation checklist. Confirm the evaluator can access this private repository before submitting.

The assignment's submission form is [linked here](https://forms.gle/UZZKMsXApTA2H64J9). Submission will be a separate, deliberate step after the app is complete.
