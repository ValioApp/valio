-- VALIO 0001 — extensiones + multi-tenancy base
create extension if not exists postgis;
create extension if not exists pgcrypto;

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner','admin','member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

-- Helper: workspace del usuario autenticado (una membresía por usuario en MVP)
create or replace function public.auth_workspace_id()
returns uuid language sql stable security definer set search_path = public as $$
  select workspace_id from public.members where user_id = auth.uid() limit 1
$$;

alter table public.workspaces enable row level security;
alter table public.members enable row level security;

create policy "workspace propio" on public.workspaces
  for all using (id = public.auth_workspace_id());

create policy "members del workspace" on public.members
  for select using (workspace_id = public.auth_workspace_id());

-- Al registrarse un usuario: crear workspace + membresía owner
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare ws_id uuid;
begin
  insert into public.workspaces (name)
    values (coalesce(new.raw_user_meta_data->>'workspace_name', 'Mi workspace'))
    returning id into ws_id;
  insert into public.members (workspace_id, user_id, role) values (ws_id, new.id, 'owner');
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
