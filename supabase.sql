-- Ejecuta en Supabase > SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  tracking_code text not null unique check (tracking_code ~ '^OUT-[A-F0-9]{8}-[A-F0-9]{4}$'),
  answers jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.survey_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.survey_responses enable row level security;
alter table public.survey_admins enable row level security;

-- Permite que la política de respuestas detecte si la cuenta autenticada está autorizada.
drop policy if exists "Admins can see their own admin record" on public.survey_admins;
create policy "Admins can see their own admin record"
  on public.survey_admins for select to authenticated
  using (user_id = (select auth.uid()));

-- Cualquier visitante puede enviar su encuesta. Solo una cuenta listada abajo puede leer respuestas.
drop policy if exists "Public can submit survey" on public.survey_responses;
create policy "Public can submit survey"
  on public.survey_responses for insert to anon, authenticated
  with check (true);

drop policy if exists "Admins can read survey responses" on public.survey_responses;
create policy "Admins can read survey responses"
  on public.survey_responses for select to authenticated
  using (exists (select 1 from public.survey_admins a where a.user_id = (select auth.uid())));

-- No se conceden permisos de lectura pública ni edición/borrado a los visitantes.
revoke all on public.survey_responses from anon, authenticated;
grant insert on public.survey_responses to anon, authenticated;
grant select on public.survey_responses to authenticated;
revoke all on public.survey_admins from anon, authenticated;
grant select on public.survey_admins to authenticated;

-- CÓMO AUTORIZAR ADMIN:
-- 1) Crea un usuario en Supabase > Authentication > Users (Add user).
-- 2) Copia su UUID y ejecuta, sustituyendo el valor:
-- insert into public.survey_admins (user_id) values ('UUID-DEL-USUARIO-ADMIN');
