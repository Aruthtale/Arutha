-- Migration: Mood Journal table
-- Stores daily mood entries per user with optional note.

create table if not exists public.arutha_mood_journal (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  mood        smallint not null check (mood between 1 and 5),
  note        text,
  date        date not null default current_date,
  created_at  timestamptz not null default now(),
  -- One entry per user per day
  unique (user_id, date)
);

-- RLS
alter table public.arutha_mood_journal enable row level security;

create policy "Users manage their own mood entries"
  on public.arutha_mood_journal
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index for fast user queries
create index if not exists idx_mood_journal_user_date
  on public.arutha_mood_journal (user_id, date desc);
