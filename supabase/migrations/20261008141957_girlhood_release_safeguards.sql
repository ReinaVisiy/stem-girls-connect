begin;
-- Fail rather than silently rewriting existing program records.
alter table public.programs add constraint girlhood_canonical_slug
  check ((page_template = 'girlhood') = (slug = 'girlhood'));
create unique index programs_one_girlhood on public.programs(page_template) where page_template = 'girlhood';

create function public.preserve_girlhood_links() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if old.page_template = 'girlhood' and
     (tg_op = 'DELETE' or new.slug <> 'girlhood' or new.page_template <> 'girlhood'
      or (old.published and not new.published)) then
    raise exception 'Keep the canonical Girlhood program and receipt links available; close collection with the submissions setting';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function public.preserve_girlhood_links() from public,anon,authenticated;
create trigger preserve_girlhood_links before update or delete on public.programs
for each row execute function public.preserve_girlhood_links();

-- Strip younger participants' identity on insert AND update. Protect immutable
-- age/consent even from service-role mistakes, not just the browser column grants.
create function public.girlhood_guard_private_data() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if new.age is distinct from old.age or new.perspective is distinct from old.perspective then
      raise exception 'Participant age and perspective cannot be changed';
    end if;
    if old.withdrawn_at is not null and new.withdrawn_at is distinct from old.withdrawn_at then
      raise exception 'Withdrawal cannot be reversed';
    end if;
    if (new.consent_public and not old.consent_public)
       or (new.consent_display_name and not old.consent_display_name)
       or (new.consent_display_country and not old.consent_display_country)
       or (new.consent_display_city and not old.consent_display_city)
       or (new.consent_reuse and not old.consent_reuse)
       or (new.consent_analysis and not old.consent_analysis) then
      raise exception 'Moderation cannot grant participant consent';
    end if;
  end if;
  if new.age < 13 then
    new.display_name := null; new.country := null; new.city_region := null;
    new.public_display_name := null; new.public_country := null; new.public_city := null;
    new.consent_public := false; new.consent_reuse := false;
    new.consent_display_name := false; new.consent_display_country := false; new.consent_display_city := false;
    new.featured := false;
  end if;
  return new;
end;
$$;
revoke all on function public.girlhood_guard_private_data() from public,anon,authenticated;
create trigger girlhood_00_guard before insert or update on public.girlhood_submissions
for each row execute function public.girlhood_guard_private_data();
update public.girlhood_submissions set country=null, public_country=null where age<13;
commit;

