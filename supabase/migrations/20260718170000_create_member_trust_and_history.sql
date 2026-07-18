-- Core member, exchange-history, rating, and trust model.
-- This migration is intended for a new Supabase project.

create table public.regions (
  id uuid primary key default gen_random_uuid(),
  parent_region_id uuid references public.regions(id) on delete set null,
  slug text not null unique,
  name text not null,
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  timezone text not null,
  created_at timestamptz not null default now()
);

create table public.members (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  avatar_url text,
  bio text check (bio is null or char_length(bio) <= 1000),
  locale text not null default 'en',
  timezone text not null default 'UTC',
  lifecycle_state text not null default 'active'
    check (lifecycle_state in ('active', 'suspended', 'closed')),
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.households (
  id uuid primary key default gen_random_uuid(),
  owner_member_id uuid not null references public.members(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  party_size integer not null check (party_size between 1 and 50),
  accessibility_requirements text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.homes (
  id uuid primary key default gen_random_uuid(),
  owner_member_id uuid not null references public.members(id) on delete cascade,
  region_id uuid not null references public.regions(id) on delete restrict,
  title text not null check (char_length(title) between 1 and 120),
  approximate_location text not null
    check (char_length(approximate_location) between 1 and 160),
  capacity integer not null check (capacity between 1 and 50),
  property_type text not null,
  amenities text[] not null default '{}',
  accessibility_features text[] not null default '{}',
  house_rules text[] not null default '{}',
  publication_state text not null default 'draft'
    check (publication_state in ('draft', 'published', 'paused', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.exchanges (
  id uuid primary key default gen_random_uuid(),
  member_a_id uuid not null references public.members(id) on delete restrict,
  member_b_id uuid not null references public.members(id) on delete restrict,
  household_a_id uuid not null references public.households(id) on delete restrict,
  household_b_id uuid not null references public.households(id) on delete restrict,
  home_a_id uuid not null references public.homes(id) on delete restrict,
  home_b_id uuid not null references public.homes(id) on delete restrict,
  starts_on date not null,
  ends_on date not null,
  state text not null default 'proposed'
    check (
      state in (
        'proposed',
        'discussing',
        'accepted',
        'confirmed',
        'in_progress',
        'completed',
        'declined',
        'cancelled'
      )
    ),
  accepted_by_a_at timestamptz,
  accepted_by_b_at timestamptz,
  confirmed_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancelled_by_member_id uuid references public.members(id) on delete restrict,
  cancellation_reason text check (
    cancellation_reason is null or char_length(cancellation_reason) <= 500
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (member_a_id <> member_b_id),
  check (household_a_id <> household_b_id),
  check (home_a_id <> home_b_id),
  check (starts_on <= ends_on),
  check (
    cancelled_by_member_id is null
    or cancelled_by_member_id in (member_a_id, member_b_id)
  ),
  unique (id, member_a_id),
  unique (id, member_b_id)
);

create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  exchange_id uuid not null references public.exchanges(id) on delete restrict,
  author_member_id uuid not null references public.members(id) on delete restrict,
  subject_member_id uuid not null references public.members(id) on delete restrict,
  rating smallint not null check (rating between 1 and 5),
  review text check (review is null or char_length(review) <= 2000),
  created_at timestamptz not null default now(),
  check (author_member_id <> subject_member_id),
  unique (exchange_id, author_member_id)
);

create table public.verification_records (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  verification_type text not null
    check (verification_type in ('email', 'phone', 'identity', 'home')),
  provider_reference text,
  status text not null
    check (status in ('pending', 'verified', 'failed', 'expired', 'revoked')),
  checked_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_id, verification_type)
);

-- Stored separately from member-editable profile data. Only database routines may
-- write these explainable aggregate values.
create table public.member_trust_summaries (
  member_id uuid primary key references public.members(id) on delete cascade,
  trust_score smallint not null default 20 check (trust_score between 0 and 100),
  rating_average numeric(3, 2) check (
    rating_average is null or rating_average between 1 and 5
  ),
  rating_count integer not null default 0 check (rating_count >= 0),
  completed_exchange_count integer not null default 0
    check (completed_exchange_count >= 0),
  cancelled_exchange_count integer not null default 0
    check (cancelled_exchange_count >= 0),
  verified_signal_count integer not null default 0
    check (verified_signal_count >= 0),
  scoring_version text not null default 'trust-v1',
  updated_at timestamptz not null default now()
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  member_id uuid not null references public.members(id) on delete cascade,
  actor_member_id uuid references public.members(id) on delete set null,
  event_type text not null check (char_length(event_type) between 1 and 80),
  exchange_id uuid references public.exchanges(id) on delete set null,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  check (jsonb_typeof(metadata) = 'object')
);

create index households_owner_member_idx
  on public.households(owner_member_id);
create index homes_owner_member_idx on public.homes(owner_member_id);
create index homes_region_publication_idx
  on public.homes(region_id, publication_state);
create index exchanges_member_a_created_idx
  on public.exchanges(member_a_id, created_at desc);
create index exchanges_member_b_created_idx
  on public.exchanges(member_b_id, created_at desc);
create index exchanges_state_dates_idx
  on public.exchanges(state, starts_on, ends_on);
create index ratings_subject_created_idx
  on public.ratings(subject_member_id, created_at desc);
create index verification_records_member_status_idx
  on public.verification_records(member_id, status);
create index audit_events_member_occurred_idx
  on public.audit_events(member_id, occurred_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger members_set_updated_at
before update on public.members
for each row execute function public.set_updated_at();

create trigger households_set_updated_at
before update on public.households
for each row execute function public.set_updated_at();

create trigger homes_set_updated_at
before update on public.homes
for each row execute function public.set_updated_at();

create trigger exchanges_set_updated_at
before update on public.exchanges
for each row execute function public.set_updated_at();

create trigger verification_records_set_updated_at
before update on public.verification_records
for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.members (id, display_name)
  values (
    new.id,
    coalesce(
      left(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 80),
      left(split_part(coalesce(new.email, 'member'), '@', 1), 80)
    )
  );

  insert into public.member_trust_summaries (member_id)
  values (new.id);

  return new;
end;
$$;

create trigger auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- Make the migration safe for a project that already has Auth users.
insert into public.members (id, display_name, joined_at)
select
  users.id,
  coalesce(
    left(nullif(trim(users.raw_user_meta_data ->> 'display_name'), ''), 80),
    left(split_part(coalesce(users.email, 'member'), '@', 1), 80)
  ),
  users.created_at
from auth.users users
on conflict (id) do nothing;

insert into public.member_trust_summaries (member_id)
select members.id
from public.members members
on conflict (member_id) do nothing;

create or replace function public.validate_exchange_participants()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.households
    where id = new.household_a_id and owner_member_id = new.member_a_id
  ) then
    raise exception 'household_a must belong to member_a';
  end if;

  if not exists (
    select 1
    from public.households
    where id = new.household_b_id and owner_member_id = new.member_b_id
  ) then
    raise exception 'household_b must belong to member_b';
  end if;

  if not exists (
    select 1
    from public.homes
    where id = new.home_a_id and owner_member_id = new.member_a_id
  ) then
    raise exception 'home_a must belong to member_a';
  end if;

  if not exists (
    select 1
    from public.homes
    where id = new.home_b_id and owner_member_id = new.member_b_id
  ) then
    raise exception 'home_b must belong to member_b';
  end if;

  return new;
end;
$$;

create trigger exchanges_validate_participants
before insert or update of
  member_a_id,
  member_b_id,
  household_a_id,
  household_b_id,
  home_a_id,
  home_b_id
on public.exchanges
for each row execute function public.validate_exchange_participants();

create or replace function public.enforce_exchange_update()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
begin
  if row(
    new.member_a_id,
    new.member_b_id,
    new.household_a_id,
    new.household_b_id,
    new.home_a_id,
    new.home_b_id
  ) is distinct from row(
    old.member_a_id,
    old.member_b_id,
    old.household_a_id,
    old.household_b_id,
    old.home_a_id,
    old.home_b_id
  ) then
    raise exception 'exchange participants, households, and homes are immutable';
  end if;

  if old.state in ('accepted', 'confirmed', 'in_progress', 'completed')
    and row(new.starts_on, new.ends_on)
      is distinct from row(old.starts_on, old.ends_on)
  then
    raise exception 'exchange dates are immutable after acceptance';
  end if;

  if actor_id = old.member_a_id
    and new.accepted_by_b_at is distinct from old.accepted_by_b_at
  then
    raise exception 'a member cannot accept for their exchange partner';
  end if;

  if actor_id = old.member_b_id
    and new.accepted_by_a_at is distinct from old.accepted_by_a_at
  then
    raise exception 'a member cannot accept for their exchange partner';
  end if;

  if new.state is distinct from old.state and not (
    (old.state = 'proposed' and new.state in ('discussing', 'declined', 'cancelled'))
    or (old.state = 'discussing' and new.state in ('accepted', 'declined', 'cancelled'))
    or (old.state = 'accepted' and new.state in ('confirmed', 'cancelled'))
    or (old.state = 'confirmed' and new.state in ('in_progress', 'cancelled'))
    or (old.state = 'in_progress' and new.state in ('completed', 'cancelled'))
  ) then
    raise exception 'invalid exchange state transition from % to %', old.state, new.state;
  end if;

  if new.state = 'accepted'
    and (new.accepted_by_a_at is null or new.accepted_by_b_at is null)
  then
    raise exception 'both members must accept the exchange';
  end if;

  if new.state = 'confirmed' and new.confirmed_at is null then
    raise exception 'confirmed_at is required for a confirmed exchange';
  end if;

  if new.state = 'completed' and new.completed_at is null then
    raise exception 'completed_at is required for a completed exchange';
  end if;

  if new.state = 'cancelled' and (
    new.cancelled_at is null
    or new.cancelled_by_member_id is null
    or (
      actor_id is not null
      and new.cancelled_by_member_id <> actor_id
    )
  ) then
    raise exception 'cancellation must identify the acting member and time';
  end if;

  return new;
end;
$$;

create trigger exchanges_enforce_update
before update on public.exchanges
for each row execute function public.enforce_exchange_update();

create or replace function public.validate_rating()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  exchange_row public.exchanges%rowtype;
begin
  select *
  into exchange_row
  from public.exchanges
  where id = new.exchange_id;

  if exchange_row.id is null or exchange_row.state <> 'completed' then
    raise exception 'ratings require a completed exchange';
  end if;

  if not (
    (new.author_member_id = exchange_row.member_a_id
      and new.subject_member_id = exchange_row.member_b_id)
    or
    (new.author_member_id = exchange_row.member_b_id
      and new.subject_member_id = exchange_row.member_a_id)
  ) then
    raise exception 'rating author and subject must be exchange partners';
  end if;

  return new;
end;
$$;

create trigger ratings_validate
before insert or update on public.ratings
for each row execute function public.validate_rating();

create or replace function public.refresh_member_trust(target_member_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  average_rating numeric(3, 2);
  total_ratings integer;
  completed_count integer;
  cancelled_count integer;
  verified_count integer;
  calculated_score integer;
begin
  select round(avg(rating)::numeric, 2), count(*)::integer
  into average_rating, total_ratings
  from public.ratings
  where subject_member_id = target_member_id;

  select
    count(*) filter (where state = 'completed')::integer,
    count(*) filter (
      where state = 'cancelled'
        and cancelled_by_member_id = target_member_id
    )::integer
  into completed_count, cancelled_count
  from public.exchanges
  where member_a_id = target_member_id or member_b_id = target_member_id;

  select count(*)::integer
  into verified_count
  from public.verification_records
  where member_id = target_member_id and status = 'verified';

  calculated_score :=
    20
    + least(20, verified_count * 5)
    + least(30, completed_count * 5)
    + case
        when total_ratings = 0 then 0
        else round(((average_rating - 1) / 4) * 30)::integer
      end
    - least(20, cancelled_count * 5);

  insert into public.member_trust_summaries (
    member_id,
    trust_score,
    rating_average,
    rating_count,
    completed_exchange_count,
    cancelled_exchange_count,
    verified_signal_count,
    scoring_version,
    updated_at
  )
  values (
    target_member_id,
    greatest(0, least(100, calculated_score)),
    average_rating,
    total_ratings,
    completed_count,
    cancelled_count,
    verified_count,
    'trust-v1',
    now()
  )
  on conflict (member_id) do update set
    trust_score = excluded.trust_score,
    rating_average = excluded.rating_average,
    rating_count = excluded.rating_count,
    completed_exchange_count = excluded.completed_exchange_count,
    cancelled_exchange_count = excluded.cancelled_exchange_count,
    verified_signal_count = excluded.verified_signal_count,
    scoring_version = excluded.scoring_version,
    updated_at = excluded.updated_at;
end;
$$;

create or replace function public.refresh_trust_after_rating()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.refresh_member_trust(
    coalesce(new.subject_member_id, old.subject_member_id)
  );
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger ratings_refresh_trust
after insert or update or delete on public.ratings
for each row execute function public.refresh_trust_after_rating();

create or replace function public.refresh_trust_after_exchange()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.refresh_member_trust(
    coalesce(new.member_a_id, old.member_a_id)
  );
  perform public.refresh_member_trust(
    coalesce(new.member_b_id, old.member_b_id)
  );
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger exchanges_refresh_trust
after insert or update or delete on public.exchanges
for each row execute function public.refresh_trust_after_exchange();

create or replace function public.refresh_trust_after_verification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.refresh_member_trust(coalesce(new.member_id, old.member_id));
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger verification_records_refresh_trust
after insert or update of status or delete on public.verification_records
for each row execute function public.refresh_trust_after_verification();

-- Each member sees only their own exchange history through this view.
create view public.member_exchange_history
with (security_invoker = true)
as
select
  e.id as exchange_id,
  case
    when e.member_a_id = (select auth.uid()) then e.member_b_id
    else e.member_a_id
  end as exchange_partner_id,
  case
    when e.member_a_id = (select auth.uid()) then e.home_b_id
    else e.home_a_id
  end as booked_home_id,
  case
    when e.member_a_id = (select auth.uid()) then hb.region_id
    else ha.region_id
  end as visited_region_id,
  e.starts_on,
  e.ends_on,
  e.state,
  e.created_at,
  e.completed_at,
  e.cancelled_at
from public.exchanges e
join public.homes ha on ha.id = e.home_a_id
join public.homes hb on hb.id = e.home_b_id
where (select auth.uid()) in (e.member_a_id, e.member_b_id);

create view public.member_visited_places
with (security_invoker = true)
as
select
  history.exchange_id,
  history.visited_region_id as region_id,
  regions.name as region_name,
  regions.country_code,
  history.starts_on,
  history.ends_on,
  history.completed_at
from public.member_exchange_history history
join public.regions regions on regions.id = history.visited_region_id
where history.state = 'completed';

alter table public.regions enable row level security;
alter table public.members enable row level security;
alter table public.households enable row level security;
alter table public.homes enable row level security;
alter table public.exchanges enable row level security;
alter table public.ratings enable row level security;
alter table public.verification_records enable row level security;
alter table public.member_trust_summaries enable row level security;
alter table public.audit_events enable row level security;

create policy regions_read
on public.regions for select
to anon, authenticated
using (true);

create policy members_read_authenticated
on public.members for select
to authenticated
using (true);

create policy members_update_self
on public.members for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy households_manage_own
on public.households for all
to authenticated
using ((select auth.uid()) = owner_member_id)
with check ((select auth.uid()) = owner_member_id);

create policy homes_read_published_or_own
on public.homes for select
to anon, authenticated
using (
  publication_state = 'published'
  or (select auth.uid()) = owner_member_id
);

create policy homes_insert_own
on public.homes for insert
to authenticated
with check ((select auth.uid()) = owner_member_id);

create policy homes_update_own
on public.homes for update
to authenticated
using ((select auth.uid()) = owner_member_id)
with check ((select auth.uid()) = owner_member_id);

create policy homes_delete_own
on public.homes for delete
to authenticated
using ((select auth.uid()) = owner_member_id);

create policy exchanges_read_participant
on public.exchanges for select
to authenticated
using ((select auth.uid()) in (member_a_id, member_b_id));

create policy exchanges_propose_as_member_a
on public.exchanges for insert
to authenticated
with check (
  (select auth.uid()) = member_a_id
  and member_a_id <> member_b_id
  and state = 'proposed'
);

create policy exchanges_update_participant
on public.exchanges for update
to authenticated
using ((select auth.uid()) in (member_a_id, member_b_id))
with check ((select auth.uid()) in (member_a_id, member_b_id));

create policy ratings_read_authenticated
on public.ratings for select
to authenticated
using (true);

create policy ratings_create_as_author
on public.ratings for insert
to authenticated
with check ((select auth.uid()) = author_member_id);

create policy verification_records_read_own
on public.verification_records for select
to authenticated
using ((select auth.uid()) = member_id);

create policy member_trust_read_authenticated
on public.member_trust_summaries for select
to authenticated
using (true);

create policy audit_events_read_own
on public.audit_events for select
to authenticated
using ((select auth.uid()) = member_id);

revoke all on public.regions from anon, authenticated;
revoke all on public.members from anon, authenticated;
revoke all on public.households from anon, authenticated;
revoke all on public.homes from anon, authenticated;
revoke all on public.exchanges from anon, authenticated;
revoke all on public.ratings from anon, authenticated;
revoke all on public.verification_records from anon, authenticated;
revoke all on public.member_trust_summaries from anon, authenticated;
revoke all on public.audit_events from anon, authenticated;
revoke all on public.member_exchange_history from anon, authenticated;
revoke all on public.member_visited_places from anon, authenticated;

grant select on public.regions to anon, authenticated;
grant select on public.members to authenticated;
grant update (display_name, avatar_url, bio, locale, timezone)
  on public.members to authenticated;
grant select, insert, update, delete on public.households to authenticated;
grant select on public.homes to anon, authenticated;
grant insert, update, delete on public.homes to authenticated;
grant select, insert, update on public.exchanges to authenticated;
grant select, insert on public.ratings to authenticated;
grant select on public.verification_records to authenticated;
grant select on public.member_trust_summaries to authenticated;
grant select on public.audit_events to authenticated;
grant select on public.member_exchange_history to authenticated;
grant select on public.member_visited_places to authenticated;

revoke all on function public.refresh_member_trust(uuid) from public;
revoke all on function public.handle_new_auth_user() from public;
revoke all on function public.validate_exchange_participants() from public;
revoke all on function public.enforce_exchange_update() from public;
revoke all on function public.validate_rating() from public;
revoke all on function public.refresh_trust_after_rating() from public;
revoke all on function public.refresh_trust_after_exchange() from public;
revoke all on function public.refresh_trust_after_verification() from public;
revoke all on function public.set_updated_at() from public;
