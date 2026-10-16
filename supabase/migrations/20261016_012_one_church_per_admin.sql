-- The product model permits one church for each administrative account.
alter table public.churches
  add constraint churches_admin_id_key unique (admin_id);
