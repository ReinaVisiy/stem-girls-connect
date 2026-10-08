alter table posts add column if not exists share_count integer not null default 0;

create table if not exists post_reactions (
  id bigint generated always as identity primary key,
  post_id bigint not null references posts(id) on delete cascade,
  client_id text not null,
  reaction text not null check (reaction in ('like', 'dislike')),
  created_at timestamptz not null default now(),
  unique (post_id, client_id)
);

alter table post_reactions enable row level security;
-- No direct public policies: all access goes through the SECURITY
-- DEFINER functions below (same pattern as is_admin()), so a visitor
-- can only affect their own reaction row via set_post_reaction, never
-- read or write the table directly.

create or replace function get_post_reaction_summary(p_post_id bigint, p_client_id text)
returns table(likes bigint, dislikes bigint, user_reaction text)
language sql
security definer
stable
as $$
  select
    (select count(*) from post_reactions where post_id = p_post_id and reaction = 'like'),
    (select count(*) from post_reactions where post_id = p_post_id and reaction = 'dislike'),
    (select reaction from post_reactions where post_id = p_post_id and client_id = p_client_id);
$$;

create or replace function set_post_reaction(p_post_id bigint, p_client_id text, p_reaction text)
returns table(likes bigint, dislikes bigint, user_reaction text)
language plpgsql
security definer
as $$
begin
  if p_reaction is null then
    delete from post_reactions where post_id = p_post_id and client_id = p_client_id;
  elsif p_reaction in ('like', 'dislike') then
    insert into post_reactions (post_id, client_id, reaction)
    values (p_post_id, p_client_id, p_reaction)
    on conflict (post_id, client_id) do update set reaction = excluded.reaction, created_at = now();
  else
    raise exception 'invalid reaction: %', p_reaction;
  end if;

  return query select * from get_post_reaction_summary(p_post_id, p_client_id);
end;
$$;

create or replace function increment_share_count(p_post_id bigint)
returns integer
language plpgsql
security definer
as $$
declare
  new_count integer;
begin
  update posts set share_count = share_count + 1 where id = p_post_id
  returning share_count into new_count;
  return new_count;
end;
$$;

grant execute on function get_post_reaction_summary(bigint, text) to anon, authenticated;
grant execute on function set_post_reaction(bigint, text, text) to anon, authenticated;
grant execute on function increment_share_count(bigint) to anon, authenticated;

