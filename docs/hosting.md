# Hosting excluded from final delivery

On 21 October 2026 the user instructed: **"hosting is not required so skip it conclude the project."** The completed deliverable is the locally tested Android app, Express API, and MongoDB setup documented in the [README](../README.md). No hosted deployment or cloud credentials are needed.

Before this cancellation, the following preparation took place:

- A dedicated **FocusFlow** Atlas project and free **focusflow** cluster were created in AWS Singapore. These remain unused; this closeout does not delete cloud resources.
- The connector's database-user confirmation failed. It created no database user, and this work added no Atlas network access entries or task data.
- No Render service was created.
- A private release signing key was prepared outside Git at `C:\CODE\Android\Signing\FocusFlow`. It remains unused by the final local APK, which uses the development signing key. The private credential template and encrypted signing password also remain outside Git.

The hosting-only timeout and waiting messages were removed, returning the app to the tested local behavior. The earlier request to supply Atlas credentials is cancelled; no connection string needs to be entered or shared.

The standalone local APK bundles JavaScript and needs no Metro server. Authentication and task storage still require the PC's API/MongoDB to be running and reachable. On the standard Android emulator the default API address is `http://10.0.2.2:3000/api`; the app also provides USB and LAN server settings. It does not work away from that local backend without a separately configured reachable server.
