create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role app_role not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_profiles_role on user_profiles(role);
create index if not exists idx_user_profiles_active on user_profiles(active);

create or replace function set_user_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_profiles_updated_at on user_profiles;
create trigger trg_user_profiles_updated_at
before update on user_profiles
for each row
execute function set_user_profiles_updated_at();

alter table user_profiles enable row level security;

create policy "users_can_read_own_profile"
on user_profiles
for select
using (auth.uid() = id);

create policy "users_can_update_own_profile"
on user_profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

comment on table user_profiles is 'Application-level profile and role mapping for Supabase Auth users.';
comment on column user_profiles.role is 'Application role used by the Accounting Task Tracker permission model.';
