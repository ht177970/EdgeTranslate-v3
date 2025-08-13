# Fastlane

## Prerequisites
- gem install fastlane
- Xcode logged-in Apple ID
- Environment variables:
  - FASTLANE_APPLE_ID / APPLE_ID
  - FASTLANE_APP_IDENTIFIER (default: com.meapri.EdgeTranslate)
  - FASTLANE_TEAM_ID / FASTLANE_ITC_TEAM_ID

## Release
```
cd packages/EdgeTranslate
fastlane mac release
```
This will:
1) Build Safari target and rsync resources
2) Archive & export with ExportOptions.plist
3) Upload .pkg to App Store Connect (metadata/screenshots skipped)


