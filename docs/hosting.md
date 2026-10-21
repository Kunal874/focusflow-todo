# Hosted interviewer APK

The user approved free resources in Render's **2Kunal's workspace** and Atlas's **2Kunal's Org - 2026-10-21** on 21 October 2026. The existing local APK still needs the developer PC; a hosted APK has not been built or verified yet.

## Current state

- Atlas project **FocusFlow** and free cluster **focusflow** exist in AWS Singapore. The cluster reports `IDLE` (ready).
- No Atlas database users or network access entries have been added by this deployment.
- The Atlas connector rejected its database-user confirmation, including after explicit user approval. Repeated creation attempts did not create a user.
- No Render service has been created yet; no paid resources are authorized.
- A private release signing key is prepared outside Git under `C:\CODE\Android\Signing\FocusFlow`. Its encrypted password file uses Windows DPAPI for the current Windows account. Preserve the key and recovery credentials securely before changing machines or Windows accounts.
- The API client permits up to 90 seconds for a request. Sign-in/session loading explains the first connection may take about a minute. The cold-start regression, mobile lint, TypeScript, and all 28 mobile tests pass. This change is not in the existing local APK.

## Atlas credential handoff

The website is needed because the connector's confirmation did not complete:

1. Select the **FocusFlow** project in Atlas, then open **Database Access** and add a password-authenticated user named `focusflow-api`. Use Atlas's password generator and save the password privately.
2. Under specific privileges, assign `readWrite` on database `focusflow`, leaving the collection unspecified. Restrict access to cluster `focusflow`. Do not select an all-databases role. See [Atlas database-user configuration](https://www.mongodb.com/docs/atlas/security-add-mongodb-users/).
3. On the cluster, select **Connect → Drivers → Node.js**. Copy the driver URI and substitute the username/password. Set the database path to `/focusflow`; keep the Atlas driver options, with authentication against `admin`. Percent-encode reserved characters in the password. See [Atlas driver connection instructions](https://www.mongodb.com/docs/atlas/driver-connection/).
4. Save the complete URI after `MONGODB_URI=` in the prepared private file `C:\CODE\Android\Signing\FocusFlow\cloud.env`. Keep it on one line. Do not put it in chat, Git, screenshots, or the mobile bundle.

The private directory allows the current Windows user, SYSTEM, and Administrators. The file starts as an empty template. Database network access will be limited to the deployed Render service's outbound ranges when those are known.

## Remaining deployment steps

1. Validate the saved URI without printing its credentials, and confirm the user's database/cluster scope.
2. Generate a separate cryptographic JWT secret and create one Render **free Docker web service**, in Singapore, using branch `feat/focusflow-app`, Docker context `server`, and Dockerfile `server/Dockerfile`. Keep automatic deploys off while delivering this assignment.
3. Supply `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV=production`, and `TRUST_PROXY=1` through Render's secret environment settings. The server honors Render's `PORT` and binds to `0.0.0.0`. Set `/api/health` as the health-check path.
4. Obtain the service's actual outbound CIDRs and add those to the Atlas access list. Wait for a live deployment and verify HTTPS health, registration/login, CRUD/status, date validation, and two-user isolation using synthetic accounts.
5. Build the release APK with the verified HTTPS `/api` URL and the private signing key. Include arm64-v8a and x86_64. Verify the APK signature and embedded configuration, then install/test the hosted package with the local API stopped.
6. Record the actual service URL, deployment/commit, release artifact checksum, and hosted test evidence. Update the private release and interviewer instructions. Do not merge, change repository visibility, or submit the assignment form without the user's instruction.

Render's free service can sleep after inactivity; the first request can take about a minute. See [Render free-service limits](https://render.com/docs/free). Hosted operation needs an internet connection. The local APK remains a separate option for development on the PC.
