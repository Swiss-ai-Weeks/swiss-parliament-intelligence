create table public.civic_user_items (
 user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check(kind in ('follow','conversation','preference','brief','saved','profile')),
 id text not null check(length(id) between 1 and 200), payload jsonb not null default '{}'::jsonb,
 updated_at timestamptz not null default now(), primary key(user_id,kind,id));
alter table public.civic_user_items enable row level security;
create policy own_items on public.civic_user_items for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.civic_user_items to authenticated;
revoke all on public.civic_user_items from anon;
