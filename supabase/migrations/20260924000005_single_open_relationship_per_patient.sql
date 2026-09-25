-- EntreLaços: primeira versão do TCC permite somente um vínculo aberto por paciente.
-- Aplicar somente pelo fluxo autorizado de migrations.

drop index if exists public.one_open_relationship_per_pair;

create unique index one_open_relationship_per_patient
  on public.patient_professional_relationships (patient_id)
  where status = 0 and relationship_status in ('pending', 'active');

create or replace function public.consume_patient_invite(p_patient_id uuid, p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  selected_invite public.professional_invites%rowtype;
  created_relationship public.patient_professional_relationships%rowtype;
  normalized_code text := upper(trim(p_code));
begin
  if normalized_code = '' or char_length(normalized_code) > 64 then
    raise exception using errcode = 'P0001', message = 'invalid_invite';
  end if;

  if not exists (
    select 1
    from public.profiles p
    join public.patient_profiles pp on pp.id = p.id and pp.status = 0
    where p.id = p_patient_id and p.role = 'patient' and p.status = 0
  ) then
    raise exception using errcode = 'P0001', message = 'invalid_patient';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_patient_id::text, 0));

  if exists (
    select 1
    from public.patient_professional_relationships relationship
    where relationship.patient_id = p_patient_id
      and relationship.status = 0
      and relationship.relationship_status in ('pending', 'active')
  ) then
    raise exception using errcode = 'P0001', message = 'relationship_exists';
  end if;

  select invitation.* into selected_invite
  from public.professional_invites invitation
  where invitation.code_digest = encode(digest(normalized_code, 'sha256'), 'hex')
    and invitation.status = 0
    and invitation.used_at is null
    and invitation.revoked_at is null
    and invitation.expires_at > now()
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'invalid_invite';
  end if;

  insert into public.patient_professional_relationships (
    patient_id, professional_id, invite_id, relationship_status
  ) values (
    p_patient_id, selected_invite.professional_id, selected_invite.id, 'pending'
  ) returning * into created_relationship;

  update public.professional_invites set used_at = now() where id = selected_invite.id;

  return jsonb_build_object(
    'id', created_relationship.id,
    'status', created_relationship.relationship_status,
    'requestedAt', created_relationship.requested_at
  );
end;
$$;

revoke all on function public.consume_patient_invite(uuid, text) from public;
revoke all on function public.consume_patient_invite(uuid, text) from anon;
revoke all on function public.consume_patient_invite(uuid, text) from authenticated;
grant execute on function public.consume_patient_invite(uuid, text) to service_role;

comment on function public.consume_patient_invite(uuid, text) is
  'Consome um convite e cria uma única associação aberta por paciente; uso exclusivo do backend.';
