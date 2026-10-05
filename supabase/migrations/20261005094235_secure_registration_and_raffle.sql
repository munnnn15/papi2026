-- PAPI: secure public registration and restrict raffle management to whitelisted admins.
-- Run this only after reviewing any existing duplicate phone numbers / ticket codes.

alter table public.participants
  add column if not exists is_winner boolean not null default false,
  add column if not exists is_disqualified boolean not null default false;

-- Store all Indonesian phone numbers in one consistent format so 0812... and +62 812...
-- are treated as the same person.
update public.participants
set phone_number = case
  when regexp_replace(phone_number, '[^0-9]', '', 'g') like '62%'
    then '0' || substring(regexp_replace(phone_number, '[^0-9]', '', 'g') from 3)
  else regexp_replace(phone_number, '[^0-9]', '', 'g')
end
where phone_number is not null;

-- These indexes are intentionally created before public access is restricted. If either
-- statement fails, first resolve the duplicate values reported by PostgreSQL, then rerun.
create unique index if not exists participants_phone_number_unique
  on public.participants (phone_number);

create unique index if not exists participants_unique_code_unique
  on public.participants (unique_code);

create table if not exists public.raffle_admins (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

alter table public.participants enable row level security;
alter table public.participants force row level security;
alter table public.raffle_admins enable row level security;
alter table public.raffle_admins force row level security;

-- Remove all existing participant policies. The policies below are the complete access model.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'participants'
  loop
    execute format('drop policy if exists %I on public.participants', policy_record.policyname);
  end loop;
end;
$$;

revoke all on table public.participants from anon, authenticated;
revoke all on table public.raffle_admins from anon, authenticated;

create or replace function public.is_raffle_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.raffle_admins
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_raffle_admin() from public, anon;
grant execute on function public.is_raffle_admin() to authenticated;

-- Authenticated users can read participant data only if their email is whitelisted.
grant select on table public.participants to authenticated;

create policy "raffle admins can read participants"
on public.participants
for select
to authenticated
using ((select public.is_raffle_admin()));

-- This is the only public registration entry point. It atomically prevents duplicates
-- and generates a high-entropy code; it never returns an existing participant's data.
create or replace function public.register_participant(
  p_full_name text,
  p_phone_number text
)
returns table (
  registration_status text,
  full_name text,
  unique_code text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_name text := btrim(p_full_name);
  normalized_phone text := regexp_replace(coalesce(p_phone_number, ''), '[^0-9]', '', 'g');
  generated_code text;
  inserted_code text;
  attempt integer;
begin
  if normalized_phone like '62%' then
    normalized_phone := '0' || substring(normalized_phone from 3);
  end if;

  if char_length(normalized_name) < 3 or char_length(normalized_name) > 120 then
    raise exception 'Nama lengkap harus berisi 3 sampai 120 karakter.' using errcode = '22023';
  end if;

  if normalized_phone !~ '^0[0-9]{8,14}$' then
    raise exception 'Nomor HP tidak valid.' using errcode = '22023';
  end if;

  for attempt in 1..5 loop
    -- The unique index is the final guarantee against a collision.
    generated_code := 'PAPI-' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 10));

    begin
      insert into public.participants (full_name, phone_number, unique_code)
      values (normalized_name, normalized_phone, generated_code)
      on conflict (phone_number) do nothing
      returning unique_code into inserted_code;
    exception
      when unique_violation then
        -- A very unlikely ticket-code collision: generate another code and retry.
        continue;
    end;

    if found then
      return query select 'created'::text, normalized_name, inserted_code;
      return;
    end if;

    return query select 'already_registered'::text, null::text, null::text;
    return;
  end loop;

  raise exception 'Nomor undian belum dapat dibuat. Silakan coba lagi.';
end;
$$;

revoke all on function public.register_participant(text, text) from public;
grant execute on function public.register_participant(text, text) to anon, authenticated;

-- Winner updates can only happen through this guarded function; the browser cannot
-- update arbitrary participant fields.
create or replace function public.mark_participant_winner(p_participant_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_raffle_admin() then
    raise exception 'Tidak memiliki akses panel undian.' using errcode = '42501';
  end if;

  update public.participants
  set is_winner = true
  where id::text = p_participant_id
    and is_winner = false
    and is_disqualified = false;

  if not found then
    raise exception 'Peserta tidak tersedia untuk diundi.' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.mark_participant_winner(text) from public, anon;
grant execute on function public.mark_participant_winner(text) to authenticated;

-- After creating an Auth user in Dashboard, run this separately with the user's
-- exact lowercase email (the email is deliberately not hard-coded in a migration):
-- insert into public.raffle_admins (email) values ('admin@example.com')
-- on conflict (email) do nothing;
