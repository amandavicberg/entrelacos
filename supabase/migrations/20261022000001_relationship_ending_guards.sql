-- Serialize ending a relationship with scheduling, using the existing professional
-- advisory lock. No rows are removed and no read policies are broadened.
create or replace function public.guard_relationship_ending()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.relationship_status = 'ended' and old.relationship_status <> 'ended' then
    if old.relationship_status <> 'active' then
      raise exception using errcode = '23514', message = 'relationship_not_active';
    end if;
    perform pg_advisory_xact_lock(hashtextextended(old.professional_id::text, 0));
    if exists (
      select 1 from public.appointments a
      where a.relationship_id = old.id and a.status = 0
        and a.appointment_state = 'scheduled' and a.ends_at >= now()
    ) then
      raise exception using errcode = '23514', message = 'relationship_has_upcoming_appointments';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists relationships_guard_ending on public.patient_professional_relationships;
create trigger relationships_guard_ending
before update of relationship_status on public.patient_professional_relationships
for each row execute function public.guard_relationship_ending();

create or replace function public.guard_appointment_overlap()
returns trigger language plpgsql set search_path = public as $$
declare v_professional_id uuid;
begin
  if new.status <> 0 or new.appointment_state <> 'scheduled' then return new; end if;
  select r.professional_id into v_professional_id
  from public.patient_professional_relationships r where r.id = new.relationship_id;
  if v_professional_id is null then raise exception 'Vínculo não encontrado.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_professional_id::text, 0));
  -- Recheck after acquiring the scheduling lock: ending may have committed
  -- while this appointment was waiting for it.
  if not exists (
    select 1 from public.patient_professional_relationships r
    where r.id = new.relationship_id and r.status = 0 and r.relationship_status = 'active'
  ) then
    raise exception using errcode = '23514', message = 'relationship_not_active';
  end if;
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
