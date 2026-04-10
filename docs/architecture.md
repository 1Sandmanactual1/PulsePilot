# Architecture And Product Spec

## 1. Product Summary

This app acts as an intelligent health and training coordinator. It combines:

- wearable recovery and vitals data,
- food and calorie tracking,
- body-weight trend data,
- lifting history and weekly split analysis,
- goal-aware coaching.

The core difference from Garmin Connect is not just tracking. The app interprets the data and turns it into suggestions that are specific to the user's goal and current behavior.

## Source Of Truth Direction

PulsePilot should be designed as the primary hub for the user.

That means:

- the user can update profile, weight, goals, prompts, and coaching settings inside PulsePilot,
- PulsePilot pulls in updates made directly in other connected apps,
- when provider capabilities allow it, PulsePilot should also push matching updates back out to those connected apps.

Desired sync behavior:

- Garmin updates PulsePilot when Garmin data changes,
- MyFitnessPal updates PulsePilot when food, calories, or body metrics change there,
- FitNotes updates PulsePilot through imports or future sync helpers,
- PulsePilot updates connected apps when the user changes shared fields like body weight or other compatible profile data.

Important provider limitation:

- Garmin Connect and MyFitnessPal do not necessarily allow every field to be written back by third-party apps,
- Garmin documents that third-party connections can sync with Garmin Connect but Garmin Connect will not pass data received from one third-party app on to another,
- MyFitnessPal partner sync behavior depends on which partner capabilities are available.

So the product model should be:

- PulsePilot is the hub and preferred editing surface,
- inbound sync is expected where providers support it,
- outbound sync is enabled per-provider, per-data-type where allowed.

## 2. Core User Jobs

The user should be able to:

- connect Garmin, MyFitnessPal, and FitNotes data sources,
- view daily readiness, sleep, stress, heart rate, steps, calories, hydration, and training load,
- see body-weight and calorie trends over time,
- inspect workout history across days and weeks,
- understand what each exercise targets and why it is in the plan,
- receive workout restructuring suggestions,
- receive meal suggestions that support a selected goal,
- receive hydration prompts and follow-up reminders,
- answer start-of-week and end-of-week strength check-ins.

## 3. Integration Reality

### Garmin

Use Garmin's developer ecosystem to access Garmin Connect-linked wellness and activity data. This is the primary source for heart rate, sleep, stress, body battery, respiration, pulse ox, steps, calories burned, and workout summaries.

### MyFitnessPal

Use MyFitnessPal partner API access for profile data, current weight, weight history, calorie diary, food diary, macro totals, and goal-related nutrition inputs.

### FitNotes

FitNotes should be treated as import-first:

- import workout CSV exports,
- import exercise catalog exports,
- optionally support periodic re-import from files,
- optionally add Android-side helpers later for smoother sync.

That still supports:

- exercises done by day of week,
- sets,
- reps,
- load,
- weekly volume,
- progression and regression detection,
- split overlap analysis,
- exercise replacement logic.

## 4. Main App Modules

### A. Connection Hub

Connect Garmin, MyFitnessPal, and FitNotes. Show sync health and last refresh, clearly label live sync versus import-based connections, and indicate which fields are read-only versus read/write for each provider.

### B. Recovery Dashboard

Mirror Garmin-style daily vitals, calculate a readiness score, and explain what is helping or hurting recovery.

### C. Goal Engine

Supported goals:

- strength
- muscle building
- endurance
- flexibility
- weight loss
- BMI/body-composition improvement
- maintenance
- general health

The goal engine changes calorie targets, macro emphasis, hydration targets, recovery thresholds, and workout progression rules.

### D. Workout Intelligence Engine

Read FitNotes history, identify split structure and exercise patterns, evaluate whether exercises belong on a different day, and suggest swaps, removals, progression, deloads, and replacements.

Key analyses:

- category clustering by day
- muscle overlap score by week
- push/pull/legs balance
- movement pattern balance
- weekly set volume by muscle group
- progression trend over 1, 3, 6, and 12 weeks
- fatigue flags based on poor recovery plus hard sessions

### E. Exercise Knowledge Layer

For each exercise:

- exercise name
- category
- movement pattern
- primary muscles
- secondary muscles
- stabilization muscles
- compound or isolation
- fatigue level
- substitutes

This is what enables likeness scoring and smarter replacements.

### F. Nutrition Planner

Turn the current goal and actual food diary behavior into daily and weekly meal suggestions, including how much of specific foods to eat.

Profile sync expectation:

- if the user updates current weight in PulsePilot, PulsePilot should attempt to write that same weight to connected providers that support outbound weight updates,
- if the user updates weight in MyFitnessPal or another connected source, PulsePilot should pull the newest value back in and reflect it as the latest synced value.

### G. Hydration Coach

At the user-selected reminder time:

1. Ask whether water has been consumed today.
2. If no:
   - show target amount,
   - show remaining amount,
   - suggest a start and finish window,
   - schedule follow-up 4 hours later.
3. If yes:
   - ask how much,
   - compare against expected progress by current time,
   - if below pace, recommend catch-up window and reprompt,
   - if on pace or above pace, show remaining amount and final completion target.

### H. Weekly Strength Check-In

At the start and end of each week, the app should ask:

- getting stronger,
- staying the same,
- getting weaker.

This response becomes a coaching input alongside Garmin recovery, FitNotes performance trends, and nutrition adherence.

Examples:

- If the user reports getting weaker and recovery is poor, reduce fatigue, lower volume, or suggest a deload.
- If the user reports staying the same while recovery is good, increase load, tighten exercise selection, or improve progression targets.
- If the user reports getting stronger, preserve the plan unless overlap, fatigue, or goal mismatch suggests a refinement.

The app should always explain whether a change was driven by:

- subjective weekly check-in,
- workout progression data,
- recovery data,
- nutrition compliance,
- or a combination of the above.

## 5. Suggested User Experience

Primary tabs:

- Today
- Training
- Nutrition
- Insights
- Check-Ins
- Settings

## 6. Recommendation Engine Rules

Start rule-based for safety and explainability.

Examples:

- do not recommend load increases after repeated regression plus poor sleep,
- do not cluster two high-fatigue lower-body hinge days too closely,
- preserve compound lifts during fat-loss phases,
- suggest deload when performance drops and recovery markers decline together.

Every recommendation should explain:

- what changed,
- why,
- what data was used,
- what outcome is expected.

## 6A. Sync Governance Rules

Because PulsePilot is the intended hub, each synced field should have:

- a source-of-truth policy,
- a provider capability map,
- conflict resolution rules.

Examples:

- Body weight:
  - preferred edit surface: PulsePilot
  - pull from MyFitnessPal or other providers when changed externally
  - push to supported providers when changed in PulsePilot
- Garmin Body Battery:
  - Garmin-only authoritative field
  - read into PulsePilot
  - never write back from PulsePilot
- FitNotes workout history:
  - import into PulsePilot first
  - PulsePilot may propose workout changes
  - write-back depends on future provider tooling, otherwise export/share workflow

## 7. MVP Build Plan

### Phase 1

- mobile-first app shell
- Garmin connection
- MyFitnessPal connection
- FitNotes CSV import
- daily dashboard
- hydration coach
- simple goal engine
- basic workout suggestions

### Phase 2

- richer exercise knowledge graph
- weekly split optimizer
- food-prep planner
- push notifications
- trend explanations

### Phase 3

- smarter personalization
- shopping list
- automated FitNotes ingestion helpers

## 8. Tech Stack Recommendation

- React Native with Expo for iOS and Android
- Node.js with TypeScript backend
- PostgreSQL
- background jobs for sync and recommendation refresh

## 9. Risk Notes

- Garmin and MyFitnessPal integrations may require approval, partner onboarding, or compliance review.
- FitNotes is best treated as import-first unless a more direct integration path is validated later.
- Nutrition, hydration, and exercise suggestions should be framed as wellness guidance, not medical diagnosis.
