-- StudentRegistered consumer: statistic "registrations per day" + processed-event table (duplicate protection)
create table if not exists public.processed_events (
  event_id text primary key,                 -- PRIMARY KEY = the same event cannot be stored twice
  event_type text not null,
  processed_at timestamptz not null default now()
);
create table if not exists public.registration_stats (
  day date primary key,
  registrations int not null default 0
);

-- only the backend (service_role) may touch these tables
alter table public.processed_events enable row level security;
alter table public.registration_stats enable row level security;
revoke all on public.processed_events, public.registration_stats from anon, authenticated;

-- Atomic: register the eventId and increment the counter in one transaction.
-- Returns true if applied, false if this event was already processed (duplicate delivery).
create or replace function public.record_student_registered(p_event_id text, p_day date) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  insert into public.processed_events (event_id, event_type) values (p_event_id, 'StudentRegistered')
  on conflict (event_id) do nothing;
  if not found then return false; end if;
  insert into public.registration_stats (day, registrations) values (p_day, 1)
  on conflict (day) do update set registrations = registration_stats.registrations + 1;
  return true;
end $$;
revoke all on function public.record_student_registered(text, date) from public, anon, authenticated;
grant execute on function public.record_student_registered(text, date) to service_role;

-- Check manually after a registration:  select * from public.registration_stats;  select * from public.processed_events;
