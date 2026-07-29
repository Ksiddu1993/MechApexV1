# Fix undefined symbol: operator new(unsigned long) in expo-modules-core

The build is failing because the linker cannot find the `operator new` symbol, which is part of the C++ standard library (`libc++`). This typically happens when the C++ standard library is not correctly linked, which can occur with newer NDK versions (like NDK 27) if the build configuration is slightly off.

## Proposed Changes

### expo-modules-core (Android)

#### [MODIFY] [CMakeLists.txt](file:///C:/Users/pincode Dak/Downloads/MechApex-main/MechApex-main/frontend/node_modules/expo-modules-core/android/CMakeLists.txt)
- Explicitly set the linker language to CXX for the main library.
- Add `c++` to the link libraries of `CommonSettings` to ensure all targets using it link against the C++ standard library.

#### [MODIFY] [fabric/CMakeLists.txt](file:///C:/Users/pincode Dak/Downloads/MechApex-main/MechApex-main/frontend/node_modules/expo-modules-core/android/src/fabric/CMakeLists.txt)
- Explicitly set the linker language to CXX for the fabric static library.

## Verification Plan

### Automated Tests
- Run the failing build task: `./gradlew :expo-modules-core:buildCMakeDebug[arm64-v8a]`
- Verify that the `undefined symbol: operator new(unsigned long)` error is resolved.

### Manual Verification
- Perform a full project sync and build to ensure no regressions.
