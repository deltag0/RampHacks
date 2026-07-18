-- Idempotent fictional showcase inventory for the local/development project.
-- This intentionally fails unless exactly one active member is named Kelvin.

do $$
declare
  kelvin_id uuid;
begin
  select (array_agg(id order by id))[1]
  into kelvin_id
  from public.members
  where lower(display_name) = 'kelvin'
    and lifecycle_state = 'active'
  having count(*) = 1;

  if kelvin_id is null then
    raise exception
      'demo seed requires exactly one active member with display_name Kelvin';
  end if;

  insert into public.regions (id, slug, name, country_code, timezone)
  values
    ('10000000-0000-4000-8000-000000000001', 'lisbon-portugal-demo', 'Lisbon', 'PT', 'Europe/Lisbon'),
    ('10000000-0000-4000-8000-000000000002', 'kyoto-japan-demo', 'Kyoto', 'JP', 'Asia/Tokyo'),
    ('10000000-0000-4000-8000-000000000003', 'quebec-city-canada-demo', 'Québec City', 'CA', 'America/Toronto'),
    ('10000000-0000-4000-8000-000000000004', 'cape-town-south-africa-demo', 'Cape Town', 'ZA', 'Africa/Johannesburg'),
    ('10000000-0000-4000-8000-000000000005', 'copenhagen-denmark-demo', 'Copenhagen', 'DK', 'Europe/Copenhagen'),
    ('10000000-0000-4000-8000-000000000006', 'bariloche-argentina-demo', 'Bariloche', 'AR', 'America/Argentina/Salta')
  on conflict (id) do update set
    slug = excluded.slug,
    name = excluded.name,
    country_code = excluded.country_code,
    timezone = excluded.timezone;

  insert into public.homes (
    id, owner_member_id, region_id, title, approximate_location, capacity,
    property_type, amenities, accessibility_features, house_rules,
    publication_state
  )
  values
    (
      '20000000-0000-4000-8000-000000000001', kelvin_id,
      '10000000-0000-4000-8000-000000000001',
      'Fictional sunlit flat by the tiled lanes', 'Central Lisbon', 2,
      'Apartment', array['Workspace', 'Washer', 'Bikes'],
      array['Lift access', 'Step-free entrance'],
      array['No smoking', 'Quiet hours after 22:00'], 'published'
    ),
    (
      '20000000-0000-4000-8000-000000000002', kelvin_id,
      '10000000-0000-4000-8000-000000000002',
      'Fictional machiya-inspired garden home', 'Northern Kyoto', 4,
      'Townhouse', array['Garden', 'Workspace', 'Washer'],
      array['Ground-floor bedroom'],
      array['No outdoor shoes indoors', 'No parties'], 'published'
    ),
    (
      '20000000-0000-4000-8000-000000000003', kelvin_id,
      '10000000-0000-4000-8000-000000000003',
      'Fictional stone cottage near the old walls', 'Old Québec area', 6,
      'Cottage', array['Parking', 'Washer', 'Fireplace'],
      array['Handrail at entrance'],
      array['No smoking', 'Pets by agreement'], 'published'
    ),
    (
      '20000000-0000-4000-8000-000000000004', kelvin_id,
      '10000000-0000-4000-8000-000000000004',
      'Fictional hillside villa with ocean views', 'Atlantic Seaboard area', 8,
      'Villa', array['Pool', 'Parking', 'Garden', 'Workspace'],
      array['Step-free main floor', 'Accessible shower'],
      array['Pool supervision required', 'No events'], 'published'
    ),
    (
      '20000000-0000-4000-8000-000000000005', kelvin_id,
      '10000000-0000-4000-8000-000000000005',
      'Fictional design loft beside the canals', 'Inner Copenhagen', 3,
      'Loft', array['Bikes', 'Workspace', 'Washer'],
      array['Lift access'],
      array['No smoking', 'Bikes must be locked'], 'published'
    ),
    (
      '20000000-0000-4000-8000-000000000006', kelvin_id,
      '10000000-0000-4000-8000-000000000006',
      'Fictional lake-and-mountain family house', 'Bariloche lake district', 5,
      'House', array['Parking', 'Garden', 'Washer', 'Fireplace'],
      array['Single-level living area'],
      array['No smoking', 'Fireplace instructions must be followed'], 'published'
    )
  on conflict (id) do update set
    owner_member_id = excluded.owner_member_id,
    region_id = excluded.region_id,
    title = excluded.title,
    approximate_location = excluded.approximate_location,
    capacity = excluded.capacity,
    property_type = excluded.property_type,
    amenities = excluded.amenities,
    accessibility_features = excluded.accessibility_features,
    house_rules = excluded.house_rules,
    publication_state = excluded.publication_state,
    updated_at = now();

  delete from public.home_availability
  where home_id::text like '20000000-0000-4000-8000-%';

  insert into public.home_availability (
    home_id, starts_on, ends_on, minimum_nights
  )
  values
    ('20000000-0000-4000-8000-000000000001', '2026-09-05', '2026-09-26', 5),
    ('20000000-0000-4000-8000-000000000001', '2027-04-10', '2027-05-08', 7),
    ('20000000-0000-4000-8000-000000000002', '2026-10-12', '2026-11-02', 7),
    ('20000000-0000-4000-8000-000000000003', '2026-12-18', '2027-01-08', 4),
    ('20000000-0000-4000-8000-000000000004', '2027-02-01', '2027-03-15', 10),
    ('20000000-0000-4000-8000-000000000005', '2027-05-20', '2027-06-12', 4),
    ('20000000-0000-4000-8000-000000000006', '2027-01-10', '2027-02-20', 7),
    ('20000000-0000-4000-8000-000000000006', '2027-07-01', '2027-07-31', 10);
end
$$;
