# Implementation Plan - Fix Undefined Symbol `operator new`

Fix the linker error `undefined symbol: operator new(unsigned long)` in `expo-modules-core` by explicitly linking against the C++ standard library (`c++_shared`).

## User Review Required

> [!IMPORTANT]
> This change modifies files within `node_modules`. These changes might be lost if you run `npm install` or `yarn` again unless you use a tool like `patch-package` to persist them.

## Proposed Changes

### expo-modules-core

#### [MODIFY] [CMakeLists.txt](file:///C:/Users/pincode%20Dak/Downloads/MechApex-main/MechApex-main/frontend/node_modules/expo-modules-core/android/CMakeLists.txt)
- Add `c++_shared` to the `target_link_libraries` call for `${PACKAGE_NAME}`.

#### [MODIFY] [CMakeLists.txt](file:///C:/Users/pincode%20Dak/Downloads/MechApex-main/MechApex-main/frontend/node_modules/expo-modules-core/android/src/fabric/CMakeLists.txt)
- Add `c++_shared` to the `target_link_libraries` call for the `fabric` target.

## Verification Plan

### Manual Verification
- Run the failing Gradle task:
  ```bash
  ./gradlew :expo-modules-core:buildCMakeDebug[arm64-v8a]
  ```
- Verify that the linker error `undefined symbol: operator new(unsigned long)` no longer occurs.
