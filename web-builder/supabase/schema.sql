-- ============================================================
-- Floor Plan Builder — Supabase Schema
-- Run this in the Supabase SQL editor
-- ============================================================

-- Restaurants
create table if not exists restaurants (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  owner_id    uuid references auth.users(id) on delete cascade not null,
  created_at  timestamptz default now() not null
);

-- Floors (each restaurant can have multiple floors)
create table if not exists floors (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid references restaurants(id) on delete cascade not null,
  name           text not null default 'Ground Floor',
  "order"        int not null default 0,
  elements       jsonb not null default '[]',
  created_at     timestamptz default now() not null
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table restaurants enable row level security;
alter table floors enable row level security;

-- Helper: check if the requesting user is an admin
create or replace function is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role') = 'admin',
    false
  )
$$;

-- Restaurants: owners see their own, admins see all
create policy "restaurants_select" on restaurants
  for select using (owner_id = auth.uid() or is_admin());

create policy "restaurants_insert" on restaurants
  for insert with check (owner_id = auth.uid() or is_admin());

create policy "restaurants_update" on restaurants
  for update using (owner_id = auth.uid() or is_admin());

create policy "restaurants_delete" on restaurants
  for delete using (is_admin());

-- Floors: accessible if the parent restaurant is accessible
create policy "floors_select" on floors
  for select using (
    exists (
      select 1 from restaurants r
      where r.id = floors.restaurant_id
        and (r.owner_id = auth.uid() or is_admin())
    )
  );

create policy "floors_insert" on floors
  for insert with check (
    exists (
      select 1 from restaurants r
      where r.id = floors.restaurant_id
        and (r.owner_id = auth.uid() or is_admin())
    )
  );

create policy "floors_update" on floors
  for update using (
    exists (
      select 1 from restaurants r
      where r.id = floors.restaurant_id
        and (r.owner_id = auth.uid() or is_admin())
    )
  );

create policy "floors_delete" on floors
  for delete using (
    exists (
      select 1 from restaurants r
      where r.id = floors.restaurant_id
        and (r.owner_id = auth.uid() or is_admin())
    )
  );

-- ============================================================
-- Indexes
-- ============================================================
create index if not exists floors_restaurant_id_idx on floors(restaurant_id);
create index if not exists restaurants_owner_id_idx on restaurants(owner_id);

-- ============================================================
-- Grant admin role
-- To make a user an admin, run this in the Supabase SQL editor
-- (replace <user-id> with the actual UUID from auth.users):
--
--   update auth.users
--   set raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'
--   where id = '<user-id>';
-- ============================================================
