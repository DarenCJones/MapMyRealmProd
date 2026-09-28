-- Run this in the SQL Editor of your own Supabase project.
-- Invite yourself and your readers in Authentication > Users before assigning roles.
-- Never put private post text or images in the GitHub Pages repository.

create table if not exists public.realm_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'reader'))
);

create table if not exists public.realm_entries (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 1 and 160),
  summary text not null default '' check (length(summary) <= 280),
  body text not null,
  kind text not null check (kind in ('map', 'post')),
  status text not null default 'draft' check (status in ('draft', 'published')),
  image_path text,
  created_at timestamptz not null default now()
);

alter table public.realm_members enable row level security;
alter table public.realm_entries enable row level security;
revoke all on public.realm_members from anon, authenticated;
revoke all on public.realm_entries from anon, authenticated;
grant select on public.realm_members to authenticated;
grant select, insert, update on public.realm_entries to authenticated;

drop policy if exists "realm members can read own role" on public.realm_members;
create policy "realm members can read own role" on public.realm_members
  for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.realm_role()
returns text language sql stable security definer set search_path = ''
as $$
  select role from public.realm_members where user_id = (select auth.uid()) limit 1;
$$;
revoke all on function public.realm_role() from public;
grant execute on function public.realm_role() to authenticated;

drop policy if exists "realm entries for owner and invited readers" on public.realm_entries;
create policy "realm entries for owner and invited readers" on public.realm_entries
  for select to authenticated using (
    (select public.realm_role()) = 'owner'
    or ((select public.realm_role()) = 'reader' and status = 'published')
  );

drop policy if exists "realm owner creates entries" on public.realm_entries;
create policy "realm owner creates entries" on public.realm_entries
  for insert to authenticated with check ((select public.realm_role()) = 'owner');

drop policy if exists "realm owner updates entries" on public.realm_entries;
create policy "realm owner updates entries" on public.realm_entries
  for update to authenticated
  using ((select public.realm_role()) = 'owner')
  with check ((select public.realm_role()) = 'owner');

insert into storage.buckets (id, name, public)
values ('realm-private', 'realm-private', false)
on conflict (id) do update set public = false;

drop policy if exists "realm private map images read" on storage.objects;
create policy "realm private map images read" on storage.objects
  for select to authenticated using (
    bucket_id = 'realm-private' and (
      (select public.realm_role()) = 'owner'
      or ((select public.realm_role()) = 'reader' and exists (
        select 1 from public.realm_entries e
        where e.image_path = storage.objects.name and e.status = 'published'
      ))
    )
  );

drop policy if exists "realm owner uploads map images" on storage.objects;
create policy "realm owner uploads map images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'realm-private' and (select public.realm_role()) = 'owner');

-- After inviting the owner through Authentication > Users, run this with their email:
-- insert into public.realm_members (user_id, role)
-- select id, 'owner' from auth.users where email = 'OWNER_EMAIL_HERE'
-- on conflict (user_id) do update set role = 'owner';
-- Repeat for invited readers with role 'reader' and their email addresses.
