-- Daily-cron-friendly RPC. Flips any `scheduled` post whose `scheduled_for`
-- is now-or-past into `published`. Idempotent and safe to call repeatedly.

create or replace function public.publish_due_blogs()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  affected int;
begin
  update public.blog_posts
  set status = 'published',
      published_at = coalesce(published_at, now())
  where status = 'scheduled'
    and scheduled_for is not null
    and scheduled_for <= now();

  GET DIAGNOSTICS affected = ROW_COUNT;
  return affected;
end;
$$;

revoke all on function public.publish_due_blogs() from public;
grant execute on function public.publish_due_blogs() to anon, authenticated;
