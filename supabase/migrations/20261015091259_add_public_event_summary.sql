-- Public aggregate only: this function never exposes participant identities.
create or replace function public.get_event_summary()
returns table (
  day_1_check_ins bigint,
  day_2_check_ins bigint,
  combined_unique_participants bigint,
  total_check_ins bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    count(*) filter (where attendance.event_date = date '2026-10-10')::bigint,
    count(*) filter (where attendance.event_date = date '2026-10-11')::bigint,
    count(distinct attendance.participant_id)::bigint,
    count(*)::bigint
  from public.participant_attendances as attendance;
$$;

revoke all on function public.get_event_summary() from public;
grant execute on function public.get_event_summary() to anon, authenticated;
