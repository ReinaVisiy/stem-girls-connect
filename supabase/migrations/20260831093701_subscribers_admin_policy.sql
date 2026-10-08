create policy "Admin manage" on subscribers for all using (is_admin()) with check (is_admin());
