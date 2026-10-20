# FocusFlow Android

React Native CLI 20.2.0 / React Native 0.87.0, React 19.2.3, and TypeScript.

See the [root README](../README.md) for backend startup, Android setup, local APK commands, testing, and production configuration. Run npm commands from this directory.

- `npm ci`: install the locked dependencies.
- `npm start`, then `npm run android` in another terminal: Metro development.
- `npm run build:local -- -PreactNativeArchitectures=arm64-v8a,x86_64`: standalone Windows local APK.
- `npm run lint`, `npm run typecheck`, `npm test -- --runInBand`: checks.

On Linux/macOS, build with `./gradlew assembleLocal -PreactNativeArchitectures=arm64-v8a,x86_64` from `android`. The committed CI workflow uses this command on Linux. Android is the assignment target; iOS has not been configured or tested.