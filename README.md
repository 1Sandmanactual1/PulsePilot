# Health Optimizer App

This concept app is designed around your requirements:

- Sync Garmin Fenix 7 Sapphire Solar data through Garmin services
- Sync nutrition, weight, and food logs from MyFitnessPal
- Ingest workout history and exercise structure from FitNotes
- Understand training goals such as strength, hypertrophy, endurance, flexibility, and fat loss
- Suggest workout changes, meal prep ideas, recovery actions, and hydration timing

## What's in this folder

- `app/` - real Expo Router mobile + web app scaffold
- `src/` - shared app state, components, theme, and starter coaching logic
- `supabase/schema.sql` - account and data tables
- `setup-pulsepilot.ps1` - quick local setup helper for `.env` and schema copy
- `docs/setup-and-launch.md` - what to do next to run the app on phone and web
- `prototype/` - original clickable mockup
- `docs/architecture.md` - technical design, integration strategy, and roadmap

## How to use

For the design mockup, open `prototype/index.html` in a browser.

For the real app scaffold, follow `docs/setup-and-launch.md`.

## Product direction

The app is intentionally designed as a coach layer on top of:

- Garmin for wearable and recovery metrics
- MyFitnessPal for nutrition and body-weight history
- FitNotes for gym programming and progression analysis

## Important integration note

The design assumes:

- Garmin integration via Garmin developer programs and Garmin Connect-linked data access
- MyFitnessPal integration via partner API access
- FitNotes ingestion through export/import workflows first, then deeper mobile automation later if needed

That split is documented in `docs/architecture.md` so the build plan stays realistic.
