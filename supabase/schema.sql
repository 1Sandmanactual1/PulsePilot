create extension if not exists "pgcrypto";

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  age integer,
  current_weight_lb numeric(6,2),
  goal text not null default 'strength',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  remember_email boolean not null default true,
  stay_signed_in boolean not null default true,
  hydration_enabled boolean not null default true,
  hydration_mode text not null default 'push',
  hydration_reminder_time text not null default '13:00',
  hydration_target_oz integer not null default 96,
  weekly_checkins_enabled boolean not null default true,
  weekly_checkins_mode text not null default 'in-app',
  weekly_checkins_start_day text not null default 'Monday',
  weekly_checkins_end_day text not null default 'Sunday',
  updated_at timestamptz not null default now()
);

create table if not exists public.weekly_check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_of date not null,
  phase text not null check (phase in ('start', 'end')),
  feeling text not null check (feeling in ('stronger', 'same', 'weaker')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.garmin_daily_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  metric_date date not null,
  sleep_hours numeric(4,2),
  resting_heart_rate integer,
  body_battery integer,
  stress_level text,
  pulse_ox integer,
  calories_burned integer,
  steps integer,
  created_at timestamptz not null default now()
);

create table if not exists public.nutrition_daily_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  snapshot_date date not null,
  calories_target integer,
  calories_consumed integer,
  protein_grams integer,
  carbs_grams integer,
  fat_grams integer,
  water_oz integer,
  created_at timestamptz not null default now()
);

create table if not exists public.fitnotes_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_filename text,
  imported_at timestamptz not null default now(),
  row_count integer not null default 0
);

alter table public.user_profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.weekly_check_ins enable row level security;
alter table public.garmin_daily_metrics enable row level security;
alter table public.nutrition_daily_snapshots enable row level security;
alter table public.fitnotes_imports enable row level security;

create policy "users can view own profile"
on public.user_profiles
for select
using (auth.uid() = id);

create policy "users can insert own profile"
on public.user_profiles
for insert
with check (auth.uid() = id);

create policy "users can update own profile"
on public.user_profiles
for update
using (auth.uid() = id);

create policy "users can manage own preferences"
on public.user_preferences
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users can manage own weekly check-ins"
on public.weekly_check_ins
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users can manage own garmin metrics"
on public.garmin_daily_metrics
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users can manage own nutrition snapshots"
on public.nutrition_daily_snapshots
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users can manage own fitnotes imports"
on public.fitnotes_imports
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
