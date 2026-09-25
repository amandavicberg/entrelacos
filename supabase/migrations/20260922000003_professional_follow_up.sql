-- EntreLaços: acompanhamento autorizado entre profissional e paciente.
-- Esta migration deve ser aplicada somente por um fluxo autorizado de migration.

create type public.observation_visibility as enum ('professional', 'patient');
create type public.appointment_state as enum ('scheduled', 'cancelled');
create type public.appointment_response as enum ('pending', 'confirmed', 'cancelled');
create type public.material_kind as enum ('ebook', 'podcast', 'video', 'pdf', 'audio', 'other');
create type public.material_source as enum ('external', 'storage');

create table public.professional_observations (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.patient_professional_relationships (id),
  author_id uuid not null references public.professional_profiles (id),
  content text not null check (char_length(trim(content)) between 1 and 5000),
  visibility public.observation_visibility not null default 'professional',
  occurred_at timestamptz not null,
  version integer not null default 1 check (version > 0),
  previous_version_id uuid references public.professional_observations (id),
  status smallint not null default 0 check (status in (0, -1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (relationship_id, version)
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.patient_professional_relationships (id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  appointment_state public.appointment_state not null default 'scheduled',
  patient_response public.appointment_response not null default 'pending',
  cancelled_by uuid references public.profiles (id),
  cancelled_at timestamptz,
  cancellation_reason text check (cancellation_reason is null or char_length(trim(cancellation_reason)) <= 500),
  status smallint not null default 0 check (status in (0, -1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointment_interval_valid check (ends_at > starts_at),
  constraint appointment_cancel_metadata check (
    (appointment_state = 'cancelled' and cancelled_by is not null and cancelled_at is not null)
    or (appointment_state = 'scheduled' and cancelled_by is null and cancelled_at is null and cancellation_reason is null)
  )
);

create table public.appointment_events (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id),
  relationship_id uuid not null references public.patient_professional_relationships (id),
  event_type text not null check (event_type in ('created', 'rescheduled', 'confirmed', 'cancelled')),
  actor_id uuid references public.profiles (id),
  occurred_at timestamptz not null default now(),
  status smallint not null default 0 check (status in (0, -1)),
  created_at timestamptz not null default now()
);

create table public.professional_materials (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professional_profiles (id),
  title text not null check (char_length(trim(title)) between 1 and 160),
  description text check (description is null or char_length(trim(description)) <= 2000),
  kind public.material_kind not null default 'other',
  source public.material_source not null,
  external_url text,
  storage_path text,
  mime_type text,
  size_bytes bigint,
  status smallint not null default 0 check (status in (0, -1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint material_source_location check (
    (source = 'external' and external_url is not null and storage_path is null and mime_type is null and size_bytes is null)
    or (source = 'storage' and external_url is null and storage_path is not null and mime_type is not null and size_bytes is not null)
  ),
  constraint material_storage_size_valid check (size_bytes is null or size_bytes > 0)
);

create table public.patient_material_shares (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.professional_materials (id),
  relationship_id uuid not null references public.patient_professional_relationships (id),
  shared_at timestamptz not null default now(),
  status smallint not null default 0 check (status in (0, -1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (material_id, relationship_id)
);

create index observations_by_relationship_occurred on public.professional_observations (relationship_id, occurred_at desc) where status = 0;
create index appointments_by_relationship_start on public.appointments (relationship_id, starts_at) where status = 0;
create index appointment_events_by_relationship_date on public.appointment_events (relationship_id, occurred_at desc) where status = 0;
create index materials_by_professional on public.professional_materials (professional_id, created_at desc) where status = 0;
create index material_shares_by_relationship on public.patient_material_shares (relationship_id, shared_at desc) where status = 0;

create trigger professional_observations_set_updated_at before update on public.professional_observations for each row execute function public.set_updated_at();
create trigger appointments_set_updated_at before update on public.appointments for each row execute function public.set_updated_at();
create trigger professional_materials_set_updated_at before update on public.professional_materials for each row execute function public.set_updated_at();
create trigger patient_material_shares_set_updated_at before update on public.patient_material_shares for each row execute function public.set_updated_at();

create or replace function public.validate_follow_up_relationship(p_relationship_id uuid, p_professional_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.patient_professional_relationships r
    join public.profiles patient on patient.id = r.patient_id and patient.role = 'patient' and patient.status = 0
    join public.patient_profiles pp on pp.id = r.patient_id and pp.status = 0
    join public.profiles professional on professional.id = r.professional_id and professional.role = 'professional' and professional.status = 0
    join public.professional_profiles pr on pr.id = r.professional_id and pr.status = 0
    where r.id = p_relationship_id and r.professional_id = p_professional_id
      and r.relationship_status = 'active' and r.status = 0
  );
$$;

create or replace function public.record_appointment_event()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.appointment_events (appointment_id, relationship_id, event_type, actor_id)
    values (new.id, new.relationship_id, 'created', null);
  elsif old.appointment_state <> new.appointment_state and new.appointment_state = 'cancelled' then
    insert into public.appointment_events (appointment_id, relationship_id, event_type, actor_id)
    values (new.id, new.relationship_id, 'cancelled', new.cancelled_by);
  elsif old.patient_response <> new.patient_response and new.patient_response = 'confirmed' then
    insert into public.appointment_events (appointment_id, relationship_id, event_type, actor_id)
    values (new.id, new.relationship_id, 'confirmed', null);
  elsif old.starts_at <> new.starts_at or old.ends_at <> new.ends_at then
    insert into public.appointment_events (appointment_id, relationship_id, event_type, actor_id)
    values (new.id, new.relationship_id, 'rescheduled', null);
  end if;
  return new;
end;
$$;
create trigger appointments_record_event after insert or update on public.appointments for each row execute function public.record_appointment_event();

alter table public.professional_observations enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_events enable row level security;
alter table public.professional_materials enable row level security;
alter table public.patient_material_shares enable row level security;

create policy observations_professional_all on public.professional_observations for all to authenticated
using (public.validate_follow_up_relationship(relationship_id, auth.uid()) and author_id = auth.uid())
with check (public.validate_follow_up_relationship(relationship_id, auth.uid()) and author_id = auth.uid());
create policy observations_patient_shared_read on public.professional_observations for select to authenticated
using (visibility = 'patient' and status = 0 and exists (select 1 from public.patient_professional_relationships r where r.id = relationship_id and r.patient_id = auth.uid() and r.relationship_status = 'active' and r.status = 0));
create policy appointments_professional_all on public.appointments for all to authenticated
using (public.validate_follow_up_relationship(relationship_id, auth.uid()))
with check (public.validate_follow_up_relationship(relationship_id, auth.uid()));
create policy appointments_patient_read on public.appointments for select to authenticated
using (status = 0 and exists (select 1 from public.patient_professional_relationships r where r.id = relationship_id and r.patient_id = auth.uid() and r.relationship_status = 'active' and r.status = 0));
create policy appointment_events_participant_read on public.appointment_events for select to authenticated
using (status = 0 and exists (select 1 from public.patient_professional_relationships r where r.id = relationship_id and (r.patient_id = auth.uid() or r.professional_id = auth.uid()) and r.relationship_status = 'active' and r.status = 0));
create policy materials_professional_all on public.professional_materials for all to authenticated using (professional_id = auth.uid() and status = 0) with check (professional_id = auth.uid());
create policy material_shares_professional_all on public.patient_material_shares for all to authenticated using (exists (select 1 from public.professional_materials m where m.id = material_id and m.professional_id = auth.uid() and m.status = 0) and public.validate_follow_up_relationship(relationship_id, auth.uid())) with check (exists (select 1 from public.professional_materials m where m.id = material_id and m.professional_id = auth.uid() and m.status = 0) and public.validate_follow_up_relationship(relationship_id, auth.uid()));
create policy material_shares_patient_read on public.patient_material_shares for select to authenticated using (status = 0 and exists (select 1 from public.patient_professional_relationships r where r.id = relationship_id and r.patient_id = auth.uid() and r.relationship_status = 'active' and r.status = 0));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('professional-materials', 'professional-materials', false, 15728640, array['application/pdf', 'audio/mpeg', 'audio/mp4', 'audio/aac'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy storage_professional_materials_owner_select on storage.objects for select to authenticated using (
  bucket_id = 'professional-materials' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy storage_professional_materials_owner_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'professional-materials' and (storage.foldername(name))[1] = auth.uid()::text
);
