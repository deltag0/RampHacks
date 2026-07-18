-- Exchange-scoped private messaging and two-party arrival confirmation.

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  exchange_id uuid not null unique
    references public.exchanges(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null
    references public.conversations(id) on delete cascade,
  author_member_id uuid not null
    references public.members(id) on delete restrict,
  body text not null check (
    char_length(trim(body)) between 1 and 4000
  ),
  sent_at timestamptz not null default now(),
  edited_at timestamptz,
  read_at timestamptz
);

create table public.arrival_confirmations (
  exchange_id uuid not null
    references public.exchanges(id) on delete cascade,
  member_id uuid not null
    references public.members(id) on delete restrict,
  arrived_home_id uuid not null
    references public.homes(id) on delete restrict,
  confirmed_at timestamptz not null default now(),
  primary key (exchange_id, member_id)
);

create index messages_conversation_sent_idx
  on public.messages(conversation_id, sent_at desc);
create index messages_author_idx
  on public.messages(author_member_id);
create index arrival_confirmations_member_idx
  on public.arrival_confirmations(member_id, confirmed_at desc);

create or replace function public.create_exchange_conversation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.conversations (exchange_id)
  values (new.id)
  on conflict (exchange_id) do nothing;
  return new;
end;
$$;

create trigger exchanges_create_conversation
after insert on public.exchanges
for each row execute function public.create_exchange_conversation();

-- Backfill conversations for exchanges created before this migration.
insert into public.conversations (exchange_id)
select exchanges.id
from public.exchanges exchanges
on conflict (exchange_id) do nothing;

create or replace function public.validate_message_author()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.author_member_id <> (select auth.uid()) then
    raise exception 'message author must be the signed-in member';
  end if;

  if not exists (
    select 1
    from public.conversations conversations
    join public.exchanges exchanges
      on exchanges.id = conversations.exchange_id
    where conversations.id = new.conversation_id
      and new.author_member_id in (
        exchanges.member_a_id,
        exchanges.member_b_id
      )
  ) then
    raise exception 'message author is not an exchange participant';
  end if;

  return new;
end;
$$;

create trigger messages_validate_author
before insert on public.messages
for each row execute function public.validate_message_author();

create or replace function public.confirm_exchange_arrival(target_exchange_id uuid)
returns public.arrival_confirmations
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  exchange_row public.exchanges%rowtype;
  arrived_home uuid;
  confirmation public.arrival_confirmations%rowtype;
begin
  if actor_id is null then
    raise exception 'authentication required';
  end if;

  select *
  into exchange_row
  from public.exchanges
  where id = target_exchange_id
  for update;

  if exchange_row.id is null
    or actor_id not in (exchange_row.member_a_id, exchange_row.member_b_id)
  then
    raise exception 'exchange not found';
  end if;

  if exchange_row.state not in ('confirmed', 'in_progress') then
    raise exception 'arrival can only be confirmed for a confirmed exchange';
  end if;

  arrived_home := case
    when actor_id = exchange_row.member_a_id then exchange_row.home_b_id
    else exchange_row.home_a_id
  end;

  insert into public.arrival_confirmations (
    exchange_id,
    member_id,
    arrived_home_id
  )
  values (target_exchange_id, actor_id, arrived_home)
  on conflict (exchange_id, member_id) do update
    set arrived_home_id = excluded.arrived_home_id
  returning * into confirmation;

  insert into public.audit_events (
    member_id,
    actor_member_id,
    event_type,
    exchange_id
  )
  values (
    actor_id,
    actor_id,
    'exchange.arrival_confirmed',
    target_exchange_id
  );

  if exchange_row.state = 'confirmed' and (
    select count(*)
    from public.arrival_confirmations
    where exchange_id = target_exchange_id
  ) = 2 then
    update public.exchanges
    set state = 'in_progress'
    where id = target_exchange_id;
  end if;

  return confirmation;
end;
$$;

alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.arrival_confirmations enable row level security;

create policy conversations_read_participant
on public.conversations for select
to authenticated
using (
  exists (
    select 1
    from public.exchanges exchanges
    where exchanges.id = conversations.exchange_id
      and (select auth.uid()) in (
        exchanges.member_a_id,
        exchanges.member_b_id
      )
  )
);

create policy messages_read_participant
on public.messages for select
to authenticated
using (
  exists (
    select 1
    from public.conversations conversations
    join public.exchanges exchanges
      on exchanges.id = conversations.exchange_id
    where conversations.id = messages.conversation_id
      and (select auth.uid()) in (
        exchanges.member_a_id,
        exchanges.member_b_id
      )
  )
);

create policy messages_create_as_participant
on public.messages for insert
to authenticated
with check (
  (select auth.uid()) = author_member_id
  and exists (
    select 1
    from public.conversations conversations
    join public.exchanges exchanges
      on exchanges.id = conversations.exchange_id
    where conversations.id = messages.conversation_id
      and (select auth.uid()) in (
        exchanges.member_a_id,
        exchanges.member_b_id
      )
  )
);

create policy messages_mark_received_read
on public.messages for update
to authenticated
using (
  author_member_id <> (select auth.uid())
  and exists (
    select 1
    from public.conversations conversations
    join public.exchanges exchanges
      on exchanges.id = conversations.exchange_id
    where conversations.id = messages.conversation_id
      and (select auth.uid()) in (
        exchanges.member_a_id,
        exchanges.member_b_id
      )
  )
)
with check (
  author_member_id <> (select auth.uid())
);

create policy arrival_confirmations_read_participant
on public.arrival_confirmations for select
to authenticated
using (
  exists (
    select 1
    from public.exchanges exchanges
    where exchanges.id = arrival_confirmations.exchange_id
      and (select auth.uid()) in (
        exchanges.member_a_id,
        exchanges.member_b_id
      )
  )
);

revoke all on public.conversations from anon, authenticated;
revoke all on public.messages from anon, authenticated;
revoke all on public.arrival_confirmations from anon, authenticated;

grant select on public.conversations to authenticated;
grant select, insert, update (read_at) on public.messages to authenticated;
grant select on public.arrival_confirmations to authenticated;
grant execute on function public.confirm_exchange_arrival(uuid)
  to authenticated;

revoke all on function public.create_exchange_conversation() from public;
revoke all on function public.validate_message_author() from public;
revoke all on function public.confirm_exchange_arrival(uuid) from public;
grant execute on function public.confirm_exchange_arrival(uuid)
  to authenticated;

alter publication supabase_realtime add table public.messages;
