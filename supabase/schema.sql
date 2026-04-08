-- DebugHive Supabase schema
-- Run this entire script in the Supabase SQL Editor.

create extension if not exists pgcrypto;

-- Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'team_role') then
    create type public.team_role as enum ('owner', 'admin', 'member');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'debug_session_status') then
    create type public.debug_session_status as enum ('active', 'paused', 'closed');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'pull_request_status') then
    create type public.pull_request_status as enum ('draft', 'submitted', 'merged', 'closed');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'chat_message_role') then
    create type public.chat_message_role as enum ('user', 'assistant', 'system');
  end if;
end $$;

-- Generic trigger for updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Users (custom auth profile table)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  password_hash text not null,
  github_id text unique,
  github_login text,
  github_avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users add column if not exists github_id text;
alter table public.users add column if not exists github_login text;
alter table public.users add column if not exists github_avatar_url text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_github_id_unique'
  ) then
    alter table public.users add constraint users_github_id_unique unique (github_id);
  end if;
end $$;

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

-- Sessions for cookie/token auth
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_sessions_user_id on public.sessions(user_id);
create index if not exists idx_sessions_expires_at on public.sessions(expires_at);

-- Teams
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_teams_owner_id on public.teams(owner_id);

drop trigger if exists trg_teams_updated_at on public.teams;
create trigger trg_teams_updated_at
before update on public.teams
for each row
execute function public.set_updated_at();

-- Team membership
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role public.team_role not null default 'member',
  created_at timestamptz not null default now(),
  unique(team_id, user_id)
);

create index if not exists idx_team_members_team_id on public.team_members(team_id);
create index if not exists idx_team_members_user_id on public.team_members(user_id);

-- Debug sessions
create table if not exists public.debug_sessions (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  created_by_id uuid not null references public.users(id) on delete restrict,
  title text not null,
  description text not null default '',
  code text not null,
  language text not null,
  status public.debug_session_status not null default 'active',
  ai_agent_results jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_debug_sessions_team_id on public.debug_sessions(team_id);
create index if not exists idx_debug_sessions_created_by_id on public.debug_sessions(created_by_id);
create index if not exists idx_debug_sessions_status on public.debug_sessions(status);

drop trigger if exists trg_debug_sessions_updated_at on public.debug_sessions;
create trigger trg_debug_sessions_updated_at
before update on public.debug_sessions
for each row
execute function public.set_updated_at();

-- Participants (normalized replacement for participants array)
create table if not exists public.debug_session_participants (
  id uuid primary key default gen_random_uuid(),
  debug_session_id uuid not null references public.debug_sessions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(debug_session_id, user_id)
);

create index if not exists idx_debug_session_participants_session_id on public.debug_session_participants(debug_session_id);
create index if not exists idx_debug_session_participants_user_id on public.debug_session_participants(user_id);

-- Pull requests
create table if not exists public.pull_requests (
  id uuid primary key default gen_random_uuid(),
  debug_session_id uuid not null references public.debug_sessions(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  github_pr_url text,
  title text not null,
  description text not null,
  status public.pull_request_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pull_requests_debug_session_id on public.pull_requests(debug_session_id);
create index if not exists idx_pull_requests_team_id on public.pull_requests(team_id);
create index if not exists idx_pull_requests_status on public.pull_requests(status);

drop trigger if exists trg_pull_requests_updated_at on public.pull_requests;
create trigger trg_pull_requests_updated_at
before update on public.pull_requests
for each row
execute function public.set_updated_at();

-- Audit logs
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_team_id on public.audit_logs(team_id);
create index if not exists idx_audit_logs_user_id on public.audit_logs(user_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at);

-- Chat messages
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  debug_session_id uuid not null references public.debug_sessions(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  role public.chat_message_role not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_messages_session_id on public.chat_messages(debug_session_id);
create index if not exists idx_chat_messages_created_at on public.chat_messages(created_at);

-- Optional helper view for common session details
create or replace view public.debug_sessions_with_meta as
select
  ds.id,
  ds.team_id,
  ds.created_by_id,
  ds.title,
  ds.description,
  ds.code,
  ds.language,
  ds.status,
  ds.ai_agent_results,
  ds.created_at,
  ds.updated_at,
  count(distinct dsp.user_id) as participant_count,
  count(distinct pr.id) as pull_request_count
from public.debug_sessions ds
left join public.debug_session_participants dsp on dsp.debug_session_id = ds.id
left join public.pull_requests pr on pr.debug_session_id = ds.id
group by ds.id;

-- Security baseline: enable RLS.
alter table public.users enable row level security;
alter table public.sessions enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.debug_sessions enable row level security;
alter table public.debug_session_participants enable row level security;
alter table public.pull_requests enable row level security;
alter table public.audit_logs enable row level security;
alter table public.chat_messages enable row level security;

-- NOTE:
-- Current app uses custom cookie sessions handled by Next.js API routes.
-- Enforce strict DB access: only service_role can access tables directly.
drop policy if exists "service role full access users" on public.users;
create policy "service role full access users"
on public.users
for all
to service_role
using (true)
with check (true);

drop policy if exists "service role full access sessions" on public.sessions;
create policy "service role full access sessions"
on public.sessions
for all
to service_role
using (true)
with check (true);

drop policy if exists "service role full access teams" on public.teams;
create policy "service role full access teams"
on public.teams
for all
to service_role
using (true)
with check (true);

drop policy if exists "service role full access team_members" on public.team_members;
create policy "service role full access team_members"
on public.team_members
for all
to service_role
using (true)
with check (true);

drop policy if exists "service role full access debug_sessions" on public.debug_sessions;
create policy "service role full access debug_sessions"
on public.debug_sessions
for all
to service_role
using (true)
with check (true);

drop policy if exists "service role full access debug_session_participants" on public.debug_session_participants;
create policy "service role full access debug_session_participants"
on public.debug_session_participants
for all
to service_role
using (true)
with check (true);

drop policy if exists "service role full access pull_requests" on public.pull_requests;
create policy "service role full access pull_requests"
on public.pull_requests
for all
to service_role
using (true)
with check (true);

drop policy if exists "service role full access audit_logs" on public.audit_logs;
create policy "service role full access audit_logs"
on public.audit_logs
for all
to service_role
using (true)
with check (true);

drop policy if exists "service role full access chat_messages" on public.chat_messages;
create policy "service role full access chat_messages"
on public.chat_messages
for all
to service_role
using (true)
with check (true);
