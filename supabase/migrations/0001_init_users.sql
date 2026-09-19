-- VibeJam 0001 — users
--
-- public.users mirrors auth.users with the GitHub profile fields the product
-- needs. users.id IS auth.users.id: every RLS policy in this project is written
-- in terms of auth.uid(), and they only work if that equality holds (§9).
--
-- Scope: this migration creates only the users table. Later phases add their
-- own tables alongside their own migrations, rather than this one creating six
-- tables for features that do not exist yet (§42).

-- Shared trigger function, reused by every later migration.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.users (
  id              uuid primary key references auth.users (id) on delete cascade,
  github_id       text not null unique,
  github_username text not null,
  display_name    text,
  avatar_url      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index users_github_username_idx on public.users (github_username);

create trigger users_set_updated_at
  before update on public.users
  for each row
  execute function public.set_updated_at();

-- Populates public.users on first GitHub login (§26). Runs as definer because
-- the signing-up user has no INSERT privilege of their own yet.
--
-- search_path is pinned: a security definer function without it can be hijacked
-- by a caller-controlled search_path.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.users (id, github_id, github_username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'provider_id', new.id::text),
    coalesce(new.raw_user_meta_data ->> 'user_name', 'unknown'),
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update set
    github_username = excluded.github_username,
    display_name    = excluded.display_name,
    avatar_url      = excluded.avatar_url,
    updated_at      = now();

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Row Level Security (§25).
alter table public.users enable row level security;

create policy users_select_own
  on public.users for select
  to authenticated
  using ((select auth.uid()) = id);

create policy users_update_own
  on public.users for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- No INSERT policy by design: rows are created only by handle_new_user().
-- No DELETE policy by design: removal cascades from auth.users.
