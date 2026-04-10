# PulsePilot Setup And Launch

## What this scaffold gives you

This project is a real Expo Router starter app for:

- iPhone and Android app screens
- web access from the same account
- email/password account creation and sign-in
- saved auth sessions so users stay logged in
- settings for prompts:
  - off
  - in-app only
  - popup notifications

## 1. Create your backend account system

Use Supabase for accounts and saved user data.

### Go here

- https://supabase.com/dashboard

### In Supabase

1. Create a new project.
2. Open `Authentication`.
3. Enable `Email` sign-in.
4. Open `SQL Editor`.
5. Run the SQL from `supabase/schema.sql`.

### Add redirect URLs

Inside Supabase Auth settings, add redirect URLs for:

- `http://localhost:8081`
- `http://localhost:19006`
- your future website URL
- `pulsepilot://`

That allows web sign-in, local testing, and native deep-link returns.

## 2. Add your project keys

Create a `.env` file in the project root by copying `.env.example`.

Add:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## 3. Install dependencies

From the `health-optimizer-app` folder:

```powershell
npm install
```

## 4. Run the app locally

### Phone simulator or Expo dev session

```powershell
npm run start
```

### Open the web version

```powershell
npm run web
```

Or use the cleaned local web command:

```powershell
npm run web:clear
```

This gives you a website version that uses the same account system as the phone app.

## 5. Put it on your phone

### Fastest development path

1. Create an Expo account at https://expo.dev/
2. Install the Expo Go app on your phone.
3. Run `npm run start`.
4. Scan the QR code.

That is best for early testing.

### Real installable app build

Use Expo EAS:

```powershell
npx eas login
npx eas build:configure
npx eas build --platform android
npx eas build --platform ios
```

That creates installable builds for real devices and later app-store release.

## 6. Put it on the web for phone and computer access

Generate the web build:

```powershell
npm run export:web
```

Then deploy the output to a static host such as:

- Vercel
- Netlify

Once deployed, users can sign in at the website from a phone browser or computer browser using the same PulsePilot account.

For the full release path, see `docs/release-and-deploy.md`.

## 7. How saved login works

PulsePilot is set up to keep users signed in with a persisted auth session.

That means:

- deleting the app does not delete their account data,
- signing back in restores their profile and history,
- the app can remember the email on the device,
- the app keeps the user signed in without asking every time.

Important security note:

- the scaffold keeps a saved authenticated session,
- it does not intentionally store the raw password in plain text.

That is the safer standard pattern used by modern apps.

## 8. Prompt behavior already designed into the app

In `Settings`, prompts can be configured to:

- turn off completely,
- show only inside the app,
- show as popup notifications as well.

This is wired for:

- hydration prompts
- weekly strength check-ins

## 9. What still needs to be connected after setup

This scaffold is the product foundation. The next development layer is:

- Supabase tables and real data reads/writes
- Garmin API integration
- MyFitnessPal integration
- FitNotes CSV import flow
- notification scheduling rules
- real recommendation engine

## 10. Recommended next build order

1. Finish Supabase persistence for profile, preferences, and check-ins.
2. Build FitNotes CSV import first.
3. Add Garmin connection.
4. Add nutrition sync from MyFitnessPal.
5. Replace mock coaching logic with real cross-source recommendations.
