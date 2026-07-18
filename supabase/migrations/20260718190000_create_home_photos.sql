-- First-class home photos. Objects remain private and are authorized through
-- the owning/published home rather than public bucket URLs.

create table public.home_photos (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  storage_path text not null unique
    check (storage_path <> '' and storage_path !~ '(^|/)\.\.(/|$)'),
  alt_text text not null check (char_length(alt_text) between 1 and 300),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  unique (home_id, sort_order)
);

create index home_photos_home_order_idx
  on public.home_photos(home_id, sort_order);

alter table public.home_photos enable row level security;

create policy home_photos_read_published_or_own
on public.home_photos for select
to anon, authenticated
using (
  exists (
    select 1 from public.homes
    where homes.id = home_photos.home_id
      and (
        homes.publication_state = 'published'
        or homes.owner_member_id = (select auth.uid())
      )
  )
);

create policy home_photos_manage_own
on public.home_photos for all
to authenticated
using (
  exists (
    select 1 from public.homes
    where homes.id = home_photos.home_id
      and homes.owner_member_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.homes
    where homes.id = home_photos.home_id
      and homes.owner_member_id = (select auth.uid())
  )
);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'home-images',
  'home-images',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy home_images_insert_own
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'home-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1 from public.homes
    where homes.id::text = (storage.foldername(name))[2]
      and homes.owner_member_id = (select auth.uid())
  )
);

create policy home_images_read_visible_or_own
on storage.objects for select
to anon, authenticated
using (
  bucket_id = 'home-images'
  and (
    owner_id = (select auth.uid())::text
    or exists (
      select 1
      from public.home_photos
      join public.homes on homes.id = home_photos.home_id
      where home_photos.storage_path = objects.name
        and homes.publication_state = 'published'
    )
  )
);

create policy home_images_update_own
on storage.objects for update
to authenticated
using (
  bucket_id = 'home-images'
  and owner_id = (select auth.uid())::text
)
with check (
  bucket_id = 'home-images'
  and owner_id = (select auth.uid())::text
);

create policy home_images_delete_own
on storage.objects for delete
to authenticated
using (
  bucket_id = 'home-images'
  and owner_id = (select auth.uid())::text
);

create or replace function public.enforce_home_publication()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.publication_state = 'published'
    and old.publication_state is distinct from 'published'
    and not exists (
      select 1 from public.home_photos where home_id = new.id
    )
  then
    raise exception 'a home requires at least one photo before publication';
  end if;
  return new;
end;
$$;

create trigger homes_enforce_publication
before update of publication_state on public.homes
for each row execute function public.enforce_home_publication();

revoke all on public.home_photos from anon, authenticated;
grant select on public.home_photos to anon, authenticated;
grant insert, update, delete on public.home_photos to authenticated;
revoke all on function public.enforce_home_publication() from public;

-- Replace a complete tour graph in one database transaction after the client
-- has uploaded its private scene images.
create or replace function public.replace_home_tour(
  target_home_id uuid,
  tour_title text,
  start_scene uuid,
  scenes jsonb,
  connections jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  target_tour_id uuid;
  scene jsonb;
  connection jsonb;
begin
  if actor_id is null or not exists (
    select 1 from public.homes
    where id = target_home_id and owner_member_id = actor_id
  ) then
    raise exception 'home not found';
  end if;
  if char_length(trim(tour_title)) not between 1 and 120 then
    raise exception 'invalid tour title';
  end if;
  if jsonb_typeof(scenes) <> 'array'
    or jsonb_array_length(scenes) < 1
    or jsonb_array_length(scenes) > 50
    or jsonb_typeof(connections) <> 'array'
    or jsonb_array_length(connections) > 250
  then
    raise exception 'invalid tour graph size';
  end if;

  insert into public.home_tours (home_id, title)
  values (target_home_id, trim(tour_title))
  on conflict (home_id) do update set
    title = excluded.title,
    start_scene_id = null,
    publication_state = 'draft',
    updated_at = now()
  returning id into target_tour_id;

  delete from public.home_tour_connections where tour_id = target_tour_id;
  delete from public.home_tour_scenes where tour_id = target_tour_id;

  for scene in select value from jsonb_array_elements(scenes)
  loop
    insert into public.home_tour_scenes (
      id, tour_id, storage_path, name, image_alt, sort_order
    ) values (
      (scene ->> 'id')::uuid,
      target_tour_id,
      scene ->> 'storagePath',
      trim(scene ->> 'name'),
      trim(scene ->> 'imageAlt'),
      (scene ->> 'sortOrder')::integer
    );
  end loop;

  if not exists (
    select 1 from public.home_tour_scenes
    where id = start_scene and tour_id = target_tour_id
  ) then
    raise exception 'start scene does not belong to tour';
  end if;

  for connection in select value from jsonb_array_elements(connections)
  loop
    insert into public.home_tour_connections (
      id, tour_id, from_scene_id, to_scene_id,
      label, position_x, position_y
    ) values (
      (connection ->> 'id')::uuid,
      target_tour_id,
      (connection ->> 'fromSceneId')::uuid,
      (connection ->> 'toSceneId')::uuid,
      trim(connection ->> 'label'),
      (connection ->> 'positionX')::numeric,
      (connection ->> 'positionY')::numeric
    );
  end loop;

  update public.home_tours
  set start_scene_id = start_scene, updated_at = now()
  where id = target_tour_id;

  return target_tour_id;
end;
$$;

revoke all on function public.replace_home_tour(uuid, text, uuid, jsonb, jsonb)
  from public;
grant execute
  on function public.replace_home_tour(uuid, text, uuid, jsonb, jsonb)
  to authenticated;
