# Android verification report

Tested on 21 October 2026 (Asia/Kolkata) using the dedicated FocusFlow_API36 Pixel 7 emulator: Android 16 / API 36, x86_64, WHPX. The installed package is com.focusflow.local, version 1.0.0-local. The standalone APK bundles JavaScript and ran without Metro against the persistent local Express/MongoDB backend.

Application source: commit 1c6a6e1 (includes the small-screen/touch-target and activity-restoration fixes). The local artifact SHA-256 is:

```text
ea5b0fc7b71a29c0e0703e5d5aae4a733c76cb7f5ed30f6f2b415266714d5659
```

## Native walkthrough

| Check | Observed result |
| --- | --- |
| Install and launch | adb install -r succeeds; launcher opens the standalone app |
| Registration | Native email/password/confirmation form creates an account and enters its empty workspace |
| Invalid forms and login | Required fields show errors; incorrect credentials show the API message; registered credentials log in |
| Task fields | Title, description, scheduled time, deadline and high/medium/low priority save to MongoDB |
| Date/time picker | Native calendar and time entry work; a 9:30 AM India selection persists as 04:00 UTC |
| Date validation | A deadline before the selected schedule is rejected; corrected dates save |
| Edit | Changed title appears in the list and in the saved API record |
| Completion/reopening | Checkbox updates persisted status; Completed filter and empty result state respond correctly |
| Delete | Cancel keeps the task; confirmed deletion removes it; removal survives app restart |
| Filters and sorts | Status and priority filters work; smart, deadline, schedule and priority modes can be selected |
| Secure session restoration | Force-stop/relaunch restores the signed-in workspace and task statuses |
| Logout | After sign-out completes, force-stop/relaunch stays signed out |
| Account isolation | A second native account starts empty; its real token receives 404 for PATCH and DELETE of the first account's task |
| Offline recovery | Stopped backend causes a reconnect/retry screen; restarting the backend and tapping retry restores the saved session and task without credentials |
| Rejected session | Removing only the synthetic test account causes a real 401 on restoration; the native credential is cleared and sign-in is requested |
| Small screen and enlarged text | Checked 320 dp width / 640 dp height with font scale 1.3; forms and sheets scroll to their actions |
| Labels and targets | Inspected Android accessibility labels/roles; enlarged status tabs and task-opening controls to at least 48 dp |
| Activity recreation | Repeated font-scale/display-size changes return to the task list without manual relaunch and produce zero new fatal exceptions |

Cryptographic expiry itself is covered by backend tests; the native 401 path used a revoked synthetic account rather than waiting one hour. TalkBack speech, physical-device ARM execution, iOS, and hosted production networking were not tested. arm64-v8a and x86_64 libraries are included in the APK; runtime testing used x86_64.

## Defects found and corrected

At 320 dp with enlarged text, the authentication illustration overlapped the heading. It now hides when width/text scaling leaves insufficient space. Status tabs and the task-opening target were also increased to 48 dp.

Android activity recreation exposed a react-native-screens fragment-restoration crash. MainActivity now installs the library's documented RNScreensFragmentFactory before super.onCreate. The original failure appeared in AndroidRuntime logs; the repeated font/display change regression after the fix produced zero new fatal exceptions and restored the task list.

The automation initially had assertion-text/time-zone mismatches and one harness timeout; these were corrected and the affected checks rerun. They were not counted as product defects. Restart testing waits for an action to finish before killing the process.

## Automated and build evidence

- Mobile: 27 tests, lint and TypeScript checks pass.
- Backend: 17 integration/regression tests, lint, TypeScript and production JavaScript build pass; live localhost smoke verifies authentication, CRUD/status and two-user isolation.
- Windows: final two-architecture standalone local APK builds successfully; APK v2 signature, embedded JavaScript and both native ABI directories verify.
- [Final application-source CI run 39553307858](https://github.com/Kunal874/focusflow-todo/actions/runs/39553307858) passes both package jobs and the Android build/artifact upload. Its source is commit 1c6a6e1; later delivery-documentation changes do not modify application code.

## Artifacts

- [Screenshots and gallery](screenshots/README.md)
- Local APK: artifacts/FocusFlow-local.apk; checksum: artifacts/FocusFlow-local.apk.sha256.
- Demo: artifacts/FocusFlow-demo.mp4, a complete 54.23-second MP4 captured from the final APK.
- Screenshots ZIP: artifacts/FocusFlow-screenshots.zip.
- These binary artifacts are kept outside Git and distributed as GitHub release assets. Source and screenshots are committed in the repository. Public submission publication was authorized after local verification.

Only synthetic example.test accounts were used. No tokens or passwords are included in screenshots, source, or the demo. The emulator is left on the final task list; the local backend remains running. Hosting was explicitly excluded by the user's final local-only delivery choice.

## Project closeout

The hosting-only timeout and wait-message changes were removed when hosting was cancelled. The final `mobile/src`, `mobile/android`, and `server/src` trees match application commit `1c6a6e1`, which produced the APK and native evidence above. The final local package checks pass again: 27 mobile tests, 17 backend tests, lint and TypeScript for both packages, and the backend build. The delivery APK's checksum and v2 signature were reverified, and the running local health endpoint reports `status: ok`, `database: connected`.
