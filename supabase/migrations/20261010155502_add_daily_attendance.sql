-- Keep one identity and one raffle code per person, while recording attendance
-- independently for each event day.
create table if not exists public.participant_attendances (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  event_date date not null check (event_date in (date '2026-10-10', date '2026-10-11')),
  created_at timestamptz not null default now(),
  unique (participant_id, event_date)
);

create index if not exists participant_attendances_event_date_participant_id_idx
  on public.participant_attendances (event_date, participant_id);

alter table public.participant_attendances enable row level security;
alter table public.participant_attendances force row level security;

revoke all on table public.participant_attendances from anon, authenticated;
grant select on table public.participant_attendances to authenticated;

create policy "raffle admins can read attendance"
on public.participant_attendances
for select
to authenticated
using (public.is_raffle_admin());

-- All registrations already recorded before this change belong to Day 1.
insert into public.participant_attendances (participant_id, event_date)
select id, date '2026-10-10'
from public.participants
on conflict (participant_id, event_date) do nothing;

create or replace function public.register_participant(
  p_full_name text,
  p_phone_number text,
  p_event_date date
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
  participant_record record;
  attendance_created boolean := false;
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

  if p_event_date not in (date '2026-10-10', date '2026-10-11') then
    raise exception 'Tanggal kehadiran tidak tersedia.' using errcode = '22023';
  end if;

  select participant.id, participant.full_name, participant.unique_code
  into participant_record
  from public.participants as participant
  where participant.phone_number = normalized_phone;

  if not found then
    for attempt in 1..5 loop
      generated_code := 'PAPI-' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));

      begin
        insert into public.participants as participant (full_name, phone_number, unique_code)
        values (normalized_name, normalized_phone, generated_code)
        on conflict (phone_number) do nothing
        returning participant.id, participant.full_name, participant.unique_code
        into participant_record;
      exception
        when unique_violation then
          continue;
      end;

      exit when found;
    end loop;

    if participant_record.id is null then
      -- Another request may have registered the same phone at the same time.
      select participant.id, participant.full_name, participant.unique_code
      into participant_record
      from public.participants as participant
      where participant.phone_number = normalized_phone;
    end if;
  end if;

  if participant_record.id is null then
    raise exception 'Nomor undian belum dapat dibuat. Silakan coba lagi.';
  end if;

  insert into public.participant_attendances (participant_id, event_date)
  values (participant_record.id, p_event_date)
  on conflict (participant_id, event_date) do nothing;

  attendance_created := found;

  return query
  select
    case when attendance_created then 'created' else 'already_registered_for_day' end,
    participant_record.full_name,
    participant_record.unique_code;
end;
$$;

revoke all on function public.register_participant(text, text, date) from public;
grant execute on function public.register_participant(text, text, date) to anon, authenticated;

-- Keep the currently deployed frontend safe during the short deployment window.
create or replace function public.register_participant(
  p_full_name text,
  p_phone_number text
)
returns table (
  registration_status text,
  full_name text,
  unique_code text
)
language sql
security definer
set search_path = ''
as $$
  select *
  from public.register_participant(
    p_full_name,
    p_phone_number,
    (now() at time zone 'Asia/Jakarta')::date
  );
$$;

revoke all on function public.register_participant(text, text) from public;
grant execute on function public.register_participant(text, text) to anon, authenticated;
