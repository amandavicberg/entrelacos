-- Agenda semanal e reserva pelo paciente. Aplicar somente pelo fluxo autorizado de migrations.

create table public.professional_availability (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professional_profiles (id),
  weekday smallint not null check (weekday between 0 and 6),
  start_minute smallint not null check (start_minute between 0 and 1439),
  end_minute smallint not null check (end_minute between 1 and 1440),
  slot_minutes smallint not null check (slot_minutes in (30, 45, 60)),
  status smallint not null default 0 check (status in (0, -1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint availability_window_valid check (end_minute > start_minute and end_minute - start_minute >= slot_minutes)
);

create index professional_availability_by_weekday
  on public.professional_availability (professional_id, weekday, start_minute)
  where status = 0;

create trigger professional_availability_set_updated_at
before update on public.professional_availability
for each row execute function public.set_updated_at();

create or replace function public.guard_professional_availability()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.status <> 0 then return new; end if;
  perform pg_advisory_xact_lock(hashtextextended(new.professional_id::text || ':' || new.weekday::text, 0));
  if exists (
    select 1 from public.professional_availability other
    where other.professional_id = new.professional_id
      and other.weekday = new.weekday and other.status = 0 and other.id <> new.id
      and other.start_minute < new.end_minute and new.start_minute < other.end_minute
  ) then
    raise exception using errcode = '23P01', message = 'Horários de atendimento sobrepostos.';
  end if;
  return new;
end;
$$;

create trigger professional_availability_no_overlap
before insert or update on public.professional_availability
for each row execute function public.guard_professional_availability();

alter table public.professional_availability enable row level security;

create policy availability_select_participant on public.professional_availability
for select to authenticated using (
  status = 0 and (
    (professional_id = auth.uid() and exists (
      select 1 from public.profiles p
      join public.professional_profiles pr on pr.id = p.id and pr.status = 0
      where p.id = auth.uid() and p.role = 'professional' and p.status = 0
    ))
    or exists (
      select 1 from public.patient_professional_relationships r
      join public.profiles patient on patient.id = r.patient_id and patient.role = 'patient' and patient.status = 0
      join public.patient_profiles pp on pp.id = patient.id and pp.status = 0
      join public.profiles professional on professional.id = r.professional_id and professional.role = 'professional' and professional.status = 0
      join public.professional_profiles pr on pr.id = professional.id and pr.status = 0
      where r.professional_id = professional_availability.professional_id
        and r.patient_id = auth.uid() and r.relationship_status = 'active' and r.status = 0
    )
  )
);

-- Uma trava por profissional serializa escritas concorrentes antes da verificação de conflito.
-- Consultas antigas permanecem preservadas; novas reservas não podem sobrepor nenhuma ativa.
create or replace function public.guard_appointment_overlap()
returns trigger language plpgsql set search_path = public as $$
declare v_professional_id uuid;
begin
  if new.status <> 0 or new.appointment_state <> 'scheduled' then return new; end if;
  select r.professional_id into v_professional_id
  from public.patient_professional_relationships r where r.id = new.relationship_id;
  if v_professional_id is null then raise exception 'Vínculo não encontrado.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_professional_id::text, 0));
  if exists (
    select 1 from public.appointments other
    join public.patient_professional_relationships r on r.id = other.relationship_id
    where r.professional_id = v_professional_id and other.id <> new.id
      and other.status = 0 and other.appointment_state = 'scheduled'
      and other.starts_at < new.ends_at and new.starts_at < other.ends_at
  ) then
    raise exception using errcode = '23P01', message = 'Horário indisponível.';
  end if;
  return new;
end;
$$;

create trigger appointments_no_overlap
before insert or update on public.appointments
for each row execute function public.guard_appointment_overlap();

create or replace function public.list_patient_available_slots(
  p_patient_id uuid, p_from_date date, p_until_date date
)
returns table (starts_at timestamptz, ends_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare v_professional_id uuid;
begin
  if p_from_date is null or p_until_date is null or p_from_date > p_until_date
    or p_from_date < (now() at time zone 'America/Sao_Paulo')::date
    or p_until_date > (now() at time zone 'America/Sao_Paulo')::date + 60 then
    raise exception 'Intervalo de datas inválido.';
  end if;
  select r.professional_id into v_professional_id
  from public.patient_professional_relationships r
  join public.profiles p on p.id = r.patient_id and p.role = 'patient' and p.status = 0
  join public.patient_profiles pp on pp.id = p.id and pp.status = 0
  join public.profiles professional on professional.id = r.professional_id and professional.role = 'professional' and professional.status = 0
  join public.professional_profiles pr on pr.id = professional.id and pr.status = 0
  where r.patient_id = p_patient_id and r.relationship_status = 'active' and r.status = 0;
  if v_professional_id is null then raise exception 'Vínculo ativo não encontrado.'; end if;

  return query
  with candidate as (
    select ((days.day::date + make_interval(mins => slots.minute)) at time zone 'America/Sao_Paulo') as slot_start,
      a.slot_minutes as duration
    from generate_series(p_from_date, p_until_date, interval '1 day') as days(day)
    join public.professional_availability a
      on a.professional_id = v_professional_id and a.status = 0
      and a.weekday = extract(dow from days.day)::integer
    cross join lateral generate_series(a.start_minute::integer, (a.end_minute - a.slot_minutes)::integer, a.slot_minutes::integer) as slots(minute)
  )
  select c.slot_start, c.slot_start + make_interval(mins => c.duration)
  from candidate c
  where c.slot_start > now() + interval '1 hour'
    and not exists (
      select 1 from public.appointments booked
      join public.patient_professional_relationships r on r.id = booked.relationship_id
      where r.professional_id = v_professional_id
        and booked.status = 0 and booked.appointment_state = 'scheduled'
        and booked.starts_at < c.slot_start + make_interval(mins => c.duration)
        and c.slot_start < booked.ends_at
    )
  order by c.slot_start;
end;
$$;

revoke all on function public.list_patient_available_slots(uuid, date, date) from public, anon, authenticated;
grant execute on function public.list_patient_available_slots(uuid, date, date) to service_role;

create or replace function public.book_patient_appointment(
  p_patient_id uuid, p_starts_at timestamptz, p_ends_at timestamptz
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_relationship_id uuid;
  v_professional_id uuid;
  v_local_start timestamp;
  v_minute integer;
  v_appointment_id uuid;
begin
  if p_starts_at is null or p_ends_at is null or p_starts_at <= now() + interval '1 hour'
    or (p_starts_at at time zone 'America/Sao_Paulo')::date
      > (now() at time zone 'America/Sao_Paulo')::date + 60
    or p_ends_at <= p_starts_at then
    raise exception 'Horário inválido ou fora do prazo.';
  end if;
  select r.id, r.professional_id into v_relationship_id, v_professional_id
  from public.patient_professional_relationships r
  join public.profiles p on p.id = r.patient_id and p.role = 'patient' and p.status = 0
  join public.patient_profiles pp on pp.id = p.id and pp.status = 0
  join public.profiles professional on professional.id = r.professional_id and professional.role = 'professional' and professional.status = 0
  join public.professional_profiles pr on pr.id = professional.id and pr.status = 0
  where r.patient_id = p_patient_id and r.relationship_status = 'active' and r.status = 0;
  if v_relationship_id is null then raise exception 'Vínculo ativo não encontrado.'; end if;

  v_local_start := p_starts_at at time zone 'America/Sao_Paulo';
  v_minute := extract(hour from v_local_start)::integer * 60 + extract(minute from v_local_start)::integer;
  if extract(second from v_local_start) <> 0 or not exists (
    select 1 from public.professional_availability a
    where a.professional_id = v_professional_id and a.status = 0
      and a.weekday = extract(dow from v_local_start)::integer
      and v_minute >= a.start_minute
      and v_minute + a.slot_minutes <= a.end_minute
      and (v_minute - a.start_minute) % a.slot_minutes = 0
      and p_ends_at = p_starts_at + make_interval(mins => a.slot_minutes)
  ) then raise exception 'Esse horário não está disponível.'; end if;

  insert into public.appointments (relationship_id, starts_at, ends_at, patient_response)
  values (v_relationship_id, p_starts_at, p_ends_at, 'confirmed')
  returning id into v_appointment_id;
  return v_appointment_id;
end;
$$;

revoke all on function public.book_patient_appointment(uuid, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.book_patient_appointment(uuid, timestamptz, timestamptz) to service_role;
