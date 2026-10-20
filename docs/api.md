# FocusFlow API

Base URL for local requests: http://127.0.0.1:3000/api.

Run from server:

~~~powershell
npm ci
npm run dev:local
~~~

The local runner downloads/starts a real MongoDB binary, generates a server-only JWT secret if .env does not exist, and persists records in server/.local/mongodb. It binds MongoDB to loopback. No Docker or Atlas account is needed for this mode. Do not run a second local runner on the same database/port.

For an existing MongoDB deployment, copy server/.env.example to server/.env, set a real MONGODB_URI and random JWT_SECRET, then use npm run dev. For a production process use npm run build followed by npm start.

## Routes

| Method | Path | Body | Successful response |
| --- | --- | --- | --- |
| GET | /health | None | 200: status and database availability |
| POST | /auth/register | email, password | 201: user, accessToken, expiresAt |
| POST | /auth/login | email, password | 200: user, accessToken, expiresAt |
| GET | /auth/me | None | 200: user |
| GET | /tasks | None | 200: tasks array |
| POST | /tasks | title, description, scheduledAt, deadlineAt, priority | 201: task |
| PATCH | /tasks/:id | One or more editable fields; status may be pending/completed | 200: task |
| DELETE | /tasks/:id | None | 204, no body |

All task routes and /auth/me require an Authorization: Bearer accessToken header. Never send database credentials to the app.

## Example flow (PowerShell)

~~~powershell
$baseUrl = 'http://127.0.0.1:3000/api'
$account = @{email='you@example.com'; password='choose-a-long-unique-password'} | ConvertTo-Json
$session = Invoke-RestMethod "$baseUrl/auth/register" -Method Post -ContentType 'application/json' -Body $account
$headers = @{Authorization='Bearer ' + $session.accessToken}
$body = @{
  title='Prepare assignment demo'
  description='Record registration, task creation and smart sorting.'
  scheduledAt='2030-01-01T09:00:00Z'
  deadlineAt='2030-01-01T18:00:00Z'
  priority='high'
} | ConvertTo-Json
$created = Invoke-RestMethod "$baseUrl/tasks" -Method Post -Headers $headers -ContentType 'application/json' -Body $body
Invoke-RestMethod "$baseUrl/tasks" -Headers $headers
Invoke-RestMethod "$baseUrl/tasks/$($created.task.id)" -Method Patch -Headers $headers -ContentType 'application/json' -Body '{"status":"completed"}'
Invoke-RestMethod "$baseUrl/tasks/$($created.task.id)" -Method Delete -Headers $headers
~~~

Avoid printing or committing the resulting access token.

## Validation and errors

Emails are normalized and unique. Passwords are 10–128 characters; spaces are significant. Titles are 1–120 characters and descriptions 1–2000, after trimming. Both timestamps must be valid ISO date-times with an offset/Z; the schedule cannot follow the deadline. Past/equal dates are supported. Priority defaults to medium.

PATCH checks the combined saved/new dates. Input cannot set ownership, IDs or server timestamps. Concurrent edits use optimistic concurrency; a conflicting edit returns 409 CONFLICT with a refresh instruction.

Errors use the following shape:

~~~json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Check your details and try again.",
    "fields": {"title": "Add a title."}
  }
}
~~~

Status codes: 400 invalid input/JSON/ID; 401 incorrect credentials or invalid session; 404 absent/other-user task; 409 duplicate account/concurrent task edit; 413 body over 32 KB; 429 auth throttling; 500 unexpected failure; 503 unavailable database on /health.

Each app instance limits authentication POSTs to 10 per minute per IP. Tokens expire after one hour. Logout deletes the local credential; a copied token remains valid until expiry. Password recovery/email verification/refresh tokens are outside this assignment's scope.

## Deployment

Use the included Dockerfile or a Node.js 24 host, expose port 3000 through HTTPS, and configure MONGODB_URI, JWT_SECRET, NODE_ENV=production, and PORT. Set TRUST_PROXY=1 only behind a trusted single reverse proxy. Use an authenticated MongoDB deployment with network access limited to the backend.

The root compose.yaml is an optional local container setup. With Docker Desktop running, use docker compose --env-file server/.env up --build after the local runner has generated its secret; stop the local runner first so ports are free. MongoDB stays bound to 127.0.0.1 on the host. Compose preserves its named database volume.

Cloud provisioning is deferred by the user's local-first choice. No live hosted URL or paid resource has been created.
