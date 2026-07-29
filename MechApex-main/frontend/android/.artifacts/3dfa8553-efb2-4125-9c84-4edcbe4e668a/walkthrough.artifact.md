# Walkthrough - Fix undefined symbol: operator new(unsigned long)

I have resolved the C++ linker error in `expo-modules-core` by ensuring the C++ standard library is correctly linked.

## Changes Made

### expo-modules-core (Android)

#### [CMakeLists.txt](file:///C:/Users/pincode Dak/Downloads/MechApex-main/MechApex-main/frontend/node_modules/expo-modules-core/android/CMakeLists.txt)
- Added `set_target_properties(${PACKAGE_NAME} PROPERTIES LINKER_LANGUAGE CXX)` to explicitly tell CMake to use the C++ linker.
- Added `c++` to `target_link_libraries` to ensure the NDK's C++ standard library is linked.

#### [fabric/CMakeLists.txt](file:///C:/Users/pincode Dak/Downloads/MechApex-main/MechApex-main/frontend/node_modules/expo-modules-core/android/src/fabric/CMakeLists.txt)
- Added `set_target_properties(fabric PROPERTIES LINKER_LANGUAGE CXX)` to ensure correct linkage for the Fabric static library.

## Verification Results

### Automated Tests
- Ran `./gradlew :expo-modules-core:buildCMakeDebug[arm64-v8a]` successfully.
- The build no longer fails with the `undefined symbol: operator new(unsigned long)` error.

> [!TIP]
> This issue often occurs when using newer NDK versions (like NDK 27) with CMake configurations that don't explicitly specify the C++ runtime linkage for all shared or static libraries.
