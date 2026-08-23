-- EntreLaços: identidade, perfis, convites e associações.
-- Esta migration deve ser aplicada somente por um fluxo autorizado de migration.

create type public.app_role as enum ('patient', 'professional');

create type public.relationship_status as enum (
  'pending',
  'active',
  'rejected',
  'ended',
  'cancelled'
);

create table public.profiles (
  id uuid primary key references auth.users (id),
  full_name text not null check (char_length(trim(full_name)) between 1 and 160),
  role public.app_role not null,
  status smallint not null default 0 check (status in (0, -1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.patient_profiles (
  id uuid primary key references public.profiles (id),
  birth_date date,
  phone text,
  care_type text check (care_type in ('in_person', 'online', 'hybrid')),
  patient_history text,
  patient_reflection text,
  status smallint not null default 0 check (status in (0, -1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.professional_profiles (
  id uuid primary key references public.profiles (id),
  specialty text,
  registration_type text,
  registration_number text,
  status smallint not null default 0 check (status in (0, -1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint professional_registration_pair_unique
    unique (registration_type, registration_number)
);

create table public.professional_invites (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professional_profiles (id),
  code_digest text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  revoked_at timestamptz,
  status smallint not null default 0 check (status in (0, -1)),
  created_at timestamptz not null default now(),
  constraint professional_invite_id_professional_unique
    unique (id, professional_id),
  constraint invite_expiration_after_creation
    check (expires_at > created_at),
  constraint invite_cannot_be_used_and_revoked
    check (not (used_at is not null and revoked_at is not null))
);

create table public.patient_professional_relationships (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patient_profiles (id),
  professional_id uuid not null references public.professional_profiles (id),
  invite_id uuid,
  relationship_status public.relationship_status not null default 'pending',
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  ended_at timestamptz,
  status smallint not null default 0 check (status in (0, -1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint relationship_invite_fk
    foreign key (invite_id, professional_id)
    references public.professional_invites (id, professional_id),
  constraint relationship_approval_date_required
    check (relationship_status <> 'active' or approved_at is not null),
  constraint relationship_end_date_required
    check (relationship_status <> 'ended' or ended_at is not null)
);

create unique index one_open_relationship_per_pair
  on public.patient_professional_relationships (patient_id, professional_id)
  where status = 0 and relationship_status in ('pending', 'active');

create index patient_relationships_by_professional
  on public.patient_professional_relationships (professional_id, relationship_status)
  where status = 0;

create index professional_invites_by_professional
  on public.professional_invites (professional_id, expires_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger patient_profiles_set_updated_at
before update on public.patient_profiles
for each row execute function public.set_updated_at();

create trigger professional_profiles_set_updated_at
before update on public.professional_profiles
for each row execute function public.set_updated_at();

create trigger relationships_set_updated_at
before update on public.patient_professional_relationships
for each row execute function public.set_updated_at();

create or replace function public.validate_patient_profile_role()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1 from public.profiles
    where id = new.id and role = 'patient'
  ) then
    raise exception 'patient_profiles exige um perfil patient';
  end if;
  return new;
end;
$$;

create or replace function public.validate_professional_profile_role()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1 from public.profiles
    where id = new.id and role = 'professional'
  ) then
    raise exception 'professional_profiles exige um perfil professional';
  end if;
  return new;
end;
$$;

create trigger patient_profiles_validate_role
before insert or update on public.patient_profiles
for each row execute function public.validate_patient_profile_role();

create trigger professional_profiles_validate_role
before insert or update on public.professional_profiles
for each row execute function public.validate_professional_profile_role();

alter table public.profiles enable row level security;
alter table public.patient_profiles enable row level security;
alter table public.professional_profiles enable row level security;
alter table public.professional_invites enable row level security;
alter table public.patient_professional_relationships enable row level security;

create policy profiles_select_own
  on public.profiles for select
  to authenticated
  using (id = auth.uid() and status = 0);

create policy patient_profiles_select_own
  on public.patient_profiles for select
  to authenticated
  using (id = auth.uid() and status = 0);

create policy professional_profiles_select_own
  on public.professional_profiles for select
  to authenticated
  using (id = auth.uid() and status = 0);

create policy invites_select_own_professional
  on public.professional_invites for select
  to authenticated
  using (professional_id = auth.uid() and status = 0);

create policy relationships_select_as_participant
  on public.patient_professional_relationships for select
  to authenticated
  using (
    status = 0
    and (patient_id = auth.uid() or professional_id = auth.uid())
  );
