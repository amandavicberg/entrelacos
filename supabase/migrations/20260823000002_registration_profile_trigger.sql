-- EntreLaços: criação do perfil de domínio durante o cadastro.
-- Aplicar somente por um fluxo autorizado de migration.

create or replace function public.create_profile_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'role';
begin
  if requested_role is null or requested_role not in ('patient', 'professional') then
    raise exception 'O cadastro exige um papel válido';
  end if;

  if nullif(trim(new.raw_user_meta_data ->> 'full_name'), '') is null
    or nullif(trim(new.raw_user_meta_data ->> 'birth_date'), '') is null
    or nullif(trim(new.raw_user_meta_data ->> 'phone'), '') is null then
    raise exception 'O cadastro exige os dados básicos obrigatórios';
  end if;

  if requested_role = 'professional'
    and (
      nullif(trim(new.raw_user_meta_data ->> 'specialty'), '') is null
      or nullif(trim(new.raw_user_meta_data ->> 'registration_type'), '') is null
      or nullif(trim(new.raw_user_meta_data ->> 'registration_number'), '') is null
    ) then
    raise exception 'O cadastro profissional exige os dados de atuação e registro';
  end if;

  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    trim(new.raw_user_meta_data ->> 'full_name'),
    requested_role::public.app_role
  );

  if requested_role = 'patient' then
    insert into public.patient_profiles (id, birth_date, phone)
    values (
      new.id,
      (new.raw_user_meta_data ->> 'birth_date')::date,
      trim(new.raw_user_meta_data ->> 'phone')
    );
  else
    insert into public.professional_profiles (
      id,
      specialty,
      registration_type,
      registration_number
    )
    values (
      new.id,
      trim(new.raw_user_meta_data ->> 'specialty'),
      trim(new.raw_user_meta_data ->> 'registration_type'),
      trim(new.raw_user_meta_data ->> 'registration_number')
    );
  end if;

  return new;
end;
$$;

drop trigger if exists create_profile_from_auth_user on auth.users;

create trigger create_profile_from_auth_user
after insert on auth.users
for each row execute function public.create_profile_from_auth_user();
