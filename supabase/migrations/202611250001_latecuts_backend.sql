-- LateCuts authoritative backend schema.
-- Apply only after taking a verified Supabase backup and reviewing the target project.
-- This migration does not import or delete queue/customer records. Existing customer
-- fields remain untouched; it assigns a random pass-token column to legacy rows.

create extension if not exists pgcrypto;

create table if not exists public.barbers (
  id text primary key,
  name text not null,
  specialty text not null default '',
  status text not null default 'available' check (status in ('available', 'break', 'offline')),
  avatar text not null default '',
  queue_count integer not null default 0 check (queue_count >= 0),
  served_today integer not null default 0 check (served_today >= 0),
  avg_duration integer not null default 25 check (avg_duration > 0)
);

alter table public.barbers add column if not exists specialty text not null default '';
alter table public.barbers add column if not exists status text not null default 'available';
alter table public.barbers add column if not exists avatar text not null default '';
alter table public.barbers add column if not exists queue_count integer not null default 0;
alter table public.barbers add column if not exists served_today integer not null default 0;
alter table public.barbers add column if not exists avg_duration integer not null default 25;

create table if not exists public.services (
  id text primary key,
  name_en text not null unique,
  name_gu text not null,
  icon text not null default '',
  duration integer not null check (duration > 0),
  price integer not null check (price >= 0),
  sort_order smallint not null default 0,
  active boolean not null default true
);
alter table public.services add column if not exists sort_order smallint not null default 0;

insert into public.services (id, name_en, name_gu, icon, duration, price, sort_order) values
  ('classic-cut', 'Classic Cut', 'ક્લાસિક કટ', '✂️', 25, 199, 1),
  ('beard-sculpt', 'Beard Sculpt', 'બીયર્ડ સ્કલ્પ્ટ', '🧔', 20, 149, 2),
  ('royal-fade', 'Fade', 'ફેડ', '💈', 35, 299, 3),
  ('kids-cut', 'Kids Cut', 'કિડ્સ કટ', '🧒', 20, 149, 4),
  ('head-spa', 'Hair Spa', 'હેર સ્પા', '🌿', 45, 149, 5),
  ('bridal', 'D-Tan', 'ડી-ટેન', '✨', 90, 300, 6)
on conflict (id) do update set
  name_en = excluded.name_en,
  name_gu = excluded.name_gu,
  icon = excluded.icon,
  duration = excluded.duration,
  price = excluded.price,
  sort_order = excluded.sort_order,
  active = true;

-- Keep the original stylist IDs so existing foreign keys and queue references remain valid.
insert into public.barbers (id, name, specialty, status, avatar, queue_count, served_today, avg_duration) values
  ('zara', 'Ramesh', 'D-Tan & Hair Spa', 'available', 'R', 0, 0, 32),
  ('marcus', 'Vinod', 'Fade & Classic', 'available', 'V', 0, 0, 28),
  ('dev', 'Arjun', 'Beard & Kids', 'break', 'A', 0, 0, 25)
on conflict (id) do nothing;

create table if not exists public.queue_entries (
  id text primary key,
  token text not null unique,
  customer_name text not null,
  service text not null,
  service_duration integer not null default 25 check (service_duration > 0),
  barber_id text not null references public.barbers(id),
  barber_name text not null,
  status text not null default 'waiting' check (status in ('waiting', 'serving', 'completed', 'absent', 'expired')),
  position integer not null default 1 check (position >= 0),
  timestamp_joined timestamptz not null default now(),
  timestamp_called timestamptz,
  timestamp_completed timestamptz,
  estimated_wait integer not null default 0 check (estimated_wait >= 0),
  language text not null default 'en' check (language in ('en', 'gu')),
  service_ids text[] not null default '{}',
  public_access_token uuid not null default gen_random_uuid() unique,
  join_request_id uuid
);

alter table public.queue_entries add column if not exists service_ids text[] not null default '{}';
alter table public.queue_entries add column if not exists public_access_token uuid default gen_random_uuid();
alter table public.queue_entries add column if not exists join_request_id uuid;
alter table public.queue_entries alter column public_access_token set default gen_random_uuid();
update public.queue_entries set public_access_token = gen_random_uuid() where public_access_token is null;
alter table public.queue_entries alter column public_access_token set not null;

create unique index if not exists queue_entries_public_access_token_uidx
  on public.queue_entries (public_access_token);
create unique index if not exists queue_entries_token_uidx
  on public.queue_entries (token);
create unique index if not exists queue_entries_join_request_id_uidx
  on public.queue_entries (join_request_id) where join_request_id is not null;
create unique index if not exists queue_entries_one_serving_per_barber_uidx
  on public.queue_entries (barber_id) where status = 'serving';
create index if not exists queue_entries_active_barber_time_idx
  on public.queue_entries (barber_id, timestamp_joined) where status in ('waiting', 'serving');
create index if not exists queue_entries_status_joined_idx
  on public.queue_entries (status, timestamp_joined desc);

create table if not exists public.salon_state (
  singleton boolean primary key default true check (singleton),
  token_counter bigint not null default 1 check (token_counter > 0),
  updated_at timestamptz not null default now()
);
insert into public.salon_state (singleton, token_counter)
select true, coalesce(max((regexp_match(token, '([0-9]+)$'))[1]::bigint), 0) + 1
from public.queue_entries
on conflict (singleton) do update set
  token_counter = greatest(public.salon_state.token_counter, excluded.token_counter),
  updated_at = now();

create table if not exists public.salon_settings (
  singleton boolean primary key default true check (singleton),
  opening_time time not null default '09:00',
  closing_time time not null default '21:00',
  timezone text not null default 'Asia/Kolkata',
  updated_at timestamptz not null default now()
);
insert into public.salon_settings (singleton) values (true)
on conflict (singleton) do nothing;

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  queue_entry_id text unique references public.queue_entries(id) on delete cascade,
  token text not null,
  customer_name text not null,
  barber_id text not null references public.barbers(id),
  barber_name text not null,
  service text not null,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  aspects jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists reviews_created_at_idx on public.reviews (created_at desc);
create index if not exists reviews_barber_created_idx on public.reviews (barber_id, created_at desc);

-- Remove the legacy policies that allowed anonymous full queue reads and updates.
drop policy if exists "Public Read Barbers" on public.barbers;
drop policy if exists "Public Update Barbers" on public.barbers;
drop policy if exists "Public Read Queue" on public.queue_entries;
drop policy if exists "Public Insert Queue" on public.queue_entries;
drop policy if exists "Public Update Queue" on public.queue_entries;

-- These tables are accessed only by the trusted API. Remove any additional policies
-- left over from the optional client-side schema so anon/authenticated roles have no path.
do $$
declare existing_policy record;
begin
  for existing_policy in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('barbers', 'services', 'queue_entries', 'salon_state', 'salon_settings', 'reviews')
  loop
    execute format('drop policy %I on %I.%I', existing_policy.policyname, existing_policy.schemaname, existing_policy.tablename);
  end loop;
end;
$$;

alter table public.barbers enable row level security;
alter table public.services enable row level security;
alter table public.queue_entries enable row level security;
alter table public.salon_state enable row level security;
alter table public.salon_settings enable row level security;
alter table public.reviews enable row level security;

-- There are intentionally no anon/authenticated policies. All data access goes through
-- the trusted Node API using the backend-only service-role key.
revoke all on public.barbers, public.services, public.queue_entries,
  public.salon_state, public.salon_settings, public.reviews from public, anon, authenticated;
grant all on public.barbers, public.services, public.queue_entries,
  public.salon_state, public.salon_settings, public.reviews to service_role;

create or replace function public.join_queue(
  p_customer_name text,
  p_service text,
  p_service_duration integer,
  p_barber_id text,
  p_language text,
  p_join_request_id uuid,
  p_service_ids text[] default '{}'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.queue_entries%rowtype;
  v_barber public.barbers%rowtype;
  v_entry public.queue_entries%rowtype;
  v_ids text[];
  v_name text;
  v_duration integer;
  v_count integer;
  v_position integer;
  v_counter bigint;
begin
  if length(trim(coalesce(p_customer_name, ''))) = 0 or length(trim(p_customer_name)) > 80 then
    raise exception 'customer_name_invalid' using errcode = '22023';
  end if;
  if p_join_request_id is null then
    raise exception 'join_request_id_required' using errcode = '22023';
  end if;
  if p_language not in ('en', 'gu') then
    raise exception 'language_invalid' using errcode = '22023';
  end if;

  -- Serialize retries with the same client request key before looking up its result.
  perform pg_advisory_xact_lock(hashtextextended(p_join_request_id::text, 0));
  select * into v_existing from public.queue_entries where join_request_id = p_join_request_id;
  if found then return to_jsonb(v_existing); end if;

  select * into v_barber from public.barbers where id = p_barber_id for update;
  if not found then raise exception 'barber_not_found' using errcode = '22023'; end if;

  if coalesce(cardinality(p_service_ids), 0) > 0 then
    v_ids := p_service_ids;
  else
    select array_agg(s.id order by requested.ordinality)
    into v_ids
    from unnest(string_to_array(coalesce(p_service, ''), ' + ')) with ordinality requested(name, ordinality)
    join public.services s on s.name_en = trim(requested.name) and s.active;
  end if;

  if coalesce(cardinality(v_ids), 0) = 0 then
    raise exception 'service_selection_invalid' using errcode = '22023';
  end if;
  if cardinality(v_ids) <> (select count(distinct requested.id) from unnest(v_ids) requested(id)) then
    raise exception 'service_selection_invalid' using errcode = '22023';
  end if;

  with requested as (
    select item.id, item.ordinality
    from unnest(v_ids) with ordinality item(id, ordinality)
  ), selected as (
    select s.id, s.name_en, s.duration, requested.ordinality
    from requested join public.services s on s.id = requested.id and s.active
  )
  select count(*)::integer, sum(selected.duration)::integer,
         string_agg(selected.name_en, ' + ' order by selected.ordinality)
  into v_count, v_duration, v_name
  from selected;

  if v_count <> cardinality(v_ids) or v_count > 6 or v_duration is null then
    raise exception 'service_selection_invalid' using errcode = '22023';
  end if;
  if p_service_duration is not null and p_service_duration <> v_duration then
    raise exception 'service_duration_invalid' using errcode = '22023';
  end if;

  select count(*)::integer + 1 into v_position
  from public.queue_entries where barber_id = p_barber_id and status = 'waiting';
  select token_counter into v_counter from public.salon_state where singleton = true for update;
  if not found then raise exception 'salon_state_missing' using errcode = '55000'; end if;

  insert into public.queue_entries (
    id, token, customer_name, service, service_duration, barber_id, barber_name,
    status, position, timestamp_joined, estimated_wait, language, service_ids,
    public_access_token, join_request_id
  ) values (
    'entry-' || gen_random_uuid()::text,
    'LX-' || lpad(v_counter::text, 2, '0'),
    trim(p_customer_name), v_name, v_duration, v_barber.id, v_barber.name,
    'waiting', v_position, now(), v_position * coalesce(v_barber.avg_duration, 25),
    p_language, v_ids, gen_random_uuid(), p_join_request_id
  ) returning * into v_entry;

  update public.salon_state set token_counter = v_counter + 1, updated_at = now() where singleton = true;
  update public.barbers set queue_count = queue_count + 1 where id = v_barber.id;
  select * into v_entry from public.queue_entries where id = v_entry.id;
  return to_jsonb(v_entry);
end;
$$;

create or replace function public.call_next_queue_entry(p_barber_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_entry public.queue_entries%rowtype;
begin
  perform 1 from public.barbers where id = p_barber_id for update;
  if not found then raise exception 'barber_not_found' using errcode = '22023'; end if;
  if exists (select 1 from public.queue_entries where barber_id = p_barber_id and status = 'serving') then
    raise exception 'barber_already_serving' using errcode = '55000';
  end if;
  select * into v_entry from public.queue_entries
  where barber_id = p_barber_id and status = 'waiting'
  order by timestamp_joined, id for update skip locked limit 1;
  if not found then return null; end if;
  update public.queue_entries set status = 'serving', timestamp_called = now()
  where id = v_entry.id returning * into v_entry;
  return to_jsonb(v_entry);
end;
$$;

create or replace function public.transition_queue_entry(p_entry_id text, p_status text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_entry public.queue_entries%rowtype;
begin
  if p_status not in ('completed', 'absent') then
    raise exception 'transition_invalid' using errcode = '22023';
  end if;
  select * into v_entry from public.queue_entries where id = p_entry_id for update;
  if not found then return null; end if;
  if v_entry.status not in ('waiting', 'serving') then
    raise exception 'transition_invalid' using errcode = '55000';
  end if;
  if p_status = 'completed' and v_entry.status <> 'serving' then
    raise exception 'transition_invalid' using errcode = '55000';
  end if;
  update public.queue_entries
  set status = p_status,
      timestamp_completed = case when p_status = 'completed' then now() else timestamp_completed end
  where id = p_entry_id returning * into v_entry;
  if p_status = 'completed' then
    update public.barbers set served_today = served_today + 1, queue_count = greatest(0, queue_count - 1)
    where id = v_entry.barber_id;
  end if;
  return to_jsonb(v_entry);
end;
$$;

create or replace function public.set_barber_status(p_barber_id text, p_status text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_barber public.barbers%rowtype;
begin
  if p_status not in ('available', 'break', 'offline') then
    raise exception 'barber_status_invalid' using errcode = '22023';
  end if;
  update public.barbers set status = p_status where id = p_barber_id returning * into v_barber;
  if not found then return null; end if;
  return to_jsonb(v_barber);
end;
$$;

create or replace function public.cancel_queue_entry(p_public_access_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_entry public.queue_entries%rowtype;
begin
  select * into v_entry from public.queue_entries
  where public_access_token = p_public_access_token for update;
  if not found then return null; end if;
  if v_entry.status not in ('waiting', 'serving') then
    raise exception 'cancellation_not_available' using errcode = '55000';
  end if;
  update public.queue_entries set status = 'absent'
  where id = v_entry.id returning * into v_entry;
  return to_jsonb(v_entry);
end;
$$;

create or replace function public.submit_queue_feedback(
  p_public_access_token uuid,
  p_rating smallint,
  p_comment text,
  p_aspects jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_entry public.queue_entries%rowtype; v_review public.reviews%rowtype;
begin
  if p_rating < 1 or p_rating > 5 or length(coalesce(p_comment, '')) > 2000 then
    raise exception 'feedback_invalid' using errcode = '22023';
  end if;
  select * into v_entry from public.queue_entries
  where public_access_token = p_public_access_token;
  if not found or v_entry.status <> 'completed' then
    raise exception 'feedback_entry_unavailable' using errcode = '55000';
  end if;
  insert into public.reviews (queue_entry_id, token, customer_name, barber_id, barber_name, service, rating, comment, aspects)
  values (v_entry.id, v_entry.token, v_entry.customer_name, v_entry.barber_id, v_entry.barber_name,
          v_entry.service, p_rating, nullif(trim(coalesce(p_comment, '')), ''), coalesce(p_aspects, '{}'::jsonb))
  on conflict (queue_entry_id) do update set rating = excluded.rating, comment = excluded.comment,
    aspects = excluded.aspects, created_at = now()
  returning * into v_review;
  return to_jsonb(v_review);
end;
$$;

-- Sample reset is intentionally a staging-only administrative action. The API additionally
-- blocks it in production unless explicitly enabled in a non-production environment.
create or replace function public.reset_latecuts_sample_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  lock table public.queue_entries, public.reviews, public.barbers, public.salon_state in access exclusive mode;
  delete from public.reviews;
  delete from public.queue_entries;
  update public.barbers set status = 'available', queue_count = 0, served_today = 0;
  insert into public.queue_entries (
    id, token, customer_name, service, service_duration, barber_id, barber_name,
    status, position, timestamp_joined, timestamp_called, estimated_wait, language, service_ids
  ) values
    ('1', 'LX-01', 'Priya', 'Fade', 35, 'zara', 'Ramesh', 'serving', 0, now() - interval '40 minutes', now() - interval '5 minutes', 0, 'en', array['royal-fade']),
    ('2', 'LX-02', 'Rahul', 'Classic Cut', 25, 'marcus', 'Vinod', 'serving', 0, now() - interval '35 minutes', now() - interval '8 minutes', 0, 'en', array['classic-cut']),
    ('3', 'LX-03', 'Aisha', 'Hair Spa', 45, 'zara', 'Ramesh', 'waiting', 1, now() - interval '25 minutes', null, 32, 'en', array['head-spa']),
    ('4', 'LX-04', 'Kabir', 'Beard Sculpt', 20, 'marcus', 'Vinod', 'waiting', 1, now() - interval '20 minutes', null, 28, 'en', array['beard-sculpt']),
    ('5', 'LX-05', 'Meera', 'Kids Cut', 20, 'dev', 'Arjun', 'waiting', 1, now() - interval '15 minutes', null, 25, 'en', array['kids-cut']),
    ('6', 'LX-06', 'Arjun', 'Fade', 35, 'zara', 'Ramesh', 'waiting', 2, now() - interval '10 minutes', null, 64, 'en', array['royal-fade']),
    ('7', 'LX-07', 'Nisha', 'Classic Cut', 25, 'marcus', 'Vinod', 'waiting', 2, now() - interval '5 minutes', null, 56, 'en', array['classic-cut']);
  insert into public.reviews (token, customer_name, barber_id, barber_name, service, rating, comment, aspects, created_at) values
    ('LX-00', 'Aditi V.', 'zara', 'Ramesh', 'Hair Spa', 5, 'A relaxing Hair Spa visit.', '{"waitTime":true,"styling":true,"ambiance":true}', now() - interval '45 minutes'),
    ('LX-00b', 'Rohan K.', 'marcus', 'Vinod', 'Fade', 5, 'A clean, precise Fade.', '{"waitTime":true,"styling":true,"ambiance":true}', now() - interval '90 minutes'),
    ('LX-00c', 'Tanvi M.', 'dev', 'Arjun', 'Beard Sculpt', 4, 'A gentle and precise service.', '{"waitTime":true,"styling":true,"ambiance":true}', now() - interval '140 minutes'),
    ('LX-00d', 'Siddharth P.', 'marcus', 'Vinod', 'Classic Cut', 5, 'A smooth salon visit.', '{"waitTime":true,"styling":true,"ambiance":true}', now() - interval '210 minutes');
  update public.barbers set
    status = case id when 'dev' then 'break' else 'available' end,
    queue_count = case id when 'zara' then 2 when 'marcus' then 2 else 1 end,
    served_today = 0
  where id in ('zara', 'marcus', 'dev');
  update public.salon_state set token_counter = 8, updated_at = now() where singleton = true;
end;
$$;

revoke all on function public.join_queue(text, text, integer, text, text, uuid, text[]) from public, anon, authenticated;
revoke all on function public.call_next_queue_entry(text) from public, anon, authenticated;
revoke all on function public.transition_queue_entry(text, text) from public, anon, authenticated;
revoke all on function public.set_barber_status(text, text) from public, anon, authenticated;
revoke all on function public.cancel_queue_entry(uuid) from public, anon, authenticated;
revoke all on function public.submit_queue_feedback(uuid, smallint, text, jsonb) from public, anon, authenticated;
revoke all on function public.reset_latecuts_sample_data() from public, anon, authenticated;
grant execute on function public.join_queue(text, text, integer, text, text, uuid, text[]) to service_role;
grant execute on function public.call_next_queue_entry(text) to service_role;
grant execute on function public.transition_queue_entry(text, text) to service_role;
grant execute on function public.set_barber_status(text, text) to service_role;
grant execute on function public.cancel_queue_entry(uuid) to service_role;
grant execute on function public.submit_queue_feedback(uuid, smallint, text, jsonb) to service_role;
grant execute on function public.reset_latecuts_sample_data() to service_role;
