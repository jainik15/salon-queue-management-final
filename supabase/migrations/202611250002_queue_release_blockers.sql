-- Forward-only queue rule fixes. This migration does not rewrite existing queue rows.
-- Waiting positions are recalculated by queue mutations after this migration is applied.

create or replace function public.recalculate_waiting_queue(p_barber_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.queue_entries as entry
  set position = ordered.position,
      estimated_wait = ordered.position * coalesce(barber.avg_duration, 25)
  from (
    select queued.id,
           row_number() over (order by queued.timestamp_joined, queued.id)::integer as position
    from public.queue_entries as queued
    where queued.barber_id = p_barber_id and queued.status = 'waiting'
  ) as ordered
  join public.barbers as barber on barber.id = p_barber_id
  where entry.id = ordered.id;
end;
$$;

create or replace function public.join_queue_with_preference(
  p_customer_name text,
  p_service text,
  p_service_duration integer,
  p_barber_id text,
  p_language text,
  p_join_request_id uuid,
  p_service_ids text[],
  p_any_stylist boolean
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

  -- A retry returns its original pass before any new stylist or token is allocated.
  perform pg_advisory_xact_lock(hashtextextended(p_join_request_id::text, 0));
  select * into v_existing from public.queue_entries where join_request_id = p_join_request_id;
  if found then return to_jsonb(v_existing); end if;

  if p_any_stylist then
    -- Serialize automatic assignments and lock available stations before counting queues.
    perform pg_advisory_xact_lock(hashtextextended('latecuts-any-stylist', 0));
    perform barber.id
    from public.barbers as barber
    where barber.status = 'available'
    order by barber.id
    for update;

    select barber.* into v_barber
    from public.barbers as barber
    left join (
      select queue.barber_id, count(*)::integer as waiting_count
      from public.queue_entries as queue
      where queue.status = 'waiting'
      group by queue.barber_id
    ) as workload on workload.barber_id = barber.id
    where barber.status = 'available'
    order by coalesce(workload.waiting_count, 0), barber.id
    limit 1;
    if not found then
      raise exception 'no_stylist_available' using errcode = '55000';
    end if;
  else
    select * into v_barber from public.barbers where id = p_barber_id for update;
    if not found then raise exception 'barber_not_found' using errcode = '22023'; end if;
    if v_barber.status <> 'available' then
      raise exception 'stylist_unavailable' using errcode = '55000';
    end if;
  end if;

  if coalesce(cardinality(p_service_ids), 0) > 0 then
    v_ids := p_service_ids;
  else
    select array_agg(service.id order by requested.ordinality)
    into v_ids
    from unnest(string_to_array(coalesce(p_service, ''), ' + ')) with ordinality requested(name, ordinality)
    join public.services as service on service.name_en = trim(requested.name) and service.active;
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
    select service.id, service.name_en, service.duration, requested.ordinality
    from requested
    join public.services as service on service.id = requested.id and service.active
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
  from public.queue_entries where barber_id = v_barber.id and status = 'waiting';
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
  perform public.recalculate_waiting_queue(v_barber.id);
  select * into v_entry from public.queue_entries where id = v_entry.id;
  return to_jsonb(v_entry);
end;
$$;

-- Keep the existing RPC signature for existing clients; explicit assignments now reject unavailable stations.
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
language sql
security definer
set search_path = public
as $$
  select public.join_queue_with_preference(
    p_customer_name, p_service, p_service_duration, p_barber_id,
    p_language, p_join_request_id, p_service_ids, false
  );
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
  perform public.recalculate_waiting_queue(p_barber_id);
  return to_jsonb(v_entry);
end;
$$;

create or replace function public.transition_queue_entry(p_entry_id text, p_status text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entry public.queue_entries%rowtype;
  v_barber_id text;
begin
  if p_status not in ('completed', 'absent') then
    raise exception 'transition_invalid' using errcode = '22023';
  end if;
  select barber_id into v_barber_id from public.queue_entries where id = p_entry_id;
  if not found then return null; end if;
  perform 1 from public.barbers where id = v_barber_id for update;
  select * into v_entry from public.queue_entries where id = p_entry_id for update;
  if not found then return null; end if;
  if p_status = 'completed' and v_entry.status <> 'serving' then
    raise exception 'transition_invalid' using errcode = '55000';
  end if;
  if p_status = 'absent' and (
    v_entry.status <> 'serving' or v_entry.timestamp_called is null
    or v_entry.timestamp_called > now() - interval '10 minutes'
  ) then
    raise exception 'no_show_not_ready' using errcode = '55000';
  end if;

  update public.queue_entries
  set status = p_status,
      timestamp_completed = case when p_status = 'completed' then now() else timestamp_completed end
  where id = p_entry_id returning * into v_entry;
  if p_status = 'completed' then
    update public.barbers set served_today = served_today + 1, queue_count = greatest(0, queue_count - 1)
    where id = v_entry.barber_id;
  end if;
  perform public.recalculate_waiting_queue(v_entry.barber_id);
  return to_jsonb(v_entry);
end;
$$;

-- Reception removal of a waiting entry remains separate from the timed no-show action.
create or replace function public.remove_waiting_queue_entry(p_entry_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entry public.queue_entries%rowtype;
  v_barber_id text;
begin
  select barber_id into v_barber_id from public.queue_entries where id = p_entry_id;
  if not found then return null; end if;
  perform 1 from public.barbers where id = v_barber_id for update;
  select * into v_entry from public.queue_entries where id = p_entry_id for update;
  if not found then return null; end if;
  if v_entry.status <> 'waiting' then
    raise exception 'waiting_entry_not_removable' using errcode = '55000';
  end if;
  update public.queue_entries set status = 'absent' where id = p_entry_id returning * into v_entry;
  perform public.recalculate_waiting_queue(v_entry.barber_id);
  return to_jsonb(v_entry);
end;
$$;

create or replace function public.cancel_queue_entry(p_public_access_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entry public.queue_entries%rowtype;
  v_barber_id text;
begin
  select barber_id into v_barber_id
  from public.queue_entries where public_access_token = p_public_access_token;
  if not found then return null; end if;
  perform 1 from public.barbers where id = v_barber_id for update;
  select * into v_entry from public.queue_entries
  where public_access_token = p_public_access_token for update;
  if not found then return null; end if;
  if v_entry.status not in ('waiting', 'serving') then
    raise exception 'cancellation_not_available' using errcode = '55000';
  end if;
  update public.queue_entries set status = 'absent'
  where id = v_entry.id returning * into v_entry;
  perform public.recalculate_waiting_queue(v_entry.barber_id);
  return to_jsonb(v_entry);
end;
$$;

revoke all on function public.recalculate_waiting_queue(text) from public, anon, authenticated;
revoke all on function public.join_queue_with_preference(text, text, integer, text, text, uuid, text[], boolean) from public, anon, authenticated;
revoke all on function public.join_queue(text, text, integer, text, text, uuid, text[]) from public, anon, authenticated;
revoke all on function public.call_next_queue_entry(text) from public, anon, authenticated;
revoke all on function public.transition_queue_entry(text, text) from public, anon, authenticated;
revoke all on function public.remove_waiting_queue_entry(text) from public, anon, authenticated;
revoke all on function public.cancel_queue_entry(uuid) from public, anon, authenticated;

grant execute on function public.recalculate_waiting_queue(text) to service_role;
grant execute on function public.join_queue_with_preference(text, text, integer, text, text, uuid, text[], boolean) to service_role;
grant execute on function public.join_queue(text, text, integer, text, text, uuid, text[]) to service_role;
grant execute on function public.call_next_queue_entry(text) to service_role;
grant execute on function public.transition_queue_entry(text, text) to service_role;
grant execute on function public.remove_waiting_queue_entry(text) to service_role;
grant execute on function public.cancel_queue_entry(uuid) to service_role;
