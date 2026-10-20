# FocusFlow design

**Status:** proposed design for review; product implementation has not started.
**Date:** 21 October 2026.
**Intent:** satisfy the assignment with a working Android app and a backend that the author can explain and demonstrate.

## Confirmed requirements and choices

- The user wants a guided, step-by-step build, beginning with GitHub and a plan.
- The repository is Kunal874/focusflow-todo and is private, as selected by the user.
- Android, React Native CLI, TypeScript, email/password authentication, and a Node.js/NestJS API with MongoDB are assignment requirements.
- Task title, description, date-time, deadline, priority, completion, deletion, and a status list are required.

Everything below is a proposed builder decision unless identified above. It may be adjusted during the guided build, with the documents updated.

## Approach and alternatives

Use one repository with independent mobile and server packages. Express keeps the backend small enough to understand; NestJS would add conventions and files without a clear benefit at this scale. A custom email/password API demonstrates authentication and ownership alongside MongoDB; Firebase would introduce a second authentication system and account setup. React Context with useReducer is sufficient for the auth session and a small personal task list; Redux is unnecessary for the initial scope.

Use React Native Community CLI, preserving the generated native Android project. Do not replace this with Expo or a web app. Use the native template's compatible React, TypeScript, Gradle, and Android versions. Recheck CLI/template compatibility before generation and commit lockfiles; do not independently upgrade React or Android build tools.

Use Node.js 24.x, subject to the selected dependencies' engine constraints. Node 24.18.0 and npm 11.16.0 were found locally. Registry observations on this date were React Native 0.88.0, Community CLI 20.2.0, Express 5.3.0, and Mongoose 9.11.2. These are observations, not a verified compatible CLI/template combination. Stage 1 verifies compatibility and records the actual selected versions.

## Scope and boundaries

Deliver register/login/logout, session restoration, task CRUD, complete/reopen, filters, sorting, and a polished Android interface. MongoDB is the source of truth; fetch tasks after login and refresh on demand. Confirm a mutation on the server before updating visible data, so a failed request cannot silently lose a task.

Do not build collaboration, recurring tasks, attachments, notifications, password recovery, email verification, refresh-token rotation, offline writes, or an administrative interface for this assignment version. No paid hosting or cloud infrastructure is provisioned during planning. Tests should exercise behavior; do not test every style value.

## Data model and validation

Persist MongoDB ObjectIds internally; expose them as id strings and never expose __v or passwordHash. Send all timestamps as UTC ISO 8601 strings. Pick dates in device-local time, convert on submit, and render in device-local time. Accept only valid date-time strings with an explicit offset or Z; reject invalid calendar values.

~~~ts
type Priority = 'low' | 'medium' | 'high';
type TaskStatus = 'pending' | 'completed';
type User = { id: string; email: string; createdAt: string };
type Task = {
  id: string;
  title: string;
  description: string;
  scheduledAt: string;
  deadlineAt: string;
  priority: Priority;
  status: TaskStatus;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
type AuthSession = { user: User; accessToken: string; expiresAt: string };
type CreateTaskInput = Pick<Task,
  'title' | 'description' | 'scheduledAt' | 'deadlineAt' | 'priority'>;
type UpdateTaskInput = Partial<CreateTaskInput & { status: TaskStatus }>;
~~~

User database fields add passwordHash to User. Normalize email by trimming and lowercasing, validate its format, and enforce a unique index. Passwords are 10-128 characters, are never trimmed, and are hashed with Argon2id. Return a generic login failure for incorrect credentials.

Task database fields add ownerId, indexed with createdAt for per-user retrieval. The API never accepts ownerId, id, timestamps, or completedAt in input. Title is trimmed and 1-120 characters; description is trimmed and 1-2000 characters. Priority is low/medium/high, default medium on creation. All five CreateTaskInput properties are required except priority, whose default is applied on the server; the UI sends all five. A new task is pending with completedAt null.

scheduledAt means "when I plan to do it"; deadlineAt means "the latest it should be finished." Both are required. scheduledAt must be less than or equal to deadlineAt. Past values are allowed for overdue work. PATCH validates the resulting combined task, so changing only one date cannot bypass the invariant. Reject empty patches and unknown fields. Completing sets completedAt on the server; repeating the same completion retains the original value. Reopening clears it.

## HTTP contract

Base path: /api. JSON request/response bodies except a 204 delete response. JSON bodies are limited to 32 KB. POST /auth/register and /auth/login accept only email and password.

| Method | Path | Authentication | Success |
| --- | --- | --- | --- |
| GET | /health | None | 200 {status:"ok", database:"connected"}; 503 if unavailable |
| POST | /auth/register | None | 201 AuthSession |
| POST | /auth/login | None | 200 AuthSession |
| GET | /auth/me | Bearer token | 200 {user: User} |
| GET | /tasks | Bearer token | 200 {tasks: Task[]} |
| POST | /tasks | Bearer token | 201 {task: Task} |
| PATCH | /tasks/:id | Bearer token | 200 {task: Task} |
| DELETE | /tasks/:id | Bearer token | 204 with no body |

GET /tasks returns the signed-in user's tasks, ordered by createdAt descending then id ascending. Filtering and alternate sorting are client-side for the assignment's small dataset. Pagination is outside this version.

Errors use {error: {code: string, message: string, fields?: Record<string,string>}}. Use 400 for invalid input/IDs/JSON, 401 for invalid credentials or missing/invalid/expired tokens, 404 for absent or another user's task, 409 for duplicate email, 413 for an oversized body, 429 for throttling, and a generic 500 for unexpected failures. Do not return stack traces or database details.

Define stable codes VALIDATION_ERROR, INVALID_CREDENTIALS, UNAUTHORIZED, NOT_FOUND, EMAIL_IN_USE, PAYLOAD_TOO_LARGE, RATE_LIMITED, and INTERNAL_ERROR. GET /health uses DATABASE_UNAVAILABLE with the error envelope and status 503 when its database check fails.

## Authentication and ownership

Sign one-hour HS256 JWT access tokens with subject=user id, issuer=focusflow-api, and audience=focusflow-mobile. Verify algorithm, issuer, audience, expiry, and subject before accepting a token. JWT_SECRET is a random server-only secret of at least 32 bytes. JWTs, passwords, and database credentials are never logged or bundled into the app.

Hash passwords with the Argon2id library; do not implement a hash algorithm. Rate-limit auth POST endpoints to 10 attempts per minute per IP, with a generic retry message. Configure Helmet and server-side input validation. Bind every task read, update, and delete to the authenticated ownerId in the database query.

Store the session token using react-native-keychain, not unencrypted AsyncStorage. On startup, read it and validate with /auth/me before showing protected screens. A network failure keeps the stored token and offers retry; a confirmed 401 clears it and returns to login. Logout clears secure storage, user state, and task state. An expired session requires login again. Logout does not revoke an already-issued token server-side before its one-hour expiry; immediate revocation and refresh tokens are deferred.

Prevent stale responses from a previous user/session from updating current auth or task state. Prevent duplicate submits while requests are in flight. Failed save/delete keeps the prior task data and displays a retryable error.

Environment variables on the server: PORT=3000, MONGODB_URI, JWT_SECRET, NODE_ENV. Keep their values local and supply placeholder-only .env.example. The mobile API base URL is configuration, not a secret; only debug builds may use HTTP. Release builds use a reachable HTTPS backend.

## Mobile state and navigation

AuthContext exposes status ('restoring' | 'signedOut' | 'signedIn'), user, error (string | null), signIn(email,password), signUp(email,password), signOut(), and retryRestore(). These async operations return Promise<void> and surface errors to the calling screen. A failed network restoration remains restoring with a visible error/retry control; it must not spin indefinitely. Keep token handling inside the session/API layer.

TasksContext exposes tasks, loading, error, refresh(), create(input), update(id,input), and remove(id). create/update return Promise<Task>; the others return Promise<void>. A session change clears this context and invalidates in-flight requests.

Use React Navigation native stack with Login and Register routes while signed out, and TaskList plus TaskForm routes while signed in. TaskForm takes an optional taskId: absent means create; present means edit an existing task. Task data is read from the task context. No separate task detail screen is necessary: the form shows the full saved description and dates.

## Screens and visual direction

Proposed direction: warm off-white background (#F7F6F2), dark ink text (#172122), mint accent (#B9F3D1), rounded task cards, strong spacing, and a clear "what to do next" dashboard. Use native text fonts initially. Priority always has a text label; completed tasks show a check and text, not color alone.

1. Login/Register: compact brand heading, labeled email/password fields, password visibility toggle, inline errors, disabled/loading submit, and a link to the other auth screen.
2. TaskList: greeting, completed/total count, status filter (All/Pending/Completed), priority filter, sort selector, task cards, and a prominent add button. Each card shows title, schedule, deadline, priority, and status, with complete/reopen and edit actions.
3. TaskForm: title, multiline description, native date/time pickers for schedule and deadline, priority selector, save button, and a confirmed delete action in edit mode.

Use FlatList with stable keys, safe-area spacing, keyboard avoidance, Android back behavior, and loading/empty/error/retry states. Provide accessibility labels, scalable text, and at least 48 dp touch targets. Verify contrast when implementing. A refresh indicator preserves the existing task list.

## Smart sorting

Keep sorting in one pure mobile function with now passed explicitly for deterministic tests:

~~~ts
type SortMode = 'smart' | 'deadline' | 'schedule' | 'priority';
sortTasks(tasks: Task[], mode: SortMode, now: number): Task[];
~~~

Never mutate the input. For smart sorting, place overdue pending tasks first, other pending tasks next, and completed tasks last. "Overdue" means deadlineAt < now. Within each pending bucket, calculate:

~~~text
priorityWeight: low=1/3, medium=2/3, high=1
deadlineUrgency = clamp(1 - (deadlineAt - now) / 72 hours, 0, 1)
scheduleUrgency = clamp(1 - (scheduledAt - now) / 24 hours, 0, 1)
score = 50*priorityWeight + 35*deadlineUrgency + 15*scheduleUrgency
~~~

Higher scores come first. Break score ties by earliest deadlineAt, earliest scheduledAt, earliest createdAt, then id ascending. Completed tasks use completedAt descending then id ascending. Alternative sorts retain pending-before-completed grouping, then use deadline ascending, schedule ascending, or priority high-to-low; ties use the same deadline/schedule/createdAt/id sequence. Completed tasks retain their completedAt ordering in every mode.

Filters select status and priority before sorting. Recompute time-sensitive ranking on screen focus, manual refresh, and a once-per-minute timer while the list is mounted. Clear the timer on unmount. State the ranking weights in the UI's sort explanation so the bonus feature is easy to demonstrate.

## Tests and delivery

Backend: use a disposable MongoDB test instance (mongodb-memory-server), Supertest, and Vitest for health, auth, validation, persistence, and two-user ownership tests. Never run tests against the configured development/hosted database. The first test run may download a MongoDB binary.

Mobile: use the React Native template's Jest setup and React Native Testing Library. Cover session restoration/expiry, failed mutations, stale requests after logout, form date validation, filters, and pure sort logic. Validate actual native dependencies and date pickers on Android; mocked tests cannot prove they build.

Stage 8 adds GitHub Actions for typecheck/lint/tests and a debug APK build, then verifies a release APK on Android without Metro. A Node-capable HTTPS host plus MongoDB Atlas is the proposed evaluation setup; select and configure hosting during delivery with no assumption of a paid plan. Keep credentials in host configuration, signing keys local/secret storage, and APKs in release assets rather than Git.

Provide a README with verified setup commands, API usage, screenshots, a demo, an APK link, and known limits. Confirm access for evaluators because the repository is private. Do not submit the form during planning.

## Reference sources

- [React Native CLI setup](https://reactnative.dev/docs/getting-started-without-a-framework)
- [Windows Android environment](https://reactnative.dev/docs/set-up-your-environment?os=windows&platform=android)
- [Community CLI compatibility](https://github.com/react-native-community/cli#compatibility)
- [React Native storage and network security](https://reactnative.dev/docs/security)
- [Express 5 requirements](https://expressjs.com/en/guide/migrating-5/)
- [Mongoose schemas](https://mongoosejs.com/docs/guide.html)
- [MongoDB getting started](https://www.mongodb.com/docs/get-started/)
