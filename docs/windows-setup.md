# Windows Android setup

This is the next build stage. These notes do not mean the Android toolchain is installed.

## Findings on 21 October 2026

| Tool | Finding |
| --- | --- |
| Git | Available |
| GitHub CLI | Available and authenticated as Kunal874 |
| Node.js | v24.18.0 |
| npm | 11.16.0 |
| Java | Not found on PATH; JAVA_HOME unset |
| ADB | Not found on PATH |
| Android SDK | ANDROID_HOME/ANDROID_SDK_ROOT unset; default SDK directory absent |
| Android Studio | Not found in the checked default installation location |
| Windows Package Manager | winget available |

Java/Android tools may exist elsewhere; check any custom installation before installing another copy. Nothing was installed or changed in the machine environment during planning.

## 1. Prepare the native tools

1. Install or locate JDK 17, the version recommended by the checked [React Native Windows guide](https://reactnative.dev/docs/set-up-your-environment?os=windows&platform=android). Check the chosen React Native template before finalizing Java/Gradle compatibility.
2. Install [Android Studio](https://developer.android.com/studio).
3. In Android Studio's SDK Manager, install platform-tools, command-line tools, and the emulator.
4. Once a React Native version is selected, install the SDK platform, build-tools, and any NDK/CMake versions specified by that template. The generated Gradle files determine the exact versions; do not rely on a generic tutorial's SDK number.
5. Create an Android Virtual Device, or connect an Android phone with USB debugging enabled and approve its device authorization prompt.
6. Set JAVA_HOME to the actual JDK directory. Set ANDROID_HOME to the actual SDK directory shown by Android Studio.
7. Add the JDK bin, Android SDK platform-tools, and emulator directories to the user PATH if absent. Open a new terminal afterward.

Typical SDK location: C:\Users\Kunal\AppData\Local\Android\Sdk. Use the actual installed location if different.

## 2. Verify the tools

Run these in a new PowerShell terminal:

~~~powershell
node --version
npm --version
java -version
Get-Command java
$env:JAVA_HOME
$env:ANDROID_HOME
adb version
adb devices
~~~

Success means Java reports the selected JDK, the SDK path exists, and adb devices lists an authorized device/emulator with state "device". A listed "unauthorized" phone is not ready.

## 3. Generate the starter during Stage 1

Before running init, check the [CLI compatibility table](https://github.com/react-native-community/cli#compatibility) and the selected React Native release's requirements. Pin a verified compatible CLI/template pair in the command, record the actual command in the README, and retain the generated React/Gradle dependency versions.

The official [Community CLI guide](https://reactnative.dev/docs/getting-started-without-a-framework) uses the following command shape:

~~~powershell
npx @react-native-community/cli@latest init FocusFlow --directory mobile
~~~

This is a reference command, not something run during planning. Resolve and pin compatible versions at execution; if the selected CLI's directory option has changed, check its init help before generation. Keep the existing root Git repository; do not introduce a nested mobile/.git.

From mobile, run the template's npm start in one terminal and npm run android in another. Use its generated lint/test commands and add a typecheck script. A passing JavaScript test alone does not prove that Android builds.

## 4. Connect the API during integration

| Device | Development API base URL | Setup |
| --- | --- | --- |
| Standard Android emulator | http://10.0.2.2:3000/api | API runs on this PC |
| USB-connected Android phone | http://localhost:3000/api | Run adb reverse tcp:3000 tcp:3000 |
| Release/evaluator device | A reachable https://.../api endpoint | Deploy and configure during Stage 8 |

The Android debug manifest may allow HTTP for local development. The release configuration must use HTTPS. The API base URL is public configuration; MongoDB credentials and JWT secrets belong exclusively on the server.

MongoDB options for Stage 2 are an existing local MongoDB instance or an Atlas deployment. Choose whichever is already available; otherwise use Atlas for the proposed hosted evaluation setup. No cloud resource or paid plan has been created.

## Stage 1 exit checklist

- [ ] Java and SDK locations verified.
- [ ] One emulator or authorized phone available.
- [ ] Verified compatible React Native CLI/template pair recorded.
- [ ] TypeScript React Native starter generated in mobile.
- [ ] Starter installs and opens on Android.
- [ ] Template checks pass.
- [ ] Setup commands and versions committed and pushed.
