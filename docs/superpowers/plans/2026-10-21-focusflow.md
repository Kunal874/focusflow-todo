# FocusFlow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for the guided, inline build. Use superpowers:subagent-driven-development only if that execution approach is subsequently chosen. Steps use checkbox syntax for tracking.

**Goal:** build and demonstrate an authenticated Android to-do app that satisfies the supplied assignment.

**Architecture:** independent mobile and server packages in one repository. The React Native app stores its credential securely and calls an owner-scoped Express API; MongoDB persists users and tasks. Context/reducers manage mobile state, while a pure function ranks tasks.

**Tech stack:** React Native Community CLI, TypeScript, React Navigation, React Context/useReducer, react-native-keychain, a compatible native date/time picker; Node.js 24.x, Express, Mongoose, Argon2id, JWT, Zod, Helmet, express-rate-limit; Vitest/Supertest/disposable MongoDB and Jest/React Native Testing Library.

**Spec:** [FocusFlow design](../specs/2026-10-21-focusflow-design.md). Read it together with [requirements](../../requirements.md).

## Global constraints

- Android, React Native CLI, TypeScript, email/password authentication, and a Node.js/NestJS API with MongoDB are assignment requirements.
- The repository is Kunal874/focusflow-todo and is private, as selected by the user.
- The user wants a guided, step-by-step build, beginning with GitHub and a plan.
- Use Node.js 24.x, subject to the selected dependencies' engine constraints.
- Send all timestamps as UTC ISO 8601 strings.
- scheduledAt must be less than or equal to deadlineAt.
- A new task is pending with completedAt null.
- Use the native template's compatible React, TypeScript, Gradle, and Android versions.
- Only debug builds may use HTTP. Release builds use a reachable HTTPS backend.
- Scope, field limits, HTTP status codes, error envelope, JWT settings, and ranking weights come from the spec.

## Review focus

1. Two accounts and guessed task IDs: another user's task must never be readable or mutable. Test in Task 4.
2. Token expiry versus a network failure: a confirmed 401 signs out; offline restoration preserves the credential and offers retry. Test in Task 5.
3. Local dates, invalid timestamps, and one-field date edits: preserve the intended instant and reject invalid combined dates. Test in Tasks 4 and 6.
4. Failed mutations, duplicate taps, and stale responses after logout: retain saved data, submit once, and prevent cross-session state updates. Test in Tasks 5 and 6.
5. Equal sorting scores and a changing clock: deterministic order, no array mutation, and correct deadline transitions. Test in Task 7.

## Working agreement

Stage 0 is the repository/planning work. Tasks 1-8 below are the subsequent build. The user has now authorized the full implementation, so proceed continuously through all stages. The user selected local-first testing; hosted deployment and evaluator access await hosting/database accounts. Deliver a standalone local-development APK and deployment-ready source while preserving production HTTPS/signing requirements.

For behavior changes, add the named tests first, observe a meaningful failure, implement, and rerun. Do not write tests for static documentation or style constants. Each task ends with a focused commit and push. Keep separate mobile/server package-lock.json files and avoid a monorepo build framework.

## Execution status

The detailed steps below are the original plan. This table records actual delivery evidence; unchecked native and hosted checks remain pending rather than being inferred from compilation.

| Stage | Current result |
| --- | --- |
| 1 | CLI 20.2.0/RN 0.87.0 generated; native compilation passes; app installation/opening pending |
| 2–4 | API, MongoDB, registration/login and owner-scoped CRUD implemented; 17 integration/regression tests and live localhost smoke check pass |
| 5–6 | Auth and task UI/state implemented; mocked component/API tests pass; native keychain/picker and app-restart walkthrough pending |
| 7 | Smart sorting, filters and visual tokens implemented/tested; native visual/accessibility walkthrough pending |
| 8 | Standalone local APK built for arm64-v8a + x86_64; signature and embedded JS verified; docs/CI included; runtime/demo and CI artifact confirmation pending |

Review fixes: distinct task writes now queue instead of being discarded; managed local MongoDB uses its actual URI when the preferred port is occupied. Both regressions were observed failing before their fixes and now pass.

The standalone local variant is an explicit exception to the original debug-only HTTP rule: it bundles JS with dev support disabled, uses a debug key, and permits local HTTP. Production release retains HTTPS and private-signing guards. Hosted deployment is deferred by the user's local-first choice. Commits group related mobile stages rather than splitting every original planned file/commit boundary. See [the delivery checklist](../../submission-checklist.md) for remaining checks.

## Planned file boundaries

| Path | Responsibility |
| --- | --- |
| mobile/App.tsx, mobile/src/app/RootNavigator.tsx | Providers and auth/protected navigation |
| mobile/src/lib/api.ts, session.ts, config.ts | JSON HTTP calls, keychain session storage, public API configuration |
| mobile/src/features/auth/ | AuthContext, reducer, LoginScreen, RegisterScreen, and tests |
| mobile/src/features/tasks/ | Task types, context/reducer, list/form/cards, sorting, and tests |
| mobile/src/components/, mobile/src/app/theme.ts | Shared accessible controls and visual tokens |
| server/src/app.ts, index.ts, config.ts, db.ts | Testable Express app, process startup, configuration, database connection |
| server/src/auth/ | User model, credential validation, routes, JWT/password helpers |
| server/src/tasks/ | Task model, validators, owner-scoped routes |
| server/src/middleware/ | requireAuth and normalized error responses |
| server/tests/ | Integration tests and disposable database lifecycle |
| .github/workflows/ci.yml | Reproducible package checks and Android debug build |
| docs/ | Setup, API reference, screenshots, demo, and submission checklist |

Do not create empty placeholder modules. Add each file when its stage needs it.

### Task 1 / Stage 1: Run the native Android starter

**Files:** create mobile using the verified React Native TypeScript template; update mobile/package.json, README.md, and docs/windows-setup.md.

**Interfaces:** consumes the existing root Git repository; produces an Android starter with npm scripts start, android, lint, typecheck, and test. All mobile commands below run from mobile.

- [x] Verify/install Java and Android tools, configure their paths, and boot a test emulator using the [Windows setup guide](../../windows-setup.md). Completed under C:\CODE; starter-app work below remains pending.
- [ ] Select and record a compatible CLI/template pair using official requirements; pin the init versions and generate mobile without a nested Git repository.
- [ ] Preserve the template's native configuration and dependencies; add typecheck = tsc --noEmit if missing.
- [ ] Run npm run lint, npm run typecheck, and npm test -- --runInBand. Expected: all exit 0.
- [ ] Run npm start and npm run android in separate terminals. Expected: the starter installs and renders on the chosen device. Record its Android version and any machine-specific setup.
- [ ] Commit as "chore: initialize React Native Android app" and push.

### Task 2 / Stage 2: Start an API connected to MongoDB

**Files:** create server/package.json, package-lock.json, tsconfig.json, .env.example, src/config.ts, src/db.ts, src/app.ts, src/index.ts, src/middleware/errorHandler.ts, tests/setup.ts, and tests/health.test.ts.

**Interfaces:** createApp(): Express creates an app without listening; connectDatabase(uri: string): Promise<void> opens MongoDB. npm scripts dev, build, start, lint, typecheck, and test are available from server. Start the listener only from index.ts after connecting.

- [ ] Initialize a small TypeScript Express package with the needed runtime dependencies and Vitest/Supertest/mongodb-memory-server. Add scripts, strict TypeScript configuration, and placeholder-only environment documentation.
- [ ] Add health tests using a disposable test database: GET /api/health returns 200 with {status:'ok',database:'connected'} when connected, and 503 with error.code='DATABASE_UNAVAILABLE' when disconnected. Observe failure before implementing the endpoint.
- [ ] Implement createApp, environment validation, a 32 KB JSON limit, Helmet, the error envelope, and graceful database/process shutdown. Missing MONGODB_URI or JWT_SECRET must stop startup with a safe message.
- [ ] Run npm test -- health and npm run typecheck. Expected: both exit 0. Start dev with an actual local/Atlas URI and check GET /api/health; never print credentials.
- [ ] Commit as "feat(api): connect MongoDB and add health endpoint" and push.

### Task 3 / Stage 3: Add backend account authentication

**Files:** create server/src/auth/User.ts, validation.ts, tokens.ts, routes.ts; server/src/middleware/requireAuth.ts; server/tests/auth.test.ts. Modify app.ts and config.ts.

**Interfaces:** POST register/login returns AuthSession; GET me returns {user: User}. requireAuth attaches authenticated userId for task routes. Use exactly the types and route/error contract in the spec.

- [ ] Add integration assertions: register returns 201 and a token; normalized duplicate email returns 409 EMAIL_IN_USE; malformed email/short password return 400; login returns 200 for the correct password and 401 INVALID_CREDENTIALS otherwise.
- [ ] Add tests that the stored hash differs from the password, password/hash never appear in responses, /auth/me returns 200 with a valid token and 401 for missing/expired/wrong-audience tokens, and the eleventh auth attempt within a minute returns 429.
- [ ] Run npm test -- auth. Expected: tests fail on missing behavior.
- [ ] Implement the normalized unique email model, Argon2id hashing, one-hour HS256 tokens, strict request schemas, and the auth rate limiter. Catch duplicate-key races as 409. Pin issuer and audience as specified; do not decode without verification.
- [ ] Run npm test -- auth, npm run typecheck, and npm run lint. Expected: all exit 0; repeat the register/login/me flow against the development API.
- [ ] Commit as "feat(auth): add email password API authentication" and push.

### Task 4 / Stage 4: Persist and protect tasks

**Files:** create server/src/tasks/Task.ts, validation.ts, routes.ts, server/tests/tasks.test.ts; modify app.ts; create docs/api.md.

**Interfaces:** implement GET/POST /api/tasks and PATCH/DELETE /api/tasks/:id with the spec's CreateTaskInput, UpdateTaskInput, Task response shape, and error codes. Derive ownerId solely from requireAuth. No task detail endpoint is needed.

- [ ] Add an integration flow: create returns 201 pending with completedAt=null; list returns saved fields; edit returns 200; completion sets completedAt; repeated completion preserves it; reopen clears it; delete returns 204 and the task disappears.
- [ ] Add two-user assertions: B's list excludes A's task; B's patch/delete of A's ID return 404; A can still read the unchanged task. Missing authentication returns 401.
- [ ] Add validation assertions: invalid ObjectId returns 400, absent ID returns 404, unknown/owner fields and empty patches return 400, scheduledAt after deadlineAt fails, a one-date patch cannot break that invariant, invalid dates fail, and past/equal valid dates succeed.
- [ ] Run npm test -- tasks and observe failure; implement schema timestamps/indexes, strict validation, response mapping, and atomic owner-scoped database queries. Validate the merged record for partial updates.
- [ ] Run npm test, npm run typecheck, npm run lint, and npm run build. Expected: all exit 0. Document verified sample requests with placeholders only.
- [ ] Commit as "feat(tasks): add owner scoped task CRUD API" and push.

### Task 5 / Stage 5: Connect mobile authentication

**Files (inside mobile):** create src/lib/api.ts, src/lib/session.ts, src/lib/config.ts, src/app/RootNavigator.tsx; src/features/auth/types.ts, AuthContext.tsx, authReducer.ts, LoginScreen.tsx, RegisterScreen.tsx; src/features/auth/__tests__/AuthContext.test.tsx and AuthScreens.test.tsx. Modify App.tsx and package.json.

**Interfaces:** apiRequest<T>(path: string, options?: RequestInit): Promise<T> parses the spec's response/error contract and handles 204 without parsing JSON. AuthContext exposes the methods/status in the spec. Session storage exposes readToken(): Promise<string|null>, writeToken(token: string): Promise<void>, clearToken(): Promise<void>. Credential headers remain internal.

- [ ] Install compatible React Navigation native-stack dependencies, react-native-keychain, and React Native Testing Library. Add typed AuthSession/User and a structured ApiError with HTTP status, code, and field errors.
- [ ] Add tests: submitting login calls the API once despite repeated taps; successful registration enters the protected stack; a stored valid token restores /me; a confirmed 401 clears storage; a network failure retains it and shows retry; logout invalidates delayed session responses.
- [ ] Run npm test -- auth --runInBand and observe failure. Implement the HTTP/session layer, reducer/context, accessible auth forms, and conditional navigation. Keep restoring/retry behavior separate from signed-out credentials errors.
- [ ] Configure the appropriate emulator/USB debug URL. A release configuration must require HTTPS. Map form validation and server errors to readable messages without exposing internal details.
- [ ] Run npm run lint, npm run typecheck, npm test -- --runInBand, and npm run android. Expected: checks exit 0 and real keychain/navigation dependencies build.
- [ ] Manually register, sign out, sign in, restart, and restore against the real API. Commit as "feat(mobile): add authenticated navigation and secure sessions" and push.

### Task 6 / Stage 6: Manage tasks in the Android app

**Files (inside mobile):** create src/features/tasks/types.ts, TasksContext.tsx, tasksReducer.ts, TaskListScreen.tsx, TaskFormScreen.tsx, TaskCard.tsx; src/features/tasks/__tests__/TasksContext.test.tsx and TaskFormScreen.test.tsx. Add src/components/Button.tsx and TextField.tsx when first shared. Modify RootNavigator.tsx and App.tsx.

**Interfaces:** expose tasks/loading/error and refresh/create/update/remove as defined in the spec. TaskForm route params are undefined or {taskId: string}. Use the API types/fields established by Task 4, with UTC ISO strings at the network boundary.

- [ ] Install a native date/time picker compatible with the selected React Native release. Add tests for create/edit submissions, displayed saved status, completion/reopen, and confirmed deletion.
- [ ] Test local date/time -> ISO conversion and a fixed instant rendered in local time; reject invalid form dates and deadline-before-schedule. Test an API error retaining the list/form, duplicate-submit prevention, and a delayed response ignored after switching users.
- [ ] Run npm test -- tasks --runInBand and observe failure. Implement list/form/context/reducer, FlatList keys, loading/empty/error/retry states, keyboard avoidance, and explicit complete/reopen actions.
- [ ] Use server-confirmed updates; retain existing task data on failure. Clear all task state when the session changes. A delete needs a confirmation dialog and must not disappear until it succeeds.
- [ ] Run mobile lint, typecheck, tests, and npm run android. Expected: all checks pass. Manually create/edit/complete/reopen/delete and restart; inspect persistence through the API.
- [ ] Commit as "feat(mobile): add complete task management workflow" and push.

### Task 7 / Stage 7: Add smart sorting, filters, and polish

**Files:** create mobile/src/features/tasks/sortTasks.ts, __tests__/sortTasks.test.ts, and src/app/theme.ts; modify TaskListScreen/TaskCard/TaskFormScreen and shared components.

**Interfaces:** sortTasks(tasks: Task[], mode: SortMode, now: number): Task[]; SortMode is smart/deadline/schedule/priority. Filters are status all/pending/completed and priority all/low/medium/high. Keep filtering and ranking derived from the original task collection.

- [ ] Use a fixed clock in tests. Assert overdue pending precedes other pending, completed is last, priority affects equal-date ranking, deadline/schedule affect equal-priority ranking, ties use the specified sequence, and input order/data remain unchanged.
- [ ] Add tests for alternative sorts, each filter and combined filters, empty results, and a task crossing its deadline when the clock advances. Example invariants: expect(result.map(t => t.id)).toEqual(expectedIds); expect(input).toEqual(snapshotBeforeSort).
- [ ] Run npm test -- sortTasks --runInBand and observe failure. Implement the exact 50/35/15 formula and time windows from the spec, including the completedAt ordering and stable tie-breakers.
- [ ] Add selectors and a short sort explanation. Update now on screen focus, refresh, and once per minute; clean up the timer. Apply the proposed visual tokens and completion summary without changing task storage.
- [ ] Run mobile checks and manually inspect small screens, large text, keyboard overlap, TalkBack labels, contrast, and 48 dp targets. Expected: filters/sorts are understandable and every form/action remains usable.
- [ ] Commit as "feat(mobile): add smart task ranking and polish" and push.

### Task 8 / Stage 8: Verify and prepare submission

**Files:** create .github/workflows/ci.yml, docs/submission-checklist.md, docs/screenshots/ as needed; update README.md, docs/api.md, setup notes, and Android release configuration.

**Interfaces:** CI runs npm ci separately in server/mobile; executes their documented lint/typecheck/test scripts, server build, and an Android debug assemble. Release APK uses an evaluator-reachable HTTPS API and a server-side MongoDB connection.

- [ ] Add CI package checks and an Android debug build using the verified Java/SDK versions. Provide an isolated disposable database for tests; configure caching for the test binary if needed. CI must use lockfiles and must not need production secrets.
- [ ] Select an available HTTPS backend host and MongoDB deployment, configure server-only secrets, and verify /health plus the full auth/task flow over HTTPS. Resolve any account/cost decision with the user at that stage.
- [ ] Configure release signing with a private key kept outside Git. From mobile/android, run .\gradlew.bat assembleRelease. Keep APKs outside source control and publish the approved distributable as a GitHub release asset.
- [ ] Install the release APK on Android without Metro and run the complete [evaluation walkthrough](../../requirements.md). Confirm networking works from the evaluator's environment and that two users remain isolated.
- [ ] Run the full server/mobile checks again and inspect CI results. Record commands, actual versions/device, outcomes, and known limits. Do not call an unrun check passing.
- [ ] Add screenshots, a short demo, API usage, exact setup commands, and APK link to README. Confirm evaluator access to the private repo and release assets; visibility/invitation changes require the user's delivery choice.
- [ ] Commit as "chore: prepare verified Android submission" and push. Complete the checklist and provide the submission package to the user; submitting the external form is a separate action.

## Definition of done

Every required row in requirements.md is demonstrated, meaningful automated checks pass, the release APK works without Metro, evaluators can reach the API and repository/assets, and setup instructions have been exercised. Selected bonus sorting/filtering and UI polish are included. No credentials or private signing material are committed.
