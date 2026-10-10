alter table public.participants
  add column if not exists winner_selected_at timestamptz;

create index if not exists participants_winner_selected_at_idx
  on public.participants (winner_selected_at desc)
  where is_winner = true;

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
  set
    is_winner = true,
    winner_selected_at = now()
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
