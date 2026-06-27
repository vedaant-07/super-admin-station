-- SE7EN FIT admin dashboard schema
-- Run this in the Supabase SQL editor or through Supabase migrations before using the dashboard.
-- Compatible with the existing SE7EN FIT public.profiles table that uses user_id as the primary key.

create extension if not exists pgcrypto;

do $$ begin
  create type public.app_role as enum ('super_admin', 'admin', 'staff', 'user');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.platform_source as enum ('app', 'website', 'admin');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.ticket_priority as enum ('low', 'normal', 'high', 'urgent');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.ticket_status as enum ('new', 'open', 'pending', 'resolved', 'closed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.notif_channel as enum ('push', 'announcement', 'email');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.notif_status as enum ('draft', 'scheduled', 'sent', 'failed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.user_status as enum ('active', 'blocked', 'pending');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  id uuid,
  email text,
  role text not null default 'user',
  full_name text,
  phone text,
  avatar_url text,
  source public.platform_source not null default 'app',
  status public.user_status not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists user_id uuid;
alter table public.profiles add column if not exists id uuid;
alter table public.profiles add column if not exists role text not null default 'user';
alter table public.profiles add column if not exists source public.platform_source not null default 'app';
alter table public.profiles add column if not exists status public.user_status not null default 'active';
alter table public.profiles add column if not exists last_seen_at timestamptz;
alter table public.profiles add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

update public.profiles set id = user_id where id is null and user_id is not null;
update public.profiles set user_id = id where user_id is null and id is not null;

create unique index if not exists profiles_id_unique_idx on public.profiles(id) where id is not null;
create index if not exists profiles_role_idx on public.profiles(role);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  user_name text,
  user_email text,
  user_phone text,
  source public.platform_source not null default 'website',
  subject text not null,
  message text not null,
  priority public.ticket_priority not null default 'normal',
  status public.ticket_status not null default 'new',
  assigned_to uuid references auth.users(id) on delete set null,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  body text not null,
  is_internal boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  target public.platform_source not null default 'app',
  channel public.notif_channel not null default 'announcement',
  audience jsonb not null default '{}'::jsonb,
  status public.notif_status not null default 'draft',
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  scope public.platform_source not null default 'admin',
  description text,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.sync_profile_identity_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.id is null and new.user_id is not null then
    new.id := new.user_id;
  end if;

  if new.user_id is null and new.id is not null then
    new.user_id := new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_sync_identity_columns on public.profiles;
create trigger profiles_sync_identity_columns
before insert or update on public.profiles
for each row execute function public.sync_profile_identity_columns();

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists support_tickets_touch_updated_at on public.support_tickets;
create trigger support_tickets_touch_updated_at
before update on public.support_tickets
for each row execute function public.touch_updated_at();

drop trigger if exists app_settings_touch_updated_at on public.app_settings;
create trigger app_settings_touch_updated_at
before update on public.app_settings
for each row execute function public.touch_updated_at();

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  ) or exists (
    select 1
    from public.profiles
    where coalesce(user_id, id) = _user_id
      and role = _role::text
  );
$$;

create or replace function public.is_admin(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role in ('super_admin', 'admin', 'staff')
  ) or exists (
    select 1
    from public.profiles
    where coalesce(user_id, id) = _user_id
      and role in ('super_admin', 'admin', 'staff')
  );
$$;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.support_tickets enable row level security;
alter table public.ticket_messages enable row level security;
alter table public.notifications enable row level security;
alter table public.app_settings enable row level security;
alter table public.admin_logs enable row level security;

-- Profiles
drop policy if exists "profiles_read_self_or_admin" on public.profiles;
create policy "profiles_read_self_or_admin"
  on public.profiles for select to authenticated
  using (coalesce(id, user_id) = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin"
  on public.profiles for update to authenticated
  using (coalesce(id, user_id) = auth.uid() or public.is_admin(auth.uid()))
  with check (coalesce(id, user_id) = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "profiles_admin_insert" on public.profiles;
create policy "profiles_admin_insert"
  on public.profiles for insert to authenticated
  with check (coalesce(id, user_id) = auth.uid() or public.is_admin(auth.uid()));

-- Roles
drop policy if exists "user_roles_read_self_or_admin" on public.user_roles;
create policy "user_roles_read_self_or_admin"
  on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "user_roles_super_admin_manage" on public.user_roles;
create policy "user_roles_super_admin_manage"
  on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(), 'super_admin'))
  with check (public.has_role(auth.uid(), 'super_admin'));

-- Support tickets: unauthenticated website/app support should go through the backend /api/support route.
drop policy if exists "support_tickets_public_insert" on public.support_tickets;
drop policy if exists "support_tickets_authenticated_insert" on public.support_tickets;
create policy "support_tickets_authenticated_insert"
  on public.support_tickets for insert to authenticated
  with check (user_id is null or user_id = auth.uid());

drop policy if exists "support_tickets_admin_manage" on public.support_tickets;
create policy "support_tickets_admin_manage"
  on public.support_tickets for all to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "support_tickets_user_read_own" on public.support_tickets;
create policy "support_tickets_user_read_own"
  on public.support_tickets for select to authenticated
  using (user_id = auth.uid());

-- Ticket messages
drop policy if exists "ticket_messages_admin_manage" on public.ticket_messages;
create policy "ticket_messages_admin_manage"
  on public.ticket_messages for all to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "ticket_messages_user_read_non_internal_own_ticket" on public.ticket_messages;
create policy "ticket_messages_user_read_non_internal_own_ticket"
  on public.ticket_messages for select to authenticated
  using (
    not is_internal
    and exists (
      select 1 from public.support_tickets t
      where t.id = ticket_messages.ticket_id
        and t.user_id = auth.uid()
    )
  );

-- Notifications, settings, logs
drop policy if exists "notifications_admin_manage" on public.notifications;
create policy "notifications_admin_manage"
  on public.notifications for all to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "app_settings_admin_manage" on public.app_settings;
create policy "app_settings_admin_manage"
  on public.app_settings for all to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "app_settings_public_read" on public.app_settings;
create policy "app_settings_public_read"
  on public.app_settings for select to anon, authenticated
  using (scope in ('app', 'website'));

drop policy if exists "admin_logs_admin_read_insert" on public.admin_logs;
create policy "admin_logs_admin_read_insert"
  on public.admin_logs for all to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

revoke execute on function public.has_role(uuid, public.app_role) from anon;
revoke execute on function public.is_admin(uuid) from anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.is_admin(uuid) to authenticated;

insert into public.app_settings (key, scope, value, description)
values
  ('app_status', 'app', '{"maintenance": false}'::jsonb, 'App runtime status and maintenance toggle'),
  ('website_status', 'website', '{"maintenance": false}'::jsonb, 'Website runtime status and maintenance toggle'),
  ('admin_status', 'admin', '{"maintenance": false}'::jsonb, 'Admin runtime status and maintenance toggle')
on conflict (key) do nothing;
