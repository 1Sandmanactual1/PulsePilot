# Android Release Path

## What you need

- Google Play Developer account
- Expo account
- EAS enabled for the project
- app icon, feature graphic, screenshots, privacy policy

## 1. Sign in to Expo

```powershell
npx eas login
```

## 2. Configure EAS in this project

```powershell
npx eas build:configure
```

## 3. Set production environment variables

In Expo/EAS, add:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## 4. Build the Android app

```powershell
npx eas build --platform android
```

For faster internal installs, use:

```powershell
npx eas build --platform android --profile preview
```

## 5. Download and test the APK/AAB

After the build completes, Expo gives you a download link.

- Use preview/internal builds for device testing first
- Use production builds for Play Store upload

## 6. Publish to Google Play

Inside Google Play Console:

1. Create the app listing
2. Upload the AAB from the production EAS build
3. Add:
   - app description
   - screenshots
   - icon
   - privacy policy
   - contact info
4. Complete content rating and data safety forms
5. Submit for review

## 7. What still matters before store release

- Garmin/MyFitnessPal live sync is still pending provider approval
- FitNotes import is working, but deeper workout intelligence is still evolving
- production notification setup should be finalized before full launch
