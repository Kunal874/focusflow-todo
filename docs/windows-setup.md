# Windows Android setup

This guide records the Android tool installation and the remaining starter-app work in Stage 1.

## Initial assessment on 21 October 2026

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

Nothing was installed during the original planning pass. The user subsequently requested installation under C:\CODE.

## Installation locations

| Tool / data | Location |
| --- | --- |
| Microsoft OpenJDK 17 | C:\CODE\Java\jdk-17 |
| Android Studio | C:\CODE\AndroidStudio |
| Android SDK | C:\CODE\Android\Sdk |
| Android SDK command-line tools | C:\CODE\Android\Sdk\cmdline-tools\latest |
| Android user configuration | C:\CODE\Android\.android |
| Android virtual devices | C:\CODE\Android\avd |

Java and Android Studio use the vendors' official ZIP distributions. Their SHA-256 checksums were checked before extraction; the Android Studio launcher also has a valid Authenticode signature. A per-user Android Studio Start menu shortcut points to C:\CODE\AndroidStudio\bin\studio64.exe.

C:\CODE originally allowed normal processes read-only access. An administrator-approved helper created only the new Java, AndroidStudio, and Android subfolders and granted the current user Modify access to those new folders. Existing tool folders and the parent folder's permissions were left as they were.

User environment variables JAVA_HOME, ANDROID_HOME, ANDROID_USER_HOME, and ANDROID_AVD_HOME point to the locations above. The user PATH adds the Java bin, SDK platform-tools, command-line tools bin, and emulator directories while preserving existing entries. Open a new terminal after installation; restart an already-running editor/Codex if its terminals still inherit old variables.

Android Studio runs on its bundled JetBrains runtime. Command-line app builds use the separately configured JDK 17.

## Verified installation

| Component | Installed version |
| --- | --- |
| Microsoft OpenJDK / javac | 17.0.20.1 |
| Android Studio ZIP release | 2026.2.1.8 |
| SDK command-line tools | 22.0 |
| SDK platforms | Android API 36 and API 37.0 |
| SDK build-tools | 36.0.0 and 37.0.0 |
| SDK platform-tools / ADB distribution | 37.0.1 |
| Android NDK | 27.1.12297006 (r27b) |
| CMake | 3.22.1 |
| Android Emulator | 37.2.12 |
| System image | Android API 36, Google APIs, x86_64, revision 7 |

The inspected React Native 0.87/0.88 template archives specify compile SDK 37, build-tools 37.0.0, target SDK 36, and NDK 27.1.12297006. The matching platform is published as the SDK package platforms;android-37.0. The final CLI/template pair still needs to be selected and tested when the app is generated.

Created FocusFlow_API36 using the Pixel 7 profile, with 2 GB RAM and four emulator CPU cores. Its files are under C:\CODE\Android\avd. Windows Hypervisor Platform (WHPX) passed the emulator's acceleration check. A headless cold boot was verified with ADB: the device was online, sys.boot_completed returned 1, and Android reported version 16 / API level 36. The test emulator was then shut down.

The device manager emitted a missing per-image devices.xml profile diagnostic; its built-in Pixel 7 profile was available and the resulting virtual device booted successfully. No vendor SDK files were modified to suppress the diagnostic.

The starter app has not been generated, so React Native/Gradle compilation remains unverified. This completes the native-tool installation portion of Stage 1.

## 1. Prepare the native tools

1. Install or locate JDK 17, the version recommended by the checked [React Native Windows guide](https://reactnative.dev/docs/set-up-your-environment?os=windows&platform=android). Check the chosen React Native template before finalizing Java/Gradle compatibility.
2. Install [Android Studio](https://developer.android.com/studio).
3. In Android Studio's SDK Manager, install platform-tools, command-line tools, and the emulator.
4. Once a React Native version is selected, install the SDK platform, build-tools, and any NDK/CMake versions specified by that template. The generated Gradle files determine the exact versions; do not rely on a generic tutorial's SDK number.
5. Create an Android Virtual Device, or connect an Android phone with USB debugging enabled and approve its device authorization prompt.
6. Set JAVA_HOME to the actual JDK directory. Set ANDROID_HOME to the actual SDK directory shown by Android Studio.
7. Add the JDK bin, Android SDK platform-tools, and emulator directories to the user PATH if absent. Open a new terminal afterward.

This machine's configured SDK location is C:\CODE\Android\Sdk.

## 2. Verify the tools

Run these in a new PowerShell terminal:

~~~powershell
node --version
npm --version
java -version
javac -version
Get-Command java
$env:JAVA_HOME
$env:ANDROID_HOME
adb version
adb devices
emulator -accel-check
emulator -list-avds
~~~

Success means Java reports the selected JDK, the SDK path exists, the acceleration check succeeds, and FocusFlow_API36 appears in the virtual-device list. adb devices lists an online device only while a phone is connected or an emulator is running. A listed "unauthorized" phone is not ready.

Start the configured virtual device with emulator -avd FocusFlow_API36, or use Android Studio's Device Manager. The setup smoke test used a hidden window and software rendering; the normal launch opens the emulator window.

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

- [x] Java and SDK locations verified.
- [x] One emulator or authorized phone available.
- [ ] Verified compatible React Native CLI/template pair recorded.
- [ ] TypeScript React Native starter generated in mobile.
- [ ] Starter installs and opens on Android.
- [ ] Template checks pass.
- [ ] Setup commands and versions committed and pushed.
