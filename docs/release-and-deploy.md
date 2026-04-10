# Release And Deploy

## Goal

This is the path to make PulsePilot accessible:

- by website on computer and phone browser
- by installable app on Android
- by installable app on iPhone

## 1. Website Deployment

PulsePilot already exports a static web build.

### Build locally

```powershell
npm run export:web
```

That creates the deployable website in `dist/`.

### Deploy to Vercel

1. Push this project to GitHub.
2. Create a Vercel account.
3. Import the GitHub repo.
4. Set the build command to:

```text
npm run export:web
```

5. Set the output directory to:

```text
dist
```

6. Add environment variables:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

`vercel.json` is already included.

Recommended:

- keep the repo on GitHub,
- let Vercel auto-deploy from `main`,
- use the included GitHub Actions workflow to catch build issues before deploys.

### Deploy to Netlify

1. Push this project to GitHub.
2. Create a Netlify site from the repo.
3. Add the same environment variables.

`netlify.toml` is already included.

## 2. Make Supabase Auth Work On The Real Website

In Supabase:

1. Go to `Authentication`.
2. Open URL or redirect settings.
3. Add your deployed web URL.

Example:

- `https://pulsepilot.vercel.app`

Keep these too:

- `http://localhost:8081`
- `http://localhost:8082`
- `pulsepilot://`

## 3. Android And iPhone App Builds

PulsePilot uses Expo/EAS for device builds.

### Sign in to Expo

```powershell
npx eas login
```

### Configure builds

```powershell
npx eas build:configure
```

### Android build

```powershell
npx eas build --platform android
```

This produces an Android install package you can download and install.

For the full Android path, see `docs/android-release.md`.

### iPhone build

```powershell
npx eas build --platform ios
```

This requires Apple developer setup for full install/TestFlight release.

## 4. Required Store/Release Work Still Remaining

Before public release, PulsePilot still needs:

- app icons and splash assets
- privacy policy and terms
- production Supabase auth URL setup
- production notification credentials
- real Garmin integration
- real MyFitnessPal integration
- deeper FitNotes import parsing and recommendation logic

## 5. What Is Already Good Enough To Deploy

Right now you can already:

- deploy the website,
- let users create accounts and sign in,
- persist profile/settings/check-ins,
- import FitNotes CSV on web,
- test the product flow end-to-end.

## 6. Recommended Immediate Path

1. Deploy the website first.
2. Keep iterating on data sync and recommendations.
3. Then create Android and iPhone builds from the same codebase.
