-- Exchangeable date windows used by public discovery and reciprocal matching.

create table public.home_availability (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  starts_on date not null,
  ends_on date not null,
  minimum_nights integer not null default 1
    check (minimum_nights between 1 and 365),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on >= starts_on),
  unique (home_id, starts_on, ends_on)
);

create index home_availability_home_dates_idx
  on public.home_availability(home_id, starts_on, ends_on);

alter table public.home_availability enable row level security;

create policy home_availability_read_published_or_own
on public.home_availability for select
to anon, authenticated
using (
  exists (
    select 1 from public.homes
    where homes.id = home_availability.home_id
      and (
        homes.publication_state = 'published'
        or homes.owner_member_id = (select auth.uid())
      )
  )
);

create policy home_availability_manage_own
on public.home_availability for all
to authenticated
using (
  exists (
    select 1 from public.homes
    where homes.id = home_availability.home_id
      and homes.owner_member_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.homes
    where homes.id = home_availability.home_id
      and homes.owner_member_id = (select auth.uid())
  )
);

revoke all on public.home_availability from anon, authenticated;
grant select on public.home_availability to anon, authenticated;
grant insert, update, delete on public.home_availability to authenticated;
