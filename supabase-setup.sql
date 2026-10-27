-- Album Ledger: cloud sync table. Run once in Supabase → SQL Editor.
create table if not exists public.ledger (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('album','meta')),
  id text not null,
  data jsonb,
  deleted boolean not null default false,
  srv_at timestamptz not null default now(),
  primary key (user_id, kind, id)
);
create index if not exists ledger_user_srv on public.ledger (user_id, srv_at);
alter table public.ledger enable row level security;
drop policy if exists "own rows" on public.ledger;
create policy "own rows" on public.ledger for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create or replace function public.ledger_touch() returns trigger language plpgsql as $$
begin new.srv_at := now(); return new; end $$;
drop trigger if exists ledger_touch on public.ledger;
create trigger ledger_touch before insert or update on public.ledger
  for each row execute function public.ledger_touch();
