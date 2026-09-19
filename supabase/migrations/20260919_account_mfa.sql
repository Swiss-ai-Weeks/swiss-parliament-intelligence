create schema if not exists private;
grant usage on schema private to authenticated;
create or replace function private.pilot_account_assurance() returns boolean language sql stable security definer set search_path = '' as $$
 select auth.uid() is not null and (coalesce(auth.jwt()->>'aal','aal1') = 'aal2' or not exists (select 1 from auth.mfa_factors f where f.user_id=auth.uid() and f.status='verified'));
$$;
revoke all on function private.pilot_account_assurance() from public, anon;
grant execute on function private.pilot_account_assurance() to authenticated;
create policy require_enrolled_mfa on public.civic_user_items as restrictive for all to authenticated using ((select private.pilot_account_assurance())) with check ((select private.pilot_account_assurance()));
