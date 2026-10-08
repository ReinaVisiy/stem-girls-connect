-- PREPARE phase: safe to apply alone before the new website code. Existing
-- newsletter INSERT permissions are unchanged here. The campaign receipts
-- migration performs the separate CONTRACT phase after the new endpoint is live.
begin;
create table public.newsletter_rate_buckets (
  fingerprint text primary key check (char_length(fingerprint)=64),
  expires_at timestamptz not null,
  attempts integer not null
);
alter table public.newsletter_rate_buckets enable row level security;
revoke all on public.newsletter_rate_buckets from public,anon,authenticated;
grant all on public.newsletter_rate_buckets to service_role;
create index newsletter_rate_expiry on public.newsletter_rate_buckets(expires_at);
grant insert on public.subscribers to service_role;
do $$ declare seq text; begin
  seq := pg_get_serial_sequence('public.subscribers','id');
  if seq is not null then execute format('grant usage,select on sequence %s to service_role',seq); end if;
end $$;

create function public.newsletter_signup(p_email text,p_fingerprint text) returns boolean
language plpgsql security invoker set search_path='' as $$
declare used integer; normalized text := lower(trim(p_email));
begin
  if normalized is null or char_length(normalized)>254 or normalized !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Invalid email'; end if;
  delete from public.newsletter_rate_buckets where expires_at < now();
  insert into public.newsletter_rate_buckets values(p_fingerprint,now()+interval '15 minutes',1)
  on conflict(fingerprint) do update set attempts=least(public.newsletter_rate_buckets.attempts+1,1000)
  returning attempts into used;
  if used>5 then return false; end if;
  insert into public.subscribers(email) values(normalized) on conflict(email) do nothing;
  return true;
end;
$$;
revoke all on function public.newsletter_signup(text,text) from public,anon,authenticated;
grant execute on function public.newsletter_signup(text,text) to service_role;
create function public.newsletter_backend_ready() returns boolean
language sql stable security invoker set search_path='' as $$
  select to_regclass('public.newsletter_rate_buckets') is not null
    and has_function_privilege(current_user,'public.newsletter_signup(text,text)','EXECUTE');
$$;
revoke all on function public.newsletter_backend_ready() from public,anon,authenticated;
grant execute on function public.newsletter_backend_ready() to service_role;
commit;
