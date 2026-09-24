-- EntreLaços: conteúdo privado enviado pelo paciente e mensagem de aniversário.
-- Aplicar somente por fluxo autorizado de migrations.

create type public.patient_document_kind as enum ('exam', 'report', 'diagnosis', 'other');
create type public.patient_feeling as enum ('calm', 'happy', 'tired', 'anxious', 'sad', 'other');

create table public.patient_documents (
  id uuid primary key,
  relationship_id uuid not null references public.patient_professional_relationships (id),
  patient_id uuid not null references public.patient_profiles (id),
  title text not null check (char_length(trim(title)) between 1 and 160),
  document_kind public.patient_document_kind not null default 'other',
  storage_path text not null unique,
  mime_type text not null check (mime_type = 'application/pdf'),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  status smallint not null default 0 check (status in (0, -1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.patient_messages (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.patient_professional_relationships (id),
  author_id uuid not null references public.patient_profiles (id),
  content text not null check (char_length(trim(content)) between 1 and 2000),
  status smallint not null default 0 check (status in (0, -1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.patient_check_ins (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.patient_professional_relationships (id),
  author_id uuid not null references public.patient_profiles (id),
  feeling public.patient_feeling not null,
  note text check (note is null or char_length(trim(note)) <= 500),
  status smallint not null default 0 check (status in (0, -1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.professional_birthday_messages (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null unique references public.patient_professional_relationships (id),
  author_id uuid not null references public.professional_profiles (id),
  content text not null check (char_length(trim(content)) between 1 and 1000),
  status smallint not null default 0 check (status in (0, -1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index patient_documents_by_relationship on public.patient_documents (relationship_id, created_at desc) where status = 0;
create index patient_messages_by_relationship on public.patient_messages (relationship_id, created_at desc) where status = 0;
create index patient_check_ins_by_relationship on public.patient_check_ins (relationship_id, created_at desc) where status = 0;

create trigger patient_documents_set_updated_at before update on public.patient_documents for each row execute function public.set_updated_at();
create trigger patient_messages_set_updated_at before update on public.patient_messages for each row execute function public.set_updated_at();
create trigger patient_check_ins_set_updated_at before update on public.patient_check_ins for each row execute function public.set_updated_at();
create trigger professional_birthday_messages_set_updated_at before update on public.professional_birthday_messages for each row execute function public.set_updated_at();

alter table public.patient_documents enable row level security;
alter table public.patient_messages enable row level security;
alter table public.patient_check_ins enable row level security;
alter table public.professional_birthday_messages enable row level security;

create policy patient_documents_patient_read on public.patient_documents for select to authenticated
using (patient_id = auth.uid() and exists (select 1 from public.patient_professional_relationships r where r.id = relationship_id and r.patient_id = auth.uid() and r.relationship_status = 'active' and r.status = 0));
create policy patient_documents_patient_insert on public.patient_documents for insert to authenticated
with check (patient_id = auth.uid() and exists (select 1 from public.patient_professional_relationships r where r.id = relationship_id and r.patient_id = auth.uid() and r.relationship_status = 'active' and r.status = 0));
create policy patient_documents_professional_read on public.patient_documents for select to authenticated
using (exists (select 1 from public.patient_professional_relationships r where r.id = relationship_id and r.professional_id = auth.uid() and r.relationship_status = 'active' and r.status = 0));

create policy patient_messages_patient_read on public.patient_messages for select to authenticated
using (author_id = auth.uid() and exists (select 1 from public.patient_professional_relationships r where r.id = relationship_id and r.patient_id = auth.uid() and r.relationship_status = 'active' and r.status = 0));
create policy patient_messages_patient_insert on public.patient_messages for insert to authenticated
with check (author_id = auth.uid() and exists (select 1 from public.patient_professional_relationships r where r.id = relationship_id and r.patient_id = auth.uid() and r.relationship_status = 'active' and r.status = 0));
create policy patient_messages_professional_read on public.patient_messages for select to authenticated
using (exists (select 1 from public.patient_professional_relationships r where r.id = relationship_id and r.professional_id = auth.uid() and r.relationship_status = 'active' and r.status = 0));

create policy patient_check_ins_patient_read on public.patient_check_ins for select to authenticated
using (author_id = auth.uid() and exists (select 1 from public.patient_professional_relationships r where r.id = relationship_id and r.patient_id = auth.uid() and r.relationship_status = 'active' and r.status = 0));
create policy patient_check_ins_patient_insert on public.patient_check_ins for insert to authenticated
with check (author_id = auth.uid() and exists (select 1 from public.patient_professional_relationships r where r.id = relationship_id and r.patient_id = auth.uid() and r.relationship_status = 'active' and r.status = 0));
create policy patient_check_ins_professional_read on public.patient_check_ins for select to authenticated
using (exists (select 1 from public.patient_professional_relationships r where r.id = relationship_id and r.professional_id = auth.uid() and r.relationship_status = 'active' and r.status = 0));

create policy birthday_messages_professional_all on public.professional_birthday_messages for all to authenticated
using (author_id = auth.uid() and public.validate_follow_up_relationship(relationship_id, auth.uid()))
with check (author_id = auth.uid() and public.validate_follow_up_relationship(relationship_id, auth.uid()));
create policy birthday_messages_patient_read on public.professional_birthday_messages for select to authenticated
using (status = 0 and exists (select 1 from public.patient_professional_relationships r where r.id = relationship_id and r.patient_id = auth.uid() and r.relationship_status = 'active' and r.status = 0));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('patient-documents', 'patient-documents', false, 10485760, array['application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy storage_patient_documents_owner_select on storage.objects for select to authenticated
using (bucket_id = 'patient-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy storage_patient_documents_owner_insert on storage.objects for insert to authenticated
with check (bucket_id = 'patient-documents' and (storage.foldername(name))[1] = auth.uid()::text);
