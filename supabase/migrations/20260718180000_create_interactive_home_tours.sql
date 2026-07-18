-- Interactive tours belong to an existing home. Tour images are private
-- Storage objects; database rows store paths rather than public URLs.

create table public.home_tours (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null unique references public.homes(id) on delete cascade,
  title text not null default 'Home tour'
    check (char_length(title) between 1 and 120),
  start_scene_id uuid,
  publication_state text not null default 'draft'
    check (publication_state in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.home_tour_scenes (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.home_tours(id) on delete cascade,
  storage_path text not null unique
    check (storage_path <> '' and storage_path !~ '(^|/)\.\.(/|$)'),
  name text not null check (char_length(name) between 1 and 80),
  image_alt text not null check (char_length(image_alt) between 1 and 500),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, tour_id),
  unique (tour_id, sort_order)
);

alter table public.home_tours
  add constraint home_tours_start_scene_fkey
  foreign key (start_scene_id, id)
  references public.home_tour_scenes(id, tour_id)
  deferrable initially deferred;

create table public.home_tour_connections (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.home_tours(id) on delete cascade,
  from_scene_id uuid not null,
  to_scene_id uuid not null,
  label text not null check (char_length(label) between 1 and 120),
  position_x numeric(5,2) not null check (position_x between 0 and 100),
  position_y numeric(5,2) not null check (position_y between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (from_scene_id, tour_id)
    references public.home_tour_scenes(id, tour_id) on delete cascade,
  foreign key (to_scene_id, tour_id)
    references public.home_tour_scenes(id, tour_id) on delete cascade,
  check (from_scene_id <> to_scene_id),
  unique (from_scene_id, to_scene_id)
);

create index home_tour_scenes_tour_order_idx
  on public.home_tour_scenes(tour_id, sort_order);
create index home_tour_connections_from_idx
  on public.home_tour_connections(tour_id, from_scene_id);
create index home_tour_connections_to_idx
  on public.home_tour_connections(tour_id, to_scene_id);

alter table public.home_tours enable row level security;
alter table public.home_tour_scenes enable row level security;
alter table public.home_tour_connections enable row level security;

create policy home_tours_read_published_or_own
on public.home_tours for select
to anon, authenticated
using (
  (
    publication_state = 'published'
    and exists (
      select 1 from public.homes
      where homes.id = home_tours.home_id
        and homes.publication_state = 'published'
    )
  )
  or exists (
    select 1 from public.homes
    where homes.id = home_tours.home_id
      and homes.owner_member_id = (select auth.uid())
  )
);

create policy home_tours_insert_own
on public.home_tours for insert
to authenticated
with check (
  exists (
    select 1 from public.homes
    where homes.id = home_tours.home_id
      and homes.owner_member_id = (select auth.uid())
  )
);

create policy home_tours_update_own
on public.home_tours for update
to authenticated
using (
  exists (
    select 1 from public.homes
    where homes.id = home_tours.home_id
      and homes.owner_member_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.homes
    where homes.id = home_tours.home_id
      and homes.owner_member_id = (select auth.uid())
  )
);

create policy home_tours_delete_own
on public.home_tours for delete
to authenticated
using (
  exists (
    select 1 from public.homes
    where homes.id = home_tours.home_id
      and homes.owner_member_id = (select auth.uid())
  )
);

create policy home_tour_scenes_read_visible_tour
on public.home_tour_scenes for select
to anon, authenticated
using (
  exists (
    select 1 from public.home_tours
    where home_tours.id = home_tour_scenes.tour_id
  )
);

create policy home_tour_scenes_manage_own
on public.home_tour_scenes for all
to authenticated
using (
  exists (
    select 1
    from public.home_tours
    join public.homes on homes.id = home_tours.home_id
    where home_tours.id = home_tour_scenes.tour_id
      and homes.owner_member_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.home_tours
    join public.homes on homes.id = home_tours.home_id
    where home_tours.id = home_tour_scenes.tour_id
      and homes.owner_member_id = (select auth.uid())
  )
);

create policy home_tour_connections_read_visible_tour
on public.home_tour_connections for select
to anon, authenticated
using (
  exists (
    select 1 from public.home_tours
    where home_tours.id = home_tour_connections.tour_id
  )
);

create policy home_tour_connections_manage_own
on public.home_tour_connections for all
to authenticated
using (
  exists (
    select 1
    from public.home_tours
    join public.homes on homes.id = home_tours.home_id
    where home_tours.id = home_tour_connections.tour_id
      and homes.owner_member_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.home_tours
    join public.homes on homes.id = home_tours.home_id
    where home_tours.id = home_tour_connections.tour_id
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
  'home-tour-images',
  'home-tour-images',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy home_tour_images_insert_own
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'home-tour-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1 from public.homes
    where homes.id::text = (storage.foldername(name))[2]
      and homes.owner_member_id = (select auth.uid())
  )
);

create policy home_tour_images_read_visible_or_own
on storage.objects for select
to anon, authenticated
using (
  bucket_id = 'home-tour-images'
  and (
    owner_id = (select auth.uid())::text
    or exists (
      select 1
      from public.homes
      join public.home_tours on home_tours.home_id = homes.id
      join public.home_tour_scenes
        on home_tour_scenes.tour_id = home_tours.id
      where homes.id::text = (storage.foldername(objects.name))[2]
        and home_tour_scenes.storage_path = objects.name
        and homes.publication_state = 'published'
        and home_tours.publication_state = 'published'
    )
  )
);

create policy home_tour_images_update_own
on storage.objects for update
to authenticated
using (
  bucket_id = 'home-tour-images'
  and owner_id = (select auth.uid())::text
)
with check (
  bucket_id = 'home-tour-images'
  and owner_id = (select auth.uid())::text
);

create policy home_tour_images_delete_own
on storage.objects for delete
to authenticated
using (
  bucket_id = 'home-tour-images'
  and owner_id = (select auth.uid())::text
);
